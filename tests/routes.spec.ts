import { test, expect } from '@playwright/test';

async function reachSelector(page: import('@playwright/test').Page) {
	await page.goto('/');
	await expect(page.locator('#opening #advance')).toBeVisible({ timeout: 25_000 });
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/selector$/);
	await expect(page.locator('#wayfinder')).toBeVisible();
}

test('bfcache restore shows the completed intro instead of a blank page', async ({ page }) => {
	await reachSelector(page);
	await page.goBack();
	await expect(page).toHaveURL(/\/$/);

	// Simulate a bfcache restore, which is what causes the blank screen.
	await page.evaluate(() => {
		window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
	});

	await expect(page.locator('#opening')).toBeVisible();
	await expect(page.locator('#frame')).toBeVisible();
	await expect(page.locator('#advance')).toBeVisible();
	await expect(page.locator('#typed')).toContainText('imma just show you');
});

test('selector uses the Adwaita dark palette', async ({ page }) => {
	await page.goto('/selector');

	await expect(page.locator('#wayfinder')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
	await expect(page.locator('.window')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
	await expect(page.locator('.headerbar')).toHaveCSS('background-color', 'rgb(48, 48, 48)');
	await expect(page.locator('.terminal')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
	await expect(
		page.locator('.waypoint-link[aria-current="page"] .waypoint-icon'),
	).toHaveCSS('color', 'rgb(38, 162, 105)');
});

test('timeline columns align across every destination', async ({ page }) => {
	await page.goto('/selector');

	const links = page.locator('.waypoint-link');
	await expect(links).toHaveCount(4);

	const columns = await links.first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
	expect(columns.split(' ')).toHaveLength(3);

	const icons = await page.locator('.waypoint-icon').evaluateAll((els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().x)),
	);
	const labels = await page.locator('.waypoint-label').evaluateAll((els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().x)),
	);

	expect(new Set(icons).size).toBe(1);
	expect(new Set(labels).size).toBe(1);
});

test('selector does not overflow horizontally', async ({ page }) => {
	await page.goto('/selector');
	await expect(page.locator('#wayfinder')).toBeVisible();
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});

test('every destination has its own route and keeps the navigation available', async ({ page }) => {
	const routes = [
		['Projects', '/projects'],
		['About me', '/about'],
		['Achievements', '/achievements'],
		['Find me', '/find-me'],
	] as const;

	for (const [name, route] of routes) {
		await page.goto('/selector');
		await page.getByRole('link', { name: new RegExp(`${name}:`) }).click();
		await expect(page).toHaveURL(new RegExp(`${route}$`));
		await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
		await expect(page.locator('#wayfinder')).toBeVisible();
	}
});

test('projects route renders the project cards', async ({ page }) => {
	await page.goto('/projects');

	const cards = page.locator('.card');
	await expect(cards.first()).toBeVisible();
	expect(await cards.count()).toBeGreaterThan(1);

	// Cards must not depend on having every link.
	await expect(page.locator('.card-actions').first()).toBeVisible();
});

test('project detail route renders the VS Code window', async ({ page }, testInfo) => {
	await page.goto('/projects/code-execution-api');

	await expect(page.locator('#demo')).toBeVisible();
	await expect(page.locator('.statusbar')).toBeVisible();

	if (testInfo.project.name !== 'mobile') {
		await expect(page.locator('.sidebar')).toBeVisible();
		await expect(page.locator('.activitybar')).toBeVisible();
	}
});

test('sidebar highlights the current route, not always projects', async ({ page }) => {
	await page.goto('/find-me');

	await expect(page.locator('[data-destination-link="find-me"]')).toHaveAttribute(
		'aria-current',
		'page',
	);
	await expect(page.locator('[data-destination-link="projects"]')).not.toHaveAttribute(
		'aria-current',
		'page',
	);
});

test('projects accordion lists projects and toggles', async ({ page }) => {
	await page.goto('/projects');

	const list = page.locator('#project-list');
	await expect(list).toBeVisible();
	expect(await list.locator('.project-link').count()).toBeGreaterThan(1);

	await page.locator('[data-destination-link="projects"]').click();
	await expect(list).toBeHidden();

	await page.locator('[data-destination-link="projects"]').click();
	await expect(list).toBeVisible();
});

test('mobile selector has no overflow and keeps the bottom rail usable', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/selector');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);

	await page.getByRole('link', { name: /Find me:/ }).click();
	await expect(page.locator('#wayfinder')).toHaveCSS('bottom', '0px');
	await expect(page.locator('#wayfinder')).toHaveCSS('width', '375px');
});
