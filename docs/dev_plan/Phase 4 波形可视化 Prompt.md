# DataScope Phase 4：波形可视化

在已有 Dataset 和 Data Browser 基础上，实现多通道波形查看器。

## 功能

实现：

- 1/4/8/16/32/64/128 通道显示
- Channel Show/Hide
- Zoom In
- Zoom Out
- Pan
- Auto Scale
- Fit All
- Channel Reorder
- Cursor A
- Cursor B

## 波形

必须支持百万级数据。

不得：

- 一个采样点创建一个 DOM
- 每次鼠标移动重新处理整个 Dataset
- 每次视图变化复制完整 Dataset

必须设计：

```text
Dataset
 ↓
Viewport
 ↓
Downsampling
 ↓
Renderer
```

至少实现 Min-Max Downsampling。

## Cursor

显示：

```text
Time A
Time B
Delta Time
Value A
Value B
Delta Value
```

## 验收

使用：

32 channels × 1,000,000 samples

验证：

- 波形可以显示
- Zoom 正常
- Pan 正常
- Channel Hide 正常
- Cursor 正常
- UI 不出现明显卡死

完成后运行 build。

不要实现 FFT 和 Filter。