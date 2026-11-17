# BananaConnect

把 Minecraft 局域网世界分享给外网朋友的联机工具。传输层使用 [EasyTier](https://github.com/EasyTier/EasyTier)（P2P 打洞，失败时走公益节点中转），客户端自己负责局域网广播中继，让世界直接出现在游戏的「多人游戏」列表里。

当前版本 `0.1.0`，处于预览阶段：**窗口、内核探测、EasyTier 房间进程管理已接入；玩家列表与流量指标仍使用模拟数据。**

## 开发

环境要求：Node.js 20+、Rust 1.77+（Windows 需要 MSVC 链接器）。

```powershell
npm install
npm run dev        # 浏览器预览（mock 数据，不需要 Rust）
npm run app        # 桌面外壳（Tauri，自动拉起 vite）
npm run build      # 类型检查 + 前端打包
```

`npm run app` / `npm run app:build` 通过 `scripts/tauri.mjs` 启动，会把 `RUSTUP_HOME`、`CARGO_HOME`、`LOCALAPPDATA`、`TEMP` 指到项目内的 `.toolchain/`、`.cache/`，不写系统盘。需要本机已放置便携 Rust 工具链，或自行把 `rustc`、`cargo` 加到 PATH。

## EasyTier 资源（不在仓库里）

仓库不包含约 35 MB 的传输层二进制。手动下载 EasyTier Windows x64 发行包，解压到：

```
src-tauri/resources/easytier/
├─ easytier-core.exe      必需
├─ easytier-cli.exe
├─ wintun.dll             虚拟网卡驱动
├─ Packet.dll
└─ WinDivert64.sys
```

缺少这些文件时，界面状态栏会显示「内核缺失」，房间功能不可用。

## 打包

```powershell
node scripts/tauri.mjs build --no-bundle   # 产出 src-tauri/target/release/banana-connect.exe
powershell -File scripts/package.ps1       # 便携包：dist-portable/BananaConnect-0.1.0-win-x64.zip
```

便携包包含 exe、EasyTier 资源与 README；首次创建房间需要管理员权限安装虚拟网卡。

## 目录

```
src/
├─ bridge/     前端与内核的接口层（浏览器下使用 mock.ts）
├─ components/ 标题栏、侧边栏、状态栏、通用 UI
├─ pages/      联机 / 主机 / 日志 / 设置
├─ store/      zustand：应用状态、日志环形缓冲、轻提示
├─ styles/     tokens + 基础/组件/页面样式
├─ lib/        颜色推导、时间格式化、剪贴板
└─ types/      前后端共享类型
src-tauri/
├─ src/room.rs        EasyTier 进程与房间生命周期
├─ src/commands.rs    内核探测、窗口控制
└─ resources/         EasyTier 二进制（需手动放置）
scripts/
├─ tauri.mjs          便携工具链启动器
├─ make-icon.ps1      生成应用图标
└─ package.ps1        便携包打包
```

## 已知限制

- 首次使用需要管理员权限安装 WinTun 虚拟网卡。
- 公益共享节点由社区提供，可能限速或不可用。
- 双方都需要安装客户端。
- 离线联机需要在房主侧关闭正版验证（例如 mcwifipnp），不属于本工具职责。
- 玩家列表、流量指标尚未接入真实数据。

## 许可

传输层 EasyTier 使用 Apache-2.0 许可，分发时需保留其许可证与 NOTICE。本项目不包含任何 Mojang / Microsoft 素材，与 Mojang、Microsoft 无关。
