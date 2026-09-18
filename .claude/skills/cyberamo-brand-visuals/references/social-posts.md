# Social media posts in the CyberAmo style

## Formats

| Use | Template | Size | Notes |
| --- | --- | --- | --- |
| LinkedIn or Instagram feed, square | `social-square.html` | 1080 x 1080 | Safest all-round format |
| LinkedIn or Instagram feed, portrait | `social-portrait.html` | 1080 x 1350 | Most screen space in the feed; best for lists |
| Stories, reels cover, LinkedIn story | `social-story.html` | 1080 x 1920 | Keep content 250px clear of top and bottom |
| X / Twitter, LinkedIn link preview | `social-square.html` with `.canvas` set to 1600 x 900 | 16:9 | Scale type up about 1.3x |
| Carousel (LinkedIn document, Instagram) | one `social-square.html` or `social-portrait.html` per slide | same size for every slide | Slide 1 is the hook, last slide is the call to action |

Export at `--scale 2`. Platforms downscale, and the 2x file keeps the type crisp.

## Anatomy of a post

Top to bottom, in one column:

1. **Eyebrow**: the topic or series name, uppercase, orange. Short.
2. **Headline**: the one idea, 5 to 9 words. One accent word in orange or the
   white-to-teal gradient, not both.
3. **Subhead**: an optional sentence of context.
4. **Panel(s)**: the substance. One panel for a single point, a stack of numbered
   panels for a list, a `.terminal` for a command, a `.num` metric for a stat.
5. **Footer**: `CyberAmo` wordmark left, `cyberamo.work` right.

A post carries one idea. If the brief has five points, that is a five-slide carousel or a
portrait list post with five short items, not five paragraphs.

## Voice on the board

- Plain, direct, professional. No hype words, no exclamation marks in headlines.
- Numbers are specific ("cuts tokens by 40%") rather than vague ("massively reduces").
- Technical terms are fine for this audience (GRC, SOC, EDR, MCP, RAG); spell out anything
  a compliance or operations reader might not know.
- Terminal prompts only when the post is about a command or a workflow.

## Variation without drift

Change the ambient preset, the accent word, the panel count and the layout of the panels
(stack, two-column, metric row). Do not change the palette, the fonts, the footer or the
glass treatment. Consistency across posts is the point of having a brand.

## Carousel specifics

- Same artboard size on every slide, same footer, page indicator optional as `3 / 7` in
  the footer's right slot.
- Slide 1: eyebrow, headline, one line of promise. No panel needed.
- Middle slides: one point each, panel with a number badge.
- Last slide: summary or call to action, the site URL larger than usual.
- Render each slide to `slide-01.png`, `slide-02.png`, and so on; for a LinkedIn document,
  combine into a PDF only if the user asks (the pdf skill can do it).
