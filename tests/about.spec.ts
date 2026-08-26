import { test, expect } from '@playwright/test';

test('about page renders the intro and philosophy', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'Angad Bhalla' })).toBeVisible();
	await expect(page.getByText('PES University, Bangalore (2023-2027)')).toBeVisible();
	await expect(page.getByText('Goldman Sachs, Frigga Cloud, and Araciv Technologies')).toBeVisible();
	await expect(page.getByText('Team Alcoding')).toBeVisible();
	await expect(page.getByText('fundraising for stray dogs')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'my philosophy' })).toBeVisible();
	await expect(page.getByText('The goofier the project, the better.')).toBeVisible();
});

test('about page shows a rounded portrait photo in the intro', async ({ page }) => {
	await page.goto('/');

	const photo = page.locator('.portrait-photo img');
	await expect(photo).toBeVisible();
	await expect(photo).toHaveAttribute('src', '/angad.png');
	await expect(photo).toHaveAttribute('alt', 'Angad Bhalla');

	const radius = await photo.evaluate((el) => getComputedStyle(el).borderRadius);
	expect(radius).toBe('9999px');
});

test('about page keeps the 3d model beside the philosophy section', async ({ page }) => {
	await page.goto('/');

	const portrait = page.locator('#portrait');
	await expect(portrait).toBeVisible();
	await expect(portrait).toHaveAttribute('data-model', '/anga.glb');

	// The model lives inside the philosophy section, not the intro.
	await expect(page.locator('.philosophy #portrait')).toHaveCount(1);
	await expect(page.locator('.intro #portrait')).toHaveCount(0);
});

test('about page does not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Angad Bhalla' })).toBeVisible();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});
