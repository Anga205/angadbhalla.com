import { test, expect, type Page } from '@playwright/test';

const API = 'https://codeapi.anga.codes/v2/execute';

const CORS = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'POST, OPTIONS',
	'access-control-allow-headers': 'content-type',
};

/**
 * Mock the API. The preflight has to be answered too, otherwise the browser
 * blocks the POST before it ever reaches the handler.
 */
async function mockApi(page: Page, body: unknown) {
	await page.route(API, async (route) => {
		if (route.request().method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: CORS });
			return;
		}
		await route.fulfill({
			status: 200,
			headers: { ...CORS, 'content-type': 'application/json' },
			body: JSON.stringify(body),
		});
	});
}

async function openProjects(page: Page) {
	await page.goto('/projects');
	await expect(page.locator('#demo')).toBeVisible();
}

async function openDemo(page: Page) {
	await openProjects(page);
	await expect(page.locator('#demo')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
}

const getCode = (page: Page) =>
	page.evaluate(() => (window as unknown as { __demo: { getCode(): string } }).__demo.getCode());

test.beforeEach(async ({}, testInfo) => {
	test.skip(testInfo.project.name === 'reduced-motion', 'demo behaviour is motion-independent');
	test.skip(testInfo.project.name === 'mobile', 'demo behaviour is covered on desktop');
});

test('projects route renders the editor window', async ({ page }) => {
	await openProjects(page);

	await expect(page.locator('#demo')).toBeVisible();
	await expect(page.locator('.sidebar')).toBeVisible();
	await expect(page.locator('.statusbar')).toBeVisible();
});

test('language picker swaps the editor content', async ({ page }) => {
	await openDemo(page);

	const before = await getCode(page);
	await page.selectOption('#language', 'c');
	await expect.poll(() => getCode(page)).not.toBe(before);

	const after = await getCode(page);
	expect(after).toContain('#include');
});

test('algorithm picker swaps the editor content', async ({ page }) => {
	await openDemo(page);

	const before = await getCode(page);
	await page.selectOption('#algorithm', 'palindrome');
	await expect.poll(() => getCode(page)).not.toBe(before);

	const after = await getCode(page);
	expect(after.toLowerCase()).toContain('palindrome');
});

test('run posts the documented caps and renders output', async ({ page }) => {
	let sent: Record<string, unknown> | null = null;

	await page.route(API, async (route) => {
		if (route.request().method() === 'OPTIONS') {
			await route.fulfill({ status: 204, headers: CORS });
			return;
		}
		sent = route.request().postDataJSON();
		await route.fulfill({
			status: 200,
			headers: { ...CORS, 'content-type': 'application/json' },
			body: JSON.stringify({
				output: '0 1 1 2 3 5 8 13 21 34 \n',
				error: '',
				cpu_time: 12_400_000,
				memory_used: 3_200,
			}),
		});
	});

	await openDemo(page);
	await page.click('#run');

	await expect(page.locator('[data-output="stdout"]')).toContainText('0 1 1 2 3 5 8 13 21 34');
	await expect(page.locator('[data-output="meta"]')).toContainText('runtime 12.4ms');
	await expect(page.locator('[data-output="meta"]')).toContainText('memory 3.1mb');

	expect(sent).toMatchObject({
		language: 'python',
		timeout: 10_000_000_000,
		max_memory: 65_536,
	});
});

test('timeout sentinel renders a human sentence', async ({ page }) => {
	// The API appends a suffix to the sentinel, so this mirrors the real body.
	await mockApi(page, {
		output: '',
		error: 'Execution Timed Out\nProcess terminated by signal SIGKILL (9): killed',
		cpu_time: 10_000_000_000,
		memory_used: 1_024,
	});

	await openDemo(page);
	await page.click('#run');

	await expect(page.locator('[data-output="note"]')).toContainText('10s limit');
	await expect(page.locator('#output')).not.toContainText('SIGKILL');
});

test('memory sentinel renders a human sentence', async ({ page }) => {
	await mockApi(page, {
		output: '',
		error: 'Memory limit exceeded\nProcess terminated by signal SIGKILL (9): killed',
		cpu_time: 1_000_000,
		memory_used: 71_600,
	});

	await openDemo(page);
	await page.click('#run');

	await expect(page.locator('[data-output="note"]')).toContainText('64mb');
});

test('network failure shows the unreachable state', async ({ page }) => {
	await page.route(API, (route) => route.abort());

	await openDemo(page);
	await page.click('#run');

	await expect(page.locator('[data-output="note"]')).toContainText('unreachable');
	await expect(page.locator('#output a')).toHaveAttribute(
		'href',
		'https://github.com/Anga205/CodeExecutionAPI',
	);
});

test('mobile layout stacks and does not overflow', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await openDemo(page);

	const overflow = await page.locator('#demo').evaluate((el) => el.scrollWidth - el.clientWidth);
	expect(overflow).toBeLessThanOrEqual(1);

	// The editor and output panel both remain reachable on a narrow screen.
	await expect(page.locator('#editor')).toBeVisible();
	await expect(page.locator('#output')).toBeVisible();
	await expect(page.locator('#run')).toBeVisible();
});
