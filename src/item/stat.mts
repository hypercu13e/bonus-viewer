export const enum Rarity {
	Common = 0,
	Unique = 1,
	Heroic = 2,
	Upgraded = 2,
	Legendary = 3,
	Artefact = 4,
}

export const enum RarityModifier {
	Decreased = -1,
	Regular = 0,
	Increased = 1,
}

// There's no point in including all 64 possible combinations of character classes, so this contains
// only the most common ones.
export const enum CharClass {
	W = 1 << 0,
	P = 1 << 1,
	B = 1 << 2,
	M = 1 << 3,
	T = 1 << 4,
	H = 1 << 5,
	Wp = CharClass.W | CharClass.P,
	Wb = CharClass.W | CharClass.B,
	Pm = CharClass.P | CharClass.M,
	Pt = CharClass.P | CharClass.T,
	Bh = CharClass.B | CharClass.H,
	Mt = CharClass.M | CharClass.T,
	Th = CharClass.T | CharClass.H,
	Wbh = CharClass.W | CharClass.B | CharClass.H,
	Pmt = CharClass.P | CharClass.M | CharClass.T,
	Bth = CharClass.B | CharClass.T | CharClass.H,
	All = CharClass.W | CharClass.P | CharClass.B | CharClass.M | CharClass.T | CharClass.H,
}

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

export type StatsData = Readonly<Record<string, string | undefined>>;

export function parseStatsData(str: string): StatsData {
	return Object.fromEntries(
		str
			.split(';')
			.filter((stat) => stat !== '')
			.map((stat) => stat.split('=')),
	);
}

export type Stats = {
	readonly rarity: Rarity;
	readonly charClasses: number;
	readonly lvl: number | undefined;
	readonly upgradeLvl: number | undefined;
	readonly loweredLvl: number | undefined;
	readonly armor: number | undefined;
	readonly armorDest: number | undefined;
	readonly armorDestRed: number | undefined;
	readonly physAbs: number | undefined;
	readonly magicAbs: number | undefined;
	readonly absDest: number | undefined;
	readonly fireRes: number | undefined;
	readonly lightRes: number | undefined;
	readonly frostRes: number | undefined;
	readonly poisonRes: number | undefined;
	readonly resDest: number | undefined;
	readonly physDmgMin: number | undefined;
	readonly physDmgMax: number | undefined;
	readonly rangedDmg: number | undefined;
	readonly fireDmg: number | undefined;
	readonly lightDmgMin: number | undefined;
	readonly lightDmgMax: number | undefined;
	readonly frostDmg: number | undefined;
	readonly frostSlow: number | undefined;
	readonly poisonDmg: number | undefined;
	readonly poisonSlow: number | undefined;
	readonly woundDmg: number | undefined;
	readonly woundChance: number | undefined;
	readonly pierce: number | undefined;
	readonly counter: number | undefined;
	readonly speed: number | undefined;
	readonly slow: number | undefined;
	readonly crit: number | undefined;
	readonly critRed: number | undefined;
	readonly physCritPower: number | undefined;
	readonly magicCritPower: number | undefined;
	readonly critPowerRed: number | undefined;
	readonly strength: number | undefined;
	readonly agility: number | undefined;
	readonly intelligence: number | undefined;
	readonly baseAttrs: number | undefined;
	readonly energy: number | undefined;
	readonly energyDest: number | undefined;
	readonly mana: number | undefined;
	readonly manaDest: number | undefined;
	readonly resourcesDestRed: number | undefined;
	readonly hp: number | undefined;
	readonly hpBonus: number | undefined;
	readonly hpRegen: number | undefined;
	readonly hpRegenSelfRed: number | undefined;
	readonly hpRegenEnemyRed: number | undefined;
	readonly evade: number | undefined;
	readonly evadeRed: number | undefined;
	readonly block: number | undefined;
	readonly pierceBlock: number | undefined;
};

export type StatName = keyof Stats;

export type CountableStatName = Exclude<
	StatName,
	'lvl' | 'upgradeLvl' | 'loweredLvl' | 'rarity' | 'charClasses'
>;

