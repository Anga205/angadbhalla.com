import { createEffect, onCleanup, Show, type Component } from "solid-js";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-solid";

type StatusTone = "sending" | "success" | "error";

interface StatusDialogProps {
	open: boolean;
	tone: StatusTone;
	title: string;
	message: string;
	onClose: () => void;
}

const toneStyles: Record<StatusTone, string> = {
	sending: "border-white/10 bg-neutral-950",
	success: "border-white/15 bg-neutral-950",
	error: "border-white/15 bg-neutral-950",
};

const ToneIcon = (props: { tone: StatusTone }) => {
	if (props.tone === "sending") {
		return <Loader2 className="h-5 w-5 animate-spin text-white/70" />;
	}

	if (props.tone === "success") {
		return <CheckCircle2 className="h-5 w-5 text-white/80" />;
	}

	return <AlertTriangle className="h-5 w-5 text-white/80" />;
};

const StatusDialog: Component<StatusDialogProps> = (props) => {
	createEffect(() => {
		if (!props.open) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && props.tone !== "sending") {
				props.onClose();
			}
		};

		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleKeyDown);
		onCleanup(() => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", handleKeyDown);
		});
	});

	return (
		<Show when={props.open}>
			<div
				className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
				role="presentation"
				onClick={() => {
					if (props.tone !== "sending") {
						props.onClose();
					}
				}}
			>
				<div
					role="dialog"
					aria-modal="true"
					aria-labelledby="status-dialog-title"
					aria-describedby="status-dialog-message"
					className={`w-full max-w-md border px-5 py-5 text-white shadow-none ${toneStyles[props.tone]}`}
					onClick={(event) => {
						event.stopPropagation();
					}}
				>
					<div className="flex items-start justify-between gap-4">
						<div className="flex items-start gap-3">
							<span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center border border-white/10 bg-white/3">
								<ToneIcon tone={props.tone} />
							</span>
							<div>
								<h2 id="status-dialog-title" className="text-base font-medium text-white">
									{props.title}
								</h2>
								<p id="status-dialog-message" className="mt-2 text-sm leading-6 text-white/70">
									{props.message}
								</p>
							</div>
						</div>

						{props.tone !== "sending" ? (
							<button
								type="button"
								onClick={props.onClose}
								className="inline-flex h-9 w-9 items-center justify-center border border-white/10 text-white/60 transition hover:border-white/20 hover:text-white"
								aria-label="Close dialog"
							>
								<X className="h-4 w-4" />
							</button>
						) : null}
					</div>
				</div>
			</div>
		</Show>
	);
};

export default StatusDialog;