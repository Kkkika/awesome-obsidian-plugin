'use strict';
const { Plugin, Modal, FuzzySuggestModal, Notice, PluginSettingTab, Setting } = require('obsidian');
class FolderPicker extends FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChooseCb = onChoose;
  }
  getItems() {
    const items = [];
    const root = this.app.vault.getRoot();
    const walk = (folder) => {
      items.push(folder.path);
      folder.children.forEach(f => {
        if (f.children) walk(f);
      });
    };
    walk(root);
    return items;
  }
  getItemText(item) {
    return item;
  }
  onChooseItem(item) {
    this.onChooseCb(item);
  }
}
class FilePicker extends FuzzySuggestModal {
  constructor(app, onChoose) {
    super(app);
    this.onChooseCb = onChoose;
  }
  getItems() {
    return this.app.vault.getMarkdownFiles().map(f => f.path);
  }
  getItemText(item) {
    return item;
  }
  onChooseItem(item) {
    this.onChooseCb(item);
  }
}
class OptionsModal extends Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.scope = 'current';
    this.op = 'none';
    this.type = 'images';
    this.template = './../{{docName}}/{{attName}}';
    this.path = '';
  }
  onOpen() {
    const c = this.contentEl;
    c.empty();
    const makeRow = (label) => {
      const row = c.createDiv({ cls: 'alm-row' });
      row.createEl('div', { text: label });
      return row.createDiv({ cls: 'alm-field' });
    };
    const scopeField = makeRow('作用范围');
    const scopeSel = scopeField.createEl('select');
    ['current','file','folder'].forEach(v => {
      const o = scopeSel.createEl('option', { text: v==='current'?'当前文件':v==='file'?'选择文件':'选择文件夹' });
      o.value = v;
    });
    scopeSel.value = this.scope;
    scopeSel.onchange = () => {
      this.scope = scopeSel.value;
      pathWrap.toggle(this.scope !== 'current');
    };
    const pathWrap = makeRow('目标路径');
    const pathInput = pathWrap.createEl('input', { type: 'text', placeholder: '输入或选择路径' });
    const btn = pathWrap.createEl('button', { text: '浏览' });
    const refreshPick = () => {
      if (this.scope === 'file') {
        new FilePicker(this.app, p => { this.path = p; pathInput.value = p; }).open();
      } else if (this.scope === 'folder') {
        new FolderPicker(this.app, p => { this.path = p; pathInput.value = p; }).open();
      }
    };
    btn.onclick = () => refreshPick();
    pathInput.onchange = () => { this.path = pathInput.value; };
    pathWrap.toggle(this.scope !== 'current');
    const typeField = makeRow('附件类型');
    const typeSel = typeField.createEl('select');
    [{v:'images',t:'图片'},{v:'all',t:'全部'}].forEach(x => {
      const o = typeSel.createEl('option', { text: x.t });
      o.value = x.v;
    });
    typeSel.value = this.type;
    typeSel.onchange = () => { this.type = typeSel.value; };
    const opField = makeRow('文件操作');
    const opSel = opField.createEl('select');
    [{v:'none',t:'不移动'},{v:'move',t:'移动'},{v:'copy',t:'复制'}].forEach(x => {
      const o = opSel.createEl('option', { text: x.t });
      o.value = x.v;
    });
    opSel.value = this.op;
    opSel.onchange = () => { this.op = opSel.value; };
    const tplField = makeRow('链接格式');
    const tplInput = tplField.createEl('input', { type: 'text', value: this.template });
    const hint = c.createDiv();
    hint.setText('可用变量：{{docName}} {{attName}} {{attBase}} {{ext}}');
    const submit = c.createEl('button', { text: '开始' });
    submit.onclick = () => {
      this.template = tplInput.value || this.template;
      this.onSubmit({ scope: this.scope, path: this.path, type: this.type, op: this.op, template: this.template });
      this.close();
    };
  }
}
class SettingsTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName('作用范围').addDropdown(dd => {
      dd.addOption('current', '当前文件');
      dd.addOption('file', '选择文件');
      dd.addOption('folder', '选择文件夹');
      dd.setValue(this.plugin.settings.scope);
      dd.onChange(async v => {
        this.plugin.settings.scope = v;
        await this.plugin.saveSettings();
        this.display();
      });
    }).setDesc('选择处理范围：当前文件/指定文件/指定文件夹。选择文件或文件夹时，需要在下方“目标路径”中指定库内相对路径。');
    if (this.plugin.settings.scope !== 'current') {
      new Setting(containerEl).setName('目标路径').addText(t => {
        t.setPlaceholder('输入路径');
        t.setValue(this.plugin.settings.path || '');
        t.onChange(async v => {
          this.plugin.settings.path = v.trim();
          await this.plugin.saveSettings();
        });
      }).addButton(b => {
        b.setButtonText('浏览').onClick(() => {
          if (this.plugin.settings.scope === 'file') {
            new FilePicker(this.app, async p => {
              this.plugin.settings.path = p;
              await this.plugin.saveSettings();
              this.display();
            }).open();
          } else {
            new FolderPicker(this.app, async p => {
              this.plugin.settings.path = p;
              await this.plugin.saveSettings();
              this.display();
            }).open();
          }
        });
      }).setDesc('当“作用范围”为“选择文件/选择文件夹”时生效。支持手动输入或点击“浏览”。示例：Notes/每日.md（文件）或 Assets/图片/（文件夹）。');
    }
    const tplSetting = new Setting(containerEl).setName('链接格式').addText(t => {
      t.setValue(this.plugin.settings.template);
      t.onChange(async v => {
        this.plugin.settings.template = v || this.plugin.settings.template;
        await this.plugin.saveSettings();
      });
    });
    const frag = document.createDocumentFragment();
    const pVars = document.createElement('div');
    pVars.textContent = '可用变量：{{docName}} {{attName}} {{attBase}} {{ext}}';
    frag.appendChild(pVars);
    const ul = document.createElement('ul');
    [
      ['{{docName}}','当前笔记名（不含扩展名）'],
      ['{{attName}}','附件完整文件名（含扩展名）'],
      ['{{attBase}}','附件文件名（不含扩展名）'],
      ['{{ext}}','附件扩展名（小写、无点）']
    ].forEach(([k,v]) => {
      const li = document.createElement('li');
      li.textContent = k + '：' + v;
      ul.appendChild(li);
    });
    frag.appendChild(ul);
    const pDef = document.createElement('div');
    pDef.textContent = '默认：./../{{docName}}/{{attName}}';
    frag.appendChild(pDef);
    const pEg = document.createElement('div');
    pEg.textContent = '示例：文档“项目/周报.md”，引用图片“logo.png”，生成路径为“./../周报/logo.png”。';
    frag.appendChild(pEg);
    tplSetting.setDesc(frag);
    new Setting(containerEl).setName('文件操作').addDropdown(dd => {
      dd.addOption('none', '不移动');
      dd.addOption('move', '移动');
      dd.addOption('copy', '复制');
      dd.setValue(this.plugin.settings.op);
      dd.onChange(async v => {
        this.plugin.settings.op = v;
        await this.plugin.saveSettings();
      });
    }).setDesc('不移动：仅修改笔记中的链接；移动：将附件移至新位置并更新链接；复制：复制附件至新位置并更新链接。若存在同名目标可能被覆盖。');
    const wlSetting = new Setting(containerEl).setName('白名单');
    wlSetting.addText(t => {
      t.setPlaceholder('通过“浏览”添加，自动展示');
      t.setValue((this.plugin.settings.whitelist||[]).join(','));
      if (t.inputEl) t.inputEl.readOnly = true;
    }).addButton(b => {
      b.setButtonText('浏览').onClick(() => {
        new FilePicker(this.app, async p => {
          const norm = p.replace(/^\/+/, '');
          const list = Array.isArray(this.plugin.settings.whitelist) ? this.plugin.settings.whitelist : [];
          if (!list.includes(norm)) list.push(norm);
          this.plugin.settings.whitelist = list;
          await this.plugin.saveSettings();
          this.display();
        }).open();
      });
    }).addButton(b => {
      b.setButtonText('清空').onClick(async () => {
        this.plugin.settings.whitelist = [];
        await this.plugin.saveSettings();
        this.display();
      });
    });
    const descFrag = document.createDocumentFragment();
    const descText = document.createElement('div');
    descText.textContent = '这些笔记将被跳过，不进行修改。路径为库内相对路径，如 Notes/每日.md；使用“浏览”添加，或点击“清空”重置。';
    descFrag.appendChild(descText);
    const nameLine = document.createElement('div');
    nameLine.style.marginLeft = '1.5em';
    descFrag.appendChild(nameLine);
    const list = Array.isArray(this.plugin.settings.whitelist) ? this.plugin.settings.whitelist : [];
    if (!list.length) {
      const empty = document.createElement('div');
      empty.style.marginTop = '1.5em';
      empty.textContent = '当前为空';
      empty.style.marginLeft = '1.5em';
      descFrag.appendChild(empty);
    } else {
      const ul = document.createElement('ul');
      list.forEach(p => {
        const li = document.createElement('li');
        const text = document.createElement('span');
        text.textContent = p;
        const del = document.createElement('button');
        del.textContent = '删除';
        del.style.marginLeft = '8px';
        del.style.fontSize = '12px';
        del.style.padding = '2px 6px';
        del.style.height = '22px';
        del.style.lineHeight = '18px';
        del.onclick = async () => {
          this.plugin.settings.whitelist = list.filter(x => x !== p);
          await this.plugin.saveSettings();
          this.display();
        };
        li.appendChild(text);
        li.appendChild(del);
        ul.appendChild(li);
      });
      descFrag.appendChild(ul);
    }
    wlSetting.setDesc(descFrag);
    new Setting(containerEl).setName('开始执行').addButton(b => {
      b.setButtonText('运行一次').onClick(async () => {
        await this.plugin.run({
          scope: this.plugin.settings.scope,
          path: this.plugin.settings.path,
          type: 'images',
          op: this.plugin.settings.op,
          template: this.plugin.settings.template
        });
      });
    }).setDesc('根据当前配置，对匹配笔记中的内联图片执行一次重写。');
  }
}
function posixJoin(...parts) {
  return parts.join('/').replace(/\/+/g,'/').replace(/\/\.\//g,'/').replace(/(^|\/)[^\/]+\/\.\.\//g,'/').replace(/\/+$/,'');
}
function ensureParent(adapter, path) {
  const idx = path.lastIndexOf('/');
  if (idx <= 0) return Promise.resolve();
  const dir = path.substring(0, idx);
  return adapter.exists(dir).then(ex => ex ? null : adapter.mkdir(dir));
}
function getExt(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.substring(i+1).toLowerCase() : '';
}
function basename(path) {
  const i = path.lastIndexOf('/');
  return i >= 0 ? path.substring(i+1) : path;
}
function withoutExt(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.substring(0, i) : name;
}
function isImageExt(ext) {
  return ['png','jpg','jpeg','gif','webp','svg','bmp','tif','tiff'].includes(ext);
}
module.exports = class AttachmentLinkRewriter extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SettingsTab(this.app, this));
    this.addCommand({
      id: 'rewrite-inline-images-once',
      name: '批量修改内联图片（一次）',
      callback: async () => {
        await this.run({
          scope: this.settings.scope,
          path: this.settings.path,
          type: 'images',
          op: this.settings.op,
          template: this.settings.template
        });
      }
    });
  }
  async loadSettings() {
    this.settings = Object.assign({ scope: 'current', path: '', op: 'none', template: './../{{docName}}/{{attName}}', watch: false, whitelist: [] }, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  matchScope(file) {
    if (!this.settings) return false;
    const scope = this.settings.scope;
    const rawPath = this.settings.path || '';
    const normPath = rawPath.replace(/^\/+/, '');
    if (scope === 'current') {
      const af = this.app.workspace.getActiveFile();
      return af && af.path === file.path;
    }
    if (scope === 'file') {
      if (!normPath) return false;
      return file.path === normPath;
    }
    if (scope === 'folder') {
      if (!normPath) return true;
      const base = normPath.endsWith('/') ? normPath : normPath + '/';
      return file.path.startsWith(base);
    }
    return false;
  }
  isExcludedPath(p) {
    if (!this.settings || !this.settings.whitelist) return false;
    const list = Array.isArray(this.settings.whitelist) ? this.settings.whitelist : [];
    const norm = s => s.replace(/^\/+/, '');
    return list.some(x => norm(x) === norm(p));
  }
  async guardProcess(file) {
    if (this.isExcludedPath(file.path)) return;
    this._processing = this._processing || new Set();
    if (this._processing.has(file.path)) return;
    this._processing.add(file.path);
    try {
      await this.processFile(file, { scope: 'file', path: file.path, type: 'images', op: this.settings.op, template: this.settings.template });
    } finally {
      this._processing.delete(file.path);
    }
  }
  async run(opts) {
    const files = await this.collectTargets(opts);
    if (!files.length) {
      new Notice('未找到目标文件');
      return;
    }
    let changed = 0, affected = 0, skipped = 0;
    for (const f of files) {
      if (this.isExcludedPath(f.path)) { skipped++; continue; }
      const res = await this.processFile(f, opts);
      if (res.modified) changed++;
      affected += res.count;
    }
    new Notice(`完成：修改文件${changed}个，处理链接${affected}处，跳过${skipped}个`);
  }
  async collectTargets(opts) {
    if (opts.scope === 'current') {
      const f = this.app.workspace.getActiveFile();
      return f ? [f] : [];
    }
    if (opts.scope === 'file') {
      const t = this.app.vault.getAbstractFileByPath(opts.path);
      return t && t.extension === 'md' ? [t] : [];
    }
    if (opts.scope === 'folder') {
      const t = this.app.vault.getAbstractFileByPath(opts.path);
      if (!t || !t.children) return [];
      const out = [];
      const walk = (folder) => {
        folder.children.forEach(ch => {
          if (ch.children) walk(ch); else if (ch.extension === 'md') out.push(ch);
        });
      };
      walk(t);
      return out;
    }
    return [];
  }
  async processFile(file, opts) {
    const src = await this.app.vault.read(file);
    let text = src;
    let count = 0;
    const processMatch = async (pathText, start, end, isWiki) => {
      let clean = pathText.trim();
      let aliasSuffix = '';
      let titleSuffix = '';
      if (isWiki) {
        const barIdx = clean.indexOf('|');
        if (barIdx >= 0) {
          aliasSuffix = clean.substring(barIdx);
          clean = clean.substring(0, barIdx);
        }
      } else {
        if (clean.startsWith('<') && clean.endsWith('>')) {
          clean = clean.slice(1, -1).trim();
        }
        const mtitle = clean.match(/^(.+?)(\s+["'][\s\S]*["'])$/);
        if (mtitle) {
          clean = mtitle[1].trim();
          titleSuffix = mtitle[2];
        }
      }
      if (/^(https?:|data:)/i.test(clean)) return null;
      const dest = this.app.metadataCache.getFirstLinkpathDest(clean, file.path);
      if (!dest) return null;
      const ext = getExt(dest.name);
      if (!isImageExt(ext)) return null;
      if (dest.extension === 'md') return null;
      const docName = file.basename;
      const attName = dest.name;
      const attBase = withoutExt(attName);
      const newRel = opts.template
        .replaceAll('{{docName}}', docName)
        .replaceAll('{{attName}}', attName)
        .replaceAll('{{attBase}}', attBase)
        .replaceAll('{{ext}}', ext);
      const parent = file.path.substring(0, file.path.lastIndexOf('/'));
      const newAbs = posixJoin(parent, newRel);
      if (opts.op === 'move') {
        if (dest.path !== newAbs) {
          await ensureParent(this.app.vault.adapter, newAbs);
          await this.app.fileManager.renameFile(dest, newAbs);
        }
      } else if (opts.op === 'copy') {
        if (dest.path !== newAbs) {
          await ensureParent(this.app.vault.adapter, newAbs);
          if (this.app.vault.copy) await this.app.vault.copy(dest, newAbs);
          else await this.app.vault.adapter.copy(dest.path, newAbs);
        }
      }
      const finalPath = isWiki ? (newRel + aliasSuffix) : (newRel + titleSuffix);
      text = text.substring(0, start) + finalPath + text.substring(end);
      return finalPath.length - (end - start);
    };
    const mdImg = /!\[[^\]]*?\]\(([^)]+)\)/g;
    const runRegex = async (re, isWiki) => {
      let m;
      while ((m = re.exec(text)) !== null) {
        const idx = isWiki ? 1 : 1;
        const s = m.index + (isWiki ? 2 : m[0].indexOf('(') + 1);
        const e = s + m[idx].length;
        const delta = await processMatch(m[idx], s, e, isWiki);
        if (delta !== null) {
          re.lastIndex = e + delta + (isWiki ? 2 : 1);
          count++;
        }
      }
    };
    await runRegex(mdImg, false);
    const modified = text !== src;
    if (modified) await this.app.vault.modify(file, text);
    return { modified, count };
  }
}
