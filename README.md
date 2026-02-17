 # Awesome Obsidian Plugins
 
 一句话介绍：零构建的 Obsidian 小工具合集，聚焦「文件与附件治理」场景。
 
 - 作者：kika
 - 仓库：<https://github.com/Kkkika/awesome-obsidian-plugin>
 - 适配：Obsidian ≥ 1.2.0（具体见各插件清单）
 
 ## 项目概览
 本仓库包含以下插件（均为纯 JavaScript，无需构建，复制即用）：
 
 1) 附件链接重写器（attach-link-rewriter）
 - 版本：0.1.0，最低版本：1.4.0
 - 功能：批量重写笔记中的内联图片链接，支持模板变量与移动/复制附件
 - 文档：[attach-link-rewriter/README.md](file:///c:/Users/A/Desktop/awesome-obsidian-plugin/attach-link-rewriter/README.md)
 - 元数据：[attach-link-rewriter/manifest.json](file:///c:/Users/A/Desktop/awesome-obsidian-plugin/attach-link-rewriter/manifest.json)
 
 2) 文件名与标题同步（filename-to-title-sync）
 - 版本：0.1.0，最低版本：0.15.0
 - 功能：将文件名自动同步到 YAML frontmatter 的 `title` 字段，保持一致
 - 文档：[filename-to-title-sync/README.md](file:///c:/Users/A/Desktop/awesome-obsidian-plugin/filename-to-title-sync/README.md)
 - 元数据：[filename-to-title-sync/manifest.json](file:///c:/Users/A/Desktop/awesome-obsidian-plugin/filename-to-title-sync/manifest.json)
 
 3) 未引用附件扫描（unreferenced-attachments）
 - 版本：0.1.0，最低版本：1.2.0
 - 功能：列出未被任何 Markdown 引用的本地附件，支持复制路径与删除
 - 文档：[unreferenced-attachments/README.md](file:///c:/Users/A/Desktop/awesome-obsidian-plugin/unreferenced-attachments/README.md)
 - 元数据：[unreferenced-attachments/manifest.json](file:///c:/Users/A/Desktop/awesome-obsidian-plugin/unreferenced-attachments/manifest.json)
 
 ## 安装指南（通用）
 - 下载或克隆本仓库。
 - 将目标插件文件夹复制到你的库目录：`.obsidian/plugins/<插件ID>/`。
   - 插件 ID 对应文件夹名：`attach-link-rewriter`、`filename-to-title-sync`、`unreferenced-attachments`。
 - 打开 Obsidian → 设置 → 第三方插件 → 打开「允许社区插件」，启用对应插件。
 - 更多插件级配置，请参阅各自的 README。
 
 ## 快速上手（摘要）
 - 附件链接重写器
   - 设置作用范围与目标路径（如需），保持默认模板 `./../{{docName}}/{{attName}}`
   - 选择“文件操作”为「不移动」可只改链接；点击「运行一次」
 - 文件名与标题同步
   - 重命名任一 Markdown 文件，或执行命令「Sync filename to title (Current File)」
 - 未引用附件扫描
   - 设置页点击「开始扫描」，右侧视图展示未被引用的附件，可删除或复制路径
 
 ## 常见问题（通用）
 - 插件未生效？
   - 确认已在设置中启用社区插件与目标插件；满足各自最低版本要求；等待索引完成。
 - 移动端可用吗？
   - 三个插件的 `isDesktopOnly` 均为 false，移动端可用；但交互体验可能与桌面端不同。
 - 是否安全覆盖文件？
   - 涉及「移动/复制」的场景可能覆盖同名文件，请先备份或调整模板避免冲突。
 
 ## 已知问题（汇总）
 - 批量处理体量较大时耗时增加；建议按文件夹分批执行。
 - 附件链接重写器当前仅处理标准 Markdown 内联图片语法与常见图片扩展名。
 - 未引用附件扫描不解析 frontmatter 自定义路径字段，不处理外链。
 
