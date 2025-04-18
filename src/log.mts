declare global {
	var DEV: boolean;
}

export function debug(...args: unknown[]): undefined {
	if (globalThis.DEV) {
		console.debug(...args);
	}
}

export function warn(...args: unknown[]): undefined {
	if (globalThis.DEV) {
		console.warn(...args);
	}
}

export function error(...args: unknown[]): undefined {
	if (globalThis.DEV) {
		console.error(...args);
	}
}
