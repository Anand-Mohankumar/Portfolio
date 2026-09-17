# Profile character assets

Layers for the interactive profile picture on the Home window (`#profileCharacter` in
`index.html`, styles under `.avatar-*` in `styles.css`, behaviour in `initProfileCharacter()`
in `script.js`). All positions in the CSS are percentages of the 1254 px source portrait, so
the rig scales with the avatar.

## Files the site loads

| File | Role |
| --- | --- |
| `base-600.jpg` | The no-iris portrait (600 px copy of the master). Drawn twice: once as the static scene, once masked as the moving figure. |
| `figure-mask-600.png` | Silhouette (head + shirt) applied with CSS `mask-image` to the moving copy. Regenerate with `pwsh scripts/make-figure-mask.ps1`. |
| `left-iris.png`, `right-iris.png` | 256 px iris sprites that follow the cursor inside each eye window. |
| `left-eye-occlusion.png`, `right-eye-occlusion.png` | 145×95 eyelid crops drawn above the iris so lids and lashes hide its edge. They sit at (400,495) and (590,495) on the master. |
| `brows-neutral.png`, `brows-raised.png` | Eyebrow expression overlays (one brow, mirrored for the left side). Neutral is the default; raised crossfades in as the cursor nears the face. |

## `source/`

| File | Role |
| --- | --- |
| `base-no-iris-1254.png` | Master portrait with the irises removed. Input to the mask generator and the reference for every coordinate. |
| `original-photo.png` | The original 894 px profile photo. |
| `placement.json` | Iris centres and recommended travel from the asset package. |
| `brows-furrowed.png` | Optional "thinking" brow state, not wired up. |
