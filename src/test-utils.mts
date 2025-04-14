import { CharClass, type Item, ItemType, Rarity, type Stats } from './item.mjs';

export const testItemName = 'Test item';

export type ItemProps = {
	name?: Item['name'];
	type?: Item['type'];
	stats?: Partial<Item['stats']>;
};

export function createItem(props?: ItemProps): Item {
	return {
		name: props?.name ?? testItemName,
		type: props?.type ?? ItemType.Unknown,
		stats: createStats(props?.stats),
	};
}

export function createStats(props?: Partial<Stats>): Stats {
	return {
		rarity: props?.rarity ?? Rarity.Common,
		charClasses: props?.charClasses ?? CharClass.All,
		lvl: props?.lvl ?? undefined,
		upgradeLvl: props?.upgradeLvl ?? undefined,
		loweredLvl: props?.loweredLvl ?? undefined,
		armor: props?.armor ?? undefined,
		armorDest: props?.armorDest ?? undefined,
		armorDestRed: props?.armorDestRed ?? undefined,
		physAbs: props?.physAbs ?? undefined,
		magicAbs: props?.magicAbs ?? undefined,
		absDest: props?.absDest ?? undefined,
		fireRes: props?.fireRes ?? undefined,
		lightRes: props?.lightRes ?? undefined,
		frostRes: props?.frostRes ?? undefined,
		poisonRes: props?.poisonRes ?? undefined,
		resDest: props?.resDest ?? undefined,
		physDmgMin: props?.physDmgMin ?? undefined,
		physDmgMax: props?.physDmgMax ?? undefined,
		rangedDmg: props?.rangedDmg ?? undefined,
		fireDmg: props?.fireDmg ?? undefined,
		lightDmgMin: props?.lightDmgMin ?? undefined,
		lightDmgMax: props?.lightDmgMax ?? undefined,
		frostDmg: props?.frostDmg ?? undefined,
		frostSlow: props?.frostSlow ?? undefined,
		poisonDmg: props?.poisonDmg ?? undefined,
		poisonSlow: props?.poisonSlow ?? undefined,
		woundDmg: props?.woundDmg ?? undefined,
		woundChance: props?.woundChance ?? undefined,
		pierce: props?.pierce ?? undefined,
		counter: props?.counter ?? undefined,
		speed: props?.speed ?? undefined,
		slow: props?.slow ?? undefined,
		crit: props?.crit ?? undefined,
		critRed: props?.critRed ?? undefined,
		physCritPower: props?.physCritPower ?? undefined,
		magicCritPower: props?.magicCritPower ?? undefined,
		critPowerRed: props?.critPowerRed ?? undefined,
		strength: props?.strength ?? undefined,
		agility: props?.agility ?? undefined,
		intelligence: props?.intelligence ?? undefined,
		baseAttrs: props?.baseAttrs ?? undefined,
		energy: props?.energy ?? undefined,
		energyDest: props?.energyDest ?? undefined,
		mana: props?.mana ?? undefined,
		manaDest: props?.manaDest ?? undefined,
		resourcesDestRed: props?.resourcesDestRed ?? undefined,
		hp: props?.hp ?? undefined,
		hpBonus: props?.hpBonus ?? undefined,
		hpRegen: props?.hpRegen ?? undefined,
		hpRegenSelfRed: props?.hpRegenSelfRed ?? undefined,
		hpRegenEnemyRed: props?.hpRegenEnemyRed ?? undefined,
		evade: props?.evade ?? undefined,
		evadeRed: props?.evadeRed ?? undefined,
		block: props?.block ?? undefined,
		pierceBlock: props?.pierceBlock ?? undefined,
	};
}
