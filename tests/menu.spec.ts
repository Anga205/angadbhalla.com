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
	await expect(page.locator('#demo')).toBeHidden();
	await expect(page.getByRole('button', { name: /Projects:/ })).toBeFocused();
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

	const buttons = page.locator('[data-destination-button]');
	await expect(buttons).toHaveCount(4);
	await expect(page.getByRole('button', { name: /Projects:/ })).toBeFocused();

	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('button', { name: /About me:/ })).toBeFocused();
	await page.keyboard.press('Enter');

	await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
	await expect(page.locator('#wayfinder')).toHaveCSS('width', '288px');
	await expect(page.locator('#demo')).toBeHidden();
});

test('opens Projects and keeps the menu as a desktop rail', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'default', 'desktop rail only');
	await openMenu(page);
	await page.getByRole('button', { name: /Projects:/ }).click();

	await expect(page.locator('#demo')).toBeVisible();
	await expect(page.locator('#demo')).toHaveClass(/with-navigation/);
	await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
});

test('moves the minimized menu to the bottom on mobile', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'mobile', 'mobile rail only');
	await openMenu(page);
	await page.getByRole('button', { name: /Find me:/ }).click();

	await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
	await expect(page.locator('#wayfinder')).toHaveCSS('width', `${page.viewportSize()!.width}px`);
	await expect(page.locator('#wayfinder')).toHaveCSS('bottom', '0px');
	const rail = await page.locator('#wayfinder').boundingBox();
	const viewport = page.viewportSize()!;
	expect(rail?.y).toBeGreaterThanOrEqual(viewport.height - (rail?.height ?? 0));
});