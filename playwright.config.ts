import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'list',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'default',
			use: { ...devices['Desktop Chrome'] },
		},
		{
			name: 'reduced-motion',
			use: {
				...devices['Desktop Chrome'],
				reducedMotion: 'reduce',
			},
		},
		{
			name: 'mobile',
			use: { ...devices['Pixel 5'] },
		},
		{
			// Firefox renders 3D transforms differently from Chromium, and the
			// portrait flip depends on that difference (see
			// tests/portrait-flip.spec.ts). Only the specs that care about it
			// run here, so the suite does not double in size.
			name: 'firefox',
			use: { ...devices['Desktop Firefox'] },
			testMatch: /portrait-flip\.spec\.ts/,
		},
	],
	webServer: {
		command: 'bun run dev',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			...(process.env as Record<string, string>),
			// Stop Astro from auto-backgrounding when it detects an agent host.
			ASTRO_DEV_BACKGROUND: '0',
		},
	},
});
