import * as counter from './counter.mts';
import * as evaluate from './evaluate.mts';

const baseAttr = counter.linear({
	a1: evaluate.polynomial([5 / 9, 0]),
	a0: 4,
});

export const strength = baseAttr;
export const agility = baseAttr;
export const intelligence = baseAttr;

export const baseAttrs = counter.linear({
	a1: evaluate.polynomial([0.25, 0]),
	a0: 8,
});
