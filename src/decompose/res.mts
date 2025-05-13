import { CharClass, type CountableStatName, ItemType, MagicResType } from '#item';
import { type Coeffs, isMagicWeapon, itemTypes } from './common.mts';
import type { BonusCounter } from './counter.mts';
import * as counter from './counter.mts';
import { EvalVariable, type Evaluator } from './evaluate.mts';
import * as evaluate from './evaluate.mts';
import type { StatDecompositionState } from './state.mts';

const magicResStatNames: Readonly<Record<MagicResType, CountableStatName>> = Object.freeze({
	[MagicResType.Fire]: 'fireRes',
	[MagicResType.Frost]: 'frostRes',
	[MagicResType.Light]: 'lightRes',
} satisfies Record<MagicResType, CountableStatName>);

const regularMagicResA1 = 3;

const nativeMagicResCoeffs: Readonly<Record<number, readonly [number, number]>> = Object.freeze({
	[CharClass.P]: Object.freeze([1, 6] as const),
	[CharClass.B]: Object.freeze([1, 2] as const),
	[CharClass.M]: Object.freeze([2, 10] as const),
	[CharClass.T]: Object.freeze([2, 8] as const),
	[CharClass.H]: Object.freeze([1, 4] as const),
	[CharClass.Wp]: Object.freeze([1, 3] as const),
	[CharClass.Wb]: Object.freeze([1, 1] as const),
	[CharClass.Pb]: Object.freeze([1, 4] as const),
	[CharClass.Pm]: Object.freeze([2, 8] as const),
	[CharClass.Pt]: Object.freeze([1, 7] as const),
	[CharClass.Bt]: Object.freeze([1, 5] as const),
	[CharClass.Bh]: Object.freeze([1, 3] as const),
	[CharClass.Mt]: Object.freeze([2, 9] as const),
	[CharClass.Th]: Object.freeze([1, 6] as const),
	[CharClass.Wpb]: Object.freeze([1, 2] as const),
	[CharClass.Wbh]: Object.freeze([1, 2] as const),
	[CharClass.Pmt]: Object.freeze([2, 8] as const),
	[CharClass.Bth]: Object.freeze([1, 5] as const),
	[CharClass.Wpbh]: Object.freeze([1, 3] as const),
});

const nativeMagicRes =
	(magicResType: MagicResType): BonusCounter =>
	(state): StatDecompositionState => {
		const [m, c] = nativeMagicResCoeffs[state.charClasses] ?? [0, 0];
		const evaluator = evaluate.polynomial([m, c], EvalVariable.Rarity);

		if (state.nativeMagicResType === undefined) {
			state = state.with({
				nativeMagicResType: findNativeMagicResType(state, evaluator),
			});
		}

		if (state.nativeMagicResType === magicResType) {
			const nativeCounter = counter.native({
				items: itemTypes.armors,
				evaluator,
			});

			return nativeCounter(state);
		} else {
			return state;
		}
	};

// Magic resistances are quite special because there's a high chance of a value of the native bonus
// ending up being a multiple of the bonus count. Game designers often set the count to a negative
// number for magic resistance stats, so this can lead to a situation where the native bonus and the
// bonus count end up having opposite values, meaning they cancel out.
//
// To handle such corner cases properly, the following function detects which magic resistance type
// is expected to consist of the native bonus. This process is as follows:
//
// 1. Calculate the default native magic res type based on item's level.
// 2. For each res type, check whether a stat value decomposes into the native bonus and regular
//    bonuses without a remainder. If it does not, then that type cannot be native, so ignore it.
// 3. From remaining types choose the one whose value of the native bonus is the closest to the stat
//    value, preferring the default type in case of ties.
function findNativeMagicResType(state: StatDecompositionState, evaluator: Evaluator): MagicResType {
	const nativeValue = evaluator({ x: state.lvl + state.upgrade, r: state.rarity });
	// SAFETY: `state.lvl` is guaranteed to be a positive integer, so the remainder must be an
	// integer in range [0, 2].
	const defaultNativeMagicResType = (state.lvl % 3) as MagicResType;
	const fittingMagicReses = Object.values(MagicResType)
		.map((magicResType) => ({
			type: magicResType,
			value: state.getStatValue(magicResStatNames[magicResType]),
		}))
		.filter(
			// -0 is equal to 0, so we don't have to explicitly handle negative numbers in the
			// second part of this condition.
			({ value }) => value !== undefined && (value - nativeValue) % regularMagicResA1 === 0,
		)
		.map(({ type, value }) => ({
			type,
			// SAFETY: `undefined` values are filtered out by the above `filter()` method.
			diff: Math.abs(value! - nativeValue),
		}))
		.sort((a, b) => {
			// Sort the types in such a way that the default type is first so that the `reduce()`
			// method below chooses it in case of equal differences.
			if (a.type === defaultNativeMagicResType) {
				return -1;
			} else if (b.type === defaultNativeMagicResType) {
				return 1;
			} else {
				return 0;
			}
		});

	if (fittingMagicReses.length > 0) {
		return fittingMagicReses.reduce((prev, next) => (prev.diff <= next.diff ? prev : next))
			.type;
	} else {
		return defaultNativeMagicResType;
	}
}

const regularMagicRes = counter.linear({
	a1: evaluate.constant(regularMagicResA1),
});

export const fireRes = counter.rarityDependent(
	counter.pipe(nativeMagicRes(MagicResType.Fire), regularMagicRes),
);
export const lightRes = counter.rarityDependent(
	counter.pipe(nativeMagicRes(MagicResType.Light), regularMagicRes),
);
export const frostRes = counter.rarityDependent(
	counter.pipe(nativeMagicRes(MagicResType.Frost), regularMagicRes),
);

const nativePoisonResCoeffs: Coeffs = Object.freeze({
	[CharClass.W]: 1,
	[CharClass.B]: 8,
	[CharClass.T]: 12,
	[CharClass.H]: 16,
	[CharClass.Wp]: 1,
	[CharClass.Wb]: 5,
	[CharClass.Pb]: 4,
	[CharClass.Pt]: 6,
	[CharClass.Bt]: 10,
	[CharClass.Bh]: 12,
	[CharClass.Mt]: 6,
	[CharClass.Th]: 14,
	[CharClass.Wpb]: 3,
	[CharClass.Wbh]: 8,
	[CharClass.Pmt]: 4,
	[CharClass.Bth]: 12,
	[CharClass.Wpbh]: 6,
});

export const poisonRes = counter.pipe(
	counter.flatMap((state) => {
		const c = nativePoisonResCoeffs[state.charClasses] ?? 0;

		return counter.native({
			items: itemTypes.armors,
			evaluator: evaluate.constant(c),
		});
	}),
	counter.linear({ a1: evaluate.constant(5) }),
);

const nativeResDestItemTypes: readonly ItemType[] = Object.freeze([
	ItemType.OneHanded,
	ItemType.HandAndAHalf,
	ItemType.TwoHanded,
	ItemType.Arrows,
	ItemType.Quiver,
]);

export const resDest = counter.pipe(
	counter.flatMap((state) => {
		const c = isMagicWeapon(state) ? 1 : 0;

		return counter.native({
			items: nativeResDestItemTypes,
			evaluator: evaluate.constant(c),
		});
	}),
	counter.linear({ a1: evaluate.constant(1) }),
);
