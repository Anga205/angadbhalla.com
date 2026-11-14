/**
 * Every place I turn up online. Shared by the contact page and the home page
 * cards so the two can never drift apart.
 *
 * `icon` is a string key rather than a component: data modules stay free of
 * imports from the component layer, and each consumer maps the key to its own
 * icon set.
 */
export const CONTACTS = [
	{
		id: 'email',
		label: 'email',
		value: 'angadbhalla2005@gmail.com',
		href: 'mailto:angadbhalla2005@gmail.com',
		icon: 'mail',
	},
	{
		id: 'github',
		label: 'github',
		value: 'github.com/Anga205',
		href: 'https://github.com/Anga205/',
		icon: 'github',
	},
	{
		id: 'linkedin',
		label: 'linkedin',
		value: 'linkedin.com/in/anga',
		href: 'https://www.linkedin.com/in/anga',
		icon: 'linkedin',
	},
	{
		id: 'discord',
		label: 'discord',
		value: '@anga205',
		href: 'https://discord.com/users/477680545271250944',
		icon: 'discord',
	},
	{
		id: 'instagram',
		label: 'instagram',
		value: '@_anga205',
		href: 'https://www.instagram.com/_anga205/',
		icon: 'instagram',
	},
	{
		id: 'duolingo',
		label: 'duolingo',
		value: 'duolingo.com/profile/AngadBhalla',
		href: 'https://www.duolingo.com/profile/AngadBhalla',
		icon: 'duolingo',
	},
] as const;

export type ContactIcon = (typeof CONTACTS)[number]['icon'];