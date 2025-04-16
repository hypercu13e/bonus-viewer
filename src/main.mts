import { countBonuses } from '#count';
import { type ItemTooltipGetter, newInterfaceEnabled } from '#external';
import { parseItem } from '#item';
import * as log from '#log';

if (newInterfaceEnabled) {
	const getTip = globalThis.MargoTipsParser.getTip.bind(globalThis.MargoTipsParser);

	globalThis.MargoTipsParser.getTip = createAugmentedItemTooltipGetter(getTip);
} else {
	globalThis.itemTip = createAugmentedItemTooltipGetter(globalThis.itemTip);
}

function createAugmentedItemTooltipGetter(getTip: ItemTooltipGetter): ItemTooltipGetter {
	return function augmentItemTooltipWithBonuses(itemData, ...args): string {
		const item = parseItem(itemData);
		const bonuses = countBonuses(item);

		if (bonuses !== undefined) {
			log.debug(bonuses);
		}

		return getTip(itemData, ...args);
	};
}
