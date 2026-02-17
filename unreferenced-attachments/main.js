const { Plugin, Notice, PluginSettingTab, Setting, ItemView, FuzzySuggestModal } = require("obsidian");

const UNREF_VIEW_TYPE = "unref-view";
const DEFAULT_SETTINGS = {
  ignoreFolders: [],
};

class UnrefItemView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.paths = [];
  }
  getViewType() {
    return UNREF_VIEW_TYPE;
  }
  getDisplayText() {
    return "未引用附件";
  }
  async setState(state, result) {
    this.paths = (state && state.paths) ? state.paths : [];
    await super.setState(state, result);
    this.render();
  }
  onOpen() {
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    const title = contentEl.createEl("h2", { text: `未被引用的附件 (${this.paths.length})` });
    const actions = contentEl.createDiv({ cls: "unref-actions" });
    const copyBtn = actions.createEl("button", { text: "复制路径列表" });
    copyBtn.addEventListener("click", async () => {
      const text = this.paths.join("\n");
      await navigator.clipboard.writeText(text).catch(() => {});
      new Notice("已复制到剪贴板");
    });
    if (this.paths.length === 0) {
      contentEl.createEl("p", { text: "未找到未被引用的附件" });
      return;
    }
    const ul = contentEl.createEl("ul");
    this.paths.forEach((p) => {
      const li = ul.createEl("li");
      const wrap = li.createDiv({ cls: "item-line" });
      const a = wrap.createEl("a", { text: p, href: "#" });
      a.addEventListener("click", (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(p, "", true);
      });
      const delBtn = wrap.createEl("button", { text: "删除" });
      delBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ok = window.confirm(`确认删除：\n${p}`);
        if (!ok) return;
        try {
          const af = this.app.vault.getAbstractFileByPath(p);
          if (!af) {
            new Notice("文件不存在");
            return;
          }
          if (this.app.vault.trash) {
            await this.app.vault.trash(af, true);
          } else {
            await this.app.vault.delete(af);
          }
          this.paths = this.paths.filter((x) => x !== p);
          li.remove();
          title.setText(`未被引用的附件 (${this.paths.length})`);
          new Notice("已删除");
        } catch (err) {
          new Notice("删除失败");
        }
      });
    });
  }
}

class UnreferencedAttachmentsPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(UNREF_VIEW_TYPE, (leaf) => new UnrefItemView(leaf, this));
    this.addSettingTab(new UnrefSettingTab(this.app, this));
  }
  isAttachment(file) {
    return file.extension && file.extension.toLowerCase() !== "md";
  }
  listUnreferenced() {
    const normIgnores = (this.settings?.ignoreFolders || [])
      .map((s) => s.trim().replace(/^[\\/]+|[\\/]+$/g, "").toLowerCase())
      .filter(Boolean)
      .map((s) => (s.endsWith("/") ? s : s + "/"));
    const isIgnored = (p) => {
      const lp = p.toLowerCase();
      for (const pre of normIgnores) {
        if (lp === pre.slice(0, -1) || lp.startsWith(pre)) return true;
      }
      return false;
    };

    const allFiles = this.app.vault.getFiles();
    const mdFiles = allFiles.filter(
      (f) => f.extension.toLowerCase() === "md" && !isIgnored(f.path)
    );
    const attachments = allFiles.filter(
      (f) => this.isAttachment(f) && !isIgnored(f.path)
    );
    const referenced = new Set();
    const mc = this.app.metadataCache;
    for (const md of mdFiles) {
      const cache = mc.getFileCache(md);
      if (!cache) continue;
      const collect = (arr) => {
        if (!arr) return;
        for (const it of arr) {
          const dest = mc.getFirstLinkpathDest(it.link, md.path);
          if (dest && this.isAttachment(dest)) {
            referenced.add(dest.path);
          }
        }
      };
      collect(cache.links);
      collect(cache.embeds);
    }
    const unrefPaths = attachments
      .filter((f) => !referenced.has(f.path))
      .map((f) => f.path);
    this.openUnrefView(unrefPaths);
  }
  openUnrefView(paths) {
    const leaf = this.app.workspace.getRightLeaf(true);
    leaf.setViewState({ type: UNREF_VIEW_TYPE, state: { paths } });
    this.app.workspace.revealLeaf(leaf);
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data || {});
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class UnrefSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  renderIgnoreList(containerEl) {
    const listWrap = containerEl.createDiv();
    listWrap.style.marginLeft = "1.25em";
    const items = (this.plugin.settings.ignoreFolders || []).slice();
    items.forEach((p) => {
      const s = new Setting(listWrap).setName("· " + p);
      s.addExtraButton((btn) =>
        btn
          .setIcon("trash")
          .setTooltip("移除")
          .onClick(async () => {
            this.plugin.settings.ignoreFolders = (this.plugin.settings.ignoreFolders || []).filter((x) => x !== p);
            await this.plugin.saveSettings();
            this.display();
          })
      );
    });
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "未引用附件扫描" });
    new Setting(containerEl)
      .setName("白名单文件夹")
      .setDesc("浏览选择需要忽略的文件夹")
      .addButton((btn) =>
        btn
          .setButtonText("添加目录")
          .onClick(async () => {
            const modal = new FolderPickerModal(this.app, async (picked) => {
              const set = new Set(this.plugin.settings.ignoreFolders || []);
              if (!set.has(picked)) {
                set.add(picked);
                this.plugin.settings.ignoreFolders = Array.from(set);
                await this.plugin.saveSettings();
                this.display();
              }
            });
            modal.open();
          })
      );
    this.renderIgnoreList(containerEl);
    new Setting(containerEl)
      .setName("执行扫描")
      .setDesc("扫描并列出未被 Markdown 引用的附件")
      .addButton((btn) =>
        btn
          .setButtonText("开始扫描")
          .onClick(() => this.plugin.listUnreferenced())
      );
  }
}

class FolderPickerModal extends FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChooseCb = onChoose;
    this.items = [];
    const root = app.vault.getRoot();
    const acc = [];
    const walk = (folder) => {
      if (folder && folder.children && folder.path) acc.push(folder.path);
      if (folder && folder.children) {
        for (const ch of folder.children) {
          if (ch && ch.children) walk(ch);
        }
      }
    };
    walk(root);
    this.items = acc.filter((p) => p && p !== "/");
  }
  getItems() {
    return this.items;
  }
  getItemText(item) {
    return item;
  }
  onChooseItem(item) {
    if (this.onChooseCb) this.onChooseCb(item);
  }
}

module.exports = UnreferencedAttachmentsPlugin;
module.exports.default = UnreferencedAttachmentsPlugin;
