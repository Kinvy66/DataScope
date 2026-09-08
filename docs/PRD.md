# DataScope
# 产品需求文档（PRD）

**Version:** 1.0  
**Status:** Development  
**Project Type:** Desktop Application  
**Primary Purpose:** 软件开发与软件测试学习项目

---

# 1. 项目概述

## 1.1 项目名称

DataScope

## 1.2 项目定位

DataScope 是一个桌面端多通道数据采集、数据浏览、波形显示、信号分析和数据管理软件。

软件主要用于：

1. 学习现代桌面软件开发
2. 学习 Electron + Vue 桌面应用架构
3. 学习数据处理和可视化
4. 学习软件测试
5. 学习自动化测试
6. 学习缺陷管理
7. 学习性能测试
8. 学习异常处理
9. 学习回归测试
10. 建立一个可持续扩展的软件测试靶场

DataScope 第一阶段不依赖真实硬件。

软件应该能够通过：

- 本地数据文件
- 数据生成器
- Virtual DAQ

模拟真实数据采集软件的工作流程。

---

# 2. 项目目标

DataScope 最终应该形成一个具有真实工程复杂度的桌面应用。

核心数据流：

```text
数据文件
   │
   ├──────────────┐
   │              │
   ▼              ▼
Offline Data   Virtual DAQ
   │              │
   └──────┬───────┘
          ▼
    Data Receiver
          │
          ▼
       Buffer
          │
          ▼
     Data Processing
          │
     ┌────┴─────┐
     ▼          ▼
Visualization  Storage
     │
     ▼
Signal Analysis
```

软件应该具备：

- 多通道数据处理
- 大数据量处理
- 实时数据流
- 文件导入导出
- 数据可视化
- 信号分析
- 网络通信
- 异常处理
- 任务管理
- 日志系统
- 配置管理
- 自动化测试基础

---

# 3. 技术栈

## 3.1 Desktop

Electron

## 3.2 Frontend

Vue 3

TypeScript

Vite

## 3.3 State Management

Pinia

## 3.4 Routing

Vue Router

## 3.5 Visualization

优先选择适合大数据量 Canvas/WebGL 的方案。

具体图表库由开发阶段根据性能需求决定。

## 3.6 Testing

根据实际项目选择：

- Vitest
- Playwright
- Electron E2E Testing
- Node.js Testing Tools

## 3.7 Build

Electron Builder 或同类 Electron 打包方案。

---

# 4. 系统架构

DataScope 使用 Electron 多进程架构。

```text
┌──────────────────────────────┐
│          Electron            │
│                              │
│  ┌────────────────────────┐  │
│  │      Main Process      │  │
│  │                        │  │
│  │ File System             │  │
│  │ Project Management      │  │
│  │ Network                 │  │
│  │ Task Management         │  │
│  │ Application Services    │  │
│  └───────────┬────────────┘  │
│              │ IPC            │
│  ┌───────────▼────────────┐  │
│  │       Preload          │  │
│  │     Secure API         │  │
│  └───────────┬────────────┘  │
│              │                │
│  ┌───────────▼────────────┐  │
│  │      Renderer          │  │
│  │                        │  │
│  │ Vue 3                  │  │
│  │ Pinia                  │  │
│  │ UI Components          │  │
│  │ Visualization          │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

# 5. 页面结构

软件至少包含以下页面。

## 5.1 Dashboard

用于显示项目概览。

包括：

- 当前项目
- 最近数据集
- 最近任务
- 数据统计
- 软件运行状态
- Virtual DAQ 状态

---

## 5.2 Data Browser

用于浏览数据集。

功能：

- 数据集列表
- 数据集搜索
- 数据集删除
- 数据集重命名
- 数据集信息查看
- 通道信息查看
- Marker 信息查看

---

## 5.3 Live Monitor

用于实时数据监控。

显示：

- 实时波形
- 通道列表
- 当前采样率
- 通道数量
- 数据接收状态
- Buffer 状态
- 数据包数量
- 丢包数量
- 网络状态
- 当前运行时间

支持：

- Start
- Pause
- Resume
- Stop

---

## 5.4 Signal Analysis

用于离线信号分析。

至少支持：

- Min
- Max
- Mean
- Median
- RMS
- Standard Deviation
- Peak-to-Peak

后续支持：

- DC Removal
- High Pass Filter
- Low Pass Filter
- Band Pass Filter
- Notch Filter

---

## 5.5 Spectrum Analysis

用于频域分析。

支持：

- FFT
- Power Spectrum
- Frequency Axis
- Magnitude
- Peak Frequency

后续可以扩展：

- PSD
- Band Power
- Frequency Band Statistics

---

## 5.6 Marker Manager

用于管理数据中的 Marker。

支持：

- 添加 Marker
- 删除 Marker
- 修改 Marker
- Marker 时间
- Marker 类型
- Marker 描述
- Marker 列表
- 波形与 Marker 联动

---

## 5.7 Data Generator

用于生成测试数据。

支持：

- Sine Wave
- Square Wave
- Triangle Wave
- DC
- Random Noise
- Multi-frequency Signal

参数：

- Channel Count
- Sample Rate
- Duration
- Frequency
- Amplitude
- Offset
- Noise Level

---

# 6. 数据模型

核心数据模型：

```text
Dataset
 ├── Metadata
 ├── Channels
 ├── Samples
 └── Markers
