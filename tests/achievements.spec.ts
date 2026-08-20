import { test, expect } from '@playwright/test';

const SLUGS = [
	'algomania-3',
	'tensor-2026',
	'kalpana-2025',
	'hack-o-ween-2025',
	'leetcode-1337',
	'alcoding-club-head',
	'pesu-io-course',
	'vosd-drive',
	'docker-pr-51670',
] as const;

/** Cards that open a link menu instead of a detail page. */
const MENU_SLUGS = [
	'algomania-3',
	'tensor-2026',
	'kalpana-2025',
	'hack-o-ween-2025',
	'leetcode-1337',
	'pesu-io-course',
	'vosd-drive',
	'docker-pr-51670',
] as const;

/** Everything else still has a long-form page. */
const DETAIL_SLUGS = SLUGS.filter((slug) => !(MENU_SLUGS as readonly string[]).includes(slug));

test('achievements index groups every achievement into sections', async ({ page }) => {
	await page.goto('/achievements');

	await expect(page.getByRole('heading', { name: 'achievements', level: 1 })).toBeVisible();

	const cards = page.locator('.card');
	await expect(cards).toHaveCount(SLUGS.length);

	// Five categories, each with a heading.
	const groups = page.locator('.group');
	await expect(groups).toHaveCount(5);

	for (const label of [
		'hackathons',
		'competitive programming',
		'leadership & teaching',
		'community',
		'open source',
	]) {
		await expect(page.getByRole('heading', { name: label, level: 2 })).toBeVisible();
	}
});

test('achievement cards stay compact: icon, name, one-line summary', async ({ page }) => {
	await page.goto('/achievements');

	const card = page.locator('.card').first();
	await expect(card.locator('.card-bar')).toBeVisible();
	await expect(card.locator('.card-icon')).toBeVisible();
	await expect(card.locator('.card-summary')).toBeVisible();

	// Tags and long copy belong on the detail page, not on the card.
	await expect(card.locator('.stack')).toHaveCount(0);
	await expect(card.locator('.card-description')).toHaveCount(0);
	await expect(card.locator('.card-more')).toHaveCount(0);
});

test('clicking a plain card opens its detail page', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('link', { name: 'Head, The Alcoding Club' }).click();

	await expect(page).toHaveURL(/\/achievements\/alcoding-club-head$/);
	await expect(page.getByRole('heading', { name: 'Head, The Alcoding Club', level: 1 })).toBeVisible();
	await expect(page.locator('.highlights li').first()).toBeVisible();
});

test('hackathon cards show a gold or silver medal instead of the result text', async ({ page }) => {
	await page.goto('/achievements');

	const gold = page.locator('.card-icon[data-medal="gold"]');
	const silver = page.locator('.card-icon[data-medal="silver"]');

	await expect(gold).toHaveCount(3);
	await expect(silver).toHaveCount(1);

	// Every hackathon now has links, so the result text is replaced by buttons.
	await expect(page.getByText('first place')).toHaveCount(0);
	await expect(page.getByText('second place')).toHaveCount(0);
});

test('hackathon cards carry grayscale link buttons in the headerbar', async ({ page }) => {
	await page.goto('/achievements');

	// Kalpana has two links, so it exercises the multi-button case.
	const card = page.locator('.card').filter({ hasText: 'IEEE Kalpana 2025' }).first();
	const actions = card.locator('.card-action');

	expect(await actions.count()).toBeGreaterThanOrEqual(2);
	await expect(actions.first()).toHaveAttribute('target', '_blank');

	// Grayscale, not the green accent.
	const color = await actions.first().evaluate((el) => getComputedStyle(el).color);
	expect(color).toBe('rgb(138, 138, 138)');
});

test('clicking a hackathon card opens a link menu instead of navigating', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'Algomania 3.0' }).click();

	// Still on the index.
	await expect(page).toHaveURL(/\/achievements$/);

	const menu = page.locator('dialog.menu[open]');
	await expect(menu).toBeVisible();
	await expect(menu.locator('.menu-title')).toHaveText('Algomania 3.0');

	const links = menu.locator('.menu-list a');
	expect(await links.count()).toBeGreaterThanOrEqual(2);
	await expect(links.first()).toHaveAttribute('target', '_blank');

	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
});

test('escape closes the link menu', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'Tensor 2026' }).click();
	const menu = page.locator('dialog.menu[open]');
	await expect(menu).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
});

test('clicking outside the link menu closes it', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'Algomania 3.0' }).click();
	const menu = page.locator('dialog.menu[open]');
	await expect(menu).toBeVisible();

	// Click the backdrop, well away from the dialog box.
	await page.mouse.click(10, 10);
	await expect(menu).toBeHidden();
});

test('clicking inside the link menu keeps it open', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'Algomania 3.0' }).click();
	const menu = page.locator('dialog.menu[open]');
	await expect(menu).toBeVisible();

	await menu.locator('.menu-title').click();
	await expect(menu).toBeVisible();
});

test('the close button dismisses the link menu', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'IEEE Kalpana 2025' }).click();
	const menu = page.locator('dialog.menu[open]');
	await expect(menu).toBeVisible();

	await menu.locator('[data-close]').click();
	await expect(menu).toBeHidden();
});

test('every menu card opens a menu with its links', async ({ page }) => {
	await page.goto('/achievements');

	for (const title of [
		'Algomania 3.0',
		'Tensor 2026',
		'IEEE Kalpana 2025',
		'Hack-o-ween 2025',
		'LeetCode — 1,337 solved',
		'PESU I/O — Competitive Programming',
		'VOSD Newspaper Drive',
		'docker/docker #51670',
	]) {
		await page.getByRole('button', { name: title }).click();

		const menu = page.locator('dialog.menu[open]');
		await expect(menu, title).toBeVisible();
		expect(await menu.locator('.menu-list a').count(), title).toBeGreaterThanOrEqual(1);

		await page.keyboard.press('Escape');
		await expect(menu, title).toBeHidden();
	}
});

