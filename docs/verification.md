# Local verification — November 13–14, 2026

- Node 24.14.0; npm 11.9.0.
- `npm ci` completed in a clean temporary directory using the repository's exact package and lock files. The install reported zero vulnerabilities.
- `npm run check`: zero errors, warnings, or hints.
- `npm run build`: five static pages generated successfully.
- `npm test`: seven tests passed, covering content, static routes, shelf geometry, lift easing, idle motion, ripple propagation, and player timing.
- `npm run test:browser`: six Chromium tests passed, including the complete opening/loading/reverse flow, cancel/replay, keyboard selection, mobile pointer gestures, reduced motion, fallback, direct reading with JavaScript disabled, wheel scrolling without document movement, and Canvas persistence across profile/collection navigation.
- Screenshots inspected at 1440 × 1000 and 390 × 844. The actual in-app browser was also used to inspect the collection and settled player/details view.
- Reference frames were extracted with FFmpeg; the revised case orientation was checked against an enlarged frame at 5 seconds.

## Limits

- The production build reports a chunk larger than 500 kB for the Three.js scene. It is dynamically imported on entry to the collection; the profile and static project pages do not require it.
- Safari, Firefox, real touch hardware, sustained mobile GPU performance, and exact visual equivalence to the reference are not certified by these checks.
- Chromium full-viewport screenshots intermittently omitted the static WebGL content; element-targeted capture and the actual in-app browser showed the player. Interaction tests and live rendering were checked separately from screenshot capture.
- Project hardware results are source-based summaries, not newly reproduced experiments.
- No deployment, commit, push, pull request, or visibility change was performed.
