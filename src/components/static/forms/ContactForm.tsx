import { createSignal, type Component } from "solid-js";
import emailjs from "@emailjs/browser";
import StatusDialog from "./StatusDialog";

const EMAILJS_SERVICE_ID = "TODO_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "TODO_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "TODO_PUBLIC_KEY";

type DialogState = {
	open: boolean;
	tone: "sending" | "success" | "error";
	title: string;
	message: string;
};

const emptyDialog = (): DialogState => ({
	open: false,
	tone: "sending",
	title: "",
	message: "",
});

export default function ContactForm() {
	const [name, setName] = createSignal("");
	const [email, setEmail] = createSignal("");
	const [message, setMessage] = createSignal("");
	const [isSubmitting, setIsSubmitting] = createSignal(false);
	const [dialog, setDialog] = createSignal<DialogState>(emptyDialog());

	const closeDialog = () => setDialog(emptyDialog());

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		setIsSubmitting(true);
		setDialog({
			open: true,
			tone: "sending",
			title: "Sending...",
			message: "Your message is on its way.",
		});

		try {
			await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_ID,
				{
					from_name: name(),
					from_email: email(),
					message: message(),
					reply_to: email(),
				},
				{
					publicKey: EMAILJS_PUBLIC_KEY,
				}
			);

			setName("");
			setEmail("");
			setMessage("");
			setDialog({
				open: true,
				tone: "success",
				title: "Message sent successfully.",
				message: "I'll review it and reply as soon as I can.",
			});
		} catch {
			setDialog({
				open: true,
				tone: "error",
				title: "Message could not be sent.",
				message: "Please try again, or email me directly at sayhi@angadbhalla.com.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<form class="space-y-5" onSubmit={handleSubmit}>
				<div class="space-y-2">
					<label for="contact-name" class="text-xs uppercase tracking-[0.32em] text-white/45">
						Name
					</label>
					<input
						id="contact-name"
						name="name"
						type="text"
						autocomplete="name"
						required
						value={name()}
						onInput={(event) => setName(event.currentTarget.value)}
						class="w-full border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
						placeholder="Your name"
					/>
				</div>

				<div class="space-y-2">
					<label for="contact-email" class="text-xs uppercase tracking-[0.32em] text-white/45">
						Email
					</label>
					<input
						id="contact-email"
						name="email"
						type="email"
						autocomplete="email"
						required
						value={email()}
						onInput={(event) => setEmail(event.currentTarget.value)}
						class="w-full border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
						placeholder="you@example.com"
					/>
				</div>

				<div class="space-y-2">
					<label for="contact-message" class="text-xs uppercase tracking-[0.32em] text-white/45">
						Message
					</label>
					<textarea
						id="contact-message"
						name="message"
						required
						value={message()}
						onInput={(event) => setMessage(event.currentTarget.value)}
						class="min-h-40 w-full border border-white/10 bg-neutral-900 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
						placeholder="Tell me a little about what you are working on."
					/>
				</div>

				<button
					type="submit"
					disabled={isSubmitting()}
					class="inline-flex items-center justify-center border border-white/10 bg-white/4 px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-60"
				>
					Send
				</button>
			</form>

			<StatusDialog
				open={dialog().open}
				tone={dialog().tone}
				title={dialog().title}
				message={dialog().message}
				onClose={closeDialog}
			/>
		</>
	);
}