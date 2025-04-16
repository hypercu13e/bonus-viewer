import type { ItemData } from '#item';

declare global {
	var Engine: Engine;
	var hero: Hero;
	var MargoTipsParser: MargoTipsParser;
	var itemTip: ItemTooltipGetter;
	var _t: TranslationGetter;
	var _t2: TranslationGetter;
}

interface Engine {
	hero: {
		d: {
			lvl: number;
		};
	};
}

interface Hero {
	lvl: number;
}

interface MargoTipsParser {
	getTip: (this: this, ...args: Parameters<ItemTooltipGetter>) => string;
}

export type ItemTooltipGetter = (itemData: ItemData, ...args: unknown[]) => string;
export type TranslationGetter = (key: string, ...args: unknown[]) => string;

export let newInterfaceEnabled: boolean;
export let getCharLvl: () => number;

if (document.cookie.includes('interface=ni')) {
	newInterfaceEnabled = true;
	getCharLvl = () => globalThis.Engine.hero.d.lvl;
} else if (document.cookie.includes('interface=si')) {
	newInterfaceEnabled = false;
	getCharLvl = () => globalThis.hero.lvl;
} else {
	throw new Error('Unsupported game client');
}
