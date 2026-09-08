# DataScope Agent Guide

给本仓库的编码代理使用。改代码前先读本文件，再对照源码与 `docs/PRD.md`，不要凭记忆假设阶段已经完成。

## 项目是什么

DataScope 是桌面端多通道时序数据采集 / 浏览 / 波形 / 分析软件，技术栈为 **Electron + Vue 3 + TypeScript (strict) + Vite / electron-vite + Pinia + Vue Router + Vitest**。

它首先是软件工程与软件测试学习项目，目标是做出可运行、可测试、可维护的真实桌面应用，而不是 Demo。V1.0 不依赖真实硬件；离线文件、数据发生器、Virtual DAQ 用于模拟采集流程。

当前阶段是 **V1.0 Clean**：只做正确实现，禁止故意注入缺陷。Bug Injection 只允许在用户明确要求、且已有 `v1.0-clean` 之后，于独立的 `testing-lab` 分支进行。

非目标（V1.0）：真实 EEG 硬件、医疗认证 / 临床用途、云服务、账号系统、在线协作。

## 权威来源（冲突时按此顺序）

1. 当前源码与测试（唯一“已实现”依据）
2. `docs/PRD.md`（产品需求；`docs/DataScope PRD.md` 视为副本，改需求只改 `docs/PRD.md`）
3. `docs/PROJECT_STATUS.md`（已合入分支的进度快照；与代码冲突时以代码为准并回写本文）
4. `README.md`
5. 本文件
6. `docs/AI_DEVELOPMENT_PROMPT.md`（自动迭代工作流）
7. `docs/dev_plan/` 下的阶段 Prompt（历史任务书，不是必须机械执行的 Phase 编号表）

实现与 PRD 冲突时遵循 PRD。需求矛盾或无法实现时先指出问题并给出方案，禁止偷偷改需求。不要为了赶进度发明假功能。

## 工作方式

- 先看现状再动手：目录、`package.json`、Router、Pinia、IPC、`src/shared`、`tests/`、最近 Git 状态。
- 一次只做一个可独立验收的增量。优先补齐未完成的基础能力，再加新模块。不要在一次任务里把 PRD 剩余功能全部做完。
- 用户说「继续」时：自行对照 PRD 与代码决定下一阶段，不要反问用户 Phase 编号或下一功能该做什么。
- 不要机械死守 Phase 1–12。PRD §34 的依赖链（工程 → 数据模型 → 导入 → 可视化 → 分析 → Virtual DAQ → 任务 → 导出 → 性能 → 测试）用于判断顺序，阶段划分可以按实际调整。
- 用 `PhasePage.vue` 占位的页面表示该业务尚未实现，不是已完成功能。
- 核心逻辑写成可单测的纯函数 / Service / Domain，不要堆进 Vue 组件。禁止用 `any`、`TODO` 顶替核心行为、或用 Mock 冒充真实文件 / 解析 / IPC。
- UI 文案用中文；标识符、文件名、提交说明用英文。

判断实现进度时先读 `docs/PROJECT_STATUS.md`，再核对源码。未合入的本地草稿不能写成已完成。占位页（`PhasePage.vue`）不是已实现功能。

## 仓库地图

```text
src/main/          主进程：窗口、IPC、文件系统、工程、导入、日志、设置
src/preload/       contextBridge，只暴露 window.datascope
src/renderer/      Vue UI、路由、Pinia、Canvas 波形
src/shared/        主进程与渲染进程共用的类型、常量、解析器、算法、错误类型
tests/             Vitest：tests/**/*.spec.ts 与 tests/fixtures/
docs/              PRD 与开发 / 测试 Prompt
samples/           示例数据
```

路径别名：`@shared/*` → `src/shared/*`；渲染进程额外有 `@renderer/*` → `src/renderer/src/*`。

工程磁盘布局：

```text
<project>/
├── project.json
├── data/
├── exports/
├── analysis/
└── logs/
```

## 进程边界与 IPC

```text
Vue 组件 → Pinia store → window.datascope → preload → ipcMain → services → domain
```

硬约束：

- 渲染进程 **禁止** `nodeIntegration`，禁止直接使用 Node / `fs` / `path` / `ipcRenderer`。
- 只通过 `window.datascope`（类型在 `src/shared/types/api.ts`）访问主进程。
- 保持 `contextIsolation: true`。
- 通道名集中定义在 `src/shared/ipc-channels.ts` 的 `IpcChannel`，禁止魔法字符串。
- 业务错误使用 `src/shared/errors.ts` 的 `DataScopeError`；IPC 侧用现有 `wrap()` 记日志并转成用户可读信息，避免未处理 Promise 或白屏。
- 重要操作写日志（工程开关、导入、分析、任务、IPC 失败等）。

