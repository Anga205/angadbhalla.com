import { test, expect } from '@playwright/test';

test('/contact still resolves to the home page message form', async ({ page }) => {
	await page.goto('/contact');

	await expect(page).toHaveURL(/\/#contact$/);
	await expect(page.getByRole('heading', { name: 'Angad Bhalla' })).toBeVisible();
	await expect(page.locator('#contact-form')).toBeVisible();
	await expect(page.locator('.contact-link')).toHaveCount(0);

	// The page scrolls inside `main`, so the form has to be brought into view
	// explicitly rather than by the browser's own anchor jump.
	const box = await page.locator('#contact').boundingBox();
	expect(box).not.toBeNull();
	expect(box!.y).toBeLessThan(page.viewportSize()!.height);
});

test('contact is no longer a sidebar destination', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('[data-destination-link]')).toHaveCount(5);
	await expect(page.locator('[data-destination-link="contact"]')).toHaveCount(0);
	await expect(page.getByRole('link', { name: /^Contact:/ })).toHaveCount(0);
});

test('home page lists every contact with the right link', async ({ page }) => {
	await page.goto('/');

	const cards = page.locator('.contact-card');
	await expect(cards).toHaveCount(6);

	await expect(cards.nth(0)).toHaveAttribute('href', 'mailto:angadbhalla2005@gmail.com');
	await expect(cards.nth(1)).toHaveAttribute('href', 'https://github.com/Anga205/');
	await expect(cards.nth(2)).toHaveAttribute('href', 'https://www.linkedin.com/in/anga');
	await expect(cards.nth(3)).toHaveAttribute(
		'href',
		'https://discord.com/users/477680545271250944',
	);
	await expect(cards.nth(4)).toHaveAttribute('href', 'https://www.instagram.com/_anga205/');
	await expect(cards.nth(5)).toHaveAttribute('href', 'https://reddit.com/u/Anga205');
	await expect(page.locator('[data-copy]')).toHaveCount(0);
});

test('contact form requires both fields', async ({ page }) => {
	await page.goto('/');

	await page.click('#send');
	await expect(page.locator('.toast')).toHaveText('email and message are required.');
});

test('a toast can be dismissed with its close button', async ({ page }) => {
	await page.goto('/');

	await page.click('#send');
	const toast = page.locator('.toast');
	await expect(toast).toBeVisible();

	const close = page.getByRole('button', { name: 'Dismiss notification' });
	await expect(close).toBeVisible();
	await close.click();

	await expect(page.locator('.toast')).toHaveCount(0);
});

test('a toast can be dismissed with Escape', async ({ page }) => {
	await page.goto('/');

	await page.click('#send');
	await expect(page.locator('.toast')).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(page.locator('.toast')).toHaveCount(0);
});

test('the toast carries a kind icon and a draining progress bar', async ({ page }) => {
	await page.goto('/');

	await page.click('#send');
	const toast = page.locator('.toast[data-kind="error"]');
	await expect(toast).toBeVisible();

	// Decorative, so neither contributes to the announced text.
	await expect(toast.locator('.toast-icon')).toHaveCount(1);
	await expect(toast.locator('.toast-progress')).toHaveCount(1);
	await expect(toast.locator('.toast-icon')).toHaveAttribute('aria-hidden', 'true');
	await expect(toast.locator('.toast-progress')).toHaveAttribute('aria-hidden', 'true');
});

test('hovering a toast pauses its timer', async ({ page }) => {
	await page.goto('/');

	await page.click('#send');
	const toast = page.locator('.toast');
	await expect(toast).toBeVisible();

	await toast.hover();
	await expect(toast).toHaveClass(/is-paused/);
	await expect(toast.locator('.toast-progress')).toHaveCSS('animation-play-state', 'paused');

	// Held open well past the default lifetime.
	await page.waitForTimeout(6000);
	await expect(toast).toBeVisible();

	await page.mouse.move(0, 0);
	await expect(toast).not.toHaveClass(/is-paused/);
	await expect(toast).toHaveCount(0, { timeout: 8000 });
});

