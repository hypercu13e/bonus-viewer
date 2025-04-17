import { type ItemBonuses, countBonuses } from '#count';
import { type ItemTooltipGetter, type TranslationGetter, newInterfaceEnabled } from '#external';
import { type StatFormatter, bonusDecompositionClassName } from '#format';
import * as format from '#format';
import { parseItem } from '#item';

const statFormatters = new Map<string, StatFormatter>([
	['bonus_crit %val%', format.append('crit')],
	['bonus_lowcrit %val%', format.append('critRed')],
	['bonus_critval %val%', format.append('physCritPower')],
	['bonus_of-critmval %val%', format.append('magicCritPower')],
	['bonus_lowcritallval %val%', format.append('critPowerRed')],
	['bonus_ds %val%', format.append('strength')],
	['bonus_dz %val%', format.append('agility')],
	['bonus_di %val%', format.append('intelligence')],
	['bonus_da %val%', format.append('baseAttrs')],
	['bonus_evade %val%', format.append('evade')],
	['bonus_lowevade %val%', format.append('evadeRed')],
	['bonus_blok %val%', format.append('block')],
	['bonus_pierceb %val%', format.append('pierceBlock')],
]);
const stylesheet = new CSSStyleSheet();
let bonusDecompositionColor: string;
// Well… unless the game client starts doing some asynchronous work during item tooltip generation,
// this should be fine. If it fails, then we can start worrying and change the translation getter so
// that it's dynamically patched in the tooltip getter.
//
// Also, thanks to Priw8 for inspiring this idea of item tooltip augmentation. My initial attempts
// were far more overengineered.
//
// Garmory folks, would you mind refactoring that magnificent piece of code you call a tooltip
// parser? 🥺
let currentBonuses: ItemBonuses | undefined;

if (newInterfaceEnabled) {
	const getTip = globalThis.MargoTipsParser.getTip.bind(globalThis.MargoTipsParser);
	bonusDecompositionColor = '#867e79';

	globalThis.MargoTipsParser.getTip = createAugmentedItemTooltipGetter(getTip);
	globalThis._t2 = createAugmentedTranslationGetter(globalThis._t2);
} else {
	bonusDecompositionColor = '#b0a6a5';
	globalThis.itemTip = createAugmentedItemTooltipGetter(globalThis.itemTip);
	globalThis._t = createAugmentedTranslationGetter(globalThis._t);
}

stylesheet.insertRule(`.${bonusDecompositionClassName} { color: ${bonusDecompositionColor}; }`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];

function createAugmentedItemTooltipGetter(getTip: ItemTooltipGetter): ItemTooltipGetter {
	return function augmentItemTooltipWithBonuses(itemData, ...args): string {
		const item = parseItem(itemData);
		currentBonuses = countBonuses(item);

		try {
			return getTip(itemData, ...args);
		} finally {
			currentBonuses = undefined;
		}
	};
}

function createAugmentedTranslationGetter(translate: TranslationGetter): TranslationGetter {
	return function augmentStatTranslationWithBonusDecomposition(key, ...args): string {
		const translation = translate(key, ...args);

		if (currentBonuses !== undefined) {
			const formatter = statFormatters.get(key);

			return formatter?.(currentBonuses, translation) ?? translation;
		} else {
			return translation;
		}
	};
}
