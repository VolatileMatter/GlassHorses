# Horse Game Genetics Modding Guide

## Creating New Genes

This guide explains how to create new genes for the horse genetics system. New genes are created by placing JavaScript files in the `mods/genes/[yourModName]/` folder. The **folder name becomes your mod prefix** (e.g., `mods/genes/mystic/` → `mystic_` prefix for all alleles).

## File Structure

```
mods/genes/
├── mystic/           ← Your mod folder name = prefix
│   ├── unicorn.js    ← Gene files
│   ├── wings.js      ← Multiple genes per mod OK
│   └── fire_mane.js
└── fantasy/
    └── dragon_breath.js
```

## Gene File Requirements

Each gene file **must** export exactly this structure using `module.exports`:

### Template

```javascript
module.exports = {
  name: "unicorn",                    // Gene name (lowercase, no spaces)
  prefix: "mystic",                   // MUST match your folder name
  priority: 200,                      // 0-255 (0=first, 255=last)
  alleles: [
    "mod_mystic_unicorn_H",           // Allele IDs (auto-registered)
    "mod_mystic_unicorn_h", 
    "base_n"                          // Should ALWAYS include the null allele
  ],
  epigenetics: {
    hornLength: {                     // Epigenetic trait name
      noisePercent: 6,                // 0%+ (breeding variation)
      defaultRange: [50, 100]         // Wild horse spawn range
    },
    hornGlow: {
      noisePercent: 4,
      defaultRange: [20, 80]
    }
  },
  
  alterCoat: (ctx) => {
    // Your coat logic here (see advanced guide)
    return { pixels: [], skipCalc: true };
  }
};
```

## Field Specifications

### `name`
- **Type**: String
- **Required**: Yes
- **Format**: Lowercase letters, numbers, underscores only (`unicorn`, `fire_mane`)
- **Purpose**: Human-readable gene name, used in UI
- **Examples**: `"agouti"`, `"unicorn"`, `"flight_wings"`

### `prefix`
- **Type**: String
- **Required**: Yes
- **Format**: Lowercase letters only, **MUST match folder name**
- **Examples**: 
  - Folder `mods/genes/mystic/` → `prefix: "mystic"`
  - Folder `mods/genes/space_horses/` → `prefix: "space_horses"`

### `priority`
- **Type**: Integer
- **Range**: `0` to `255`
- **Processing**: Genes sorted by priority (low→high), then alphabetically within priority
- **Guidelines**:
  | Priority | Purpose | Examples |
  |----------|---------|----------|
  | `0` | Base pigments | `extension`, `agouti`
  | `50` | Dilutions | `champagne`, `cream`
  | `100` | Progressive | `grey`
  | `200` | Additions | `unicorn`, `wings`
  | `255` | Patterns | `splash`, `tobiano`

### `alleles`
- **Type**: Array of strings
- **Format**: `"prefix_name_locusSymbol"`
- **Auto-generated**: AlleleDB built automatically from these
- **Requirements**:
  - Always include `"base_n"` (null allele)
  - Your prefix is auto-applied: `mod_mystic_unicorn_H`
  - `locusSymbol` can be 1-3 characters: `"E"`, `"Cr"`, `"Spl"`

### `epigenetics`
- **Type**: Object of trait definitions
- **Max**: 255 traits per gene
- **Fields per trait**:
  ```javascript
  traitName: {
    noisePercent: 5,      // 0-20 (breeding variation %)
    defaultRange: [50, 100]  // Wild spawn [min, max]
  }
  ```
- **Guidelines**:
  | Trait Type | Example Names | Range |
  |------------|---------------|-------|
  | Length | `hornLength`, `wingSpan` | `[20, 120]` |
  | Intensity | `dilutionStrength`, `glowIntensity` | `[10, 100]` |
  | Speed | `greyingSpeed`, `patternSpread` | `[5, 95]` |

## Acceptable Values Summary

| Field | Type | Valid Values | Notes |
|-------|------|--------------|-------|
| `name` | string | `a-z0-9_` | Lowercase, no spaces |
| `prefix` | string | `a-z` only | Match folder name exactly |
| `priority` | number | `0-255` | Integer only |
| `alleles` | array | Strings | Include `base_n`, use your prefix |
| `noisePercent` | number | `0-20` | Integer or float |
| `defaultRange` | array | `[min, max]` | `0-100`, `min <= max` |

## Collision Protection

**Automatic protection**:
- Duplicate allele IDs across mods → **CRASH on startup**
- Example: `mod_mystic_unicorn_H` + `mod_fantasy_unicorn_H` → ERROR

**Prevention**:
```
✅ Use your folder prefix: mod_mystic_unicorn_H
✅ Don't reuse core alleles: base_extension_E
✅ Always test with other mods installed
```

## Example: Complete Mystic Unicorn Mod

```
mods/genes/mystic/
├── unicorn.js          ← Gene file
```

**`mods/genes/mystic/unicorn.js`**:
```javascript
module.exports = {
  name: "unicorn",
  prefix: "mystic", 
  priority: 200,
  alleles: ["mod_mystic_unicorn_H", "mod_mystic_unicorn_h", "base_n"],
  epigenetics: {
    hornLength: { noisePercent: 6, defaultRange: [50, 100] },
    hornGlow: { noisePercent: 4, defaultRange: [20, 80] }
  },
  
  alterCoat: (ctx) => {
    return { pixels: [], skipCalc: true };
  }
};
```

**Result**: Auto-generates alleles `mod_mystic_unicorn_H`, `mod_mystic_unicorn_h` in alleleDB.

## Testing Your Mod

1. Place in `mods/genes/yourmodname/`
2. Launch game → check console for "Generated alleleDB with X alleles"
3. **No errors** = success
4. Check `alleleDB.json` for your alleles
5. Breed horses → your gene appears in offspring genomes

That's it! Your gene is now part of the system with full inheritance, epigenetic variation, and processing order respected.