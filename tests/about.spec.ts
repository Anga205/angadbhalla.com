import { test, expect } from '@playwright/test';

test('about page renders the intro and philosophy', async ({ page }) => {
	await page.goto('/about');

	await expect(page.getByRole('heading', { name: 'Angad Bhalla' })).toBeVisible();
	await expect(page.getByText('PES University, Bangalore (2023-2027)')).toBeVisible();
	await expect(page.getByText('Goldman Sachs, Frigga Cloud, and Araciv Technologies')).toBeVisible();
	await expect(page.getByText('Team Alcoding')).toBeVisible();
	await expect(page.getByText('fundraising for stray dogs')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'my philosophy' })).toBeVisible();
	await expect(page.getByText('The goofier the project, the better.')).toBeVisible();
});

test('about page reserves a portrait area for the model', async ({ page }) => {
	await page.goto('/about');

	const portrait = page.locator('#portrait');
	await expect(portrait).toBeVisible();
	await expect(portrait).toHaveAttribute('data-model', '/anga.glb');
});

test('about page does not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/about');
	await expect(page.getByRole('heading', { name: 'Angad Bhalla' })).toBeVisible();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});
