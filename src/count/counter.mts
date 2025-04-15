import type { ItemType } from '#item';
import type { BonusCount } from './count.mts';
import * as count from './count.mts';
import type { StatContext } from './ctx.mts';
import type { Evaluator } from './evaluate.mts';
import * as evaluate from './evaluate.mts';
import type { Result } from './result.mts';
import * as result from './result.mts';

export type BonusCounter<T> = (ctx: StatContext) => Result<T>;

export type NativeOptions = {
	items: Iterable<ItemType>;
	evaluator: Evaluator;
};

export function native(options: NativeOptions): BonusCounter<number> {
	const { items, evaluator: evaluate } = options;
	const itemKinds: ReadonlySet<ItemType> = new Set(items);

	return function countNative(ctx): Result<number> {
		if (!itemKinds.has(ctx.kind)) {
			return result.ok(0);
		}

		const value = evaluate({
			// Native bonuses can be treated as regular bonuses with `n` equal to 1, so `x` can be
			// calculated rather simply in comparison to the `linear()` counter.
			x: ctx.lvl + ctx.upgrade,
			r: ctx.rarity,
		});

		return result.ok(value);
	};
}

export type LinearOptions = {
	a1?: Evaluator;
	a0?: number;
	negativeEffect?: boolean;
};

export function linear(options: LinearOptions): BonusCounter<BonusCount> {
	const { a1 = evaluate.constant(0), a0 = 0, negativeEffect = false } = options;

	return function countLinear(ctx): Result<BonusCount> {
		// TODO: This works out nicely... on paper. Since this operates on floats, it'd be nice to
		// actually verify all of this using error analysis.
		//
		// The goal here is to find a number of regular bonuses `n` for a given statistic level `x`.
		// Essentially, we need to invert the following function, where a1 = g(x) can be treated as
		// a parameter, and t is a value of the native bonus.
		//
		//                                  ⎧ round(t + a1 × n + a0), for n > 0
		//                           f(n) = ⎨
		//                                  ⎩ round(t), for n = 0
		//
		// Let's start with the first part of the function:
		//
		//                              y = round(t + a1 × n + a0)
		//
		// Let k = y - t. Since round(x) rounds half away from 0, we have three cases:
		//
		//   1. y > 0:    k - 0.5 ≤ a1 × n + a0 < k + 0.5
		//   2. y < 0:    k - 0.5 < a1 × n + a0 ≤ k + 0.5
		//   3. y = 0:    k - 0.5 < a1 × n + a0 < k + 0.5
		//
		// In practice, we can assume that a1 > 0 (this is also asserted in code), as bonus values
		// increase with the number of bonuses. This allows us to transform all inequalities so that
		// `n` is only in the middle, which results in the following:
		//
		//                  ⎧ [(k - a0 - 0.5) / a1; (k - a0 + 0.5) / a1), for y > 0
		//              n ∈ ⎨ ((k - a0 - 0.5) / a1; (k - a0 + 0.5) / a1], for y < 0
		//                  ⎩ ((k - a0 - 0.5) / a1; (k - a0 + 0.5) / a1), for y = 0
		//
		// As seen, the interval endpoints do not change, so we can calculate them and then decide
		// which are excluded depending on the value of y. However, the tricky part is to actually
		// find the endpoints. We need x to calculate a1, and x recursively depends on n that we're
		// looking for:
		//
		//                              x = l + sgn(n) × u × round(0.03l)
		//
		// Fortunately, we don't need the exact value of n but only its sign. It can be determined
		// by using the previous assumption that a1 is non-negative:
		//
		//                              n = (k - a0 - 0.5) / a1
		//                         a1 × n = k - a0 - 0.5
		//                         sgn(n) = sgn(k - a0 - 0.5)
		//
		// The upper bound case is analogous.
		//
		// Moving back to the second branch of the f(n) function, we get a similar result:
		//
		//   1. y > 0:    y - 0.5 ≤ t < y + 0.5    ≡    -0.5 < k ≤ 0.5
		//   2. y < 0:    y - 0.5 < t ≤ y + 0.5    ≡    -0.5 ≤ k < 0.5
		//   3. y = 0:    y - 0.5 < t < y + 0.5    ≡    -0.5 < k < 0.5
		const { lvl: l, upgrade, currentValue: k } = ctx;
		let { originalValue: y } = ctx;
		let lowerBound = k - a0 - 0.5;
		let upperBound = k - a0 + 0.5;
		let regularBonus: BonusCount;

		// Negative effects are bonuses that harm the item owner. For such bonuses, `n` is negated,
		// so we need to reverse the sign of bounds. However, doing so also swaps them (e.g., the
		// lower bound is now the upper bound), which means that we need to negate `y` as well to
		// properly exclude them later.
		if (negativeEffect) {
			const tmp = lowerBound;
			lowerBound = -upperBound;
			upperBound = -tmp;
			y *= -1;
		}

		{
			const lowerBoundA1 = a1({ x: l + Math.sign(lowerBound) * upgrade, r: ctx.rarity });
			const upperBoundA1 = a1({ x: l + Math.sign(upperBound) * upgrade, r: ctx.rarity });

			if (lowerBoundA1 <= 0) {
				throw new RangeError(
					`The function slope must be non-negative, but it is equal to ${lowerBoundA1} in the lower bound case`,
				);
			}

			if (upperBoundA1 <= 0) {
				throw new RangeError(
					`The function slope must be non-negative, but it is equal to ${upperBoundA1} in the upper bound case`,
				);
			}

			lowerBound /= lowerBoundA1;
			upperBound /= upperBoundA1;
		}

		// Depending on the sign of y, determine which interval endpoints are excluded. Since n is
		// an integer, we're going to round endpoints to integers as well, and thus only cases where
		// they're already integers must be considered.
		if (y >= 0) {
			if (Number.isInteger(upperBound)) {
				upperBound--;
			}
		}

		if (y <= 0) {
			if (Number.isInteger(lowerBound)) {
				lowerBound++;
			}
		}

		lowerBound = Math.ceil(lowerBound);
		upperBound = Math.floor(upperBound);

		if (lowerBound === upperBound) {
			regularBonus = count.int(lowerBound);
		} else if (lowerBound < upperBound) {
			regularBonus = count.range(lowerBound, upperBound);
		} else if (
			// This covers the second branch of the f(n) function.
			(y > 0 && -0.5 < k && k <= 0.5) ||
			(y < 0 && -0.5 <= k && k < 0.5) ||
			(y === 0 && -0.5 < k && k < 0.5)
		) {
			regularBonus = count.int(0);
		} else {
			return result.err();
		}

		return result.ok(regularBonus);
	};
}
