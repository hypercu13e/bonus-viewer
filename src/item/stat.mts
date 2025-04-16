import * as log from '#log';
import type { EnumMemberType, Writable } from '#utils';

export type Rarity = number;
export const Rarity = Object.freeze({
	Common: 0,
	Unique: 1,
	Heroic: 2,
	Upgraded: 2,
	Legendary: 3,
	Artefact: 4,
});

export type RarityModifier = EnumMemberType<typeof RarityModifier>;
export const RarityModifier = Object.freeze({
	Decreased: -1,
	Regular: 0,
	Increased: 1,
});

export type CharClass = number;
// There's no point in including all 64 possible combinations of character classes, so this contains
// only the most common ones.
export const CharClass = {
	W: 1 << 0,
	P: 1 << 1,
	B: 1 << 2,
	M: 1 << 3,
	T: 1 << 4,
	H: 1 << 5,
	// Properties in object literals cannot refer to self, so the following ones are initialized in
	// subsequent statements. They are defined here to satisfy TS. The type assertion is required in
	// each property to widen its type because otherwise `as const` infers the literal `0` type.
	Wp: 0 as number,
	Wb: 0 as number,
	Pb: 0 as number,
	Pm: 0 as number,
	Pt: 0 as number,
	Bt: 0 as number,
	Bh: 0 as number,
	Mt: 0 as number,
	Th: 0 as number,
	Wpb: 0 as number,
	Wbh: 0 as number,
	Pmt: 0 as number,
	Bth: 0 as number,
	Wpbh: 0 as number,
	All: 0 as number,
} as const;

(CharClass as Writable<typeof CharClass>).Wp = CharClass.W | CharClass.P;
(CharClass as Writable<typeof CharClass>).Wb = CharClass.W | CharClass.B;
(CharClass as Writable<typeof CharClass>).Pb = CharClass.P | CharClass.B;
(CharClass as Writable<typeof CharClass>).Pm = CharClass.P | CharClass.M;
(CharClass as Writable<typeof CharClass>).Pt = CharClass.P | CharClass.T;
(CharClass as Writable<typeof CharClass>).Bt = CharClass.B | CharClass.T;
(CharClass as Writable<typeof CharClass>).Bh = CharClass.B | CharClass.H;
(CharClass as Writable<typeof CharClass>).Mt = CharClass.M | CharClass.T;
(CharClass as Writable<typeof CharClass>).Th = CharClass.T | CharClass.H;
(CharClass as Writable<typeof CharClass>).Wpb = CharClass.W | CharClass.P | CharClass.B;
(CharClass as Writable<typeof CharClass>).Wbh = CharClass.W | CharClass.B | CharClass.H;
(CharClass as Writable<typeof CharClass>).Pmt = CharClass.P | CharClass.M | CharClass.T;
(CharClass as Writable<typeof CharClass>).Bth = CharClass.B | CharClass.T | CharClass.H;
(CharClass as Writable<typeof CharClass>).Wpbh =
	CharClass.W | CharClass.P | CharClass.B | CharClass.H;
(CharClass as Writable<typeof CharClass>).All =
	CharClass.W | CharClass.P | CharClass.B | CharClass.M | CharClass.T | CharClass.H;

Object.freeze(CharClass);

export class StatError extends Error {
	override name = 'StatError';

	constructor(statName: StatName, options?: ErrorOptions);
	constructor(statName: StatName, message: string, options?: ErrorOptions);
	constructor(
		statName: StatName,
		messageOrOptions?: string | ErrorOptions,
		options?: ErrorOptions,
	) {
		let errorMessage = `Stat '${statName}' has an invalid value`;
		let errorOptions: ErrorOptions | undefined;

		if (typeof messageOrOptions === 'string') {
			errorMessage += `: ${messageOrOptions}`;
			errorOptions = options;
		} else {
			errorOptions = messageOrOptions;
		}

		super(errorMessage, errorOptions);
	}
}

export type StatsData = Map<string, string | undefined>;

export function parseStatsData(str: string): StatsData {
	const statsData: StatsData = new Map();

	for (const stat of str.split(';')) {
		const [name = '', value] = stat.split('=');

		if (name.length > 0) {
			statsData.set(name, value);
		}
	}

	return statsData;
}

export type CountableStatName =
	| 'armor'
	| 'armorDest'
	| 'armorDestRed'
	| 'physAbs'
	| 'magicAbs'
	| 'absDest'
	| 'fireRes'
	| 'lightRes'
	| 'frostRes'
	| 'poisonRes'
	| 'resDest'
	| 'physDmgMin'
	| 'physDmgMax'
	| 'rangedDmg'
	| 'fireDmg'
	| 'lightDmgMin'
	| 'lightDmgMax'
	| 'frostDmg'
	| 'frostSlow'
	| 'poisonDmg'
	| 'poisonSlow'
	| 'woundDmg'
	| 'woundChance'
	| 'pierce'
	| 'counter'
	| 'speed'
	| 'slow'
	| 'crit'
	| 'critRed'
	| 'physCritPower'
	| 'magicCritPower'
	| 'critPowerRed'
	| 'strength'
	| 'agility'
	| 'intelligence'
	| 'baseAttrs'
	| 'energy'
	| 'energyDest'
	| 'mana'
	| 'manaDest'
	| 'resourcesDestRed'
	| 'hp'
	| 'hpBonus'
	| 'hpRegen'
	| 'hpRegenSelfRed'
	| 'hpRegenEnemyRed'
	| 'evade'
	| 'evadeRed'
	| 'block'
	| 'pierceBlock';
