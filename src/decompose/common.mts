import { ItemType } from '#item';

export type Coeffs = Readonly<Record<number, number>>;

const itemPowerCoeffs: Coeffs = Object.freeze({
	[ItemType.Shield]: 0.75,
	[ItemType.Helmet]: 0.33,
	[ItemType.Boots]: 0.3,
	[ItemType.Gloves]: 0.25,
});

export function power(itemType: ItemType): number {
	return itemPowerCoeffs[itemType] ?? 1;
}

export function roundAwayFromZero(x: number): number {
	return Math.sign(x) * Math.round(Math.abs(x));
}
