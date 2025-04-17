import type { BonusDecomposition, ItemBonuses } from '#count';
import * as count from '#count';
import { type CountableStatName, RarityModifier } from '#item';

const plus = '\u{002b}';
const minus = '\u{2212}';
const cross = '\u{00d7}';
const twoDotLeader = '\u{2025}';
const thinSpace = '\u{2009}';
const nbsp = '\u{00a0}';
const decompositionError = '(?)';
export const bonusDecompositionClassName = 'item-bonus-decomposition';

type Segments = Array<string | Segments>;
export type StatFormatter = (bonuses: ItemBonuses, translation: string) => string;

export function singular(statName: CountableStatName): StatFormatter {
	return function formatSingular(bonuses, translation): string {
		const decomposition = bonuses.get(statName);

		if (decomposition !== undefined) {
			const formattedDecomposition = formatSegments(toSegments([decomposition]));

			return translationWithBonusDecomposition(translation, formattedDecomposition);
		} else {
			return translationWithBonusDecomposition(translation, decompositionError);
		}
	};
}

export function multipleSingleLine(...statNames: CountableStatName[]): StatFormatter {
	return function formatMultipleSingleLine(bonuses, translation): string {
		const decompositions = statNames.map((statName) => bonuses.get(statName));

		if (decompositions.length === 0) {
			return translation;
		} else if (decompositions.some((decomposition) => decomposition === undefined)) {
			return translationWithBonusDecomposition(translation, decompositionError);
		} else {
			// SAFETY: Any `undefined` value is handled by the preceding branch.
			const formattedDecomposition = formatSegments(
				toSegments(decompositions as BonusDecomposition[]),
			);

			return translationWithBonusDecomposition(translation, formattedDecomposition);
		}
	};
}

function translationWithBonusDecomposition(
	translation: string,
	formattedDecomposition: string,
): string {
	return `${translation.trimEnd()}${nbsp}<span class="${bonusDecompositionClassName}">${formattedDecomposition}</span>`;
}

function toSegments(decompositions: BonusDecomposition[]): Segments {
	const segments: Segments = [];
	let rarityModifier: RarityModifier | undefined;

	// Native bonus should always be first. Since it's never counted more than once, a single
	// occurrence is enough to add it to the segments.
	if (decompositions.some((decomposition) => decomposition.native)) {
		segments.push('n');
	}

	for (const decomposition of decompositions) {
		const { bonusCount } = decomposition;

		// A rarity modifier applies to the entire item, so once we find one, it should be cached.
		if (rarityModifier === undefined && decomposition.rarityModifier !== undefined) {
			rarityModifier = decomposition.rarityModifier;
		}

		if (count.isInt(bonusCount)) {
			if (bonusCount.n !== 0) {
				segments.push(
					toSignSegment(bonusCount.n),
					toNumericSegmentWithoutSign(bonusCount.n),
				);
			}
		} else {
			segments.push([
				toNumericSegmentWithSign(bonusCount.lowerBound),
				twoDotLeader,
				toNumericSegmentWithSign(bonusCount.upperBound),
			]);
		}
	}

	switch (rarityModifier) {
		case RarityModifier.Decreased:
			segments.push(minus, 'r');
			break;
		case RarityModifier.Increased:
			segments.push(plus, 'r');
			break;
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
				// example, a single non-native bonus should be formatted as '(×1)' not '(+×1)'.
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
