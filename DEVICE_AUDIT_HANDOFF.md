# Device UI Audit Handoff

## Purpose

Continue the device and UI audit of Anand Mohankumar’s portfolio (`https://cyberamo.work/`). The initial audit requested prioritized findings. In the implementation follow-up, the user authorized local fixes, asked to preserve the visuals, highlighted the first-load dock reveal, and reported flickering even while idle. This document retains the original evidence and records the implementation and its verification separately.

This document summarizes the prior audit and leaves room for the next agent to form an independent view before accepting or revising any findings.

## Work completed

- Read the repository guidance supplied by the user and the Product Design audit workflow.
- Inspected the published site in the Codex in-app browser at desktop size. Followed Home → Projects → Resources → AI & Automation → Prompts → Image Generation Prompts.
- Used isolated Chrome sessions with platform user-agent strings and viewport/touch settings:
  - macOS Safari UA: 1440×900 and 1280×720
  - iPhone Safari UA: 393×852, touch enabled
  - Android Chrome UA (Pixel profile): 412×915, touch enabled
- Captured Home, empty desktop, and prompt-flow screenshots. Saved layout and runtime diagnostics.
- Verified that the tested profiles had no horizontal document overflow and no browser console/page errors during the sampled flow.
- Verified that touch taps navigate through the prompt path, tapping the image reveals its prompt overlay, and Copy Prompt changes to “Copied!” on both mobile profiles.
- Made no changes to project source files.

## Findings to validate and prioritize

1. **P2 — Dock overlaps window content at shorter desktop heights.** At 1280×720, the Home window ends at y=660 and the dock begins at y=624, a 36 px overlap. The screenshot shows the dock covering lower profile content. Review the window height/vertical positioning and dock clearance in `styles.css` around `.window-card` (line 769).
2. **P2 — Mobile clock is not hidden as intended.** The mobile rule targets `#clock`, but the actual widget is `#desktopClock`. At both phone viewports, the empty desktop displays the large clock; the CSS comment says to hide it on mobile. Compare `styles.css` around line 1799 with `index.html` around line 36.
3. **P2 — Prompt window header is cramped on phones.** In the prompt view, the title wraps and the dynamically-added “Close all” label wraps to two lines next to the window controls. Inspect `styles.css` around `.card-header`, `.card-controls`, and `.global-close-all-btn`, plus `script.js` around line 729.
4. **P2 — Dock hover tooltip remains over content after a touch tap.** The Home tooltip appears above the tapped dock item and can cover lower content. The tooltip is shown by the hover rule in `styles.css` around line 426. Confirm on actual touch browsers before deciding whether to suppress hover styling for coarse pointers.
5. **P2 / UX opportunity — Nested mobile views accumulate as full-width cards.** The active prompt view is placed first, while its open parent windows remain stacked below it. This appears to be intentional behavior in the current mobile layout, so assess whether the stack is a bug or an acceptable windowing design before proposing changes.
6. **P2 accessibility risk — Dock navigation is not semantic keyboard navigation.** Dock entries are clickable `<div>` elements without button semantics or keyboard focus. Source locations include `index.html` around line 1369 and `script.js` around line 823. This was identified by source inspection and was not a complete keyboard or assistive-technology test.

## Evidence

Audit artifacts and diagnostics are saved here:

