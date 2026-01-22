// scripts/main.js
import { BUFF_BTN_HTML, DEBUFF_BTN_HTML } from "./constants.js";
import { openMispeledPicker } from "./picker.js";
import { registerMispeledSettings } from "./settings.js";

Hooks.once("init", () => {
	registerMispeledSettings();
});

Hooks.on("ready", () => {
	Hooks.on("renderTokenHUD", (hud, html) => {
		const hudHtml = html.querySelector ? html : html[0];
		if (!hudHtml) return;

		const rightCol = hudHtml.querySelector(".col.right");
		if (!rightCol) return;

		if (rightCol.querySelector(".mispeled-buffs")) return;

		const buffsBtn = $(BUFF_BTN_HTML)[0];
		const debuffsBtn = $(DEBUFF_BTN_HTML)[0];

		buffsBtn.addEventListener("click", (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			openMispeledPicker(hud.object, "buff", buffsBtn);
		});

		debuffsBtn.addEventListener("click", (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
			openMispeledPicker(hud.object, "debuff", debuffsBtn);
		});

		rightCol.prepend(debuffsBtn);
		rightCol.prepend(buffsBtn);
	});
});
