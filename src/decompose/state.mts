import * as external from '#external';
import { type CountableStatName, type Item, ItemType, type Rarity, RarityModifier } from '#item';
import { readonlyProperty } from '#utils';
import type { BonusCount } from './count.mts';

export type StatDecompositionStateOptions = {
	value?: number | undefined;
	count?: BonusCount | undefined;
	native?: boolean | undefined;
	currentRarityModifier?: RarityModifier | undefined;
	detectedRarityModifier?: RarityModifier | undefined;
};

export class StatDecompositionState {
	readonly value: number;
	readonly statValue: number;
	readonly count: BonusCount | undefined;
	readonly native: boolean | undefined;
	readonly currentRarityModifier: RarityModifier | undefined;
	readonly detectedRarityModifier: RarityModifier | undefined;
	#item: Item;

	get itemType(): ItemType {
		return this.#item.type;
	}

	get rarity(): Rarity {
		return this.#item.stats.rarity + (this.currentRarityModifier ?? RarityModifier.Regular);
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

	constructor(item: Item, statValue: number, options?: StatDecompositionStateOptions) {
		this.value = options?.value ?? statValue;
		this.statValue = statValue;
		this.count = options?.count;
		this.native = options?.native;
		this.currentRarityModifier = options?.currentRarityModifier;
		this.detectedRarityModifier = options?.detectedRarityModifier;
		this.#item = item;

		Object.defineProperties(this, {
			value: readonlyProperty,
			statValue: readonlyProperty,
			count: readonlyProperty,
			native: readonlyProperty,
			currentRarityModifier: readonlyProperty,
			detectedRarityModifier: readonlyProperty,
		});
	}

	hasStat(name: CountableStatName): boolean {
		return this.#item.stats.countableStats.has(name);
	}

	withRarityModifier(modifier: RarityModifier): StatDecompositionState {
		return new StatDecompositionState(this.#item, this.statValue, {
			value: this.value,
			count: this.count,
			native: this.native,
			currentRarityModifier: modifier,
			detectedRarityModifier: this.detectedRarityModifier,
		});
	}

	withNativeBonus(value: number): StatDecompositionState {
		return new StatDecompositionState(this.#item, this.statValue, {
			value: this.value - value,
			count: this.count,
			native: true,
			currentRarityModifier: this.currentRarityModifier,
			detectedRarityModifier: this.detectedRarityModifier,
		});
	}

	withBonusCount(value: number, count: BonusCount): StatDecompositionState {
		return new StatDecompositionState(this.#item, this.statValue, {
			value: this.value - value,
			count,
			native: this.native,
			currentRarityModifier: this.currentRarityModifier,
			detectedRarityModifier: this.detectedRarityModifier,
		});
	}
}
