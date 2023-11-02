export const okType = Symbol('Ok');
export const errType = Symbol('Err');

export type Ok<T> = {
	readonly type: typeof okType;
	readonly value: T;
};

export type Err = {
	readonly type: typeof errType;
};

export type Result<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
	return { type: okType, value };
}

export function err(): Err {
	return { type: errType };
}

export function isOk<T>(res: Result<T>): res is Ok<T> {
	return res.type === okType;
}

export function isErr<T>(res: Result<T>): res is Err {
	return res.type === errType;
}

export function map<T, U>(res: Result<T>, fn: (value: T) => U): Result<U> {
	switch (res.type) {
		case okType:
			return ok(fn(res.value));
		case errType:
			return res;
	}
}

export function flatMap<T, U>(res: Result<T>, fn: (value: T) => Result<U>): Result<U> {
	switch (res.type) {
		case okType:
			return fn(res.value);
		case errType:
			return res;
	}
}
