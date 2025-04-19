import * as external from '#external';
import {
	type CountableStatName,
	type Item,
	ItemType,
	type MagicResType,
	type Rarity,
	RarityModifier,
} from '#item';
import { readonlyProperty } from '#utils';
import type { BonusCount } from './count.mts';

export type StatDecompositionStateOptions = {
	value?: number | undefined;
	count?: BonusCount | undefined;
	native?: boolean | undefined;
	nativeMagicResType?: MagicResType | undefined;
	currentRarityModifier?: RarityModifier | undefined;
	detectedRarityModifier?: RarityModifier | undefined;
};

export class StatDecompositionState {
	readonly value: number;
	readonly statValue: number;
	readonly count: BonusCount | undefined;
	readonly native: boolean | undefined;
	readonly nativeMagicResType: MagicResType | undefined;
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
		} else if (this.#item.type === ItemType.Bless) {
			return external.getCharLvl();
		} else {
			return 1;
		}
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
		this.nativeMagicResType = options?.nativeMagicResType;
		this.currentRarityModifier = options?.currentRarityModifier;
		this.detectedRarityModifier = options?.detectedRarityModifier;
		this.#item = item;

		Object.defineProperties(this, {
			value: readonlyProperty,
			statValue: readonlyProperty,
			count: readonlyProperty,
			native: readonlyProperty,
			nativeMagicResType: readonlyProperty,
			currentRarityModifier: readonlyProperty,
			detectedRarityModifier: readonlyProperty,
		});
	}

	hasStat(name: CountableStatName): boolean {
		return this.#item.stats.countableStats.has(name);
	}

	getStatValue(name: CountableStatName): number | undefined {
		return this.#item.stats.countableStats.get(name);
	}

	with(options?: StatDecompositionStateOptions): StatDecompositionState {
		return new StatDecompositionState(this.#item, this.statValue, {
			value: options?.value ?? this.value,
			count: options?.count ?? this.count,
			native: options?.native ?? this.native,
			nativeMagicResType: options?.nativeMagicResType ?? this.nativeMagicResType,
			currentRarityModifier: options?.currentRarityModifier ?? this.currentRarityModifier,
			detectedRarityModifier: options?.detectedRarityModifier ?? this.detectedRarityModifier,
		});
	}
}
