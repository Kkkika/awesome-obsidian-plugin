# Filename to Title Sync Plugin

Automatically synchronize filenames with the `title` field in YAML front matter to maintain consistency between filenames and document titles.

## Overview

This Obsidian plugin automatically updates the `title` field in the YAML front matter of Markdown files when they are renamed. It also provides a manual sync command to ensure title consistency.

## Features

- **Automatic Sync**: Automatically updates the `title` field when Markdown files are renamed
- **Manual Sync**: Integrated with the command palette for on-demand synchronization
- **Cross-platform**: Supports both desktop and mobile versions of Obsidian
- **Smart Detection**: Only processes `.md` files with YAML front matter

## Installation

### Manual Installation
1. Download or clone this repository
2. Place the `filename-to-title-sync` folder into your vault's `.obsidian/plugins/` directory
3. Enable community plugins in Settings → Community Plugins
4. Activate "Filename to Title Sync" from the plugin list

### Update & Uninstall
- **Update**: Replace the plugin folder contents and restart Obsidian
- **Uninstall**: Disable in the plugin list and delete the plugin folder

## Usage

### Automatic Sync
1. Select any Markdown file in your vault
2. Rename the file using F2 or right-click context menu
3. The `title` field in the YAML front matter will automatically update to match the new filename

### Manual Sync
1. Open the command palette (Ctrl/Cmd+P)
2. Execute "Sync current file's filename to title"
3. The current file's title will be updated and a confirmation notification will be displayed

## Configuration Options

Currently, there are no built-in configuration options. To customize the field name, modify `frontmatter['title']` in `main.js` and reload the plugin.

## Troubleshooting

**Q: Why isn't renaming working?**
- Ensure the target file is a `.md` file and the plugin is enabled
- Only rename events and manual commands trigger synchronization
- Requires Obsidian version ≥ 0.15.0

**Q: What happens to files without YAML front matter?**
- Obsidian will automatically create a YAML block and add the `title` field

**Q: Where is the manual command?**
- Access via Command Palette (Ctrl/Cmd+P) → "Sync current file's filename to title"

**Q: Will it overwrite existing `title` values?**
- Yes, this is by design. The plugin maintains title-filename consistency. Avoid using if you need custom titles.

**Q: How does it work with other front matter plugins?**
- Conflicts may occur if other plugins modify the `title` field. Adjust load order or field names as needed.

## Limitations

- Only responds to rename events; batch operations require manual commands
- Limited to Markdown files
- Directly overwrites the `title` field without merge strategy

## Contributing

Issues and feature requests are welcome. Your feedback helps improve this plugin!

---
*Version 1.0.0 | Author: kika | Compatible with Obsidian ≥ 0.15.0*