test('leetcode card uses the leetcode mark and links to the post and profile', async ({ page }) => {
	await page.goto('/achievements');

	const card = page.locator('.card').filter({ hasText: 'LeetCode' }).first();
	await expect(card.locator('.card-icon svg')).toBeVisible();

	await page.getByRole('button', { name: 'LeetCode — 1,337 solved' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://lnkd.in/p/d9qKKzf9');
	expect(hrefs).toContain('https://leetcode.com/u/Anga205');
});

test('algomania sits under competitive programming, not hackathons', async ({ page }) => {
	await page.goto('/achievements');

	const competitive = page.getByRole('region', { name: 'competitive programming' });
	await expect(competitive.getByRole('button', { name: 'Algomania 3.0' })).toBeVisible();
	await expect(competitive.getByRole('button', { name: 'LeetCode — 1,337 solved' })).toBeVisible();

	const hackathons = page.getByRole('region', { name: 'hackathons' });
	await expect(hackathons.getByRole('button', { name: 'Algomania 3.0' })).toHaveCount(0);
});

test('hack-o-ween links to its linkedin post and event listing', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'Hack-o-ween 2025' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://lnkd.in/p/ddgcuhat');
	expect(hrefs).toContain('https://events.pes.edu/11310/');
});

test('kalpana links to the linkedin post and the event report', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'IEEE Kalpana 2025' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://lnkd.in/p/dU9XYBv8');
	expect(hrefs).toContain('https://news.pes.edu/11747/');
});

test('hackathon achievements no longer have detail pages', async ({ page }) => {
	for (const slug of MENU_SLUGS) {
		const response = await page.goto(`/achievements/${slug}`);
		expect(response?.status(), slug).toBe(404);
	}
});

test('every remaining achievement has a reachable detail page', async ({ page }) => {
	for (const slug of DETAIL_SLUGS) {
		const response = await page.goto(`/achievements/${slug}`);
		expect(response?.status(), slug).toBe(200);
		await expect(page.locator('.head h1')).toBeVisible();
		await expect(page.locator('.crumbs')).toBeVisible();
	}
});

test('detail page gallery opens a lightbox with the image caption', async ({ page }) => {
	await page.goto('/achievements/alcoding-club-head');

	const thumbs = page.locator('.thumb');
	await expect(thumbs).toHaveCount(3);

	await thumbs.first().click();

	const dialog = page.locator('dialog.lightbox');
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('[data-caption-text]')).toHaveText('Terrathon 4.0, opening hours.');
	await expect(dialog.locator('[data-count]')).toHaveText('01 / 03');

	// Arrow keys advance and wrap.
	await page.keyboard.press('ArrowRight');
	await expect(dialog.locator('[data-count]')).toHaveText('02 / 03');

	await page.keyboard.press('ArrowLeft');
	await page.keyboard.press('ArrowLeft');
	await expect(dialog.locator('[data-count]')).toHaveText('03 / 03');

	// Escape closes the native dialog.
	await page.keyboard.press('Escape');
	await expect(dialog).toBeHidden();
});

test('pesu io links to the linkedin post and the youtube video', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'PESU I/O — Competitive Programming' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://lnkd.in/p/djZQkwFF');
	expect(hrefs).toContain('https://www.youtube.com/watch?v=FTFoN2CjIGQ');
});

test('alcoding club links to the club page and the containerization post', async ({ page }) => {
	await page.goto('/achievements/alcoding-club-head');

	const hrefs = await page
		.locator('.actions a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://clubs.pes.edu/the-alcoding-club/about/');
	expect(hrefs).toContain('https://lnkd.in/p/d5xg7iKw');
});

test('containerization workshop is folded into the alcoding club achievement', async ({ page }) => {
	await page.goto('/achievements');

	// No standalone card.
	await expect(page.getByRole('button', { name: 'Containerization 101' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Containerization 101' })).toHaveCount(0);

	// The workshop is mentioned on the club detail page.
	await page.goto('/achievements/alcoding-club-head');
	await expect(page.getByText(/Containerization 101/).first()).toBeVisible();
});

test('vosd links to the linkedin post and the vosd site', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'VOSD Newspaper Drive' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://lnkd.in/p/dHbNECk9');
	expect(hrefs).toContain('https://www.vosd.in/');
});

test('docker pull request card links to the docker/docker PR', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'docker/docker #51670' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://github.com/docker/docker/pull/51670');
});

test('lightbox close button dismisses the dialog', async ({ page }) => {
	await page.goto('/achievements/alcoding-club-head');

	await page.locator('.thumb').nth(1).click();
	const dialog = page.locator('dialog.lightbox');
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('[data-count]')).toHaveText('02 / 03');

	await dialog.locator('[data-close]').click();
	await expect(dialog).toBeHidden();
});

test('detail page links back to the index', async ({ page }) => {
	await page.goto('/achievements/alcoding-club-head');

	await page.getByRole('link', { name: /all achievements/ }).click();
	await expect(page).toHaveURL(/\/achievements$/);
});

test('achievements pages do not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });

	for (const route of ['/achievements', '/achievements/alcoding-club-head']) {
		await page.goto(route);
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - window.innerWidth,
		);
		expect(overflow, route).toBeLessThanOrEqual(1);
	}
});

test('achievements index keeps the navigation rail available', async ({ page }) => {
	await page.goto('/achievements');

	await expect(page.locator('#wayfinder')).toBeVisible();
	await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
	await expect(page.locator('[data-destination-link="achievements"]')).toHaveAttribute(
		'aria-current',
		'page',
	);
});
