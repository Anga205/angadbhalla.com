import { test, expect } from '@playwright/test';

test('sidebar uses the Adwaita dark palette', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('#wayfinder')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
	await expect(page.locator('main .window')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
	await expect(page.locator('main .headerbar')).toHaveCSS('background-color', 'rgb(48, 48, 48)');
	await expect(page.locator('#wayfinder .terminal')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
	await expect(
		page.locator('.waypoint-link[aria-current="page"] .waypoint-icon'),
	).toHaveCSS('color', 'rgb(57, 255, 136)');
});

test('mobile rail drops the trailing slash and uses short labels', async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name !== 'mobile', 'mobile rail only');

	await page.goto('/');

	const slash = page.locator('.waypoint-slash').first();
	await expect(slash).toBeHidden();

	// The rail is six items wide, so the full labels are replaced by short
	// ones: no trailing slash, nothing truncated away.
	await expect(page.locator('.waypoint-label').first()).toBeHidden();
	await expect(page.locator('.waypoint-label-short').first()).toBeVisible();

	const labels = await page
		.locator('.waypoint-label-short')
		.evaluateAll((els) =>
			els.map((el) => ({ text: el.textContent ?? '', clipped: el.scrollWidth > el.clientWidth })),
		);
	expect(labels).toHaveLength(6);
	for (const label of labels) {
		expect(label.text.endsWith('/')).toBe(false);
		expect(label.clipped).toBe(false);
	}
});

test('sidebar columns align across every destination', async ({ page }, testInfo) => {
	// The mobile rail is a horizontal flex strip, not a column grid.
	testInfo.skip(testInfo.project.name === 'mobile', 'desktop rail only');

	await page.goto('/');

	const links = page.locator('.waypoint-link');
	await expect(links).toHaveCount(6);

	// The rail is the minimized sidebar: icon + label, two columns.
	const columns = await links.first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
	expect(columns.split(' ')).toHaveLength(2);

	const icons = await page.locator('.waypoint-icon').evaluateAll((els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().x)),
	);
	const labels = await page.locator('.waypoint-label').evaluateAll((els) =>
		els.map((el) => Math.round(el.getBoundingClientRect().x)),
	);
	const verticalOffsets = await links.evaluateAll((els) =>
		els.map((el) => {
			const linkBox = el.getBoundingClientRect();
			const iconBox = el.querySelector('.waypoint-icon')!.getBoundingClientRect();
			return Math.abs(
				linkBox.top + linkBox.height / 2 - (iconBox.top + iconBox.height / 2),
			);
		}),
	);

	expect(new Set(icons).size).toBe(1);
	expect(new Set(labels).size).toBe(1);
	for (const offset of verticalOffsets) expect(offset).toBeLessThanOrEqual(1);
});

test('home page does not overflow horizontally', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('#wayfinder')).toBeVisible();
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});

test('every destination has its own route and keeps the navigation available', async ({ page }) => {
	const routes = [
		['Projects', '/projects'],
		['University', '/university'],
		['Achievements', '/achievements'],
		['Philosophy', '/philosophy'],
		['Contact', '/contact'],
	] as const;

	for (const [name, route] of routes) {
		await page.goto('/');
		await page.getByRole('link', { name: new RegExp(`${name}:`) }).click();
		await expect(page).toHaveURL(new RegExp(`${route}$`));
		await expect(page.locator('#wayfinder')).toHaveClass(/is-minimized/);
		await expect(page.locator('#wayfinder')).toBeVisible();
	}
});

test('projects route renders the project cards', async ({ page }) => {
	await page.goto('/projects');

	const cards = page.locator('.card');
	await expect(cards.first()).toBeVisible();
	expect(await cards.count()).toBeGreaterThan(1);
	await expect(page.getByRole('heading', { name: 'AngaDriveV2' })).toBeVisible();
	await expect(page.getByText('public archive', { exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Compiler' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Dotfiles' })).toHaveCount(0);
	await expect(page.locator('.card').last()).toContainText('AngaDriveV2');

	// Cards must not depend on having every link.
	await expect(page.locator('.card-actions').first()).toBeVisible();
});

