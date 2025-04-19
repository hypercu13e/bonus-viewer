import { ItemType } from '#item';
import type { StatDecompositionState } from './state.mts';

export type Coeffs = Readonly<Record<number, number>>;

const itemPowerCoeffs: Coeffs = Object.freeze({
	[ItemType.Shield]: 0.75,
	[ItemType.Helmet]: 0.33,
	[ItemType.Boots]: 0.3,
	[ItemType.Gloves]: 0.25,
});

export const itemTypes = Object.freeze({
	armor: Object.freeze([ItemType.Armor]),
	armors: Object.freeze([
		ItemType.Armor,
		ItemType.Shield,
		ItemType.Helmet,
		ItemType.Gloves,
		ItemType.Boots,
	]),
	arrows: Object.freeze([ItemType.Arrows, ItemType.Quiver]),
});

export function power(itemType: ItemType): number {
	return itemPowerCoeffs[itemType] ?? 1;
}

export function isMagicWeapon(state: StatDecompositionState): boolean {
	return state.hasStat('fireDmg') || state.hasStat('lightDmgMin') || state.hasStat('frostDmg');
}

export function isDotWeapon(state: StatDecompositionState): boolean {
	return state.hasStat('poisonDmg') || state.hasStat('woundDmg');
}

export function roundAwayFromZero(x: number): number {
	return Math.sign(x) * Math.round(Math.abs(x));
}
