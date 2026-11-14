import { test, expect } from '@playwright/test';

test('philosophy page carries the essay and the pull quote', async ({ page }) => {
	await page.goto('/philosophy');

	await expect(page.getByRole('heading', { name: 'philosophy', level: 1 })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'On building things' })).toBeVisible();
	await expect(page.getByText('The goofier the project, the better.')).toBeVisible();
	await expect(page.getByText('what jewelry is to a goldsmith')).toBeVisible();
});

test('philosophy page keeps the 3d model beside the text', async ({ page }) => {
	await page.goto('/philosophy');

	const portrait = page.locator('#portrait');
	await expect(portrait).toBeVisible();
	await expect(portrait).toHaveAttribute('data-model', '/anga.glb');

	// The model lives inside the philosophy section, not somewhere else.
	await expect(page.locator('.philosophy #portrait')).toHaveCount(1);
	await expect(page.locator('.intro #portrait')).toHaveCount(0);
});

test('philosophy is reachable from the sidebar', async ({ page }) => {
	await page.goto('/');

	const link = page.locator('[data-destination-link="philosophy"]');
	await expect(link).toHaveAttribute('href', '/philosophy');
	await link.click();
	await expect(page).toHaveURL(/\/philosophy$/);
	await expect(page.locator('[data-destination-link="philosophy"]')).toHaveAttribute(
		'aria-current',
		'page',
	);
});

test('philosophy page does not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/philosophy');
	await expect(page.getByRole('heading', { name: 'philosophy', level: 1 })).toBeVisible();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});