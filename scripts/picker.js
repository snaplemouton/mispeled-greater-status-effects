// scripts/picker.js
import { MODULE_ID, MODULE_PATH } from "./constants.js";
import { toggleGenericEffect } from "./callbacks.js";

let _activePicker = null;
let _activePickerType = null; // "buff" | "debuff"
let _activeButton = null;
let _outsideCloseHandler = null;
let _escCloseHandler = null;

export async function openMispeledPicker(token, type, buttonEl) {
	const hud = canvas?.hud?.token;
	if (!hud?.object || !token || hud.object.id !== token.id) return;

	const hudEl = document.getElementById("token-hud");
	if (!hudEl) return;

	const rightCol = hudEl.querySelector(".col.right");
	if (!rightCol) return;

	closeMispeledPicker();
	if (_activePicker && _activePickerType === type && _activeButton === buttonEl) {
		return;
	}

	const palette = document.createElement("div");
	palette.className = `palette mispeled-effects ${type}`;
	palette.dataset.mispeledPicker = type;

	// =========================
	// Custom list from settings
	// =========================
	const settingKey = type === "buff" ? "customBuffs" : "customDebuffs";
	const uuids = game.settings.get(MODULE_ID, settingKey) ?? [];

	const docs = await Promise.all(
		uuids.map(async (uuid) => {
			try {
				return await fromUuid(uuid);
			} catch {
				return null;
			}
		})
	);

	let anyEntries = false;

	for (let i = 0; i < uuids.length; i++) {
		const uuid = uuids[i];
		const doc = docs[i];

		if (!doc?.name || !doc?.img) continue;
		anyEntries = true;

		const def = {
			id: uuid,
			uuid,
			name: doc.name,
			icon: doc.img,
			callbacks: { toggle: toggleGenericEffect },
		};

		const entry = document.createElement("a");
		entry.className = "mispeled-effect";
		entry.dataset.effectId = def.id;
		entry.title = def.name;

		// Wrap contents so we can add a right-side remove button
		entry.innerHTML = `
			<div class="mispeled-effect-row" style="display:flex;align-items:center;gap:8px;width:100%;">
				<img class="mispeled-effect-icon" src="${def.icon}" alt="${def.name}">
				<span class="mispeled-effect-name" inert style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
					${def.name}
				</span>

				<button type="button"
					class="mispeled-effect-remove"
					title="Remove from tray"
					style="
						display:flex;align-items:center;justify-content:center;
						width:24px;height:24px;
						border:0;border-radius:6px;
						background:rgba(0,0,0,0.25);
						cursor:pointer;
						padding:0;
						flex:0 0 auto;
					">
					<img src="${MODULE_PATH}/icons/minus.png" alt="-" style="width:18px;height:18px;">
				</button>
			</div>
		`;

		// Clicking the entry toggles the effect
		entry.addEventListener("click", async (ev) => {
			ev.preventDefault();
			ev.stopPropagation();

			const actor = token.actor;
			if (!actor) {
				ui.notifications.warn("No actor on this token.");
				return;
			}

			await toggleMispeledEffect(actor, def);
		});

		const removeBtn = entry.querySelector(".mispeled-effect-remove");
		removeBtn?.addEventListener("click", async (ev) => {
			ev.preventDefault();
			ev.stopPropagation();

			await confirmAndRemoveCustomEffect(type, uuid, def.name);

			const stillThere = (game.settings.get(MODULE_ID, settingKey) ?? []).includes(uuid);
			if (!stillThere) entry.remove();

			if (!palette.querySelector(".mispeled-effect:not(.mispeled-effect-add)")) {
				const empty = document.createElement("div");
				empty.className = "mispeled-effects-empty";
				empty.style.opacity = "0.75";
				empty.style.fontSize = "12px";
				empty.style.padding = "6px 8px";
				empty.textContent = "No custom effects yet. Use + to add one.";
				palette.appendChild(empty);
			}
		});

		palette.appendChild(entry);
	}

	if (!anyEntries) {
		const empty = document.createElement("div");
		empty.className = "mispeled-effects-empty";
		empty.style.opacity = "0.75";
		empty.style.fontSize = "12px";
		empty.style.padding = "6px 8px";
		empty.textContent = "No custom effects yet. Use + to add one.";
		palette.appendChild(empty);
	}

	const addEntry = document.createElement("a");
	addEntry.className = "mispeled-effect mispeled-effect-add";
	addEntry.dataset.action = "add-custom";
	addEntry.title = type === "buff" ? "Add custom buff to tray" : "Add custom debuff to tray";

	const addLabel = type === "buff" ? "Add Buff" : "Add Debuff";
	addEntry.innerHTML = `
		<img class="mispeled-effect-icon" src="${MODULE_PATH}/icons/plus.png" alt="+">
		<span class="mispeled-effect-name" inert>${addLabel}</span>
	`;

	addEntry.addEventListener("click", (ev) => {
		ev.preventDefault();
		ev.stopPropagation();
		openAddCustomEffectDialog(type);
	});

	palette.appendChild(addEntry);

	if (buttonEl && rightCol.contains(buttonEl)) {
		buttonEl.insertAdjacentElement("afterend", palette);
	} else {
		rightCol.prepend(palette);
	}

	if (buttonEl) buttonEl.classList.add("active");

	_activePicker = palette;
	_activePickerType = type;
	_activeButton = buttonEl;

	requestAnimationFrame(() => {
		if (!buttonEl || !_activePicker) return;

		const btnRect = buttonEl.getBoundingClientRect();
		const colRect = rightCol.getBoundingClientRect();
		const paletteRect = _activePicker.getBoundingClientRect();
		const buttonCenterY = btnRect.top + (btnRect.height / 2);
		const relativeCenterY = buttonCenterY - colRect.top;
		const top = Math.round(relativeCenterY - (paletteRect.height / 2));

		_activePicker.style.top = `${top}px`;
	});

	_outsideCloseHandler = (ev) => {
		if (!_activePicker) return;

		const t = ev.target;
		const insidePicker = _activePicker.contains(t);
		const onButton = _activeButton ? _activeButton.contains(t) : false;

		if (!insidePicker && !onButton) closeMispeledPicker();
	};

	_escCloseHandler = (ev) => {
		if (ev.key === "Escape") closeMispeledPicker();
	};

	requestAnimationFrame(() => {
		document.addEventListener("pointerdown", _outsideCloseHandler, true);
		document.addEventListener("keydown", _escCloseHandler, true);
	});
}

