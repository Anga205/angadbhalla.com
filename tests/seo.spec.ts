import { test, expect } from '@playwright/test';

/**
 * SEO and shareability guarantees.
 *
 * These assert on <head> only: nothing here should ever be visible in the
 * viewport, so a failure means a crawler or a social card is being starved of
 * information.
 */

const PAGES = [
	{ path: '/', title: /Angad Bhalla/ },
	{ path: '/projects', title: /Angad Bhalla/ },
	{ path: '/achievements', title: /Angad Bhalla/ },
	{ path: '/university', title: /Angad Bhalla/ },
	{ path: '/philosophy', title: /Angad Bhalla/ },
	{ path: '/achievements/ieee-cs-iampro-2025', title: /Angad Bhalla/ },
	{ path: '/university/alcoding-club-head', title: /Angad Bhalla/ },
] as const;

test('every page leads its title with the name', async ({ page }) => {
	for (const { path, title } of PAGES) {
		await page.goto(path);
		await expect(page, path).toHaveTitle(title);
		// The name must be the first thing in the title, not buried at the end.
		const text = await page.title();
		expect(text.startsWith('Angad Bhalla'), `${path}: ${text}`).toBe(true);
	}
});

test('every page carries a canonical URL matching its route', async ({ page }) => {
	for (const { path } of PAGES) {
		await page.goto(path);
		const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
		expect(canonical, path).toBe(`https://angadbhalla.com${path === '/' ? '/' : path}`);
	}
});

test('every page has a complete Open Graph and Twitter card', async ({ page }) => {
	for (const { path } of PAGES) {
		await page.goto(path);

		for (const property of [
			'og:type',
			'og:site_name',
			'og:title',
			'og:description',
			'og:url',
			'og:image',
			'og:image:type',
			'og:image:width',
			'og:image:height',
			'og:image:alt',
			'og:locale',
		]) {
			const content = await page
				.locator(`meta[property="${property}"]`)
				.getAttribute('content');
			expect(content, `${path} ${property}`).toBeTruthy();
		}

		for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) {
			const content = await page.locator(`meta[name="${name}"]`).getAttribute('content');
			expect(content, `${path} ${name}`).toBeTruthy();
		}

		// The card must be the large format, or the image is cropped to a square.
		await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
			'content',
			'summary_large_image',
		);
	}
});

test('the social card image is a real, reachable file', async ({ page, request }) => {
	await page.goto('/');
	const src = await page.locator('meta[property="og:image"]').getAttribute('content');
	expect(src).toBe('https://angadbhalla.com/og.jpg');

	// Fetch it through the dev server rather than the absolute URL.
	const response = await request.get('/og.jpg');
	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toContain('image/jpeg');
});

test('structured data parses and names the person on every page', async ({ page }) => {
	for (const { path } of PAGES) {
		await page.goto(path);

		const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
		expect(raw, path).toBeTruthy();

		const data = JSON.parse(raw!);
		expect(data['@context'], path).toBe('https://schema.org');

		const types = data['@graph'].map((node: { '@type': string }) => node['@type']);
		expect(types, path).toContain('Person');
		expect(types, path).toContain('WebSite');

		const person = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'Person');
		expect(person.name, path).toBe('Angad Bhalla');
		expect(person.sameAs.length, path).toBeGreaterThan(3);
	}
});

test('detail pages describe their gallery images as ImageObject nodes', async ({ page }) => {
	await page.goto('/university/alcoding-club-head');

	const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
	const data = JSON.parse(raw!);
	const images = data['@graph'].filter(
		(node: { '@type': string }) => node['@type'] === 'ImageObject',
	);

	expect(images).toHaveLength(2);
	for (const image of images) {
		expect(image.contentUrl).toMatch(/^https:\/\/angadbhalla\.com\//);
		expect(image.description.length).toBeGreaterThan(10);
	}
});

test('the 404 page is not indexed', async ({ page }) => {
	await page.goto('/404');
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
		'content',
		/noindex/,
	);
});

test('robots.txt points at the sitemap and allows AI crawlers', async ({ request }) => {
	const response = await request.get('/robots.txt');
	expect(response.status()).toBe(200);

	const body = await response.text();
	expect(body).toContain('Sitemap: https://angadbhalla.com/sitemap-index.xml');
	expect(body).toContain('GPTBot');
	expect(body).toContain('ClaudeBot');
});

test('llms.txt is a curated index of every section', async ({ request }) => {
	const response = await request.get('/llms.txt');
	expect(response.status()).toBe(200);

	const body = await response.text();
	expect(body).toContain('# Angad Bhalla');
	expect(body).toContain('https://angadbhalla.com/projects');
	expect(body).toContain('https://angadbhalla.com/achievements');
	// Every project should be listed by name.
	expect(body).toContain('AngaDriveV3');
	expect(body).toContain('Code Execution API');
});

test('llms-full.txt carries the long-form prose', async ({ request }) => {
	const response = await request.get('/llms-full.txt');
	expect(response.status()).toBe(200);

	const body = await response.text();
	expect(body).toContain('## Projects');
	expect(body).toContain('GraphRAG');
	// HTML from the overview paragraphs must be stripped, not emitted raw.
	expect(body).not.toContain('<a href=');
});

test('the sitemap lists every page without trailing slashes', async ({ request }) => {
	const response = await request.get('/sitemap-0.xml');
	// The sitemap is emitted by the build, not by the dev server.
	test.skip(response.status() === 404, 'sitemap only exists in a production build');
	expect(response.status()).toBe(200);

	const body = await response.text();
	expect(body).toContain('<loc>https://angadbhalla.com/</loc>');
	expect(body).toContain('<loc>https://angadbhalla.com/achievements</loc>');
	expect(body).not.toContain('https://angadbhalla.com/achievements/</loc>');
	// The 404 page and text endpoints are not pages.
	expect(body).not.toContain('/404');
	expect(body).not.toContain('llms');
});

test('the portrait is not over-compressed', async ({ page }) => {
	await page.goto('/');

	// Astro's default AVIF quality of 50 visibly smeared the face. The image
	// must be encoded at the raised quality, which is visible in the URL.
	const src = decodeURIComponent((await page.locator('.portrait-img').getAttribute('src')) ?? '');
	expect(src).toMatch(/q=80|_ZWshFF/);
});

test('the portrait paints a placeholder before the real image', async ({ page }) => {
	await page.goto('/');

	// The LQIP is an inline data URI, so it costs no request and fills the
	// circle immediately.
	const lqip = await page
		.locator('.portrait-photo')
		.evaluate((el) => getComputedStyle(el).getPropertyValue('--lqip'));
	expect(lqip).toContain('data:image/webp;base64,');

	// Once loaded, the real image fades to fully opaque and the placeholder
	// is hidden. The fade is 300ms, so poll rather than sampling mid-transition.
	await expect(page.locator('.portrait-img')).toHaveClass(/is-loaded/);
	await expect
		.poll(() => page.locator('.portrait-img').evaluate((el) => getComputedStyle(el).opacity))
		.toBe('1');
});
