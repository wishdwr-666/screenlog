# ScreenLog - Quiet Observer

一个纯本地的电脑使用时间观察工具，不设目标、不弹提醒、不评判。

## 功能特点

- **📊 今日概览**：活跃时长、切换次数、冷幽默式文案总结
- **🗺️ 热力图**：近14天使用情况可视化
- **⏱️ 时间线叙事**：按时间顺序展示应用使用历史
- **🏆 成就徽章墙**：基于行为解锁的趣味徽章
- **🎨 自定义壁纸**：本地存储的壁纸管理
- **⚙️ 灵活设置**：空闲阈值、深夜关怀模式

## 技术架构

- **前端**：Next.js 16 + React 19 + TypeScript
- **桌面**：Tauri 2（Rust 后端）
- **样式**：Tailwind CSS + shadcn/ui
- **动画**：Framer Motion
- **数据**：本地优先 + 云端可选

## 快速开始

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器（浏览器预览）
npm run dev
```

### 桌面应用

```bash
# 安装 Tauri CLI
npm install -g @tauri-apps/cli

# 开发桌面应用
npm run tauri dev
```

## 项目结构

```
src/
├── app/              # Next.js 路由和页面
├── components/
│   ├── screens/     # 主要功能页面
│   ├── ui/          # UI 组件库
│   └── layout/      # 布局组件
└── lib/
    ├── db/          # 数据库配置
    ├── api/         # API 路由
    └── tauri-bridge.ts  # Tauri 桥接层

src-tauri/
└── src/
    ├── main.rs      # 入口
    ├── tracker.rs   # 应用监控
    ├── database.rs  # 数据存储
    └── commands.rs  # IPC 命令
```

## 数据存储

所有数据默认存储在本地：

- **SQLite**：应用使用记录、成就解锁
- **localStorage**：壁纸设置、界面偏好

可选配置 PostgreSQL 进行云端同步。

## 设计理念

- **无评判**：不记录你在做什么应用，只记录时长
- **无目标**：不设每日/每周目标，不推送提醒
- **本地优先**：数据存储在本地，保护隐私
- **冷幽默**：用轻松的方式呈现数据

## License

MIT
