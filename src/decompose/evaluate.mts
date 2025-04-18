import type { Rarity } from '#item';
import type { EnumMemberType } from '#utils';

export type EvalContext = {
	x: number;
	r: Rarity;
};

export type Evaluator = (ctx: EvalContext) => number;

export type EvalVariable = EnumMemberType<typeof EvalVariable>;
export const EvalVariable = Object.freeze({
	Lvl: 0,
	Rarity: 1,
});

export function constant(x: number): Evaluator {
	return function evalConstant(): number {
		return x;
	};
}

export function polynomial(coeffs: number[], variable: EvalVariable = EvalVariable.Lvl): Evaluator {
	// This uses Horner's method to evaluate a polynomial.
	return function evalPolynomial(ctx): number {
		const x = variable === EvalVariable.Lvl ? ctx.x : ctx.r;

		return coeffs.reduce((acc, c) => acc * x + c, 0);
	};
}

export function R(factor = 1): Evaluator {
	return function evalR(ctx): number {
		const { r } = ctx;

		return polynomial([
			factor,
			factor * (130 + Math.ceil((10 / 3) * r)),
			factor * Math.sign(r) * (130 + 390 * r),
		])(ctx);
	};
}
