# DataScope Phase 8A：数据发生器

实现离线测试波形生成，写入当前工程，成为可浏览、可分析的 Dataset。

不要在本阶段实现 Live Monitor 或网络 Virtual DAQ。

## 功能

- Sine / Square / Triangle / DC / Random Noise / Multi-frequency
- 参数：通道数、采样率、时长、频率、幅度、偏置、噪声水平
- 生成结果保存为工程 `data/*.json`
- 生成后可在数据浏览、波形、时域分析、频谱分析中使用

## 约束

- 单通道最多 1,000,000 点
- 最多 32 通道
- 频率必须低于奈奎斯特频率
- 算法为纯函数，可单测
- Renderer 不直接写文件

## 验收

- 1 Hz 正弦在四分之一周期处幅度正确
- 直流为常数
- 生成的 64 Hz 正弦能被 FFT 找回峰值频率
- 无工程时不能生成

## 不要做

Packet 级 Virtual DAQ、TCP/UDP、实时 buffer。
