import type { EnumMemberType } from '../types.mjs';
import { type Stats, parseStats, parseStatsData } from './stat.mjs';

export type ItemType = EnumMemberType<typeof ItemType>;
export const ItemType = Object.freeze({
	// This item type is extremely rare and the game engine probably treats it as some sort of magic
	// value. However, there were cases when it was returned by game servers, so let's have it here
	// as well. Besides, we can use it as the default value in case of parsing errors.
	Unknown: 0,
	OneHanded: 1,
	TwoHanded: 2,
	HandAndAHalf: 3,
	Ranged: 4,
	Auxiliary: 5,
	Wand: 6,
	Orb: 7,
	Armor: 8,
	Helmet: 9,
	Boots: 10,
	Gloves: 11,
	Ring: 12,
	Necklace: 13,
	Shield: 14,
	Neutral: 15,
	Usable: 16,
	Gold: 17,
	Key: 18,
	Quest: 19,
	Renewable: 20,
	Arrows: 21,
	Talisman: 22,
	Book: 23,
	Bag: 24,
	Bless: 25,
	Upgrade: 26,
	Recipe: 27,
	Currency: 28,
	Quiver: 29,
});

export type ItemData = {
	name: string;
	cl: number;
	stat: string;
};

export type Item = {
	readonly name: string;
	readonly type: ItemType;
	readonly stats: Stats;
};

export function parseItem(data: ItemData): Item {
	let type: ItemType;

	// The reason why the comparison with `ItemType.Unknown` uses `>` instead of `>=` is that `-0`
	// is an integer in JS, and `-0 >= 0` is true. However, we should treat `-0` as an invalid item
	// type and coerce it to `0`. Using `>=` would silently assign `-0` as a valid type.
	if (Number.isInteger(data.cl) && data.cl > ItemType.Unknown && data.cl <= ItemType.Quiver) {
		// SAFETY: We've just validated that this is in range.
		type = data.cl as ItemType;
	} else {
		type = ItemType.Unknown;

		console.warn(`[Bonus Viewer] Unrecognizable item type '${data.cl}'`);
	}

	return {
		name: data.name,
		type,
		stats: parseStats(parseStatsData(data.stat)),
	};
}
