import type { CharClass, ItemType, Rarity, RarityModifier } from '../item.mjs';
import type { BonusCounter } from './counter.mjs';

export type EvalContext = {
	readonly x: number;
	readonly r: Rarity;
};

/**
 * A limited view of the item data combined with a value of the statistic that is being counted.
 *
 * To properly count bonuses, {@link BonusCounter bonus counters} require access to several pieces
 * of information about the item and the statistic they're counting. `StatContext` is used to
 * provide that information without giving counters mutable access to the counting state.
 */
export type StatContext = {
	/**
	 * The item type.
	 */
	readonly kind: ItemType;

	/**
	 * The item rarity including the {@link RarityModifier rarity modifier}.
	 */
	readonly rarity: Rarity;

	/**
	 * The item level including the {@link Stats.loweredLvl level reducer}.
	 *
	 * This value is guaranteed to be a positive integer.
	 */
	readonly lvl: number;

	/**
	 * A level modifier derived from the upgrade level.
	 *
	 * When an item is upgraded, the level for which bonus values are calculated increases. This
	 * value is equal to the difference between that level and the {@link StatContext.lvl item level}.
	 *
	 * This value is guaranteed to be a non-negative integer.
	 */
	readonly upgrade: number;

	/**
	 * Character classes that can use the item.
	 *
	 * Each class is represented by a single bit in this number. It is guaranteed that at least one
	 * class is present.
	 *
	 * @see {@linkcode CharClass} for more information.
	 */
	readonly charClasses: number;

	/**
	 * A part of the {@link StatContext.originalValue statistic value} that hasn't been processed
	 * yet.
	 *
	 * The statistic value may be composed of separate bonus values. While bonuses are being
	 * counted, subsequent {@link BonusCounter bonus counters} decrease this value by calculated
	 * bonus values.
	 */
	readonly currentValue: number;

	/**
	 * A value of the statistic as returned by the game server.
	 */
	readonly originalValue: number;
};