新增或修改 IPC 必须同步四层，缺一层即不完整：

1. `src/shared/ipc-channels.ts`
2. `src/shared/types/api.ts` 的 `DataScopeAPI`
3. `src/main/ipc/` 的 handler
4. `src/preload/index.ts` 暴露 API

然后由 Pinia store 调用，而不是在散落的组件里直接堆 IPC。

## 代码约定

- TypeScript `strict`；ESLint `any` 为 error；未使用变量以 `_` 前缀忽略。
- Vue 3 `<script setup lang="ts">` + 组合式 API。页面放 `views/`，可复用块放 `components/`。
- 样式使用已有 token 与工具类（`tokens.css` / `global.css`：`--bg-*`、`--accent`、`.btn`、`.panel`、`.page-header`、`.field`、`.table`、`.muted`）。不要另起一套视觉系统或为波形创建海量 DOM 节点。
- 新增页面：先挂路由与导航，再实现真实交互；占位页继续用 `PhasePage`，直到该阶段真正落地。
- 主题与布局常量已有；颜色、通道预设、工程文件名等放 `src/shared/constants.ts`。

## 数据与性能

波形路径必须保持：

```text
Dataset → Viewport → Min-Max Downsampling → Canvas
```

- 渲染进程只请求当前窗口的 `getViewport` 结果（min/max buckets），不要把整份 `samples` 经 IPC 拷到 UI。
- 性能锚点：`32 channels × 1,000,000 samples` 下导入、缩放、平移、显隐通道不应明显卡死。
- 禁止在循环里同步刷新 UI；大数据使用批处理、降采样、异步与缓存。
- 导入须覆盖：空文件、缺表头、列数不一致、非数字、NaN/Infinity、非法时间戳、中文路径、超大文件、权限与损坏文件。CSV/TXT 表头约定见 `README.md`。

## 测试与验证

核心算法与解析必须有单测（正常 / 边界 / 非法 / 空 / 极端输入），放在 `tests/` 并尽量用 `tests/fixtures/`。

改完代码后实际跑，不要口头声称“应该能过”：

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

开发：`npm run dev`。UI / 布局 / 路由 / 客户端状态变更时，按真实用户路径点选验证，并检查共用同一 store 的其它页面；不要只看一次静态渲染。Electron 无法用浏览器工具打开时，用上述命令 + 说明未交互验证的部分。

## Git

- 完成可验收增量后：更新 `docs/PROJECT_STATUS.md`（日期、进度基准、阶段表、测试、下一阶段），创建 commit，然后立即 `git push` 到 `origin` 当前分支。不要只停在本地。
- 问答、探索或未完成草稿不要擅自 commit。不要改 git config、跳过 hook、force push。
- 提交时不纳入 `.env`、密钥、`out/`、`dist/`、`release/`、个人文件；message 用 `feat:` / `fix:` / `test:` / `refactor:` / `docs:` 说明原因。
- 不要在 V1.0 Clean 工作区制造缺陷。不要提交构建产物。

## 明确禁止

- 点击后无行为的按钮、装饰性假功能
- 渲染进程直接碰文件系统
- 为每个采样点创建 DOM、每次平移/缩放处理整份 Dataset
- 一次任务实现 FFT、滤波、Marker、实时采集、导出等互不依赖的后续模块（除非当前增量明确需要其基础设施）
- 把大量业务逻辑写进单个巨型 Vue 文件
- 为展示而引入过重图表库（现有波形是 Canvas）
- 擅自扩大范围改无关文件或新增未要求的 Markdown

## 文档索引

| 文件 | 用途 |
| --- | --- |
| `docs/PRD.md` | 产品需求 |
| `docs/PROJECT_STATUS.md` | 已合入进度；阶段完成后更新并随 commit 推送 |
| `docs/AI_DEVELOPMENT_PROMPT.md` | 自动迭代开发（含完成后的 Summary 格式） |
| `docs/dev_plan/DataScope Vibe Coding 总控 Prompt.md` | 分阶段实施约束 |
| `docs/dev_plan/Phase * Prompt.md` | 各阶段历史任务书 |
| `docs/dev_plan/DataScope 测试工程师 Prompt.md` | QA 角色；测功能时不要翻缺陷清单 |
| `docs/dev_plan/DataScope Bug Injection Prompt.md` | 仅 testing-lab |

按 `docs/AI_DEVELOPMENT_PROMPT.md` 做完整迭代时，结束用该文档的 Development Summary 格式汇报：当前阶段、实现、架构变化、测试、验证命令结果、剩余工作、建议的下一阶段及理由。
