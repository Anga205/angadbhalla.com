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
	/**
	 * Long-form description. Rendered as `sr-only` markup on the card and as
	 * `SoftwareSourceCode.description` in JSON-LD, so it is crawlable without
	 * changing the visible layout.
	 */
	description: string;
	year: string;
	/** ISO date the project was started, for schema.org `dateCreated`. */
	dateCreated?: string;
	stack: string[];
	status: ProjectStatus;
	icon: 'drive' | 'tracker' | 'terminal' | 'compiler' | 'web' | 'tool';
	live?: string;
	repo?: string;
	docs?: string;
	post?: string;
	/**
	 * Root-relative path to a long-form write-up for this project. When set,
	 * the card's title links here instead of opening the links dialog, so the
	 * card has exactly one primary destination.
	 */
	detail?: string;
}

export const PROJECTS: Project[] = [
	{
		id: 'angadrive',
		name: 'AngaDriveV3',
		summary: 'fast, self-hosted remote file storage.',
		description:
			'A performance-focused file hosting service with live websocket updates, a DAG filesystem, resumable uploads, and a SolidJS client. It is open source, self-hostable on a Raspberry Pi, and designed to feel fast without requiring an account. In production it serves 172 users and hosts over 4,000 files, averaging roughly 1,000 activity pulses a day on a single Raspberry Pi. Measured latency is 200 ms at P95 and 750 ms at P99.',
		year: '2025',
		dateCreated: '2025-01-01',
		stack: ['Go', 'SolidJS', 'SQLite'],
		status: 'active',
		icon: 'drive',
		live: 'https://drive.anga.codes',
		repo: 'https://github.com/Anga205/AngaDriveV3',
		post: 'https://lnkd.in/p/dknw77Br',
		detail: '/projects/angadrive',
	},
	{
		id: 'leetcode-tracker',
		name: 'Leetcode Tracker',
		summary: 'an automated competitive programming progress dashboard.',
		description:
			'A scheduled Rust updater records solve-count history through GitHub Actions, while a static React dashboard turns the readings into interactive charts for comparing progress over time.',
		year: '2025',
		dateCreated: '2025-01-01',
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
			'A lower-overhead code sandbox built from Linux namespaces, cgroups v2, chroot, and seccomp-bpf instead of Docker or firejail. It runs Python, C, C++, and Java with hard time and memory limits, and is designed to power coding contests. The sandbox boots in roughly 60 microseconds, and the service is publicly accessible as an API at compiler.anga.codes.',
		year: '2025',
		dateCreated: '2025-01-01',
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
			'Astro, Tailwind, and a lot of hand-written CSS. The sidebar is a real route, and Monaco only loads when a project needs it.',
		year: '2025',
		dateCreated: '2025-01-01',
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
		dateCreated: '2025-01-01',
		stack: ['Assembly', 'C', 'NASM'],
		status: 'active',
		icon: 'terminal',
		repo: 'https://github.com/Anga205/AngaOS',
		post: 'https://lnkd.in/p/deAt6GRS',
	},
	{
		id: 'angadrive-v2',
		name: 'AngaDriveV2',
		summary: 'Older version of AngaDriveV3, kept as a public archive. Written in Python3 with a NextJS frontend and FastAPI backend.',
		description:
		'An older AngaDrive release kept as a public archive. It is no longer supported, but remains useful as a record of the project before the current version.',
		year: '2024',		dateCreated: '2024-01-01',		stack: ['Go', 'SQLite'],
		status: 'archived',
		icon: 'drive',
		repo: 'https://github.com/Anga205/AngaDriveV2',
	},
];
