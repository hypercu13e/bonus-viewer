import { CharClass, ItemType } from '#item';
import { type Coeffs, itemTypes, power } from './common.mts';
import * as counter from './counter.mts';
import * as evaluate from './evaluate.mts';

const nativeArmorCoeffs: Coeffs = Object.freeze({
	[CharClass.W]: 1.08,
	[CharClass.P]: 1.0,
	[CharClass.B]: 0.9,
	[CharClass.M]: 0.5,
	[CharClass.T]: 0.7,
	[CharClass.H]: 0.8,
	[CharClass.Wp]: 1.04,
	[CharClass.Wb]: 0.99,
	[CharClass.Pm]: 0.75,
	[CharClass.Pt]: 0.92,
	[CharClass.Pb]: 0.95,
	[CharClass.Bt]: 0.8,
	[CharClass.Bh]: 0.85,
	[CharClass.Mt]: 0.6,
	[CharClass.Th]: 0.75,
	[CharClass.Wpb]: 0.96,
	[CharClass.Wbh]: 0.93,
	[CharClass.Pmt]: 0.75,
	[CharClass.Bth]: 0.8,
	[CharClass.Wpbh]: 0.96,
	[CharClass.All]: 0.9,
});

export const armor = counter.rarityDependent(
	counter.pipe(
		counter.flatMap((state) => {
			const p = power(state.itemType);
			const c = nativeArmorCoeffs[state.charClasses] ?? 1;

			return counter.native({
				items: itemTypes.armors,
				evaluator: evaluate.R(0.02 * p * c),
			});
		}),
		counter.flatMap((state) => {
			const p = power(state.itemType);
			const a = 0.003 * p;

			return counter.linear({ a1: evaluate.polynomial([a, 130 * a, 0]) });
		}),
	),
);

const nativeArmorDestCoeffs: Coeffs = Object.freeze({
	[CharClass.H]: 1,
	[CharClass.Th]: 1,
});

const regularArmorDestCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 4 / 3,
	[ItemType.HandAndAHalf]: 4 / 3,
	[ItemType.TwoHanded]: 4 / 3,
	[ItemType.Ranged]: 4 / 3,
	[ItemType.Auxiliary]: 4 / 3,
	[ItemType.Wand]: 4 / 3,
	[ItemType.Orb]: 4 / 3,
	[ItemType.Arrows]: 4 / 3,
	[ItemType.Quiver]: 4 / 3,
});

export const armorDest = counter.pipe(
	counter.flatMap((state) => {
		const c = nativeArmorDestCoeffs[state.charClasses] ?? 0;
		const a = 0.0008 * c;

		return counter.native({
			items: itemTypes.arrows,
			evaluator: evaluate.polynomial([a, 130 * a, 0]),
			// TODO: This is most likely a bug in the game engine, which currently rounds bonuses of
			// this stat separately.
			roundResult: true,
		});
	}),
	counter.flatMap((state) => {
		const c = regularArmorDestCoeffs[state.itemType] ?? 1;
		const a = 0.0003 * c;

		return counter.linear({
			a1: evaluate.polynomial([a, 130 * a, 0]),
			a0: 1,
		});
	}),
);

export const armorDestRed = counter.linear({
	a1: evaluate.polynomial([0.0003, 0.0003 * 130, 0]),
	a0: 1,
});
