// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

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
			lastmod: new Date(),
			// Canonical URLs have no trailing slash (except the root), so the
			// sitemap should not advertise a different form than the pages.
			serialize: (item) => {
				const { origin, pathname } = new URL(item.url);
				const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
				return { ...item, url: `${origin}${path}` };
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
