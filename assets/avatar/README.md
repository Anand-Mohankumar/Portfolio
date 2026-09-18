# Profile avatar assets

Layers for the interactive profile picture on the Home window (`#profileCharacter` in
`index.html`, styles under `.avatar-*` / `.av-*` in `styles.css`, behaviour in
`initProfileCharacter()` in `script.js`).

All three PNGs share one square canvas (400 px copies of a 1254 px paper-cut portrait),
so they stack with no offsets. The eyes are an inline SVG in `index.html`, drawn in the
same 1254-unit coordinate space and layered on top of the head. 400 px is plenty: the
circle renders at 96 px and zooms to about 140 px, so even 3x screens never need more.

The images are `loading="lazy"`, so they only download once the Home window is opened.

| File | Role |
| --- | --- |
| `head-400.png` | Face, beard and neck. The SVG eyes are drawn on top of this layer. |
| `hair-400.png` | Hair only. Driven by a spring so it lags the head very slightly. |
| `body-400.png` | Shirt. Drawn last so the collar covers the neck when the head moves. |

The full-size sources are not kept in the repo. To replace a layer, export it on the same
square canvas as the others (transparent background) and save it at 400 × 400 under the
same filename.
