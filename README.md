# Mispeled’s Greater Status Effects

**Mispeled’s Greater Status Effects** adds a dedicated buff and debuff interface to the Token HUD for Pathfinder 1e, allowing players and GMs to quickly apply and manage PF1 buffs and debuffs without cluttering Foundry’s default status effect list.

Instead of relying on a fixed list, this module lets you build your own buff and debuff trays by dragging items directly from actor sheets or compendiums, making those effects instantly available for all actors without needing to manually add the buff to each character.

---

## Features

- Adds **Buff** and **Debuff** trays to the Token HUD (similar to status effects)
- Fully **customizable trays** — you choose which buffs/debuffs appear
- **Drag & drop** buff items from actor sheets or compendiums
- One-click toggle for PF1 buff items (on/off)
- Proper PF1 behavior:
  - Imports buffs from compendiums when available
  - Creates temporary managed buffs when needed
  - Automatically cleans up managed buffs when toggled off
- Remove tray entries at any time with a confirmation prompt
- World-level configuration (shared across all users)

---

## Usage

### Opening the Buff / Debuff Tray
1. Select a token.
2. Click the **Mispeled Buff** or **Mispeled Debuff** button in the Token HUD.

### Adding Buffs or Debuffs
1. Open the Buff or Debuff tray.
2. Click the **➕ Add** icon at the bottom of the tray.
3. Drag a **buff Item** from:
   - an actor sheet, or
   - a compendium
4. Confirm by clicking **Add**.

The effect will now appear permanently in the tray.

### Applying an Effect
- Click an effect in the tray to toggle it on or off for the selected token.

### Removing an Effect from the Tray
- Click the **➖ Remove** button on the right side of an effect.
- Confirm removal when prompted.

> Removing an effect from the tray does **not** delete the item itself — it only removes it from the quick-access list.

---

## Notes

- Effects are matched by **name**, following PF1 conventions.
- When possible, buffs are imported from PF1 or world compendiums.
- Buffs created by this module are flagged and automatically cleaned up when disabled.
- The module is PF1-specific and will warn if used in another system.

---

## Compatibility

- Foundry VTT **v13**
- **Pathfinder 1e**

---

## License

MIT License
