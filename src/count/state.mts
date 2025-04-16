import * as external from '#external';
import { type CountableStatName, type Item, ItemType, type Rarity, RarityModifier } from '#item';
import type { BonusCount } from './count.mts';
import * as count from './count.mts';

export type StatCountStateOptions = {
	value?: number | undefined;
	count?: BonusCount | undefined;
	native?: boolean | undefined;
	rarityModifier?: RarityModifier | undefined;
};

export class StatCountState {
	#item: Item;
	#value: number;
	#statValue: number;
	#count: BonusCount;
	#native: boolean;
	#rarityModifier: RarityModifier | undefined;

	get itemType(): ItemType {
		return this.#item.type;
	}

	get rarity(): Rarity {
		return this.#item.stats.rarity + (this.#rarityModifier ?? RarityModifier.Regular);
	}

	get rarityModifier(): RarityModifier | undefined {
		return this.#rarityModifier;
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

	get value(): number {
		return this.#value;
	}

	get statValue(): number {
		return this.#statValue;
	}

	get count(): BonusCount {
		return this.#count;
	}

	get native(): boolean {
		return this.#native;
	}

	constructor(item: Item, statValue: number, options?: StatCountStateOptions) {
		this.#item = item;
		this.#value = options?.value ?? statValue;
		this.#statValue = statValue;
		this.#count = options?.count ?? count.int(0);
		this.#native = options?.native ?? false;
		this.#rarityModifier = options?.rarityModifier;
	}

	hasStat(name: CountableStatName): boolean {
		return this.#item.stats.countableStats.has(name);
	}

	withRarityModifier(modifier: RarityModifier): StatCountState {
		return new StatCountState(this.#item, this.#statValue, { rarityModifier: modifier });
	}

	withNativeBonus(value: number): StatCountState {
		return new StatCountState(this.#item, this.#statValue, {
			value: this.#value - value,
			native: true,
		});
	}

	withBonusCount(value: number, count: BonusCount): StatCountState {
		return new StatCountState(this.#item, this.#statValue, {
			value: this.#value - value,
			count,
		});
	}
}
