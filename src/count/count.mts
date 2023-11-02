export const integerType = Symbol('IntegerCount');
export const rangeType = Symbol('RangeCount');

export type IntegerCount = {
	readonly type: typeof integerType;
	readonly n: number;
};

export type RangeCount = {
	readonly type: typeof rangeType;
	readonly lowerBound: number;
	readonly upperBound: number;
};

export type BonusCount = IntegerCount | RangeCount;

export function int(n: number): IntegerCount {
	return { type: integerType, n };
}

export function range(lowerBound: number, upperBound: number): RangeCount {
	return { type: rangeType, lowerBound, upperBound };
}

export function isInt(count: BonusCount): count is IntegerCount {
	return count.type === integerType;
}

export function isRange(count: BonusCount): count is RangeCount {
	return count.type === rangeType;
}
