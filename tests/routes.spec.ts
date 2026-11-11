import { test, expect } from '@playwright/test';

async function reachSelector(page: import('@playwright/test').Page) {
	await page.goto('/');
	await expect(page.locator('#opening #advance')).toBeVisible({ timeout: 25_000 });
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/selector$/);
	await expect(page.locator('#wayfinder')).toBeVisible();
}

test('bfcache restore shows the completed intro instead of a blank page', async ({ page }) => {
	await reachSelector(page);
	await page.goBack();
	await expect(page).toHaveURL(/\/$/);

	// Simulate a bfcache restore, which is what causes the blank screen.
	await page.evaluate(() => {
		window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
	});

	await expect(page.locator('#opening')).toBeVisible();
	await expect(page.locator('#frame')).toBeVisible();
	await expect(page.locator('#advance')).toBeVisible();
	await expect(page.locator('#typed')).toContainText('imma just show you');
});

test('selector uses the Adwaita dark palette', async ({ page }) => {
	await page.goto('/selector');

	await expect(page.locator('#wayfinder')).toHaveCSS('background-color', 'rgb(23, 23, 23)');
	await expect(page.locator('.window')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
	await expect(page.locator('.headerbar')).toHaveCSS('background-color', 'rgb(48, 48, 48)');
	await expect(page.locator('.terminal')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
	await expect(
		page.locator('.waypoint-link[aria-current="page"] .waypoint-icon'),
	).toHaveCSS('color', 'rgb(57, 255, 136)');
});

test('timeline columns align across every destination', async ({ page }) => {
	await page.goto('/selector');

	const links = page.locator('.waypoint-link');
	await expect(links).toHaveCount(4);

	const columns = await links.first().evaluate((el) => getComputedStyle(el).gridTemplateColumns);
	expect(columns.split(' ')).toHaveLength(3);

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

test('selector does not overflow horizontally', async ({ page }) => {
	await page.goto('/selector');
	await expect(page.locator('#wayfinder')).toBeVisible();
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});

test('every destination has its own route and keeps the navigation available', async ({ page }) => {
	const routes = [
		['Projects', '/projects'],
		['About me', '/about'],
		['Achievements', '/achievements'],
		['Contact', '/contact'],
	] as const;

	for (const [name, route] of routes) {
		await page.goto('/selector');
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
	await expect(page.getByText('public archive')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Compiler' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Dotfiles' })).toHaveCount(0);
	await expect(page.locator('.card').last()).toContainText('AngaDriveV2');

	// Cards must not depend on having every link.
	await expect(page.locator('.card-actions').first()).toBeVisible();
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

test('mobile selector has no overflow and keeps the bottom rail usable', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/selector');

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);

	await page.getByRole('link', { name: /Contact:/ }).click();
	await expect(page.locator('#wayfinder')).toHaveCSS('bottom', '0px');
	await expect(page.locator('#wayfinder')).toHaveCSS('width', '375px');
});
