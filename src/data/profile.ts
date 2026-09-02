/**
 * The person behind the site.
 *
 * This is the single source of truth for identity facts. The home page copy,
 * the `Person` JSON-LD, `rel="me"` links, and `llms.txt` all read from here so
 * they cannot drift apart.
 */

export const PROFILE = {
	/** Full name as it should appear in search results. */
	name: 'Angad Bhalla',
	/** Short handle used in terminal-style chrome. */
	handle: 'anga',
	/** One-line positioning statement. */
	headline: 'Computer science student and software engineer in Bengaluru.',
	/** Longer, keyword-bearing summary for metadata and LLM indexes. */
	description:
		'Angad Bhalla is a computer science and engineering student at PES University, Bengaluru (2023–2027). He builds systems software: self-hosted file storage, sandboxed code execution, and small operating systems. He has won first place at IEEE Kalpana 2025, Algomania 3.0, and Tensor 2026, and has had a change merged into Docker.',
	/** Current role. */
	jobTitle: 'Software Engineer',
	/** Where he studies. */
	alumniOf: {
		name: 'PES University',
		alternateName: 'PESU',
		url: 'https://pes.edu/',
		addressLocality: 'Bengaluru',
		addressRegion: 'Karnataka',
		addressCountry: 'IN',
	},
	/** Study period, used for `alumniOf` and the home page copy. */
	studyPeriod: { start: '2023', end: '2027' },
	/** Where he is based. */
	address: {
		addressLocality: 'Bengaluru',
		addressRegion: 'Karnataka',
		addressCountry: 'IN',
	},
	/** Primary contact address. */
	email: 'angadbhalla2005@gmail.com',
	/** Topics he works in, surfaced as `knowsAbout` in JSON-LD. */
	knowsAbout: [
		'systems programming',
		'operating systems',
		'Go',
		'Rust',
		'C',
		'C++',
		'Linux',
		'seccomp',
		'cgroups',
		'Docker',
		'competitive programming',
		'distributed systems',
		'computer vision',
		'robotics',
	],
	/**
	 * Profiles that represent the same person elsewhere. Rendered as
	 * `rel="me"` links and as `sameAs` in the `Person` schema.
	 */
	sameAs: [
		'https://github.com/Anga205',
		'https://www.linkedin.com/in/anga',
		'https://www.instagram.com/_anga205/',
		'https://leetcode.com/u/Anga205',
		'https://www.duolingo.com/profile/AngadBhalla',
		'https://www.reddit.com/user/Anga205',
	],
} as const;
