import { type CountableStatName, type Item, ItemType, RarityModifier } from '#item';
import * as log from '#log';
import { armor, armorDest, armorDestRed } from './count/armor.mts';
import { agility, baseAttrs, intelligence, strength } from './count/attrs.mts';
import type { BonusCount } from './count/count.mts';
import type { BonusCounter } from './count/counter.mts';
import * as counter from './count/counter.mts';
import { crit, critPower, critPowerRed, critRed } from './count/crit.mts';
import { block, evade, evadeRed, pierceBlock } from './count/evasion.mts';
import { hp, hpBonus, hpRegen, hpRegenEnemyRed, hpRegenSelfRed } from './count/hp.mts';
import {
	energy,
	energyDest,
	energyDestChance,
	mana,
	manaDest,
	manaDestChance,
	resourcesDestRed,
} from './count/resources.mts';
import { StatCountState } from './count/state.mts';

export {
	type IntegerCount,
	type RangeCount,
	type BonusCount,
	isInt,
	isRange,
} from './count/count.mts';

export type ItemBonuses = {
	readonly rarityModifier: RarityModifier;
	readonly decompositions: ReadonlyMap<CountableStatName, BonusDecomposition | undefined>;
};

export type BonusDecomposition = {
	readonly bonusCount: BonusCount;
	readonly native: boolean;
	readonly rarityDependent: boolean;
};

const counters: Readonly<Record<CountableStatName, BonusCounter>> = Object.freeze({
	armor,
	armorDest,
	armorDestRed,
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
	crit,
	critRed,
	physCritPower: critPower,
	magicCritPower: critPower,
	critPowerRed,
	strength,
	agility,
	intelligence,
	baseAttrs,
	energy,
	energyDest,
	energyDestChance,
	mana,
	manaDest,
	manaDestChance,
	resourcesDestRed,
	hp,
	hpBonus,
	hpRegen,
	hpRegenSelfRed,
	hpRegenEnemyRed,
	evade,
	evadeRed,
	block,
	pierceBlock,
} satisfies Record<CountableStatName, BonusCounter>);

export function countBonuses(item: Item): ItemBonuses | undefined {
	if (!isItemCountable(item)) {
		return undefined;
	}

	const decompositions = new Map<CountableStatName, BonusDecomposition | undefined>();
	// A rarity modifier applies to the entire item and might influence several different stats.
	// There's no way of knowing it until the counter of a stat that might be affected by it runs.
	// However, once it does, we can cache the result because it shouldn't change.
	let rarityModifier: RarityModifier | undefined;

	try {
		log.groupStart(item.name);
		log.debug(item);

		// SAFETY: `counters` is a frozen object with keys of type `CountableStatName`, so it cannot
		// contain keys of other type.
		for (const [statName, statValue] of item.stats.countableStats) {
			try {
				log.groupStart(statName);

				const counter = counters[statName];
				const finalState = counter(
					new StatCountState(item, statValue, { detectedRarityModifier: rarityModifier }),
				);

				if (finalState.value === 0) {
					rarityModifier ??= finalState.currentRarityModifier;
					decompositions.set(statName, {
						bonusCount: finalState.count,
						native: finalState.native,
						rarityDependent: finalState.currentRarityModifier !== undefined,
					});

					log.debug(`stat '${statName}' decomposed:`, decompositions.get(statName));
				} else {
					throw new Error('stat value was not fully decomposed');
				}
			} catch (error) {
				log.error(error);
				decompositions.set(statName, undefined);
			} finally {
				log.groupEnd();
			}
		}
	} finally {
		log.groupEnd();
	}

	return {
		rarityModifier: rarityModifier ?? RarityModifier.Regular,
		decompositions,
	};
}

function isItemCountable(item: Item): boolean {
	return (
		(ItemType.Unknown < item.type && item.type <= ItemType.Shield) ||
		item.type === ItemType.Arrows ||
		item.type === ItemType.Quiver ||
		item.type === ItemType.Bless
	);
}
