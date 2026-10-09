# Windows 运行 / 打包说明

本仓库在 Windows 上从源码运行或打包时，有几个环境相关的坑，记录如下。

## 一、结论（本次产出的成品）

- 免安装成品：`C:\壹印`（双击 `壹印.exe`，桌面已建快捷方式）
- 源码改动见仓库根目录的 `changes.diff`

## 二、依赖安装

```powershell
# 仓库原本用 yarn；用 pnpm 时必须用 hoisted 布局，否则 electron-builder 收集不到传递依赖
pnpm install --node-linker=hoisted
```

两个原生二进制需要从 GitHub Releases 下载，网络不通时手工放置：

| 组件 | 放置位置 | 来源 |
| --- | --- | --- |
| Electron 24.8.8 | `node_modules/electron/dist/`（解压后），并写入 `node_modules/electron/path.txt` 内容 `electron.exe` | `https://registry.npmmirror.com/-/binary/electron/24.8.8/electron-v24.8.8-win32-x64.zip` |
| sharp | `node_modules/sharp/`（解压后为 `build/Release/*`） | 见下方说明 |

**sharp 版本已从 `0.32.6` 升到 `0.33.5`**：0.32.6 的 Windows 预编译包（GitHub Releases）在本机下载后无法加载（`Cannot find module '../build/Release/sharp-win32-x64.node'` 或依赖缺失）；
0.33.x 的原生二进制改为随 npm 包分发（`@img/sharp-win32-x64`），只依赖 npm registry，安装更可靠。
整条图片流水线已用端到端脚本在 0.33.5 上验证通过。

## 三、打包

```powershell
# 1) 构建前端 + 主进程 + preload，并把 exiftool 放进 dist-electron
node node_modules/vite/bin/vite.js build

# 2) 免安装目录（dist/win-unpacked）
$env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://registry.npmmirror.com/-/binary/electron-builder-binaries/'
node node_modules/electron-builder/out/cli/cli.js --dir --win `
  "--config.electronDownload.mirror=https://registry.npmmirror.com/-/binary/electron/" `
  "--config.win.signAndEditExecutable=false"
```

说明：

- `electronDownload.mirror`、`ELECTRON_BUILDER_BINARIES_MIRROR` 用于走国内镜像，避免 GitHub 直连失败。
- `signAndEditExecutable=false` 跳过 winCodeSign（修改 exe 图标/版本信息、签名），否则该步骤会因工具链问题失败；跳过不影响运行，exe 名仍是 `壹印.exe`。
- NSIS 安装包（`--win nsis`）在本机未成功，免安装目录已够用。

## 四、运行时的两个坑

1. **不要放在 DeepSeek Harness 的工作目录里运行**（例如 `C:\Users\admin\Documents\deepseek-harness\...`）。
   该目录被 Harness 加了沙箱 ACL，Chromium/Electron 在其中启动会直接崩溃
   （`0xc0000005` / `EXCEPTION_BREAKPOINT`，任何 Electron 版本都一样）。
   放到 `C:\壹印`、桌面等普通目录即可正常启动。
2. **`ELECTRON_RUN_AS_NODE`**：从 DeepSeek Harness 打开的终端启动时，该环境变量会让 Electron 退化成纯 Node 运行，表现为：
   `Cannot find module 'electron'` 或进程秒退。
   用 `start-yiyin.cmd` 启动（它会先清掉该变量），或在命令行先执行 `set ELECTRON_RUN_AS_NODE=`。
   资源管理器里直接双击 exe 不受影响。
