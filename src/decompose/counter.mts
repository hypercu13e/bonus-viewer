import { type ItemType, RarityModifier } from '#item';
import { roundAwayFromZero } from './common.mts';
import { type BonusCount, BonusCountError, IntegerCount, RangeCount } from './count.mts';
import type { Evaluator } from './evaluate.mts';
import * as evaluate from './evaluate.mts';
import type { StatDecompositionState } from './state.mts';

export type BonusCounter = (state: StatDecompositionState) => StatDecompositionState;

export function pipe(...counters: BonusCounter[]): BonusCounter {
	return function countPipe(state): StatDecompositionState {
		return counters.reduce((state, counter) => counter(state), state);
	};
}

export function flatMap(fn: (state: StatDecompositionState) => BonusCounter): BonusCounter {
	return function countFlatMap(state): StatDecompositionState {
		const counter = fn(state);

		return counter(state);
	};
}

export function oneOf(variants: Record<number, BonusCounter>): BonusCounter {
	return function countOneOf(state): StatDecompositionState {
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
	roundResult?: boolean;
};

export function native(options: NativeOptions): BonusCounter {
	const { items, evaluator: evaluate, roundResult = false } = options;
	const itemTypes = new Set<ItemType>(items);

	return function countNative(state): StatDecompositionState {
		if (itemTypes.has(state.itemType)) {
			let value = evaluate({
				// Native bonuses can be treated as regular bonuses with `n` equal to 1, so `x` can
				// be calculated rather simply in comparison to the `linear()` counter.
				x: state.lvl + state.upgrade,
				r: state.rarity,
			});

			if (roundResult) {
				value = roundAwayFromZero(value);
			}

			if (value !== 0) {
				return state.with({ value: state.value - value, native: true });
			} else {
				return state;
			}
		} else {
			return state;
		}
	};
}

const rarityModifiers: readonly RarityModifier[] = Object.freeze([
	RarityModifier.Regular,
	RarityModifier.Decreased,
	RarityModifier.Increased,
]);

export function rarityDependent(counter: BonusCounter): BonusCounter {
	return function countRarityDependent(initialState): StatDecompositionState {
		// If we already know the modifier, then short-circuit counting.
		if (initialState.detectedRarityModifier !== undefined) {
			const state = initialState.with({
				currentRarityModifier: initialState.detectedRarityModifier,
			});

			return counter(state);
		}

		for (const rarityModifier of rarityModifiers) {
			let state: StatDecompositionState;

			try {
				state = counter(initialState.with({ currentRarityModifier: rarityModifier }));
			} catch (error) {
				if (error instanceof BonusCountError) {
					continue;
				} else {
					throw new BonusCountError(
						rarityDependent.name,
						`decomposition failed for rarity modifier ${rarityModifier}`,
						{ cause: error },
					);
				}
			}

			if (state.value === 0) {
				return state;
			}
		}

		throw new BonusCountError(rarityDependent.name, 'no fitting rarity modifier was found');
	};
}

export type LinearOptions = {
	a1?: Evaluator;
	a0?: number;
	extendDomainToZero?: boolean;
	negativeEffect?: boolean;
};

export function linear(options: LinearOptions): BonusCounter {
	const {
		a1 = evaluate.constant(1),
		a0 = 0,
		extendDomainToZero = false,
		negativeEffect = false,
	} = options;
	const extendedA0 = extendDomainToZero ? a0 : 0;

	return function countLinear(state): StatDecompositionState {
		// TODO: This works out nicely... on paper. Since this operates on floats, it'd be nice to
		// actually verify all of this using error analysis.
		//
		// The goal here is to find a number of regular bonuses `n` for a given statistic level `x`.
		// Essentially, we need to invert the following function, where a1 = g(x) can be treated as
		// a parameter, and t is a value of the native bonus.
		//
		//                                  ⎧ round(t + a1 × n + a0), for n > 0
		//                           f(n) = ⎨
		//                                  ⎩ round(t + a0?), for n = 0
		//
		// Here, `a0?` means that a0 applies optionally. Formulas for most stats applies only when
		// `n` is positive, and for `n = 0`, the bonus value is fixed to 0. However, some stats can
		// have their domain extended to non-negative numbers, in which case the final value
		// includes a1 × 0 + a0 = a0.
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
		//   1. y > 0:    k - 0.5 ≤ a0? < k + 0.5    ≡    a0? - 0.5 < k ≤ a0? + 0.5
		//   2. y < 0:    k - 0.5 < a0? ≤ k + 0.5    ≡    a0? - 0.5 ≤ k < a0? + 0.5
		//   3. y = 0:    k - 0.5 < a0? < k + 0.5    ≡    a0? - 0.5 < k < a0? + 0.5
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
			bonusCount = new IntegerCount(lowerBound);
		} else if (lowerBound < upperBound) {
			bonusCount = new RangeCount(lowerBound, upperBound);
		} else if (
			// This covers the second branch of the f(n) function.
			(y > 0 && extendedA0 - 0.5 < k && k <= extendedA0 + 0.5) ||
			(y < 0 && extendedA0 - 0.5 <= k && k < extendedA0 + 0.5) ||
			(y === 0 && extendedA0 - 0.5 < k && k < extendedA0 + 0.5)
		) {
			bonusCount = new IntegerCount(0);
		} else {
			throw new BonusCountError(linear.name);
		}

		return state.with({ value: state.value - k, count: bonusCount });
	};
}

export function constant(n: number): BonusCounter {
	return function countConstant(state): StatDecompositionState {
		return state.with({ value: 0, count: new IntegerCount(n) });
	};
}

export function unimplemented(): never {
	throw new BonusCountError(unimplemented.name, 'not yet implemented');
}