`C:\Users\ADVNTR\.codex\visualizations\2026\10\11\01a12909-ae89-7551-b80e-d631106abb27\device-audit\`

Key files:

- `diagnostics.json`
- `viewport-diagnostics.json`
- `ios-iphone-safari-ua-empty.png`
- `ios-iphone-safari-ua-home-open.png`
- `ios-iphone-safari-ua-prompts.png`
- `android-pixel-chrome-ua-empty.png`
- `android-pixel-chrome-ua-home-open.png`
- `android-pixel-chrome-ua-prompts.png`
- `macos-safari-ua-home.png`
- `macos-safari-ua-prompts.png`
- `macos-safari-ua-short-home-open.png`

## Important limits

The iOS and macOS profiles used Safari user-agent strings inside Chrome. They test the responsive CSS and UA-dependent behavior, but do not test Safari/WebKit rendering. Android and iPhone were emulated, not run on physical devices. Browser emulation does not establish real-device GPU, battery, thermal, keyboard, safe-area, or dynamic browser-chrome behavior. No performance benchmark or full accessibility audit was performed.

The follow-up user request authorizes implementation in this repository. No fixes have been published to the live site. The user asked to review once local work and QA are complete.

## Suggested next steps

1. Re-open the screenshots and diagnostics above; independently verify the six findings and adjust severity based on impact.
2. Distinguish confirmed defects from deliberate OS-style behavior, especially the mobile window stack and hover tooltip.
3. If available, repeat key checks in real Safari/WebKit and on physical iPhone/Android devices. At minimum, test landscape orientation, short viewport heights, zoom/text scaling, keyboard navigation, and reduced-motion behavior.
4. Measure perceived and actual performance on representative mobile hardware, especially background animation and glass blur. Current UA emulation is not enough to make a “snappy on phones” claim.
5. Return an independent prioritized recommendation set to the user before implementation. The user wants to discuss fixes after the findings are clear.

## Independent assessment and implementation — October 11, 2026

The existing glass surfaces, typography, colors, icons, resource hierarchy and desktop metaphor remain the visual reference. This work changes motion, window lifecycle, responsive constraints and interaction behavior. It adds no framework, build step or production dependency.

| Original finding | Independent assessment | Local implementation |
| --- | --- | --- |
| Short desktop dock overlap | Confirmed from the published 1280×720 view. | Window height, centering, stack offsets and drag bounds reserve space for the top bar and dock, including the bottom safe area. Home now ends at y=608; dock begins at y=624.72. |
| Mobile clock selector | Confirmed in source and viewport inspection. | The mobile rule targets `#desktopClock`. |
| Cramped mobile prompt header | Confirmed from the published phone view. | Titles can wrap; controls keep their width; Close all stays on one line. Editor document controls move onto another row on narrow screens. |
| Sticky touch hover tooltip | Confirmed as a CSS risk; this run does not emulate a coarse pointer. | Hover lift and tooltip rules require a fine pointer with hover. Keyboard focus retains a visible label. Actual touch behavior still needs physical-device verification. |
| Stacked mobile parent windows | Retained as deliberate windowing behavior. | Active windows move to the top without smooth workspace scrolling or scroll-anchor jumps. Cards no longer shrink to fit the stack. |
| Keyboard navigation | Confirmed in source. | Dock, generated tabs, project menus and clickable resource tiles support Enter/Space and labels. The 57 window controls are native buttons. |

### Additional issues addressed

