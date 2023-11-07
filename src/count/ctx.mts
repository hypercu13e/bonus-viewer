import type { Rarity } from '../item.mjs';

export type EvalContext = {
	readonly x: number;
	readonly r: Rarity;
};
