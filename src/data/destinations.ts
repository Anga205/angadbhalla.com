/**
 * The top-level destinations. Order is the order shown in the sidebar.
 *
 * `href` is a real route, so navigation is plain links: browser back/forward
 * works without any client-side routing.
 *
 * `shortLabel` is used by the six-item mobile rail, where the full label would
 * be truncated away.
 */
export const DESTINATIONS = [
	{
		id: 'home',
		label: 'Home',
		shortLabel: 'home',
		href: '/',
		icon: 'home',
		description: 'who I am, what I am studying, and where to find me.',
	},
	{
		id: 'projects',
		label: 'Projects',
		shortLabel: 'proj',
		href: '/projects',
		icon: 'projects',
		description: 'things I have built, with the useful parts left in.',
	},
	{
		id: 'university',
		label: 'University',
		shortLabel: 'uni',
		href: '/university',
		icon: 'university',
		description: 'clubs, teaching, internships, and talks from university.',
	},
	{
		id: 'achievements',
		label: 'Achievements',
		shortLabel: 'awards',
		href: '/achievements',
		icon: 'achievements',
		description: 'certificates, hackathons, and contributions worth keeping track of.',
	},
	{
		id: 'philosophy',
		label: 'Philosophy',
		shortLabel: 'philo',
		href: '/philosophy',
		icon: 'philosophy',
		description: 'how I think about building software, and why the goofy ones win.',
	},
	{
		id: 'contact',
		label: 'Contact',
		shortLabel: 'contact',
		href: '/contact',
		icon: 'contact',
		description: 'GitHub, LinkedIn, email, and the other places I turn up.',
	},
] as const;

export type DestinationId = (typeof DESTINATIONS)[number]['id'];
