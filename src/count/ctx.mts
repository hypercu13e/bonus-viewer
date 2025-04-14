import * as external from '../external.mjs';
import {
	type CharClass,
	type CountableStatName,
	type Item,
	ItemType,
	type Rarity,
	RarityModifier,
	type Stats,
} from '../item.mjs';
import type { BonusCount } from './count.mjs';
import type { BonusCounter } from './counter.mjs';
import type { Result } from './result.mjs';
import * as result from './result.mjs';

export type StatProperties = {
	readonly regularBonus: BonusCount;
	readonly nativeBonus: boolean;
	readonly rarityDependent: boolean;
};

export type BonusDecomposition = {
	readonly regular: BonusCount;
	readonly native: boolean;
	readonly rarityModifier: RarityModifier;
};

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

export class ItemContext {
	#item: Item;
	#results: Map<CountableStatName, Result<BonusDecomposition>> = new Map();
	#rarityModifier: RarityModifier = RarityModifier.Regular;
	#rarityModifierWasExplicitlySet = false;

	get kind(): ItemType {
		return this.#item.type;
	}

	get rarity(): Rarity {
		return this.#item.stats.rarity + this.#rarityModifier;
	}

	set rarityModifier(modifier: RarityModifier) {
		this.#rarityModifier = modifier;
		this.#rarityModifierWasExplicitlySet = true;
	}

	get lvl(): number {
		const { lvl, loweredLvl = 0 } = this.#item.stats;

		if (lvl !== undefined) {
			return lvl + loweredLvl;
		}

		if (this.#item.type === ItemType.Bless) {
			return external.getCharLvl();
		}

		return 1;
	}

	get upgrade(): number {
		const { upgradeLvl = 0 } = this.#item.stats;

		return upgradeLvl * Math.round(0.03 * this.lvl);
	}

	get charClasses(): number {
		return this.#item.stats.charClasses;
	}

	get results(): Map<CountableStatName, Result<BonusDecomposition>> {
		return this.#results;
	}

	constructor(item: Item) {
		this.#item = item;
	}

	getStatValue<N extends CountableStatName>(name: N): Stats[N] {
		return this.#item.stats[name];
	}

	hasStat(name: CountableStatName): boolean {
		return this.#item.stats[name] !== undefined;
	}

	isRarityModifierSet(): boolean {
		return this.#rarityModifierWasExplicitlySet;
	}

	createStatContext(
		currentValue: number,
		originalValue: number,
		rarityModifier: RarityModifier = RarityModifier.Regular,
	): StatContext {
		return {
			kind: this.kind,
			rarity: this.rarity + rarityModifier,
			lvl: this.lvl,
			upgrade: this.upgrade,
			charClasses: this.charClasses,
			currentValue,
			originalValue,
		};
	}

	saveCountResult(statName: CountableStatName, res: Result<StatProperties>): undefined {
		this.#results.set(
			statName,
			result.map(res, (count) => ({
				regular: count.regularBonus,
				native: count.nativeBonus,
				rarityModifier: count.rarityDependent
					? this.#rarityModifier
					: RarityModifier.Regular,
			})),
		);
	}
}
