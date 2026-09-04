/**
 * The home page's client behaviour: the portrait blur-up, the computed age,
 * and the contact form.
 *
 * Idempotent per root, so the mobile pager can call it again after injecting
 * the panel.
 */
import emailjs from '@emailjs/browser';
import {
	EMAILJS_APP,
	EMAILJS_PUBLIC_KEY,
	EMAILJS_SERVICE_ID,
	EMAILJS_TEMPLATE_ID,
} from '../data/emailjs';
import { showToast } from './toast';

/** Toasts are document-level, so the in-flight message is told apart by id. */
const FORM_STATUS = 'contact-status';
const VALIDATION = 'contact-validation';

const initialized = new WeakSet<object>();

export function initHome(root: ParentNode = document): void {
	if (initialized.has(root as object)) return;
	initialized.add(root as object);

	// `html.js` gates the blur-up styles so no-JS visitors see the image.
	document.documentElement.classList.add('js');

	initPortraitBlurUp(root);
	initAge(root);
	initContactForm(root);
	scrollToHash(root);
}

/**
 * Blur-up for the portrait.
 *
 * `html.js` is set first so the fade-in styles only apply when this script is
 * actually running; without it the image is visible immediately. The class is
 * added on load, or straight away if the image was already cached.
 */
function initPortraitBlurUp(root: ParentNode): void {
	const portraitImage = root.querySelector<HTMLImageElement>('.portrait-img');
	if (!portraitImage) return;

	const reveal = () => portraitImage.classList.add('is-loaded');
	if (portraitImage.complete && portraitImage.naturalWidth > 0) reveal();
	else portraitImage.addEventListener('load', reveal, { once: true });
	// Never leave the image hidden if decoding fails.
	portraitImage.addEventListener('error', reveal, { once: true });
}

/** Age is computed on the client so it stays correct without a rebuild. */
function initAge(root: ParentNode): void {
	const ageElement = root.querySelector<HTMLElement>('#age');
	if (!ageElement) return;

	const birthday = new Date(1117650600 * 1000);
	const now = new Date();
	let age = now.getUTCFullYear() - birthday.getUTCFullYear();
	const monthDelta = now.getUTCMonth() - birthday.getUTCMonth();
	if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birthday.getUTCDate())) {
		age -= 1;
	}
	ageElement.textContent = String(age);
}

/**
 * `/contact` redirects to `/#contact`. The page scrolls inside its own
 * container, not the document, so the browser's own anchor jump never moves
 * anything and the form has to be brought into view by hand.
 */
function scrollToHash(root: ParentNode): void {
	if (window.location.hash !== '#contact') return;
	root.querySelector('#contact')?.scrollIntoView({ block: 'start' });
}

function initContactForm(root: ParentNode): void {
	const form = root.querySelector<HTMLFormElement>('#contact-form');
	const send = root.querySelector<HTMLButtonElement>('#send');

	if (!form || !send) return;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		const data = new FormData(form);
		const email = String(data.get('email') ?? '').trim();
		const message = String(data.get('message') ?? '').trim();

		if (!email || !message) {
			showToast('error', 'email and message are required.', { id: VALIDATION });
			return;
		}

		send.disabled = true;
		// Held open for a slow send, but replaced in place as soon as the
		// result arrives, so it never lingers beside the outcome.
		showToast('info', 'sending...', { id: FORM_STATUS, duration: 30_000 });

		try {
			await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_ID,
				{
					time: new Date().toLocaleString(),
					app: EMAILJS_APP,
					message,
					contact: email,
				},
				{ publicKey: EMAILJS_PUBLIC_KEY },
			);
			form.reset();
			showToast('ok', 'sent. thanks.', { id: FORM_STATUS });
		} catch {
			showToast('error', 'could not send. email me directly instead.', { id: FORM_STATUS });
		} finally {
			send.disabled = false;
		}
	});
}
