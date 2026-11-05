/**
 * JoinScreen — Entrada de Código ([PLAY-01])
 * Soporta auto-llenado mediante ?s=XXXX o ingreso manual con teclado en pantalla.
 * Alfabeto seguro sin confusables (0, O, 1, I, L).
 */
import { useState } from "react";
import type { ISessionRepository } from "@/shared/documents.ts";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { SAFE_CODE_ALPHABET } from "@/ui/tokens/strings.ts";

export interface JoinScreenProps {
	prefilledCode?: string | null;
	repo?: ISessionRepository;
}

export function JoinScreen({ prefilledCode, repo }: JoinScreenProps) {
	const { joinSession } = usePlayStore();
	const [code, setCode] = useState(prefilledCode ?? "");
	const [error, setError] = useState<string | null>(null);

	const handleAddChar = (char: string) => {
		if (code.length < 4) {
			const nextCode = (code + char).toUpperCase();
			setCode(nextCode);
			setError(null);
		}
	};

	const handleDelete = () => {
		setCode(code.slice(0, -1));
		setError(null);
	};

	const handleSubmit = (e?: React.FormEvent) => {
		if (e) e.preventDefault();
		if (code.length !== 4) {
			setError("El código debe tener exactamente 4 caracteres.");
			return;
		}
		// Validar que no contenga caracteres inválidos
		for (const ch of code) {
			if (!SAFE_CODE_ALPHABET.includes(ch)) {
				setError(`El carácter '${ch}' no es válido en el código.`);
				return;
			}
		}
		joinSession(code, repo);
	};

	// Lista de caracteres para el teclado táctil
	const keyRows = [
		["2", "3", "4", "5", "6", "7", "8", "9"],
		["A", "B", "C", "D", "E", "F", "G", "H"],
		["J", "K", "M", "N", "P", "Q", "R", "S"],
		["T", "U", "V", "W", "X", "Y", "Z"],
	];

	return (
		<div className="flex h-full w-full flex-col items-center justify-center p-6 bg-radial from-slate-900 to-slate-950 text-white select-none">
			<div className="max-w-md w-full flex flex-col items-center gap-6 p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-700/80 shadow-2xl backdrop-blur-xl">
				{/* Logo / Título */}
				<div className="text-center">
					<div className="text-4xl mb-2">🌉 🦊 🦉 🐸</div>
					<h1 className="text-3xl font-black tracking-tight text-white">
						Misión: Reconstruir el Puente
					</h1>
					<p className="text-sm text-slate-300 mt-1">
						Ingresen el código de 4 letras que indica su docente
					</p>
				</div>

				{/* Cajas de Código de 4 caracteres */}
				<div
					data-testid="join-code-display"
					className="flex gap-3 justify-center my-2"
				>
					{[0, 1, 2, 3].map((idx) => {
						const char = code[idx] ?? "";
						const isActive = code.length === idx;
						return (
							<div
								key={idx}
								data-testid={`code-box-${idx}`}
								className={`w-14 h-16 rounded-2xl border-3 flex items-center justify-center text-3xl font-black transition-all ${
									isActive
										? "border-amber-400 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.3)] scale-105"
										: char
											? "border-emerald-400 bg-emerald-400/10 text-emerald-300 shadow-sm"
											: "border-slate-700 bg-slate-800/60 text-slate-500"
								}`}
							>
								{char || "•"}
							</div>
						);
					})}
				</div>

				{error && (
					<div
						data-testid="join-error"
						className="text-xs font-bold text-red-400 bg-red-950/60 px-4 py-2 rounded-xl border border-red-800 animate-shake"
					>
						{error}
					</div>
				)}

				{/* Teclado en pantalla táctil amigable */}
				<div className="w-full flex flex-col gap-2 my-2">
					{keyRows.map((row, rIdx) => (
						<div key={row.join("-")} className="flex justify-center gap-1.5">
							{row.map((k) => (
								<button
									key={k}
									type="button"
									data-testid={`key-${k}`}
									onClick={() => handleAddChar(k)}
									className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-black active:scale-95 text-base font-bold text-slate-200 border border-slate-700 transition-transform cursor-pointer"
								>
									{k}
								</button>
							))}
							{rIdx === keyRows.length - 1 && (
								<button
									type="button"
									data-testid="key-backspace"
									onClick={handleDelete}
									className="px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 active:scale-95 text-xs font-bold text-red-300 border border-red-800 cursor-pointer"
									title="Borrar carácter"
								>
									⌫
								</button>
							)}
						</div>
					))}
				</div>

				{/* Botón de Entrada */}
				<button
					type="button"
					data-testid="join-submit-btn"
					onClick={() => handleSubmit()}
					disabled={code.length !== 4}
					className={`w-full py-4 rounded-2xl text-lg font-black tracking-wide shadow-xl transition-all ${
						code.length === 4
							? "bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-98 shadow-amber-500/25 cursor-pointer"
							: "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
					}`}
				>
					Entrar al Equipo →
				</button>
			</div>
		</div>
	);
}