test('an auto-dismissing toast goes away on its own', async ({ page }) => {
	await page.goto('/');

	await page.click('#send');
	await expect(page.locator('.toast')).toBeVisible();
	await expect(page.locator('.toast')).toHaveCount(0, { timeout: 10_000 });
});

test('contact form sends the template variables and confirms with a toast', async ({ page }) => {
	// The real service is live, so the request is intercepted: the test asserts
	// what the form sends without delivering mail.
	let payload: Record<string, unknown> | undefined;
	await page.route('https://api.emailjs.com/**', async (route) => {
		payload = route.request().postDataJSON();
		await route.fulfill({ status: 200, body: 'OK' });
	});

	await page.goto('/');

	await page.fill('#email', 'someone@example.com');
	await page.fill('#message', 'hello there');
	await page.click('#send');

	await expect(page.locator('.toast[data-kind="ok"]')).toContainText('sent', {
		timeout: 15_000,
	});
	// The in-flight toast is replaced by the result, never shown beside it.
	await expect(page.locator('.toast[data-kind="info"]')).toHaveCount(0);
	await expect(page.locator('.toast')).toHaveCount(1);
	await expect(page.locator('#send')).toBeEnabled();
	await expect(page.locator('#email')).toHaveValue('');

	const params = payload?.template_params as Record<string, string>;
	expect(params.app).toBe('angadbhalla.com');
	expect(params.message).toBe('hello there');
	expect(params.contact).toBe('someone@example.com');
	// `20 Nov 2026, 3:17 am`: no slashes (EmailJS escapes them into `&#x2F;`
	// in the subject) and no seconds.
	expect(params.time).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4}, \d{1,2}:\d{2} [ap]m$/);
});

test('contact form reports a failed send with a toast', async ({ page }) => {
	await page.route('https://api.emailjs.com/**', (route) =>
		route.fulfill({ status: 500, body: 'nope' }),
	);

	await page.goto('/');

	await page.fill('#email', 'someone@example.com');
	await page.fill('#message', 'hello');
	await page.click('#send');

	await expect(page.locator('.toast[data-kind="error"]')).toContainText('could not send', {
		timeout: 15_000,
	});
	await expect(page.locator('#send')).toBeEnabled();
});

test('contact buttons stack one per row beside the form on desktop', async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name === 'mobile', 'the two-column layout is desktop only');

	await page.goto('/');

	const cards = page.locator('.contact-card');
	const boxes = await cards.evaluateAll((els) =>
		els.map((el) => {
			const box = el.getBoundingClientRect();
			return { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width) };
		}),
	);

	// One column, six rows.
	expect(new Set(boxes.map((box) => box.x)).size).toBe(1);
	expect(new Set(boxes.map((box) => box.y)).size).toBe(6);

	// Rows share a width.
	const widths = boxes.map((box) => box.width);
	expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);

	// The form sits to the right of the buttons, not below them.
	const grid = await page.locator('.contact-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns);
	expect(grid.split(' ')).toHaveLength(2);

	const formBox = await page.locator('#contact').boundingBox();
	expect(formBox).not.toBeNull();
	expect(formBox!.x).toBeGreaterThan(Math.max(...boxes.map((box) => box.x)));
});

test('the send button spans the width of the fields above it', async ({ page }) => {
	await page.goto('/');

	const field = await page.locator('#message').boundingBox();
	const button = await page.locator('#send').boundingBox();
	expect(field).not.toBeNull();
	expect(button).not.toBeNull();
	expect(Math.abs(field!.width - button!.width)).toBeLessThanOrEqual(1);
});

test('the form fields are labelled by their placeholders', async ({ page }) => {
	await page.goto('/');

	// No visible labels: the placeholder carries the hint, the aria-label keeps
	// the field named for assistive tech.
	await expect(page.locator('.field > span')).toHaveCount(0);
	await expect(page.locator('#email')).toHaveAttribute('placeholder', 'your@email-id.com');
	await expect(page.locator('#message')).toHaveAttribute(
		'placeholder',
		'type any message here.....',
	);
	await expect(page.getByRole('textbox', { name: 'your email' })).toBeVisible();
	await expect(page.getByRole('textbox', { name: 'message' })).toBeVisible();
});

