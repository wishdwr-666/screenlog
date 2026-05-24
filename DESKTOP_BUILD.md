# ScreenLog 桌面客户端 — 构建指南

## 环境要求

| 工具 | 版本要求 | 安装方式 |
|------|----------|----------|
| Rust + Cargo | 1.77+ | https://rustup.rs |
| Tauri CLI | 2.0+ | `cargo install tauri-cli` |
| Bun | 1.0+ | https://bun.sh |
| Windows SDK | 10.0+ | Visual Studio 安装器勾选 |

## 本地开发

```bash
# 1. 安装前端依赖
bun install

# 2. 启动开发模式（热重载，真实系统采集）
cargo tauri dev
```

## 打包发布

```bash
# Windows 安装包（.msi + 便携 .exe）
cargo tauri build

# 产物路径：
# src-tauri/target/release/bundle/msi/ScreenLog_0.1.0_x64_en-US.msi
# src-tauri/target/release/bundle/nsis/ScreenLog_0.1.0_x64-setup.exe
```

## 项目结构

```
screenlog/
├── src/                          ← React/Next.js 前端（UI 层）
│   ├── app/                      ← Next.js App Router 页面
│   ├── components/
│   │   ├── screens/              ← 各功能页面组件
│   │   ├── layout/               ← 侧边栏、底部导航
│   │   ├── environment/          ← 动态效果（夜间/雨滴）
│   │   └── wallpaper/            ← 壁纸系统
│   └── lib/
│       └── tauri-bridge.ts       ← ★ 数据入口（Tauri/浏览器双模式）
│
└── src-tauri/                    ← Rust 后端（系统采集层）
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
        ├── main.rs               ← 入口 + 托盘 + 采集主循环
        ├── tracker.rs            ← 前台应用检测（Windows/macOS/Linux）
        ├── idle.rs               ← 空闲检测 + 电源状态
        ├── database.rs           ← SQLite 读写（本地 AppData）
        ├── commands.rs           ← IPC 命令（暴露给前端调用）
        └── achievements.rs       ← 成就解锁逻辑
```

## 数据存储位置

- **Windows**: `%APPDATA%\ScreenLog\data.db`
- **macOS**: `~/Library/Application Support/ScreenLog/data.db`

## 扩展 macOS 支持

macOS 额外步骤：
1. Xcode + Command Line Tools
2. `cargo tauri build --target aarch64-apple-darwin`（Apple Silicon）
3. 首次运行需用户在"系统设置 → 隐私与安全 → 辅助功能"授权

## 注意事项

- 手机端（iOS/Android）系统级隔离，第三方 App 无法读取其他 App 使用情况，这是系统限制，无解
- Windows 需要管理员权限才能读取某些系统进程信息（如任务管理器）
- 杀毒软件可能误报进程读取行为，需要添加白名单
