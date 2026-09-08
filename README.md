# DataScope

DataScope 是一个用于软件测试学习的多通道时序数据桌面软件。当前版本覆盖 Phase 1–12 与 5B，并支持 DataScope Binary（`.dsb`）导出与再导入。

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
- Playwright（Electron 冒烟，不下载 Chromium）

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
npm run test:e2e
```

`npm run test:e2e` 会先构建再启动打包后的 Electron 窗口，走一遍：新建工程 → 导入 `test-data/normal/normal.csv` → 波形 → 时域分析 → 导出 → 保存关闭 → 再打开。安装包级 E2E 尚未覆盖。分类测试文件见 `test-data/`。

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

DataScope Binary（`.dsb`）是带 CRC 的小端 Float64 通道主序文件，可从「数据导出」写出后再导入。

## 架构

- Renderer：UI、页面状态、波形绘制
- Main：文件系统、工程、导入、导出、分析、日志、Virtual DAQ、后台任务
- Preload：通过 `window.datascope` 暴露 IPC，Renderer 不直接访问 Node.js API

波形路径：`Dataset → Viewport → Min-Max Downsampling → Canvas`

分析路径：`Dataset → 通道/区间选择 → Time-domain Statistics / FFT Spectrum → analysis/*.json`

滤波路径：`Dataset → 通道选择 → IIR / 去直流 → data/*.json → Dataset 列表`

发生器路径：`参数 → 合成波形 → data/*.json → Dataset 列表`

Marker 路径：`表单 / Cursor → shared/markers → project.json → 波形竖线`

实时路径：`Virtual DAQ → Packet/CRC → 环形缓冲 → Viewport → Canvas`（停止后可写入 `data/*.json`）

任务路径：`导入 / 生成 / 滤波 / 分析 / 导出 → TaskService（可暂停 / 取消 / 重试）→ 任务管理页`

导出路径：`Dataset → 通道/区间 → CSV / TXT / JSON / DSB → exports/`

设置路径：`应用设置 → settings.json`；语言走 `src/shared/i18n`；波形视口可 LRU 缓存降采样结果
