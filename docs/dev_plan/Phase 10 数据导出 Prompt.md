# DataScope Phase 10：数据导出

支持将当前数据集导出为 CSV / TXT / JSON，以及后续的 DataScope Binary。

## 要求

- 不阻塞 UI（配合任务系统）
- 显示进度
- 可取消
- 捕获磁盘满、权限、路径错误
- 写入工程 `exports/`

## 不要做

不要在导出阶段重写解析器。
