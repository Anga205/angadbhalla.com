import { createSignal } from "solid-js";
import emailjs from "@emailjs/browser";
import StatusDialog from "./StatusDialog";

const EMAILJS_SERVICE_ID = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID || "TODO_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID || "TODO_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY || "TODO_PUBLIC_KEY";

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

export default function ResumeRequestForm() {
	const [email, setEmail] = createSignal("");
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
			message: "Your request is being prepared.",
		});

		try {
			await emailjs.send(
				EMAILJS_SERVICE_ID,
				EMAILJS_TEMPLATE_ID,
				{
					email: email(),
					time: new Date().toISOString(),
					intent: "resume request",
					message: "This is a resume request"
				},
				{
					publicKey: EMAILJS_PUBLIC_KEY,
				}
			);

			setEmail("");
			setDialog({
				open: true,
				tone: "success",
				title: "Request received successfully.",
				message: "I'll review it and follow up with an appropriate copy.",
			});
		} catch {
			setDialog({
				open: true,
				tone: "error",
				title: "Request could not be sent.",
				message: "Please try again or email me directly at sayhi@angadbhalla.com.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<form class="space-y-5" onSubmit={handleSubmit}>
				<div class="space-y-2">
					<label for="resume-email" class="text-xs uppercase tracking-[0.32em] text-white/45">
						Email
					</label>
					<input
						id="resume-email"
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

				<button
					type="submit"
						disabled={isSubmitting()}
					class="inline-flex items-center justify-center border border-white/10 bg-transparent px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
				>
					Request Resume
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