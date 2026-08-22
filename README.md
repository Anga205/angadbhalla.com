# angadbhalla.com

Personal portfolio site built with Astro.

## Structure

```text
/
├── src/
│   ├── components/
│   │   ├── OpeningSequence.astro   the opening typing sequence
  │   │   └── ProjectCards.astro      the project catalogue
│   ├── pages/
│   │   └── index.astro             document shell
│   └── styles/
│       └── global.css              reset, black canvas, accent
├── tests/
│   ├── opening.spec.ts
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

## The opening sequence

`src/components/OpeningSequence.astro` holds the markup, the styles, and the
script. The comment block at the top of that file documents the state machine
and how to retune the timings. The short version:

- `BASE_MS` (45) is the only speed knob. Typing is `BASE_MS` plus or minus 15ms
  of jitter; backspace is a flat 25ms.
- The order of steps lives in the `STEPS` array. Each entry is `hold`, `frame`,
  `type`, `delete`, `newline`, or `button`.
- `prefers-reduced-motion` skips the typing and shows the button after 1s.
- The final text is server-rendered so the page still reads without JS.

## Styling

Tailwind CSS v4 via `@tailwindcss/vite`. `src/styles/global.css` holds the
`@import 'tailwindcss'` and a small `@theme` block:

- `--color-line` (neutral-800) and `--color-dim` (neutral-500) for terminal
  chrome, plus `--color-accent` (the muted green).
- The canvas is `bg-neutral-900`, set on `<body>`.

Everything else is utility classes in the markup. The only hand-written CSS
left is in the two components' `<style>` blocks, and only for state classes
Tailwind cannot express: `.is-visible`, `.is-leaving`, `.is-ready`, and the
cursor blink keyframes.

## Notes

- Bun only. `bun.lock` is the lockfile.
- Dark only. There is no light mode.
- The font is a self-hosted JetBrains Mono latin subset (~40KB), preloaded from
  the head. No third-party font requests.
- `body { overflow: hidden }` is scoped to the opening sequence. Each section
  is its own fixed, internally scrolling viewport.
- Monaco uses VS Code's built-in `vs-dark` theme, unmodified.


## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
