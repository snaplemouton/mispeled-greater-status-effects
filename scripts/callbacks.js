// scripts/callbacks.js
import { MODULE_ID, MODULE_PATH } from "./constants.js";

export function getCallbacks() {
	return {
		"mage-armor": {
			toggle: toggleMageArmor,
			isActive: isActive,
		},
	};
}


/* =========================
   Generic callbacks
   ========================= */

async function isActive(actor, def) {
	const item = findPf1BuffByName(actor, def.name);
	if (!item) return false;
	return getPf1BuffActive(item);
}

/* =========================
   Mage Armor
   ========================= */

async function toggleMageArmor(actor, def) {
	const item = await ensurePf1BuffExists(actor, {
		name: def.name,
		img: def.icon,
		changes: [
			{
				formula: "4",
				operator: "add",
				priority: 0,
				target: "aac",
				type: "base",
			},
		],
	});

	await togglePf1BuffItem(actor, item);
}

/* =========================
   PF1 helpers
   ========================= */

function isPf1System() {
	return game.system?.id === "pf1";
}

function findPf1BuffByName(actor, name) {
	if (!actor) return null;

	return actor.items?.find((i) => {
		return i?.type === "buff" && String(i.name ?? "").toLowerCase() === String(name ?? "").toLowerCase();
	}) ?? null;
}

function getPf1BuffActive(buffItem) {
	const s = buffItem?.system ?? {};
	if (typeof s.active === "boolean") return s.active;
	if (typeof s.enabled === "boolean") return s.enabled;
	if (s.active && typeof s.active === "object" && typeof s.active.value === "boolean") return s.active.value;

	return false;
}

async function setPf1BuffActive(buffItem, active) {
	const s = buffItem?.system ?? {};

	if (typeof s.active === "boolean") {
		return buffItem.update({ "system.active": active });
	}
	if (typeof s.enabled === "boolean") {
		return buffItem.update({ "system.enabled": active });
	}
	if (s.active && typeof s.active === "object" && typeof s.active.value === "boolean") {
		return buffItem.update({ "system.active.value": active });
	}

	throw new Error("MispeledGSE | Can't set PF1 buff active state (unknown data shape).");
}

function isManagedByMispeled(item) {
	return !!item?.flags?.[MODULE_ID]?.managed;
}

async function togglePf1BuffItem(actor, buffItem) {
	if (!isPf1System()) {
		ui.notifications.warn("MispeledGSE | Mage Armor callback is PF1-specific.");
		return;
	}
	if (!buffItem) return;

	const wasActive = getPf1BuffActive(buffItem);
	await setPf1BuffActive(buffItem, !wasActive);

	// Delete if ours when turning off (so it doesn't pollute the status list)
	if (wasActive && isManagedByMispeled(buffItem)) {
		await actor.deleteEmbeddedDocuments("Item", [buffItem.id]);
	}
}

async function ensurePf1BuffExists(actor, { name, img, changes = [] }) {
	let existing = findPf1BuffByName(actor, name);
	if (existing) return existing;

	const itemData = {
		name: name,
		type: "buff",
		img: img || `${MODULE_PATH}/icons/buffs.png`,
		system: {
			active: false,
			changes: Array.isArray(changes) ? changes : [],
		},
		flags: {
			[MODULE_ID]: {
				managed: true,
			},
		},
	};

	const created = await actor.createEmbeddedDocuments("Item", [itemData]);
	return created?.[0] ?? findPf1BuffByName(actor, name);
}
