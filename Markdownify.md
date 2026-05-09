# Markdownify

## Product Idea

Markdownify is a focused writing webapp for people who want the portability and structure of Markdown without having to remember Markdown syntax. The user writes and formats articles in a rich-text editor that behaves like a lightweight Microsoft Word workspace. Behind the scenes, every action produces clean Markdown, while the visible document immediately shows the article as it would appear when published.

The core promise is simple: write visually, store universally.

## Problem

Markdown is excellent for publishing, documentation, blogs, technical notes, GitHub content, static sites, and AI-friendly knowledge bases. The friction is that many writers either forget the syntax or dislike seeing formatting marks while drafting. Traditional Markdown editors often split the screen into raw Markdown on one side and preview on the other, which still forces the user to think about syntax.

Markdownify removes that split. It treats Markdown as the storage and publishing layer, not the authoring burden.

## Target Users

- Technical writers creating documentation, tutorials, release notes, and internal knowledge-base articles.
- Security, AI, and engineering professionals who want structured notes that can later live in GitHub, static sites, or documentation portals.
- Bloggers and portfolio owners who want polished articles without using a heavyweight CMS.
- Students and researchers who want exportable notes with headings, tables, links, images, code blocks, and citations.
- Teams that want Markdown compatibility but prefer a familiar document editor interface.

## Core Experience

The app opens into a desktop-like writing workspace inspired by the existing portfolio theme. The article appears inside a glass window with a compact title bar, top toolbar, formatting groups, document canvas, outline/sidebar, and status area.

The user never needs to type Markdown syntax manually. If they select text and press Bold, the editor applies bold styling in the visible document and writes `**selected text**` in the Markdown model. If they choose Heading 1, the visual line becomes a large heading and the underlying Markdown becomes `# Heading`.

The article surface should feel calm, direct, and publication-minded. It is not a marketing page. It is the actual writing tool on the first screen.

## Key Principle

Markdownify should maintain two synchronized representations:

- The visual document model shown to the user.
- The Markdown document model used for storage, export, versioning, and publishing.

The user interacts with the visual model. The app continuously serializes that model into Markdown.

## Workspace Layout

### Topbar

A slim glass topbar mirrors the portfolio's operating-system feel. It includes:

- App logo or document icon.
- Current article title.
- Autosave state.
- Word count and reading time.
- Export, preview, and publish controls.
- Optional workspace clock or profile menu.

### Ribbon Toolbar

The toolbar should feel like a compact document editor, not a developer IDE. It is grouped by Markdown capability:

- Document structure.
- Inline formatting.
- Blocks.
- Lists.
- Links and media.
- Tables.
- Code.
- Utilities.

Each control is a button, dropdown, segmented control, or menu. Buttons should use recognizable icons first, with tooltips for clarity.

### Editor Canvas

The editor is a rich-text writing area that displays the final rendered form of the article. Markdown syntax stays hidden by default. The writing surface should support:

- Direct text editing.
- Multi-line selection.
- Drag-and-drop image insertion.
- Slash command insertion for blocks.
- Keyboard shortcuts.
- Paste cleanup from websites or documents.
- Undo and redo.
- Mobile-friendly selection and formatting.

### Side Panels

Optional side panels can appear as smaller glass windows or docked panes:

- Article outline generated from headings.
- Markdown source view.
- Metadata panel.
- Publishing settings.
- Asset library.
- Revision history.

The default writing mode should stay uncluttered.

## Markdown Formatting Features

### Headings

Toolbar controls:

- Paragraph.
- Heading 1.
- Heading 2.
- Heading 3.
- Heading 4.
- Heading 5.
- Heading 6.

Markdown output:

```markdown
# Heading 1
## Heading 2
### Heading 3
```

### Inline Formatting

Toolbar controls:

- Bold.
- Italic.
- Bold italic.
- Strikethrough.
- Inline code.
- Link.

Markdown output:

```markdown
**bold**
*italic*
***bold italic***
~~strikethrough~~
`inline code`
[link text](https://example.com)
```

### Block Formatting

Toolbar controls:

- Blockquote.
- Horizontal rule.
- Code block.
- Callout-style blockquote.
- Plain paragraph.

Markdown output:

````markdown
> Quote text

---

```js
console.log("hello");
```
````

### Lists

Toolbar controls:

- Bulleted list.
- Numbered list.
- Checklist.
- Indent.
- Outdent.

Markdown output:

```markdown
- Item
- Item

1. First
2. Second

- [ ] Task
- [x] Done
```

### Tables

Toolbar controls:

- Insert table.
- Add row.
- Add column.
- Delete row.
- Delete column.
- Align left, center, or right.

Markdown output:

```markdown
| Name | Status | Owner |
| --- | --- | --- |
| Article draft | In progress | Anand |
```

### Media

Toolbar controls:

- Insert image.
- Add image alt text.
- Insert video link.
- Insert attachment link.

Markdown output:

```markdown
![Alt text](image.png)
```

### References

Toolbar controls:

- Footnote.
- Citation-style link.
- Anchor link.

Markdown output:

