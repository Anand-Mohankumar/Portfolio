# Converting an existing infographic to the CyberAmo style

This is a re-skin, not a redesign. The reader of the new version must find every fact,
number, label and grouping of the old one, in the same order, and find it easier to read.

## 1. Inventory the source

Open the source image with the Read tool. Write a content inventory before writing any
HTML, because it is the checklist you will grade the result against:

```
Title: ...
Subtitle / intro: ...
Sections (in reading order):
  1. <label> — <heading> — <body points> — <numbers/metrics> — <visual: icon | chart | diagram | table>
  2. ...
Callouts / metrics that stand alone: ...
Footer / source / attribution: ...
Layout: <e.g. 3 x 2 grid, numbered flow left to right, central hero with satellites>
```

Read numbers twice. If a value in the source is unreadable, say so in the reply and leave
a clearly marked placeholder rather than guessing.

## 2. Map the layout

Keep the same reading order and grouping. Each section of the source becomes one `.panel`.
Nested items become `.card` elements inside it. Standalone metrics become `.panel.accent`
with a `.num`. Numbered steps use `.step-num`.

Charts and diagrams: rebuild them in HTML and CSS (bars with `.bar`, flows with rows of
panels and arrows, tables as real tables). Keep the same data. Do not invent new chart
types.

Illustrations: when the source has drawn artwork (characters, objects, scenes, illustrated
icons) that the user wants kept, crop it out of the source with the background knocked
out, and place it in an `.illus` slot inside the relevant panel so it floats on the glass.
Estimate the crop box from the Read view of the image (coordinates are source pixels; a
generous margin is fine, the background is removed anyway) and run:

```
pwsh .claude/skills/cyberamo-brand-visuals/scripts/crop.ps1 -Source "<image>" -OutDir work/crops -Transparent -Crops "robot:20,300,200,220;gauge:590,140,200,130|600,250,80,20"
```

How the knockout works, so you can predict it: every pixel reachable from the crop's
border through light, smoothly varying colour becomes transparent, with anti-aliased
edges. Outlined artwork survives because the fill cannot cross a dark outline. Two dials:

- `@tolerance,minLum` per crop (or `-Tolerance` / `-MinLum` globally; defaults 16,150).
  Pastel section washes need the defaults or looser (`@22,95` removes a saturated
  gradient tile). Pale, unoutlined artwork (soft pink brains, watercolour) needs tighter
  (`@8,228`) so only near-white paper goes.
- Erase boxes `|x,y,w,h` after a crop, for caption text that sits inside the box. Source
  captions are dark, so once the paper is gone they become unreadable smudges on glass:
  erase them and carry their words into the panel copy instead.

Always render, then look at every crop on the board: dark leftover text, a stray frame
line, a rectangular ghost of a source card, or specks from a soft shadow all mean another
erase box or a threshold change. Reference the crops from the HTML with relative paths
(`crops/robot.png`). Give the slot a fixed height per row so rows align, and never let an
illustration push the text below its size floor. Small decorative icons that carry no
information can be dropped or replaced with an emoji in an `.icon-tile`. If a crop cannot
be cleaned (busy photo background), add `.paper` to the slot to fall back to a light tile.

Landscape site infographics are 1376 x 768. If the content needs more room at the type
floors, use `--height auto` and let the board grow; a taller image is fine in the gallery.

## 3. Build from the template

Copy `assets/templates/infographic.html` to a working file next to the skill's
`assets/theme.css` (so the relative stylesheet link resolves) or inline the CSS. Fill it
from the inventory. Keep the brand footer.

Then check `references/readability.md` and adjust: type floors, line length, panel opacity
behind dense text, no text over the bright blob centre.

## 4. Render and compare

```
python .claude/skills/cyberamo-brand-visuals/scripts/render.py work.html out.png --width 1376 --height auto --scale 2 --thumb 400
```

Open both the source and the export with the Read tool and go through the inventory line
by line. Fix and re-render until every line is present and every number matches.

## 5. File placement (site gallery)

The site keeps the directory and the UI one to one (see `CLAUDE.md`):

- Full-size image: `infographics/AI/<Category>/<Name>.png`
- Thumbnail (400px wide): `infographics/thumbnails/AI/<Category>/<Name>.png`
- The `infographic-item` in `index.html` under the matching window points at both.

Replacing an existing infographic in place: keep the exact filename for both the full-size
and thumbnail, so `index.html` needs no change. Adding a new one: add both files and a new
`infographic-item` block. Keep the pre-conversion original somewhere outside `infographics/`
if the user wants it kept; the gallery only holds the branded version.

## 6. Report

Tell the user what was preserved, what was restructured for readability (for example a
2-column split of a long panel), and anything that could not be read from the source.
