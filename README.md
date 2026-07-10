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
├── content/blog/*.md          # THE BLOG POSTS — one markdown file per post (file name = URL slug)
├── content.config.ts          # blog frontmatter schema (validates every post at build time)
├── data/tags.js               # tag registry + accent colors (schema only allows these tags)
└── pages/                     # home (deep) + about, portfolio, blog, blog/[slug], proof, contact
```

## Status

Home + intro are built out; the other pages are scaffolded on the shared shell with real content
where provided and clearly-marked placeholders elsewhere. The contact form has no backend yet.

## Writing a new post from via phone

Posts are plain markdown files — the whole flow works from the GitHub mobile app:

1. In the GitHub app, open this repo on the `nexus` branch and go to
   `src/content/blog/`.
2. Add a new file. **The file name becomes the URL**: `my-new-post.md` publishes
   at `breachd.org/blog/my-new-post`. Use lowercase words separated by hyphens,
   ending in `.md`. (Don't rename a file after it's published — that changes its URL.)
3. Paste this template at the top and fill it in:

   ```markdown
   ---
   title: My new post
   date: 2026-07-09
   tags: [cybersecurity]
   excerpt: "One or two sentences shown on the card in the feed."
   draft: true
   ---

   Write the post here in normal markdown. Blank line between paragraphs.
   Headings (##), **bold**, links, lists, and code blocks all work.
   ```

4. Commit. Pushing to `nexus` triggers the deploy runner, which rebuilds and
   publishes the site automatically — no other steps.

Details:

- **tags** must come from the registry in `src/data/tags.js`
  (currently: `manifesto`, `cybersecurity`, `anecdote`, `writeup`). A tag that
  isn't registered fails the build with an error naming the file and field —
  that's the typo protection working, not a broken site. The same goes for a
  missing title/excerpt or a malformed date. A failed build never unpublishes
  anything; the site just stays on the previous version until the file is fixed.
- **draft: true** still publishes the post, but visibly marked as a draft
  (a "draft" chip in the feed and a note on the post page). Flip it to
  `draft: false` — or delete the line — when the copy is real.
- **excerpt** is best kept in quotes, as in the template, so punctuation can't
  confuse the frontmatter parser.

## Commands

| Command           | Action                                |
| :---------------- | :------------------------------------ |
| `npm run dev`     | Dev server (default `localhost:4321`) |
| `npm run build`   | Production build to `./dist/`         |
| `npm run preview` | Preview the build locally             |

## Notes

- Respects `prefers-reduced-motion` (skips the intro and the 3D canvas) and scales particle
  count down on small screens.
- Character art lives in `public/img/` (Apex/Respawn fan art — personal/non-commercial use).
- Easter eggs: open the console, try the Konami code (↑↑↓↓←→←→ B A), or tap the wordmark 5×.
