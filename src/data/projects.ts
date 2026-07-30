export type Project = {
	slug: string;
	name: string;
	tagline: string;
	description: string;
	url?: string;
	repo?: string;
	status: "live" | "experimental";
	tech: string[];
	highlights: string[];
	metrics: { label: string; value: string }[];
	accent: string;
};

export const projects: Project[] = [
	{
		slug: "angadrive",
		name: "AngaDrive V3",
		tagline: "A self-hosted cloud drive that feels instant.",
		description:
			"A performance-obsessed, self-hostable cloud drive. The database is aggressively cached in RAM, uploads are chunked and gzip-compressed in the browser, and WebSockets push every change in real time. Collections are a many-to-many graph, not a folder tree.",
		url: "https://drive.anga.codes/",
		status: "live",
		tech: ["Go", "SolidJS", "SQLite", "GORM", "WebSockets", "FFmpeg", "Vite", "Tailwind"],
		highlights: [
			"RAM-first metadata layer — SQLite is durable storage, RAM is the operational index",
			"7 MB chunked uploads, up to 6 chunks per file and 3 files concurrently, gzip-compressed in the browser",
			"Persistent WebSocket state pushes file, collection, and stats updates instantly",
			"Cycle-safe collection graph with cached aggregate size propagation",
			"SHA-256 content-addressed storage with direct filesystem downloads",
			"Multi-level lazy rendering: bounded file cards, IntersectionObserver previews, browser image lazy-loading",
		],
		metrics: [
			{ label: "Go source", value: "~6.3k LOC" },
			{ label: "TSX source", value: "~6k LOC" },
			{ label: "Chunk size", value: "7 MB" },
			{ label: "Concurrency", value: "18 reqs" },
		],
		accent: "#38bdf8",
	},
	{
		slug: "compiler",
		name: "Containerization API",
		tagline: "An online compiler with a hand-built Linux sandbox.",
		description:
			"A code-execution API that skips Docker entirely and implements the sandbox boundary directly with Linux kernel primitives — namespaces, cgroups v2, chroot, bind mounts, and seccomp-BPF. It is a micro-container runtime specialized for short-lived compiler jobs.",
		url: "https://compiler.anga.codes/",
		status: "live",
		tech: ["Go", "Linux", "cgroups v2", "namespaces", "seccomp-BPF", "chroot", "Gin", "Astro"],
		highlights: [
			"Manual containerization: PID/mount/network/user namespaces, no Docker daemon",
			"cgroup v2 enforces memory, swap, CPU quota, and a 64-process cap (fork-bomb safe)",
			"seccomp-BPF denylist blocks mount, ptrace, reboot, and other dangerous syscalls",
			"Sandbox root maps to host UID 65534 — root inside is never host root",
			"Static C/C++ compilation for a minimal chroot; read-only runtime mounts for Python/Java",
			"Global RAM admission control rejects overload before a sandbox is created",
		],
		metrics: [
			{ label: "Languages", value: "4" },
			{ label: "Max timeout", value: "60s" },
			{ label: "Max memory", value: "128 MB" },
			{ label: "Global RAM", value: "1 GB" },
		],
		accent: "#a78bfa",
	},
	{
		slug: "angos",
		name: "AngaOS",
		tagline: "A 32-bit x86 operating system from scratch.",
		description:
			"A bootable hobby OS that owns the entire path from the BIOS's first instruction into its own kernel — custom bootloader, BIOS disk I/O, GDT, protected-mode transition, linker-controlled kernel placement, and direct VGA text rendering.",
		status: "experimental",
		tech: ["NASM", "C", "x86 Assembly", "GNU ld", "Make", "QEMU"],
		highlights: [
			"Custom 512-byte BIOS bootloader with INT 13h disk loading — no GRUB",
			"Manual GDT construction and CR0 protected-mode transition",
			"Linker places the kernel at 0x10000, matching the bootloader's load address",
			"Freestanding C compiled with -ffreestanding -nostdlib",
			"Direct VGA text-mode rendering at 0xB8000 with a working terminal",
			"Assembly-driven command shell with a custom strcmp",
		],
		metrics: [
			{ label: "Arch", value: "i386" },
			{ label: "Kernel", value: "15 KiB" },
			{ label: "Boot", value: "BIOS" },
			{ label: "Image", value: "1.44 MB" },
		],
		accent: "#4ade80",
	},
	{
		slug: "ppt2pdf",
		name: "PPT2PDF",
		tagline: "A converter that rescues ugly presentations.",
		description:
			"A fault-tolerant PowerPoint-to-PDF service. Instead of calling LibreOffice once and giving up, it treats conversion failure as recoverable — repairing PPTX archives, flattening nested roots, normalizing paths, and retrying through a fallback ladder until a valid PDF exists.",
		url: "https://ppt2pdf.anga.codes/",
		status: "live",
		tech: ["FastAPI", "Python", "LibreOffice", "Docker", "Uvicorn"],
		highlights: [
			"Speculative repair: generates clean, flattened, and store-only ZIP candidates",
			"Detects ZIP vs legacy OLE containers from just 8 bytes",
			"Two-step ODP normalization when direct PDF export fails",
			"Short-path retry removes filename/path weirdness from the equation",
			"Validates the output artifact, not just the exit code",
			"Per-invocation LibreOffice profile isolation for safe concurrency",
		],
		metrics: [
			{ label: "Formats", value: "3" },
			{ label: "Timeout", value: "240s" },
			{ label: "Repair modes", value: "3" },
			{ label: "Fallbacks", value: "5+" },
		],
		accent: "#fbbf24",
	},
	{
		slug: "leetcode-tracker",
		name: "LeetCode Tracker",
		tagline: "GitHub Actions as a scheduled backend.",
		description:
			"A competitive-progress tracker with no application server. GitHub Actions is the scheduler and worker, Git is the database and audit log, a JSON file is the materialized dataset, and Netlify serves a static React dashboard.",
		url: "https://battle.anga.codes/",
		status: "live",
		tech: ["Java", "GitHub Actions", "React", "Chart.js", "TypeScript", "Netlify"],
		highlights: [
			"GitHub Actions polls every 10 minutes and commits only meaningful changes",
			"Git is the database — 2,055 historical readings in a ~68 KB JSON file",
			"Incremental append-only updates keep history compact and diff-friendly",
			"Drag-to-select time windows and pairwise delta lines for real analysis",
			"Zero third-party runtime dependencies in the Java updater",
		],
		metrics: [
			{ label: "Users", value: "6" },
			{ label: "Readings", value: "2,055" },
			{ label: "Data file", value: "68 KB" },
			{ label: "Cadence", value: "10 min" },
		],
		accent: "#f472b6",
	},
];