export type StatName = Exclude<keyof Stats, 'countableStats'> | CountableStatName;

export type Stats = {
	readonly rarity: Rarity;
	readonly charClasses: number;
	readonly lvl: number | undefined;
	readonly upgradeLvl: number | undefined;
	readonly loweredLvl: number | undefined;
	readonly countableStats: CountableStats;
};
export type CountableStats = ReadonlyMap<CountableStatName, number>;

type CountableStatParser = (
	countableStats: Map<CountableStatName, number>,
	statValue: string,
) => undefined;
type NumberParser = (statValue: string) => number;

const countableStatParsers: Readonly<Record<string, CountableStatParser>> = Object.freeze({
	ac: numericStat('armor', parseInteger),
	acdmg: numericStat('armorDest', parseInteger),
	resacdmg: numericStat('armorDestRed', parseInteger),
	absorb: numericStat('physAbs', parseInteger),
	absorbm: numericStat('magicAbs', parseInteger),
	abdest: numericStat('absDest', parseInteger),
	resfire: numericStat('fireRes', parseInteger),
	reslight: numericStat('lightRes', parseInteger),
	resfrost: numericStat('frostRes', parseInteger),
	act: numericStat('poisonRes', parseInteger),
	resdmg: numericStat('resDest', parseInteger),
	dmg: tupleStat('physDmgMin', 'physDmgMax', parseInteger),
	pdmg: numericStat('rangedDmg', parseInteger),
	fire: numericStat('fireDmg', parseInteger),
	light: tupleStat('lightDmgMin', 'lightDmgMax', parseInteger),
	frost: tupleStat('frostSlow', 'frostDmg', parseInteger),
	poison: tupleStat('poisonSlow', 'poisonDmg', parseInteger),
	wound: tupleStat('woundChance', 'woundDmg', parseInteger),
	pierce: numericStat('pierce', parseInteger),
	contra: numericStat('counter', parseInteger),
	// The game server returns these two as integers, not floats.
	sa: numericStat('speed', parseInteger),
	slow: numericStat('slow', parseInteger),
	crit: numericStat('crit', parseInteger),
	lowcrit: numericStat('critRed', parseInteger),
	critval: numericStat('physCritPower', parseInteger),
	critmval: numericStat('magicCritPower', parseInteger),
	lowcritallval: numericStat('critPowerRed', parseInteger),
	ds: numericStat('strength', parseInteger),
	dz: numericStat('agility', parseInteger),
	di: numericStat('intelligence', parseInteger),
	da: numericStat('baseAttrs', parseInteger),
	energybon: numericStat('energy', parseInteger),
	endest: numericStat('energyDest', parseInteger),
	manabon: numericStat('mana', parseInteger),
	manadest: numericStat('manaDest', parseInteger),
	resmanaendest: numericStat('resourcesDestRed', parseInteger),
	hp: numericStat('hp', parseInteger),
	hpbon: numericStat('hpBonus', parseFloatingPoint),
	heal: numericStat('hpRegen', parseInteger),
	adest: numericStat('hpRegenSelfRed', parseInteger),
	lowheal2turns: numericStat('hpRegenEnemyRed', parseInteger),
	evade: numericStat('evade', parseInteger),
	lowevade: numericStat('evadeRed', parseInteger),
	blok: numericStat('block', parseInteger),
	pierceb: numericStat('pierceBlock', parseInteger),
} satisfies Record<string, CountableStatParser>);

export function parseStats(data: StatsData): Stats {
	const rarity = parseRarity(data);
	const charClasses = parseCharClasses(data);
	const lvl = parseLvl(data);
	const upgradeLvl = parseUpgradeLvl(data);
	const loweredLvl = parseLoweredLvl(data);
	const countableStats = new Map<CountableStatName, number>();

	if (lvl !== undefined && loweredLvl !== undefined && lvl - loweredLvl <= 0) {
		throw new StatError(
			'loweredLvl',
			'the level modifier cannot reduce the item level to a non-positive number',
		);
	}

	// Remove stats that we already consumed so that we don't unnecessarily iterate over them.
	data.delete('rarity');
	data.delete('reqp');
	data.delete('lvl');
	data.delete('enhancement_upgrade_lvl');
	data.delete('lowreq');

	for (const [statName, statValue] of data) {
		if (statValue !== undefined) {
			countableStatParsers[statName]?.(countableStats, statValue);
		}
	}

	return {
		rarity,
		charClasses,
		lvl,
		upgradeLvl,
		loweredLvl,
		countableStats,
	};
}

