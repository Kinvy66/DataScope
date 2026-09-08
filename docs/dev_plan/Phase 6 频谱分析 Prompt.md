# DataScope Phase 6：频谱分析

在时域分析之后实现离线 FFT。不要在本阶段做滤波或实时采集。

## 功能

- Radix-2 FFT（点数为 2 的幂）
- 窗函数：Rectangular / Hann / Hamming / Blackman
- 频率轴、单边幅度谱、功率谱
- 峰值频率
- Canvas 频谱图（按像素降采样，禁止为每个 bin 建 DOM）

## 架构

```text
Dataset 区间
 ↓
computeSpectrum / analyzeSpectrum
 ↓
IPC dataset:analyzeSpectrum
 ↓
SpectrumPlot
```

结果写入 `analysis/*-spectrum.json`。

## 验收

- 整周期余弦的峰值频率落在精确 bin
- 双音可分离
- 非法 FFT 点数被拒绝
- 至少 4 个采样点

## 不要做

PSD 频带统计、数字滤波、Virtual DAQ。
