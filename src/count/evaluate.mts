import type { EvalContext } from './ctx.mjs';

export type Evaluator = (ctx: EvalContext) => number;

export enum EvalVariable {
	Lvl,
	Rarity,
}

export function polynomial(
	coeffs: readonly number[],
	variable: EvalVariable = EvalVariable.Lvl,
): Evaluator {
	// This uses Horner's method to evaluate a polynomial.
	return function evalPolynomial(ctx): number {
		const x = variable === EvalVariable.Lvl ? ctx.x : ctx.r;

		return coeffs.reduce((acc, c) => acc * x + c, 0);
	};
}

export function R(factor: number = 1): Evaluator {
	return function evalR(ctx): number {
		const { r } = ctx;

		return polynomial([
			factor,
			factor * (130 + Math.ceil((10 / 3) * r)),
			factor * Math.sign(r) * (130 + 390 * r),
		])(ctx);
	};
}
