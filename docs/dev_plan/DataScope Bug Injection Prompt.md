# DataScope Bug Injection Lab

当前 DataScope 已经完成 V1.0 Clean。

现在进入：

Bug Injection Phase。

## 极其重要

不要修改：

```text
v1.0-clean
```

创建：

```text
testing-lab
```

分支。

所有 Bug 必须只存在于 testing-lab。

---

# 目标

模拟真实商业软件开发过程中的缺陷。

不要简单添加：

```text
throw new Error()
```

这种容易被发现的假 Bug。

Bug 应该尽量模拟真实开发中可能产生的错误。

---

# Bug 类型

至少覆盖：

1. Boundary Bug
2. State Machine Bug
3. UI Bug
4. Data Consistency Bug
5. File System Bug
6. Encoding Bug
7. Concurrency Bug
8. Performance Bug
9. Error Handling Bug
10. Regression Bug

---

# Bug 注入要求

每次只注入一个 Bug。

注入后：

1. 修改代码
2. Build
3. 启动
4. 确认软件仍然可以运行
5. 创建 Git Commit

不要一次注入多个 Bug。

---

# Bug 隐蔽性

Bug 应该：

- 不是每次都立即崩溃
- 尽可能具有真实触发条件
- 需要合理测试才能发现
- 不应该明显暴露注释
- 不允许添加 BUG TODO
- 不允许修改 UI 来告诉测试人员这里有 Bug

---

# Bug 示例

可以从以下 Bug 开始：

BUG-001：

sampleRate = 0 时 FFT 出错。

BUG-002：

删除最后一个 Marker 后数量显示错误。

BUG-003：

Paused → Stop 状态处理错误。

BUG-004：

快速双击 Start 创建两个采集任务。

BUG-005：

中文路径读取失败。

BUG-006：

空 CSV 导致 UI 卡死。

BUG-007：

Cutoff = Nyquist 时滤波器异常。

BUG-008：

大数据 Export 阻塞 UI。

BUG-009：

关闭窗口时后台任务没有停止。

BUG-010：

切换语言后部分 UI 没有更新。

---

# 隐藏 Bug 信息

建立：

```text
bug-lab/master-list.md
```

记录：

```text
Bug ID
Commit
Category
Trigger Condition
Expected Result
Actual Result
Root Cause
Injected File
Injected Code
```

但是：

master-list.md 不得被测试人员看到。

---

# 最重要的要求

每个 Bug 都必须：

```text
Clean
 ↓
Inject
 ↓
Build
 ↓
Verify
 ↓
Commit
```

最终得到：

```text
v1.0-clean
     │
     └── testing-lab
             │
             ├── BUG-001
             ├── BUG-002
             ├── BUG-003
             └── ...
```

不要告诉测试人员 Bug 的具体位置和触发条件。