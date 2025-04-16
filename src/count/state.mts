import * as external from '#external';
import { type CountableStatName, type Item, ItemType, type Rarity, RarityModifier } from '#item';
import type { BonusCount } from './count.mts';
import * as count from './count.mts';

export class StatCountState {
	#item: Item;
	#statName: CountableStatName;
	#value: number;
	#count: BonusCount = count.int(0);
	#native: boolean = false;
	#rarityModifier: RarityModifier | undefined;

	get itemType(): ItemType {
		return this.#item.type;
	}

	get rarity(): Rarity {
		return this.#item.stats.rarity + (this.#rarityModifier ?? RarityModifier.Regular);
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
		// SAFETY: Validated by the constructor.
		return this.#item.stats[this.#statName]!;
	}

	constructor(item: Item, statName: CountableStatName) {
		const statValue = item.stats[statName];

		if (statValue === undefined) {
			throw new Error('Cannot count a stat that has no value');
		}

		this.#item = item;
		this.#statName = statName;
		this.#value = statValue;
	}

	hasStat(name: CountableStatName): boolean {
		return this.#item.stats[name] !== undefined;
	}

	withRarityModifier(modifier: RarityModifier): StatCountState {
		const state = new StatCountState(this.#item, this.#statName);
		state.#rarityModifier = modifier;

		return state;
	}

	withNativeBonus(value: number): StatCountState {
		const state = new StatCountState(this.#item, this.#statName);
		state.#native = true;
		state.#value = this.#value - value;

		return state;
	}

	withBonusCount(count: BonusCount): StatCountState {
		const state = new StatCountState(this.#item, this.#statName);
		state.#count = count;

		return state;
	}
}
