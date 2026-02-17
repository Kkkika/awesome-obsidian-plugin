const { Plugin, TFile, Notice } = require('obsidian');

module.exports = class FilenameToTitleSyncPlugin extends Plugin {
    async onload() {
        console.log('FilenameToTitleSyncPlugin loaded');

        // 监听文件重命名事件
        this.registerEvent(
            this.app.vault.on('rename', async (file, oldPath) => {
                // 确保是 markdown 文件
                if (file instanceof TFile && file.extension === 'md') {
                    await this.syncTitle(file);
                }
            })
        );

        // 添加命令：手动同步当前文件的文件名到 title
        this.addCommand({
            id: 'sync-filename-to-title-current',
            name: 'Sync filename to title (Current File)',
            checkCallback: (checking) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile) {
                    if (!checking) {
                        this.syncTitle(activeFile);
                        new Notice(`Synced title for ${activeFile.basename}`);
                    }
                    return true;
                }
                return false;
            }
        });
    }

    async syncTitle(file) {
        try {
            await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                // 将 title 字段设置为文件名（不含扩展名）
                frontmatter['title'] = file.basename;
            });
        } catch (e) {
            console.error(`Error syncing title for ${file.path}:`, e);
            new Notice(`Failed to sync title for ${file.basename}`);
        }
    }

    onunload() {
        console.log('FilenameToTitleSyncPlugin unloaded');
    }
};
