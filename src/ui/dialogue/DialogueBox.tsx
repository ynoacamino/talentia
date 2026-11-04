import { useDialogueStore } from "@/game/dialogue/store.ts";

export function DialogueBox() {
	const visible = useDialogueStore((s) => s.visible);
	const currentLine = useDialogueStore((s) => s.currentLine);
	const next = useDialogueStore((s) => s.next);
	const stop = useDialogueStore((s) => s.stop);

	if (!visible) return null;
	const line = currentLine();
	if (!line) return null;

	return (
		<div className="pointer-events-auto absolute bottom-6 left-1/2 w-[min(560px,90vw)] -translate-x-1/2 rounded-xl bg-black/80 p-4 shadow-xl">
			<div className="text-xs font-bold tracking-widest text-violet-300 uppercase">
				{line.speaker}
			</div>
			<p className="mt-1 text-lg leading-snug">{line.text}</p>
			<div className="mt-3 flex justify-end gap-2">
				<button
					type="button"
					onClick={stop}
					className="rounded px-3 py-2 text-sm text-slate-300"
				>
					Cerrar
				</button>
				<button
					type="button"
					onClick={next}
					className="rounded bg-white px-4 py-2 text-sm font-bold text-black"
				>
					Siguiente
				</button>
			</div>
		</div>
	);
}
