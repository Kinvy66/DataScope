# 测试数据目录

按 PRD §26 分类，供自动化测试和人工导入试用。单测仍以 `tests/fixtures/` 为准；本目录是工程级资产。

| 分类 | 文件 | 用途 |
| --- | --- | --- |
| `normal/` | `normal.csv` | 3 通道 × 4 点，E2E 冒烟导入 |
| `normal/` | `normal.json` | 合法 JSON 行主序 |
| `normal/` | `datetime-perg.csv` | 日期时间戳表头（PERG 风格） |
| `empty/` | `empty.csv` | 空文件，应拒绝 |
| `empty/` | `header-only.csv` | 仅表头，应拒绝 |
| `malformed/` | `ragged-columns.csv` | 列数与表头不一致 |
| `malformed/` | `header-missing.csv` | 无表头 |
| `boundary/` | `two-samples.csv` | 最短合法序列（2 个采样点） |
| `large/` | `4ch-5000.csv` | 4 通道 × 5000 点，人工/导入压测用；不是 32×1e6 性能锚点 |
| `unicode/` | `unicode.csv` | 中文表头 |
| `unicode/` | `中文文件名.csv` | 中文路径，内容合法 |
| `abnormal/` | `nan.csv` | NaN，应拒绝 |
| `abnormal/` | `infinity.csv` | Infinity，应拒绝 |
| `abnormal/` | `timestamp-rollback.csv` | 时间戳回退，应拒绝 |

性能锚点（32 通道 × 1,000,000 点）由单测生成，不入库本目录。
