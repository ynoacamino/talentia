// Targeting: qué jugador está bajo el cursor (vista superior).
// La vista R3F hace raycast y llama a onTarget(playerIndex).
export function describeTarget(playerIndex: number): string {
	return `player:${playerIndex}`;
}
