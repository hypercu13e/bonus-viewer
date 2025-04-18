export type Writable<T> = {
	-readonly [P in keyof T]: T[P];
};

export type EnumMemberType<T> = T[keyof T];

export const readonlyProperty: PropertyDescriptor = Object.freeze({
	writable: false,
	configurable: false,
} satisfies PropertyDescriptor);
