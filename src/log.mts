declare global {
	var DEV: boolean;
}

export function warn(...args: unknown[]): undefined {
	if (globalThis.DEV) {
		console.warn(...args);
	}
}
