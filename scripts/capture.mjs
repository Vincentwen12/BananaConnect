import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9333;
const BASE = "http://localhost:1420";
const root = process.cwd();
const assets = path.join(root, "site", "assets");
const framesDir = path.join(root, ".cache", "frames");
mkdirSync(assets, { recursive: true });
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const edge = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.join(root, ".cache", "edge-cdp")}`,
    "--window-size=1280,820",
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function devtoolsTarget() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      if (response.ok) {
        const list = await response.json();
        const page = list.find((item) => item.type === "page");
        if (page) return page;
      }
    } catch {
      // keep waiting
    }
    await sleep(250);
  }
  throw new Error("Edge devtools not ready");
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.handlers = new Map();
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      } else {
        const handler = this.handlers.get(message.method);
        if (handler) handler(message.params);
      }
    };
  }
  send(method, params = {}) {
    const id = ++this.nextId;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, handler) {
    this.handlers.set(method, handler);
  }
}

const target = await devtoolsTarget();
const cdp = new CDP(target.webSocketDebuggerUrl);
await cdp.open();
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");

const viewport = (scale) =>
  cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 820,
    deviceScaleFactor: scale,
    mobile: false,
  });

async function still(url, wait, name) {
  await viewport(3);
  await cdp.send("Page.navigate", { url });
  await sleep(wait);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(path.join(assets, name), Buffer.from(data, "base64"));
  console.log("still", name);
}

await still(`${BASE}/#/home`, 4200, "home.png");
await still(`${BASE}/?demo=room#/home`, 5200, "room.png");
await still(`${BASE}/?demo=tunnel#/host`, 3600, "host.png");
await still(`${BASE}/#/logs`, 2200, "logs.png");
await still(`${BASE}/#/settings`, 2200, "settings.png");

// ---- GIF frames -------------------------------------------------------------
await viewport(1);
await cdp.send("Page.navigate", { url: `${BASE}/?demo=room#/home` });
await sleep(5000);

const frames = [];
let recording = true;
const loop = (async () => {
  while (recording) {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    frames.push(data);
    await sleep(110);
  }
})();

const clickNav = (label) =>
  `(() => { const b = [...document.querySelectorAll('.nav-item')].find((x) => x.textContent.trim() === '${label}'); if (b) { b.click(); return true; } return false; })()`;

await sleep(1400);
await cdp.send("Runtime.evaluate", { expression: clickNav("涓绘満") });
await sleep(1800);
await cdp.send("Runtime.evaluate", { expression: clickNav("鏃ュ織") });
await sleep(1500);
await cdp.send("Runtime.evaluate", { expression: clickNav("璁剧疆") });
await sleep(1500);
await cdp.send("Runtime.evaluate", { expression: clickNav("鑱旀満") });
await sleep(900);
recording = false;
await loop;

frames.forEach((data, index) => {
  writeFileSync(path.join(framesDir, `${String(index).padStart(4, "0")}.png`), Buffer.from(data, "base64"));
});
console.log("frames", frames.length);

cdp.ws.close();
edge.kill();

