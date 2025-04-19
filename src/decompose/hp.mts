import { CharClass } from '#item';
import { type Coeffs, itemTypes, power } from './common.mts';
import * as counter from './counter.mts';
import * as evaluate from './evaluate.mts';

export const hp = counter.flatMap((state) => {
	const p = power(state.itemType);
	const a = 3.08;

	return counter.linear({
		a1: evaluate.polynomial([0.004 * a * p, a * (1 + 0.52 * p), 0]),
		a0: 24.64,
	});
});

const nativeHpBonusCoeffs: Coeffs = Object.freeze({
	[CharClass.W]: 1,
	[CharClass.P]: 1,
	[CharClass.Wp]: 1,
	[CharClass.Wb]: 1 / 2,
	[CharClass.Pb]: 1 / 2,
	[CharClass.Wpb]: 1 / 1.66,
});

export const hpBonus = counter.flatMap((state) => {
	const c = nativeHpBonusCoeffs[state.charClasses] ?? 0;

	return counter.native({
		items: itemTypes.armor,
		evaluator: (ctx) => Math.max(0.1 * c * ctx.x, 1),
		roundResult: true,
	});
});

export const hpRegen = counter.flatMap((state) => {
	const p = power(state.itemType);

	return counter.linear({
		a1: evaluate.polynomial([0.004 * p, 0.8 + 0.52 * p, 0]),
		a0: 8,
	});
});

export const hpRegenSelfRed = counter.flatMap((state) => {
	const p = power(state.itemType);
	const a = 0.5;

	return counter.linear({
		a1: evaluate.polynomial([0.004 * a * p, a * (1 + 0.52 * p), 0]),
		a0: 4,
		negativeEffect: true,
	});
});

export const hpRegenEnemyRed = counter.flatMap((state) => {
	const p = power(state.itemType);
	const a = 0.75;

	return counter.linear({
		a1: evaluate.polynomial([0.004 * a * p, a * (0.8 + 0.52 * p), 0]),
		a0: 6,
	});
});