export function parseStats(data: StatsData): Stats {
	const rarity = data['rarity'] !== undefined ? parseRarity(data['rarity']) : Rarity.Common;
	const charClasses = data['reqp'] !== undefined ? parseCharClasses(data['reqp']) : CharClass.All;
	let lvl: number | undefined;

	// Level is a crucial stat that must be valid to properly count item bonuses, since counters may
	// assume that the item level is positive. For this reason, there are several assertions in the
	// code below that uphold this assumption.
	try {
		const statValue = data['lvl'];

		if (statValue !== undefined) {
			lvl = parseInteger(statValue);
		}
	} catch (error) {
		throw new StatError('lvl', { cause: error });
	}

	if (lvl !== undefined && lvl < 1) {
		throw new StatError('lvl', 'the item level must be positive');
	}

	const [physDmgMin, physDmgMax] = parseTupleStat('dmg', parseInteger) ?? [];
	const [lightDmgMin, lightDmgMax] = parseTupleStat('light', parseInteger) ?? [];
	const [frostSlow, frostDmg] = parseTupleStat('frost', parseInteger) ?? [];
	const [poisonSlow, poisonDmg] = parseTupleStat('poison', parseInteger) ?? [];
	const [woundChance, woundDmg] = parseTupleStat('wound', parseInteger) ?? [];
	const stats: Stats = {
		rarity,
		charClasses,
		lvl: parseNumericStat('lvl', parseInteger),
		upgradeLvl: parseNumericStat('enhancement_upgrade_lvl', parseInteger),
		loweredLvl: parseNumericStat('lowreq', parseInteger),
		armor: parseNumericStat('ac', parseInteger),
		armorDest: parseNumericStat('acdmg', parseInteger),
		armorDestRed: parseNumericStat('resacdmg', parseInteger),
		physAbs: parseNumericStat('absorb', parseInteger),
		magicAbs: parseNumericStat('absorbm', parseInteger),
		absDest: parseNumericStat('abdest', parseInteger),
		fireRes: parseNumericStat('resfire', parseInteger),
		lightRes: parseNumericStat('reslight', parseInteger),
		frostRes: parseNumericStat('resfrost', parseInteger),
		poisonRes: parseNumericStat('act', parseInteger),
		resDest: parseNumericStat('resdmg', parseInteger),
		physDmgMin,
		physDmgMax,
		rangedDmg: parseNumericStat('pdmg', parseInteger),
		fireDmg: parseNumericStat('fire', parseInteger),
		lightDmgMin,
		lightDmgMax,
		frostDmg,
		frostSlow,
		poisonDmg,
		poisonSlow,
		woundDmg,
		woundChance,
		pierce: parseNumericStat('pierce', parseInteger),
		counter: parseNumericStat('contra', parseInteger),
		// The game server returns these two as integers, not floats.
		speed: parseNumericStat('sa', parseInteger),
		slow: parseNumericStat('slow', parseInteger),
		crit: parseNumericStat('crit', parseInteger),
		critRed: parseNumericStat('lowcrit', parseInteger),
		physCritPower: parseNumericStat('critval', parseInteger),
		magicCritPower: parseNumericStat('critmval', parseInteger),
		critPowerRed: parseNumericStat('lowcritallval', parseInteger),
		strength: parseNumericStat('ds', parseInteger),
		agility: parseNumericStat('dz', parseInteger),
		intelligence: parseNumericStat('di', parseInteger),
		baseAttrs: parseNumericStat('da', parseInteger),
		energy: parseNumericStat('energybon', parseInteger),
		energyDest: parseNumericStat('endest', parseInteger),
		mana: parseNumericStat('manabon', parseInteger),
		manaDest: parseNumericStat('manadest', parseInteger),
		resourcesDestRed: parseNumericStat('resmanaendest', parseInteger),
		hp: parseNumericStat('hp', parseInteger),
		hpBonus: parseNumericStat('hpbon', parseFloat),
		hpRegen: parseNumericStat('heal', parseInteger),
		hpRegenSelfRed: parseNumericStat('adest', parseInteger),
		hpRegenEnemyRed: parseNumericStat('lowheal2turns', parseInteger),
		evade: parseNumericStat('evade', parseInteger),
		evadeRed: parseNumericStat('lowevade', parseInteger),
		block: parseNumericStat('blok', parseInteger),
		pierceBlock: parseNumericStat('pierceb', parseInteger),
	};

	if (stats.upgradeLvl !== undefined && stats.upgradeLvl < 0) {
		throw new StatError('upgradeLvl', 'an upgrade level must be non-negative');
	}

	if (stats.loweredLvl !== undefined && stats.loweredLvl < 0) {
		throw new StatError('loweredLvl', 'the level modifier must be non-negative');
	}

	if (
		stats.lvl !== undefined &&
		stats.loweredLvl !== undefined &&
		stats.lvl - stats.loweredLvl <= 0
	) {
		throw new StatError(
			'loweredLvl',
			'the level modifier cannot reduce the item level to a non-positive number',
		);
	}

	return stats;

	// =========================================================================================

	type StatValueParser = (statValue: string) => number;

	function parseNumericStat(statName: string, parse: StatValueParser): number | undefined {
		const statValue = data[statName];

		if (statValue === undefined) {
			return undefined;
		}

		try {
			return parse(statValue);
		} catch (error) {
			console.warn(`[Bonus Viewer] Couldn't parse the value of stat '${statName}'.`, error);

			return undefined;
		}
	}

	function parseTupleStat(
		statName: string,
		parse: StatValueParser,
	): [number, number] | undefined {
		const statValue = data[statName];

		if (statValue === undefined) {
			return undefined;
		}

		const [firstValue, secondValue] = statValue.split(',');

		if (firstValue === undefined || secondValue === undefined) {
			console.warn(
				`[Bonus Viewer] Couldn't parse the value of stat '${statName}'. '${statValue}' ` +
					'does not contain two comma-separated numbers',
			);

			return undefined;
		}

		try {
			return [parse(firstValue), parse(secondValue)];
		} catch (error) {
			console.warn(`[Bonus Viewer] Couldn't parse the value of stat '${statName}'.`, error);

			return undefined;
		}
	}
}

function parseRarity(statValue: string): Rarity {
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

function parseCharClasses(statValue: string): number {
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

	// If, for some reason, we received a string but none classes were recognized, then assume that
	// an item can be used by any character class.
	return charClasses > 0 ? charClasses : CharClass.All;
}

function parseInteger(statValue: string): number {
	const value = Number.parseInt(statValue, 10);

	if (Number.isSafeInteger(value)) {
		return Object.is(value, -0) ? 0 : value;
	} else {
		throw RangeError(`${value} is not a safe integer`);
	}
}

function parseFloat(statValue: string): number {
	const value = Number.parseFloat(statValue);

	if (Number.isFinite(value)) {
		return Object.is(value, -0) ? 0 : value;
	} else {
		throw RangeError(`${value} is not a valid floating-point number`);
	}
}
