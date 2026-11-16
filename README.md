# Asher Wang — Engineering Portfolio

A local-first, static portfolio with a continuous React/Three.js CD archive. Public project content is generated at build time from Astro content collections and MDX. No backend, runtime GitHub API, analytics, external fonts, or paid service is required.

## Requirements and commands

Use Node.js 24 LTS, version 24.14.0 or newer within major 24 (`.nvmrc`). Dependencies are locked in `package-lock.json`.

```sh
nvm use
npm ci
npm run dev
```

Open the URL printed by Astro, normally `http://localhost:4321`. Current Astro may start a background server in agent environments; `npx astro dev status`, `npx astro dev logs`, and `npx astro dev stop` manage it. To run in the foreground explicitly: `npm run dev -- --foreground`.

```sh
npm run check
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm run preview
```

`npm test` validates generated routes and therefore runs after the build. `ASTRO_TELEMETRY_DISABLED=1` can be set for all commands, especially in restricted environments. CI checks build and browser behavior only; it does not deploy.

## Architecture

- Astro 7 static output, React 19, TypeScript, Tailwind CSS 4.
- Three.js with React Three Fiber 9. The 3D module is loaded only when entering the collection; a single Canvas remains mounted through scene changes.
- GSAP owns one numeric pose and one reversible timeline. React tracks semantic phases; `useFrame` applies the pose. Return ignores intermediate reverse callbacks, prevents overlapping actions, and preserves selection.
- No Drei or external models are necessary. Covers are canvas textures, the disc is ring geometry with a real center hole, the lid pivots at its left hinge, and the player slot is a gap between chassis panels.
- The tray and disc share the same final translation, avoiding a reparenting jump. Decorative geometry uses two instanced meshes and disables raycasting.
- Render-on-demand, capped DPR, one shadow-casting light, and a procedural environment keep the scene bounded. Three.js is a substantial lazy-loaded bundle; there is no full-screen bloom.

```text
src/
  components/Experience.tsx      Persistent interaction shell and accessible UI
  components/scene/             Reusable models, scene, reversible motion timeline
  content/projects/*.mdx        Project metadata and detailed content
  content.config.ts            Validated content schema
  data/profile.ts              Personal information and links
  data/types.ts                Shared project and phase types
  layouts/Layout.astro         Metadata and global document structure
  pages/index.astro            Profile, archive, pre-rendered content, text index
  pages/projects/[slug].astro   Direct static project pages
  styles/global.css            Responsive visual system
public/                        Local static assets
tests/                         Content and browser regression checks
docs/                          Reference analysis and content provenance
```

## Add or edit a project

Add `src/content/projects/my-project.mdx`. Its filename is the URL slug; the MDX body is the detailed content. The schema and shared templates handle the model and page automatically.

```yaml
---
title: "Project title"
shortDescription: "A concise, verifiable description."
category: "Embedded / Real-time systems"
technologies: ["C", "FreeRTOS"]
themeColor: "#66846e"
githubUrl: "https://github.com/your-account/your-project"
displayOrder: 5
---
```

Follow with `## Overview`, `## System architecture`, `## Implementation`, `## Technical challenges`, `## Results`, and `## Source notes`. Use a distinct muted hexadecimal `themeColor`; it drives the case edges, disc, selected indicators, and article accents. Change the expected project count in the content regression test when adding records. Only publish material you own or have permission to share.

## Personal information

Edit contact information in `src/data/profile.ts`. To update the résumé, replace the root-level `resume.pdf` in the public [portfolio-site repository](https://github.com/Asher-BoSiang/portfolio-site) and push to `main`. Pages publishes the replacement at the existing link. When syncing new website builds into the publishing repository, exclude `resume.pdf` to preserve the latest uploaded version.

## Interaction and accessibility

- Enter from **Explore Projects**, then drag, swipe, scroll over the scene, use arrow buttons, or press Left/Right.
- Click a record to select it; click the selected record or **Open project** to start loading.
- **Escape** or **Cancel** reverses the current sequence. **Back to Collection** preserves the record.
- Reduced motion opens content directly and positions the player without a long sequence.
- **Read directly**, **Text index**, and the permanent HTML index bypass 3D.
- `/?no3d` exercises the fallback. WebGL initialization failure or context loss also enables it.
- Static `/projects/<slug>/` pages and the index work with JavaScript disabled.

## GitHub Pages readiness

Static output is in `dist/`. The site URL is `https://asher-bosiang.github.io` and its base defaults to `/`, appropriate for the account's user site. For a repository subpath, build with `PUBLIC_BASE_PATH=/repository-name/ npm run build`. Links and client bundles use Astro's base URL. Confirm the final hostname and repository visibility before deployment. No deployment workflow or hosting registration is included.

## Verification and remaining review

See `docs/verification.md` for executed checks and remaining browser limits, `docs/reference-analysis.md` for frame-based observations and adaptations, and `docs/content-provenance.md` for source limitations. Browser screenshots are generated under ignored `test-results/`. Automated Chromium tests cover the full sequence, reverse/cancel, keyboard, mobile swipe, reduced motion, fallback, direct routes, and no-JavaScript reading. Real mobile devices and Safari still require manual review. The profile portrait and full experience dates need owner input.

No commit, push, pull request, repository visibility change, or deployment is performed by setup or build scripts.
