/**
 * schema.org JSON-LD builders.
 *
 * Each function returns a plain object that is safe to `JSON.stringify` into a
 * `<script type="application/ld+json">` block. Keeping them here rather than
 * inline in components means the shapes are typed, testable, and reused by
 * more than one page.
 *
 * Reference: https://schema.org/
 */
import { PROFILE } from '../data/profile';
import { SITE_DESCRIPTION, SITE_LOCALE, SITE_NAME, SITE_URL, absoluteUrl } from './site';

/** A JSON-LD node. Loosely typed on purpose: schema.org is open-ended. */
export type JsonLd = Record<string, unknown>;

/** `@id` for the person node, so other nodes can reference it. */
export const PERSON_ID = `${SITE_URL}/#person`;
/** `@id` for the website node. */
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** The author/person node, shared by every page. */
export function personSchema(): JsonLd {
	return {
		'@type': 'Person',
		'@id': PERSON_ID,
		name: PROFILE.name,
		alternateName: PROFILE.handle,
		url: SITE_URL,
		email: `mailto:${PROFILE.email}`,
		jobTitle: PROFILE.jobTitle,
		description: PROFILE.description,
		image: absoluteUrl('/og.jpg'),
		address: {
			'@type': 'PostalAddress',
			...PROFILE.address,
		},
		alumniOf: {
			'@type': 'CollegeOrUniversity',
			name: PROFILE.alumniOf.name,
			alternateName: PROFILE.alumniOf.alternateName,
			url: PROFILE.alumniOf.url,
			address: {
				'@type': 'PostalAddress',
				addressLocality: PROFILE.alumniOf.addressLocality,
				addressRegion: PROFILE.alumniOf.addressRegion,
				addressCountry: PROFILE.alumniOf.addressCountry,
			},
		},
		knowsAbout: [...PROFILE.knowsAbout],
		sameAs: [...PROFILE.sameAs],
	};
}

/** The site itself, so search engines can attribute pages to it. */
export function websiteSchema(): JsonLd {
	return {
		'@type': 'WebSite',
		'@id': WEBSITE_ID,
		url: SITE_URL,
		name: SITE_NAME,
		description: SITE_DESCRIPTION,
		inLanguage: SITE_LOCALE,
		publisher: { '@id': PERSON_ID },
		author: { '@id': PERSON_ID },
	};
}

/** A breadcrumb trail. `items` are ordered from the root. */
export function breadcrumbSchema(items: Array<{ name: string; path: string }>): JsonLd {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: absoluteUrl(item.path),
		})),
	};
}

/** A page that is primarily about the person. */
export function profilePageSchema(options: {
	path: string;
	name: string;
	description: string;
}): JsonLd {
	return {
		'@type': 'ProfilePage',
		url: absoluteUrl(options.path),
		name: options.name,
		description: options.description,
		inLanguage: SITE_LOCALE,
		isPartOf: { '@id': WEBSITE_ID },
		mainEntity: { '@id': PERSON_ID },
		about: { '@id': PERSON_ID },
	};
}

/** A page that lists other things, with the list itself described. */
export function collectionPageSchema(options: {
	path: string;
	name: string;
	description: string;
	items: Array<{ name: string; path: string }>;
}): JsonLd {
	return {
		'@type': 'CollectionPage',
		url: absoluteUrl(options.path),
		name: options.name,
		description: options.description,
		inLanguage: SITE_LOCALE,
		isPartOf: { '@id': WEBSITE_ID },
		about: { '@id': PERSON_ID },
		mainEntity: {
			'@type': 'ItemList',
			numberOfItems: options.items.length,
			itemListElement: options.items.map((item, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: item.name,
				url: absoluteUrl(item.path),
			})),
		},
	};
}

/** A single achievement, award, or role. */
export function creativeWorkSchema(options: {
	path: string;
	name: string;
	description: string;
	date?: string;
	keywords?: string[];
	image?: string[];
	/** schema.org type override, e.g. `Award` or `Article`. */
	type?: string;
}): JsonLd {
	const node: JsonLd = {
		'@type': options.type ?? 'CreativeWork',
		'@id': `${absoluteUrl(options.path)}#work`,
		url: absoluteUrl(options.path),
		name: options.name,
		description: options.description,
		inLanguage: SITE_LOCALE,
		author: { '@id': PERSON_ID },
		creator: { '@id': PERSON_ID },
		isPartOf: { '@id': WEBSITE_ID },
	};

	if (options.date) node.datePublished = options.date;
	if (options.keywords?.length) node.keywords = options.keywords.join(', ');
	if (options.image?.length) node.image = options.image.map(absoluteUrl);

	return node;
}

/** A software project, with its repository and language list. */
export function softwareSourceCodeSchema(options: {
	path: string;
	name: string;
	description: string;
	codeRepository?: string;
	programmingLanguage?: string[];
	dateCreated?: string;
	url?: string;
}): JsonLd {
	const node: JsonLd = {
		'@type': 'SoftwareSourceCode',
		'@id': `${absoluteUrl(options.path)}#software`,
		name: options.name,
		description: options.description,
		author: { '@id': PERSON_ID },
		creator: { '@id': PERSON_ID },
		inLanguage: SITE_LOCALE,
	};

	if (options.codeRepository) node.codeRepository = options.codeRepository;
	if (options.programmingLanguage?.length) {
		node.programmingLanguage = options.programmingLanguage;
	}
	if (options.dateCreated) node.dateCreated = options.dateCreated;
	if (options.url) node.url = options.url;

	return node;
}

/**
 * Wrap nodes in a single `@graph` document.
 *
 * One script tag with a graph is cheaper than several script tags, and it lets
 * nodes reference each other by `@id`.
 */
export function graph(nodes: JsonLd[]): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@graph': nodes,
	};
}
