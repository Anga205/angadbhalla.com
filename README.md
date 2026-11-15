# angadbhalla.com

Personal portfolio site built with Astro. Terminal-styled, dark only, no
client-side framework runtime.

## Structure

```text
/
├── src/
│   ├── assets/                     images processed by astro:assets
│   │   ├── angad.jpg               home page portrait
│   │   └── achievements/           gallery photographs
│   ├── components/
│   │   ├── AchievementCard.astro   one achievement tile
│   │   ├── AchievementCards.astro  the /achievements and /university index
│   │   ├── AchievementDetail.astro one long-form achievement page
│   │   ├── AchievementGallery.astro thumbnail grid + lightbox
│   │   ├── LinkMenu.astro          shared <dialog> link menu + its script
│   │   ├── PortfolioMenu.astro     the fixed sidebar rail
│   │   ├── ProjectCard.astro       one project tile
│   │   ├── ProjectCards.astro      the /projects index
│   │   ├── Seo.astro               canonical, OG, Twitter, JSON-LD
│   │   ├── Window.astro            shared GNOME window chrome
│   │   └── icons/                  LeetCode, Discord, and Reddit marks
│   ├── data/
│   │   ├── achievements.ts         achievement catalogue
│   │   ├── contacts.ts             social links
│   │   ├── destinations.ts         sidebar entries
│   │   ├── emailjs.ts              contact form credentials
│   │   ├── profile.ts              identity facts (single source of truth)
│   │   └── projects.ts             project catalogue
│   ├── layouts/
│   │   └── Base.astro              document shell
│   ├── lib/
│   │   ├── llms.ts                 llms.txt renderers
│   │   ├── seo.ts                  schema.org JSON-LD builders
│   │   └── site.ts                 site constants and URL helpers
│   ├── pages/
│   │   ├── index.astro             home
│   │   ├── projects.astro
│   │   ├── university.astro
│   │   ├── achievements.astro
│   │   ├── philosophy.astro
│   │   ├── 404.astro
│   │   ├── achievements/[slug].astro
│   │   ├── university/[slug].astro
│   │   ├── robots.txt.ts           generated robots.txt
│   │   ├── llms.txt.ts             curated LLM index
│   │   └── llms-full.txt.ts        full-content markdown
│   └── styles/
│       └── global.css              reset, black canvas, accent
├── public/                         static files served as-is
├── tests/                          Playwright specs
├── astro.config.mjs                site URL, sitemap, font config
└── playwright.config.ts
```

## Commands

| Command           | Action                                    |
| :---------------- | :---------------------------------------- |
| `bun install`     | Install dependencies                      |
| `bun run dev`     | Dev server at `localhost:4321`            |
| `bun run build`   | Build to `./dist/`                        |
| `bun run preview` | Preview the build                         |
| `bun run check`   | Typecheck with `astro check`              |
| `bun run test`    | Playwright, headless, all three projects  |

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. `src/styles/global.css` holds the
`@import 'tailwindcss'` and a small `@theme` block:

- `--color-line` (neutral-800) and `--color-dim` (neutral-500) for terminal
  chrome, plus `--color-accent` (the muted green).
- The canvas is `bg-neutral-900`, set on `<body>`.

Everything else is utility classes in the markup. The only hand-written CSS
left is in the components' `<style>` blocks, and only for state classes
Tailwind cannot express, such as `.is-ready` on the portrait.

Astro scopes `<style>` blocks to the component that renders the element, so a
card's styles live in the card component, not in the listing that maps over it.

## Images

Images that appear in the page are imported from `src/assets/` and rendered
with `astro:assets` (`<Image>`), which emits responsive AVIF with intrinsic
dimensions. Files in `public/` are served verbatim and are not optimised, so
only icons, the manifest, the 3D model, and the social card live there.

## SEO and discoverability

- `src/components/Seo.astro` is the only place that writes canonical, Open
  Graph, Twitter, and JSON-LD tags. Pages pass `title`, `description`, `path`,
  `type`, and optional `schema` nodes.
- `src/lib/seo.ts` builds the schema.org graph: `Person`, `WebSite`,
  `ProfilePage`, `CollectionPage` + `ItemList`, `CreativeWork`,
  `SoftwareSourceCode`, and `BreadcrumbList`.
- `src/data/profile.ts` is the single source of truth for identity facts, so
  the `Person` schema, `rel="me"` links, and `llms.txt` cannot drift.
- `/robots.txt`, `/llms.txt`, and `/llms-full.txt` are generated from the data
  modules at build time.
- The sitemap comes from `@astrojs/sitemap`; `site` in `astro.config.mjs` is
  the canonical origin.

## Notes

- Bun only. `bun.lock` is the lockfile.
- Dark only. There is no light mode.
- The font is a self-hosted JetBrains Mono latin subset (~40KB), preloaded from
  the head. No third-party font requests.
- `body { overflow: hidden }` keeps the shell fixed. Each section is its own
  internally scrolling viewport.
- The philosophy page's Three.js loop pauses when the tab is hidden or the
  portrait scrolls out of view, and disposes the renderer on `pagehide`.
