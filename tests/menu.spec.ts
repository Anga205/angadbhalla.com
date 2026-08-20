import { test, expect } from '@playwright/test';

async function openMenu(page: import('@playwright/test').Page) {
	await page.goto('/');
	await expect(page.locator('#opening #advance')).toBeVisible({ timeout: 25_000 });
	if (await page.locator('#opening #next').isVisible()) {
		await page.locator('#opening #next').click();
	} else {
		await page.keyboard.press('Enter');
	}
	await expect(page).toHaveURL(/\/selector$/);
	await expect(page.locator('#wayfinder')).toBeVisible();
}

test('selector is directly addressable and starts at the menu', async ({ page }) => {
	await page.goto('/selector');
	await expect(page.locator('#wayfinder')).toBeVisible();
	await expect(page.getByRole('link', { name: /Projects:/ })).toBeFocused();
});

test('selector status shows cat commands for destinations', async ({ page }) => {
	await page.goto('/selector');

	const status = page.locator('#wayfinder-status');
	await expect(status).toHaveText('cat projects.txt');

	await page.keyboard.press('ArrowDown');
	await expect(status).toHaveText('cat about.txt');

	await page.keyboard.press('ArrowDown');
	await expect(status).toHaveText('cat achievements.txt');
});

test('browser history moves between the intro and selector routes', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#opening #advance')).toBeVisible({ timeout: 25_000 });
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/selector$/);

	await page.goBack();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.locator('#opening')).toBeVisible();

	await page.goForward();
	await expect(page).toHaveURL(/\/selector$/);
	await expect(page.locator('#wayfinder')).toBeVisible();
});

test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name === 'reduced-motion', 'covered by the opening reduced-motion flow');
});

test('shows four destinations and navigates the timeline with keys', async ({ page }) => {
	test.skip(page.viewportSize()?.width !== 1280, 'desktop keyboard path only');
	await openMenu(page);

	const links = page.locator('[data-destination-link]');
	await expect(links).toHaveCount(4);
	await expect(page.getByRole('link', { name: /Projects:/ })).toBeFocused();

	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('link', { name: /About me:/ })).toBeFocused();
	await page.keyboard.press('Enter');

	await expect(page).toHaveURL(/\/about$/);
	await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
	await expect(page.locator('#wayfinder')).toHaveCSS('width', '288px');
});

test('opens Projects and keeps the menu as a desktop rail', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'default', 'desktop rail only');
	await openMenu(page);
	await page.getByRole('link', { name: /Projects:/ }).click();

	await expect(page).toHaveURL(/\/projects$/);
	await expect(page.locator('.card').first()).toBeVisible();
	await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
});

test('moves the minimized menu to the bottom on mobile', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'mobile', 'mobile rail only');
	await openMenu(page);
	await page.getByRole('link', { name: /Find me:/ }).click();

	await expect(page).toHaveURL(/\/find-me$/);
	await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
	await expect(page.locator('#wayfinder')).toHaveCSS('width', `${page.viewportSize()!.width}px`);
	await expect(page.locator('#wayfinder')).toHaveCSS('bottom', '0px');
	const rail = await page.locator('#wayfinder').boundingBox();
	const viewport = page.viewportSize()!;
	expect(rail?.y).toBeGreaterThanOrEqual(viewport.height - (rail?.height ?? 0));
});