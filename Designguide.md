# Portfolio Theme Design Guide

## Purpose

This guide defines a reusable visual system for building websites and webapps that match the existing `index.html` portfolio theme. The style is a dark, OS-inspired, glassmorphism interface with a cybersecurity and knowledge-work personality. It should feel like a polished desktop environment: compact, interactive, technical, and calm.

Use this guide for future portfolio pages, article interfaces, dashboards, resource galleries, tools, and webapps such as Markdownify.

## Color System

### Core Colors

| Role | Color | Usage |
| --- | --- | --- |
| Charcoal base | `#12181A` | Main background, page body, deep surfaces |
| Near black | `#0A0F14` | Terminal panels, source views, deepest cards |
| Glass surface | `rgba(40, 45, 55, 0.55)` | Main window cards |
| Glass dock/topbar | `rgba(20, 25, 30, 0.6)` | Dock, navigation, floating controls |
| Orange accent | `#C45A2A` | Primary accent, active dots, glow, important actions |
| Teal accent | `#1F4F55` | Secondary accent, identity gradients, cool contrast |
| Bright teal link | `#7EC8C8` | Links, breadcrumbs, subtle highlights |
| Text primary | `#E8EFF5` | Main readable content |
| White primary | `rgba(255, 255, 255, 0.95)` | UI titles and high-emphasis labels |
| Text secondary | `rgba(255, 255, 255, 0.7)` | Supporting text |
| Text muted | `rgba(255, 255, 255, 0.5)` | Metadata, disabled labels |
| Hairline border | `rgba(255, 255, 255, 0.08)` | Separators and card borders |
| Strong border | `rgba(255, 255, 255, 0.18)` | Active or hover borders |

### System Colors

Use these sparingly for state:

| Role | Color |
| --- | --- |
| Success | `#50FA7B` or `#28CA41` |
| Warning | `#FFBD2E` |
| Error / close | `#FF5F57` |
| Code command green | `rgba(87, 231, 128, 0.08)` background with green text |

### Gradients

Use gradients as accents, not as full-page decoration.

Recommended identity gradient:

```css
background: conic-gradient(from 0deg, #C45A2A, #1F4F55, #12181A, #C45A2A);
```

Recommended text gradient:

```css
background: linear-gradient(135deg, #E8EFF5 0%, #7EC8C8 100%);
```

Recommended card sheen:

```css
background: linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
```

## Typography

### UI Font

Preferred:

```css
font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif;
```

For article pages and long-form reading, `Outfit` also matches the existing lecture-note pages well:

```css
font-family: 'Outfit', system-ui, sans-serif;
```

### Monospace Font

Use mono fonts for terminal, code, Markdown source, command snippets, and diagnostic states.

Preferred:

```css
font-family: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
```

### Type Scale

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| App title / page title | `2rem` | `700` | Use for focused article/document titles |
| Window title | `14px` | `600` | Compact title-bar label |
| Section heading | `16px` | `600` | Use inside windows and panels |
| Card title | `14px` | `500` | Resource tiles, article rows |
| Body text | `14px` | `400` | Default compact app text |
| Metadata | `12px` | `400` or `500` | Secondary labels |
| Terminal/code | `13px` | `400` | Mono surfaces |

Letter spacing should be subtle. Use `0.3px` to `0.5px` for compact UI labels and `1px` only for uppercase section labels.

## Layout Principles

### Desktop Workspace

The default layout should feel like a desktop:

- Full viewport dark background.
- Fixed topbar.
- Main content area with generous padding.
- Floating glass windows.
- Optional bottom dock for primary sections.
- Panels can overlap, stack, minimize, or expand where appropriate.

Recommended page structure:

```html
<body>
  <canvas id="webgl-bg"></canvas>
  <div class="desktop">
    <header class="topbar"></header>
    <main class="content-area"></main>
    <nav class="sidebar"></nav>
  </div>
</body>
```

### Content Widths

Use these as defaults:

- Main window: `min(900px, 95vw)`.
- Reading page: `900px`.
- Compact tool panel: `320px` to `420px`.
- Full editor window: `calc(100vw - 40px)` by `calc(100vh - 160px)`.

### Spacing

| Token | Value | Usage |
| --- | --- | --- |
| `space-1` | `4px` | Tiny gaps, icon-label spacing |
| `space-2` | `8px` | Button groups, dense controls |
| `space-3` | `12px` | Card padding, form gaps |
| `space-4` | `16px` | Standard panel spacing |
| `space-5` | `20px` | Toolbar and window padding |
| `space-6` | `24px` | Card grids, larger sections |
| `space-8` | `32px` | Reading body sections |
| `space-10` | `40px` | Desktop content padding |

## Surfaces

### Main Window Card

Use for primary app panels.

```css
.window-card {
  background: rgba(40, 45, 55, 0.55);
  backdrop-filter: blur(40px) saturate(160%);
  -webkit-backdrop-filter: blur(40px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  color: #fff;
}
```

Active state:

```css
.window-card.active {
  border-color: rgba(255, 255, 255, 0.25);
}
```

### Topbar

Use for persistent navigation and document status.

