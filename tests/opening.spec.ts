import { test, expect } from '@playwright/test';

const LINE_2 = 'I could write a paragraph about who I am and what I do,';
const LINE_3 = 'but thats what everyone does,';
const LINE_4 = 'so imma just show you';
const FINAL_TEXT = [LINE_2, LINE_3, LINE_4].join('\n');

test('types the greeting, backspaces it, and reveals next', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name === 'reduced-motion', 'covered by the reduced-motion test');

	await page.goto('/');

	const frame = page.locator('#frame');
	const typed = page.locator('#typed');
	const next = page.getByRole('button', { name: 'next' });

	await expect(frame).toBeVisible();
	await expect(next).toBeHidden();

	// The text is typed, not painted: it starts empty and grows.
	await expect(typed).toHaveText('', { timeout: 2_000 });

	// The greeting is typed first. The empty gap after backspacing it only
	// lasts 250ms, which is too tight to poll for reliably, so the backspace
	// is proven by the greeting being absent from the final text below.
	await expect(typed).toHaveText('Hello there!', { timeout: 5_000 });

	// The sequence runs about 9s; give it room.
	await expect(next).toBeVisible({ timeout: 20_000 });

	// Exact match, so the line breaks are asserted too.
	await expect(typed).toHaveText(FINAL_TEXT);
	expect(await typed.textContent()).not.toContain('Hello there!');

	await next.click();

	await expect(page.locator('#placeholder')).toBeVisible();
	await expect(page.locator('#placeholder')).toContainText('[next section, not built yet]');
	await expect(frame).toBeHidden();
});

test('reduced motion renders the text instantly', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'reduced-motion', 'only meaningful with reduced motion emulated');

	await page.goto('/');

	const typed = page.locator('#typed');
	const next = page.getByRole('button', { name: 'next' });

	// No typing animation: the full message is there almost immediately.
	await expect(typed).toContainText('imma just show you', { timeout: 2_000 });

	// The cursor does not blink when motion is reduced.
	const animation = await page
		.locator('#cursor')
		.evaluate((el) => getComputedStyle(el).animationName);
	expect(animation).toBe('none');

	await expect(next).toBeVisible({ timeout: 5_000 });
	await next.click();

	await expect(page.locator('#placeholder')).toBeVisible();
});
