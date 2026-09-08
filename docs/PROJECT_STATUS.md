# DataScope 开发进度

本文记录 **已合入当前分支的开发进度**。实现细节以源码为准；本文与代码不一致时，先改代码再回写本文。

| 项 | 值 |
| --- | --- |
| 更新日期 | 2026-09-08 |
| 分支 | `master` |
| 进度基准 | 以本文件所在 commit 为准 |
| 产品阶段 | V1.0 Clean（禁止故意注入缺陷） |
| 已完成 | Phase 1–6、8A：框架、工程、导入、波形、时域分析、频谱分析、离线数据发生器 |
| 建议下一阶段 | Marker 管理（数据模型已有，UI 未做） |

使用手册：[`docs/wiki/README.md`](./wiki/README.md)  
开发任务书：[`docs/dev_plan/README.md`](./dev_plan/README.md)

## 阶段总览

| 阶段 | 主题 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | 基础框架 | 已完成 | Electron + Vue 3 壳、布局、路由、主题、日志、应用图标 |
| 2 | 工程管理 | 已完成 | 新建 / 打开 / 保存 / 另存 / 关闭、未保存拦截、最近工程 |
| 3 | 数据导入 | 已完成 | CSV / TXT / JSON 解析、工程 `data/` 落地、数据集注册 |
| 4 | 波形可视化 | 已完成 | Canvas 多通道波形、viewport 降采样、光标、缩放平移 |
| 5 | 时域信号分析 | 已完成 | 通道/区间统计，结果写入 `analysis/*.json` |
| 6 | 频谱分析 | 已完成 | Radix-2 FFT、窗函数、幅度/功率谱、峰值频率、Canvas 频谱图 |
| 7 | Marker | 未开始 | Dataset / Project 含 `markers` 字段，无管理 UI |
| 8A | 数据发生器 | 已完成 | 离线合成波形并写入工程 JSON |
| 8B | 实时数据 / Virtual DAQ | 未开始 | `Live Monitor` 仍为占位页 |
| 9 | 任务系统 | 未开始 | `Task Manager` 占位 |
| 10 | 数据导出 | 未开始 | 工程目录有 `exports/`，无导出流程 |
| 11 | 设置系统 | 部分完成 | 主题与日志级别可用；无完整 i18n |
| 12 | 测试支持 / E2E | 部分完成 | 有 Vitest 单测与 fixtures；无 Playwright / Electron E2E |

占位页（`PhasePage.vue`，不算已实现）：实时监视、Marker 管理、任务管理。

信号处理中的 **数字滤波** 尚未开始，不要与已完成的 FFT 频谱混为一谈。

## 已完成能力

### Phase 1 基础框架

- 主进程窗口、`contextIsolation`、preload `window.datascope`
- 导航、工具栏、状态栏、深色/浅色 token
- 应用图标：`resources/icon.png`（窗口 / 顶栏 / favicon）
- 应用日志读写与日志查看页
- 全局错误提示、关闭时未保存确认

### Phase 2 工程管理

- 工程目录：`project.json`、`data/`、`exports/`、`analysis/`、`logs/`
- 新建、打开、保存、另存、关闭、最近工程、工程设置（名称 / 描述 / 采样率）
- 脏标记与退出拦截

### Phase 3 数据导入

- 格式：CSV / TXT（表头 `timestamp,ch1,...`）、JSON 行主序或通道主序
- 校验：空文件、缺表头、列不一致、非数字、NaN/Infinity、非法时间戳、中文路径等
- 数据浏览：列表、搜索、重命名、删除、通道统计

### Phase 4 波形可视化

- 路径：`Dataset → Viewport → Min-Max Downsampling → Canvas`
- 通道显隐 / 重排、lane 预设、缩放、平移、Fit All、Auto Scale
- Cursor A / B 与时间、幅值、差值读数
- 渲染进程不拉取完整 `samples`

### Phase 5 时域信号分析

- 页面：`SignalAnalysisView` + `useAnalysisStore`
- 指标：Min / Max / Mean / Median / RMS / StdDev / Peak-Peak
- 主进程 `dataset:analyze` → `analyzeTimeDomain` → `analysis/*.json`

### Phase 6 频谱分析

- 算法：`src/shared/algorithms/fft.ts`
- IPC `dataset:analyzeSpectrum`；`SpectrumAnalysisView` + `SpectrumPlot`

### Phase 8A 数据发生器

- 算法：`src/shared/generators/waveform.ts`
- 波形：正弦 / 方波 / 三角 / 直流 / 噪声 / 多频叠加
- IPC `dataset:generate`，结果写入 `data/*.json` 并进入 Dataset 列表
- 单测：`tests/generators/waveform.spec.ts`（含生成正弦再 FFT 找回频率）

## 测试与验证

已有单测：

- `tests/parsers/import.spec.ts`
- `tests/datasets/query.spec.ts`
- `tests/algorithms/downsample.spec.ts`
- `tests/algorithms/statistics.spec.ts`
- `tests/algorithms/fft.spec.ts`
- `tests/analysis/timeDomain.spec.ts`
- `tests/analysis/spectrum.spec.ts`
- `tests/generators/waveform.spec.ts`

fixtures：`tests/fixtures/csv/*`、`tests/fixtures/json/normal.json`；示例数据：`samples/`。

阶段结束后应实际执行：

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 建议下一阶段

**Marker 管理**：在已有 `Dataset.markers` 上提供添加、编辑、删除、与波形跳转。不要顺手做实时采集或导出。

数字滤波可作为独立增量。

## 维护规则

1. 每完成一个可验收增量，在 **同一 commit** 中更新本文（日期、阶段表、测试列表、下一阶段）。
2. 不要把未合入的本地草稿写成「已完成」。
3. 不要在 V1.0 Clean 阶段把 Bug Injection 记成正式进度。