function parseRarity(statsData: StatsData): Rarity {
	const statValue = statsData.get('rarity');

	switch (statValue) {
		case 'common':
			return Rarity.Common;
		case 'unique':
			return Rarity.Unique;
		case 'heroic':
			return Rarity.Heroic;
		case 'upgraded':
			return Rarity.Upgraded;
		case 'legendary':
			return Rarity.Legendary;
		case 'artefact':
			return Rarity.Artefact;
		default:
			return Rarity.Common;
	}
}

function parseCharClasses(statsData: StatsData): number {
	const statValue = statsData.get('reqp') ?? '';
	let charClasses = 0;

	for (const classAbbr of statValue) {
		switch (classAbbr) {
			case 'w':
				charClasses |= CharClass.W;
				break;
			case 'p':
				charClasses |= CharClass.P;
				break;
			case 'b':
				charClasses |= CharClass.B;
				break;
			case 'm':
				charClasses |= CharClass.M;
				break;
			case 't':
				charClasses |= CharClass.T;
				break;
			case 'h':
				charClasses |= CharClass.H;
				break;
		}
	}

	// If none classes were recognized, then assume that an item can be used by any character class.
	return charClasses > 0 ? charClasses : CharClass.All;
}

function parseLvl(statsData: StatsData): number | undefined {
	const statValue = statsData.get('lvl');
	let lvl: number;

	if (statValue === undefined) {
		return undefined;
	}

	try {
		lvl = parseInteger(statValue);
	} catch (error) {
		throw new StatError('lvl', { cause: error });
	}

	if (lvl !== undefined && lvl < 1) {
		throw new StatError('lvl', 'the item level must be positive');
	}

	return lvl;
}

function parseUpgradeLvl(statsData: StatsData): number | undefined {
	const statValue = statsData.get('enhancement_upgrade_lvl');
	let upgradeLvl: number;

	if (statValue === undefined) {
		return undefined;
	}

	try {
		upgradeLvl = parseInteger(statValue);
	} catch (error) {
		throw new StatError('lvl', { cause: error });
	}

	if (upgradeLvl !== undefined && upgradeLvl < 0) {
		throw new StatError('upgradeLvl', 'an upgrade level must be non-negative');
	}

	return upgradeLvl;
}

function parseLoweredLvl(statsData: StatsData): number | undefined {
	const statValue = statsData.get('lowreq');
	let loweredLvl: number;

	if (statValue === undefined) {
		return undefined;
	}

	try {
		loweredLvl = parseInteger(statValue);
	} catch (error) {
		throw new StatError('lvl', { cause: error });
	}

	if (loweredLvl !== undefined && loweredLvl < 0) {
		throw new StatError('loweredLvl', 'the level modifier must be non-negative');
	}

	return loweredLvl;
}

function numericStat(statName: CountableStatName, parseNumber: NumberParser): CountableStatParser {
	return function parseNumericStat(countableStats, statValue): undefined {
		let parsedStatValue: number;

		try {
			parsedStatValue = parseNumber(statValue);
		} catch (error) {
			log.warn(`[Bonus Viewer] Couldn't parse the value for stat '${statName}'.`, error);

			return undefined;
		}

		countableStats.set(statName, parsedStatValue);
	};
}

function tupleStat(
	firstStatName: CountableStatName,
	secondStatName: CountableStatName,
	parseNumber: NumberParser,
): CountableStatParser {
	return function countTupleStat(countableStats, statValue): undefined {
		const [firstStatValue, secondStatValue] = statValue.split(',');

		if (firstStatValue === undefined || secondStatValue === undefined) {
			log.warn(
				`[Bonus Viewer] Couldn't parse the value for stats '${firstStatName}' and '${secondStatName}'. '${statValue.replaceAll("'", "\\'")}' does not contain two comma-separated numbers`,
			);

			return undefined;
		}

		let parsedFirstStatValue: number;
		let parsedSecondStatValue: number;

		try {
			parsedFirstStatValue = parseNumber(firstStatValue);
		} catch (error) {
			log.warn(`[Bonus Viewer] Couldn't parse the value for stat '${firstStatName}'.`, error);

			return undefined;
		}

		try {
			parsedSecondStatValue = parseNumber(secondStatValue);
		} catch (error) {
			log.warn(
				`[Bonus Viewer] Couldn't parse the value for stat '${secondStatName}'.`,
				error,
			);

			return undefined;
		}

		countableStats.set(firstStatName, parsedFirstStatValue);
		countableStats.set(secondStatName, parsedSecondStatValue);
	};
}

function parseInteger(statValue: string): number {
	const value = Number.parseInt(statValue, 10);

	if (Number.isSafeInteger(value)) {
		return Object.is(value, -0) ? 0 : value;
	} else {
		throw RangeError(`${value} is not a safe integer`);
	}
}

function parseFloatingPoint(statValue: string): number {
	const value = Number.parseFloat(statValue);

	if (Number.isFinite(value)) {
		return Object.is(value, -0) ? 0 : value;
	} else {
		throw RangeError(`${value} is not a valid floating-point number`);
	}
}
