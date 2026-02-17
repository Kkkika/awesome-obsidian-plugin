# 文件名与标题同步（Filename to Title Sync）

一句话介绍：将文件名自动同步到 YAML frontmatter 的 `title` 字段，保持标题与文件名一致。

- 作者：kika
- 版本：1.0.0
- 适配：Obsidian ≥ 0.15.0（桌面与移动端）

## 简介

当你在 Obsidian 中重命名 Markdown 文件时，插件会自动把新的文件名写入该文件的 YAML frontmatter 中的 `title` 字段；你也可以通过命令面板手动同步当前文件的标题，避免标题与文件名不一致。

## 安装指南

- 手动安装
  1. 下载或克隆本仓库，将文件夹 `filename-to-title-sync` 放入你的库目录下的 `.obsidian/plugins/`。
  2. 启用社区插件：Settings → Community plugins → 打开「Turn on community plugins」。
  3. 在插件列表中启用「Filename to Title Sync」。
- 升级/移除
  - 升级：替换同名文件夹内容并重启 Obsidian。
  - 移除：在插件列表中关闭后，删除该插件文件夹。

## 快速上手

1. 在库中选择任一 Markdown 文件，按 F2 或右键重命名文件。
2. 打开该文件头部的 YAML（`---` 包裹的区域），你会看到 `title` 已更新为新的文件名。
3. 如需手动同步：打开命令面板（Ctrl/Cmd+P），执行「Sync filename to title (Current File)」。

## 功能详解

- 自动同步（重命名触发）
  - 当 Markdown 文件被重命名时，自动将 `title` 更新为文件名（不含扩展名）。
- 手动同步（命令面板）
  - 命令：`Sync filename to title (Current File)`，对当前活动文件执行同步，并显示 Notice。
- 兼容性
  - 仅处理 `.md` 文件；`isDesktopOnly: false`，移动端同样可用。

## 配置/自定义

- 可视化设置：当前无内置配置项。
- 二次开发：如需写入其他字段名（例如 `name`），可在 `main.js` 中将 `frontmatter['title']` 调整为目标字段名后重新加载插件。

## 常见问题（FAQ）

- 为什么重命名后没反应？
  - 确认目标文件是 `.md`，且插件已在设置中启用。
  - 仅对重命名事件与手动命令生效；编辑正文不触发自动同步。
  - Obsidian 版本需 ≥ 0.15.0。
- 文件没有 YAML frontmatter 会怎样？
  - Obsidian 在处理 frontmatter 时会自动创建 YAML 区块并写入 `title`。
- 手动命令在哪？
  - 命令面板（Ctrl/Cmd+P）搜索「Sync filename to title (Current File)」。
- 会覆盖我已有的 `title` 吗？
  - 会。该插件的目标是保持 `title` 与文件名一致；如果希望保留自定义 `title`，请避免使用该插件或仅在需要时手动运行命令。
- 与其他 frontmatter 管理插件冲突吗？
  - 若其他插件也在修改 `title` 字段，可能产生覆盖。请按需调整加载顺序或字段名。

## 已知问题/限制

- 仅监听重命名事件；批量处理或其他触发（移动/复制）需手动命令或自行扩展。
- 只对 Markdown 生效；非 `.md` 文件忽略。
- 对 `title` 写入是直接覆盖，未提供合并策略。

---

若有功能建议或问题反馈，欢迎提 Issue。谢谢使用！

