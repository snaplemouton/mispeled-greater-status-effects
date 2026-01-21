# Mispeled’s Greater Status Effects

**Mispeled’s Greater Status Effects** adds a dedicated buff and debuff interface to the Token HUD for Pathfinder 1e, allowing players and GMs to quickly apply common spell and condition effects (such as Mage Armor, Shield, and Ward) with proper PF1 rules and stacking—without cluttering Foundry’s default status effect list.

## Features

- Add buff/debuff trays to token quickbar (Similar to status effects)
- Provides a plethora of pf1e buffs and debuffs already provided by the add-on
- Allow to add custom buff to the buff/debuff trays to make them available globally

---

## Adding new buff to code

1) Create the buff manually on a character token.
2) Open console
3) Select token with the buff and use this code in console (Changing the buff name to the name of the buff)
```const a = canvas.tokens.controlled[0]?.actor;
const it = a?.items?.find(i => i.type === "buff" && i.name === "Mage Armor");
it?.toObject();```
4) Use the information received from it (Mainly from the `change` section) to create the buff in code

---

## Compatibility

- Foundry VTT v13
- Pathfinder 1e

## License

MIT License
