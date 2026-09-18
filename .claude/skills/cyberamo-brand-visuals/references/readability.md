# Readability rules for CyberAmo visuals

The brand is dark glass over blurred colour, which is exactly the kind of surface that eats
small text. These rules exist so a rebranded piece is at least as readable as its source.

## Type floors (CSS px at 1x, before the renderer's scale factor)

| Format | Artboard | Headline | Section head | Body | Smallest allowed |
| --- | --- | --- | --- | --- | --- |
| Social square | 1080 x 1080 | 64+ | 36+ | 30+ | 24 (footer) |
| Social portrait | 1080 x 1350 | 64+ | 32+ | 28+ | 24 |
| Story / reel cover | 1080 x 1920 | 80+ | 40+ | 34+ | 28 |
| Site infographic | 1376 x 768 | 44+ | 22+ | 17+ | 15 |
| Long infographic | 1200 x auto | 44+ | 24+ | 18+ | 15 |
| Slide | 1920 x 1080 | 56+ | 30+ | 24+ | 20 |

If the content does not fit at these sizes, the fix is fewer words per panel, more panels,
or a taller artboard (`--height auto`). The fix is never smaller type. When converting an
existing infographic that crammed in tiny captions, keep every fact but let the board grow.

## Contrast

- Body text is `#E8EFF5` or white on glass. Secondary text never drops below 0.7 alpha
  and muted text never below 0.55 alpha, and muted is for labels, not sentences.
- Orange text is for short emphasis (a number, one word, a badge). Orange on dark glass
  is about 4:1, which is fine at 30px+ bold and not fine for paragraphs.
- Green text only in terminal panels or as a status word.
- Text over the bright centre of an orange blob loses contrast. Put it in a panel or
  move the blob. `.panel.solid` (78% opaque) is the safe choice behind dense text.
- Never put text directly on the background without a panel unless it is the headline
  or the footer, which are large and high contrast.

## Measure and rhythm

- Body lines: 45 to 70 characters. A wide panel with long lines needs two columns.
- Line height 1.35 to 1.5 for body, 1.08 for headlines.
- Panel padding at least 1.3x the body font size. Gaps between panels at least 16px.
- Visual hierarchy has three levels at most on one board: headline, section, body. Metric
  numbers can be a fourth, larger level.

## Check the export before calling it done

1. Open the PNG with the Read tool and look at it at full size. Confirm nothing is clipped
   at the bottom, no text overlaps a border, and no panel is empty or orphaned.
2. Look at the thumbnail (or imagine the board at a third of its width): the headline and
   the section labels should still be legible. Body text may soften; it must not vanish.
3. Read every number and label against the source or the brief. Conversion is faithful or
   it is wrong.
4. If anything fails, edit the HTML and re-render. Do not ship a board with known defects
   and describe them in prose.
