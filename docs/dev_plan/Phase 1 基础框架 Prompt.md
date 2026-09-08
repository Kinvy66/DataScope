# DataScope Phase 1：基础框架

现在开始实施 DataScope Phase 1。

## 目标

建立可运行的 Electron + Vue 3 + TypeScript 桌面应用基础框架。

## 必须完成

### Electron

建立：

- Main Process
- Preload
- Renderer

### Vue

建立：

- App
- Router
- Pinia
- 基础 Layout

### 页面

创建：

- Dashboard
- Data Browser
- Live Monitor
- Signal Analysis
- Spectrum Analysis
- Marker Manager
- Data Generator
- Task Manager
- Log Viewer
- Project Settings
- Application Settings

暂时只需要完成页面框架，不实现具体业务。

### UI

建立：

- 顶部 Toolbar
- 左侧 Navigation
- 中央 Workspace
- 底部 Status Bar

要求支持：

- Light Theme
- Dark Theme

### IPC

建立基础 IPC 架构。

至少包含：

```text
app.getInfo()
settings.get()
settings.set()
log.write()
```

### 日志

建立基础 Logging Service。

支持：

DEBUG
INFO
WARNING
ERROR

## 验收

必须能够：

1. npm install
2. npm run dev
3. npm run build
4. 正常启动 Electron
5. 页面之间正常切换
6. Light/Dark 正常切换
7. Renderer 不直接访问 Node.js API

完成后执行 type check、lint 和 build。

不要实现 Phase 2 以后的业务功能。