export function closeMispeledPicker() {
	if (_activePicker) _activePicker.remove();
	_activePicker = null;
	_activePickerType = null;

	if (_activeButton) _activeButton.classList.remove("active");
	_activeButton = null;

	if (_outsideCloseHandler) {
		document.removeEventListener("pointerdown", _outsideCloseHandler, true);
		_outsideCloseHandler = null;
	}
	if (_escCloseHandler) {
		document.removeEventListener("keydown", _escCloseHandler, true);
		_escCloseHandler = null;
	}
}

async function toggleMispeledEffect(actor, def) {
	const cb = def?.callbacks?.toggle;
	if (!cb) {
		ui.notifications.warn(`MispeledGSE | No toggle callback for "${def?.name ?? def?.id}"`);
		return;
	}
	await cb(actor, def);
}

async function confirmAndRemoveCustomEffect(type, uuid, name) {
	const settingKey = type === "buff" ? "customBuffs" : "customDebuffs";

	return new Promise((resolve) => {
		new Dialog({
			title: "Remove from tray?",
			content: `
				<p>Remove <strong>${name}</strong> from your ${type} tray?</p>
				<p style="opacity:0.75;font-size:12px;margin-top:6px;">This does not delete the item itself.</p>
			`,
			buttons: {
				remove: {
					icon: '<i class="fas fa-trash"></i>',
					label: "Remove",
					callback: async () => {
						const current = game.settings.get(MODULE_ID, settingKey) ?? [];
						const next = current.filter((u) => u !== uuid);
						await game.settings.set(MODULE_ID, settingKey, next);
						resolve(true);
					},
				},
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => resolve(false),
				},
			},
			default: "cancel",
		}).render(true);
	});
}

/* =========================
   Add-custom dialog
   ========================= */

