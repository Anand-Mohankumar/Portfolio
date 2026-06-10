# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Overview

A personal portfolio for Anand Mohankumar, built as an interactive, OS-themed single-page app. It simulates a desktop environment (boot sequence, topbar, dock, draggable glass windows) entirely in vanilla HTML/CSS/JS — no framework, no bundler, no package manager. Deployed via GitHub Pages to **cyberamo.work** (see `CNAME`, `.nojekyll`).

## Commands

There is no build step for the main site — it is static files served directly.

- **Run locally:** open `index.html` in a browser (no server required), or serve the directory with any static server, e.g. `python -m http.server`.
- **Rebuild lecture-note pages:** `pwsh scripts/build-lecture-notes-v2.ps1`. This reads pre-extracted HTML bodies from `scripts/*.tmp` and regenerates the standalone `index.html` files under `labs-research-and-ctf/lecture-notes/`. The `.tmp` bodies come from `scripts/extract-bodies.ps1`, which strips Evernote-exported HTML.
- No tests, no linter, no CI configured.

## Architecture

The entire desktop UI lives in three root files:

- **`index.html`** — all window markup. Every "app" (Home, Projects, Skills, Terminal, Markdownify) and every nested folder/resource view is a `.window-card` element present in the DOM, shown/hidden by JS. Three external libs are loaded at the bottom: `turndown` + `turndown-plugin-gfm` (HTML→Markdown) and `marked` (Markdown→HTML), both for Markdownify.
- **`styles.css`** — the full glassmorphism design system (dark charcoal base, frosted glass, orange `#C45A2A` / teal `#1F4F55` accents, traffic-light window controls).
- **`script.js`** — all behavior. Key structures near the top:
  - `cards` — map of view name → DOM element (the window for that view).
  - `viewConfig` — the source of truth for windows: each entry has `id`, `parent`, `title`, `icon`. **To add a new window/view, add an entry here AND a matching `*Card` element in `index.html`.** The `parent` field drives breadcrumb/sidebar nesting (the resource hierarchy: projects → labs → labsContent, ai → prompts → image-gen, etc.).
  - Window lifecycle: `showView`, `closeWindow`, `minimizeWindow`, `bringToFront`, `repositionStack`, `initDraggable`. Desktop windows are absolutely positioned and draggable; mobile uses a stacked flex layout (see `constrainAllWindows`).
  - Other subsystems in the same file: WebGL background (GLSL fragment shader, ~line 928), terminal command parser (~line 865), Markdownify editor (~line 1080), and a `MutationObserver`-based auto-sort that keeps resource cards alphabetized (`autoSortAll`, ~line 1357).

### Markdownify

A secondary in-page app (`#markdownifyCard`): a rich-text editor that serializes to Markdown via Turndown and renders via Marked. Has visual/source toggle, a custom undo/redo stack (`MAX_HISTORY = 3`), and toolbar state sync. The full product spec is in `Markdownify.md`.

### Content / resource pages

Resource content lives in topic directories that are linked from the desktop and opened in iframes (`openInIframe` in `script.js`):

- `labs-research-and-ctf/` — Labs, CTF writeups, and `lecture-notes/` (generated HTML, see build command above).
- `ai-and-automation/` — `n8n-workflows/` and `prompts/` (incl. `prompts/Image Generation/`). The AI & Automation windows have buttons for these sections; sections with no content yet are wired to a "coming soon" `alert()` (search `coming soon` in `index.html`). When real content is added, replace that placeholder with a button that opens the proper window/view.
- `infographics/` — image gallery. Full-size PNGs are organized into category subfolders that mirror the website's window nesting: `infographics/AI/{AI Fundamentals, AI Advanced, Codex}/`. `infographics/thumbnails/` mirrors the same subfolder tree (`thumbnails/AI/<Category>/`). In `index.html`, each infographic's thumbnail `<img src>` points at the `thumbnails/AI/<Category>/<file>` path and its `onclick` opens the full-size GitHub raw URL `…/blob/main/infographics/AI/<Category>/<file>?raw=true`. **Whenever folders or files are added to `infographics/`, `index.html` must also be edited so they show up in the UI** (the directory and the site are kept one-to-one):
  - **New image in an existing category** → place the full-size image and its thumbnail under the matching `AI/<Category>/` path in both trees, and add an `infographic-item` (thumbnail `<img src>` + full-size `onclick`) to the correct category window (`#aiFundamentalsCard` / `#aiAdvancedCard` / `#aiClaudeCard`).
  - **New category folder** (or new top-level group) → add a matching `window-card` + `viewConfig` entry and a `resource-hero-card` button wired to `showView('<view>')` inside its parent window, following the existing `#aiFundamentalsCard` / `#aiAdvancedCard` / `#aiClaudeCard` pattern, then populate it with `infographic-item`s.

These nested pages are standalone HTML that reuse the root `styles.css` (with local overrides to re-enable scrolling, since the desktop shell disables body scroll).

### Directory ↔ website correlation (important)

The on-disk folder layout mirrors the navigation in the site **and** the deployed URL paths on cyberamo.work one-to-one. The directory path *is* the URL path, and the site's window-and-button nesting reproduces the directory tree. The mapping is structural:

