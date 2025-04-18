import { CharClass, ItemType } from '#item';
import { type Coeffs, power } from './common.mts';
import type { BonusCounter } from './counter.mts';
import * as counter from './counter.mts';
import * as evaluate from './evaluate.mts';

const nativeAbs = (coeffs: Coeffs): BonusCounter =>
	counter.flatMap((state) => {
		const p = power(state.itemType);
		const c = coeffs[state.charClasses] ?? 0;

		return counter.native({
			items: [
				ItemType.Armor,
				ItemType.Shield,
				ItemType.Helmet,
				ItemType.Gloves,
				ItemType.Boots,
			],
			evaluator: evaluate.R(0.01 * p * c),
		});
	});

const regularAbs = counter.flatMap((state) => {
	const p = power(state.itemType);
	const a = 0.012 * p;

	return counter.linear({
		a1: evaluate.polynomial([a, 130 * a, 0]),
	});
});

const nativePhysAbsCoeffs: Coeffs = {
	[CharClass.M]: 6,
	[CharClass.T]: 4,
	[CharClass.Pm]: 3,
	[CharClass.Pt]: 1.2,
	[CharClass.Mt]: 5,
	[CharClass.Pmt]: 3.36,
};

export const physAbs = counter.rarityDependent(
	counter.pipe(nativeAbs(nativePhysAbsCoeffs), regularAbs),
);

const nativeMagicAbsCoeffs: Coeffs = {
	[CharClass.M]: 3,
	[CharClass.T]: 2,
	[CharClass.Pm]: 1.5,
	[CharClass.Pt]: 0.6,
	[CharClass.Mt]: 2.5,
	[CharClass.Pmt]: 1.68,
};

export const magicAbs = counter.rarityDependent(
	counter.pipe(nativeAbs(nativeMagicAbsCoeffs), regularAbs),
);

const regularAbsDestCoeffs: Coeffs = {
	[ItemType.OneHanded]: 1,
	[ItemType.HandAndAHalf]: 1.1,
	[ItemType.TwoHanded]: 1.2,
	[ItemType.Ranged]: 1,
	[ItemType.Auxiliary]: 0.8,
	[ItemType.Wand]: 1,
	[ItemType.Orb]: 0.7,
	[ItemType.Arrows]: 0.4,
	[ItemType.Quiver]: 0.4,
};

export const absDest = counter.rarityDependent(
	counter.flatMap((state) => {
		let c = regularAbsDestCoeffs[state.itemType] ?? 0;

		if (state.itemType === ItemType.OneHanded && state.charClasses === CharClass.B) {
			c = 1.1;
		}

		return counter.linear({
			a1: evaluate.R(0.006 * c),
		});
	}),
);
