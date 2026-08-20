/**
 * Achievement catalogue.
 *
 * Every achievement is a card on /achievements and a page at
 * /achievements/<slug>. The listing groups cards by category; the detail page
 * renders the long form plus a gallery.
 *
 * Galleries are discovered from disk, not declared here. Drop a file into
 * src/assets/achievements/<slug>/ and it appears, sorted by filename. Captions
 * are optional: add an entry to `captions` keyed by the filename stem (e.g.
 * "01") and it is used in the lightbox; otherwise a fallback is generated.
 */
import type { ImageMetadata } from 'astro';

export const CATEGORIES = [
	'hackathons',
	'competitive',
	'leadership',
	'community',
	'open-source',
	'research',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
	hackathons: 'hackathons',
	competitive: 'competitive programming',
	leadership: 'leadership & teaching',
	community: 'community',
	'open-source': 'open source',
	research: 'research',
};

export const CATEGORY_BLURBS: Record<Category, string> = {
	hackathons: 'time-boxed builds, judged.',
	competitive: 'practice, measured over years.',
	leadership: 'running things other people show up to.',
	community: 'work that is not about the code.',
	'open-source': 'changes that survived review.',
	research: 'papers turned into working systems.',
};

export type AchievementIcon =
	| 'trophy'
	| 'flask'
	| 'accessibility'
	| 'ghost'
	| 'code'
	| 'leetcode'
	| 'users'
	| 'graduation'
	| 'container'
	| 'heart'
	| 'git-pull-request';

/** Medal shown in place of the category icon on a hackathon card. */
export type Medal = 'gold' | 'silver';

/** Icon rendered on a card action button. */
export type LinkIcon =
	| 'linkedin'
	| 'info'
	| 'github'
	| 'external'
	| 'code'
	| 'heart'
	| 'youtube';

export interface AchievementLink {
	label: string;
	href: string;
	icon?: LinkIcon;
}

export interface AchievementDetail {
	/** Long-form paragraphs, rendered in order. */
	overview: string[];
	/** Short, scannable bullets. */
	highlights: string[];
	/** Optional technical stack, rendered as pills. */
	stack?: string[];
}

export interface Achievement {
	slug: string;
	title: string;
	category: Category;
	/** The outcome, e.g. "first place". Rendered as a badge. */
	result: string;
	/**
	 * Hackathons only. Replaces the category icon with a medal and turns the
	 * card into a link menu instead of a detail-page link.
	 */
	medal?: Medal;
	/**
	 * Turns the card into a link menu instead of a detail-page link, without
	 * changing the icon. Use this when an achievement has no long-form page.
	 */
	menu?: boolean;
	/** Human-readable date, e.g. "March 2026". */
	date: string;
	/** Sort key and card meta. */
	year: string;
	summary: string;
	description: string;
	tags: string[];
	icon: AchievementIcon;
	links?: AchievementLink[];
	/** Lightbox captions, keyed by filename stem. */
	captions?: Record<string, string>;
	detail: AchievementDetail;
}

export interface GalleryImage {
	src: ImageMetadata;
	alt: string;
	caption: string;
}

const IMAGE_MODULES = import.meta.glob<{ default: ImageMetadata }>(
	'/src/assets/achievements/*/*.{svg,png,jpg,jpeg,webp}',
	{ eager: true },
);

/**
 * Images for one achievement, sorted by path so numeric filenames control
 * order. Returns an empty array when the folder does not exist yet.
 */
export function galleryFor(slug: string, captions: Record<string, string> = {}): GalleryImage[] {
	const prefix = `/src/assets/achievements/${slug}/`;

	return Object.entries(IMAGE_MODULES)
		.filter(([path]) => path.startsWith(prefix))
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([path, module]) => {
			const stem = path.slice(prefix.length).replace(/\.[^.]+$/, '');
			const caption = captions[stem] ?? `image ${stem}`;
			return { src: module.default, alt: caption, caption };
		});
}

