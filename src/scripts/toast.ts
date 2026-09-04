/**
 * A single document-level toast system.
 *
 * Toasts are appended to `#toasts` (rendered once by `Base.astro`), so they
 * escape the mobile pager's panels and stay put while the visitor swipes
 * between destinations. Any page script can call `showToast()`.
 *
 * Behaviour:
 * - A visible close button, Escape, and a sideways/upward swipe all dismiss.
 * - A draining progress bar shows how long is left; hovering or focusing the
 *   toast pauses the timer, and leaving resumes it from where it stopped.
 * - `id` lets a later toast replace an earlier one in place, which is how the
 *   in-flight "sending..." message turns into the result.
 */

export type ToastKind = 'ok' | 'error' | 'info';

export interface ToastOptions {
	/** Milliseconds on screen before the toast auto-dismisses. */
	duration?: number;
	/** Replaces any visible toast carrying the same id. */
	id?: string;
}

export interface ToastHandle {
	/** Dismiss this toast immediately. Safe to call more than once. */
	dismiss: () => void;
	/** The toast's element, if it is still in the DOM. */
	element: HTMLElement | null;
}

/** Comfortable reading time for a success or failure message. */
const DEFAULT_DURATION = 5000;
/** Keep the stack short so it never covers the thing it reports on. */
const TOAST_LIMIT = 3;
/** Matches the leave transition in `src/styles/toast.css`. */
const LEAVE_DURATION = 200;