| Directory concept | Website representation |
| --- | --- |
| A **folder** | A `window-card` (`<div class="window-card" id="<name>Card">`) plus a `viewConfig` entry whose `parent` points at the folder's parent window |
| A **subfolder** inside a folder | A `resource-hero-card` button *inside the parent folder's window*, wired to `onclick="showView('<childView>')"` — clicking it opens the child window, exactly like descending into a subdirectory |
| A **leaf page / article** (an actual `index.html` you can read) | A `resource-hero-card` (and/or `article-item`) button wired to `onclick="window.open('https://cyberamo.work/<path>/', '_blank')"`, or `openInIframe(...)` for embedded external content |

So a folder button does **not** open the content directly — it opens another window that contains the next level of buttons, and only a leaf button navigates to a real page. This button→window→button chain is the on-screen equivalent of `cd`-ing down the folder tree, and `viewConfig[...].parent` encodes the same parent/child links the filesystem does (driving the breadcrumb/sidebar).

**Worked example — the chain matches the directory exactly:**

```
Directory:                              Website (each → is a button click):
ai-and-automation/                      "AI & Automation" window (#aiCard)
  └─ prompts/                             └─ "Prompts" button → showView('aiPrompts') → #aiPromptsCard
       └─ Image Generation/                    └─ "Image Generation Prompts" button → showView('aiImageGenPrompts') → #aiImageGenPromptsCard
            └─ Ride Stats/After.png                  └─ the image + prompt shown inside that window
```

Likewise: the top-level **Resources** window holds buttons for `labs`, `lectureNotes`, `ai`, `infographics` (matching the top-level content folders); the **Labs** button → `labs-research-and-ctf/Labs/` window; **Lecture Notes** button → `labs-research-and-ctf/lecture-notes/` window; **CTF** → `labs-research-and-ctf/CTF/`. A real article like `labs-research-and-ctf/Labs/n8nZeroclaw/index.html` is a leaf, so its button uses `window.open('https://cyberamo.work/labs-research-and-ctf/Labs/n8nZeroclaw/')`.

**When adding content, replicate the structure on both sides:** create the folder/page under the matching directory (the live URL is then just `https://cyberamo.work/<that same path>/`), and in `index.html` either add a leaf button that opens that URL, or — if it is a new sub-level — add a new `window-card` + `viewConfig` entry and a `showView('<newView>')` button inside its parent window.

### Image Generation prompts — repeatable workflow

**Every image added to `ai-and-automation/prompts/Image Generation/` must have an accompanying prompt** (the text used to generate it). Whenever a new image (or images) appears directly in that folder, perform this workflow:

1. **Get the prompt.** If the prompt is missing, ask the user for it. If multiple images were uploaded, ask for the missing prompt of *each* image, referring to each by its image filename.
2. **Summarize the prompt to exactly two words** — this becomes the folder name.
3. **Create a subfolder** named with that two-word summary inside `ai-and-automation/prompts/Image Generation/`.
4. **Move the image** into that new subfolder.
5. **Create `prompt.md`** in the subfolder containing the full prompt text.

The existing `Ride Stats/` subfolder is the reference example: it contains the generated image (`After.png`) and `prompt.md`. (Its `README.md` shows an optional before/after table format.)

**Surface it in the website.** New image+prompt pairs are presented in the "Image Generation Prompts" window (`#aiImageGenPromptsCard` in `index.html`, opened via `showView('aiImageGenPrompts')`). Follow the existing `prompt-showcase` → `prompt-image-container` block: an `<img class="prompt-image">` pointing at the image, a `prompt-overlay` with the full prompt text in a uniquely-id'd `prompt-text` div, and a "Copy Prompt" button wired to `copyPromptText('<that id>', this)`. Duplicate that block per image with a unique id.

### "Latest Articles" list — keep in sync

**Whenever something new is added under `labs-research-and-ctf/`, it must also be added to the "Latest Articles" list.** That list is hardcoded in `index.html` and is **duplicated across multiple window panels** (search `Latest Articles` / `art-meta` — it appears ~7 times). Add the new entry to every copy. Each entry is an `art-meta` row with a date and the relative path, and an `onclick` that opens `https://cyberamo.work/<path>/`. Match the existing format exactly.

## Design system

`Designguide.md` is the authoritative visual spec for the website UI — color tokens, typography (Google Sans UI / Outfit reading / Fira Code mono), spacing scale, surface/component recipes, and responsive rules. **Consult it before adding UI**, and reuse its CSS custom properties and the OS-metaphor patterns (dock, windows, tabs, traffic-light controls) rather than inventing new styles. New pages should match this theme.

`BrandStyleGuide.md` is the authoritative spec for **infographic and visual asset transformation**. When any image, diagram, slide, chart, or other visual is being re-styled into a CyberAmo-branded output, follow this guide exclusively. Its purpose is a faithful glassmorphism re-skin: preserve the original layout and content exactly, then apply the dark background (`#12181A`), frosted glass panels, rust orange accents (`#C45A2A`), and Google Sans typography. It explicitly prohibits OS chrome of any kind (no menu bars, docks, window controls, or taskbars) — the output should look like the original infographic rebuilt with the CyberAmo color palette and glassmorphism, nothing more.
