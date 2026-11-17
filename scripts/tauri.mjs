/**
 * 以「项目内便携工具链」启动 Tauri CLI：
 * Rust / cargo / 打包器缓存全部落在 D:\BananaConect 下，不写系统盘。
 *
 * 用法：node scripts/tauri.mjs dev | build | icon ...
 */
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const cache = path.join(root, ".cache");
const tmp = path.join(cache, "tmp");
const toolchainHome = path.join(root, ".toolchain");

mkdirSync(tmp, { recursive: true });
mkdirSync(path.join(cache, "localappdata"), { recursive: true });

// rustup 只装了 toolchain、没有装 shim，这里直接定位到 toolchain 的 bin。
let toolchainBin = "";
try {
  const toolchains = readdirSync(path.join(toolchainHome, "rustup", "toolchains")).sort();
  if (toolchains.length) {
    toolchainBin = path.join(toolchainHome, "rustup", "toolchains", toolchains[0], "bin");
  }
} catch {
  // 工具链还没装好时忽略，让 cargo 的报错信息直接暴露出来
}

const env = { ...process.env };
env.RUSTUP_HOME = path.join(toolchainHome, "rustup");
env.CARGO_HOME = path.join(toolchainHome, "cargo");
env.LOCALAPPDATA = path.join(cache, "localappdata");
env.TEMP = tmp;
env.TMP = tmp;
env.CARGO_TARGET_DIR = path.join(root, "src-tauri", "target");

// Windows 的环境变量名大小写不敏感，直接塞一个 PATH 会和原有的 Path 冲突，
// 这里沿用已有键名再追加工具链目录。
const pathKey =
  Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
env[pathKey] = [path.join(toolchainHome, "cargo", "bin"), toolchainBin, env[pathKey] ?? ""]
  .filter(Boolean)
  .join(";");

const args = process.argv.slice(2);
const bin = path.join(root, "node_modules", ".bin", "tauri.cmd");

const child = spawn(bin, args, {
  cwd: root,
  env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
