# breach:d

A personal creative domain — themed after **Alter** (Apex Legends) with a cyberpunk undertone.
Modern, three.js-forward, ominous-but-mysterious. A place for write-ups, work, easter eggs, and fun.

## Stack

- **Astro 6** (static) + **React islands** (`@astrojs/react`)
- **three.js** via `@react-three/fiber` + `@react-three/drei` — ambient 3D background
- **GSAP** — the drifting-letters intro
- Scoped CSS + a palette of CSS custom properties (see `src/styles/global.css`)

## Structure

```
src/
├── styles/global.css         # design tokens (palette, type), base, shared utilities
├── layouts/Layout.astro       # shared shell: head, fonts, nav, 3D bg, footer, easter eggs
├── components/
│   ├── Nav.astro              # desktop menu selector (bold-from-origin fading separators)
│   └── react/
│       ├── Background.jsx     # mouse-reactive particle field + wireframe "breach" portal
│       ├── Intro.jsx          # drifting "breach:d" intro (once/session, skippable)
│       ├── BlogCarousel.jsx   # 3D carousel, tag filtering, per-tag colored outline
│       └── EyeForm.jsx        # eye-tracking contact form
├── scripts/easter-eggs.js     # console quotes (Alter/Arrival), Konami reveal, tap-the-wordmark
├── data/posts.js              # blog posts + tag colors
└── pages/                     # home (deep) + about, portfolio, blog, blog/[slug], proof, contact
```

## Status

Home + intro are built out; the other pages are scaffolded on the shared shell with real content
where provided and clearly-marked placeholders elsewhere. The contact form has no backend yet.

## Commands

| Command           | Action                                   |
| :---------------- | :--------------------------------------- |
| `npm run dev`     | Dev server (default `localhost:4321`)    |
| `npm run build`   | Production build to `./dist/`            |
| `npm run preview` | Preview the build locally                |

## Notes

- Respects `prefers-reduced-motion` (skips the intro and the 3D canvas) and scales particle
  count down on small screens.
- Character art lives in `public/img/` (Apex/Respawn fan art — personal/non-commercial use).
- Easter eggs: open the console, try the Konami code (↑↑↓↓←→←→ B A), or tap the wordmark 5×.
