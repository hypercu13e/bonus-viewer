import { linear } from './counter.mts';
import * as evaluate from './evaluate.mts';

const baseAttr = linear({
	a1: evaluate.polynomial([5 / 9, 0]),
	a0: 4,
});

export const strength = baseAttr;
export const agility = baseAttr;
export const intelligence = baseAttr;

export const baseAttrs = linear({
	a1: evaluate.polynomial([0.25, 0]),
	a0: 8,
});
