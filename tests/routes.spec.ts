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
		page.locator('.waypoint-button[aria-current="true"] .waypoint-marker'),
	).toHaveCSS('color', 'rgb(38, 162, 105)');
});

test('timeline columns align across every destination', async ({ page }) => {
	await page.goto('/selector');

	const buttons = page.locator('.waypoint-button');
	await expect(buttons).toHaveCount(4);

	const columns = await buttons.first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
	expect(columns.split(' ')).toHaveLength(4);

	const markers = await page.locator('.waypoint-marker').evaluateAll((els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().x)),
	);
	const labels = await page.locator('.waypoint-label').evaluateAll((els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().x)),
	);

	expect(new Set(markers).size).toBe(1);
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

test('every destination opens and keeps the navigation available', async ({ page }) => {
	await page.goto('/selector');

	for (const name of ['Projects', 'About me', 'Achievements', 'Find me']) {
		await page.getByRole('button', { name: new RegExp(`${name}:`) }).click();
		await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
		await expect(page.locator('#wayfinder')).toBeVisible();
	}

	await expect(page.locator('#demo')).toBeHidden();
});

test('Projects reveals the demo and other destinations hide it', async ({ page }) => {
	await page.goto('/selector');

	await page.getByRole('button', { name: /Projects:/ }).click();
	await expect(page.locator('#demo')).toBeVisible();

	await page.getByRole('button', { name: /About me:/ }).click();
	await expect(page.locator('#demo')).toBeHidden();
});

test('mobile selector has no overflow and keeps the bottom rail usable', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/selector');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);

	await page.getByRole('button', { name: /Find me:/ }).click();
	await expect(page.locator('#wayfinder')).toHaveCSS('bottom', '0px');
	await expect(page.locator('#wayfinder')).toHaveCSS('width', '375px');
});
