# DataScope 开发进度

本文记录 **已合入当前分支的开发进度**。实现细节以源码为准；本文与代码不一致时，先改代码再回写本文。

| 项 | 值 |
| --- | --- |
| 更新日期 | 2026-09-08 |
| 分支 | `master` |
| 进度基准 | 以本文件所在 commit 为准 |
| 产品阶段 | V1.0 Clean（禁止故意注入缺陷） |
| 已完成 | Phase 1–11 + 5B：框架、工程、导入、波形、时域分析、数字滤波、频谱分析、Marker、离线发生器、Virtual DAQ / 实时监视、任务系统、数据导出、应用设置与界面中英切换 |
| 建议下一阶段 | E2E 测试（12） |

使用手册：[`docs/wiki/README.md`](./wiki/README.md)  
开发任务书：[`docs/dev_plan/README.md`](./dev_plan/README.md)

## 阶段总览

| 阶段 | 主题 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | 基础框架 | 已完成 | Electron + Vue 3 壳、布局、路由、主题、日志、应用图标、操作按钮图标 |
| 2 | 工程管理 | 已完成 | 新建 / 打开 / 保存 / 另存 / 关闭、未保存拦截、最近工程 |
| 3 | 数据导入 | 已完成 | CSV / TXT / JSON 解析（含日期时间戳）、工程 `data/` 落地、数据集注册 |
| 4 | 波形可视化 | 已完成 | Canvas 多通道波形、viewport 降采样、光标、缩放平移、Marker 叠加 |
| 5 | 时域信号分析 | 已完成 | 通道/区间统计，结果写入 `analysis/*.json` |
| 5B | 数字滤波 | 已完成 | 去直流 / 低通 / 高通 / 带通 / 陷波，结果写入新数据集 |
| 6 | 频谱分析 | 已完成 | Radix-2 FFT、窗函数、幅度/功率谱、峰值频率、Canvas 频谱图 |
| 7 | Marker | 已完成 | 添加 / 编辑 / 删除，写入 `project.json`，与波形跳转联动 |
| 8A | 数据发生器 | 已完成 | 离线合成波形并写入工程 JSON |
| 8B | 实时数据 / Virtual DAQ | 已完成 | 状态机、进程内组包校验、环形缓冲、Live 波形、停止后写入工程 |
| 9 | 任务系统 | 已完成 | 导入 / 生成 / 滤波 / 时域 / 频谱 / 导出进入任务列表；暂停、继续、取消、重试 |
| 10 | 数据导出 | 已完成 | CSV / TXT / JSON 写入 `exports/`，走任务系统；无私有二进制 |
| 11 | 设置系统 | 已完成 | 语言、主题、日志级别、自动保存、数据默认值、波形视口缓存；界面走 i18n |
| 12 | 测试支持 / E2E | 部分完成 | 有 Vitest 单测与 fixtures；无 Playwright / Electron E2E |

当前导航页均已落地业务。DataScope 私有二进制导出尚未做。

## 已完成能力

### Phase 1 基础框架

- 主进程窗口、`contextIsolation`、preload `window.datascope`
- 导航、工具栏、状态栏、深色/浅色 token
- 导航、工具栏与主要操作按钮使用内置 SVG 线框图标；顶栏不重复侧栏页面入口，保持单行
- 应用图标：`resources/icon.png`（窗口 / 顶栏 / favicon）
- 应用日志读写与日志查看页
- 全局错误提示、关闭时未保存确认

### Phase 2 工程管理

- 工程目录：`project.json`、`data/`、`exports/`、`analysis/`、`logs/`
- 新建、打开、保存、另存、关闭、最近工程、工程设置（名称 / 描述 / 采样率）
- 脏标记与退出拦截

### Phase 3 数据导入

- 格式：CSV / TXT（表头 `timestamp,ch1,...` 或 `TIME_1,RE_1,...`）、JSON 行主序或通道主序
- 时间戳：数字秒，或 `YYYY-MM-DD HH:mm:ss.frac` 日期时间（用于 PERG 等生理信号 CSV）
- 校验：空文件、缺表头、列不一致、非数字、NaN/Infinity、非法时间戳、中文路径等
- 数据浏览：列表、搜索、重命名、删除、通道统计
- 本地研究数据目录 `dataset/` 默认不入库（体积大）；可导入的 PERG 样例见 `samples/perg-ioba-0001.csv`

### Phase 4 波形可视化

- 路径：`Dataset → Viewport → Min-Max Downsampling → Canvas`
- 通道显隐 / 重排、lane 预设、缩放、平移、Fit All、Auto Scale
- Cursor A / B 与时间、幅值、差值读数
- Marker 竖线叠加；可从 Cursor A 添加；列表点击跳转
- 渲染进程不拉取完整 `samples`

### Phase 5 时域信号分析

- 页面：`SignalAnalysisView` + `useAnalysisStore`
- 指标：Min / Max / Mean / Median / RMS / StdDev / Peak-Peak
- 主进程 `dataset:analyze` → `analyzeTimeDomain` → `analysis/*.json`

### Phase 5B 数字滤波

- 算法：`src/shared/algorithms/filter.ts`（去直流；二阶 Butterworth 低/高/带通；IIR 陷波）
- 业务：`applyFilterToDataset`；IPC `dataset:filter`；结果写入 `data/*.json` 并进入 Dataset 列表
- 页面：信号分析页的滤波区 + `useFilterStore`
- 单测：`tests/algorithms/filter.spec.ts`、`tests/filters/apply.spec.ts`

### Phase 6 频谱分析

