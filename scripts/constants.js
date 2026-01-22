// scripts/constants.js
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
