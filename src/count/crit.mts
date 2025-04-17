import { linear } from './counter.mts';
import * as evaluate from './evaluate.mts';

export const crit = linear({ a1: evaluate.constant(1) });

export const critRed = linear({ a1: evaluate.constant(2) });

export const critPower = linear({ a1: evaluate.constant(6) });

export const critPowerRed = linear({
	a1: (ctx) => 0.75 * Math.ceil(0.02 * ctx.x),
	a0: 3.75,
});
