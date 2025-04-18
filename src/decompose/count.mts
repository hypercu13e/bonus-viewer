export type BonusCount = IntegerCount | RangeCount;

export class IntegerCount {
	readonly type = 'integer';
	readonly n: number;

	constructor(n: number) {
		if (!Number.isSafeInteger(n)) {
			throw new TypeError('integer count must be an integer');
		}

		this.n = n;

		Object.defineProperty(this, 'type', { writable: false, configurable: false });
		Object.defineProperty(this, 'n', { writable: false, configurable: false });
	}
}

export class RangeCount {
	readonly type = 'range';
	readonly lowerBound: number;
	readonly upperBound: number;

	constructor(lowerBound: number, upperBound: number) {
		if (!Number.isSafeInteger(lowerBound)) {
			throw new TypeError('lower bound in range count must be an integer');
		}

		if (!Number.isSafeInteger(upperBound)) {
			throw new TypeError('upper bound in range count must be an integer');
		}

		this.lowerBound = lowerBound;
		this.upperBound = upperBound;

		Object.defineProperty(this, 'type', { writable: false, configurable: false });
		Object.defineProperty(this, 'lowerBound', { writable: false, configurable: false });
		Object.defineProperty(this, 'upperBound', { writable: false, configurable: false });
	}
}

export class BonusCountError extends Error {
	override name = BonusCountError.name;
	counterName: string;

	constructor(
		counterName: string,
		message: string = 'failed to decompose a statistic value into individual bonuses',
		options?: ErrorOptions,
	) {
		super(message, options);

		this.counterName = counterName;
	}
}
