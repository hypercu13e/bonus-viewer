import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { Rarity } from '../item.mjs';
import * as evaluate from './evaluate.mjs';
import { EvalVariable } from './evaluate.mjs';

describe('polynomial()', () => {
	test('evaluates a polynomial with given coefficients at `x`', () => {
		const polynomial = evaluate.polynomial([1, 2, 4]);
		const result = polynomial({ x: 3, r: Rarity.Common });

		assert.equal(result, 19);
	});

	test('evaluates a polynomial with given coefficients at `r`', () => {
		const polynomial = evaluate.polynomial([1, 2, 4], EvalVariable.Rarity);
		const result = polynomial({ x: 3, r: Rarity.Common });

		assert.equal(result, 4);
	});

	test('returns 0 when no coefficients are given', () => {
		const polynomial = evaluate.polynomial([]);
		const result = polynomial({ x: 3, r: Rarity.Common });

		assert.equal(result, 0);
	});
});

describe('R()', () => {
	test('evaluates the standard value of `r` at `x`', () => {
		const R = evaluate.R();
		const result = R({ x: 10, r: Rarity.Heroic });

		assert.equal(result, 2380);
	});

	test('multiplies the standard value of `r` at `x` by the given factor', () => {
		const R = evaluate.R(3);
		const result = R({ x: 10, r: Rarity.Heroic });

		assert.equal(result, 7140);
	});
});
