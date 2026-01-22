import { MODULE_ID } from "./constants.js";

export function registerMispeledSettings() {
	game.settings.register(MODULE_ID, "customBuffs", {
		name: "Custom Buffs",
		hint: "UUID list of custom buffs shown in the tray",
		scope: "world",
		config: false,
		type: Array,
		default: [],
	});

	game.settings.register(MODULE_ID, "customDebuffs", {
		name: "Custom Debuffs",
		hint: "UUID list of custom debuffs shown in the tray",
		scope: "world",
		config: false,
		type: Array,
		default: [],
	});
}