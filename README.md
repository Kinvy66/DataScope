# DataScope

DataScope 是一个用于软件测试学习的多通道时序数据桌面软件。当前版本覆盖 Phase 1–6：基础框架、工程管理、数据导入、波形可视化、时域信号分析、频谱分析。

## 技术栈

- Electron
- Vue 3
- TypeScript（strict）
- Vite / electron-vite
- Pinia
- Vue Router
- Vitest

## 开发

```bash
npm install
npm run dev
```

## 验证

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 工程目录

```text
Project/
├── project.json
├── data/
├── exports/
├── analysis/
└── logs/
```

## 导入格式

CSV / TXT 需要表头：

```text
timestamp,ch1,ch2,ch3
0.000,1.2,2.3,3.4
0.001,1.3,2.2,3.5
```

JSON 支持行主序 `[timestamp, ch1, ...]` 或通道主序 `samples[channel][sample]`。

## 架构

- Renderer：UI、页面状态、波形绘制
- Main：文件系统、工程、导入、分析、日志
- Preload：通过 `window.datascope` 暴露 IPC，Renderer 不直接访问 Node.js API

波形路径：`Dataset → Viewport → Min-Max Downsampling → Canvas`

分析路径：`Dataset → 通道/区间选择 → Time-domain Statistics / FFT Spectrum → analysis/*.json`
