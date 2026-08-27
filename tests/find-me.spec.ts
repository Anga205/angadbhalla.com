import { test, expect } from '@playwright/test';

test('contact page lists every contact with the right link', async ({ page }) => {
	await page.goto('/contact');

	const contacts = page.locator('.contact-link');
	await expect(contacts).toHaveCount(6);

	await expect(contacts.nth(0)).toHaveAttribute('href', 'mailto:angadbhalla2005@gmail.com');
	await expect(contacts.nth(1)).toHaveAttribute('href', 'https://github.com/Anga205/');
	await expect(contacts.nth(2)).toHaveAttribute('href', 'https://www.linkedin.com/in/anga');
	await expect(contacts.nth(3)).toHaveAttribute(
		'href',
		'https://discord.com/users/477680545271250944',
	);
	await expect(contacts.nth(4)).toHaveAttribute('href', 'https://www.instagram.com/_anga205/');
	await expect(contacts.nth(5)).toHaveAttribute(
		'href',
		'https://www.duolingo.com/profile/AngadBhalla',
	);
	await expect(page.locator('[data-copy]')).toHaveCount(0);
});

test('contact form requires both fields', async ({ page }) => {
	await page.goto('/contact');

	await page.click('#send');
	await expect(page.locator('#form-status')).toHaveText('email and message are required.');
});

test('contact form reports a failed send with placeholder credentials', async ({ page }) => {
	await page.goto('/contact');

	await page.fill('#email', 'someone@example.com');
	await page.fill('#message', 'hello');
	await page.click('#send');

	await expect(page.locator('#form-status')).toContainText('could not send', { timeout: 15_000 });
	await expect(page.locator('#send')).toBeEnabled();
});

test('contact page does not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/contact');
	await expect(page.locator('.contact-link').first()).toBeVisible();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});
