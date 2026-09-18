# CyberAmo brand tokens for visuals

Condensed from `Designguide.md` (website UI) and `BrandStyleGuide.md` (visual assets) in the
repo root. When the two disagree, this file follows `BrandStyleGuide.md`, because it is the
spec for images and slides rather than for the interactive site. All values are already
wired into `assets/theme.css`; use the class names rather than restating colours inline.

## Palette

| Role | Value | CSS token | Use it for |
| --- | --- | --- | --- |
| Base background | `#12181A` | `--bg` | Every artboard starts here |
| Deepest surface | `#0A0F14` | `--bg-deep` | Terminal panels only |
| Rust orange | `#C45A2A` | `--orange` | The signature accent: key numbers, one accent word in a headline, step badges, bars, dividers. Never large fills, never body text |
| Burnt orange | `#8B2E0E` | `--orange-deep` | Ambient blob only |
| Dark teal | `#0D3D3A` | `--teal-deep` | Ambient blob only |
| Soft teal | `#1A4A45` | `--teal-soft` | Ambient blob only |
| Teal (identity) | `#1F4F55` | `--teal` | Secondary accent, gradients |
| Bright teal | `#7EC8C8` | `--teal-link` | Links, gradient headline end, a cool highlight |
| Terminal green | `#4CD964` | `--green` | Prompts, code, success markers. Rare |
| Text primary | `#FFFFFF` | `--text` | Headlines and titles |
| Text body | `#E8EFF5` | `--text-body` | Paragraphs |
| Text secondary | `rgba(255,255,255,.72)` | `--text-secondary` | Supporting copy |
| Text muted | `rgba(255,255,255,.55)` | `--text-muted` | Labels, metadata, footers |
| Glass | `rgba(40,45,55,.55)` | `--glass` | Standard panel |
| Glass solid | `rgba(40,45,55,.78)` | `--glass-solid` | Panels holding dense or small text |
| Glass dark | `rgba(20,25,30,.6)` | `--glass-dark` | Secondary panels |
| Glass deep | `rgba(10,15,20,.6)` | `--glass-deep` | Terminal and code |
| Border | `rgba(255,255,255,.12)` | `--border` | Panel edges |
| Hairline | `rgba(255,255,255,.08)` | `--hairline` | Dividers, card edges |

The composition stays dark and neutral. Orange is a highlighter, not a paint bucket: if more
than about a tenth of the artboard reads as orange, pull it back.

## Typography

- UI and display: **Google Sans** (installed locally on the build machine), falling back to
  Inter, then Segoe UI.
- Monospace: Fira Code, JetBrains Mono, Cascadia Code, Consolas. Only for commands, code,
  logs and the `anand@cyberamo:~$` prompt.
- Headlines are weight 700 with slight negative letter-spacing. Section labels are uppercase,
  weight 600, 1.5px tracking, muted colour. Body is weight 400.

## Surfaces and shape

- Every major content group sits in a glass panel: `.panel` (blur 40px, saturate 160%,
  1px border at 12% white, 16px radius, a 1px inner top highlight).
- Smaller nested items use `.card` (4% white fill, hairline border, 12px radius).
- Pills for tags, categories and badges: `.pill`, `.pill.orange`, `.pill.green`.
- Depth comes from layering and blur, not from drop shadows. No heavy shadows.

## Background construction

1. Base `#12181A`.
2. Two or three ambient blobs, blurred 140px, opacity around 0.5: one orange, one dark
   teal, optionally one burnt orange or soft teal. Presets `.ambient.preset-1` and
   `.preset-2` in the theme give balanced placements.
3. A soft vignette so the edges are darker than the centre.

No sharp shapes, patterns, grids, textures, noise, circuit boards, hexagons, glows on text,
or gradients used as full-page decoration.

## What the brand is not

Avoid anything that reads as cyberpunk, neon, hacker terminal, SOC dashboard, sci-fi HUD,
military command centre, gaming UI, RGB, or generic corporate PowerPoint. The feeling is
calm, premium, technical and quiet.

## No OS chrome in exported visuals

The website is an OS metaphor, but exported images and slides are not. Never draw menu
bars, docks, traffic-light window buttons, title bars, clocks, status icons, app launchers
or desktop wallpaper with a dock. Panels are content containers only.

## Motion and interaction

Not applicable to static exports. For the website itself, see `Designguide.md`.
