import { type Component, createSignal, onCleanup, onMount } from "solid-js";

interface GreetingTextProps {
	initial: string;
}

const greetings = ["Hello!", "Namaskāra!", "Assalamualaikum!"];

const TYPE_DELAY = 70;
const DELETE_DELAY = 40;
const HOLD_DELAY = 1800;

const GreetingText: Component<GreetingTextProps> = (props) => {
	const [text, setText] = createSignal(props.initial);

	let greetingIndex = 0;
	let charIndex = props.initial.length;
	let deleting = false;
	let timeoutId: ReturnType<typeof setTimeout> | NodeJS.Timeout | undefined;

	const scheduleNextTick = (delay: number) => {
		timeoutId = window.setTimeout(tick, delay) as unknown as ReturnType<typeof setTimeout>;
	};

	const tick = () => {
		const currentGreeting = greetings[greetingIndex];

		if (deleting) {
			if (charIndex > 0) {
				charIndex--;
				setText(currentGreeting.slice(0, charIndex));
				scheduleNextTick(DELETE_DELAY);
				return;
			}

			deleting = false;
			greetingIndex = (greetingIndex + 1) % greetings.length;
			charIndex = 0;
			scheduleNextTick(TYPE_DELAY);
			return;
		}

		if (charIndex < currentGreeting.length) {
			charIndex++;
			setText(currentGreeting.slice(0, charIndex));
			scheduleNextTick(TYPE_DELAY);
			return;
		}

		deleting = true;
		scheduleNextTick(HOLD_DELAY);
	};

	onMount(() => {
		scheduleNextTick(HOLD_DELAY);
	});

	onCleanup(() => {
		if (timeoutId !== undefined) {
			clearTimeout(timeoutId);
		}
	});

	return (
		<>
			{text()}
			<span class="animate-pulse text-violet-400">_</span>
		</>
	);
};

export default GreetingText;