/**
 * Project catalogue.
 *
 * Every project is a card on /projects and an entry in the sidebar accordion.
 * Links are optional on purpose: some projects have no public repo, some have
 * no live demo, and some have neither. The card layout must not depend on how
 * many links exist.
 *
 * status:
 *   active    maintained, works today
 *   archived  public archive, code exists but is not maintained
 *   inactive  not running any more, kept for the record
 */
export type ProjectStatus = 'active' | 'archived' | 'inactive';

export interface Project {
	id: string;
	name: string;
	summary: string;
	description: string;
	year: string;
	stack: string[];
	status: ProjectStatus;
	icon: 'drive' | 'tracker' | 'terminal' | 'compiler' | 'web' | 'tool';
	demo?: string;
	repo?: string;
	docs?: string;
}

export const PROJECTS: Project[] = [
	{
		id: 'angadrive',
		name: 'AngaDriveV3',
		summary: 'self-hosted file storage with a small sync client.',
		description:
			'A drive I run myself. Chunked uploads, resumable transfers, and a sync client that does not need a browser open. Built to understand storage and conflict handling rather than to compete with anyone.',
		year: '2025',
		stack: ['Go', 'SQLite', 'TypeScript'],
		status: 'active',
		icon: 'drive',
		demo: '#',
		repo: '#',
		docs: '#',
	},
	{
		id: 'leetcode-tracker',
		name: 'Leetcode Tracker',
		summary: 'tracks competitive programming progress over time.',
		description:
			'Pulls submissions from judges, stores them, and charts the parts that actually matter: consistency, topic coverage, and where the difficulty wall is. The interesting part is the data model, not the charts.',
		year: '2025',
		stack: ['Python', 'Postgres', 'React'],
		status: 'active',
		icon: 'tracker',
		demo: '#',
		repo: '#',
		docs: '#',
	},
	{
		id: 'code-execution-api',
		name: 'Code Execution API',
		summary: 'a hand-built sandbox for running untrusted code.',
		description:
			'Namespaces, cgroups v2, chroot, and seccomp-bpf straight against the kernel. No Docker, no container runtime in between. Four languages with hard time and memory limits.',
		year: '2025',
		stack: ['Go', 'Linux', 'seccomp'],
		status: 'active',
		icon: 'terminal',
		demo: '/projects/code-execution-api',
		repo: 'https://github.com/Anga205/CodeExecutionAPI',
		docs: '#',
	},
	{
		id: 'compiler',
		name: 'Compiler',
		summary: 'a small compiler front end written from scratch.',
		description:
			'Lexer, parser, and a typed AST for a small language. Written to learn the boring parts properly: error recovery, source spans, and diagnostics that point at the right token.',
		year: '2024',
		stack: ['C', 'LLVM'],
		status: 'archived',
		icon: 'compiler',
		repo: '#',
		docs: '#',
	},
	{
		id: 'portfolio',
		name: 'Portfolio',
		summary: 'this site. terminal first, no framework runtime.',
		description:
			'Astro, Tailwind, and a lot of hand-written CSS. The opening sequence is a small state machine, the selector is a real route, and Monaco only loads when a project needs it.',
		year: '2025',
		stack: ['Astro', 'TypeScript', 'Tailwind'],
		status: 'active',
		icon: 'web',
		repo: '#',
		docs: '#',
	},
	{
		id: 'dotfiles',
		name: 'Dotfiles',
		summary: 'a GNOME setup that stays out of the way.',
		description:
			'Shell, editor, and desktop configuration kept in one place. Mostly here so a new machine takes minutes instead of an evening.',
		year: '2023',
		stack: ['Shell', 'GNOME'],
		status: 'archived',
		icon: 'tool',
		repo: '#',
	},
];
