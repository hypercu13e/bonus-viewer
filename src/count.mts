import { type CountableStatName, type Item, ItemType, RarityModifier } from '#item';
import * as log from '#log';
import type { BonusCount } from './count/count.mts';
import type { BonusCounter } from './count/counter.mts';
import * as counter from './count/counter.mts';
import { StatCountState } from './count/state.mts';

export {
	type IntegerCount,
	type RangeCount,
	type BonusCount,
	isInt,
	isRange,
} from './count/count.mts';

export type ItemBonuses = Map<CountableStatName, BonusDecomposition | undefined>;

export type BonusDecomposition = {
	readonly count: BonusCount;
	readonly native: boolean;
	readonly rarityModifier: RarityModifier;
};

const counters: Readonly<Record<CountableStatName, BonusCounter>> = Object.freeze({
	armor: counter.unimplemented,
	armorDest: counter.unimplemented,
	armorDestRed: counter.unimplemented,
	physAbs: counter.unimplemented,
	magicAbs: counter.unimplemented,
	absDest: counter.unimplemented,
	fireRes: counter.unimplemented,
	lightRes: counter.unimplemented,
	frostRes: counter.unimplemented,
	poisonRes: counter.unimplemented,
	resDest: counter.unimplemented,
	physDmgMin: counter.unimplemented,
	physDmgMax: counter.unimplemented,
	rangedDmg: counter.unimplemented,
	fireDmg: counter.unimplemented,
	lightDmgMin: counter.unimplemented,
	lightDmgMax: counter.unimplemented,
	frostDmg: counter.unimplemented,
	frostSlow: counter.unimplemented,
	poisonDmg: counter.unimplemented,
	poisonSlow: counter.unimplemented,
	woundDmg: counter.unimplemented,
	woundChance: counter.unimplemented,
	pierce: counter.unimplemented,
	counter: counter.unimplemented,
	speed: counter.unimplemented,
	slow: counter.unimplemented,
	crit: counter.unimplemented,
	critRed: counter.unimplemented,
	physCritPower: counter.unimplemented,
	magicCritPower: counter.unimplemented,
	critPowerRed: counter.unimplemented,
	strength: counter.unimplemented,
	agility: counter.unimplemented,
	intelligence: counter.unimplemented,
	baseAttrs: counter.unimplemented,
	energy: counter.unimplemented,
	energyDest: counter.unimplemented,
	mana: counter.unimplemented,
	manaDest: counter.unimplemented,
	resourcesDestRed: counter.unimplemented,
	hp: counter.unimplemented,
	hpBonus: counter.unimplemented,
	hpRegen: counter.unimplemented,
	hpRegenSelfRed: counter.unimplemented,
	hpRegenEnemyRed: counter.unimplemented,
	evade: counter.unimplemented,
	evadeRed: counter.unimplemented,
	block: counter.unimplemented,
	pierceBlock: counter.unimplemented,
} satisfies Record<CountableStatName, BonusCounter>);

export function countBonuses(item: Item): ItemBonuses | undefined {
	if (!isItemCountable(item)) {
		return undefined;
	}

	const bonuses: ItemBonuses = new Map();

	try {
		// A rarity modifier applies to the entire item and might influence several different stats.
		// There's no way of knowing it until the counter of a stat that might be affected by it
		// runs. However, once it does, we can cache the result because it shouldn't change.
		let rarityModifier: RarityModifier | undefined;

		log.groupStart(item.name);

		// SAFETY: `counters` is a frozen object with keys of type `CountableStatName`, so it cannot
		// contain keys of other type.
		for (const [statName, statValue] of item.stats.countableStats) {
			try {
				log.groupStart(statName);

				const counter = counters[statName];
				const state = new StatCountState(item, statValue, {
					rarityModifier,
				});

				counter(state);

				if (state.value === 0) {
					rarityModifier ??= state.rarityModifier;
					bonuses.set(statName, {
						count: state.count,
						native: state.native,
						rarityModifier: rarityModifier ?? RarityModifier.Regular,
					});
				} else {
					throw new Error('stat value was not fully decomposed');
				}
			} catch (error) {
				log.error(error);
				bonuses.set(statName, undefined);
			} finally {
				log.groupEnd();
			}
		}
	} finally {
		log.groupEnd();
	}

	return bonuses;
}

function isItemCountable(item: Item): boolean {
	return (
		(ItemType.Unknown < item.type && item.type <= ItemType.Shield) ||
		item.type === ItemType.Arrows ||
		item.type === ItemType.Quiver ||
		item.type === ItemType.Bless
	);
}
