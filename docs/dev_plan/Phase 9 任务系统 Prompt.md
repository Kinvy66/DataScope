# DataScope Phase 9：任务系统

把耗时工作（导入大文件、分析、导出、生成大数据）纳入任务管理，避免阻塞 UI。

## 状态

Pending / Running / Paused / Completed / Failed / Cancelled

## 能力

Start、Pause、Resume、Cancel、Retry、进度与错误信息。

## 不要做

不要把任务系统和 Virtual DAQ 协议混在一次提交里。
