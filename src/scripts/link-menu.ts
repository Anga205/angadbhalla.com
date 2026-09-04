/**
 * Wire every `[data-menu]` opener to its dialog.
 *
 * The dialog is the platform's own modal, so focus trapping, Esc, and the
 * backdrop come from the browser. This only wires the opener button to
 * `showModal()` and adds backdrop-click dismissal.
 *
 * Idempotent: a dialog that has already been wired is skipped, so the mobile
 * pager can call this again after injecting a panel without double-binding.
 */
export function initLinkMenus(root: ParentNode = document): void {
	for (const opener of root.querySelectorAll<HTMLButtonElement>('[data-menu]')) {
		const id = opener.dataset.menu;
		if (!id) continue;

		const dialog = root.querySelector<HTMLDialogElement>(`#${CSS.escape(id)}`);
		if (!dialog || dialog.dataset.menuReady === 'true') continue;
		dialog.dataset.menuReady = 'true';

		opener.addEventListener('click', () => dialog.showModal());

		dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());

		// Escape closes. The platform already does this for a modal dialog, but
		// handling it explicitly keeps the behaviour independent of how the
		// dialog was opened and stops the key from reaching the page.
		dialog.addEventListener('keydown', (event) => {
			if (event.key !== 'Escape') return;
			event.preventDefault();
			dialog.close();
		});

		// Clicking the backdrop closes. A backdrop click is dispatched to the
		// dialog element itself, so compare the pointer against the dialog's own
		// box: anything outside it is the backdrop.
		dialog.addEventListener('click', (event) => {
			if (event.target !== dialog) return;
			const box = dialog.getBoundingClientRect();
			const outside =
				event.clientX < box.left ||
				event.clientX > box.right ||
				event.clientY < box.top ||
				event.clientY > box.bottom;
			if (outside) dialog.close();
		});
	}
}