```

Dataset 至少包含：

```text
id
name
sampleRate
channelCount
sampleCount
duration
createdAt
channels
markers
data
```

Channel 至少包含：

```text
id
name
index
unit
enabled
```

Marker 至少包含：

```text
id
sampleIndex
timestamp
type
description
```

---

# 7. 数据格式

第一阶段支持：

## CSV

示例：

```text
Timestamp,CH1,CH2,CH3
0.000,1.2,2.3,3.4
0.001,1.3,2.4,3.5
0.002,1.1,2.2,3.2
```

---

## TXT

支持常见文本数据格式。

---

## JSON

用于交换结构化数据。

---

## DataScope Binary

DataScope 自定义二进制格式。

用于：

- 大数据
- 快速读取
- 快速写入
- 实时采集
- 长时间数据存储

具体格式由开发阶段设计。

---

# 8. 数据导入

用户可以：

```text
File
 ↓
Import
 ↓
Select File
 ↓
Format Detection
 ↓
Validation
 ↓
Parsing
 ↓
Dataset
```

必须处理：

- 空文件
- 文件不存在
- 文件损坏
- 列数量错误
- 非数字数据
- NaN
- Infinity
- 时间戳错误
- 重复时间戳
- 缺失数据
- 超大文件
- 中文路径
- 特殊字符路径

---

# 9. 波形显示

Waveform Viewer 是核心功能。

必须支持：

- 多通道
- Zoom
- Pan
- Fit
- Autoscale
- Channel Hide
- Channel Show
- Channel Reorder
- Channel Selection

支持 Cursor：

```text
Cursor A
Cursor B
```

显示：

```text
ΔTime
ΔSample
ΔValue
```

---

# 10. 大数据处理

软件必须考虑大数据。

目标测试数据：

```text
32 Channels
×
1,000,000 Samples
```

不能直接将全部原始数据转换成大量 UI DOM 元素。

必须考虑：

- Downsampling
- Min-Max Downsampling
- Canvas
- WebGL
- Worker
- 分块加载
- 缓存
- 虚拟化

---

# 11. Signal Processing

信号处理模块应该与 UI 解耦。

推荐：

```text
UI
 ↓
Analysis Service
 ↓
Signal Processing
```

核心算法尽可能设计成 Pure Function。

---

# 12. Virtual DAQ

DataScope 不要求真实硬件。

软件提供 Virtual DAQ。

Virtual DAQ 用于模拟真实采集设备。

---

## 12.1 Device

Virtual DAQ 至少包含：

```text
Device ID
Device Name
Channel Count
Sample Rate
Buffer Size
Connection State
```

---

## 12.2 Device State

```text
Disconnected
     ↓
Connected
     ↓
Ready
     ↓
Running
     ↓
Paused
     ↓
Stopped
```

错误状态：

```text
Error
```

必须使用明确的状态机管理。

---

# 13. Virtual DAQ 数据流

```text
Virtual DAQ
     │
     ▼
Packet Generator
     │
     ▼
TCP / UDP
     │
     ▼
Packet Receiver
     │
     ▼
Packet Validation
     │
     ▼
Buffer
     │
     ▼
Processing
     │
     ├──────► Visualization
     │
     └──────► Storage
