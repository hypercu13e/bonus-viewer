import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import * as count from './count.mts';

describe('isInt()', () => {
	test('returns true when given an integer count', () => {
		const cnt = count.int(1);

		assert.equal(count.isInt(cnt), true);
	});

	test('returns false when given a range count', () => {
		const cnt = count.range(1, 3);

		assert.equal(count.isInt(cnt), false);
	});
});

describe('isRange()', () => {
	test('returns true when given a range count', () => {
		const cnt = count.range(1, 3);

		assert.equal(count.isRange(cnt), true);
	});

	test('returns false when given an integer count', () => {
		const cnt = count.int(1);

		assert.equal(count.isRange(cnt), false);
	});
});
