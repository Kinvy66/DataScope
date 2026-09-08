# DataScope Phase 12：测试支持

在 Vitest 单测基础上补齐工程级测试资产。

## 已有

`tests/**/*.spec.ts`、`tests/fixtures/`、`samples/`。

## 本阶段应补

- Playwright 或 Electron E2E：启动 → 建工程 → 导入/生成 → 看波形 → 分析 → 关闭再打开
- `test-data/` 分类：normal / empty / malformed / boundary / large / unicode / abnormal
- 需要时再加 CI 工作流

Bug 注入不属于本阶段，必须在 `v1.0-clean` 之后的 `testing-lab` 分支进行。
