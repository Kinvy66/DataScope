# DataScope Phase 7：Marker 管理

在 Dataset.markers 与波形查看器之上提供 Marker 业务，不要顺手做实时采集或导出。

## 功能

- 添加 / 删除 / 修改 Marker
- 时间、采样点、类型、描述
- Marker 列表
- 与波形 Cursor / 跳转联动

## 数据

沿用现有：

```ts
interface Marker {
  id: string
  name: string
  sampleIndex: number
  time: number
  channelId?: string
  color: string
  note: string
}
```

需要持久化到工程（`project.json` 的 markers 或数据集旁路文件），重新打开工程后仍在。

## 验收

- 非法采样点被拒绝
- 删除后列表与波形同步
- 有纯函数测试（插入、排序、时间换算）

## 不要做

FFT、滤波、Virtual DAQ、Undo 全量框架（除非编辑 Marker 必须要极小的撤销）。
