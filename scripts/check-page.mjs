import { spawn } from "node:child_process";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9344;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const root = process.cwd();

const edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${root}/.cache/edge-check`, "about:blank"], { stdio: "ignore" });

let target = null;
for (let i = 0; i < 60; i += 1) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
    if (target) break;
  } catch {}
  await sleep(250);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(m.error) : p.res(m.result); }
  else if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.text);
  else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value).join(" "));
};
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res, rej) => pending.set(i, { res, rej })); };

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 4400, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "file:///D:/BananaConect/site/index.html" });
await sleep(3000);
const result = await send("Runtime.evaluate", {
  expression: `({
    reveals: document.querySelectorAll('.reveal').length,
    revealed: document.querySelectorAll('.reveal.in').length,
    gif: !!document.getElementById('gif'),
    gifReplay: !!document.getElementById('gifReplay'),
    frames: document.querySelectorAll('#frames img').length,
    active: document.querySelector('#frames img.on')?.src,
    bodyHeight: document.body.scrollHeight
  })`,
  returnByValue: true,
});
console.log(JSON.stringify(result.result.value, null, 2));
console.log("errors:", errors);
ws.close();
edge.kill();
