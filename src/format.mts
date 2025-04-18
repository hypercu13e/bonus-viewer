import type { DecomposedItem, DecomposedStat } from '#decompose';
import { type CountableStatName, RarityModifier } from '#item';

const plus = '\u{002b}';
const minus = '\u{2212}';
const cross = '\u{00d7}';
const twoDotLeader = '\u{2025}';
const thinSpace = '\u{2009}';
const nbsp = '\u{00a0}';
const nativeBonusSymbol = 'n';
const rarityModifierSymbol = 'r';
const decompositionErrorSymbol = '(?)';
export const bonusesClassName = 'item-stat-bonuses';

type Segments = Array<string | Segments>;
export type StatFormatter = (decomposedItem: DecomposedItem, translation: string) => string;

export function singular(statName: CountableStatName): StatFormatter {
	return function formatSingular(decomposedItem, translation): string {
		if (!decomposedItem.stats.has(statName)) {
			return translation;
		}

		const decomposedStat = decomposedItem.stats.get(statName);
		decomposedItem.stats.delete(statName);

		if (decomposedStat !== undefined) {
			const formattedBonuses = formatBonuses([decomposedStat], decomposedItem.rarityModifier);

			return translationWithBonuses(translation, formattedBonuses);
		} else {
			return translationWithBonuses(translation, decompositionErrorSymbol);
		}
	};
}

export function multipleSingleLine(...statNames: CountableStatName[]): StatFormatter {
	return function formatMultipleSingleLine(decomposedItem, translation): string {
		const decomposedStats = statNames
			.filter((statName) => decomposedItem.stats.has(statName))
			.map((statName) => {
				const decomposedStat = decomposedItem.stats.get(statName);
				decomposedItem.stats.delete(statName);

				return decomposedStat;
			});

		if (decomposedStats.length === 0) {
			return translation;
		} else if (decomposedStats.some((decomposedStat) => decomposedStat === undefined)) {
			return translationWithBonuses(translation, decompositionErrorSymbol);
		} else {
			const formattedBonuses = formatBonuses(
				// SAFETY: Any `undefined` value is handled by the preceding branch.
				decomposedStats as DecomposedStat[],
				decomposedItem.rarityModifier,
			);

			return translationWithBonuses(translation, formattedBonuses);
		}
	};
}

function translationWithBonuses(translation: string, formattedBonuses: string): string {
	return `${translation.trimEnd()}${nbsp}<span class="${bonusesClassName}">${formattedBonuses}</span>`;
}

function formatBonuses(decomposedStats: DecomposedStat[], rarityModifier: RarityModifier): string {
	const segments = toSegments(decomposedStats, rarityModifier);

	return formatSegments(segments);
}

function toSegments(decomposedStats: DecomposedStat[], rarityModifier: RarityModifier): Segments {
	const segments: Segments = [];
	// When all stats depend on item's rarity, then it should be presented only once at the end.
	// However, there might be cases where at least one stat depends on it and another one doesn't,
	// and then each stat must have its individual dependency displayed separately.
	const allStatsDependOnRarity = decomposedStats.every(
		(decomposedStat) => decomposedStat.rarityDependent,
	);

	// Native bonus should always be first. Since it's never counted more than once, a single
	// occurrence is enough to add it to the segments.
	if (decomposedStats.some((decomposedStat) => decomposedStat.native)) {
		segments.push(nativeBonusSymbol);
	}

	for (const { count, rarityDependent } of decomposedStats) {
		const includeRarityModifier =
			rarityDependent &&
			!allStatsDependOnRarity &&
			isSignificantRarityModifier(rarityModifier);

		if (count.type === 'integer') {
			let intSegments = segments;

			if (includeRarityModifier) {
				intSegments = [];
			}

			if (count.n !== 0) {
				intSegments.push(toSignSegment(count.n), toNumericSegmentWithoutSign(count.n));
			}

			if (includeRarityModifier) {
				intSegments.push(toSignSegment(rarityModifier), rarityModifierSymbol);
				segments.push(intSegments);
			}
		} else {
			const rangeSegments = [
				toNumericSegmentWithSign(count.lowerBound),
				twoDotLeader,
				toNumericSegmentWithSign(count.upperBound),
			];

			if (includeRarityModifier) {
				rangeSegments.push(toSignSegment(rarityModifier), rarityModifierSymbol);
			}

			segments.push(rangeSegments);
		}
	}

	if (allStatsDependOnRarity && isSignificantRarityModifier(rarityModifier)) {
		segments.push(toSignSegment(rarityModifier), rarityModifierSymbol);
	}

	return segments;
}

function formatSegments(segments: Segments): string {
	let formattedSegments = '';

	for (const [i, segment] of segments.entries()) {
		if (Array.isArray(segment)) {
			formattedSegments += formatSegments(segment);
		} else {
			if (segment === plus && formattedSegments.length === 0) {
				// Do nothing. The plus sign shouldn't be printed at the beginning of a string. For
				// example, a bonus count of 1 should be formatted as '(×1)' not '(+×1)'.
			} else if (
				segment === minus &&
				formattedSegments.length === 0 &&
				i < segments.length - 1
			) {
				// The minus sign must always be printed unless it's the last segment. However, when
				// it's the first segment, then we don't want it to have leading and trailing space.
				// By moving it to the next segment it'll be automatically formatted without that.
				const nextSegment = segments[i + 1]!;

				if (Array.isArray(nextSegment)) {
					nextSegment.unshift(segment);
				} else {
					segments[i + 1] = `${segment}${nextSegment}`;
				}
			} else {
				if (formattedSegments.length > 0) {
					formattedSegments += thinSpace;
				}

				formattedSegments += segment;
			}
		}
	}

	return `(${formattedSegments})`;
}

function toNumericSegmentWithSign(n: number): string {
	return `${toSignSegment(n)}${toNumericSegmentWithoutSign(n)}`;
}

function toNumericSegmentWithoutSign(n: number): string {
	return `${cross}${Math.abs(n)}`;
}

function toSignSegment(n: number): string {
	return n >= 0 ? plus : minus;
}

type SignificantRarityModifier = typeof RarityModifier.Decreased | typeof RarityModifier.Increased;

function isSignificantRarityModifier(
	modifier: RarityModifier | undefined,
): modifier is SignificantRarityModifier {
	return modifier === RarityModifier.Decreased || modifier === RarityModifier.Increased;
}
