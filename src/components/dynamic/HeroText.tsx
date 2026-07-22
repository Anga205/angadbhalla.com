import { type Component, createSignal, onMount, onCleanup } from "solid-js";

interface HeroTextProps {
	initial: string;
}

const aliases = [
	"Hello!",
	"Namaskāra!",
	"Assalamualaikum!"
];

const TYPE_DELAY = 70;
const DELETE_DELAY = 40;
const HOLD_DELAY = 1800;

const HeroText: Component<HeroTextProps> = (props) => {
	const [text, setText] = createSignal(props.initial);

	let aliasIndex = 0;
	let charIndex = props.initial.length;
	let deleting = false;

	let timeout: number;

	const tick = () => {
		const current = aliases[aliasIndex];

		if (!deleting) {
			if (charIndex < current.length) {
				charIndex++;
				setText(current.slice(0, charIndex));
				timeout = window.setTimeout(tick, TYPE_DELAY);
			} else {
				deleting = true;
				timeout = window.setTimeout(tick, HOLD_DELAY);
			}
		} else {
			if (charIndex > 0) {
				charIndex--;
				setText(current.slice(0, charIndex));
				timeout = window.setTimeout(tick, DELETE_DELAY);
			} else {
				deleting = false;
				aliasIndex = (aliasIndex + 1) % aliases.length;
				charIndex = 0;
				timeout = window.setTimeout(tick, TYPE_DELAY);
			}
		}
	};

	onMount(() => {
		// Pause before beginning the animation so the
		// SSR text is visible briefly.
		timeout = window.setTimeout(tick, HOLD_DELAY);
	});

	onCleanup(() => {
		clearTimeout(timeout);
	});

	return (
		<>
			{text()}
			<span class="animate-pulse text-violet-400">_</span>
		</>
	);
};

export default HeroText;