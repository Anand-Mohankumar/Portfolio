# Presentations in the CyberAmo style

## Choose the route

- **The deck must stay editable in PowerPoint**: build a real `.pptx`. Use the `pptx`
  skill if it is available in the session; otherwise use `pptxgenjs` (Node) or
  `python-pptx`, installing whichever is missing. Apply the theme values below.
- **The deck is for viewing only** (a PDF, a LinkedIn document, a talk that will not be
  edited): render each slide from `assets/templates/slide.html` at 1920 x 1080 and
  assemble the PNGs. This gives an exact match to the site's look, since real glass blur
  cannot be reproduced in PowerPoint shapes.

A good hybrid for editable decks: render the *background only* (ambient blobs plus empty
glass panels, text removed) from `slide.html` per layout, set it as the slide background
image, then place editable text boxes on top in the theme fonts and colours. The glass
looks right and the words remain editable.

## Theme values for pptxgenjs / python-pptx

Slide size 16:9 (13.333 x 7.5 in).

| Element | Value |
| --- | --- |
| Background | `#12181A` (or the rendered background PNG) |
| Title font | Google Sans, 36 to 44 pt, bold, `#FFFFFF`, letter-spacing slightly tight |
| Body font | Google Sans, 18 to 24 pt, `#E8EFF5` |
| Secondary text | `#E8EFF5` at 72% transparency, or `#B4BDC4` if transparency is unavailable |
| Section label | Google Sans, 11 to 12 pt, bold, all caps, 1.5 pt tracking, `#8C949A` |
| Accent | `#C45A2A`: one accent word, metric numbers, a 4 pt accent bar under the title |
| Secondary accent | `#7EC8C8` for links and a cool highlight |
| Panel shape | Rounded rectangle, radius 0.16 in, fill `#282D37` at 55% (or 78% behind small text), line `#FFFFFF` at 12% opacity, 0.75 pt, no shadow |
| Card shape | Rounded rectangle, radius 0.12 in, fill `#FFFFFF` at 4%, line `#FFFFFF` at 8% |
| Pill | Rounded rectangle, full radius, fill `#FFFFFF` at 6%, line `#FFFFFF` at 12%, 12 pt text |
| Code | Fira Code or Consolas, 14 to 16 pt, `#D6DEE5` on `#0A0F14` at 60%, prompt in `#4CD964` |
| Footer | `CyberAmo` (Amo in `#C45A2A`) left, `cyberamo.work` right, 11 pt, `#8C949A` |

If Google Sans is not embedded, PowerPoint substitutes on machines without it; Inter or
Segoe UI are acceptable fallbacks and should be named as such in the deck's theme fonts.

## Slide layouts

- **Title**: eyebrow, headline (accent word), one-line subtitle, footer. Ambient preset 1.
- **Section**: like title, with a large muted section number.
- **Three points**: headline plus three panels in a row (template default).
- **Two column**: text panel left, chart or code panel right.
- **Metric row**: three or four `.num` panels, each with a one-line caption.
- **Terminal**: a single deep panel with a command and its output.
- **Closing**: headline, the site URL as the only call to action.

Keep to one idea per slide and to the type floors in `references/readability.md` (slides
are read from the back of a room and from phone screens in a LinkedIn document).

## Charts

Prefer horizontal bars, timelines, process flows, comparison cards and metric cards. One
data colour (`#C45A2A`), a second (`#4CD964`) only for a genuinely second series, gridlines
at 8% white, labels at 80% white. No 3D, no gradients on bars, no pie charts unless the
source had one.
