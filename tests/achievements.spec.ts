import { test, expect } from '@playwright/test';

const SLUGS = [
	'algomania-3',
	'tensor-2026',
	'ieee-cs-iampro-2025',
	'kalpana-2025',
	'hack-o-ween-2025',
	'leetcode-1337',
	'vosd-drive',
	'tedx-speaker',
	'docker-pr-51670',
] as const;

/** Cards that open a link menu instead of a detail page. */
const MENU_SLUGS = [
	'algomania-3',
	'tensor-2026',
	'kalpana-2025',
	'hack-o-ween-2025',
	'leetcode-1337',
	'vosd-drive',
	'tedx-speaker',
	'docker-pr-51670',
] as const;

/** Everything else still has a long-form page. */
const DETAIL_SLUGS = SLUGS.filter((slug) => !(MENU_SLUGS as readonly string[]).includes(slug));

test('achievements index groups every achievement into sections', async ({ page }) => {
	await page.goto('/achievements');

	await expect(page.getByRole('heading', { name: 'achievements', level: 1 })).toBeVisible();

	const cards = page.locator('.card');
	await expect(cards).toHaveCount(SLUGS.length);

	// Five categories, each with a heading. University has its own page.
	const groups = page.locator('.group');
	await expect(groups).toHaveCount(5);

	for (const label of [
		'hackathons',
		'competitive programming',
		'community',
		'open source',
		'research',
	]) {
		await expect(page.getByRole('heading', { name: label, level: 2 })).toBeVisible();
	}

	await expect(
		page.getByRole('heading', { name: 'university & extracurriculars', level: 2 }),
	).toHaveCount(0);
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

	await page.getByRole('link', { name: 'Research Intern' }).click();

	await expect(page).toHaveURL(/\/achievements\/ieee-cs-iampro-2025$/);
	await expect(page.getByRole('heading', { name: 'Research Intern', level: 1 })).toBeVisible();
	await expect(page.getByText('IEEE Computer Society IAMPro 2025 Batch')).toBeVisible();
	await expect(page.locator('.prose p').first()).toBeVisible();
});

test('university page lists every role as a linkedin-style entry', async ({ page }) => {
	await page.goto('/university');

	await expect(page.getByRole('heading', { name: 'university', level: 1 })).toBeVisible();

	const cards = page.locator('.card');
	await expect(cards).toHaveCount(5);

	const club = cards.filter({ hasText: 'The Alcoding Club' });
	await expect(club.getByRole('heading', { level: 3 })).toHaveText('Club Head');
	await expect(club.locator('.card-org')).toHaveText('The Alcoding Club');
	await expect(club.locator('.card-dept')).toHaveText('Core Team');
	await expect(club.locator('.card-dates')).toHaveText('September 2024 — April 2025');

	const course = cards.filter({ hasText: 'PESU I/O' });
	await expect(course.getByRole('heading', { level: 3 })).toHaveText('Subject Matter Expert (SME)');
	await expect(course.locator('.card-dept')).toHaveText('Competitive Programming');
	await expect(course.locator('.card-dates')).toHaveText('August — November 2025');

	const intern = cards.filter({ hasText: 'cRAIS' });
	await expect(intern.getByRole('heading', { level: 3 })).toHaveText('Robotics Intern');
	await expect(intern.locator('.card-dept')).toHaveText('Remote Robotics (ReRo) team');
	await expect(intern.locator('.card-dates')).toHaveText('June — July 2025');

	const ras = cards.filter({ hasText: 'TAMS' });
	await expect(ras.getByRole('heading', { level: 3 })).toHaveText('IEEE RAS Speaker');
	await expect(ras.locator('.card-org')).toHaveText('TAMS (The Amateur Manager and Scientist)');

	// The old label column is gone.
	await expect(page.locator('.card-role-label')).toHaveCount(0);
});

test('university cards link to their own detail pages', async ({ page }) => {
	await page.goto('/university');

	await page.getByRole('link', { name: 'Club Head, The Alcoding Club' }).click();

	await expect(page).toHaveURL(/\/university\/alcoding-club-head$/);
	await expect(page.getByRole('heading', { name: 'The Alcoding Club', level: 1 })).toBeVisible();
	await expect(page.locator('.prose p').first()).toBeVisible();
});

test('IAMPro has a research detail page with three gallery slots', async ({ page }, testInfo) => {
	await page.goto('/achievements/ieee-cs-iampro-2025');
	await expect(page.getByRole('heading', { name: 'Research Intern', level: 1 })).toBeVisible();
	await expect(page.locator('.thumb')).toHaveCount(3);

	// Real photographs, not the generated placeholders.
	const sources = await page
		.locator('.thumb img')
		.evaluateAll((els) => els.map((el) => el.getAttribute('src')));
	expect(sources).toEqual([
		'/achievements/ieee-cs-iampro-2025/certificate.png',
		'/achievements/ieee-cs-iampro-2025/pic1.jpg',
		'/achievements/ieee-cs-iampro-2025/pic2.jpg',
	]);

	testInfo.project.name === 'mobile' && testInfo.skip();

	await page.locator('.thumb').first().click();
	await expect
		.poll(() => page.locator('dialog.lightbox').evaluate((dialog) => (dialog as HTMLDialogElement).open))
		.toBe(true);
	await expect(page.locator('[data-caption-text]')).toHaveText(
		'Certificate issued by the IEEE Computer Society Bangalore chapter confirming the internship under the IAMPro 2025 batch.',
	);
});

