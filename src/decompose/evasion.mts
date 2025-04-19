import { CharClass, ItemType } from '#item';
import { type Coeffs, itemTypes } from './common.mts';
import * as counter from './counter.mts';
import * as evaluate from './evaluate.mts';

const nativeEvadeCoeffs: Coeffs = Object.freeze({
	[CharClass.B]: 1 / 3,
	[CharClass.Bt]: 1 / 6,
	[CharClass.Bh]: 1 / 6,
	[CharClass.Bth]: 1 / 7,
});

export const evade = counter.pipe(
	counter.flatMap((state) => {
		const c = nativeEvadeCoeffs[state.charClasses] ?? 0;

		return counter.native({
			items: itemTypes.armor,
			evaluator: evaluate.polynomial([c, 0]),
		});
	}),
	counter.linear({ a1: evaluate.polynomial([0.1, 0]) }),
);

export const evadeRed = counter.linear({ a1: evaluate.polynomial([0.1, 0]) });

const nativeBlockCoeffs: Coeffs = Object.freeze({
	[CharClass.P]: 1.2,
	[CharClass.Wp]: 1.1,
});

const nativeBlockItemTypes: readonly ItemType[] = Object.freeze([ItemType.Shield]);

export const block = counter.pipe(
	counter.flatMap((state) => {
		const c = nativeBlockCoeffs[state.charClasses] ?? 1;

		return counter.native({
			items: nativeBlockItemTypes,
			evaluator: evaluate.polynomial([c, 0]),
		});
	}),
	counter.linear({ a1: evaluate.polynomial([0.15, 0]) }),
);

export const pierceBlock = counter.oneOf({
	40: counter.constant(1),
	50: counter.constant(1),
	60: counter.constant(1),
});
