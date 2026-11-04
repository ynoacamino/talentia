/**
 * DrawingOverlay — Pizarra de Dibujo Interactiva ([PLAY-04], SPEC §6)
 * Conforme a SPEC §6:
 * - Overlay fullscreen exclusivo, reloj de juego en pausa salvo reloj de dibujo.
 * - 5 colores fijos (#111827 negro, #ef4444 rojo, #3b82f6 azul, #22c55e verde, #eab308 amarillo).
 * - Pincel grueso, lienzo HTML5 canvas multi-touch / mouse.
 * - Deshacer x20 (undo stack).
 * - Limpiar con confirmación inline.
 * - Plantilla de trazo de puente (Engineer trace outline).
 * - Reloj de 30s auto-submit con anillo visual.
 * - Botón "Listo" para enviar extracción de visión.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePlayStore } from "@/ui/play/playStore.ts";
import { DRAWING_PALETTE, type DrawingColorHex } from "@/ui/tokens/colors.ts";

interface StrokePoint {
	x: number;
	y: number;
}

interface Stroke {
	color: DrawingColorHex;
	size: number;
	points: StrokePoint[];
}

export function DrawingOverlay() {
	const { isDrawOpen, closeDraw, submitDrawing, drawTimeRemaining } =
		usePlayStore();

	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [currentColor, setCurrentColor] = useState<DrawingColorHex>("#111827");
	const [strokes, setStrokes] = useState<Stroke[]>([]);
	const [showTraceTemplate, setShowTraceTemplate] = useState(true);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const isDrawingRef = useRef(false);
	const currentStrokeRef = useRef<Stroke | null>(null);

	// 30s Auto-submit countdown (§6)
	useEffect(() => {
		if (!isDrawOpen) return;
		if (drawTimeRemaining <= 0) {
			submitDrawing();
			return;
		}
		const timer = setTimeout(() => {
			usePlayStore.setState({ drawTimeRemaining: drawTimeRemaining - 1 });
		}, 1000);
		return () => clearTimeout(timer);
	}, [isDrawOpen, drawTimeRemaining, submitDrawing]);

	// Redibujar Canvas
	const renderCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Fondo de papel suave
		ctx.fillStyle = "#faf8f5";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Plantilla del ingeniero bajo los trazos (Engineer trace: SPEC §6)
		if (showTraceTemplate) {
			ctx.save();
			ctx.strokeStyle = "#cbd5e1";
			ctx.lineWidth = 3;
			ctx.setLineDash([8, 8]);

			// Río en el centro
			ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
			ctx.fillRect(canvas.width * 0.35, 0, canvas.width * 0.3, canvas.height);

			// Landing pads (orillas izquierda y derecha)
			ctx.fillStyle = "rgba(148, 163, 184, 0.2)";
			ctx.fillRect(
				canvas.width * 0.1,
				canvas.height * 0.45,
				canvas.width * 0.25,
				40,
			);
			ctx.strokeRect(
				canvas.width * 0.1,
				canvas.height * 0.45,
				canvas.width * 0.25,
				40,
			);

			ctx.fillRect(
				canvas.width * 0.65,
				canvas.height * 0.45,
				canvas.width * 0.25,
				40,
			);
			ctx.strokeRect(
				canvas.width * 0.65,
				canvas.height * 0.45,
				canvas.width * 0.25,
				40,
			);

			// Span central sugerido
			ctx.strokeRect(
				canvas.width * 0.3,
				canvas.height * 0.42,
				canvas.width * 0.4,
				46,
			);

			ctx.fillStyle = "#94a3b8";
			ctx.font = "bold 13px system-ui";
			ctx.textAlign = "center";
			ctx.fillText(
				"Orilla Sur (Apoyo 1)",
				canvas.width * 0.22,
				canvas.height * 0.45 - 10,
			);
			ctx.fillText(
				"Orilla Norte (Apoyo 2)",
				canvas.width * 0.78,
				canvas.height * 0.45 - 10,
			);
			ctx.fillText("Río", canvas.width * 0.5, canvas.height * 0.2);
			ctx.restore();
		}

		// Dibujar todos los trazos registrados
		for (const s of strokes) {
			if (s.points.length < 2) continue;
			ctx.beginPath();
			ctx.strokeStyle = s.color;
			ctx.lineWidth = s.size;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";

			const first = s.points[0];
			if (first) {
				ctx.moveTo(first.x, first.y);
				for (let i = 1; i < s.points.length; i++) {
					const pt = s.points[i];
					if (pt) ctx.lineTo(pt.x, pt.y);
				}
				ctx.stroke();
			}
		}

		// Trazo activo actual
		if (
			currentStrokeRef.current &&
			currentStrokeRef.current.points.length >= 2
		) {
			const active = currentStrokeRef.current;
			ctx.beginPath();
			ctx.strokeStyle = active.color;
			ctx.lineWidth = active.size;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			const first = active.points[0];
			if (first) {
				ctx.moveTo(first.x, first.y);
				for (let i = 1; i < active.points.length; i++) {
					const pt = active.points[i];
					if (pt) ctx.lineTo(pt.x, pt.y);
				}
				ctx.stroke();
			}
		}
	}, [strokes, showTraceTemplate]);

	useEffect(() => {
		renderCanvas();
	}, [renderCanvas]);

	// Inicializar tamaño del lienzo
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		canvas.width = canvas.parentElement?.clientWidth ?? 900;
		canvas.height = canvas.parentElement?.clientHeight ?? 600;
		renderCanvas();
	}, [renderCanvas]);

	const handlePointerDown = (e: React.PointerEvent) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		isDrawingRef.current = true;
		currentStrokeRef.current = {
			color: currentColor,
			size: 10, // Pincel grueso (§6)
			points: [{ x, y }],
		};
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isDrawingRef.current || !currentStrokeRef.current) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		currentStrokeRef.current.points.push({ x, y });
		renderCanvas();
	};

	const handlePointerUp = () => {
		if (isDrawingRef.current && currentStrokeRef.current) {
			const stroke = currentStrokeRef.current;
			if (stroke.points.length > 1) {
				// Guardar en el historial (tope x20 para undo)
				setStrokes((prev) => [...prev.slice(-19), stroke]);
			}
		}
		isDrawingRef.current = false;
		currentStrokeRef.current = null;
		renderCanvas();
	};

	const handleUndo = () => {
		setStrokes((prev) => prev.slice(0, -1));
	};

	const handleClear = () => {
		setStrokes([]);
		setShowClearConfirm(false);
	};

	if (!isDrawOpen) return null;

	return (
		<div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col z-50 select-none animate-pop">
			{/* Top Bar de la Pizarra */}
			<div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<span className="text-xl">🎨</span>
					<div>
						<h3 className="text-base font-black text-white leading-tight">
							Pizarra de Dibujo — Diseñen el Puente
						</h3>
						<p className="text-[11px] text-slate-400">
							Luz evaluará apoyos y luz del puente en base al dibujo
						</p>
					</div>
				</div>

				{/* Anillo de tiempo restante (30s) */}
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700">
						<span className="text-xs font-mono font-bold text-amber-400">
							⏱️ {drawTimeRemaining}s
						</span>
						<span className="text-[10px] text-slate-400 uppercase">
							auto-envío
						</span>
					</div>

					<button
						type="button"
						onClick={closeDraw}
						className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
					>
						✕ Cerrar
					</button>
				</div>
			</div>

			{/* Contenedor Central con Lienzo y Controles */}
			<div className="flex-1 relative overflow-hidden flex flex-col md:flex-row">
				{/* Barra de Herramientas Lateral */}
				<div className="w-full md:w-60 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col justify-between gap-4">
					{/* 5 Colores Fijos (§6) */}
					<div>
						<div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
							Color (5 fijos):
						</div>
						<div className="grid grid-cols-5 gap-2">
							{DRAWING_PALETTE.map((pal) => (
								<button
									key={pal.id}
									type="button"
									onClick={() => setCurrentColor(pal.hex)}
									style={{ backgroundColor: pal.hex }}
									className={`w-10 h-10 rounded-xl border-3 transition-transform cursor-pointer shadow-md ${
										currentColor === pal.hex
											? "border-white scale-110 shadow-lg ring-2 ring-white/50"
											: "border-slate-700 hover:scale-105"
									}`}
									title={pal.name}
								/>
							))}
						</div>
					</div>

					{/* Opciones de Plantilla y Edición */}
					<div className="flex flex-col gap-2">
						<button
							type="button"
							onClick={() => setShowTraceTemplate(!showTraceTemplate)}
							className={`w-full py-2 px-3 rounded-xl text-xs font-bold border text-left flex items-center justify-between cursor-pointer ${
								showTraceTemplate
									? "bg-sky-950/80 border-sky-600 text-sky-200"
									: "bg-slate-800 border-slate-700 text-slate-400"
							}`}
						>
							<span>Guía de Orillas</span>
							<span>{showTraceTemplate ? "Activada" : "Oculta"}</span>
						</button>

						<button
							type="button"
							onClick={handleUndo}
							disabled={strokes.length === 0}
							className={`w-full py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer ${
								strokes.length > 0
									? "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
									: "bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed"
							}`}
						>
							<span>↩️ Deshacer</span>
							<span className="text-[10px] text-slate-400">
								({strokes.length})
							</span>
						</button>

						<button
							type="button"
							onClick={() => setShowClearConfirm(true)}
							disabled={strokes.length === 0}
							className="w-full py-2 px-3 rounded-xl text-xs font-bold border bg-red-950/40 hover:bg-red-950/80 text-red-300 border-red-800/80 cursor-pointer"
						>
							🗑️ Limpiar lienzo
						</button>
					</div>

					{/* Botón de Envío "Listo" */}
					<div>
						<button
							type="button"
							onClick={submitDrawing}
							className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base shadow-xl active:scale-98 cursor-pointer flex items-center justify-center gap-2"
						>
							<span>✓ Listo</span>
							<span className="text-xs font-bold bg-slate-950/20 px-2 py-0.5 rounded-md">
								Enviar
							</span>
						</button>
					</div>
				</div>

				{/* Área del Lienzo Canvas */}
				<div className="flex-1 relative bg-slate-950 p-4 flex items-center justify-center">
					<div className="relative w-full h-full max-w-4xl max-h-[640px] rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700">
						<canvas
							ref={canvasRef}
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
							onPointerCancel={handlePointerUp}
							className="w-full h-full touch-none cursor-crosshair"
						/>
					</div>
				</div>
			</div>

			{/* Modal de Confirmación para Limpiar Dibujo */}
			{showClearConfirm && (
				<div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-pop">
						<div className="text-3xl mb-2">🗑️</div>
						<h4 className="text-lg font-black text-white mb-2">
							¿Borrar todo el dibujo?
						</h4>
						<p className="text-xs text-slate-300 mb-6">
							Se perderán todos los trazos actuales y comenzarán desde cero.
						</p>
						<div className="flex gap-3 justify-center">
							<button
								type="button"
								onClick={() => setShowClearConfirm(false)}
								className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleClear}
								className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md cursor-pointer"
							>
								Sí, borrar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
