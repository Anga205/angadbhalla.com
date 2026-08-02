// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
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