test('archived project cards explain the warning icon on hover', async ({ page }, testInfo) => {
	if (testInfo.project.name === 'mobile') testInfo.skip();

	await page.goto('/projects');

	const card = page.locator('.card').filter({ hasText: 'AngaDriveV2' });
	const tooltip = card.locator('.card-tooltip');

	await expect(tooltip).toHaveCount(1);
	await expect(tooltip).toHaveAttribute('role', 'tooltip');
	await expect(tooltip).toContainText('legacy project');
	await expect(tooltip).toContainText('public archive');
	await expect(tooltip).toBeHidden();

	await card.hover();
	await expect(tooltip).toBeVisible();

	// Active cards never carry the warning tooltip.
	await expect(
		page
			.locator('.card')
			.filter({ has: page.getByRole('heading', { name: 'AngaDriveV3', exact: true }) })
			.locator('.card-tooltip'),
	).toHaveCount(0);
});

test('AngaDriveV2 links to its archived repository', async ({ page }) => {
	await page.goto('/projects');

	const card = page.locator('.card').filter({ hasText: 'AngaDriveV2' });
	await card.getByRole('button', { name: 'AngaDriveV2' }).click();
	await expect(card).toContainText('public archive');
	await expect(page.locator('#menu-angadrive-v2 a[href="https://github.com/Anga205/AngaDriveV2"]')).toBeVisible();
});

test('project cards open link menus with the published project links', async ({ page }, testInfo) => {
	if (testInfo.project.name === 'mobile') testInfo.skip();

	await page.goto('/projects');

	await page.getByRole('button', { name: 'AngaDriveV3' }).click();
	const driveMenu = page.locator('#menu-angadrive[open]');
	await expect(driveMenu).toBeVisible();
	const driveHrefs = await driveMenu.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
	expect(driveHrefs).toContain('https://drive.anga.codes');
	expect(driveHrefs).toContain('https://github.com/Anga205/AngaDriveV3');
	expect(driveHrefs).toContain('https://lnkd.in/p/dknw77Br');

	await page.keyboard.press('Escape');
	await expect(driveMenu).toBeHidden();

	await page.getByRole('button', { name: 'AngaOS' }).click();
	const osMenu = page.locator('#menu-angaos[open]');
	await expect(osMenu).toBeVisible();
	const osHrefs = await osMenu.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
	expect(osHrefs).toContain('https://github.com/Anga205/AngaOS');
	expect(osHrefs).toContain('https://lnkd.in/p/deAt6GRS');
});

test('code execution API uses its live deployment link', async ({ page }) => {
	await page.goto('/projects');

	const card = page.locator('.card').filter({ hasText: 'Code Execution API' });
	const liveLink = card.getByRole('link', { name: 'Code Execution API live deployment' });
	await expect(liveLink).toHaveAttribute('href', 'https://compiler.anga.codes');
	await expect(liveLink).toHaveAttribute('target', '_blank');

	await card.getByRole('button', { name: 'Code Execution API' }).click();
	await expect(page.locator('#menu-code-execution-api')).toContainText('live deployment');
	await expect(page.locator('#menu-code-execution-api a[href="https://compiler.anga.codes"]')).toBeVisible();
	await expect(page.locator('#menu-code-execution-api a[href="https://lnkd.in/p/duhbNW3q"]')).toBeVisible();
});

test('sidebar highlights the current route, not always projects', async ({ page }) => {
	await page.goto('/contact');

	await expect(page.locator('[data-destination-link="contact"]')).toHaveAttribute(
		'aria-current',
		'page',
	);
	await expect(page.locator('[data-destination-link="projects"]')).not.toHaveAttribute(
		'aria-current',
		'page',
	);
});

test('projects navigation has no redundant project list', async ({ page }) => {
	await page.goto('/projects');

	await expect(page.locator('#project-list')).toHaveCount(0);

	const projectsLink = page.locator('[data-destination-link="projects"]');
	await expect(projectsLink).toHaveAttribute('href', '/projects');
	await projectsLink.click();
	await expect(page).toHaveURL(/\/projects$/);
});

test('mobile home page has no overflow and keeps the bottom rail usable', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);

	await page.getByRole('link', { name: /Contact:/ }).click();
	await expect(page.locator('#wayfinder')).toHaveCSS('bottom', '0px');
	await expect(page.locator('#wayfinder')).toHaveCSS('width', '375px');
});
