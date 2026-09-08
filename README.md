# DataScope

DataScope 是一个用于软件测试学习的多通道时序数据桌面软件。当前版本覆盖 Phase 1–8B 与 5B：基础框架、工程管理、数据导入、波形可视化、时域分析、数字滤波、频谱分析、Marker、离线发生器、Virtual DAQ / 实时监视。

使用手册（中文，含阶段标注）：[`docs/wiki/README.md`](docs/wiki/README.md)

开发计划：[`docs/dev_plan/README.md`](docs/dev_plan/README.md)

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

第一列也可以是 `YYYY-MM-DD HH:mm:ss.frac` 日期时间（例如 `samples/perg-ioba-0001.csv`）。

JSON 支持行主序 `[timestamp, ch1, ...]` 或通道主序 `samples[channel][sample]`。

## 架构

- Renderer：UI、页面状态、波形绘制
- Main：文件系统、工程、导入、分析、日志、Virtual DAQ
- Preload：通过 `window.datascope` 暴露 IPC，Renderer 不直接访问 Node.js API

波形路径：`Dataset → Viewport → Min-Max Downsampling → Canvas`

分析路径：`Dataset → 通道/区间选择 → Time-domain Statistics / FFT Spectrum → analysis/*.json`

滤波路径：`Dataset → 通道选择 → IIR / 去直流 → data/*.json → Dataset 列表`

发生器路径：`参数 → 合成波形 → data/*.json → Dataset 列表`

Marker 路径：`表单 / Cursor → shared/markers → project.json → 波形竖线`

实时路径：`Virtual DAQ → Packet/CRC → 环形缓冲 → Viewport → Canvas`（停止后可写入 `data/*.json`）
