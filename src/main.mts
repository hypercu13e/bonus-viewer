import { type DecomposedItem, decomposeItem } from '#decompose';
import { type ItemTooltipGetter, type TranslationGetter, newInterfaceEnabled } from '#external';
import { type StatFormatter, bonusesClassName } from '#format';
import * as format from '#format';
import { parseItemData } from '#item';
import * as log from '#log';

const statFormatters = new Map<string, StatFormatter>([
	['item_ac %val%', format.singular('armor')],
	['bonus_acdmg %val%', format.singular('armorDest')],
	['bonus_resacdmg %val%', format.singular('armorDestRed')],
	['bonus_absorb %val%', format.singular('physAbs')],
	['bonus_absorbm %val%', format.singular('magicAbs')],
	['bonus_abdest %val%', format.singular('absDest')],
	['item_dmg %val%', format.multipleSingleLine('physDmgMin', 'physDmgMax')],
	['item_distance_dmg %val%', format.multipleSingleLine('physDmgMin', 'physDmgMax')],
	['item_pdmg %val%', format.singular('rangedDmg')],
	['bonus_fire %val%', format.singular('fireDmg')],
	['bonus_light %val%', format.multipleSingleLine('lightDmgMin', 'lightDmgMax')],
	['bonus_frost %val% %slow%', format.multipleMultiLine(['frostDmg'], ['frostSlow'])],
	['bonus_poison %val% %slow%', format.multipleMultiLine(['poisonDmg'], ['poisonSlow'])],
	['bonus_wound %val% %dmg%', format.multipleSingleLine('woundChance', 'woundDmg')],
	['bonus_pierce %val%', format.singular('pierce')],
	['bonus_contra %val%', format.singular('counterattack')],
	['no_percent_bonus_sa %val%', format.singular('speed')],
	['bonus_slow %val%', format.singular('slow')],
	['bonus_crit %val%', format.singular('crit')],
	['bonus_lowcrit %val%', format.singular('critRed')],
	['bonus_critval %val%', format.singular('physCritPower')],
	['bonus_of-critmval %val%', format.singular('magicCritPower')],
	['bonus_lowcritallval %val%', format.singular('critPowerRed')],
	['bonus_ds %val%', format.singular('strength')],
	['bonus_dz %val%', format.singular('agility')],
	['bonus_di %val%', format.singular('intelligence')],
	['bonus_da %val%', format.singular('baseAttrs')],
	['bonus_energybon %val%', format.singular('energy')],
	['bonus_enfatig', format.multipleSingleLine('energyDestChance', 'energyDest')],
	['bonus_manabon %val%', format.singular('mana')],
	['bonus_manafatig', format.multipleSingleLine('manaDestChance', 'manaDest')],
	['bonus_resmanaendest %val%', format.singular('resourcesDestRed')],
	['bonus_hp %val%', format.singular('hp')],
	['bonus_hpbon %val%', format.singular('hpBonus')],
	['bonus_heal %val%', format.singular('hpRegen')],
	['bonus_adest %val%', format.singular('hpRegenSelfRed')],
	['bonus_lowheal2turns %val%', format.singular('hpRegenEnemyRed')],
	['bonus_evade %val%', format.singular('evade')],
	['bonus_lowevade %val%', format.singular('evadeRed')],
	['bonus_blok %val%', format.singular('block')],
	['bonus_pierceb %val%', format.singular('pierceBlock')],
]);
const stylesheet = new CSSStyleSheet();
let bonusesColor: string;
// Well… unless the game client starts doing some asynchronous work during item tooltip generation,
// this should be fine. If it fails, then we can start worrying and change the translation getter so
// that it's dynamically patched in the tooltip getter.
//
// Also, thanks to Priw8 for inspiring this idea of item tooltip augmentation. My initial attempts
// were far more overengineered.
//
// Garmory folks, would you mind refactoring that magnificent piece of code you call a tooltip
// parser? 🥺
let decomposedItem: DecomposedItem | undefined;

if (newInterfaceEnabled) {
	const getTip = globalThis.MargoTipsParser.getTip.bind(globalThis.MargoTipsParser);
	bonusesColor = '#867e79';

	globalThis.MargoTipsParser.getTip = createAugmentedItemTooltipGetter(getTip);
	globalThis._t2 = createAugmentedTranslationGetter(globalThis._t2);
} else {
	bonusesColor = '#b0a6a5';
	globalThis.itemTip = createAugmentedItemTooltipGetter(globalThis.itemTip);
	globalThis._t = createAugmentedTranslationGetter(globalThis._t);
}

stylesheet.insertRule(`.${bonusesClassName} { color: ${bonusesColor}; }`);
document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];

function createAugmentedItemTooltipGetter(getTip: ItemTooltipGetter): ItemTooltipGetter {
	return function augmentItemTooltipWithBonuses(itemData, ...args): string {
		const item = parseItemData(itemData);
		decomposedItem = decomposeItem(item);

		if (decomposedItem !== undefined) {
			log.debug(`${item.name}:`, decomposedItem);
		}

		try {
			return getTip(itemData, ...args);
		} finally {
			decomposedItem = undefined;
		}
	};
}

function createAugmentedTranslationGetter(translate: TranslationGetter): TranslationGetter {
	return function augmentStatTranslationWithBonuses(key, ...args): string {
		const translation = translate(key, ...args);

		if (decomposedItem !== undefined) {
			const formatter = statFormatters.get(key);

			return formatter?.(decomposedItem, translation) ?? translation;
		} else {
			return translation;
		}
	};
}
