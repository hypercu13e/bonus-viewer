import { CharClass, ItemType } from '#item';
import type { Coeffs } from './common.mts';
import * as counter from './counter.mts';
import * as evaluate from './evaluate.mts';

const resourceDestChance = counter.oneOf({
	40: counter.constant(1),
	80: counter.constant(2),
	100: counter.constant(3),
});

export const energy = counter.linear({ a1: evaluate.polynomial([1 / 15, 10]) });

const energyDestA0Evaluator = evaluate.polynomial([0.04, 2]);
export const energyDest = counter.flatMap((state) => {
	return counter.linear({
		a0: energyDestA0Evaluator({ x: state.lvl + state.upgrade, r: state.rarity }),
	});
});

export const energyDestChance = resourceDestChance;

const nativeManaCoeffs: Coeffs = {
	[CharClass.M]: 1,
	[CharClass.T]: 0.5,
	[CharClass.Pm]: 0.5,
	[CharClass.Mt]: 0.5,
	[CharClass.Pmt]: 0.5,
};

export const mana = counter.pipe(
	counter.flatMap((state) => {
		let c = nativeManaCoeffs[state.charClasses] ?? 0;

		if (state.lvl <= 20) {
			c = 0;
		}

		return counter.native({
			items: [ItemType.Armor],
			evaluator: evaluate.polynomial([c / 3, 0]),
		});
	}),
	counter.linear({ a1: evaluate.polynomial([0.25, 0]) }),
);

const manaDestA0Evaluator = evaluate.polynomial([0.08, 6]);
export const manaDest = counter.flatMap((state) => {
	return counter.linear({
		a0: manaDestA0Evaluator({ x: state.lvl + state.upgrade, r: state.rarity }),
	});
});

export const manaDestChance = resourceDestChance;

export const resourcesDestRed = counter.linear({
	a1: evaluate.polynomial([0.03, 3.75]),
});
