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

test('portrait can be dragged but rotation is clamped', async ({ page }, testInfo) => {
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
		await page.mouse.up();
		// Let the damping inertia settle before comparing frames.
		await page.waitForTimeout(800);
	};

	const before = await shot();

	// Horizontal rotation is allowed.
	await drag(90, 0);
	expect(await shot()).not.toBe(before);

	// Vertical rotation is clamped: dragging far past the limit converges to
	// the same frame instead of flipping the model over.
	await drag(0, 5000);
	const clamped = await shot();
	await drag(0, 5000);
	expect(await shot()).toBe(clamped);

	// Zoom is disabled, so the wheel must not change the frame.
	await page.mouse.move(cx, cy);
	await page.mouse.wheel(0, -600);
	await page.waitForTimeout(500);
	await portrait.scrollIntoViewIfNeeded();
	expect(await shot()).toBe(clamped);
});
