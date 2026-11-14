/**
 * Achievement catalogue.
 *
 * Every achievement is a card on /achievements and a page at
 * /achievements/<slug>. The listing groups cards by category; the detail page
 * renders the long form plus a gallery.
 *
 * Galleries are declared per entry with `images`. Entries without images
 * simply render no gallery.
 */
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
	leadership: 'university & extracurriculars',
	community: 'community',
	'open-source': 'open source',
	research: 'research',
};

export const CATEGORY_BLURBS: Record<Category, string> = {
	hackathons: 'time-boxed builds, judged.',
	competitive: 'practice, measured over years.',
	leadership: 'roles, organisations, and the work around them.',
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
	| 'youtube'
	| 'leetcode';

export interface AchievementLink {
	label: string;
	href: string;
	icon?: LinkIcon;
}

export interface AchievementDetail {
	/**
	 * Long-form paragraphs, rendered in order. Authored HTML is allowed, so
	 * paragraphs can carry inline links.
	 */
	overview: string[];
	/** Short, scannable bullets. Omit when the overview already covers them. */
	highlights?: string[];
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
	/**
	 * Turns the card into a link menu that also offers its detail page as an
	 * "Activity Description" entry. Use this when an achievement has a
	 * long-form page but the card should surface its links first.
	 */
	pageMenu?: boolean;
	/** Human-readable date, e.g. "March 2026". */
	date: string;
	/** Sort key and card meta. */
	year: string;
	summary: string;
	/** Organisation the role was held at. Leadership cards only. */
	organization?: string;
	/** The role itself. Rendered as the leadership card heading. */
	position?: string;
	/** Team or department within the organisation. Leadership cards only. */
	department?: string;
	/**
	 * Overrides the detail-page link. Needed when a card is shown on a page
	 * whose detail route does not own it (e.g. a research entry surfaced on
	 * /university but documented under /achievements).
	 */
	href?: string;
	/** Also list this entry on the /university page. */
	alsoUniversity?: boolean;
	/**
	 * Render `tags` (and `detail.stack`) as <meta> keywords and hidden markup
	 * instead of visible sections. Use when the pills add nothing to the page.
	 */
	metaOnly?: boolean;
	description: string;
	tags: string[];
	icon: AchievementIcon;
	links?: AchievementLink[];
	/** Gallery images. Entries without any simply have no gallery. */
	images?: GalleryImage[];
	detail: AchievementDetail;
}

export interface GalleryImage {
	src: string;
	alt: string;
	caption: string;
}

/**
 * Images for one achievement. Galleries are declared explicitly in the data,
 * so an entry with no `images` simply renders no gallery.
 */
export function galleryFor(images?: GalleryImage[]): GalleryImage[] {
	return images ?? [];
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
		title: 'Research Intern',
		category: 'research',
		result: 'research intern',
		date: 'April 1 - September 30, 2025',
		year: '2025',
		summary: 'IEEE Computer Society IAMPro 2025 Batch',
		description: 'IEEE Computer Society IAMPro 2025 Batch',
		organization: 'IEEE Computer Society Bangalore Chapter',
		position: 'Research Intern',
		department: 'IAMPro 2025 Batch',
		alsoUniversity: true,
		href: '/achievements/ieee-cs-iampro-2025',
		pageMenu: true,
		metaOnly: true,
		tags: ['ieee', 'iampro', 'research', 'blockchain', 'internship', 'mentorship'],
		icon: 'flask',
		images: [
			{
				src: '/achievements/ieee-cs-iampro-2025/certificate.png',
				alt: 'IAMPro 2025 internship certificate issued by the IEEE Computer Society Bangalore chapter.',
				caption:
					'Certificate issued by the IEEE Computer Society Bangalore chapter confirming the internship under the IAMPro 2025 batch.',
			},
			{
				src: '/achievements/ieee-cs-iampro-2025/pic1.jpg',
				alt: 'Angad Bhalla on the left and Dr. Venugopal N. on the right.',
				caption: 'Me (left) and Dr. Venugopal N. (right).',
			},
			{
				src: '/achievements/ieee-cs-iampro-2025/pic2.jpg',
				alt: 'Ankith Khaitan on the left, Dr. Venugopal N. in the middle, and Angad Bhalla on the right.',
				caption: 'Ankith Khaitan (left), Dr. Venugopal N. (middle), and me (right).',
			},
		],
		detail: {
			overview: [
				'IEEE Computer Society IAMPro 2025 was a six-month internship and mentorship programme run by the IEEE Computer Society Bangalore chapter. I joined as an intern from 1 April 2025 to 30 September 2025 through my membership in the IEEE Computer Society student chapter at PES University.',
				'I worked under the mentorship of Dr. Venugopal N. alongside <a href="https://www.linkedin.com/in/ankithkhaitan/" target="_blank" rel="noreferrer">Ankith Khaitan</a>. The internship centred on a research project investigating how software could be implemented on a blockchain-based architecture, giving me the chance to explore the trade-offs between distributed systems, trust, and practical software design.',
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
			{ label: 'my leetcode profile', href: 'https://leetcode.com/u/Anga205', icon: 'leetcode' },
		],
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
		title: 'The Alcoding Club',
		category: 'leadership',
		organization: 'The Alcoding Club',
		position: 'Club Head',
		department: 'Core Team',
		result: 'club head',
		date: 'September 2024 \u2014 April 2025',
		year: '2025',
		summary: 'The Competitive Programming Club of PES University',
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
		pageMenu: true,
		metaOnly: true,
		links: [
			{
				label: 'club page',
				href: 'https://clubs.pes.edu/the-alcoding-club/about/',
				icon: 'info',
			},
			{
				label: 'Docker Workshop',
				href: 'https://www.linkedin.com/posts/alcoding_docker-containerization-alcodingclub-activity-7355439380456501248-air3',
				icon: 'linkedin',
			},
			{
				label: 'Terrathon 4.0',
				href: 'https://www.linkedin.com/posts/alcoding_terrathon4-hackathon-sustainability-activity-7312160071730221056--2IU',
				icon: 'linkedin',
			},
			{
				label: 'club instagram',
				href: 'https://www.instagram.com/p/C_mwH_PykE7/?img_index=2',
				icon: 'external',
			},
		],
		images: [
			{
				src: '/achievements/alcoding-club-head/alcoding1.jpg',
				alt: 'Members of The Alcoding Club together at a club gathering.',
				caption: 'All the members of The Alcoding Club.',
			},
			{
				src: '/achievements/alcoding-club-head/alcoding2.jpg',
				alt: 'The team that hosted the Containerization with Docker workshop.',
				caption: 'The team responsible for hosting the Containerization with Docker workshop.',
			},
		],
		detail: {
			overview: [
				'The Alcoding Club is the Competitive Programming Club of PES University. I joined in January 2024 as a member of the technical team, where my work was mostly problem-setting and writing test cases for the monthly coding contests we hosted. That taught me a lot about the optimisation and contest-thinking side of competitive programming, well beyond just DSA \u2014 it was my first real exposure to that experience.',
				'During my time on the Problem Setting Team, I also helped organise the club\u2019s flagship 24-hour hackathon, Terrathon 3.0, the university\u2019s largest sustainability-themed hackathon, run in collaboration with the Changemakers\u2019 Society.',
				'When I became Head of the club in September 2024, I was one of very few second years to have become a club head that quickly, so I had a lot of figuring out to do. Luckily my <a href="https://www.instagram.com/p/C_mwH_PykE7" target="_blank" rel="noreferrer">core team</a> had some very talented people.',
				'The first event I hosted was the <a href="https://www.instagram.com/p/DA3IL5wzAKc" target="_blank" rel="noreferrer">October coding contest</a>. It was very early in my time as club head, and since a lot of the club had graduated or left and fresh recruitments were not done yet, I remember pulling all-nighters almost every night before the contests \u2014 setting up the contest, creating questions, making test cases. Huge thanks to <a href="https://www.linkedin.com/in/hashir-shaikh-9603a629a/" target="_blank" rel="noreferrer">Hashir Shaikh</a> and <a href="https://www.linkedin.com/in/munis-shafiq/" target="_blank" rel="noreferrer">Munis Shafiq</a> for pitching in and helping me set questions. We were understaffed, but we pulled it off.',
				'Usually around November every year, the Google Developer Student Club (GDSC) at PES University hosts a Docker workshop. During my year, 2024, that club was inactive because of some minor handover issues, so Hackerspace ECC hosted the workshop at EC Campus and my club pitched in to host it on the main campus (<a href="https://www.instagram.com/p/DCMXNCGNU0M" target="_blank" rel="noreferrer">Docker workshop post</a>). It was an interesting experience in event organisation and my first exposure to the operations side of event management: booking the venue, organising food, getting event permissions, managing the budget, and getting the speaker, <a href="https://www.linkedin.com/in/pranavjeet-naidu/" target="_blank" rel="noreferrer">Pranavjeet Naidu</a>, a member of the open source community at PES.',
				'The final event I hosted as club head was <a href="https://www.instagram.com/p/DHDHBApSLRI/" target="_blank" rel="noreferrer">Terrathon 4.0</a>, the club\u2019s flagship 24-hour hackathon. It was its own kind of fun: as club head there was a surprising amount of technical work in running a hackathon, mostly data science to manage spreadsheets of budgets, registrations, and volunteers. It was one of the few times I got to put my Python data-management skills to work.',
				"All in all, during my time as club head, We conducted 6 coding contests, 2 workshops and 1 hackathon (in collaboration with the Changemakers\u2019 Society).",
			],
			stack: ['HackerRank', 'C++', 'Python', 'Docker'],
		},
	},
	{
		slug: 'pesu-io-course',
		title: 'SME @ PESU I/O',
		category: 'leadership',
		organization: 'PESU I/O',
		position: 'Subject Matter Expert (SME)',
		department: 'Competitive Programming',
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
		slug: 'crais-robotics-intern',
		title: 'Robotics Intern @ cRAIS',
		category: 'leadership',
		organization: 'cRAIS (Center for Robotics Automation and Intelligent Systems)',
		position: 'Robotics Intern',
		department: 'Remote Robotics (ReRo) team',
		result: 'intern',
		date: 'June \u2014 July 2025',
		year: '2025',
		summary: 'worked on the Remote Robotics (ReRo) team.',
		description: 'A robotics internship with the Remote Robotics (ReRo) team at cRAIS.',
		tags: ['crais', 'robotics', 'rero', 'internship'],
		icon: 'container',
		menu: true,
		links: [
			{
				label: 'my linkedin post',
				href: 'https://lnkd.in/p/d3vHPJZd',
				icon: 'linkedin',
			},
		],
		detail: {
			overview: [
				'I worked as a robotics intern at cRAIS (Center for Robotics Automation and Intelligent Systems) on the Remote Robotics (ReRo) team.',
			],
			highlights: ['Worked with the Remote Robotics (ReRo) team.'],
		},
	},
	{
		slug: 'ieee-ras-speaker',
		title: 'IEEE RAS Speaker',
		category: 'leadership',
		organization: 'TAMS (The Amateur Manager and Scientist)',
		position: 'IEEE RAS Speaker',
		result: 'speaker',
		date: 'August 2025',
		year: '2025',
		summary: 'spoke on robotics at a TAMS session.',
		description:
			'A talk for the IEEE Robotics and Automation Society chapter, hosted by TAMS.',
		tags: ['ieee', 'ras', 'robotics', 'speaker', 'tams'],
		icon: 'users',
		menu: true,
		links: [
			{ label: 'my linkedin post', href: 'https://lnkd.in/p/deWbmV4m', icon: 'linkedin' },
		],
		detail: {
			overview: [
				'I spoke at an IEEE Robotics and Automation Society (RAS) session hosted by TAMS (The Amateur Manager and Scientist).',
			],
			highlights: ['Talk delivered to the IEEE RAS chapter at TAMS.'],
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
		slug: 'tedx-speaker',
		title: 'TEDx Speaker',
		category: 'community',
		organization: 'TEDxSNSCE',
		result: 'speaker',
		date: 'August 25, 2017',
		year: '2017',
		summary: 'a TEDx talk.',
		description: 'A TEDx talk delivered at TEDxSNSCE.',
		tags: ['tedx', 'speaker', 'talk', 'community'],
		icon: 'heart',
		menu: true,
		links: [
			{
				label: 'youtube video',
				href: 'https://www.youtube.com/watch?v=GSN9b3AIITw',
				icon: 'youtube',
			},
		],
		detail: {
			overview: ['A TEDx talk delivered at TEDxSNSCE.'],
			highlights: ['Spoke at TEDxSNSCE.'],
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
 * Medal cards always do; others opt in with `menu: true` or `pageMenu: true`.
 */
export function opensMenu(achievement: Achievement): boolean {
	return Boolean(achievement.medal) || Boolean(achievement.menu) || Boolean(achievement.pageMenu);
}

/**
 * Entries with a long-form page. `pageMenu` cards keep their page; it is only
 * reachable through the menu's "Activity Description" entry.
 */
export function hasDetailPage(achievement: Achievement): boolean {
	return !achievement.medal && !achievement.menu;
}

/**
 * University & extracurriculars live on their own page (/university), so the
 * achievements index excludes them.
 */
export const UNIVERSITY_ACHIEVEMENTS = ACHIEVEMENTS.filter(
	(achievement) => achievement.category === 'leadership' || achievement.alsoUniversity,
);

export const ACHIEVEMENT_INDEX = ACHIEVEMENTS.filter(
	(achievement) => achievement.category !== 'leadership',
);

export const DETAIL_ACHIEVEMENTS = ACHIEVEMENT_INDEX.filter(hasDetailPage);

export const UNIVERSITY_DETAIL_ACHIEVEMENTS = UNIVERSITY_ACHIEVEMENTS.filter(
	(achievement) => hasDetailPage(achievement) && !achievement.href,
);

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
		items: ACHIEVEMENT_INDEX.filter((achievement) => achievement.category === category),
	})).filter((group) => group.items.length > 0);
}