- **Dock reveal changed size in several stages.** Width/height/padding transitions and forced dock reflows caused an awkward final expansion. The dock now keeps its final layout throughout a single 650 ms surface reveal, with shorter icon transitions. The boot sequence is quicker on both first and repeat visits; reduced motion bypasses the decorative sequence.
- **Window animations had competing completion timers.** Closing, minimizing and immediately reopening could leave stale callbacks that hid a restored window. One cancellable motion record now owns each window transition. Temporary clipping is cleared on completion; interrupted actions, breakpoint changes and dragging cancel obsolete callbacks.
- **Window coordinates mixed anchors.** Dragging, foreground changes, maximizing and restoring now share center-based positioning and workspace bounds. Desktop windows retain dragged positions across foreground changes, with clamping after resize. Phone windows open immediately without the desktop clipping animation.
- **Close all was recreated during a press.** Its parent comparison checked the window rather than the controls container. The correct comparison preserves the existing button in the active window. Tabs also retain their DOM nodes and keyboard focus across updates.
- **Mobile scrolling could paint windows above the top bar.** Window z-indices start at 1000; the top bar was at 90. It is now above windows and below the dock, so navigation remains visible when content scrolls under it.
- **Prompt dismissal could fail after Copy Prompt.** Blurring only the image left the Copy button focused inside the overlay. Disclosure is now explicit for click/keyboard activation; Escape clears the open state, blurs the active descendant, and suppresses hover reopening until the pointer leaves. The image also has intrinsic dimensions to avoid layout movement during decoding.
- **Short landscape editor could appear blank.** Its toolbar and large heading margin consumed the available height. Short desktop viewports cap and scroll the toolbar, reduce editor padding and remove the first heading's top margin. The floating New Document control moves to the corner in that constrained layout.
- **Resizing a paused background cleared its canvases.** Canvas dimensions are now changed only when necessary and both layers repaint immediately after resize. Adaptive quality no longer resizes the field twice.
- **Idle flicker reported by the user.** The WebGL field draws on alternate animation frames and pauses while covered, but its drawing buffer previously allowed clearing after presentation. It now retains the last rendered frame so glass-layer repaints can reuse it. This is a targeted mitigation; the exact user-observed flash was not reproduced in the captured pre-fix samples. The [WebGL specification](https://registry.khronos.org/webgl/specs/latest/1.0/) documents the buffer-clearing behavior and the possible performance cost of retaining it. The field remains at its existing low resolution; hardware performance still needs device testing.
- **Clock caused needless idle DOM changes.** Time/date nodes now update only when their displayed text changes.
- **Returning to Home replayed its stagger.** Reordering the mobile stack restarted completed CSS entrance animations, briefly hiding profile text. Each finished hero entrance is now marked complete and does not replay when the window moves or reopens.
- **Unnecessary nested blur on window controls.** Removed from traffic-light and Close all controls; their parent window already supplies the glass backdrop.

### Verification completed

The follow-up used the local static server at `http://127.0.0.1:8765/` in the Codex in-app Chromium browser. It tested viewport geometry, not Safari user-agent profiles or real touch devices.

| Viewport | Horizontal document overflow | Dock fits viewport | Result |
| --- | --- | --- | --- |
| 1440×900 | None | Yes | Desktop window fits reserved workspace. |
| 1280×720 | None | Yes | 16.72 px between Home and dock. |
| 1024×600 | None | Yes | 16.72 px dock clearance. |
| 852×393 | None | Yes | 16.72 px dock clearance; editor heading and controls visible. |
| 820×1180 | None | Yes | Desktop/tablet window fits. |
| 768×1024 | None | Yes | Mobile stack; clock hidden. |
| 393×852 | None | Yes | Phone stack; clock hidden. |
| 412×915 | None | Yes | Phone stack; clock hidden. |
| 320×568 | None | Yes | All six dock icons fit; editor header controls fit. |

Interaction checks passed for rapid close/reopen and minimize/restore on desktop; dragging and reactivating a positioned window; maximize/restore; mobile promotion to the first card with scroll reset; Enter/Space navigation; prompt disclosure, copying and Escape dismissal; Close all; and editor Visual/Raw switching. Returning to and reopening Home also keeps all eight profile elements visible after their first entrance, verified in mobile and desktop layouts. Iframe teardown and reduced-motion branches were inspected in source; they were not exercised as complete browser flows in this run.

Both JavaScript files pass `node --check`. HTML inspection found 51 unique IDs, 57 labeled native window-control buttons and 18 lazy images inside initially closed windows. The CRLF-aware Git whitespace check passes. No page warnings/errors appeared in the sampled final local flow. Sixteen consecutive post-fix idle screenshots showed continuous background color, with no black-frame alternation; this sample is not a frame-rate benchmark or proof across GPUs.

### Flow evidence and notes

Current-run evidence is saved under:

`C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/`

1. **Home — healthy in the tested desktop viewport.** Content scrolls within the window and clears the dock. Keyboard activation works. The larger background and avatar animations still need hardware performance checks.

![Home with dock clearance](C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/13-final-desktop.png)

2. **Projects — healthy in the tested phone viewport.** Folder buttons remain legible and the active card leads the stack. The visible tooltip in this keyboard/fine-pointer capture is not evidence of a touch tooltip.

![Projects on a phone viewport](C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/07-after-mobile-projects.png)

3. **Resources — healthy.** Single-column folder tiles fit without horizontal overflow. Scrolling is required for Latest Articles, consistent with the existing layout.

![Resources on a phone viewport](C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/08-after-mobile-resources.png)

4. **AI & Automation — healthy.** Folder choices and articles remain readable; navigation preserves the parent windows.

![AI and Automation](C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/09-after-mobile-ai.png)

5. **Prompts — healthy.** Category disclosure and the Image Generation button fit; the header accommodates controls without wrapping Close all.

![Prompts category](C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/10-after-mobile-prompts-menu.png)

6. **Image Generation Prompts — healthy in sampled interactions.** Image sizing is stable; opening, copying, dismissing and restoring work. The final screenshot below is after copying and Escape: the image is visible again and the top bar remains above scrolled content. Real touch hover behavior remains unverified.

![Prompt image after dismissal](C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/14-final-mobile.png)

7. **Markdownify — healthy with a constrained landscape workspace.** The header, toolbar and first heading are visible; the document scrolls. A 393 px tall desktop viewport necessarily leaves a shallow editor. Narrow phone headers use multiple rows instead of pushing controls outside the window.

![Markdownify in short landscape](C:/Users/ADVNTR/.codex/visualizations/2026/10/11/01a1293d-809c-78c2-939e-54be9f05c8b8/device-audit/15-final-landscape.png)

`viewport-checks.json` contains the final geometry matrix. `idle-before-*.png` and `idle-after-*.png` contain the idle samples. `16-review-preview.png` shows the final Home view after the entrance replay fix at the browser's normal pane size. Earlier screenshots represent intermediate implementation states; `17-final-desktop.png` was rejected as visual evidence because its emulated capture was blurred.

### Remaining review limits

The user should review the local dock reveal and idle rendering now that QA is complete. Safari/WebKit, physical iPhone/Android, software keyboards, notch safe areas, dynamic browser chrome, text scaling, screen readers, runtime reduced motion and representative GPU performance have not been established by this viewport run. A useful device follow-up is: cold load → idle for a minute → Home → resource/prompt chain → copy/dismiss → minimize/restore → rotate → editor. No deployment or commit was performed.