test('IAMPro folds tags and stack into metadata instead of visible pills', async ({ page }) => {
	await page.goto('/achievements/ieee-cs-iampro-2025');

	await expect(page.locator('#tags')).toHaveCount(0);
	await expect(page.locator('#stack')).toHaveCount(0);
	await expect(page.locator('#highlights')).toHaveCount(0);

	const keywords = await page
		.locator('meta[name="keywords"]')
		.getAttribute('content');
	expect(keywords).toContain('iampro');
	expect(keywords).toContain('Blockchain');
});

test('IAMPro links Ankith Khaitan to his LinkedIn profile', async ({ page }) => {
	await page.goto('/achievements/ieee-cs-iampro-2025');

	const link = page.getByRole('link', { name: 'Ankith Khaitan' });
	await expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/ankithkhaitan/');
	await expect(page.getByText('Dr. Venugopal N.')).toBeVisible();
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
		'VOSD Newspaper Drive',
		'TEDx Speaker',
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

test('Tensor and IAMPro sit under research', async ({ page }) => {
	await page.goto('/achievements');

	const research = page.getByRole('region', { name: 'research' });
	await expect(research.getByRole('button', { name: 'Tensor 2026' })).toBeVisible();
	await expect(
		research.getByRole('link', { name: 'Research Intern' }),
	).toBeVisible();
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
	await page.goto('/university/alcoding-club-head');

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
	await page.goto('/university');

	await page.getByRole('button', { name: 'Subject Matter Expert (SME), PESU I/O' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://lnkd.in/p/djZQkwFF');
	expect(hrefs).toContain('https://www.youtube.com/watch?v=FTFoN2CjIGQ');
});

test('ieee ras speaker links to its linkedin post', async ({ page }) => {
	await page.goto('/university');

	await page.getByRole('button', { name: 'IEEE RAS Speaker, TAMS (The Amateur Manager and Scientist)' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://lnkd.in/p/deWbmV4m');
});

test('tedx speaker links to the youtube talk', async ({ page }) => {
	await page.goto('/achievements');

	await page.getByRole('button', { name: 'TEDx Speaker' }).click();

	const hrefs = await page
		.locator('dialog.menu[open] .menu-list a')
		.evaluateAll((els) => els.map((el) => el.getAttribute('href')));

	expect(hrefs).toContain('https://www.youtube.com/watch?v=GSN9b3AIITw');
});

test('alcoding club links to the club page and the containerization post', async ({ page }) => {
	await page.goto('/university/alcoding-club-head');

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

	// The Docker workshop is described on the club detail page.
	await page.goto('/university/alcoding-club-head');
	await expect(page.getByText(/Docker workshop/).first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Pranavjeet Naidu' })).toBeVisible();
});

test('alcoding club page links the people and events it mentions', async ({ page }) => {
	await page.goto('/university/alcoding-club-head');

	const expected: Array<[string, string]> = [
		['core team', 'https://www.instagram.com/p/C_mwH_PykE7'],
		['October coding contest', 'https://www.instagram.com/p/DA3IL5wzAKc'],
		['Hashir Shaikh', 'https://www.linkedin.com/in/hashir-shaikh-9603a629a/'],
		['Munis Shafiq', 'https://www.linkedin.com/in/munis-shafiq/'],
		['Pranavjeet Naidu', 'https://www.linkedin.com/in/pranavjeet-naidu/'],
		['Terrathon 4.0', 'https://www.instagram.com/p/DHDHBApSLRI/'],
	];

	for (const [name, href] of expected) {
		await expect(page.getByRole('link', { name }), name).toHaveAttribute('href', href);
	}

	// The overview covers the whole tenure, so there is no highlights list.
	await expect(page.locator('#highlights')).toHaveCount(0);
	await expect(page.getByText(/Terrathon 3\.0/)).toBeVisible();
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
	await page.goto('/university/alcoding-club-head');

	await page.locator('.thumb').nth(1).click();
	const dialog = page.locator('dialog.lightbox');
	await expect(dialog).toBeVisible();
	await expect(dialog.locator('[data-count]')).toHaveText('02 / 03');

	await dialog.locator('[data-close]').click();
	await expect(dialog).toBeHidden();
});

test('detail page links back to the index', async ({ page }) => {
	await page.goto('/university/alcoding-club-head');

	await page.getByRole('link', { name: /all university/ }).click();
	await expect(page).toHaveURL(/\/university$/);
});

test('achievements pages do not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });

	for (const route of ['/achievements', '/university', '/university/alcoding-club-head']) {
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