export const ACHIEVEMENTS: Achievement[] = [
	{
		slug: 'algomania-3',
		title: 'Algomania 3.0',
		category: 'competitive',
		result: 'first place',
		medal: 'gold',
		date: 'March 2026',
		year: '2026',
		summary: 'inter-college competitive programming.',
		description:
			'A multi-stage contest: online prelims, then head-to-head cycles offline. 110 teams entered, 40 qualified, 8 reached the final.',
		tags: [
			'hackerrank',
			'competitive-programming',
			'algorithms',
			'graphs',
			'dynamic-programming',
			'inter-college',
			'encodeai',
			'team-of-3',
		],
		icon: 'trophy',
		links: [
			{ label: 'my linkedin post', href: 'https://lnkd.in/p/dCpnrydT', icon: 'linkedin' },
			{ label: 'event listing', href: 'https://events.pes.edu/11437/', icon: 'info' },
		],
		captions: {
			'01': 'the offline round at MRD Auditorium, RR Campus.',
			'02': 'final leaderboard, top eight teams.',
			'03': 'the winning team after the last cycle.',
		},
		detail: {
			overview: [
				'Algomania 3.0 is an inter-collegiate competitive programming contest hosted by EncodeAI at PES University. Drawing inspiration from the ICPC-style team contest format, it brought together teams from multiple universities to compete in a series of algorithmic problem-solving rounds. The contest tested participants\' ability to devise efficient algorithms, write correct implementations, and solve challenging problems under tight time constraints.',
				'The competition began with an online preliminary round on HackerRank, followed by an offline main event featuring short, head-to-head coding rounds. With problems ranging from LeetCode Medium to Hard, success required strong algorithmic fundamentals, strategic problem selection, efficient team coordination, and quick implementation.',
			],
			highlights: [
				'440 competitors from PES RR, PES EC, BMS, RV and IIIT Bangalore.',
				'Top 40 teams qualified for the offline round; top 8 reached the final.',
				'40-minute sprints followed by a two-hour finale.',
				'First place, with internship offers from the title sponsor for top performers.',
			],
		},
	},
	{
		slug: 'tensor-2026',
		title: 'Tensor 2026',
		category: 'research',
		result: 'first place',
		medal: 'gold',
		date: 'March 2026',
		year: '2026',
		summary: 'state-level research hackathon.',
		description:
			'Organisers handed out 40+ research papers instead of problem statements. We picked three and built a cybersecurity log monitoring tool around them.',
		tags: [
			'graphrag',
			'semantic-caching',
			'multi-agent',
			'llm',
			'cybersecurity',
			'log-analysis',
			'knowledge-graph',
			'state-level',
			'research',
		],
		icon: 'flask',
		links: [
			{
				label: 'my linkedin post',
				href: 'https://www.linkedin.com/posts/anga_yesterday-my-team-won-first-place-in-the-activity-7449086916655902720-YYcF',
				icon: 'linkedin',
			},
		],
		captions: {
			'01': 'the paper shortlist we worked from.',
			'02': 'log graph, entities as nodes and relationships as edges.',
			'03': 'a query answered from the selected subgraph.',
		},
		detail: {
			overview: [
				'Tensor replaced problem statements with a stack of research papers. Teams read, chose, and had to turn the ideas into something that ran before the clock stopped. We took three: GraphRAG, semantic caching, and difficulty-aware tool dispatching.',
				'The result was a log monitoring tool for application security logs. Logs are ingested into a graph where entities are nodes and relationships are edges, so a single incident spread across hundreds of lines becomes one connected shape. A bucket classifier splits queries into broad overviews and narrow incident lookups, then a node-selection agent picks the subgraph worth passing to the response step.',
			],
			highlights: [
				'Graph generation from an existing log file, plus incremental graph building for new entries.',
				'Bucket classifier routing queries by width versus depth.',
				'Node selection agent narrowing context before generation.',
				'GraphRAG response step grounded in retrieved relationships, not raw model recall.',
			],
			stack: ['Python', 'GraphRAG', 'LLM agents', 'Neo4j'],
		},
	},
	{
		slug: 'ieee-cs-iampro-2025',
		title: 'IEEE Computer Society IAMPro 2025',
		category: 'research',
		result: 'research intern',
		date: 'April 1 - September 30, 2025',
		year: '2025',
		summary: 'a six-month research internship and mentorship programme.',
		description:
			'Conducted a research project on implementing software on a blockchain-based architecture through IEEE Computer Society Bangalore chapter.',
		tags: ['ieee', 'iampro', 'research', 'blockchain', 'internship', 'mentorship'],
		icon: 'flask',
		captions: {
			'01': 'IAMPro 2025 programme documentation.',
			'02': 'research notes and blockchain architecture work.',
			'03': 'the six-month internship and mentorship programme.',
		},
		detail: {
			overview: [
				'IEEE Computer Society IAMPro 2025 was a six-month internship and mentorship programme run by the IEEE Computer Society Bangalore chapter. I joined as an intern from 1 April 2025 to 30 September 2025 through my membership in the IEEE Computer Society student chapter at PES University.',
				'I worked under the mentorship of Dr. Venu Gopal N. alongside Ankit Khaitan. The internship centred on a research project investigating how software could be implemented on a blockchain-based architecture, giving me the chance to explore the trade-offs between distributed systems, trust, and practical software design.',
			],
			highlights: [
				'Six-month internship from 1 April 2025 to 30 September 2025.',
				'Conducted under the mentorship of Dr. Venu Gopal N.',
				'Collaborated with Ankit Khaitan on the research work.',
				'Researched software implementation on a blockchain-based architecture.',
			],
			stack: ['Blockchain', 'Distributed systems', 'Software architecture'],
		},
	},
	{
		slug: 'kalpana-2025',
		title: 'IEEE Kalpana 2025',
		category: 'hackathons',
		result: 'first place',
		medal: 'gold',
		date: 'February 2025',
		year: '2025',
		summary: 'an ASL interpreter on a Raspberry Pi.',
		description: 'Hack-for-Humanity themed 24 hour hackathon',
		tags: [
			'raspberry-pi',
			'computer-vision',
			'asl',
			'accessibility',
			'edge-inference',
			'24-hour',
			'ieee',
			'hack-for-humanity',
			'python',
		],
		icon: 'accessibility',
		links: [
			{ label: 'my linkedin post', href: 'https://lnkd.in/p/dU9XYBv8', icon: 'linkedin' },
			{ label: 'event report', href: 'https://news.pes.edu/11747/', icon: 'info' },
		],
		captions: {
			'01': 'the rig: Pi, camera, and a very short cable run.',
			'02': 'live recognition during judging.',
			'03': 'first place, Hack for Humanity.',
		},
		detail: {
			overview: [
				'Kalpana ran under the theme "Hack for Humanity", which changes what judges reward. Novelty alone was not enough; the project had to plausibly help someone. We built an American Sign Language interpreter that runs entirely on a Raspberry Pi.',
				'The hardware choice was the design decision. A Pi is cheap, portable, and runs inference locally, so the system does not need a desktop or a cloud round trip. That made it something a clinic could actually put on a counter.',
			],
			highlights: [
				'Real-time ASL recognition on constrained hardware.',
				'Local inference \u2014 no cloud dependency, no per-request cost.',
				'Validated with a hospital receptionist and a clinician before the final pitch.',
				'First place across AI/ML, IoT, hardware, and robotics entries.',
			],
			stack: ['Python', 'OpenCV', 'MediaPipe', 'Raspberry Pi'],
		},
	},
	{
		slug: 'hack-o-ween-2025',
		title: 'Hack-o-ween 2025',
		category: 'hackathons',
		result: 'second place',
		medal: 'silver',
		date: 'October 2025',
		year: '2025',
		summary: '24 hours, one idea, something that runs.',
		description: 'Halloween themed 24 hour hackathon',
		tags: ['24-hour', 'arch-pesu', 'prototyping', 'team-of-4', 'hackathon', 'ai-ml'],
		icon: 'ghost',
		links: [
			{ label: 'my linkedin post', href: 'https://lnkd.in/p/ddgcuhat', icon: 'linkedin' },
			{ label: 'event listing', href: 'https://events.pes.edu/11310/', icon: 'info' },
		],
		captions: {
			'01': 'hour four, still arguing about scope.',
			'02': 'the build, running.',
			'03': 'second place.',
		},
		detail: {
			overview: [
				'Hack-o-ween is a 24-hour hackathon run by ARCH, the technical club of the CSE (AI & ML) department at PESU. The format is unforgiving: scope has to be decided early, because anything left to the last six hours does not ship.',
				'We finished second. The useful part was not the placement but the rehearsal of a specific skill \u2014 cutting a feature list down to the one thing that has to work, and getting that one thing working.',
			],
			highlights: [
				'24-hour build window, four-person team.',
				'Scope locked in the first few hours; integration started early.',
				'Second place.',
			],
		},
	},
	{
		slug: 'leetcode-1337',
		title: 'LeetCode \u2014 1,337 solved',
		category: 'competitive',
		result: '1,337 solved',
		date: 'October 2026',
		year: '2026',
		summary: 'a milestone I only posted for the number.',
		description:
			'I do not usually post solve counts, because quantity is not quality. 1337 was worth the exception.',
		tags: [
			'leetcode',
			'dsa',
			'dynamic-programming',
			'graphs',
			'trees',
			'binary-search',
			'greedy',
			'rating-2112',
			'consistency',
		],
		icon: 'leetcode',
		menu: true,
		links: [
			{ label: 'my linkedin post', href: 'https://lnkd.in/p/d9qKKzf9', icon: 'linkedin' },
			{ label: 'my leetcode profile', href: 'https://leetcode.com/u/Anga205', icon: 'external' },
		],
		captions: {
			'01': 'the counter, at 1,337.',
			'02': 'topic coverage across the solve history.',
			'03': 'contest rating over time.',
		},
		detail: {
			overview: [
				'1,337 problems solved on LeetCode, reached on 29 October 2026, with a contest rating of 2,112. The number is a joke about "leet"; the practice behind it is not.',
				'Solve counts are a weak signal on their own. What actually accumulates is pattern recognition \u2014 seeing that an unfamiliar problem is a shortest-path problem wearing a costume, or that a constraint of 10^5 rules out the obvious quadratic. That is the part worth keeping.',
			],
			highlights: [
				'Sustained practice across arrays, graphs, trees, DP, greedy, and binary search.',
				'Contest rating 2,112.',
				'Second on a public university competitive programming leaderboard at the time.',
			],
			stack: ['C++', 'Python'],
		},
	},
	{
		slug: 'alcoding-club-head',
		title: 'Head, The Alcoding Club',
		category: 'leadership',
		result: 'club head',
		date: 'September 2024 \u2014 April 2025',
		year: '2025',
		summary: 'ran PESU\u2019s competitive programming club.',
		description:
			'Weekly HackerRank contests, monthly problem sets, workshops, and Terrathon 4.0 \u2014 the club\u2019s flagship 24-hour hackathon.',
		tags: [
			'leadership',
			'competitive-programming',
			'problem-setting',
			'terrathon',
			'hackerrank',
			'mentorship',
			'event-ops',
			'pesu',
		],
		icon: 'users',
		links: [
			{
				label: 'club page',
				href: 'https://clubs.pes.edu/the-alcoding-club/about/',
				icon: 'info',
			},
			{
				label: 'containerization 101',
				href: 'https://lnkd.in/p/d5xg7iKw',
				icon: 'linkedin',
			},
		],
		captions: {
			'01': 'Terrathon 4.0, opening hours.',
			'02': 'a monthly contest problem set.',
			'03': 'handover, April 2025.',
		},
		detail: {
			overview: [
				'The Alcoding Club is PESU\u2019s algorithms and competitive programming club. I joined in January 2024, took over as head in September 2024, and handed over in April 2025.',
				'The job is mostly operations. Weekly contests need problems written, tested, and calibrated so the difficulty curve is not a cliff. Terrathon needs tracks, judges, and someone awake at 4am when the deployment breaks. None of it is glamorous, and all of it is the actual work.',
				'One of the events I ran as head was Containerization 101, a hands-on Docker workshop with the club. I led the organising team; Dr. Chaitra N. and Pranavjeet Naidu spoke. Everyone left with a container they had built and run themselves.',
			],
			highlights: [
				'Ran the club for a full academic year.',
				'Authored problems for monthly HackerRank contests.',
				'Organised and executed Terrathon 4.0, the flagship 24-hour hackathon.',
				'Led the organising team for Containerization 101, a hands-on Docker workshop.',
				'Mentored participants through contests and hackathons.',
			],
			stack: ['HackerRank', 'C++', 'Python', 'Docker'],
		},
	},
	{
		slug: 'pesu-io-course',
		title: 'PESU I/O \u2014 Competitive Programming',
		category: 'leadership',
		result: 'instructor',
		date: 'August \u2014 November 2025',
		year: '2025',
		summary: 'taught DSA and contest strategy to 55 students.',
		description:
			'A peer-taught course under PESU I/O, Slot 20. Built around pattern recognition and constraint reading rather than algorithm recitation.',
		tags: [
			'teaching',
			'dsa',
			'curriculum',
			'contest-strategy',
			'pesu-io',
			'55-students',
			'peer-learning',
		],
		icon: 'graduation',
		menu: true,
		links: [
			{ label: 'my linkedin post', href: 'https://lnkd.in/p/djZQkwFF', icon: 'linkedin' },
			{
				label: 'youtube video',
				href: 'https://www.youtube.com/watch?v=FTFoN2CjIGQ',
				icon: 'youtube',
			},
		],
		captions: {
			'01': 'slot 20, first session.',
			'02': 'a worked problem, on the board.',
			'03': 'end-of-course contest.',
		},
		detail: {
			overview: [
				'PESU I/O is the university\u2019s peer-to-peer teaching programme: students teaching students, for credit and for the practice of explaining things. I taught the competitive programming slot to a class of 55.',
				'The curriculum deliberately avoided "here is Dijkstra, memorise it". The useful skill is recognising which tool a problem is asking for, and reading constraints as a hint about the intended complexity. So the sessions were built around pattern recognition and worked examples, not algorithm recitation.',
			],
			highlights: [
				'55 students across a full semester.',
				'Covered DSA fundamentals through advanced contest techniques.',
				'Focused on intuition, pattern recognition, and performance-oriented implementation.',
			],
			stack: ['C++', 'Python'],
		},
	},
	{
		slug: 'vosd-drive',
		title: 'VOSD Newspaper Drive',
		category: 'community',
		result: 'completed',
		date: 'February 2026',
		year: '2026',
		summary: 'a solo drive funding stray dog rescue.',
		description:
			'Door to door, one stack of newspapers at a time, for Voice of Stray Dogs. The lesson was less about logistics and more about how fast you can explain why something matters.',
		tags: [
			'community',
			'vosd',
			'animal-welfare',
			'fundraising',
			'solo',
			'outreach',
			'bengaluru',
		],
		icon: 'heart',
		menu: true,
		links: [
			{ label: 'my linkedin post', href: 'https://lnkd.in/p/dHbNECk9', icon: 'linkedin' },
			{ label: 'voice of stray dogs', href: 'https://www.vosd.in/', icon: 'heart' },
		],
		captions: {
			'01': 'the first collection round.',
			'02': 'stacked and weighed.',
			'03': 'handed over.',
		},
		detail: {
			overview: [
				'A solo newspaper collection drive for Voice of Stray Dogs, one of India\u2019s larger stray rescue operations. Newspapers get sold by weight; the proceeds fund rescue and medical care. The mechanism is simple, which means the difficulty is entirely in the asking.',
				'Three things came out of it. Prospecting is unglamorous and volume matters more than comfort. The value proposition has to land in one or two sentences, or the door closes. And trust beats persuasion \u2014 people gave because the intent read as genuine, not because the pitch was good.',
			],
			highlights: [
				'Run solo, end to end, with no team or budget.',
				'Collected and handed over to VOSD for resale by weight.',
				'44,000+ views on the write-up.',
			],
		},
	},
	{
		slug: 'docker-pr-51670',
		title: 'docker/docker #51670',
		category: 'open-source',
		result: 'merged',
		date: 'December 2025',
		year: '2025',
		summary: 'a merged fix in the Docker name generator.',
		description:
			'Corrected "Poincar\u00e9 Price" to "Poincar\u00e9 Prize" in names-generator.go. Small change, real review process, shipped in the 29.2.0 milestone.',
		tags: [
			'open-source',
			'docker',
			'go',
			'merged',
			'v29.2.0',
			'upstream',
			'pull-request',
		],
		icon: 'git-pull-request',
		menu: true,
		links: [
			{
				label: 'pull request',
				href: 'https://github.com/docker/docker/pull/51670',
				icon: 'github',
			},
		],
		captions: {
			'01': 'the diff.',
			'02': 'maintainer review and approval.',
			'03': 'merged into the 29.2.0 milestone.',
		},
		detail: {
			overview: [
				'names-generator.go is the file behind every unnamed container. Docker names containers after scientists and hackers, and the list has been carried forward since the 0.7.x era. One entry described C\u00e9dric Villani as a "Poincar\u00e9 Price" laureate.',
				'The change is one word. The point is the process around it: finding the file in a large Go repository, making a focused change, opening a pull request that a maintainer will actually read, and getting it merged. It landed in the 29.2.0 milestone.',
			],
			highlights: [
				'Opened as #51670, approved by a Docker maintainer, merged.',
				'Assigned to the 29.2.0 milestone.',
				'290 of 294 CI checks passing at review time.',
			],
			stack: ['Go', 'Git'],
		},
	},
];

export function getAchievement(slug: string): Achievement | undefined {
	return ACHIEVEMENTS.find((achievement) => achievement.slug === slug);
}

/**
 * Cards that open a link menu rather than navigating to a detail page.
 * Medal cards always do; others opt in with `menu: true`.
 */
export function opensMenu(achievement: Achievement): boolean {
	return Boolean(achievement.medal) || Boolean(achievement.menu);
}

export function hasDetailPage(achievement: Achievement): boolean {
	return !opensMenu(achievement);
}

export const DETAIL_ACHIEVEMENTS = ACHIEVEMENTS.filter(hasDetailPage);

export interface AchievementGroup {
	category: Category;
	label: string;
	blurb: string;
	items: Achievement[];
}

/** Achievements bucketed by category, in CATEGORIES order, empty groups dropped. */
export function groupByCategory(): AchievementGroup[] {
	return CATEGORIES.map((category) => ({
		category,
		label: CATEGORY_LABELS[category],
		blurb: CATEGORY_BLURBS[category],
		items: ACHIEVEMENTS.filter((achievement) => achievement.category === category),
	})).filter((group) => group.items.length > 0);
}
