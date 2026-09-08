# DataScope Phase 3：数据导入

实现 Dataset 数据模型以及数据文件导入。

## 支持

CSV
TXT
JSON

## Dataset

实现：

```ts
Dataset
Channel
Marker
DatasetMetadata
```

## CSV

格式：

```text
timestamp,ch1,ch2,ch3
0.000,1.2,2.3,3.4
0.001,1.3,2.2,3.5
```

必须检查：

- 文件为空
- Header 缺失
- 列数量不一致
- 非数字
- NaN
- Infinity
- 时间戳错误
- 通道数量错误

## UI

实现：

Import Data

Data Browser：

- File List
- Dataset Info
- Channel List
- Statistics Table

## 大数据

设计数据加载接口，不能让 UI 因百万级数据直接生成大量 DOM。

## 测试

至少创建：

- normal CSV
- empty CSV
- malformed CSV
- unicode CSV
- large CSV

并验证导入行为。

不要实现 FFT、Filter、Realtime。