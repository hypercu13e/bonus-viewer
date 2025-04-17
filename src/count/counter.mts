import type { ItemType } from '#item';
import { type BonusCount, BonusCountError } from './count.mts';
import * as count from './count.mts';
import type { Evaluator } from './evaluate.mts';
import * as evaluate from './evaluate.mts';
import type { StatCountState } from './state.mts';

export type BonusCounter = (state: StatCountState) => StatCountState;

export function pipe(...counters: BonusCounter[]): BonusCounter {
	return function countPipe(state): StatCountState {
		return counters.reduce((state, counter) => counter(state), state);
	};
}

export function flatMap(fn: (state: StatCountState) => BonusCounter): BonusCounter {
	return function countFlatMap(state): StatCountState {
		const counter = fn(state);

		return counter(state);
	};
}

export function oneOf(variants: Record<number, BonusCounter>): BonusCounter {
	return function countOneOf(state): StatCountState {
		const counter = variants[state.value];

		if (counter !== undefined) {
			return counter(state);
		} else {
			throw new BonusCountError(oneOf.name, `missing variant ${state.value}`);
		}
	};
}

export type NativeOptions = {
	items: Iterable<ItemType>;
	evaluator: Evaluator;
};

export function native(options: NativeOptions): BonusCounter {
	const { items, evaluator: evaluate } = options;
	const itemTypes: ReadonlySet<ItemType> = new Set(items);

	return function countNative(state): StatCountState {
		if (itemTypes.has(state.itemType)) {
			const value = evaluate({
				// Native bonuses can be treated as regular bonuses with `n` equal to 1, so `x` can
				// be calculated rather simply in comparison to the `linear()` counter.
				x: state.lvl + state.upgrade,
				r: state.rarity,
			});

			return state.withNativeBonus(value);
		} else {
			return state;
		}
	};
}

export type LinearOptions = {
	a1?: Evaluator;
	a0?: number;
	negativeEffect?: boolean;
};

export function linear(options: LinearOptions): BonusCounter {
	const { a1 = evaluate.constant(1), a0 = 0, negativeEffect = false } = options;

	return function countLinear(state): StatCountState {
		// TODO: This works out nicely... on paper. Since this operates on floats, it'd be nice to
		// actually verify all of this using error analysis.
		//
		// The goal here is to find a number of regular bonuses `n` for a given statistic level `x`.
		// Essentially, we need to invert the following function, where a1 = g(x) can be treated as
		// a parameter, and t is a value of the native bonus.
		//
		//                                  ⎧ round(t + a1 × n + a0), for n > 0
		//                           f(n) = ⎨
		//                                  ⎩ round(t + a0), for n = 0
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
		//   1. y > 0:    k - 0.5 ≤ a0 < k + 0.5    ≡    a0 - 0.5 < k ≤ a0 + 0.5
		//   2. y < 0:    k - 0.5 < a0 ≤ k + 0.5    ≡    a0 - 0.5 ≤ k < a0 + 0.5
		//   3. y = 0:    k - 0.5 < a0 < k + 0.5    ≡    a0 - 0.5 < k < a0 + 0.5
		const { lvl: l, upgrade, value: k } = state;
		let { statValue: y } = state;
		let lowerBound = k - a0 - 0.5;
		let upperBound = k - a0 + 0.5;
		let bonusCount: BonusCount;

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
			const lowerBoundA1 = a1({ x: l + Math.sign(lowerBound) * upgrade, r: state.rarity });
			const upperBoundA1 = a1({ x: l + Math.sign(upperBound) * upgrade, r: state.rarity });

			if (lowerBoundA1 <= 0) {
				throw new BonusCountError(
					linear.name,
					`function slope must be positive, but it is equal to ${lowerBoundA1} in the lower bound case instead`,
				);
			}

			if (upperBoundA1 <= 0) {
				throw new BonusCountError(
					linear.name,
					`function slope must be positive, but it is equal to ${upperBoundA1} in the upper bound case instead`,
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

		// Bounds may end up being `-0` after rounding. Adding `0` gets rid of the minus sign.
		lowerBound = Math.ceil(lowerBound) + 0;
		upperBound = Math.floor(upperBound) + 0;

		if (lowerBound === upperBound) {
			bonusCount = count.int(lowerBound);
		} else if (lowerBound < upperBound) {
			bonusCount = count.range(lowerBound, upperBound);
		} else if (
			// This covers the second branch of the f(n) function.
			(y > 0 && a0 - 0.5 < k && k <= a0 + 0.5) ||
			(y < 0 && a0 - 0.5 <= k && k < a0 + 0.5) ||
			(y === 0 && a0 - 0.5 < k && k < a0 + 0.5)
		) {
			bonusCount = count.int(0);
		} else {
			throw new BonusCountError(linear.name);
		}

		return state.withBonusCount(k, bonusCount);
	};
}

export function constant(n: number): BonusCounter {
	return function countConstant(state): StatCountState {
		return state.withBonusCount(state.value, count.int(n));
	};
}

export function unimplemented(): never {
	throw new BonusCountError(unimplemented.name, 'not yet implemented');
}
