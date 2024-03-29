import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { CharClass, ItemType, Rarity } from '../item.mjs';
import * as count from './count.mjs';
import * as counter from './counter.mjs';
import type { StatContext } from './ctx.mjs';
import * as evaluate from './evaluate.mjs';
import * as result from './result.mjs';

describe('linear()', () => {
	test('counts a bonus with a positive value and positive `n`', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 5,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: 8 }));

		assert.deepEqual(countResult, result.ok(count.int(1)));
	});

	test('counts a bonus with the value equal to 0 and positive `n`', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: -1,
		});
		const countResult = countBonus(createStatCtx({ lvl: 4, value: 0 }));

		assert.deepEqual(countResult, result.ok(count.int(1)));
	});

	test('counts a bonus with a negative value and positive `n`', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: -18,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: -16 }));

		assert.deepEqual(countResult, result.ok(count.int(1)));
	});

	test('counts a bonus with a positive value and negative `n`', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 5,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: 3 }));

		assert.deepEqual(countResult, result.ok(count.int(-1)));
	});

	test('counts a bonus with the value equal to 0 and negative `n`', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 1,
		});
		const countResult = countBonus(createStatCtx({ lvl: 4, value: 0 }));

		assert.deepEqual(countResult, result.ok(count.int(-1)));
	});

	test('counts a bonus with a negative value and negative `n`', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 1,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: -2 }));

		assert.deepEqual(countResult, result.ok(count.int(-1)));
	});

	test('counts a negative effect', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 5,
			negativeEffect: true,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: 8 }));

		assert.deepEqual(countResult, result.ok(count.int(-1)));
	});

	test('counts a negative effect with double negative', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 5,
			negativeEffect: true,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: 3 }));

		assert.deepEqual(countResult, result.ok(count.int(1)));
	});

	test('counts a bonus with a positive value and a range of `n` values', () => {
		const countBonus = counter.linear({
			a1: evaluate.constant(0.1),
		});
		const countResult = countBonus(createStatCtx({ lvl: 1, value: 1 }));

		assert.deepEqual(countResult, result.ok(count.range(5, 14)));
	});

	test('counts a bonus with the value equal to 0 and a range of `n` values', () => {
		const countBonus = counter.linear({
			a1: evaluate.constant(0.1),
		});
		const countResult = countBonus(createStatCtx({ lvl: 1, value: 0 }));

		assert.deepEqual(countResult, result.ok(count.range(-4, 4)));
	});

	test('counts a bonus with a negative value and a range of `n` values', () => {
		const countBonus = counter.linear({
			a1: evaluate.constant(0.1),
		});
		const countResult = countBonus(createStatCtx({ lvl: 1, value: -1 }));

		assert.deepEqual(countResult, result.ok(count.range(-14, -5)));
	});

	test('takes the item upgrade into account when `n` is positive', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([2, 0]),
			a0: 4,
		});
		const countResult = countBonus(createStatCtx({ lvl: 20, upgrade: 3, value: 50 }));

		assert.deepEqual(countResult, result.ok(count.int(1)));
	});

	test('takes the item upgrade into account when `n` is positive and bonus is negative', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([2, 0]),
			a0: 4,
			negativeEffect: true,
		});
		const countResult = countBonus(createStatCtx({ lvl: 20, upgrade: 3, value: 38 }));

		assert.deepEqual(countResult, result.ok(count.int(-1)));
	});

	test('takes the item upgrade into account when `n` is negative', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([2, 0]),
			a0: 4,
		});
		const countResult = countBonus(createStatCtx({ lvl: 20, upgrade: 3, value: -30 }));

		assert.deepEqual(countResult, result.ok(count.int(-1)));
	});

	test('takes the item upgrade into account when both `n` and bonus are negative', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([2, 0]),
			a0: 4,
			negativeEffect: true,
		});
		const countResult = countBonus(createStatCtx({ lvl: 20, upgrade: 3, value: -42 }));

		assert.deepEqual(countResult, result.ok(count.int(1)));
	});

	test('counts a bonus value when n = 0', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 1,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: 0 }));

		assert.deepEqual(countResult, result.ok(count.int(0)));
	});

	test('counts a negative effect when n = 0', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([0.25, 0]),
			a0: 1,
			negativeEffect: true,
		});
		const countResult = countBonus(createStatCtx({ lvl: 10, value: 0 }));

		assert.deepEqual(countResult, result.ok(count.int(0)));
	});

	test('returns an error when counting fails', () => {
		const countBonus = counter.linear({
			a1: evaluate.polynomial([1, 0]),
		});
		const countResult = countBonus(createStatCtx({ lvl: 100, value: 50 }));

		assert.deepEqual(countResult, result.err());
	});

	test('throws when the given a1 evaluator evaluates to 0 when calculating lower bound', () => {
		const countBonus = counter.linear({
			a1: ({ x }) => x,
		});
		const ctx = createStatCtx({ lvl: 3, value: -0.5, upgrade: 3 });

		assert.throws(
			() => countBonus(ctx),
			new RangeError(
				'The function slope must be non-negative, but it is equal to 0 in the lower bound case',
			),
		);
	});

	test('throws when the given a1 evaluator evaluates to 0 when calculating upper bound', () => {
		const countBonus = counter.linear({
			a1: ({ x }) => 3 - x,
		});
		const ctx = createStatCtx({ lvl: 3, value: -0.5, upgrade: 3 });

		assert.throws(
			() => countBonus(ctx),
			new RangeError(
				'The function slope must be non-negative, but it is equal to 0 in the upper bound case',
			),
		);
	});

	test('throws when the given a1 evaluator evaluates to a negative number when calculating lower bound', () => {
		const countBonus = counter.linear({
			a1: ({ x }) => x,
		});
		const ctx = createStatCtx({ lvl: 3, value: -0.5, upgrade: 5 });

		assert.throws(
			() => countBonus(ctx),
			new RangeError(
				'The function slope must be non-negative, but it is equal to -2 in the lower bound case',
			),
		);
	});

	test('throws when the given a1 evaluator evaluates to a negative number when calculating upper bound', () => {
		const countBonus = counter.linear({
			a1: ({ x }) => -x,
		});
		const ctx = createStatCtx({ lvl: 3, value: -0.5, upgrade: 5 });

		assert.throws(
			() => countBonus(ctx),
			new RangeError(
				'The function slope must be non-negative, but it is equal to -3 in the upper bound case',
			),
		);
	});
});

type StatContextProps = {
	lvl: number;
	upgrade?: number;
	value: number;
	currentValue?: number;
};

function createStatCtx(props: StatContextProps): StatContext {
	return {
		lvl: props.lvl,
		upgrade: props.upgrade ?? 0,
		currentValue: props.currentValue ?? props.value,
		originalValue: props.value,
		// Not needed for `linear()`, so these are hardcoded.
		kind: ItemType.Armor,
		rarity: Rarity.Common,
		charClasses: CharClass.W,
	};
}
