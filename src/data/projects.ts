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
	live?: string;
	repo?: string;
	docs?: string;
	post?: string;
}

export const PROJECTS: Project[] = [
	{
		id: 'angadrive',
		name: 'AngaDriveV3',
		summary: 'fast, self-hosted remote file storage.',
		description:
			'A performance-focused file hosting service with live websocket updates, a DAG filesystem, resumable uploads, and a SolidJS client. It is open source, self-hostable on a Raspberry Pi, and designed to feel fast without requiring an account.',
		year: '2025',
		stack: ['Go', 'SolidJS', 'SQLite'],
		status: 'active',
		icon: 'drive',
		live: 'https://drive.anga.codes',
		repo: 'https://github.com/Anga205/AngaDriveV3',
		post: 'https://lnkd.in/p/dknw77Br',
	},
	{
		id: 'leetcode-tracker',
		name: 'Leetcode Tracker',
		summary: 'an automated competitive programming progress dashboard.',
		description:
			'A scheduled Rust updater records solve-count history through GitHub Actions, while a static React dashboard turns the readings into interactive charts for comparing progress over time.',
		year: '2025',
		stack: ['Rust', 'React', 'Chart.js'],
		status: 'active',
		icon: 'tracker',
		live: 'https://leetcode-tracker.anga.codes/',
		repo: 'https://github.com/Anga205/Leetcode-Tracker',
	},
	{
		id: 'code-execution-api',
		name: 'Code Execution API',
		summary: 'a hand-built sandbox for running untrusted code.',
		description:
			'A lower-overhead code sandbox built from Linux namespaces, cgroups v2, chroot, and seccomp-bpf instead of Docker or firejail. It runs Python, C, C++, and Java with hard time and memory limits, and is designed to power coding contests.',
		year: '2025',
		stack: ['Go', 'Linux', 'seccomp'],
		status: 'active',
		icon: 'terminal',
		live: 'https://compiler.anga.codes',
		repo: 'https://github.com/Anga205/CodeExecutionAPI',
		docs: 'https://github.com/Anga205/CodeExecutionAPI/blob/main/README.md',
		post: 'https://lnkd.in/p/duhbNW3q',
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
		repo: 'https://github.com/Anga205/angadbhalla.com',
	},
	{
		id: 'angaos',
		name: 'AngaOS',
		summary: 'a bare-bones operating system from the bootloader up.',
		description:
			'An x86 operating system built from a bootloader, kernel, and direct VGA-buffer output. It includes familiar filesystem commands such as ls, mkdir, cd, rm, and touch, and boots through QEMU with a small Makefile-driven toolchain.',
		year: '2025',
		stack: ['Assembly', 'C', 'NASM'],
		status: 'active',
		icon: 'terminal',
		repo: 'https://github.com/Anga205/AngaOS',
		post: 'https://lnkd.in/p/deAt6GRS',
	},
	{
		id: 'angadrive-v2',
		name: 'AngaDriveV2',
		summary: 'unsupported predecessor to AngaDriveV3.',
		description:
		'An older AngaDrive release kept as a public archive. It is no longer supported, but remains useful as a record of the project before the current version.',
		year: '2024',
		stack: ['Go', 'SQLite'],
		status: 'archived',
		icon: 'drive',
		repo: 'https://github.com/Anga205/AngaDriveV2',
	},
];
