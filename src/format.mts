import type { BonusDecomposition, IntegerCount, ItemBonuses, RangeCount } from '#count';
import * as count from '#count';
import { type CountableStatName, RarityModifier } from '#item';

const plus = '\u{002b}';
const minus = '\u{2212}';
const cross = '\u{00d7}';
const twoDotLeader = '\u{2025}';
const thinSpace = '\u{2009}';
const nbsp = '\u{00a0}';
export const bonusDecompositionClassName = 'item-bonus-decomposition';

export type StatFormatter = (bonuses: ItemBonuses, translation: string) => string;

export function append(statName: CountableStatName): StatFormatter {
	return function format(bonuses, translation): string {
		const decomposition = bonuses.get(statName);

		if (decomposition !== undefined) {
			return translation.trimEnd() + formatBonusDecomposition(decomposition);
		} else {
			return translation;
		}
	};
}

function formatBonusDecomposition(decomposition: BonusDecomposition): string {
	const { bonusCount, native, rarityModifier } = decomposition;
	let formattedDecomposition = '';

	if (count.isInt(bonusCount)) {
		formattedDecomposition = formatIntegerCount(bonusCount, native, rarityModifier);
	} else {
		formattedDecomposition = formatRangeCount(bonusCount, native, rarityModifier);
	}

	return `${nbsp}<span class="${bonusDecompositionClassName}">(${formattedDecomposition})</span>`;
}

function formatIntegerCount(
	bonusCount: IntegerCount,
	native: boolean,
	rarityModifier: RarityModifier,
): string {
	let formatted = '';

	if (!native && rarityModifier === RarityModifier.Regular) {
		return formatNumber(bonusCount.n);
	}

	if (native) {
		formatted += 'n';

		if (bonusCount.n !== 0) {
			formatted += thinSpace;
			formatted += bonusCount.n >= 0 ? plus : minus;
			formatted += thinSpace;
			formatted += formatNumber(Math.abs(bonusCount.n));
		}
	} else {
		formatted += formatNumber(bonusCount.n);
	}

	if (rarityModifier !== RarityModifier.Regular) {
		formatted += formatRarityModifier(rarityModifier);
	}

	return formatted;
}

function formatRangeCount(
	bonusCount: RangeCount,
	native: boolean,
	rarityModifier: RarityModifier,
): string {
	let formatted = '';
	let range = '';

	range += formatNumber(bonusCount.lowerBound);
	range += thinSpace;
	range += twoDotLeader;
	range += thinSpace;
	range += formatNumber(bonusCount.upperBound);

	if (!native && rarityModifier === RarityModifier.Regular) {
		return range;
	}

	if (native) {
		formatted += 'n';
		formatted += thinSpace;
		formatted += plus;
		formatted += thinSpace;
	}

	formatted += `(${range})`;

	if (rarityModifier !== RarityModifier.Regular) {
		formatted += formatRarityModifier(rarityModifier);
	}

	return formatted;
}

function formatRarityModifier(modifier: RarityModifier): string {
	if (modifier === RarityModifier.Decreased || modifier === RarityModifier.Increased) {
		const sign = modifier === RarityModifier.Decreased ? minus : plus;

		return `${thinSpace}${sign}${thinSpace}r`;
	} else {
		return '';
	}
}

function formatNumber(n: number): string {
	if (n >= 0) {
		return `${cross}${n}`;
	}

	return `${minus}${cross}${Math.abs(n)}`;
}
