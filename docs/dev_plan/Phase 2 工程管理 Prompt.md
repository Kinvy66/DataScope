# DataScope Phase 2：工程管理

在 Phase 1 的基础上实现完整工程管理。

## 功能

实现：

- New Project
- Open Project
- Save Project
- Save As
- Close Project
- Recent Projects

## Project

目录：

```text
Project/
├── project.json
├── data/
├── exports/
├── analysis/
└── logs/
```

## project.json

必须包含：

```text
version
name
description
createdAt
modifiedAt
sampleRate
channelCount
dataFiles
markers
settings
```

## 行为

新建工程：

用户输入：

- Name
- Location
- Description

打开工程：

读取 project.json。

如果格式错误：

显示友好的错误。

关闭工程：

如果存在未保存修改：

显示：

Save
Don't Save
Cancel

## Recent Projects

保存最近打开的工程。

支持：

Clear Recent History

## 验收

验证：

- 创建工程
- 保存
- 加载
- 修改
- 另存为
- 关闭
- 最近工程
- 损坏工程
- 不存在工程
- 中文路径

不要实现数据分析和实时采集功能。