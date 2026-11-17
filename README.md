# BananaConnect

把 Minecraft 局域网世界分享给外网朋友的联机工具。当前阶段：**UI 预览版**（内核未接入，数据为模拟）。

## 开发

```powershell
npm install
npm run dev        # 浏览器预览 http://localhost:1420
npm run build      # 类型检查 + 打包前端
npm run app        # 启动桌面外壳（Tauri，自动拉起 vite）
npm run app:build  # 打安装包（NSIS / MSI 等）
```

工具链全部走项目内便携目录（`.toolchain/`、`.cache/`），由 `scripts/tauri.mjs` 设置环境变量，不会写系统盘。

## 目录

```
src/
├─ bridge/     内核接口层（现在 mock.ts，接内核时替换 index.ts 的实现）
├─ components/ 标题栏、侧边栏、状态栏与通用 UI 组件
├─ pages/      联机 / 主机 / 日志 / 设置
├─ store/      zustand：应用状态、日志环形缓冲、轻提示
├─ styles/     tokens（主题色） + 基础样式 + 组件样式 + 页面样式
├─ lib/        颜色推导、时间格式化、剪贴板
└─ types/      前后端共享类型
```

## 约定

- 主题色只有一个来源 `--accent`，设置页换色后由 `lib/color.ts` 推导整套 token。
- 黄底一律用深色字（`--on-accent`），不要在白底上用黄色写字。
- 日志固定 2000 条环形缓冲。
- 写文件只落在项目目录内；工具链缓存在 `.toolchain/`、`.cache/`（已排除于构建与热更新监听）。