```css
.topbar {
  height: 50px;
  background: rgba(20, 25, 30, 0.3);
  backdrop-filter: blur(25px) saturate(180%);
  -webkit-backdrop-filter: blur(25px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Dock

Use for primary sections or apps.

```css
.dock {
  background: rgba(20, 25, 30, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  box-shadow:
    0 15px 35px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}
```

### Reading Card

Use for article pages and lecture notes.

```css
.reading-card {
  max-width: 900px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 4px 6px rgba(0,0,0,.18),
    0 20px 60px rgba(0,0,0,.45),
    inset 0 1px 0 rgba(255,255,255,.06);
}
```

## Components

### Window Header

Window headers should include a title and controls. Use compact padding and a subtle top sheen.

```css
.card-header {
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.03), transparent);
  border-radius: 16px 16px 0 0;
}
```

### Window Controls

Use familiar traffic-light controls:

- Red for close.
- Yellow for minimize.
- Green for maximize.

For the portfolio app, controls can be glass circles with icon glyphs rather than flat color-only dots.

### Buttons

Buttons should be compact, glassy, and icon-forward.

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 36px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
```

Primary buttons may use the orange accent as a glow or border, but should not become large solid orange blocks unless the action is rare and important.

### Tabs

Tabs should feel like small active windows.

```css
.tab {
  padding: 6px 12px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
}

.tab.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}
```

### Resource Cards

Use for project tiles, article entries, galleries, and tools.

```css
.resource-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.resource-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
```

### Tags

Tags can be pill-shaped when they represent metadata, skills, filters, or categories.

```css
.tag {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}
```

### Terminal / Source Panels

Use a deeper background and mono font.

```css
.terminal-panel {
  background: rgba(10, 15, 20, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #ccc;
}
```

## Article Styling

Long-form article pages should prioritize readability inside the dark theme.

```css
.article-body {
  color: rgba(232, 239, 245, 0.82);
  line-height: 1.75;
}

.article-body h1,
.article-body h2,
.article-body h3 {
  color: #E8EFF5;
  font-weight: 600;
}

.article-body h2 {
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.article-body a {
  color: #7EC8C8;
  text-decoration: none;
}

.article-body a:hover {
  text-decoration: underline;
}

.article-body code {
  font-family: 'JetBrains Mono', monospace;
  background: rgba(87, 231, 128, 0.08);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}
```

Images should be rounded, bordered, and grounded on dark surfaces:

```css
.article-body img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(0, 0, 0, 0.2);
}
```

## Motion

Motion should feel smooth and physical, but never distracting.

Recommended easing:

```css
transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
```

For window stacking:

```css
transition:
  transform 0.45s cubic-bezier(0.19, 1, 0.22, 1),
  opacity 0.45s ease;
```

Use motion for:

- Dock entry.
- Window activation.
- Hover lift.
- Tooltip appearance.
- Button focus.
- Loading or boot sequences.

Avoid constant decorative animation in reading or writing surfaces.

## Responsive Behavior

### Desktop

- Floating windows are allowed.
- Dock sits at the bottom center.
- Topbar remains fixed.
- Cards can use grid layouts.

### Tablet

- Reduce content padding.
- Keep topbar scrollable if there are many tabs.
- Windows should stay within viewport.
- Toolbars may wrap into two rows.

### Mobile

- Use stacked windows rather than overlapping windows.
- Dock remains bottom-centered but more compact.
- Cards become full width.
- Reduce window border radius only if space is tight.
- Hide nonessential labels, preserve icons and tooltips where possible.
- Writing and reading content should get priority over decoration.

Recommended mobile content padding:

```css
.content-area {
  padding: 55px 12px 90px 12px;
}
```

## Accessibility

- Maintain strong contrast between text and glass surfaces.
- Do not rely on color alone for state.
- Provide visible focus states.
- Use real buttons for controls.
- Add labels or tooltips for icon-only controls.
- Keep body text at least `14px` in app UI and larger for long reading.
- Avoid blur-heavy surfaces behind dense text unless a dark overlay supports readability.

## Implementation Tokens

Use these CSS custom properties for new projects:

```css
:root {
  --color-bg: #12181A;
  --color-bg-deep: #0A0F14;
  --color-surface: rgba(40, 45, 55, 0.55);
  --color-surface-soft: rgba(255, 255, 255, 0.04);
  --color-surface-hover: rgba(255, 255, 255, 0.08);
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.18);
  --color-text: #E8EFF5;
  --color-text-ui: rgba(255, 255, 255, 0.95);
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-muted: rgba(255, 255, 255, 0.5);
  --color-accent-orange: #C45A2A;
  --color-accent-teal: #1F4F55;
  --color-link: #7EC8C8;
  --radius-window: 16px;
  --radius-card: 12px;
  --radius-control: 10px;
  --radius-pill: 20px;
  --shadow-float: 0 15px 35px rgba(0, 0, 0, 0.3);
  --font-ui: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, sans-serif;
  --font-reading: 'Outfit', system-ui, sans-serif;
  --font-mono: 'Fira Code', 'JetBrains Mono', 'Courier New', monospace;
}
```

## Usage Guidance

For portfolio sections, use the full OS metaphor: dock, windows, tabs, boot sequence, and floating cards.

For article pages, use the quieter reading-card pattern: centered content, dark page background, glass article shell, clear headings, and minimal controls.

For tools and webapps, combine both: a desktop shell with practical, compact panels. The first screen should be the actual tool, not an explanatory landing page.

For Markdownify specifically, the editor should use:

- A full-height glass application window.
- A compact topbar for article title and status.
- A Microsoft Word-like toolbar translated into the portfolio's glass control language.
- A calm writing canvas with Markdown syntax hidden by default.
- Mono source panels only when the user asks to inspect Markdown.

The result should feel native to the portfolio: a serious technical tool running inside Anand's interactive desktop world.

