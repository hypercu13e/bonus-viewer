import {
	type CountableStatName,
	type Item,
	ItemType,
	type MagicResType,
	RarityModifier,
} from '#item';
import { readonlyProperty } from '#utils';
import { absDest, magicAbs, physAbs } from './decompose/abs.mts';
import { armor, armorDest, armorDestRed } from './decompose/armor.mts';
import {
	counterattack,
	fireDmg,
	frostDmg,
	frostSlow,
	lightDmgMax,
	lightDmgMin,
	physDmgMax,
	physDmgMin,
	pierce,
	poisonDmg,
	poisonSlow,
	rangedDmg,
	slow,
	speed,
	woundChance,
	woundDmg,
} from './decompose/attack.mts';
import { agility, baseAttrs, intelligence, strength } from './decompose/attrs.mts';
import { type BonusCount, IntegerCount } from './decompose/count.mts';
import type { BonusCounter } from './decompose/counter.mts';
import { crit, critPower, critPowerRed, critRed } from './decompose/crit.mts';
import { block, evade, evadeRed, pierceBlock } from './decompose/evasion.mts';
import { hp, hpBonus, hpRegen, hpRegenEnemyRed, hpRegenSelfRed } from './decompose/hp.mts';
import { fireRes, frostRes, lightRes, poisonRes, resDest } from './decompose/res.mts';
import {
	energy,
	energyDest,
	energyDestChance,
	mana,
	manaDest,
	manaDestChance,
	resourcesDestRed,
} from './decompose/resources.mts';
import { StatDecompositionState } from './decompose/state.mts';

const counters: Readonly<Record<CountableStatName, BonusCounter>> = Object.freeze({
	armor,
	armorDest,
	armorDestRed,
	physAbs,
	magicAbs,
	absDest,
	fireRes,
	lightRes,
	frostRes,
	poisonRes,
	resDest,
	physDmgMin,
	physDmgMax,
	rangedDmg,
	fireDmg,
	lightDmgMin,
	lightDmgMax,
	frostDmg,
	frostSlow,
	poisonDmg,
	poisonSlow,
	woundDmg,
	woundChance,
	pierce,
	counterattack,
	speed,
	slow,
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

export {
	IntegerCount,
	RangeCount,
	type BonusCount,
} from './decompose/count.mts';

export type DecomposedItem = {
	readonly rarityModifier: RarityModifier;
	readonly results: Map<CountableStatName, DecompositionResult>;
};

export type DecomposedStat = {
	readonly count: BonusCount;
	readonly native: boolean;
	readonly rarityDependent: boolean;
};

export type DecompositionResult = DecompositionSuccess | DecompositionFailure;

export class DecompositionSuccess {
	readonly success = true;
	readonly decomposedStat: DecomposedStat;

	constructor(decomposedStat: DecomposedStat) {
		this.decomposedStat = decomposedStat;

		Object.defineProperties(this, {
			success: readonlyProperty,
			decomposedStat: readonlyProperty,
		});
	}
}

export class DecompositionFailure {
	readonly success = false;
	readonly error: DecompositionError;

	constructor(error: DecompositionError) {
		this.error = error;

		Object.defineProperties(this, {
			success: readonlyProperty,
			error: readonlyProperty,
		});
	}
}

export class DecompositionError extends Error {
	override name = DecompositionError.name;
}

export function decomposeItem(item: Item): DecomposedItem | undefined {
	if (!isItemDecomposable(item)) {
		return undefined;
	}

	const results = new Map<CountableStatName, DecompositionResult>();
	// A rarity modifier applies to the entire item and might influence several different stats.
	// There's no way of knowing it until the counter of a stat that might be affected by it runs.
	// However, once it does, we can cache the result because it shouldn't change.
	let rarityModifier: RarityModifier | undefined;
	let nativeMagicResType: MagicResType | undefined;

	for (const [statName, statValue] of item.stats.countableStats) {
		const counter = counters[statName];
		const initialState = new StatDecompositionState(item, statValue, {
			nativeMagicResType,
			detectedRarityModifier: rarityModifier,
		});
		let finalState: StatDecompositionState | undefined;
		let result: DecompositionResult;

		try {
			finalState = counter(initialState);
		} catch (error) {
			result = new DecompositionFailure(
				new DecompositionError('bonus counter failed', { cause: error }),
			);
		}

		if (finalState !== undefined) {
			if (finalState.value === 0) {
				rarityModifier ??= finalState.currentRarityModifier;
				nativeMagicResType ??= finalState.nativeMagicResType;
				result = new DecompositionSuccess(
					Object.freeze({
						count: finalState.count ?? new IntegerCount(0),
						native: finalState.native ?? false,
						rarityDependent: finalState.currentRarityModifier !== undefined,
					}),
				);
			} else {
				result = new DecompositionFailure(
					new DecompositionError('stat value did not fully decompose'),
				);
			}
		}

		// SAFETY: If decomposition failed, then `result` was set by the `catch` statement above. On
		// the other hand, if it succeeded, then `finalState` must have been set, so `result` would
		// be set by the preceding `if` statement.
		results.set(statName, result!);
	}

	return Object.freeze({
		rarityModifier: rarityModifier ?? RarityModifier.Regular,
		results,
	});
}

function isItemDecomposable(item: Item): boolean {
	return (
		(ItemType.Unknown < item.type && item.type <= ItemType.Shield) ||
		item.type === ItemType.Arrows ||
		item.type === ItemType.Quiver ||
		item.type === ItemType.Bless
	);
}