const ICON_PATHS: Record<ToastKind, string> = {
	// check
	ok: 'M20 6 9 17l-5-5',
	// alert-circle
	error: 'M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
	// info
	info: 'M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

const CLOSE_PATH = 'M18 6 6 18M6 6l12 12';

let container: HTMLElement | null = null;
/** Keyed by the caller's `id`, so a repeat call can replace the old toast. */
const byId = new Map<string, HTMLElement>();
let escapeBound = false;

function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getContainer(): HTMLElement {
	if (container?.isConnected) return container;

	const existing = document.querySelector<HTMLElement>('#toasts');
	if (existing) {
		container = existing;
		return existing;
	}

	// `Base.astro` renders the live region; this is the fallback for scripts
	// running without it (an injected panel, or a standalone test harness).
	const created = document.createElement('div');
	created.id = 'toasts';
	created.className = 'toasts';
	created.setAttribute('role', 'status');
	created.setAttribute('aria-live', 'polite');
	created.setAttribute('aria-atomic', 'false');
	document.body.append(created);
	container = created;
	return created;
}

function svg(markup: string, className: string): SVGElement {
	const template = document.createElement('template');
	template.innerHTML = markup.trim();
	const node = template.content.firstElementChild;
	if (!(node instanceof SVGElement)) throw new Error('toast icon markup failed');
	node.setAttribute('class', className);
	return node;
}

function buildIcon(kind: ToastKind): SVGElement {
	const icon = svg(
		`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${ICON_PATHS[kind]}"/></svg>`,
		'toast-icon',
	);
	icon.classList.add(`toast-icon--${kind}`);
	return icon;
}

function buildCloseButton(): HTMLButtonElement {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'toast-close';
	button.setAttribute('aria-label', 'Dismiss notification');
	button.append(
		svg(
			`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${CLOSE_PATH}"/></svg>`,
			'toast-close-icon',
		),
	);
	return button;
}

/**
 * Track the Escape listener so it only exists while a toast does. Menus and
 * lightboxes use `<dialog>`, whose own Escape handling must win, so the key is
 * ignored while a dialog is open.
 */
function syncEscape(): void {
	const anyToasts = getContainer().childElementCount > 0;

	if (anyToasts && !escapeBound) {
		escapeBound = true;
		document.addEventListener('keydown', onKeydown);
		return;
	}

	if (!anyToasts && escapeBound) {
		escapeBound = false;
		document.removeEventListener('keydown', onKeydown);
	}
}

function onKeydown(event: KeyboardEvent): void {
	if (event.key !== 'Escape' || event.defaultPrevented) return;
	if (document.querySelector('dialog[open]')) return;

	// Escape belongs to the field the visitor is typing in, not to a toast
	// that happens to be on screen.
	const active = document.activeElement;
	if (
		active instanceof HTMLInputElement ||
		active instanceof HTMLTextAreaElement ||
		active instanceof HTMLSelectElement ||
		(active instanceof HTMLElement && active.isContentEditable)
	) {
		return;
	}

	// Newest first: Escape peels off the toast the visitor is most likely
	// looking at.
	const newest = container?.lastElementChild as HTMLElement | null;
	if (newest) dismissElement(newest);
}

interface ToastState {
	duration: number;
	remaining: number;
	startedAt: number;
	timer: number | undefined;
	paused: boolean;
	leaving: boolean;
}

const states = new WeakMap<HTMLElement, ToastState>();

function startTimer(toast: HTMLElement, state: ToastState): void {
	state.startedAt = performance.now();
	state.timer = window.setTimeout(() => dismissElement(toast), state.remaining);
}

function pauseTimer(toast: HTMLElement, state: ToastState): void {
	if (state.paused || state.leaving) return;
	state.paused = true;
	window.clearTimeout(state.timer);
	state.timer = undefined;
	state.remaining = Math.max(0, state.remaining - (performance.now() - state.startedAt));
	toast.classList.add('is-paused');
}

function resumeTimer(toast: HTMLElement, state: ToastState): void {
	if (!state.paused || state.leaving) return;
	state.paused = false;
	toast.classList.remove('is-paused');
	startTimer(toast, state);
}

function dismissElement(toast: HTMLElement): void {
	const state = states.get(toast);
	if (!state || state.leaving) return;
	state.leaving = true;
	window.clearTimeout(state.timer);

	const focusWasInside = toast.contains(document.activeElement);

	for (const [id, element] of byId) {
		if (element === toast) byId.delete(id);
	}

	toast.classList.remove('is-paused');
	toast.classList.add('is-leaving');
	// `inert` keeps a fading toast out of the tab order immediately.
	toast.setAttribute('inert', '');

	const remove = () => {
		if (!toast.isConnected) return;
		toast.remove();
		syncEscape();

		if (!focusWasInside) return;
		// Focus went away with the toast: hand it to the newest remaining
		// toast's close button, or back to the document.
		const next = container?.lastElementChild?.querySelector<HTMLButtonElement>('.toast-close');
		if (next) next.focus();
		else (document.activeElement as HTMLElement | null)?.blur();
	};

	if (prefersReducedMotion()) {
		remove();
		return;
	}

	toast.addEventListener('transitionend', remove, { once: true });
	// Reduced motion in the OS can change mid-flight; never strand a node.
	window.setTimeout(remove, LEAVE_DURATION + 100);
}

/** Attach close, pause, and swipe behaviour to a freshly built toast. */
function wireInteractions(toast: HTMLElement, state: ToastState): void {
	const close = toast.querySelector<HTMLButtonElement>('.toast-close');
	close?.addEventListener('click', (event) => {
		event.stopPropagation();
		dismissElement(toast);
	});

	// Hover and keyboard focus both hold the toast open.
	toast.addEventListener('pointerenter', () => pauseTimer(toast, state));
	toast.addEventListener('pointerleave', () => resumeTimer(toast, state));
	toast.addEventListener('focusin', () => pauseTimer(toast, state));
	toast.addEventListener('focusout', (event) => {
		const next = event.relatedTarget as Node | null;
		if (!next || !toast.contains(next)) resumeTimer(toast, state);
	});

	// Swipe: sideways or down flicks the toast away on touch and pen.
	let startX = 0;
	let startY = 0;
	let dx = 0;
	let dy = 0;
	let tracking = false;

	toast.addEventListener('pointerdown', (event) => {
		if (event.pointerType === 'mouse') return;
		if ((event.target as HTMLElement).closest('.toast-close')) return;
		tracking = true;
		startX = event.clientX;
		startY = event.clientY;
		dx = 0;
		dy = 0;
		toast.classList.add('is-dragging');
		// Capture keeps the gesture alive if the finger leaves the toast. It is
		// unsupported for synthetic events, which must not break the swipe.
		try {
			toast.setPointerCapture(event.pointerId);
		} catch {
			/* no capture: the gesture still works inside the toast */
		}
	});

	toast.addEventListener('pointermove', (event) => {
		if (!tracking) return;
		dx = event.clientX - startX;
		dy = event.clientY - startY;
		// Mostly-horizontal drags slide the toast sideways; vertical drags
		// follow the finger too, so either gesture reads as "flick it away".
		toast.style.setProperty('--toast-dx', `${dx}px`);
		toast.style.setProperty('--toast-dy', `${dy}px`);
	});

	const endDrag = () => {
		if (!tracking) return;
		tracking = false;
		toast.classList.remove('is-dragging');

		const horizontal = Math.abs(dx) >= Math.abs(dy);
		const distance = horizontal ? dx : dy;
		const threshold = horizontal ? 70 : 56;

		toast.style.removeProperty('--toast-dx');
		toast.style.removeProperty('--toast-dy');

		if (Math.abs(distance) > threshold) {
			if (horizontal) toast.classList.add(distance > 0 ? 'is-swipe-right' : 'is-swipe-left');
			else toast.classList.add(distance > 0 ? 'is-swipe-down' : 'is-swipe-up');
			dismissElement(toast);
			return;
		}

		// Under threshold: clearing the custom properties eases it back home
		// under the base transition.
	};

	toast.addEventListener('pointerup', endDrag);
	toast.addEventListener('pointercancel', endDrag);
}

/**
 * Show a toast. Returns a handle so a caller can dismiss or update it later.
 *
 * `text` is written with `textContent`, never HTML.
 */
export function showToast(kind: ToastKind, text: string, options: ToastOptions = {}): ToastHandle {
	const duration = Math.max(0, options.duration ?? DEFAULT_DURATION);
	const region = getContainer();

	// A repeat id replaces the old toast without a leave animation, so
	// "sending..." never flashes out before the result lands.
	if (options.id) {
		const previous = byId.get(options.id);
		if (previous) {
			window.clearTimeout(states.get(previous)?.timer);
			previous.remove();
			byId.delete(options.id);
		}
	}

	const toast = document.createElement('div');
	toast.className = 'toast';
	toast.dataset.kind = kind;
	if (options.id) toast.dataset.toastId = options.id;
	toast.style.setProperty('--toast-duration', `${duration}ms`);

	const message = document.createElement('p');
	message.className = 'toast-message';
	message.textContent = text;

	const progress = document.createElement('span');
	progress.className = 'toast-progress';
	progress.setAttribute('aria-hidden', 'true');

	toast.append(buildIcon(kind), message, buildCloseButton(), progress);
	region.append(toast);

	if (options.id) byId.set(options.id, toast);

	// Trim the oldest toasts once the stack is full.
	while (region.childElementCount > TOAST_LIMIT) {
		const oldest = region.firstElementChild as HTMLElement | null;
		if (!oldest) break;
		window.clearTimeout(states.get(oldest)?.timer);
		for (const [id, element] of byId) {
			if (element === oldest) byId.delete(id);
		}
		oldest.remove();
	}

	const state: ToastState = {
		duration,
		remaining: duration,
		startedAt: performance.now(),
		timer: undefined,
		paused: false,
		leaving: false,
	};
	states.set(toast, state);

	wireInteractions(toast, state);
	if (duration > 0) startTimer(toast, state);
	syncEscape();

	return {
		dismiss: () => dismissElement(toast),
		get element() {
			return toast.isConnected ? toast : null;
		},
	};
}

/** Remove every visible toast. */
export function clearToasts(): void {
	for (const toast of Array.from(getContainer().children)) {
		dismissElement(toast as HTMLElement);
	}
}