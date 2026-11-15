import { test, expect } from '@playwright/test';

test('home page renders the intro', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'Angad Bhalla' })).toBeVisible();
	await expect(page.getByText('PES University, Bangalore (2023-2027)')).toBeVisible();
	await expect(page.getByText('playing Minecraft with my friends')).toBeVisible();
	await expect(page.getByText('huge coffee aficionado')).toBeVisible();
	await expect(page.getByText('community NGOs for animal welfare')).toBeVisible();
});

test('home page shows a rounded portrait photo in the intro', async ({ page }) => {
	await page.goto('/');

	const photo = page.locator('.portrait-photo img');
	await expect(photo).toBeVisible();
	// The portrait is processed by astro:assets, so the URL is either a
	// fingerprinted build asset or a dev-mode `/_image?href=...` transform.
	// Either way it must resolve to the angad source, in a modern format.
	const src = decodeURIComponent((await photo.getAttribute('src')) ?? '');
	expect(src).toMatch(/angad/);
	expect(src).toMatch(/\.(avif|webp|jpe?g|png)/);
	await expect(photo).toHaveAttribute('alt', 'Angad Bhalla');

	const radius = await photo.evaluate((el) => getComputedStyle(el).borderRadius);
	expect(radius).toBe('9999px');
});

test('philosophy does not live on the home page any more', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('.philosophy')).toHaveCount(0);
	await expect(page.locator('#portrait')).toHaveCount(0);
	await expect(page.getByText('The goofier the project, the better.')).toHaveCount(0);
});

test('home page links out to every social profile', async ({ page }) => {
	await page.goto('/');

	const cards = page.locator('.contact-card');
	await expect(cards).toHaveCount(6);

	await expect(cards.nth(0)).toHaveAttribute('href', 'mailto:angadbhalla2005@gmail.com');
	await expect(cards.nth(1)).toHaveAttribute('href', 'https://github.com/Anga205/');
	await expect(cards.nth(1)).toHaveAttribute('target', '_blank');
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

	// The cards carry the icon plus the handle, so the accessible name and the
	// visible text agree.
	const labels = await cards.evaluateAll((els) =>
		els.map((el) => el.getAttribute('aria-label')?.split(':')[0]),
	);
	expect(labels).toEqual(['email', 'github', 'linkedin', 'discord', 'instagram', 'duolingo']);

	for (const card of await cards.all()) {
		await expect(card.locator('svg')).toHaveCount(1);
	}
});

test('home page social cards stack one per row on desktop', async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name === 'mobile', 'the compact grid is measured on mobile');

	await page.goto('/');

	const cards = page.locator('.contact-card');
	const boxes = await cards.evaluateAll((els) =>
		els.map((el) => {
			const box = el.getBoundingClientRect();
			return { top: Math.round(box.top), width: Math.round(box.width) };
		}),
	);

	// One card per row: six distinct top edges.
	expect(new Set(boxes.map((box) => box.top)).size).toBe(6);

	// Every row spans the same width.
	const widths = boxes.map((box) => box.width);
	expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
});

test('home page social cards show the handle on the button', async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name === 'mobile', 'the handle is hidden in the compact grid');

	await page.goto('/');

	const cards = page.locator('.contact-card');
	await expect(cards.nth(0).locator('.contact-value')).toHaveText('angadbhalla2005@gmail.com');
	await expect(cards.nth(1).locator('.contact-value')).toHaveText('github.com/Anga205');
	await expect(cards.nth(3).locator('.contact-value')).toHaveText('@anga205');
	await expect(cards.nth(5).locator('.contact-value')).toHaveText(
		'duolingo.com/profile/AngadBhalla',
	);

	// The label sits above the handle.
	await expect(cards.nth(0).locator('.contact-label')).toHaveText('email');
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
