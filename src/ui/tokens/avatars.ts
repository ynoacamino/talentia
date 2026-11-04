/**
 * Roster de Avatares (SPEC §3, §4, §8, §12)
 * 8 niños fijos (duplicados permitidos) + 3 NPCs fijos.
 */
import { AVATAR_COLORS, type KidAvatarId } from "@/ui/tokens/colors.ts";

export interface AvatarMeta {
	id: string;
	name: string;
	species: string;
	role: "kid" | "npc";
	themeColor: string;
	title?: string;
	station?: string;
	personality?: string;
	emoji: string;
}

// 8 Avatares fijos para niños (§3)
export const KID_AVATARS: AvatarMeta[] = [
	{
		id: "zorro" satisfies KidAvatarId,
		name: "Zorro",
		species: "Zorro andino",
		role: "kid",
		themeColor: AVATAR_COLORS.zorro.border,
		emoji: "🦊",
	},
	{
		id: "buho" satisfies KidAvatarId,
		name: "Búho",
		species: "Búho de bosque",
		role: "kid",
		themeColor: AVATAR_COLORS.buho.border,
		emoji: "🦉",
	},
	{
		id: "rana" satisfies KidAvatarId,
		name: "Rana",
		species: "Rana del lago",
		role: "kid",
		themeColor: AVATAR_COLORS.rana.border,
		emoji: "🐸",
	},
	{
		id: "gato" satisfies KidAvatarId,
		name: "Gato",
		species: "Gato montés",
		role: "kid",
		themeColor: AVATAR_COLORS.gato.border,
		emoji: "🐱",
	},
	{
		id: "llama" satisfies KidAvatarId,
		name: "Llama",
		species: "Llama de montaña",
		role: "kid",
		themeColor: AVATAR_COLORS.llama.border,
		emoji: "🦙",
	},
	{
		id: "toucan" satisfies KidAvatarId,
		name: "Tucán",
		species: "Tucán de la selva",
		role: "kid",
		themeColor: AVATAR_COLORS.toucan.border,
		emoji: "🦜",
	},
	{
		id: "raton" satisfies KidAvatarId,
		name: "Ratón",
		species: "Ratón veloz",
		role: "kid",
		themeColor: AVATAR_COLORS.raton.border,
		emoji: "🐭",
	},
	{
		id: "tortuga" satisfies KidAvatarId,
		name: "Tortuga",
		species: "Tortuga fluvial",
		role: "kid",
		themeColor: AVATAR_COLORS.tortuga.border,
		emoji: "🐢",
	},
];

// 3 NPCs fijos (§8)
export const NPC_ROSTER: Record<string, AvatarMeta> = {
	paco: {
		id: "paco",
		name: "Agricultor Paco",
		species: "Agricultor",
		role: "npc",
		themeColor: "#ffffff",
		title: "Agricultor de la chacra",
		station: "chacra",
		personality: "Práctico, media",
		emoji: "👨‍🌾",
	},
	luz: {
		id: "luz",
		name: "Ingeniera Luz",
		species: "Ingeniera",
		role: "npc",
		themeColor: "#ffffff",
		title: "Ingeniera del taller",
		station: "taller",
		personality: "Confundida-amable, aguda",
		emoji: "👩‍🔧",
	},
	soto: {
		id: "soto",
		name: "Alcalde Soto",
		species: "Alcalde",
		role: "npc",
		themeColor: "#ffffff",
		title: "Alcalde del pueblo",
		station: "alcaldia",
		personality: "Terco, grave",
		emoji: "🏛️",
	},
};

export function getAvatarById(id: string): AvatarMeta {
	const foundKid = KID_AVATARS.find((a) => a.id === id);
	if (foundKid) return foundKid;
	const foundNpc = NPC_ROSTER[id];
	if (foundNpc) return foundNpc;
	// fallback seguro
	const defaultKid = KID_AVATARS[0];
	return (
		defaultKid ?? {
			id: "zorro",
			name: "Zorro",
			species: "Zorro andino",
			role: "kid",
			themeColor: "#f97316",
			emoji: "🦊",
		}
	);
}
