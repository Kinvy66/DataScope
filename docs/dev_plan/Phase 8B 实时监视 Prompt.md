# DataScope Phase 8B：实时监视与 Virtual DAQ

在离线发生器之后实现采集状态机与 Live Monitor。

## 必须

明确状态机：

```text
Disconnected → Connected → Ready → Running ⇄ Paused → Stopped
```

非法转换必须拒绝。

## 数据流

```text
Virtual DAQ → Packet → Buffer → Processing → Visualization / Storage
```

UI 不得直接操作底层 buffer。

## 可后续加入的故障

丢包、延迟、重复、乱序、时间戳错误、断线重连。这些服务于测试，不要为加功能而加功能。

## 不要做

真实硬件协议、云同步。