test('the message box cannot be resized by the user', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('#message')).toHaveCSS('resize', 'none');
});

test('the message form matches the height of the contact buttons', async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name === 'mobile', 'the columns only sit side by side on desktop');

	await page.goto('/');

	const links = await page.locator('.links').boundingBox();
	const form = await page.locator('.form-section').boundingBox();
	expect(links).not.toBeNull();
	expect(form).not.toBeNull();
	expect(Math.abs(links!.height - form!.height)).toBeLessThanOrEqual(1);
});

test('the contact section no longer prints a shell prompt', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('.links-prompt')).toHaveCount(0);
	await expect(page.getByText('$ ls ~/links')).toHaveCount(0);
});

test('the message form no longer prints a shell prompt', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('.form-prompt')).toHaveCount(0);
	await expect(page.getByText('$ send --to anga')).toHaveCount(0);
});

test('the form heading and note read as plain copy', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'Send me a message', level: 2 })).toBeVisible();
	await expect(page.getByText('Email works too, but this form goes straight to my inbox.')).toHaveCount(0);
});

test('contact buttons keep the 3 x 2 grid with the form below on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');

	const boxes = await page.locator('.contact-card').evaluateAll((els) =>
		els.map((el) => {
			const box = el.getBoundingClientRect();
			return { x: Math.round(box.x), y: Math.round(box.y) };
		}),
	);

	expect(new Set(boxes.map((box) => box.x)).size).toBe(3);
	expect(new Set(boxes.map((box) => box.y)).size).toBe(2);

	// The form stacks underneath the buttons.
	const formBox = await page.locator('#contact').boundingBox();
	expect(formBox).not.toBeNull();
	expect(formBox!.y).toBeGreaterThan(Math.max(...boxes.map((box) => box.y)));
});

test('home page and its message form do not overflow on mobile', async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 667 });
	await page.goto('/');
	await expect(page.locator('.contact-card').first()).toBeVisible();
	await expect(page.locator('#contact-form')).toBeVisible();

	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - window.innerWidth,
	);
	expect(overflow).toBeLessThanOrEqual(1);
});

test('toasts stay clear of the mobile navigation rail', async ({ page }, testInfo) => {
	testInfo.skip(testInfo.project.name !== 'mobile', 'the rail only exists on phones');

	await page.goto('/');
	await page.click('#send');

	const toast = page.locator('.toast');
	await expect(toast).toBeVisible();

	const toastBox = await toast.evaluate(async (element) => {
		// The entrance animation scales the box; measure once it has settled.
		await Promise.all(element.getAnimations().map((animation) => animation.finished));
		const box = element.getBoundingClientRect();
		return { x: box.x, y: box.y, width: box.width, height: box.height };
	});
	const railBox = await page.locator('#wayfinder').boundingBox();
	expect(railBox).not.toBeNull();

	// Sits fully above the fixed rail rather than behind it.
	expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(railBox!.y + 1);

	// Edge to edge, less the 0.75rem gutters.
	const viewport = page.viewportSize()!;
	expect(Math.abs(toastBox.width - (viewport.width - 24))).toBeLessThanOrEqual(2);
});

test('a sideways swipe dismisses a toast on touch', async ({ page }) => {
	await page.goto('/');
	await page.click('#send');

	const toast = page.locator('.toast');
	await expect(toast).toBeVisible();

	// The handler ignores mouse pointers, so the gesture is dispatched as a
	// real touch-typed pointer sequence.
	await toast.evaluate((element) => {
		const box = element.getBoundingClientRect();
		const x = box.x + box.width / 2;
		const y = box.y + box.height / 2;
		const init = (clientX: number) => ({
			bubbles: true,
			pointerId: 1,
			pointerType: 'touch',
			isPrimary: true,
			clientX,
			clientY: y,
		});

		element.dispatchEvent(new PointerEvent('pointerdown', init(x)));
		element.dispatchEvent(new PointerEvent('pointermove', init(x + 140)));
		element.dispatchEvent(new PointerEvent('pointerup', init(x + 140)));
	});

	await expect(page.locator('.toast')).toHaveCount(0);
});
