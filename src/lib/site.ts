/**
 * Site-wide constants.
 *
 * Everything that needs an absolute URL (canonical links, Open Graph tags,
 * the sitemap, `llms.txt`) reads the origin from here, so the host is changed
 * in exactly one place.
 */

/** Canonical origin. No trailing slash. */
export const SITE_URL = 'https://angadbhalla.com';

/** Human-readable site name, used in Open Graph and JSON-LD. */
export const SITE_NAME = 'Angad Bhalla';

/** Locale for Open Graph and the document. */
export const SITE_LOCALE = 'en_IN';

/** Fallback description for pages that do not supply their own. */
export const SITE_DESCRIPTION =
	'Angad Bhalla — computer science student at PES University, Bengaluru. Systems software, small binaries, and boring infrastructure.';

/** Social preview image, relative to the site root. */
export const OG_IMAGE_PATH = '/og.jpg';

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
	if (/^https?:\/\//.test(path)) return path;
	return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
