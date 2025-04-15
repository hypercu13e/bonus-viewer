export type Writable<T> = {
	-readonly [P in keyof T]: T[P];
};

export type EnumMemberType<T> = T[keyof T];