```markdown
Here is a statement with a footnote.[^1]

[^1]: Footnote detail.
```

## Advanced Writing Features

### Slash Commands

Typing `/` opens a command palette for inserting Markdown blocks:

- Heading.
- Table.
- Code block.
- Quote.
- Checklist.
- Image.
- Divider.
- Footnote.

This gives power users speed without exposing raw syntax.

### Source Mode

Source mode reveals the Markdown for users who want to inspect or edit it directly. It should be a deliberate mode, not the default. Source edits should immediately update the visual article.

### Split Preview Mode

A secondary mode can show:

- Rich editor on the left.
- Generated Markdown on the right.

This is useful for teaching, debugging, and advanced publishing workflows.

### Article Metadata

Each article can support front matter:

```markdown
---
title: "Article Title"
description: "Short summary"
tags: ["markdown", "writing", "docs"]
status: "draft"
---
```

The user edits this through a friendly metadata panel, not raw YAML by default.

### Version History

Since Markdown is plain text, Markdownify can support lightweight versioning:

- Local autosave timeline.
- Named snapshots.
- Diff view.
- Restore previous version.
- Export revision as Markdown.

### Publishing Flow

Publishing options:

- Copy Markdown.
- Download `.md`.
- Export HTML.
- Export PDF.
- Publish to a static website.
- Commit to a Git repository.
- Push to a documentation system.

The first version should prioritize export and download. Integrations can come later.

## Interaction Model

### Formatting Selection

When the user selects text and clicks a toolbar button:

1. The selected content is transformed in the rich-text document.
2. The underlying Markdown representation is updated.
3. The toolbar state reflects the current selection.
4. The editor stays focused so writing can continue.

### Empty Selection

When no text is selected:

- Bold, italic, strikethrough, and code toggle typing state.
- Heading controls apply to the current block.
- List controls convert the current paragraph into a list item.
- Link opens a small popover for URL and label.
- Image opens upload or URL input.

### Keyboard Shortcuts

Recommended shortcuts:

- `Ctrl+B` for bold.
- `Ctrl+I` for italic.
- `Ctrl+K` for link.
- `Ctrl+Alt+1` through `Ctrl+Alt+6` for headings.
- `Ctrl+Shift+7` for numbered list.
- `Ctrl+Shift+8` for bulleted list.
- `Ctrl+Shift+C` for code block.

## Technical Architecture

### Editor Engine

Use a proven rich-text editor framework that supports custom serialization:

- TipTap or ProseMirror for highly controlled document models.
- Lexical for a modern editor foundation.
- Milkdown if Markdown-first behavior is preferred.

The best fit is likely TipTap/ProseMirror because it gives a structured document tree, strong extension support, and reliable Markdown serialization.

### Markdown Pipeline

The app should maintain a clean conversion pipeline:

- Rich-text document state.
- Markdown serializer.
- Markdown parser.
- Preview renderer.
- Sanitized HTML output for publishing.

Suggested libraries:

- `prosemirror-markdown` or editor-specific serializer.
- `remark` and `unified` for Markdown processing.
- `rehype-sanitize` for safe HTML rendering.
- `shiki` or `highlight.js` for code highlighting.

### Data Model

Article object:

```json
{
  "id": "article_001",
  "title": "Untitled Article",
  "markdown": "# Untitled Article",
  "document": {},
  "metadata": {
    "description": "",
    "tags": [],
    "status": "draft"
  },
  "createdAt": "",
  "updatedAt": ""
}
```

The Markdown string should be the canonical export format. The structured document can be cached for editor performance.

## MVP Scope

The minimum useful version should include:

- Rich-text editor canvas.
- Toolbar for headings, bold, italic, strikethrough, inline code, links, lists, blockquote, horizontal rule, code block, image, and table.
- Live Markdown generation.
- Source mode.
- Copy Markdown.
- Download Markdown.
- Autosave in browser storage.
- Article title and basic metadata.
- Responsive layout.
- Portfolio-inspired visual theme.

## Future Enhancements

- AI-assisted editing, summarization, and title generation.
- Grammar and clarity suggestions.
- GitHub publishing.
- Static site export.
- Team comments.
- Collaborative editing.
- Templates for tutorials, incident reports, research notes, blogs, and documentation pages.
- Custom article themes.
- Markdown linting.
- Content outline scoring.
- Link checker.
- Reading-time and accessibility checks.

## Design Direction

Markdownify should look like it belongs beside the existing portfolio. The interface should reuse the same visual DNA:

- Dark charcoal workspace.
- Frosted glass windows.
- Compact OS-style topbar.
- Mac-like window controls.
- Orange and teal accents.
- Subtle glowing active states.
- Mono styling for code and Markdown source.
- Smooth motion that supports focus.

The app should feel like a professional writing cockpit: technical, polished, quiet, and inviting.

## Product Positioning

Markdownify is not "another Markdown editor." It is a syntax-free Markdown writing environment. It gives writers the confidence of a familiar document editor while preserving the long-term usefulness of Markdown.

The strongest tagline:

Write like Word. Save as Markdown.