function openAddCustomEffectDialog(type) {
	const title = type === "buff" ? "Add Custom Buff" : "Add Custom Debuff";
	const settingKey = type === "buff" ? "customBuffs" : "customDebuffs";

	const REMOVE_PREVIEW_ICON = `${MODULE_PATH}/icons/minus.png`;

	let selected = null; // { uuid, name, img }

	const renderDropZone = () => `
		<div class="mispeled-dropzone" style="
			display:flex;align-items:center;justify-content:center;
			border:2px dashed rgba(255,255,255,0.35);
			border-radius:8px;
			padding:16px;
			min-height:84px;
			text-align:center;
		">
			<div style="opacity:0.9;">
				<div style="font-size:14px;margin-bottom:6px;">Drag & drop an Item here</div>
				<div style="font-size:12px;opacity:0.75;">(from a sheet or compendium)</div>
			</div>
		</div>
	`;

	const renderPreview = (doc) => `
		<div class="mispeled-drop-preview" style="
			display:flex;align-items:center;gap:10px;
			border:1px solid rgba(255,255,255,0.25);
			border-radius:8px;
			padding:10px 12px;
		">
			<img src="${doc.img}" alt="${doc.name}" style="width:36px;height:36px;border:0;border-radius:4px;">
			<div style="flex:1;min-width:0;">
				<div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
					${doc.name}
				</div>
			</div>
			<button type="button" class="mispeled-preview-remove" title="Clear" style="
				display:flex;align-items:center;justify-content:center;
				width:32px;height:32px;
				border:0;border-radius:6px;
				background:rgba(0,0,0,0.25);
				cursor:pointer;
				padding:0;
			">
				<img src="${REMOVE_PREVIEW_ICON}" alt="-" style="width:20px;height:20px;">
			</button>
		</div>
	`;

	const readDragData = (ev) => {
		try {
			return TextEditor.getDragEventData(ev);
		} catch (e) {
			try {
				const raw = ev.dataTransfer?.getData("text/plain");
				return raw ? JSON.parse(raw) : null;
			} catch {
				return null;
			}
		}
	};

	const isItemDrop = (data) => {
		if (!data) return false;
		return data.type === "Item" || data.documentName === "Item";
	};

	const loadItemFromData = async (data) => {
		const uuid = data?.uuid;
		if (!uuid) return null;
		const doc = await fromUuid(uuid);
		if (!doc?.name || !doc?.img) return null;
		return doc;
	};

	const dlg = new Dialog(
		{
			title,
			content: `
				<div class="mispeled-add-custom" style="display:flex;flex-direction:column;gap:10px;">
					<div class="mispeled-add-custom-body">
						${renderDropZone()}
					</div>
					<p style="margin:0;font-size:12px;opacity:0.75;">
						Drop an Item here. Then click Add to save it to the tray.
					</p>
				</div>
			`,
			buttons: {
				add: {
					icon: '<i class="fas fa-plus"></i>',
					label: "Add",
					callback: async () => {
						if (!selected?.uuid) {
							ui.notifications.warn("Drop an Item first.");
							return false;
						}

						const current = game.settings.get(MODULE_ID, settingKey) ?? [];
						if (current.includes(selected.uuid)) {
							ui.notifications.info("That effect is already in your tray.");
							return true;
						}

						await game.settings.set(MODULE_ID, settingKey, [...current, selected.uuid]);
						ui.notifications.info(`Added "${selected.name}" to ${type} tray.`);

						return true;
					},
				},
				cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel" },
			},
			default: "add",
		},
		{}
	);

	const onRenderDialog = (app, html) => {
		if (app !== dlg) return;
		Hooks.off("renderDialog", onRenderDialog);

		const root = html[0];
		const body = root.querySelector(".mispeled-add-custom-body");
		if (!body) return;

		const addBtn = root.querySelector('button[data-button="add"]');
		const setAddEnabled = (enabled) => {
			if (addBtn) addBtn.disabled = !enabled;
		};

		setAddEnabled(false);

		const bindDropzone = () => {
			const dz = root.querySelector(".mispeled-dropzone");
			if (!dz) return;

			dz.addEventListener("dragover", (ev) => {
				ev.preventDefault();
				ev.dataTransfer.dropEffect = "copy";
				dz.style.borderColor = "rgba(255,255,255,0.6)";
			});

			dz.addEventListener("dragleave", () => {
				dz.style.borderColor = "rgba(255,255,255,0.35)";
			});

			dz.addEventListener("drop", async (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				dz.style.borderColor = "rgba(255,255,255,0.35)";

				const data = readDragData(ev);
				if (!isItemDrop(data)) {
					ui.notifications.warn("Please drop an Item here.");
					return;
				}

				const doc = await loadItemFromData(data);
				if (!doc) {
					ui.notifications.warn("Could not resolve the dropped Item.");
					return;
				}

				selected = { uuid: doc.uuid, name: doc.name, img: doc.img };
				body.innerHTML = renderPreview(doc);
				bindPreview();
				setAddEnabled(true);
			});
		};

		const bindPreview = () => {
			const btn = root.querySelector(".mispeled-preview-remove");
			if (!btn) return;

			btn.addEventListener("click", (ev) => {
				ev.preventDefault();
				ev.stopPropagation();

				selected = null;
				body.innerHTML = renderDropZone();
				bindDropzone();
				setAddEnabled(false);
			});
		};

		bindDropzone();
	};

	Hooks.on("renderDialog", onRenderDialog);
	dlg.render(true);
}
