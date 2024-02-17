import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import * as result from './result.mjs';

describe('isOk()', () => {
	test('returns true when given an Ok value', () => {
		const ok = result.ok(23);

		assert.equal(result.isOk(ok), true);
	});

	test('returns false when given an Err value', () => {
		const err = result.err();

		assert.equal(result.isOk(err), false);
	});
});

describe('isErr()', () => {
	test('returns true when given an Err value', () => {
		const err = result.err();

		assert.equal(result.isErr(err), true);
	});

	test('returns false when given an Ok value', () => {
		const ok = result.ok(32);

		assert.equal(result.isErr(ok), false);
	});
});

describe('map()', () => {
	test('maps the underlying value of an Ok value', () => {
		const ok = result.ok(1);
		const mapped = result.map(ok, (n) => n + 3);

		assert.deepEqual(mapped, result.ok(4));
	});

	test('returns the original Err value', () => {
		const err = result.err();
		const mapped = result.map(err, (x) => String(x));

		assert.equal(mapped, err);
	});
});

describe('flatMap()', () => {
	test('maps the underlying value of an Ok value to another Ok and flattens it', () => {
		const ok = result.ok(1);
		const mapped = result.flatMap(ok, (n) => result.ok(n + 3));

		assert.deepEqual(mapped, result.ok(4));
	});

	test('maps an Ok value to Err', () => {
		const ok = result.ok(1);
		const mapped = result.flatMap(ok, () => result.err());

		assert.deepEqual(mapped, result.err());
	});

	test('returns the original Err value', () => {
		const err = result.err();
		const mapped = result.flatMap(err, (x) => result.ok(String(x)));

		assert.equal(mapped, err);
	});
});
