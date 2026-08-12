/**
 * The four top-level destinations. Order is the order shown in the selector.
 *
 * `href` is a real route, so the selector is plain links: browser back/forward
 * works without any client-side routing.
 */
export const DESTINATIONS = [
	{
		id: 'projects',
		label: 'Projects',
		href: '/projects',
		icon: 'projects',
		description: 'things I have built, with the useful parts left in.',
	},
	{
		id: 'about',
		label: 'About me',
		href: '/about',
		icon: 'about',
		description: 'background, engineering philosophy, and the work between projects.',
	},
	{
		id: 'achievements',
		label: 'Achievements',
		href: '/achievements',
		icon: 'achievements',
		description: 'certificates, hackathons, and contributions worth keeping track of.',
	},
	{
		id: 'find-me',
		label: 'Find me',
		href: '/find-me',
		icon: 'find-me',
		description: 'GitHub, LinkedIn, email, and the other places I turn up.',
	},
] as const;

export type DestinationId = (typeof DESTINATIONS)[number]['id'];
