import { test, expect } from '@playwright/test';

/**
 * The mobile swipe pager.
 *
 * On phones the five top-level destinations live side by side in one
 * horizontally scroll-snapping container. These tests cover the contract the
 * pager has to keep: the right panel is aligned for the route, the rail moves
 * the pager instead of reloading, the URL follows the panel, and each panel
 * keeps its own vertical scroll position.
 *
 * Desktop is deliberately excluded: there the pager is a plain block wrapper
 * and navigation stays a normal page load.
 */

const PANELS = ['home', 'projects', 'university', 'achievements', 'philosophy'] as const;

test.beforeEach(async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name !== 'mobile', 'the pager is mobile only');
	await page.goto('/');
	await expect(page.locator('[data-pager]')).toBeVisible();
});

test('renders one panel per destination, side by side', async ({ page }) => {
	const panels = page.locator('[data-panel]');
	await expect(panels).toHaveCount(PANELS.length);

	const ids = await panels.evaluateAll((els) => els.map((el) => el.dataset.panel));
	expect(ids).toEqual([...PANELS]);

	// The pager is a horizontal scroller, not a vertical one.
	const pager = page.locator('[data-pager]');
	await expect(pager).toHaveCSS('display', 'flex');
	await expect(pager).toHaveCSS('overflow-x', 'auto');
	await expect(pager).toHaveCSS('overflow-y', 'hidden');

	// Every panel is exactly one viewport wide and starts where the previous
	// one ends, so a drag reveals the neighbour rather than a gap.
	const boxes = await panels.evaluateAll((els) =>
		els.map((el) => {
			const box = el.getBoundingClientRect();
			return { left: Math.round(box.left), width: Math.round(box.width) };
		}),
	);
	const viewport = await page.evaluate(() => window.innerWidth);
	for (const [index, box] of boxes.entries()) {
		expect(box.width).toBe(viewport);
		expect(box.left).toBe(index * viewport);
	}
});

test('the pager does not make the document scroll horizontally', async ({ page }) => {
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});

test('the active panel matches the route and the rail', async ({ page }) => {
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'home');
	await expect(page.locator('[data-destination-link][aria-current="page"]')).toHaveAttribute(
		'data-destination',
		'home',
	);

	await page.goto('/achievements');
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'achievements');
	await expect(page.locator('[data-destination-link][aria-current="page"]')).toHaveAttribute(
		'data-destination',
		'achievements',
	);

	// Landing directly on a route aligns that panel, not the first one.
	const scrollLeft = await page
		.locator('[data-pager]')
		.evaluate((el) => el.scrollLeft);
	const width = await page.locator('[data-pager]').evaluate((el) => el.clientWidth);
	expect(Math.round(scrollLeft / width)).toBe(PANELS.indexOf('achievements'));
});

test('off-screen panels are inert', async ({ page }) => {
	const inert = await page
		.locator('[data-panel]')
		.evaluateAll((els) =>
			els.map((el) => ({ id: el.dataset.panel, inert: el.hasAttribute('inert') })),
		);

	for (const panel of inert) {
		expect(panel.inert, panel.id).toBe(panel.id !== 'home');
	}
});

test('the rail moves the pager without reloading the page', async ({ page }) => {
	// A marker that only survives if the document is never replaced.
	await page.evaluate(() => {
		(window as unknown as { __pagerMarker: boolean }).__pagerMarker = true;
	});

	await page.locator('[data-destination-link="projects"]').click();

	await expect(page).toHaveURL(/\/projects$/);
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'projects');
	await expect(page.locator('[data-destination-link][aria-current="page"]')).toHaveAttribute(
		'data-destination',
		'projects',
	);

	expect(
		await page.evaluate(() => (window as unknown as { __pagerMarker?: boolean }).__pagerMarker),
	).toBe(true);

	// The pager actually moved to the projects panel. The move is animated, so
	// poll until it has settled rather than reading the offset immediately.
	await expect
		.poll(() =>
			page.locator('[data-pager]').evaluate((el) => {
				const width = el.clientWidth;
				return Math.round(el.scrollLeft / width);
			}),
		)
		.toBe(PANELS.indexOf('projects'));
});

test('the rail updates the URL for every destination', async ({ page }) => {
	for (const id of PANELS) {
		await page.locator(`[data-destination-link="${id}"]`).click();
		await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', id);
		await expect(page.locator('[data-destination-link][aria-current="page"]')).toHaveAttribute(
			'data-destination',
			id,
		);
	}
});

test('a swipe settles on the next panel and updates the URL', async ({ page }) => {
	const pager = page.locator('[data-pager]');
	const width = await pager.evaluate((el) => el.clientWidth);

	// Drag the pager a full panel to the left, the way a finger would.
	await pager.evaluate((el, distance) => {
		el.scrollLeft = distance;
	}, width);

	await expect(page).toHaveURL(/\/projects$/);
	await expect(pager).toHaveAttribute('data-active', 'projects');
});

test('each panel keeps its own vertical scroll position', async ({ page }) => {
	const home = page.locator('[data-panel="home"]');

	await home.evaluate((el) => {
		el.scrollTop = 240;
	});
	const before = await home.evaluate((el) => el.scrollTop);
	expect(before).toBeGreaterThan(0);

	await page.locator('[data-destination-link="projects"]').click();
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'projects');

	await page.locator('[data-destination-link="home"]').click();
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'home');

	// The panel was never removed from the DOM, so its scroll survived.
	expect(await home.evaluate((el) => el.scrollTop)).toBe(before);
});

test('the back button returns to the previous panel', async ({ page }) => {
	await page.locator('[data-destination-link="projects"]').click();
	await expect(page).toHaveURL(/\/projects$/);

	await page.goBack();

	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'home');
});

test('injected panels are interactive', async ({ page }) => {
	// The projects panel is fetched and injected on demand; its link menus must
	// still open after that.
	await page.locator('[data-destination-link="projects"]').click();
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'projects');

	const card = page.locator('[data-panel="projects"] .card').first();
	await expect(card).toBeVisible();

	await card.getByRole('button').first().click();
	await expect(page.locator('[data-panel="projects"] dialog[open]')).toBeVisible();
});

test('the achievements panel keeps its live LeetCode count', async ({ page }) => {
	// The mock has to exist before the page loads: the pager prefetches the
	// other panels, so the request would otherwise already have gone out.
	await page.route('https://leetcode-api-faisalshohag.anga.codes/**', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ totalSolved: 1414 }),
		}),
	);
	await page.goto('/');

	await page.locator('[data-destination-link="achievements"]').click();
	await expect(page.locator('[data-pager]')).toHaveAttribute('data-active', 'achievements');

	await expect(
		page.locator('[data-panel="achievements"] [data-leetcode-summary]').first(),
	).toContainText('1,414');
});

test('desktop keeps the sidebar layout and no pager', async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name === 'mobile', 'desktop only');

	await page.goto('/');

	// The pager is a transparent wrapper on desktop: the page keeps its own
	// sidebar offset and its own scroll container.
	await expect(page.locator('[data-pager]')).toHaveCSS('display', 'block');
	await expect(page.locator('[data-panel="home"] .page')).toHaveCSS('margin-left', '288px');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});
