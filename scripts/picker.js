// scripts/picker.js
import { MISPELED_BUFFS, MISPELED_DEBUFFS } from "./constants.js";

let _activePicker = null;
let _activePickerType = null; // "buff" | "debuff"
let _activeButton = null;
let _outsideCloseHandler = null;
let _escCloseHandler = null;

export function openMispeledPicker(token, type, buttonEl) {
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

	const defs = type === "buff" ? MISPELED_BUFFS : MISPELED_DEBUFFS;

	const palette = document.createElement("div");
	palette.className = `palette mispeled-effects ${type}`;
	palette.dataset.mispeledPicker = type;

	for (const def of defs) {
		const entry = document.createElement("a");
		entry.className = "mispeled-effect";
		entry.dataset.effectId = def.id;
		entry.title = def.name;

		entry.innerHTML = `
			<img class="mispeled-effect-icon" src="${def.icon}" alt="${def.name}">
			<span class="mispeled-effect-name" inert>${def.name}</span>
		`;

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

		palette.appendChild(entry);
	}

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
