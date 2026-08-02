# angadbhalla.com

Personal site. Two sections so far: the opening sequence and the code demo.

## Structure

```text
/
├── src/
│   ├── components/
│   │   ├── OpeningSequence.astro   the opening typing sequence
│   │   └── CodeDemo.astro          the live code execution demo
│   ├── data/
│   │   └── snippets.ts             starter code, 4 algorithms x 4 languages
│   ├── pages/
│   │   └── index.astro             document shell
│   └── styles/
│       └── global.css              reset, black canvas, accent
├── tests/
│   ├── opening.spec.ts
│   └── demo.spec.ts
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

## The code demo

`src/components/CodeDemo.astro` calls `POST https://codeapi.anga.codes/v2/execute`
directly from the browser. The API allows all origins, so there is no proxy.

- Requests ask for a 10s timeout and 64MB, well under the API's 60s / 128MB
  maximums, so one visitor cannot exhaust the shared global RAM budget.
- `cpu_time` (nanoseconds) and `memory_used` (kilobytes) are formatted for
  display. `cpu_time` is labelled "runtime" because it is wall-clock time to
  termination.
- The API appends a suffix to its sentinel errors, so `error` for a timeout is
  `"Execution Timed Out\nProcess terminated by signal SIGKILL (9): killed"`.
  Matching is done on the first line.
- Starter snippets live in `src/data/snippets.ts`. Adding an algorithm means
  adding one entry there.
- Monaco loads lazily on an `IntersectionObserver` and uses the lean
  `editor.api` entry with only the python, cpp and java grammars registered.
  The full `monaco-editor` entry pulled in all 81 languages and every worker,
  which came to ~14MB of build output; this is ~3MB.

## Notes

- Bun only. `bun.lock` is the lockfile.
- Dark only. There is no light mode.
- The font is a self-hosted JetBrains Mono latin subset (~40KB), preloaded from
  the head. No third-party font requests.
- `body { overflow: hidden }` is scoped to the opening sequence. Each section
  is its own fixed, internally scrolling viewport.


## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
