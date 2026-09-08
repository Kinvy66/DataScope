# DataScope 开发计划

本目录是给开发者 / 编码代理用的阶段任务书，不是给最终用户的说明书。

用户手册见 [`../wiki/README.md`](../wiki/README.md)。合入进度见 [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md)。产品需求见 [`../PRD.md`](../PRD.md)。

## 阶段与状态

| 阶段 | 任务书 | 状态 | 对应能力 |
| --- | --- | --- | --- |
| 1 | [Phase 1 基础框架](./Phase%201%20基础框架%20Prompt.md) | 已完成 | Electron + Vue 壳、布局、主题、日志 |
| 2 | [Phase 2 工程管理](./Phase%202%20工程管理%20Prompt.md) | 已完成 | 新建 / 打开 / 保存 / 关闭工程 |
| 3 | [Phase 3 数据导入](./Phase%203%20数据导入%20Prompt.md) | 已完成 | CSV / TXT / JSON、数据浏览 |
| 4 | [Phase 4 波形可视化](./Phase%204%20波形可视化%20Prompt.md) | 已完成 | Canvas 波形、降采样、光标 |
| 5 | [Phase 5 时域信号分析](./Phase%205%20时域信号分析%20Prompt.md) | 已完成 | 统计量、analysis JSON |
| 6 | [Phase 6 频谱分析](./Phase%206%20频谱分析%20Prompt.md) | 已完成 | FFT、幅度/功率谱 |
| 7 | [Phase 7 Marker 管理](./Phase%207%20Marker%20管理%20Prompt.md) | 未开始 | Marker CRUD 与波形联动 |
| 8A | [Phase 8A 数据发生器](./Phase%208A%20数据发生器%20Prompt.md) | 本阶段实现 | 离线合成波形写入工程 |
| 8B | [Phase 8B 实时监视](./Phase%208B%20实时监视%20Prompt.md) | 未开始 | Virtual DAQ、Live Monitor |
| 9 | [Phase 9 任务系统](./Phase%209%20任务系统%20Prompt.md) | 未开始 | 后台任务进度与取消 |
| 10 | [Phase 10 数据导出](./Phase%2010%20数据导出%20Prompt.md) | 未开始 | CSV / JSON / 二进制导出 |
| 11 | [Phase 11 设置与国际化](./Phase%2011%20设置与国际化%20Prompt.md) | 部分完成 | 主题可用；缺 i18n |
| 12 | [Phase 12 测试支持](./Phase%2012%20测试支持%20Prompt.md) | 部分完成 | Vitest 有；缺 E2E |

总控约束：[`DataScope Vibe Coding 总控 Prompt.md`](./DataScope%20Vibe%20Coding%20总控%20Prompt.md)  
QA 角色：[`DataScope 测试工程师 Prompt.md`](./DataScope%20测试工程师%20Prompt.md)  
缺陷注入（仅 testing-lab）：[`DataScope Bug Injection Prompt.md`](./DataScope%20Bug%20Injection%20Prompt.md)

## 使用规则

1. 先读 `docs/PROJECT_STATUS.md` 和源码，再执行某一阶段任务书。
2. 已完成阶段的任务书保留作验收对照，不要删。
3. 一次只做一个可验收增量。不要把 Marker、滤波、实时采集和导出混在一次提交里。
4. V1.0 Clean 禁止故意注入缺陷。
