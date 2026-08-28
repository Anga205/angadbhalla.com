import { test, expect } from '@playwright/test';

test('/contact still resolves to the home page message form', async ({ page }) => {
	await page.goto('/contact');

	await expect(page).toHaveURL(/\/#contact$/);
	await expect(page.getByRole('heading', { name: 'Angad Bhalla' })).toBeVisible();
	await expect(page.locator('#contact-form')).toBeVisible();
	await expect(page.locator('.contact-link')).toHaveCount(0);

	// The page scrolls inside `main`, so the form has to be brought into view
	// explicitly rather than by the browser's own anchor jump.
	const box = await page.locator('#contact').boundingBox();
	expect(box).not.toBeNull();
	expect(box!.y).toBeLessThan(page.viewportSize()!.height);
});

test('contact is no longer a sidebar destination', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('[data-destination-link]')).toHaveCount(5);
	await expect(page.locator('[data-destination-link="contact"]')).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^Contact:/ })).toHaveCount(0);
});

test('home page lists every contact with the right link', async ({ page }) => {
	await page.goto('/');

	const cards = page.locator('.contact-card');
	await expect(cards).toHaveCount(6);

	await expect(cards.nth(0)).toHaveAttribute('href', 'mailto:angadbhalla2005@gmail.com');
	await expect(cards.nth(1)).toHaveAttribute('href', 'https://github.com/Anga205/');
	await expect(cards.nth(2)).toHaveAttribute('href', 'https://www.linkedin.com/in/anga');
	await expect(cards.nth(3)).toHaveAttribute(
		'href',
		'https://discord.com/users/477680545271250944',
	);
	await expect(cards.nth(4)).toHaveAttribute('href', 'https://www.instagram.com/_anga205/');
	await expect(cards.nth(5)).toHaveAttribute(
		'href',
		'https://www.duolingo.com/profile/AngadBhalla',
	);
	await expect(page.locator('[data-copy]')).toHaveCount(0);
});

test('contact form requires both fields', async ({ page }) => {
	await page.goto('/');

	await page.click('#send');
	await expect(page.locator('#form-status')).toHaveText('email and message are required.');
});

test('contact form reports a failed send with placeholder credentials', async ({ page }) => {
	await page.goto('/');

	await page.fill('#email', 'someone@example.com');
	await page.fill('#message', 'hello');
	await page.click('#send');

	await expect(page.locator('#form-status')).toContainText('could not send', { timeout: 15_000 });
	await expect(page.locator('#send')).toBeEnabled();
});

test('home page and its message form do not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');
	await expect(page.locator('.contact-card').first()).toBeVisible();
	await expect(page.locator('#contact-form')).toBeVisible();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});