```

---

# 14. 网络数据包

数据包可以包含：

```text
Header
Sequence
Timestamp
SampleIndex
ChannelCount
SampleCount
Payload
CRC
```

具体协议由开发阶段确定。

必须支持数据包解析和验证。

---

# 15. Virtual DAQ 故障模拟

Virtual DAQ 应支持故障注入。

包括：

- Packet Loss
- Packet Delay
- Packet Duplicate
- Packet Reorder
- Sequence Error
- Timestamp Error
- Corrupted Packet
- Device Disconnect
- Device Reconnect
- Buffer Overflow
- Sample Rate Change
- Channel Error

这些功能主要用于软件测试。

---

# 16. Data Generator 异常数据

数据生成器应该能够生成异常数据。

包括：

- NaN
- Infinity
- Zero
- DC Offset
- Saturation
- Spike
- Dropout
- Missing Samples
- Timestamp Error
- Random Noise
- Abnormal Amplitude

---

# 17. Task Manager

所有耗时任务不应该阻塞 UI。

任务状态：

```text
Pending
Running
Paused
Completed
Failed
Cancelled
```

支持：

- Start
- Pause
- Resume
- Cancel
- Retry

任务应该能够报告：

```text
Progress
Status
Error
Duration
```

---

# 18. Project Management

支持：

- New Project
- Open Project
- Save
- Save As
- Close
- Recent Projects

项目目录：

```text
Project/
├── project.json
├── data/
├── exports/
├── analysis/
└── logs/
```

---

# 19. Export

支持：

- CSV
- TXT
- JSON
- DataScope Binary

导出过程中：

- 不允许阻塞 UI
- 显示进度
- 支持取消
- 捕获异常

---

# 20. Settings

至少支持：

## Application Settings

- Language
- Theme
- Log Level
- Cache Size
- Autosave

## Data Settings

- Default Sample Rate
- Default Channel Count
- Default Data Format

---

# 21. Theme

支持：

- Light
- Dark

UI 应保持统一的设计系统。

---

# 22. Internationalization

至少支持：

- English
- Chinese

所有用户界面文本尽可能通过 i18n 管理。

禁止大量硬编码 UI 文本。

---

# 23. Logging

软件必须提供统一日志系统。

至少记录：

```text
INFO
WARN
ERROR
DEBUG
```

重要事件：

```text
Application Start
Application Exit
Project Open
Project Close
File Import
File Export
Dataset Load
Analysis Start
Analysis Complete
Task Start
Task Complete
Task Failed
Device Connect
Device Disconnect
Network Error
IPC Error
```

---

# 24. Error Handling

软件必须避免：

- Renderer Crash
- Main Process Crash
- Unhandled Promise Rejection
- Unhandled Exception

文件、网络、IPC、数据解析、分析任务都必须具有合理的错误处理。

用户应该获得可理解的错误信息。

---

# 25. 测试要求

DataScope 本身就是软件测试学习项目。

因此从开发阶段就必须具备测试能力。

---

## 25.1 Unit Test

核心业务逻辑必须具备 Unit Test。

重点：

- Data Parser
- Data Validation
- Statistics
- Signal Processing
- Downsampling
- Marker Processing
- Packet Parser
- Packet Validation
- State Machine
- Project Management

---

## 25.2 Integration Test

测试：

```text
File
 ↓
Parser
 ↓
Dataset
 ↓
Processing
 ↓
Visualization
```

以及：

```text
Virtual DAQ
 ↓
Network
 ↓
Receiver
 ↓
Buffer
 ↓
Dataset
```

---

## 25.3 E2E Test

至少测试：

```text
Launch Application
Create Project
Import Dataset
Open Dataset
View Waveform
Run Analysis
Export Data
Close Project
Reopen Project
```

---

# 26. 测试数据

项目必须包含：

```text
test-data/
├── normal/
├── empty/
├── malformed/
├── boundary/
├── large/
├── unicode/
└── abnormal/
```

用于自动化测试和人工测试。

---

# 27. Performance

重点性能指标：

```text
32 channels × 1,000,000 samples
```

关注：

- Application startup
- File import
- File export
- Dataset loading
- Waveform rendering
- Zoom
- Pan
- FFT
- Filtering
- Memory usage
- CPU usage
- Network throughput

---

# 28. UI / UX

整体采用现代工程软件风格。

推荐布局：

```text
┌────────────────────────────────────────────┐
│ Menu / Toolbar                             │
├─────────────┬──────────────────────────────┤
│             │                              │
│ Navigation  │          Workspace           │
│             │                              │
│             │                              │
├─────────────┴──────────────────────────────┤
│ Status Bar                                 │
└────────────────────────────────────────────┘
```

UI 应重点考虑：

- 信息密度
- 操作效率
- 状态可见性
- 错误提示
- 大数据可视化
- 工程软件使用习惯

---

# 29. Keyboard Shortcuts

至少支持：

```text
Ctrl + N
Ctrl + O
Ctrl + S
Ctrl + Shift + S
Ctrl + W
Ctrl + Z
Ctrl + Y
Ctrl + F
```

具体快捷键可以根据实际 UI 继续扩展。

---

# 30. Undo / Redo

适合的数据编辑操作应该支持：

```text
Undo
Redo
```

具体支持范围由开发阶段根据架构决定。

---

# 31. Application State

重要业务状态必须明确管理。

例如：

```text
Project State
Dataset State
Acquisition State
Task State
Network State
Analysis State
```

禁止使用大量互相独立的 Boolean 表示复杂状态。

例如不推荐：

```text
isConnected
isRunning
isPaused
isStopped
isError
```

应该根据情况设计明确的 State Machine。

---

# 32. Security

Electron 应遵循基本安全原则：

- Context Isolation
- Preload API
- 不直接暴露 Node API 给 Renderer
- 限制 IPC API
- 验证 IPC 参数
- 文件路径校验

Renderer 不应该直接拥有不必要的 Node.js 权限。

---

# 33. 项目质量要求

代码应该：

- 使用 TypeScript
- 尽量避免 any
- 模块化
- 高内聚
- 低耦合
- 可测试
- 可维护

核心业务逻辑不应该与 UI 强耦合。

---

# 34. 开发策略

开发应该遵循：

```text
Foundation
 ↓
