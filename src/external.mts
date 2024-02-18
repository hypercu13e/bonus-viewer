declare global {
	var Engine: any;
	var hero: any;
	var MargoTipsParser: any;
	var itemTip: any;
	var _t: any;
	var _t2: any;
}

export const newInterfaceEnabled = document.cookie.includes('interface=ni');
export const oldInterfaceEnabled = document.cookie.includes('interface=si');

// All following functions assume that `newInterfaceEnabled` and `oldInterfaceEnabled` are mutually
// exclusive and exactly one is `true`.
export function getCharLvl(): number {
	return newInterfaceEnabled ? globalThis.Engine.hero.d.lvl : globalThis.hero.lvl;
}
