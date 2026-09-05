import { test, expect } from '@playwright/test';

/**
 * The portrait's coin flip.
 *
 * `backface-visibility: hidden` only hides a face that is itself 3D
 * transformed and participates in a 3D rendering context. An untransformed
 * child of a `preserve-3d` parent is flattened into the parent's plane, so it
 * has no back face to hide: Firefox follows the spec and keeps painting the
 * photo through the flipped mark (Bugzilla 1201471), while Chromium hides it
 * anyway. These assertions pin the precondition that makes both engines agree,
 * and the `firefox` project runs this file so the difference is caught.
 */
test('both portrait faces are 3D transformed and hide their back side', async ({
	page,
}, testInfo) => {
	testInfo.skip(testInfo.project.name === 'mobile', 'the flip is a desktop hover affordance');

	await page.goto('/');

	const faces = [page.locator('.portrait-face--front'), page.locator('.portrait-face--back')];

	for (const face of faces) {
		// The face must carry a transform of its own. `none` is exactly the
		// state that makes Firefox ignore backface-visibility, so this is the
		// assertion that would have caught the bug. Firefox serialises the
		// identity `rotateY(0deg)` as a 2D `matrix(...)`, so only `none` is
		// rejected rather than requiring a `matrix3d`.
		expect(await face.evaluate((el) => getComputedStyle(el).transform)).not.toBe('none');
		expect(await face.evaluate((el) => getComputedStyle(el).backfaceVisibility)).toBe('hidden');
	}
});

test('the flipped portrait shows the mark, not the photo', async ({ page }, testInfo) => {
	// Reduced motion disables the flip entirely, so there is nothing to sample.
	testInfo.skip(
		testInfo.project.name === 'mobile' || testInfo.project.name === 'reduced-motion',
		'the flip is a desktop hover affordance',
	);

	await page.goto('/');

	await page.locator('.portrait-photo').hover();
	// The flip is 600ms; wait for it to finish before sampling what is painted.
	await page.waitForTimeout(900);

	// Hit-testing the centre of the flipped box is the behavioural check: if
	// the front face were still painted through the mark, it would be on top.
	const top = await page.evaluate(() => {
		const flip = document.querySelector('.portrait-flip') as HTMLElement;
		const box = flip.getBoundingClientRect();
		const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
		return hit?.closest('.portrait-face')?.className ?? null;
	});

	expect(top).toContain('portrait-face--back');
});
