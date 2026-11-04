// RNG determinista para tableros, dados y tests. Headless, sin Three ni React.
export function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function rollD6(rng: () => number = Math.random): number {
	return 1 + Math.floor(rng() * 6);
}
