import { test, expect } from '@playwright/test';

test('about portrait renders the compressed GLB', async ({ page }) => {
	await page.goto('/about');

	const portrait = page.locator('#portrait');
	await portrait.scrollIntoViewIfNeeded();

	// The fallback is replaced only after the GLB parses successfully.
	await expect(portrait.locator('canvas')).toBeVisible({ timeout: 30_000 });
	await expect(portrait).toHaveClass(/is-ready/, { timeout: 30_000 });

	// The canvas must contain actual pixels, not an empty transparent buffer.
	const shot = await portrait.screenshot();
	const nonEmpty = [...shot].some((byte, index) => index > 100 && byte !== 0);
	expect(nonEmpty).toBe(true);

	await portrait.screenshot({ path: 'test-results/portrait.png' });
});

test('portrait rotates horizontally with damping and snaps back', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'default', 'drag interaction is desktop-only coverage');
	await page.goto('/about');

	const portrait = page.locator('#portrait');
	await portrait.scrollIntoViewIfNeeded();
	await expect(portrait).toHaveClass(/is-ready/, { timeout: 30_000 });

	const box = (await portrait.boundingBox())!;
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;

	const shot = async () => (await portrait.screenshot()).toString('base64');
	const drag = async (dx: number, dy: number) => {
		await page.mouse.move(cx, cy);
		await page.mouse.down();
		await page.mouse.move(cx + dx, cy + dy, { steps: 20 });
		const moved = await shot();
		await page.mouse.up();
		return moved;
	};

	const before = await shot();

	// Horizontal rotation is visible while the pointer is held.
	expect(await drag(90, 0)).not.toBe(before);

	// The view returns to its authored position after the release animation.
	await page.waitForTimeout(700);
	expect(await shot()).toBe(before);

	// Vertical rotation is locked: dragging far past the limit does not alter
	// the authored view.
	await drag(0, 5000);
	await page.waitForTimeout(500);
	const clamped = await shot();
	expect(clamped).toBe(before);

	// Zoom is disabled, so the wheel must not change the frame.
	await page.mouse.move(cx, cy);
	await page.mouse.wheel(0, -600);
	await page.waitForTimeout(500);
	await portrait.scrollIntoViewIfNeeded();
	expect(await shot()).toBe(clamped);
});
