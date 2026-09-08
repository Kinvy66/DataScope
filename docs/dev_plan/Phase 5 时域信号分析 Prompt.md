# DataScope Phase 5：时域信号分析

在已有 Dataset 上实现离线时域统计。滤波不要在本阶段实现。

## 功能

- Min / Max / Mean / Median / RMS / StdDev / Peak-Peak
- 可选通道
- 可选采样区间
- 结果写入工程 `analysis/` 目录

## 架构

```text
UI (SignalAnalysisView)
 ↓
Pinia analysis store
 ↓
IPC dataset:analyze
 ↓
analyzeTimeDomain（纯函数）
 ↓
ChannelStatistics
```

算法放在 `src/shared/algorithms/statistics.ts`，不要写进 Vue 组件。

## 验收

- 空通道、非法区间被拒绝
- 已知序列统计量与手算一致
- 大区间不阻塞到白屏（计算在主进程）
- `npm run typecheck && npm run lint && npm test && npm run build`

## 不要做

FFT、数字滤波、Marker 编辑、实时采集。
