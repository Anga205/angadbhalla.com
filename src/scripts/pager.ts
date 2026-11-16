/**
 * Mobile swipe pager.
 *
 * On phones the five top-level destinations are laid out side by side in one
 * horizontally scroll-snapping container (`Pager.astro`). This module makes
 * that container behave like a real pager:
 *
 * - the panel for the current route is aligned on load, without animating;
 * - the other panels are fetched and injected on demand, so the first paint
 *   stays as cheap as a single page;
 * - the URL follows the panel the pager settles on, and back/forward move the
 *   pager back to the matching panel;
 * - the bottom rail scrolls the pager instead of reloading the page.
 *
 * Panels are never removed once loaded, so each page keeps its own vertical
 * scroll position for free.
 *
 * On desktop this module does nothing: the pager is a plain block wrapper and
 * navigation stays a normal page load.
 */
const MOBILE_QUERY = '(max-width: 639px)';
/** How long the pager must be still before a scroll counts as a snap. */
const SETTLE_DELAY = 120;

type Panel = HTMLElement;

export function initPager(): void {
	const pager = document.querySelector<HTMLElement>('[data-pager]');
	if (!pager) return;

	const panels = Array.from(pager.querySelectorAll<Panel>('[data-panel]'));
	if (panels.length === 0) return;

	const media = window.matchMedia(MOBILE_QUERY);
	const loaded = new Set<string>();
	let activeIndex = Math.max(
		0,
		panels.findIndex((panel) => panel.dataset.panel === pager.dataset.active),
	);
	let enabled = false;
	let settleTimer = 0;
	let tweenFrame = 0;
	// Set while the pager is being scrolled on purpose, so the snap handler
	// does not mistake a programmatic scroll for a user swipe.
	let suppressSettle = false;

	// The server-rendered panel is already initialised by the page's own script.
	const initialId = panels[activeIndex]?.dataset.panel;
	if (initialId) loaded.add(initialId);

	const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const indexForPath = (pathname: string): number => {
		const path = pathname.replace(/\/$/, '') || '/';
		return panels.findIndex((panel) => {
			const href = (panel.dataset.href ?? '/').replace(/\/$/, '') || '/';
			return path === href;
		});
	};

	const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
		const target = index * pager.clientWidth;
		const instant = behavior === 'auto' || reducedMotion();

		suppressSettle = true;
		window.cancelAnimationFrame(tweenFrame);

		if (instant) {
			pager.scrollLeft = target;
			suppressSettle = false;
			return;
		}

		// A hand-rolled tween rather than `behavior: 'smooth'`: it is
		// deterministic, it can be cancelled when the visitor grabs the pager
		// mid-flight, and it does not depend on the browser animating a
		// programmatic scroll.
		//
		// Mandatory snapping would fight every intermediate `scrollLeft`
		// assignment and yank the pager back to the panel it started on, so
		// snapping is suspended for the duration of the tween.
		const from = pager.scrollLeft;
		const distance = target - from;
		const startedAt = performance.now();
		const duration = 320;

		pager.style.scrollSnapType = 'none';

		const finish = () => {
			pager.scrollLeft = target;
			pager.style.scrollSnapType = '';
			tweenFrame = 0;
			suppressSettle = false;
		};

		const step = (now: number) => {
			const progress = Math.min((now - startedAt) / duration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			pager.scrollLeft = from + distance * eased;

			if (progress < 1) {
				tweenFrame = window.requestAnimationFrame(step);
				return;
			}

			finish();
		};

		tweenFrame = window.requestAnimationFrame(step);
	};

	/**
	 * Copy the stylesheets the fetched page needs but this document lacks.
	 *
	 * In a build these are `<link rel="stylesheet">`; in dev Astro inlines
	 * `<style>` tags instead. Both are deduped so a shared global sheet is not
	 * added twice.
	 */
	const mergeHead = (doc: Document) => {
		const stylesheetHrefs = new Set(
			Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')).map(
				(link) => link.getAttribute('href'),
			),
		);
		const styleTexts = new Set(
			Array.from(document.head.querySelectorAll('style')).map((style) => style.textContent),
		);

		for (const node of Array.from(doc.head.querySelectorAll('link[rel="stylesheet"], style'))) {
			if (node.tagName === 'LINK') {
				const href = node.getAttribute('href');
				if (!href || stylesheetHrefs.has(href)) continue;
				stylesheetHrefs.add(href);
				document.head.append(node.cloneNode(true));
				continue;
			}

			const text = node.textContent;
			if (!text || styleTexts.has(text)) continue;
			styleTexts.add(text);
			document.head.append(node.cloneNode(true));
		}
	};

	/**
	 * Run the initialisers a freshly injected panel needs.
	 *
	 * The imports are dynamic so a page only pays for the scripts it actually
	 * shows: the contact form's EmailJS bundle is not pulled in until the home
	 * panel is injected.
	 */
	const initPanel = async (panel: Panel) => {
		switch (panel.dataset.panel) {
			case 'home':
				(await import('./home')).initHome(panel);
				break;
			case 'projects':
				(await import('./link-menu')).initLinkMenus(panel);
				break;
			case 'university':
			case 'achievements':
				(await import('./link-menu')).initLinkMenus(panel);
				(await import('./achievement-cards')).initLeetCodeCounts(panel);
				break;
			case 'philosophy':
				(await import('./philosophy-model')).initPortraitModel(panel);
				break;
		}
	};

	const ensureLoaded = async (index: number) => {
		const panel = panels[index];
		const id = panel.dataset.panel ?? '';
		if (!id || loaded.has(id)) return;
		loaded.add(id);

		const href = panel.dataset.href ?? '/';
		try {
			const response = await fetch(href, { headers: { accept: 'text/html' } });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);

			const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
			const source = doc.querySelector<HTMLElement>(`[data-panel="${id}"]`);
			if (!source) throw new Error('panel missing');

			mergeHead(doc);
			panel.replaceChildren(...Array.from(source.childNodes));
			await initPanel(panel);
		} catch {
			loaded.delete(id);
			// A failed fetch must not strand the visitor: fall back to a real load.
			window.location.href = href;
		}
	};

	const setActive = (index: number, options: { push?: boolean; scroll?: boolean } = {}) => {
		const next = Math.min(Math.max(index, 0), panels.length - 1);
		const changed = next !== activeIndex;
		activeIndex = next;

		const id = panels[next].dataset.panel ?? '';
		pager.dataset.active = id;

		// Off-screen panels are inert, so their links and buttons stay out of
		// the tab order and the accessibility tree.
		panels.forEach((panel, position) => {
			if (position === next) panel.removeAttribute('inert');
			else panel.setAttribute('inert', '');
		});

		for (const link of document.querySelectorAll<HTMLElement>('[data-destination-link]')) {
			if (link.dataset.destination === id) link.setAttribute('aria-current', 'page');
			else link.removeAttribute('aria-current');
		}

		if (options.scroll) scrollToIndex(next);

		if (options.push && changed) {
			history.pushState({ pager: next }, '', panels[next].dataset.href ?? '/');
		}

		void ensureLoaded(next);
	};

	const prefetch = () => {
		const neighbours = [activeIndex - 1, activeIndex + 1].filter(
			(index) => index >= 0 && index < panels.length,
		);
		for (const index of neighbours) void ensureLoaded(index);

		const rest = panels
			.map((_, index) => index)
			.filter((index) => index !== activeIndex && !neighbours.includes(index));

		const idle = (callback: () => void) => {
			const scheduler = (
				window as Window & {
					requestIdleCallback?: (cb: () => void) => number;
				}
			).requestIdleCallback;
			if (scheduler) scheduler(callback);
			else window.setTimeout(callback, 200);
		};

		idle(() => {
			for (const index of rest) void ensureLoaded(index);
		});
	};

	const enable = () => {
		if (enabled) return;
		enabled = true;

		// The pager owns the scroll position, not the browser's history restore.
		history.scrollRestoration = 'manual';

		setActive(activeIndex);

		// Align without animating, once the flex layout has a width.
		requestAnimationFrame(() => {
			suppressSettle = true;
			pager.scrollLeft = activeIndex * pager.clientWidth;
			window.setTimeout(() => {
				suppressSettle = false;
			}, 0);
		});

		prefetch();
	};

	const disable = () => {
		if (!enabled) return;
		enabled = false;

		history.scrollRestoration = 'auto';
		pager.scrollLeft = 0;

		// Desktop shows one page at a time, so drop anything the pager injected.
		panels.forEach((panel, index) => {
			panel.removeAttribute('inert');
			if (index === activeIndex) return;
			const id = panel.dataset.panel ?? '';
			if (!loaded.has(id)) return;
			panel.replaceChildren();
			loaded.delete(id);
		});
	};

	const settle = () => {
		if (!enabled || suppressSettle) return;
		const width = pager.clientWidth;
		if (!width) return;

		const index = Math.round(pager.scrollLeft / width);
		if (index === activeIndex) return;
		setActive(index, { push: true });
	};

	// The rail is the primary way to change page, so it scrolls the pager
	// rather than reloading the document.
	document.addEventListener('click', (event) => {
		if (!enabled) return;

		const target = event.target as Element | null;
		const link = target?.closest<HTMLAnchorElement>('[data-destination-link]');
		if (!link) return;

		const index = panels.findIndex((panel) => panel.dataset.panel === link.dataset.destination);
		if (index < 0) return;

		event.preventDefault();
		setActive(index, { push: true, scroll: true });
	});

	// Grabbing the pager mid-tween hands control back to the finger.
	pager.addEventListener(
		'pointerdown',
		() => {
			if (!tweenFrame) return;
			window.cancelAnimationFrame(tweenFrame);
			tweenFrame = 0;
			suppressSettle = false;
		},
		{ passive: true },
	);

	pager.addEventListener(
		'scroll',
		() => {
			if (!enabled) return;
			window.clearTimeout(settleTimer);
			settleTimer = window.setTimeout(settle, SETTLE_DELAY);
		},
		{ passive: true },
	);

	// `scrollend` is the precise signal; the debounced `scroll` above is the
	// fallback for browsers that do not have it yet.
	if ('onscrollend' in pager) {
		pager.addEventListener('scrollend', () => {
			window.clearTimeout(settleTimer);
			settle();
		});
	}

	window.addEventListener('popstate', () => {
		if (!enabled) return;
		const index = indexForPath(window.location.pathname);
		if (index < 0) return;
		setActive(index, { scroll: true });
	});

	// A width change (rotation, window resize) invalidates the panel offset.
	window.addEventListener('resize', () => {
		if (!enabled) return;
		suppressSettle = true;
		pager.scrollLeft = activeIndex * pager.clientWidth;
		window.setTimeout(() => {
			suppressSettle = false;
		}, 0);
	});

	media.addEventListener('change', (event) => {
		if (event.matches) enable();
		else disable();
	});

	if (media.matches) enable();
}
