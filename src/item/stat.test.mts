import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
	CharClass,
	Rarity,
	StatError,
	type StatName,
	type StatsData,
	parseStats,
	parseStatsData,
} from './stat.mts';

describe('StatError', () => {
	test('.name is overridden', () => {
		const error = new StatError('armor');

		assert.equal(error.name, 'StatError');
	});

	test('.message includes information about the stat', () => {
		const error = new StatError('armor');

		assert.equal(error.message, "Stat 'armor' has an invalid value");
	});

	test('.message has the provided error message appended', () => {
		const error = new StatError('armor', '0 is not allowed');

		assert.equal(error.message, "Stat 'armor' has an invalid value: 0 is not allowed");
	});

	test('.cause is supported', () => {
		const error = new StatError('armor', { cause: 0 });

		assert.equal(error.cause, 0);
	});
});

describe('parseStatsData()', () => {
	test('parses a stat with a value', () => {
		const data = parseStatsData('rarity=common');

		assert.deepEqual(data, { rarity: 'common' } satisfies StatsData);
	});

	test('parses a stat with an empty value', () => {
		const data = parseStatsData('foo=');

		assert.deepEqual(data, { foo: '' } satisfies StatsData);
	});

	test('parses a stat without a value', () => {
		const data = parseStatsData('cursed');

		assert.deepEqual(data, { cursed: undefined } satisfies StatsData);
	});

	test('parses multiple stats', () => {
		const data = parseStatsData('cursed;lvl=1;rarity=common;soulbound');

		assert.deepEqual(data, {
			cursed: undefined,
			lvl: '1',
			rarity: 'common',
			soulbound: undefined,
		} satisfies StatsData);
	});

	test('returns an empty object when given an empty string', () => {
		const data = parseStatsData('');

		assert.deepEqual(data, {} satisfies StatsData);
	});
});

