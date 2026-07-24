import { type Component, createMemo, createSignal, onCleanup, onMount } from "solid-js";

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

const smoothstep = (edge0: number, edge1: number, x: number) => {
	const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
	return t * t * (3 - 2 * t);
};

const Navbar: Component = () => {
	const [scrollProgress, setScrollProgress] = createSignal(0);

	onMount(() => {
		const handleScroll = () => {
			setScrollProgress(
				clamp(window.scrollY / window.innerHeight, 0, 1)
			);
		};

		handleScroll();

		window.addEventListener("scroll", handleScroll, {
			passive: true,
		});

		onCleanup(() => {
			window.removeEventListener(
				"scroll",
				handleScroll
			);
		});
	});

	const progress = createMemo(() =>
		smoothstep(0.08, 0.32, scrollProgress())
	);

	const style = createMemo(() => ({
		transform: `translateY(${(-100 + progress() * 100).toFixed(2)}%)`,
		opacity: progress().toFixed(3),
	}));

	return (
		<header
			style={style()}
			class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-neutral-900/80 backdrop-blur-xl"
		>
			<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
				<a href="/" class="h-full p-2 flex items-center gap-2" >
					<img
						src="/anga.svg"
						alt="Anga Logo"
						class="spin-scale-hover h-full aspect-square"
					/>
				</a>

				<nav class="flex items-center gap-8 text-sm text-white/60">
					<a
						href="/"
						class="transition-colors text-white"
					>
						Home
					</a>

					<a
						href="/projects"
						class="transition-colors hover:text-white"
					>
						Projects
					</a>

					<a
						href="/resume"
						class="transition-colors hover:text-white"
					>
						Resume
					</a>

					<a
						href="/contact"
						class="transition-colors hover:text-white"
					>
						Contact
					</a>
				</nav>
			</div>
		</header>
	);
};

export default Navbar;