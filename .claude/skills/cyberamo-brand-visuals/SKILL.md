---
name: cyberamo-brand-visuals
description: Create images, social media posts, carousels, infographics, slide decks and other visual files in the CyberAmo brand (the cyberamo.work portfolio look: dark #12181A base, frosted glass panels, rust orange #C45A2A accent, Google Sans), and re-skin existing infographics or slides into that brand without losing any content or readability. Use this skill whenever the user asks for a post, graphic, banner, cover, thumbnail, infographic, carousel, slide, deck or PPT for CyberAmo or the portfolio, asks to "brand", "convert", "restyle" or "match the site" for any image in infographics/, or wants any visual that should look like the website, even if they do not say "brand".
---

# CyberAmo brand visuals

Turn a brief or an existing image into a CyberAmo-branded visual: dark ambient background,
frosted glass panels, rust orange accents, clean white Google Sans. The site at
cyberamo.work is the reference; `Designguide.md` and `BrandStyleGuide.md` in the repo root
are the specs, and this skill packages them into templates, a renderer and checklists.

The two rules that matter most:

- **Readability beats decoration.** Dark glass eats small text. Follow the type floors in
  `references/readability.md`, and when content does not fit, use more space, never smaller
  type.
- **A re-skin keeps every fact.** Converting an existing infographic means the same title,
  sections, numbers and reading order, rebuilt with the brand treatment. Nothing invented,
  nothing dropped.

## How outputs are made

Every raster output starts as an HTML artboard styled with `assets/theme.css` and is
rendered to PNG by a headless Chromium (Edge or Chrome) with `scripts/render.py`. This is
deliberate: HTML gives real backdrop blur, exact colours and proper text layout, and the
same theme feeds every format so posts, infographics and slides match each other and the
site. No Python or Node packages are needed for PNG output.

```
python .claude/skills/cyberamo-brand-visuals/scripts/render.py page.html out.png --width 1080 --height 1080 --scale 2
python .claude/skills/cyberamo-brand-visuals/scripts/render.py board.html out.png --width 1376 --height auto --scale 2 --thumb 400
```

`--height auto` measures the page so long boards are never clipped. `--thumb 400` also
writes the 400px thumbnail the site gallery expects. `scripts/crop.ps1 -Transparent` cuts
illustrations out of a source image with the paper background removed, so a conversion
keeps the original artwork floating on the glass.

## Workflow

1. **Pick the format** and read its reference:
   - Post, story, carousel, banner, cover, thumbnail: `references/social-posts.md`
   - New infographic or converting an existing one: `references/infographic-conversion.md`
   - Slides, deck, PPT: `references/pptx.md`
   Then read `references/readability.md`. It is short and it is where most mistakes are
   caught. Read `references/brand-tokens.md` if you need a colour or rule not covered by
   the template.

2. **Start from the matching template** in `assets/templates/`:
   `social-square.html` (1080x1080), `social-portrait.html` (1080x1350),
   `social-story.html` (1080x1920), `infographic.html` (1376 wide, auto height),
   `slide.html` (1920x1080). Copy it to a working file in the scratchpad or an `out/`
   folder and either keep a relative link to `assets/theme.css` or inline the stylesheet.
   The templates already carry correct sizes, paddings and type scales; change content
   and layout, keep the frame.

3. **Write the content into the artboard.** Use the theme classes (`.panel`, `.card`,
   `.pill`, `.step-num`, `.num`, `.terminal`, `.brand-footer`) rather than inventing new
   styles, so the pieces stay consistent with each other. One idea per post; one section
   per panel on an infographic; one idea per slide.

4. **Render, then look.** Run `render.py`, open the PNG with the Read tool and check it
   against the list in `references/readability.md`: nothing clipped, nothing overlapping,
   type at or above the floor, every number correct. If converting, open the source next
   to it and walk the content inventory. Fix the HTML and re-render until it passes. The
   render takes a couple of seconds, so iterate rather than settle.

5. **Deliver.** Put files where the user asked. For site infographics follow the placement
   rules in `references/infographic-conversion.md` (full size under `infographics/AI/<Category>/`,
   thumbnail under `infographics/thumbnails/AI/<Category>/`, matching `index.html` entry).
   Send the final PNG to the user with SendUserFile when that tool exists. Keep the
   working HTML next to the output so the piece can be edited later.

## Brand essentials (the template does most of this for you)

- Background `#12181A` with two or three heavily blurred colour blobs (orange, dark
  teal, burnt orange) and a soft vignette. Presets `.ambient.preset-1` and `.preset-2`.
- Content lives in glass panels: `rgba(40,45,55,.55)`, blur 40px, 1px border at 12%
  white, 16px radius. Use `.panel.solid` behind dense or small text.
- Orange `#C45A2A` is a highlighter: one accent word, key numbers, step badges, bars.
  If the board looks orange, there is too much.
- Text is white for headlines, `#E8EFF5` for body, 72% white for secondary, 55% white for
  labels. Green `#4CD964` only inside terminal or code elements.
- Google Sans everywhere except code, which is Fira Code or a mono fallback.
- The footer carries the `CyberAmo` wordmark (Amo in orange) and `cyberamo.work`.
- No OS chrome of any kind on exported visuals: no menu bars, docks, window buttons,
  clocks or wallpaper-with-dock. The website is an OS metaphor; the graphics are not.
- Nothing cyberpunk, neon, HUD, matrix, circuit-board or generic-corporate.

## Slides and PPTX

For an editable deck, use the `pptx` skill when available, with the theme values in
`references/pptx.md`; the best-looking route is rendered backgrounds from `slide.html` with
editable text on top. For a view-only deck, render each slide to PNG at 1920x1080.

## When the brief is thin

Ask only if the answer changes the work: the target platform (which decides the format),
and, for a conversion, whether the original should be replaced in the gallery or kept
alongside. Everything else (layout, copy tightening, which word gets the accent) is a
design call: make it, and say what you chose.