describe('parseStats()', () => {
	describe('rarity', () => {
		const cases = [
			['common', Rarity.Common],
			['unique', Rarity.Unique],
			['heroic', Rarity.Heroic],
			['upgraded', Rarity.Upgraded],
			['legendary', Rarity.Legendary],
			['artefact', Rarity.Artefact],
		] as const satisfies ReadonlyArray<readonly [string, Rarity]>;

		for (const [statValue, rarity] of cases) {
			test(`parses '${statValue}' rarity`, () => {
				const stats = parseStats({ rarity: statValue });

				assert.equal(stats.rarity, rarity);
			});
		}

		test('coerces unknown rarity to common', () => {
			const stats = parseStats({ rarity: 'epic' });

			assert.equal(stats.rarity, Rarity.Common);
		});

		test('defaults to common', () => {
			const stats = parseStats({});

			assert.equal(stats.rarity, Rarity.Common);
		});
	});

	describe('charClasses', () => {
		const cases = [
			['w', CharClass.W],
			['p', CharClass.P],
			['b', CharClass.B],
			['m', CharClass.M],
			['t', CharClass.T],
			['h', CharClass.H],
			['wp', CharClass.Wp],
			['mp', CharClass.Pm],
			['bhw', CharClass.Wbh],
			['mtp', CharClass.Pmt],
			['bwmpht', CharClass.All],
			['hm', CharClass.M | CharClass.H],
			['pbhw', CharClass.W | CharClass.P | CharClass.B | CharClass.H],
		] as const satisfies ReadonlyArray<readonly [string, CharClass]>;

		for (const [statValue, charClasses] of cases) {
			test(`parses '${statValue}' character classes`, () => {
				const stats = parseStats({ reqp: statValue });

				assert.equal(stats.charClasses, charClasses);
			});
		}

		test('parses an empty string as no classes requirement', () => {
			const stats = parseStats({ reqp: '' });

			assert.equal(stats.charClasses, CharClass.All);
		});

		test('defaults to all', () => {
			const stats = parseStats({});

			assert.equal(stats.charClasses, CharClass.All);
		});
	});

	testLvlStat('lvl', 'lvl');
	testLvlStat('upgradeLvl', 'enhancement_upgrade_lvl');
	testLvlStat('loweredLvl', 'lowreq');

	test('throws when the level modifier makes the item level non-positive', () => {
		assert.throws(
			() => parseStats({ lvl: '2', lowreq: '2' }),
			StatError,
			'Level reduced to 0 was incorrectly parsed successfully',
		);
		assert.throws(
			() => parseStats({ lvl: '2', lowreq: '3' }),
			StatError,
			'Level reduced to -1 was incorrectly parsed successfully',
		);
	});

	testIntegerStat('armor', 'ac');
	testIntegerStat('armorDest', 'acdmg');
	testIntegerStat('armorDestRed', 'resacdmg');
	testIntegerStat('physAbs', 'absorb');
	testIntegerStat('magicAbs', 'absorbm');
	testIntegerStat('absDest', 'abdest');
	testIntegerStat('fireRes', 'resfire');
	testIntegerStat('lightRes', 'reslight');
	testIntegerStat('frostRes', 'resfrost');
	testIntegerStat('poisonRes', 'act');
	testIntegerStat('resDest', 'resdmg');
	testTupleStat('physDmgMin', 'physDmgMax', 'dmg');
	testIntegerStat('rangedDmg', 'pdmg');
	testIntegerStat('fireDmg', 'fire');
	testTupleStat('lightDmgMin', 'lightDmgMax', 'light');
	testTupleStat('frostSlow', 'frostDmg', 'frost');
	testTupleStat('poisonSlow', 'poisonDmg', 'poison');
	testTupleStat('woundChance', 'woundDmg', 'wound');
	testIntegerStat('pierce', 'pierce');
	testIntegerStat('counter', 'contra');
	testIntegerStat('speed', 'sa');
	testIntegerStat('slow', 'slow');
	testIntegerStat('crit', 'crit');
	testIntegerStat('critRed', 'lowcrit');
	testIntegerStat('physCritPower', 'critval');
	testIntegerStat('magicCritPower', 'critmval');
	testIntegerStat('critPowerRed', 'lowcritallval');
	testIntegerStat('strength', 'ds');
	testIntegerStat('agility', 'dz');
	testIntegerStat('intelligence', 'di');
	testIntegerStat('baseAttrs', 'da');
	testIntegerStat('energy', 'energybon');
	testIntegerStat('energyDest', 'endest');
	testIntegerStat('mana', 'manabon');
	testIntegerStat('manaDest', 'manadest');
	testIntegerStat('resourcesDestRed', 'resmanaendest');
	testIntegerStat('hp', 'hp');
	testFloatStat('hpBonus', 'hpbon');
	testIntegerStat('hpRegen', 'heal');
	testIntegerStat('hpRegenSelfRed', 'adest');
	testIntegerStat('hpRegenEnemyRed', 'lowheal2turns');
	testIntegerStat('evade', 'evade');
	testIntegerStat('evadeRed', 'lowevade');
	testIntegerStat('block', 'blok');
	testIntegerStat('pierceBlock', 'pierceb');

	function testLvlStat(statName: StatName, originalStatName: string): undefined {
		describe(statName, () => {
			test('parses a positive value', () => {
				const stats = parseStats({ [originalStatName]: '10' });

				assert.equal(stats[statName], 10);
			});

			test('throws when given a negative value', () => {
				assert.throws(() => parseStats({ [originalStatName]: '-9' }), StatError);
			});

			test('truncates floating-point values', () => {
				const stats = parseStats({ [originalStatName]: '88.8' });

				assert.equal(stats[statName], 88);
			});

			if (statName === 'lvl') {
				test('throws when the given value is invalid', () => {
					assert.throws(() => parseStats({ [originalStatName]: 'Infinity' }), StatError);
				});
			} else {
				test('ignores invalid values', () => {
					const stats = parseStats({ [originalStatName]: 'Infinity' });

					assert.equal(stats[statName], undefined);
				});
			}
		});
	}

	function testIntegerStat(statName: StatName, originalStatName: string): undefined {
		describe(statName, () => {
			test('parses a positive value', () => {
				const stats = parseStats({ [originalStatName]: '23' });

				assert.equal(stats[statName], 23);
			});

			test('parses a negative value', () => {
				const stats = parseStats({ [originalStatName]: '-42' });

				assert.equal(stats[statName], -42);
			});

			test('truncates floating-point values', () => {
				const stats = parseStats({ [originalStatName]: '1.732' });

				assert.equal(stats[statName], 1);
			});

			test('coerces -0 to 0', () => {
				const stats = parseStats({ [originalStatName]: '-0' });

				assert.equal(stats[statName], 0);
			});

			test('defaults to undefined', () => {
				const stats = parseStats({});

				assert.equal(stats[statName], undefined);
			});

			test('ignores invalid values', () => {
				const stats = parseStats({ [originalStatName]: 'menogram' });

				assert.equal(stats[statName], undefined);
			});
		});
	}

	function testFloatStat(statName: StatName, originalStatName: string): undefined {
		describe(statName, () => {
			test('parses a positive value', () => {
				const stats = parseStats({ [originalStatName]: '7.13' });

				assert.equal(stats[statName], 7.13);
			});

			test('parses a negative value', () => {
				const stats = parseStats({ [originalStatName]: '-12.21' });

				assert.equal(stats[statName], -12.21);
			});

			test('coerces -0 to 0', () => {
				const stats = parseStats({ [originalStatName]: '-0' });

				assert.equal(stats[statName], 0);
			});

			test('defaults to undefined', () => {
				const stats = parseStats({});

				assert.equal(stats[statName], undefined);
			});

			test('ignores invalid values', () => {
				const stats = parseStats({ [originalStatName]: 'NaN' });

				assert.equal(stats[statName], undefined);
			});
		});
	}

	function testTupleStat(
		firstStatName: StatName,
		secondStatName: StatName,
		originalStatName: string,
	): undefined {
		describe(`${firstStatName} & ${secondStatName}`, () => {
			test('parses positive values', () => {
				const stats = parseStats({ [originalStatName]: '77,123' });

				assert.equal(stats[firstStatName], 77, 'The first stat has an invalid value');
				assert.equal(stats[secondStatName], 123, 'The second stat has an invalid value');
			});

			test('parses negative values', () => {
				const stats = parseStats({ [originalStatName]: '-26,-25' });

				assert.equal(stats[firstStatName], -26, 'The first stat has an invalid value');
				assert.equal(stats[secondStatName], -25, 'The second stat has an invalid value');
			});

			test('parses mixed values', () => {
				const stats = parseStats({ [originalStatName]: '-1,1' });

				assert.equal(stats[firstStatName], -1, 'The first stat has an invalid value');
				assert.equal(stats[secondStatName], 1, 'The second stat has an invalid value');
			});

			test('truncates floating-point values', () => {
				const stats = parseStats({ [originalStatName]: '2.7,7.2' });

				assert.equal(stats[firstStatName], 2, 'The first stat has an invalid value');
				assert.equal(stats[secondStatName], 7, 'The second stat has an invalid value');
			});

			test('coerces -0 to 0', () => {
				const stats = parseStats({ [originalStatName]: '-0,-0' });

				assert.equal(stats[firstStatName], 0, 'The first stat has an invalid value');
				assert.equal(stats[secondStatName], 0, 'The second stat has an invalid value');
			});

			test('defaults to undefined', () => {
				const stats = parseStats({});

				assert.equal(
					stats[firstStatName],
					undefined,
					'The first stat has an invalid value',
				);
				assert.equal(
					stats[secondStatName],
					undefined,
					'The second stat has an invalid value',
				);
			});

			test('ignores incomplete values', () => {
				const stats = parseStats({ [originalStatName]: '3' });

				assert.equal(
					stats[firstStatName],
					undefined,
					'The first stat has an invalid value',
				);
				assert.equal(
					stats[secondStatName],
					undefined,
					'The second stat has an invalid value',
				);
			});

			test('ignores invalid values', () => {
				const stats = parseStats({ [originalStatName]: 'hello,world' });

				assert.equal(
					stats[firstStatName],
					undefined,
					'The first stat has an invalid value',
				);
				assert.equal(
					stats[secondStatName],
					undefined,
					'The second stat has an invalid value',
				);
			});
		});
	}
});
