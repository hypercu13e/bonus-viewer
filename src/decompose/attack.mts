import { CharClass, ItemType } from '../item.mjs';
import type { Coeffs } from './common.mjs';
import type { BonusCounter } from './counter.mjs';
import * as counter from './counter.mjs';
import * as evaluate from './evaluate.mjs';

const physDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 1.06,
	[ItemType.HandAndAHalf]: 1.25,
	[ItemType.TwoHanded]: 1.75,
	[ItemType.Ranged]: 1.35,
	[ItemType.Auxiliary]: 0.755,
});

const magicPhysDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.9,
	[ItemType.HandAndAHalf]: 1.26,
	[ItemType.TwoHanded]: 1.53,
	[ItemType.Ranged]: 0.7,
});

const dotPhysDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.83,
	[ItemType.HandAndAHalf]: 1.025,
	[ItemType.TwoHanded]: 1.445,
	[ItemType.Ranged]: 0.91,
	[ItemType.Auxiliary]: 0.595,
});

const physDmg = (factor: number): BonusCounter =>
	counter.flatMap((state) => {
		let c: number;

		if (
			state.hasStat('fireDmg') ||
			state.hasStat('lightDmgMin') ||
			state.hasStat('lightDmgMax') ||
			state.hasStat('frostDmg') ||
			state.hasStat('frostSlow')
		) {
			c = magicPhysDmgCoeffs[state.itemType] ?? 0;
		} else if (state.hasStat('poisonDmg') || state.hasStat('woundDmg')) {
			c = dotPhysDmgCoeffs[state.itemType] ?? 0;
		} else {
			c = physDmgCoeffs[state.itemType] ?? 0;
		}

		return counter.native({
			items: [
				ItemType.OneHanded,
				ItemType.HandAndAHalf,
				ItemType.TwoHanded,
				ItemType.Ranged,
				ItemType.Auxiliary,
			],
			evaluator: evaluate.R(0.051 * c * factor),
			roundResult: true,
		});
	});

export const physDmgMin = counter.rarityDependent(physDmg(0.9));
export const physDmgMax = counter.rarityDependent(physDmg(1.1));

export const rangedDmg = counter.rarityDependent(
	counter.native({
		items: [ItemType.Arrows, ItemType.Quiver],
		evaluator: evaluate.R(0.051 * 0.095),
		roundResult: true,
	}),
);

const magicDmgItemTypes: readonly ItemType[] = [
	ItemType.OneHanded,
	ItemType.HandAndAHalf,
	ItemType.TwoHanded,
	ItemType.Ranged,
	ItemType.Wand,
	ItemType.Orb,
	ItemType.Arrows,
	ItemType.Quiver,
];

const nativeFireDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.5,
	[ItemType.HandAndAHalf]: 0.65,
	[ItemType.TwoHanded]: 0.75,
	[ItemType.Ranged]: 0.71,
	[ItemType.Wand]: 1,
	[ItemType.Orb]: 0.475,
	[ItemType.Arrows]: 0.15,
	[ItemType.Quiver]: 0.15,
});

export const fireDmg = counter.rarityDependent(
	counter.flatMap((state) => {
		const c = nativeFireDmgCoeffs[state.itemType] ?? 0;

		return counter.native({
			items: magicDmgItemTypes,
			evaluator: evaluate.R(0.051 * c),
			roundResult: true,
		});
	}),
);

const nativeLightDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.5,
	[ItemType.HandAndAHalf]: 0.65,
	[ItemType.TwoHanded]: 0.75,
	[ItemType.Ranged]: 0.71,
	[ItemType.Wand]: 1.25,
	[ItemType.Orb]: 0.5,
	[ItemType.Arrows]: 0.15,
	[ItemType.Quiver]: 0.15,
});

const lightDmg = (factor: number): BonusCounter =>
	counter.flatMap((state) => {
		const c = nativeLightDmgCoeffs[state.itemType] ?? 0;

		return counter.native({
			items: magicDmgItemTypes,
			evaluator: evaluate.R(0.051 * c * factor),
			roundResult: true,
		});
	});

export const lightDmgMin = counter.rarityDependent(lightDmg(0.8));
export const lightDmgMax = counter.rarityDependent(lightDmg(1.2));

const nativeFrostDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.45,
	[ItemType.HandAndAHalf]: 0.585,
	[ItemType.TwoHanded]: 0.675,
	[ItemType.Ranged]: 0.64,
	[ItemType.Wand]: 0.85,
	[ItemType.Orb]: 0.425,
	[ItemType.Arrows]: 0.135,
	[ItemType.Quiver]: 0.135,
});

export const frostDmg = counter.rarityDependent(
	counter.flatMap((state) => {
		const c = nativeFrostDmgCoeffs[state.itemType] ?? 0;

		return counter.native({
			items: magicDmgItemTypes,
			evaluator: evaluate.R(0.051 * c),
			roundResult: true,
		});
	}),
);

const nativeFrostSlowCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.95635,
	[ItemType.HandAndAHalf]: 0.95635,
	[ItemType.TwoHanded]: 0.95635,
	[ItemType.Ranged]: 0.733125,
	[ItemType.Wand]: 1,
	[ItemType.Orb]: 0.733125,
	[ItemType.Arrows]: 0.733125,
	[ItemType.Quiver]: 0.733125,
});

export const frostSlow = counter.flatMap((state) => {
	const c = nativeFrostSlowCoeffs[state.itemType] ?? 0;

	return counter.native({
		items: magicDmgItemTypes,
		evaluator: evaluate.polynomial([c, 0]),
		roundResult: true,
	});
});

const poisonItemTypes: readonly ItemType[] = [
	ItemType.OneHanded,
	ItemType.HandAndAHalf,
	ItemType.TwoHanded,
	ItemType.Ranged,
	ItemType.Auxiliary,
	ItemType.Arrows,
	ItemType.Quiver,
];

const nativePoisonDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.25,
	[ItemType.HandAndAHalf]: 0.25,
	[ItemType.TwoHanded]: 0.25,
	[ItemType.Ranged]: 0.35,
	[ItemType.Auxiliary]: 0.105,
	[ItemType.Arrows]: 0.085,
	[ItemType.Quiver]: 0.085,
});

export const poisonDmg = counter.rarityDependent(
	counter.flatMap((state) => {
		const c = nativePoisonDmgCoeffs[state.itemType] ?? 0;

		return counter.native({
			items: poisonItemTypes,
			evaluator: evaluate.R(0.051 * c),
			roundResult: true,
		});
	}),
);

const nativePoisonSlowCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 0.892475,
	[ItemType.HandAndAHalf]: 0.892475,
	[ItemType.TwoHanded]: 0.892475,
	[ItemType.Ranged]: 0.4462375,
	[ItemType.Auxiliary]: 0.6375,
	[ItemType.Arrows]: 0.4462375,
	[ItemType.Quiver]: 0.4462375,
});

export const poisonSlow = counter.flatMap((state) => {
	const c = nativePoisonSlowCoeffs[state.itemType] ?? 0;

	return counter.native({
		items: poisonItemTypes,
		evaluator: evaluate.polynomial([c, 0]),
		roundResult: true,
	});
});

const woundItemTypes: readonly ItemType[] = [
	ItemType.OneHanded,
	ItemType.HandAndAHalf,
	ItemType.TwoHanded,
	ItemType.Ranged,
	ItemType.Auxiliary,
];

const nativeWoundDmgCoeffs: Coeffs = Object.freeze({
	[ItemType.OneHanded]: 2.75,
	[ItemType.HandAndAHalf]: 3.4,
	[ItemType.TwoHanded]: 4.8,
	[ItemType.Ranged]: 3.25,
	[ItemType.Auxiliary]: 1.15,
});

export const woundDmg = counter.rarityDependent(
	counter.flatMap((state) => {
		const c = nativeWoundDmgCoeffs[state.itemType] ?? 0;

		return counter.native({
			items: woundItemTypes,
			evaluator: evaluate.R(0.0051 * c),
			roundResult: true,
		});
	}),
);

export const woundChance = counter.oneOf({
	20: counter.native({
		items: woundItemTypes,
		evaluator: () => 20,
	}),
	23: counter.native({
		items: woundItemTypes,
		evaluator: () => 23,
	}),
	25: counter.native({
		items: woundItemTypes,
		evaluator: () => 25,
	}),
});

export const pierce = counter.oneOf({
	15: counter.constant(1),
	20: counter.constant(1),
	25: counter.constant(2),
});

export const counterattack = counter.oneOf({
	40: counter.constant(1),
	50: counter.constant(1),
	60: counter.constant(2),
});

const nativeSpeedCoeffs: Coeffs = Object.freeze({
	[CharClass.T]: 0.25,
	[CharClass.H]: 0.5,
	[CharClass.Bt]: 2 / 11,
	[CharClass.Bh]: 0.25,
	[CharClass.Th]: 1 / 3,
	[CharClass.Bth]: 0.25,
});

export const speed = counter.pipe(
	counter.flatMap((state) => {
		const c = nativeSpeedCoeffs[state.charClasses] ?? 0;

		return counter.native({
			items: [ItemType.Armor],
			evaluator: evaluate.polynomial([c, 0]),
		});
	}),
	counter.linear({
		a1: evaluate.polynomial([0.25, 0]),
		a0: 8,
	}),
);

export const slow = counter.linear({
	a1: evaluate.polynomial([2 / 7, 0]),
	a0: 8,
});