- 算法：`src/shared/algorithms/fft.ts`
- IPC `dataset:analyzeSpectrum`；`SpectrumAnalysisView` + `SpectrumPlot`

### Phase 7 Marker 管理

- 算法：`src/shared/markers/manage.ts`（校验采样点、时间换算、排序、project.json 往返）
- IPC `dataset:addMarker` / `updateMarker` / `removeMarker`，持久化到 `project.json`
- 页面：`MarkerManagerView`；波形与数据浏览可跳转 / 添加
- 单测：`tests/markers/manage.spec.ts`

### Phase 8A 数据发生器

- 算法：`src/shared/generators/waveform.ts`
- 波形：正弦 / 方波 / 三角 / 直流 / 噪声 / 多频叠加
- IPC `dataset:generate`，结果写入 `data/*.json` 并进入 Dataset 列表
- 单测：`tests/generators/waveform.spec.ts`（含生成正弦再 FFT 找回频率）

### Phase 8B Virtual DAQ / 实时监视

- 状态机：`Disconnected → Connected → Ready → Running ⇄ Paused → Stopped`，非法转换拒绝；`Error` 可复位
- 数据流：Virtual DAQ → 二进制数据包（CRC）→ 校验 → 环形缓冲 → 降采样 Canvas / 停止后写入工程
- 传输：进程内回环，不是真实 TCP/UDP 网口，也不是真实采集卡
- IPC `live:*`；页面 `LiveMonitorView`；底栏显示 DAQ 状态
- 单测：`tests/live/*.spec.ts`

### Phase 9 任务系统

- 状态机：`Pending → Running ⇄ Paused → Completed / Failed / Cancelled`，非法命令拒绝；失败 / 取消 / 完成后可 Retry
- 协作式检查点：导入（读/解析/写入）、生成与滤波（按通道）、时域 / 频谱（按通道）
- 主进程 `taskService`；IPC `task:list` / `task:get` / `task:command` / `task:clearFinished` / 事件 `task:updated`
- 页面 `TaskManagerView`：进度、耗时、错误、暂停 / 继续 / 取消 / 重试；底栏显示运行中任务数
- 会话内有效，不写磁盘；关闭工程会取消进行中的任务
- 单测：`tests/tasks/*.spec.ts`

### Phase 10 数据导出

- 格式：CSV（逗号）、TXT（制表符）、JSON（行主序 `[timestamp, ch…]`），可再导入
- 可选通道与采样区间；写入工程 `exports/`，重名自动加序号
- 走 `taskService`（`kind: export`），协作检查点与临时文件，取消时删除 `.tmp`
- 磁盘满 / 权限 / 路径错误映射为 `FILE_DISK_FULL` / `FILE_PERMISSION` / `FILE_NOT_FOUND`
- 页面 `ExportView`；数据浏览与工作台可进入
- 单测：`tests/exporters/serialize.spec.ts`（含 CSV/TXT/JSON 往返解析）

### Phase 11 设置与国际化

- 应用设置：语言（zh-CN / en-US）、主题、日志级别、自动保存间隔、默认采样率 / 通道数 / 导出格式、波形视口 LRU 缓存条目数
- 行为：新建工程使用默认采样率；发生器与 Virtual DAQ 表单、导出格式在启动和改默认值时同步；自动保存只写已打开的脏工程；视口缓存命中后不再重复降采样
- 界面文案：`src/shared/i18n` 词典 + `translate()`，无 vue-i18n 依赖；切换语言立即更新导航、工具栏、状态栏和各业务页
- 主进程 `DataScopeError`、任务进度说明、滤波结果文件名仍为中文（写入磁盘 / IPC 的技术字符串）
- 单测：`tests/settings/validate.spec.ts`、`tests/i18n/translate.spec.ts`、`tests/datasets/lruCache.spec.ts`

## 测试与验证

已有单测：

- `tests/parsers/import.spec.ts`
- `tests/datasets/query.spec.ts`
- `tests/algorithms/downsample.spec.ts`
- `tests/algorithms/statistics.spec.ts`
- `tests/algorithms/fft.spec.ts`
- `tests/analysis/timeDomain.spec.ts`
- `tests/analysis/spectrum.spec.ts`
- `tests/algorithms/filter.spec.ts`
- `tests/filters/apply.spec.ts`
- `tests/generators/waveform.spec.ts`
- `tests/markers/manage.spec.ts`
- `tests/live/stateMachine.spec.ts`
- `tests/live/packet.spec.ts`
- `tests/live/buffer.spec.ts`
- `tests/live/config.spec.ts`
- `tests/tasks/stateMachine.spec.ts`
- `tests/tasks/model.spec.ts`
- `tests/tasks/gate.spec.ts`
- `tests/exporters/serialize.spec.ts`
- `tests/settings/validate.spec.ts`
- `tests/i18n/translate.spec.ts`
- `tests/datasets/lruCache.spec.ts`

fixtures：`tests/fixtures/csv/*`、`tests/fixtures/json/normal.json`；示例数据：`samples/`（含 `perg-ioba-0001.csv`）。

阶段结束后应实际执行：

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 建议下一阶段

按功能依赖，下一步做 **E2E 测试资产**（Playwright / Electron 冒烟）。主进程错误文案的 i18n 可以后补。不要把 Playwright 和故障注入绑在一次提交里。故障注入留给 testing-lab。

## 维护规则

1. 每完成一个可验收增量，在 **同一 commit** 中更新本文（日期、阶段表、测试列表、下一阶段）。
2. 不要把未合入的本地草稿写成「已完成」。
3. 不要在 V1.0 Clean 阶段把 Bug Injection 记成正式进度。
