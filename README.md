# angadbhalla.com

Personal portfolio site built with Astro.

## Structure

```text
/
├── src/
│   ├── components/
│   │   ├── PortfolioMenu.astro      the fixed sidebar rail
│   │   └── ProjectCards.astro      the project catalogue
│   ├── pages/
│   │   ├── index.astro             home
│   │   ├── projects.astro
│   │   ├── university.astro
│   │   ├── achievements.astro
│   │   └── contact.astro
│   └── styles/
│       └── global.css              reset, black canvas, accent
├── tests/
│   └── routes.spec.ts
├── astro.config.mjs                font config
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
| `bun run test`    | Playwright, headless, both motion modes   |

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. `src/styles/global.css` holds the
`@import 'tailwindcss'` and a small `@theme` block:

- `--color-line` (neutral-800) and `--color-dim` (neutral-500) for terminal
  chrome, plus `--color-accent` (the muted green).
- The canvas is `bg-neutral-900`, set on `<body>`.

Everything else is utility classes in the markup. The only hand-written CSS
left is in the components' `<style>` blocks, and only for state classes
Tailwind cannot express, such as `.is-ready` on the portrait.

## Notes

- Bun only. `bun.lock` is the lockfile.
- Dark only. There is no light mode.
- The font is a self-hosted JetBrains Mono latin subset (~40KB), preloaded from
  the head. No third-party font requests.
- `body { overflow: hidden }` keeps the shell fixed. Each section is its own
  internally scrolling viewport.
- Monaco uses VS Code's built-in `vs-dark` theme, unmodified.


## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
