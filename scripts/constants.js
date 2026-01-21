// scripts/constants.js
import { getCallbacks } from "./callbacks.js";

export const MODULE_ID = "mispeled-gse";
export const MODULE_PATH = `modules/${MODULE_ID}`;

export const BUFF_BTN_HTML = `
<button type="button" class="control-icon mispeled-buffs" data-action="mispeledBuffs" data-tooltip="Mispeled Buffs">
    <img src="${MODULE_PATH}/icons/buffs.png" width="36" height="36" inert>
</button>`;

export const DEBUFF_BTN_HTML = `
<button type="button" class="control-icon mispeled-debuffs" data-action="mispeledDebuffs" data-tooltip="Mispeled Debuffs">
    <img src="${MODULE_PATH}/icons/debuffs.png" width="36" height="36" inert>
</button>`;

const CALLBACKS = getCallbacks();

export const MISPELED_BUFFS = [
	{
		id: "mage-armor",
		name: "Mage Armor",
		icon: `${MODULE_PATH}/icons/mage-armor.png`,
		callbacks: CALLBACKS["mage-armor"],
	},
	{
		id: "shield",
		name: "Shield",
		icon: `${MODULE_PATH}/icons/shield.png`,
		callbacks: CALLBACKS["shield"],
	},
];

export const MISPELED_DEBUFFS = [
	{
		id: "burning",
		name: "Burning",
		icon: `${MODULE_PATH}/icons/burning.png`,
		callbacks: CALLBACKS["burning"],
	},
	{
		id: "bane",
		name: "Bane",
		icon: `${MODULE_PATH}/icons/bane.png`,
		callbacks: CALLBACKS["bane"],
	},
];