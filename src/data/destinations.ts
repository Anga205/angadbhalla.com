/**
 * The five top-level destinations. Order is the order shown in the sidebar.
 *
 * `href` is a real route, so navigation is plain links: browser back/forward
 * works without any client-side routing.
 */
export const DESTINATIONS = [
	{
		id: 'home',
		label: 'Home',
		href: '/',
		icon: 'home',
		description: 'background, engineering philosophy, and the work between projects.',
	},
	{
		id: 'projects',
		label: 'Projects',
		href: '/projects',
		icon: 'projects',
		description: 'things I have built, with the useful parts left in.',
	},
	{
		id: 'university',
		label: 'University',
		href: '/university',
		icon: 'university',
		description: 'clubs, teaching, internships, and talks from university.',
	},
	{
		id: 'achievements',
		label: 'Achievements',
		href: '/achievements',
		icon: 'achievements',
		description: 'certificates, hackathons, and contributions worth keeping track of.',
	},
	{
		id: 'contact',
		label: 'Contact',
		href: '/contact',
		icon: 'contact',
		description: 'GitHub, LinkedIn, email, and the other places I turn up.',
	},
] as const;

export type DestinationId = (typeof DESTINATIONS)[number]['id'];
