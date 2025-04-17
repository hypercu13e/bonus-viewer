import { CharClass, ItemType } from '#item';
import type { Coeffs } from './common.mts';
import { constant, flatMap, linear, native, pipe } from './counter.mts';
import * as evaluate from './evaluate.mts';

const nativeEvadeCoeffs: Coeffs = {
	[CharClass.B]: 1 / 3,
	[CharClass.Bt]: 1 / 6,
	[CharClass.Bh]: 1 / 6,
	[CharClass.Bth]: 1 / 7,
};

export const evade = pipe(
	flatMap((state) => {
		const c = nativeEvadeCoeffs[state.charClasses] ?? 0;

		return native({
			items: [ItemType.Armor],
			evaluator: evaluate.polynomial([c, 0]),
		});
	}),
	linear({ a1: evaluate.polynomial([0.1, 0]) }),
);

export const evadeRed = linear({ a1: evaluate.polynomial([0.1, 0]) });

const nativeBlockCoeffs: Coeffs = {
	[CharClass.P]: 1.2,
	[CharClass.Wp]: 1.1,
};

export const block = pipe(
	flatMap((state) => {
		const c = nativeBlockCoeffs[state.charClasses] ?? 1;

		return native({
			items: [ItemType.Shield],
			evaluator: evaluate.polynomial([c, 0]),
		});
	}),
	linear({ a1: evaluate.polynomial([0.15, 0]) }),
);

export const pierceBlock = constant(1);
