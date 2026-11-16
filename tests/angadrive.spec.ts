import { test, expect } from '@playwright/test';

/**
 * The AngaDriveV3 technical report.
 *
 * The page is long-form technical content aimed at search engines and LLM
 * crawlers, so the assertions are about structure rather than pixel layout:
 * one document heading, an ordered set of numbered sections, real
 * syntax-highlighted code blocks, and structured data that names the software.
 */

const SECTION_IDS = [
	'brief',
	'stack',
	'architecture',
	'socket',
	'database',
	'locks',
	'relationships',
	'uploads',
	'runners',
	'previews',
	'frontend',
	'assets',
	'deploy',
	'numbers',
	'limits',
	'reading',
] as const;

test('the report is reachable from the projects index', async ({ page }) => {
	await page.goto('/projects');

	// The card title opens the links menu, exactly like an achievements card.
	const card = page.locator('.card').filter({ hasText: 'AngaDriveV3' });
	await card.getByRole('button', { name: 'AngaDriveV3', exact: true }).click();

	const menu = page.locator('#menu-angadrive[open]');
	await expect(menu).toBeVisible();
	await expect(page).toHaveURL(/\/projects$/);

	// "Project Description" is the first entry, and it is the only route to
	// the report from the menu.
	await menu.getByRole('link', { name: 'Project Description' }).click();
	await expect(page).toHaveURL(/\/projects\/angadrive$/);
	await expect(page.getByRole('heading', { level: 1, name: 'AngaDriveV3' })).toBeVisible();
});

test('the card bar links straight to the report', async ({ page }) => {
	await page.goto('/projects');

	const card = page.locator('.card').filter({ hasText: 'AngaDriveV3' });
	const direct = card.getByRole('link', { name: 'AngaDriveV3 Project Description' });
	await expect(direct).toHaveAttribute('href', '/projects/angadrive');
});

test('the page has exactly one h1 and one section per report heading', async ({ page }) => {
	await page.goto('/projects/angadrive');

	await expect(page.locator('h1')).toHaveCount(1);

	for (const id of SECTION_IDS) {
		await expect(page.locator(`section#${id}`), id).toHaveCount(1);
		await expect(page.locator(`section#${id} h2`), id).toHaveCount(1);
	}

	await expect(page.locator('.report section')).toHaveCount(SECTION_IDS.length);
});

test('there is no table of contents and no status badge', async ({ page }) => {
	await page.goto('/projects/angadrive');

	// The page is a document, not a product page: no TOC rail, no badge row.
	await expect(page.locator('.toc')).toHaveCount(0);
	await expect(page.locator('.toc-list')).toHaveCount(0);
	await expect(page.getByText('active', { exact: true })).toHaveCount(0);
	await expect(page.getByText(/verified \d{4}-\d{2}-\d{2}/)).toHaveCount(0);
});

test('the title block states when the report was last updated', async ({ page }) => {
	await page.goto('/projects/angadrive');

	const facts = page.locator('.facts');
	await expect(facts).toContainText('Last updated');
	await expect(facts).toContainText('2026-11-17');
	await expect(facts).toContainText('AGPL-3.0');
});

test('code blocks are highlighted, labelled, and keyboard scrollable', async ({ page }) => {
	await page.goto('/projects/angadrive');

	const blocks = page.locator('.codeblock');
	expect(await blocks.count()).toBeGreaterThanOrEqual(8);

	// Every block carries a filename or language label in its corner.
	const labels = await page
		.locator('.codeblock-label')
		.evaluateAll((els) => els.map((el) => el.textContent?.trim() ?? ''));
	expect(labels.length).toBe(await blocks.count());
	for (const label of labels) expect(label.length).toBeGreaterThan(0);

	// Shiki emitted real token spans rather than a single plaintext run.
	const tokens = await page.locator('.codeblock pre span[style]').count();
	expect(tokens).toBeGreaterThan(50);

	// The scroll container is focusable, so arrow keys can reach long lines.
	// Whether a block actually overflows depends on the window width, so this
	// is checked at a narrow viewport rather than at the default desktop size.
	const first = page.locator('.codeblock-body').first();
	await expect(first).toHaveAttribute('tabindex', '0');

	await page.setViewportSize({ width: 760, height: 900 });
	const widest = await page
		.locator('.codeblock-body')
		.evaluateAll((els) => Math.max(...els.map((el) => el.scrollWidth - el.clientWidth)));
	expect(widest).toBeGreaterThan(0);
});

test('the body is set in a sans-serif face, not the site mono', async ({ page }) => {
	await page.goto('/projects/angadrive');

	const family = await page
		.locator('.report > section p')
		.first()
		.evaluate((el) => getComputedStyle(el).fontFamily);
	expect(family.toLowerCase()).toMatch(/open sans|calibri|segoe|roboto|helvetica|arial|sans-serif/);
});

test('the page does not overflow horizontally at mobile width', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 780 });
	await page.goto('/projects/angadrive');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);

	// Tables reflow into stacked rows instead of scrolling.
	await expect(page.locator('.report thead').first()).toBeHidden();
});

test('structured data describes the software and the breadcrumb trail', async ({ page }) => {
	await page.goto('/projects/angadrive');

	const raw = await page.locator('script[type="application/ld+json"]').first().textContent();
	const data = JSON.parse(raw!);
	const nodes = data['@graph'] as Array<Record<string, unknown>>;
	const types = nodes.map((node) => node['@type']);

	expect(types).toContain('SoftwareSourceCode');
	expect(types).toContain('TechArticle');
	expect(types).toContain('BreadcrumbList');

	const software = nodes.find((node) => node['@type'] === 'SoftwareSourceCode')!;
	expect(software.name).toBe('AngaDriveV3');
	expect(software.codeRepository).toBe('https://github.com/Anga205/AngaDriveV3');
	expect(software.programmingLanguage).toEqual(expect.arrayContaining(['Go', 'SolidJS', 'SQLite']));
	expect(software.url).toBe('https://drive.anga.codes');

	const breadcrumb = nodes.find((node) => node['@type'] === 'BreadcrumbList')!;
	const items = breadcrumb.itemListElement as Array<{ name: string; item: string }>;
	expect(items.map((item) => item.name)).toEqual(['home', 'projects', 'angadrive']);
	expect(items[2].item).toBe('https://angadbhalla.com/projects/angadrive');
});

test('meta description and keywords describe the technical content', async ({ page }) => {
	await page.goto('/projects/angadrive');

	const description = await page.locator('meta[name="description"]').getAttribute('content');
	expect(description).toContain('AngaDriveV3');
	expect(description!.length).toBeGreaterThan(120);
	expect(description!.length).toBeLessThan(320);

	const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
	for (const term of ['Go', 'SolidJS', 'SQLite', 'WebSocket']) {
		expect(keywords).toContain(term);
	}
});

test('the report is advertised in llms.txt', async ({ request }) => {
	const index = await (await request.get('/llms.txt')).text();
	expect(index).toContain('https://angadbhalla.com/projects/angadrive');

	const full = await (await request.get('/llms-full.txt')).text();
	expect(full).toContain('write-up: https://angadbhalla.com/projects/angadrive');
});