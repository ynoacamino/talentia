/**
 * Paper-Mario Cutout Avatar Component
 * Conforme a SPEC §3, §4, §12:
 * Niños: borde de color Paper-Mario cutout + sticker shadow + name tag.
 * NPCs: borde blanco puro + sticker shadow.
 */
import { type AvatarMeta, getAvatarById } from "@/ui/tokens/avatars.ts";
import { AVATAR_COLORS, type KidAvatarId } from "@/ui/tokens/colors.ts";

export interface AvatarCutoutProps {
	avatarId: string;
	size?: "sm" | "md" | "lg" | "xl";
	isNpc?: boolean;
	nameTag?: string;
	showBorder?: boolean;
	className?: string;
	onClick?: () => void;
	statusRing?: string;
}

const SIZE_MAP = {
	sm: "w-10 h-10 text-xl",
	md: "w-14 h-14 text-2xl",
	lg: "w-20 h-20 text-4xl",
	xl: "w-28 h-28 text-5xl",
};

export function AvatarCutout({
	avatarId,
	size = "md",
	isNpc = false,
	nameTag,
	showBorder = true,
	className = "",
	onClick,
	statusRing,
}: AvatarCutoutProps) {
	const meta: AvatarMeta = getAvatarById(avatarId);
	const isKid = !isNpc && meta.role === "kid";

	// Obtener color del tema
	const colorTheme = isKid
		? (AVATAR_COLORS[avatarId as KidAvatarId] ?? {
				border: meta.themeColor,
				bg: "rgba(255,255,255,0.1)",
				text: "#ffffff",
			})
		: null;

	const borderStyle = isKid
		? {
				borderColor: colorTheme?.border ?? "#f97316",
				backgroundColor: colorTheme?.bg ?? "rgba(255,255,255,0.1)",
			}
		: {
				borderColor: "#ffffff",
				backgroundColor: "rgba(255,255,255,0.15)",
			};

	const sizeClasses = SIZE_MAP[size];

	const content = (
		<>
			{/* Cutout Container */}
			<div
				style={showBorder ? borderStyle : undefined}
				className={`relative flex items-center justify-center rounded-2xl transition-all duration-150 ${
					sizeClasses
				} ${
					isNpc ? "paper-cutout-npc" : showBorder ? "paper-cutout" : ""
				} ${statusRing ? `ring-offset-2 ring-offset-slate-950 ${statusRing}` : ""} ${
					onClick ? "cursor-pointer active:scale-95 hover:scale-105" : ""
				}`}
			>
				{/* Avatar Emoji / Silhouette */}
				<span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
					{meta.emoji}
				</span>

				{/* Species small icon badge if NPC */}
				{isNpc && (
					<span
						className="absolute -top-2 -right-2 bg-white text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-md border border-slate-300"
						title={meta.title}
					>
						PNJ
					</span>
				)}
			</div>

			{/* Name tag pill (SPEC §3: 10-char max shown above cutout or below) */}
			{nameTag && (
				<span
					className="mt-1.5 px-2 py-0.5 text-xs font-bold rounded-md bg-slate-900/90 text-white border border-slate-700/80 shadow-sm max-w-[90px] truncate text-center tracking-wide"
					title={nameTag}
				>
					{nameTag.slice(0, 10)}
				</span>
			)}
		</>
	);

	if (onClick) {
		return (
			<button
				type="button"
				className={`inline-flex flex-col items-center justify-center select-none bg-transparent border-0 p-0 text-left ${className}`}
				onClick={onClick}
			>
				{content}
			</button>
		);
	}

	return (
		<div
			className={`inline-flex flex-col items-center justify-center select-none ${className}`}
		>
			{content}
		</div>
	);
}
