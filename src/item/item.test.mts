import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { createItem, testItemName } from '#test-utils';
import { ItemType, parseItem } from './item.mts';
import { Rarity } from './stat.mts';

describe('parseItem()', () => {
	test('parses a regular item', () => {
		const item = parseItem({ name: testItemName, cl: 1, stat: 'dmg=1,10;rarity=unique' });

		assert.deepEqual(
			item,
			createItem({
				name: testItemName,
				type: ItemType.OneHanded,
				stats: { rarity: Rarity.Unique, physDmgMin: 1, physDmgMax: 10 },
			}),
		);
	});

	test('coerces too large item type to the unknown type', () => {
		const item = parseItem({ name: testItemName, cl: Number.MAX_SAFE_INTEGER, stat: '' });

		assert.equal(item.type, ItemType.Unknown);
	});

	test('coerces negative item type to the unknown type', () => {
		const item = parseItem({ name: testItemName, cl: -1, stat: '' });

		assert.equal(item.type, ItemType.Unknown);
	});

	test('coerces fractional item type to the unknown type', () => {
		const item = parseItem({ name: testItemName, cl: 3.5, stat: '' });

		assert.equal(item.type, ItemType.Unknown);
	});

	test('coerces -0 item type to the unknown type', () => {
		const item = parseItem({ name: testItemName, cl: -0, stat: '' });

		assert.equal(item.type, ItemType.Unknown);
	});
});
