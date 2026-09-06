// @ts-check
import { execFileSync } from 'node:child_process';
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Source file that owns each route, used to derive a real `lastmod` from git
 * instead of stamping every URL with the build time. Dynamic routes point at
 * the data module that generates them.
 *
 * @type {Array<[RegExp, string]>}
 */
const ROUTE_SOURCES = [
	[/^\/$/, 'src/pages/index.astro'],
	[/^\/projects$/, 'src/pages/projects.astro'],
	[/^\/projects\/angadrive$/, 'src/pages/projects/angadrive.astro'],
	[/^\/achievements$/, 'src/pages/achievements.astro'],
	[/^\/achievements\/[^/]+$/, 'src/data/achievements.ts'],
	[/^\/university$/, 'src/pages/university.astro'],
	[/^\/university\/[^/]+$/, 'src/data/achievements.ts'],
	[/^\/philosophy$/, 'src/pages/philosophy.astro'],
];

/** Used when git is unavailable (e.g. a shallow CI checkout without history). */
const FALLBACK_LASTMOD = '2026-11-17';

/** Commit dates, cached per file so each file is asked for once. */
const commitDates = new Map();

/**
 * ISO commit date of the last change to `file`, or the fallback.
 *
 * @param {string} file
 * @returns {string}
 */
function lastCommit(file) {
	if (commitDates.has(file)) return commitDates.get(file);

	let date = FALLBACK_LASTMOD;
	try {
		const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
		if (out) date = out;
	} catch {
		// No git, no history, or not a repository: keep the fallback.
	}

	commitDates.set(file, date);
	return date;
}

/**
 * The source file for a pathname, or undefined for routes we do not map.
 *
 * @param {string} pathname
 * @returns {string | undefined}
 */
function sourceFor(pathname) {
	const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
	return ROUTE_SOURCES.find(([pattern]) => pattern.test(path))?.[1];
}

// https://astro.build/config
export default defineConfig({
	// Canonical origin. Required for absolute URLs in the sitemap, canonical
	// tags, and Open Graph metadata.
	site: 'https://angadbhalla.com',
	// Every route is emitted as `/route/index.html`, so `/route` and
	// `/route/` are the same page. Declaring it keeps canonical URLs stable.
	trailingSlash: 'ignore',
	integrations: [
		sitemap({
			// The 404 page and the generated text endpoints are not pages.
			filter: (page) => !/\/(404|llms(-full)?\.txt|robots\.txt)\/?$/.test(page),
			changefreq: 'monthly',
			// Canonical URLs have no trailing slash (except the root), so the
			// sitemap should not advertise a different form than the pages.
			// `lastmod` comes from the owning file's last commit, so a page that
			// has not changed keeps its old date across deploys.
			serialize: (item) => {
				const { origin, pathname } = new URL(item.url);
				const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
				const source = sourceFor(path);
				return {
					...item,
					url: `${origin}${path}`,
					lastmod: source ? lastCommit(source) : FALLBACK_LASTMOD,
				};
			},
		}),
	],
	// The dev toolbar overlays the bottom navigation on mobile and intercepts
	// clicks in Playwright. It is not part of the site, so keep it off.
	devToolbar: { enabled: false },
	// The contact page is gone; `/contact` still resolves so old links and
	// bookmarks land on the message form at the foot of the home page.
	redirects: {
		'/contact': '/#contact',
	},
	vite: {
		plugins: [tailwindcss()],
	},
	// One font for the whole site: JetBrains Mono, latin subset only.
	// The woff2 is ~40KB and is preloaded from the page head, so the black
	// first paint is never blocked on it. Astro fingerprints and serves the
	// file itself; nothing is fetched from a third party.
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'JetBrains Mono',
			cssVariable: '--font-mono',
			fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
			options: {
				variants: [
					{
						src: ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'],
						weight: '100 800',
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
