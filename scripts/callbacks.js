// scripts/callbacks.js
import { MODULE_ID, MODULE_PATH } from "./constants.js";

export function getCallbacks() {
	return {
        // Buffs
		"mage-armor": {
			toggle: toggleMageArmor,
			isActive: isActive,
		},
		"shield": {
			toggle: toggleShield,
			isActive: isActive,
		},
        // Debuffs
		"bane": {
			toggle: toggle,
			isActive: isActive,
		},
		"burning": {
			toggle: toggle,
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

async function toggle(actor, def) {
	const item = await ensurePf1BuffExists(actor, {
		name: def.name,
		img: def.icon,
	});

	await togglePf1BuffItem(actor, item);
}

/* =========================
   Specific callbacks
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

async function toggleShield(actor, def) {
	const item = await ensurePf1BuffExists(actor, {
		name: def.name,
		img: def.icon,
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

	return (
		actor.items?.find((i) => {
			return (
				i?.type === "buff" &&
				String(i.name ?? "").toLowerCase() === String(name ?? "").toLowerCase()
			);
		}) ?? null
	);
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
		ui.notifications.warn("MispeledGSE | This callback is PF1-specific.");
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

/* =========================
   Compendium lookup + import
   ========================= */

const _packIndexCache = new Map();

function isEligibleItemPack(pack) {
	if (!pack || pack.documentName !== "Item") return false;

	const pkg = pack.metadata?.package;
	const sys = pack.metadata?.system;
	if (pkg === "pf1" || sys === "pf1") return true;
	if (pkg === "world") return true;

	return false;
}

async function getPackIndex(pack) {
	const key = pack.collection;
	if (_packIndexCache.has(key)) return _packIndexCache.get(key);

	// Index with fields we need
	const idx = await pack.getIndex({ fields: ["name", "type"] });
	_packIndexCache.set(key, idx);
	return idx;
}

async function findPf1BuffInCompendiumsByName(name) {
	const needle = String(name ?? "").toLowerCase();
	if (!needle) return null;

	for (const pack of game.packs) {
		try {
			if (!isEligibleItemPack(pack)) continue;

			const idx = await getPackIndex(pack);
			const hit = idx.find((e) => {
				return (
					String(e?.type ?? "").toLowerCase() === "buff" &&
					String(e?.name ?? "").toLowerCase() === needle
				);
			});

			if (!hit) continue;

			const doc = await pack.getDocument(hit._id);
			if (doc) return doc;
		} catch (err) {
			console.warn("MispeledGSE | Compendium scan error:", pack?.collection, err);
		}
	}

	return null;
}

async function importBuffToActor(actor, buffDoc, { changes } = {}) {
	if (!actor || !buffDoc) return null;

	const data = buffDoc.toObject();
	delete data._id;

	const srcChanges = data.system?.changes;
	const hasChanges = Array.isArray(srcChanges) && srcChanges.length > 0;
	if (!hasChanges && Array.isArray(changes) && changes.length > 0) {
		data.system = data.system ?? {};
		data.system.changes = changes;
	}

	data.system = data.system ?? {};
	if (typeof data.system.active === "boolean") data.system.active = false;
	else if (
		data.system.active &&
		typeof data.system.active === "object" &&
		typeof data.system.active.value === "boolean"
	) {
		data.system.active.value = false;
	} else {
		data.system.active = false;
	}

	data.flags = data.flags ?? {};
	data.flags[MODULE_ID] = { ...(data.flags[MODULE_ID] ?? {}), managed: true };

	const created = await actor.createEmbeddedDocuments("Item", [data]);
	return created?.[0] ?? findPf1BuffByName(actor, data.name);
}

async function ensurePf1BuffExists(actor, { name, img, changes = [] }) {
	// 1) Already on actor
	let existing = findPf1BuffByName(actor, name);
	if (existing) return existing;

	// 2) Found in compendiums -> import to actor (keep compendium img)
	const compDoc = await findPf1BuffInCompendiumsByName(name);
	if (compDoc) {
		const imported = await importBuffToActor(actor, compDoc, { changes });
		if (imported) return imported;
	}

	// 3) Fallback: create a minimal buff item (use your custom icon here)
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