Project Management
 ↓
Data Model
 ↓
Data Import
 ↓
Visualization
 ↓
Signal Analysis
 ↓
Virtual DAQ
 ↓
Network
 ↓
Task System
 ↓
Export
 ↓
Performance
 ↓
Testing
```

以上仅用于表达功能依赖关系。

具体开发阶段不固定。

AI 应根据当前项目状态自动决定下一阶段。

---

# 35. V1.0 Clean

V1.0 必须是：

> 正常、稳定、没有人为注入 Bug 的版本。

开发阶段：

```text
禁止故意制造 Bug
```

完成后建立：

```text
v1.0-clean
```

Git Tag。

---

# 36. Testing Lab

V1.0 Clean 完成后，可以创建：

```text
testing-lab
```

用于软件测试训练。

```text
v1.0-clean
      │
      ▼
testing-lab
```

Testing Lab 可以故意加入：

- Functional Bugs
- UI Bugs
- Boundary Bugs
- State Bugs
- Data Bugs
- Concurrency Bugs
- Performance Bugs
- File System Bugs
- Network Bugs
- Regression Bugs

---

# 37. 缺陷管理

Bug 至少包含：

```text
Bug ID
Title
Severity
Priority
Environment
Precondition
Steps
Expected Result
Actual Result
Reproducibility
Attachments
Status
```

Severity：

```text
Critical
High
Medium
Low
```

---

# 38. 测试学习目标

通过 DataScope 学习：

```text
需求分析
 ↓
测试设计
 ↓
测试用例
 ↓
功能测试
 ↓
边界测试
 ↓
异常测试
 ↓
状态测试
 ↓
接口测试
 ↓
网络测试
 ↓
性能测试
 ↓
自动化测试
 ↓
Bug 定位
 ↓
Bug 修复
 ↓
回归测试
 ↓
CI
```

最终形成完整的软件工程闭环。

---

# 39. 非目标

V1.0 不要求：

- 真实 EEG 硬件
- ADS1299
- FPGA
- STM32
- 医疗认证
- 临床数据
- 医疗用途
- 云服务
- 用户账号系统
- 在线协作

如果未来需要，可以在后续版本扩展。

---

# 40. 最终目标

DataScope 最终不是一个简单的 Demo。

它应该成为一个：

> **具有真实桌面软件复杂度，并且专门用于学习软件测试、自动化测试、缺陷发现、Bug 修复和回归测试的长期实验项目。**

核心闭环：

```text
             ┌──────────────┐
             │     PRD      │
             └──────┬───────┘
                    ↓
             ┌──────────────┐
             │ AI Developer │
             └──────┬───────┘
                    ↓
                V1.0 Clean
                    ↓
             ┌──────────────┐
             │ Bug Injection│
             └──────┬───────┘
                    ↓
              Testing Lab
                    ↓
             ┌──────────────┐
             │   QA/Test    │
             └──────┬───────┘
                    ↓
                 Bug
                    ↓
                 Fix
                    ↓
              Regression
                    ↓
                  CI/CD
```

最终目标：

```text
Requirement
     ↓
Development
     ↓
Testing
     ↓
Bug
     ↓
Fix
     ↓
Regression
     ↓
Automation
```