import { test, expect } from '@playwright/test';

const LINE_2 = 'I could write a paragraph about who I am and what I do,';
const LINE_3 = "but that's what EVERYONE else does,";
const LINE_4 = "so I'm just gonna show you.";
const FINAL_TEXT = [LINE_2, LINE_3, LINE_4].join('\n');

test('types the greeting, backspaces it, and reveals the advance affordance', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name === 'reduced-motion', 'covered by the reduced-motion test');

	await page.goto('/');

	const frame = page.locator('#frame');
	const typed = page.locator('#typed');
	const advance = page.locator('#advance');

	await expect(frame).toBeVisible();
	await expect(advance).toBeHidden();

	// The text is typed, not painted: it starts empty and grows.
	await expect(typed).toHaveText('', { timeout: 2_000 });

	// The greeting is typed first. The empty gap after backspacing it only
	// lasts 250ms, which is too tight to poll for reliably, so the backspace
	// is proven by the greeting being absent from the final text below.
	await expect(typed).toHaveText('Hello there!', { timeout: 5_000 });

	// The sequence runs about 9s; give it room.
	await expect(advance).toBeVisible({ timeout: 20_000 });

	// Exact match, so the line breaks are asserted too.
	await expect(typed).toHaveText(FINAL_TEXT);
	expect(await typed.textContent()).not.toContain('Hello there!');

	if (testInfo.project.name === 'mobile') {
		// Touch devices keep the button.
		await expect(page.locator('#hint')).toBeHidden();
		await page.getByRole('button', { name: 'next' }).click();
	} else {
		// Desktop advances with a keybind, not a button.
		await expect(page.locator('#hint')).toBeVisible();
		await expect(page.getByRole('button', { name: 'next' })).toBeHidden();
		await page.keyboard.press('Enter');
	}

	await expect(page).toHaveURL(/\/selector$/);
	await expect(page.locator('#wayfinder')).toBeVisible();
	await expect(page.getByRole('button', { name: /Projects:/ })).toBeFocused();
	await expect(page.locator('#opening')).toHaveCount(0);
});

test('space also advances on desktop', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'default', 'desktop keybind only');

	await page.goto('/');
	await expect(page.locator('#advance')).toBeVisible({ timeout: 20_000 });

	await page.keyboard.press(' ');
	await expect(page).toHaveURL(/\/selector$/);
	await expect(page.locator('#wayfinder')).toBeVisible();
});

test('the window can be dragged and stays on screen', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'default', 'pointer drag is desktop-only coverage');

	await page.goto('/');
	await expect(page.locator('#frame')).toBeVisible();

	const titlebar = page.locator('#titlebar');
	const box = (await titlebar.boundingBox())!;

	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 60, { steps: 8 });
	await page.mouse.up();

	await expect(page.locator('#window')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 100, 60)');

	// Dragging far past the edge clamps instead of losing the window.
	const moved = (await titlebar.boundingBox())!;
	await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
	await page.mouse.down();
	await page.mouse.move(5000, 5000, { steps: 8 });
	await page.mouse.up();

	const rect = (await page.locator('#window').boundingBox())!;
	const viewport = page.viewportSize()!;
	expect(rect.x + rect.width).toBeLessThanOrEqual(viewport.width + 1);
	expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height + 1);
});

test('reduced motion renders the text instantly', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'reduced-motion', 'only meaningful with reduced motion emulated');

	await page.goto('/');

	const typed = page.locator('#typed');
	const advance = page.locator('#advance');

	// No typing animation: the full message is there almost immediately.
	await expect(typed).toContainText('imma just show you', { timeout: 2_000 });

	// The cursor does not blink when motion is reduced.
	const animation = await page
		.locator('#cursor')
		.evaluate((el) => getComputedStyle(el).animationName);
	expect(animation).toBe('none');

	await expect(advance).toBeVisible({ timeout: 5_000 });
	await page.keyboard.press('Enter');

	await expect(page).toHaveURL(/\/selector$/);
	await expect(page.locator('#wayfinder')).toBeVisible();
});
