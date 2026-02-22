# Horse Genetics System Implementation Guide

**For**: Game Programmer  
**Date**: February 22, 2026  
**Version**: 1.0 Complete Specification

This guide provides **everything needed** to implement the complete genetics system for coat color rendering, breeding, and modding support.

## Table of Contents
1. [Architecture Overview](#architecture)
2. [Data Structures](#datastructures)
3. [File System Layout](#filesystem)
4. [Startup Sequence](#startup)
5. [Breeding Algorithm](#breeding)
6. [Coat Rendering Pipeline](#rendering)
7. [Mod Loading](#modding)
8. [Production Checklist](#checklist)

## Architecture Overview {#architecture}

```
Core Engine → Startup → Generate alleleDB → Load Genes → Ready
                     ↓
            Breed Horses → calculateBirthCoat() → Cache PNG
                     ↓
         Render: Load PNG + Runtime Overlays (scars/greying)
```

**Key Principles**:
- **One-time expensive coat calculation** at birth → cache PNG forever
- **Modular JS genes** → easy extension without core changes  
- **Automatic allele registration** → no manual data entry
- **Collision protection** → modders must use proper prefixes

## Data Structures {#datastructures}

### 1. Horse Genome JSON
```json
{
  "genome": {
    "alleles": [
      {"id": "base_extension_E", "locusSymbol": "E"},
      {"id": "base_extension_e", "locusSymbol": "e"}
    ],
    "genes": {
      "base_extension": {
        "alleles": ["base_extension_E", "base_extension_e"],
        "epigenetics": {
          "pigmentRestriction": 88
        }
      }
    }
  },
  "finalCoat": "coats/horse_123.png",
  "proportions": {"height": 1.2, "legLength": 0.9}
}
```

### 2. Gene Definition (JS Module)
```javascript
module.exports = {
  name: "extension",
  prefix: "base",
  priority: 0,
  alleles: ["base_extension_E", "base_extension_e", "base_n"],
  epigenetics: {
    pigmentRestriction: { noisePercent: 5, defaultRange: [70, 95] }
  },
  alterCoat: (ctx) => { /* logic */ }
};
```

### 3. HorseMask (Runtime Only)
```javascript
{
  width: 256, height: 256,
  spinePixels: [[10,5], [12,6]],
  anchors: { poll: [20,5], leftHoof: [65,180] },
  pixels: [{ red: 100, black: 100, overlay: null, skipCalc: false }]
}
```

## File System Layout {#filesystem}

```
game/
├── src/
│   ├── genetics/
│   │   ├── loader.js       # Generate alleleDB
│   │   ├── breeding.js     # breed() function
│   │   ├── coat.js         # calculateBirthCoat()
│   │   └── mask.js         # Procedural mask generation
│   └── index.js            # Startup
├── genes/                  # Core (prefix: "base")
│   ├── base_extension.js
│   └── base_agouti.js
├── mods/genes/             # Mods (prefix: "mod_[folder]")
│   └── mystic/
│       └── unicorn.js
├── alleleDB.json           # AUTO-GENERATED
├── coats/                  # Cached PNGs
│   └── horse_123.png
└── horses/
    └── horse_123.json
```

## Startup Sequence {#startup}

**`src/genetics/loader.js`** (Complete):
```javascript
const fs = require('fs').promises;
const path = require('path');

async function generateAlleleDB() {
  const alleleDB = {};
  
  // Load core genes
  await loadGeneDirectory('genes', 'base', alleleDB);
  
  // Load modded genes
  const modDirs = await fs.readdir('mods/genes', { withFileTypes: true });
  for (let dir of modDirs.filter(d => d.isDirectory())) {
    await loadGeneDirectory(`mods/genes/${dir.name}`, dir.name, alleleDB);
  }
  
  // Add universal null allele
  alleleDB['base_n'] = {
    prefix: 'base', name: 'null', locusSymbol: 'n', id: 'base_n'
  };
  
  await fs.writeFile('alleleDB.json', JSON.stringify(alleleDB, null, 2));
  return alleleDB;
}

async function loadGeneDirectory(dirPath, prefix, alleleDB) {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  for (let file of files.filter(f => f.name.endsWith('.js'))) {
    const genePath = path.join(dirPath, file.name);
    const gene = require(genePath);
    
    const genePrefix = prefix === 'base' ? 'base' : `mod_${prefix}`;
    for (let alleleId of gene.alleles) {
      if (alleleDB[alleleId]) {
        throw new Error(`Allele collision: ${alleleId}`);
      }
      alleleDB[alleleId] = {
        prefix: genePrefix,
        name: gene.name,
        locusSymbol: alleleId.split('_').pop(),
        id: alleleId
      };
    }
  }
}

module.exports = { generateAlleleDB };
```

## Breeding Algorithm {#breeding}

**`src/genetics/breeding.js`**:
```javascript
function breed(parent1, parent2, alleleDB, geneRegistry) {
  const offspring = { genome: { alleles: [], genes: {} } };
  
  const allGenes = [...new Set([
    ...Object.keys(parent1.genome.genes || {}),
    ...Object.keys(parent2.genome.genes || {})
  ])];
  
  for (let geneName of allGenes) {
    const parent1Data = getGeneData(parent1, geneName);
    const parent2Data = getGeneData(parent2, geneName);
    
    const parentForAllele1 = Math.random() < 0.5 ? parent1Data : parent2Data;
    const parentForAllele2 = Math.random() < 0.5 ? parent1Data : parent2Data;
    
    offspring.genome.genes[geneName] = {
      alleles: [parentForAllele1.alleleId, parentForAllele2.alleleId],
      epigenetics: blendEpigenetics(
        parentForAllele1.epigenetics, 
        parentForAllele2.epigenetics, 
        geneRegistry[geneName]
      )
    };
  }
  
  return offspring;
}

function blendEpigenetics(epi1, epi2, geneDef) {
  const result = {};
  for (let [trait, def] of Object.entries(geneDef.epigenetics)) {
    const sourceEpi = epi1[trait] !== undefined ? epi1[trait] : epi2[trait];
    const noise = def.noisePercent / 100;
    result[trait] = Math.max(0, Math.min(100, 
      sourceEpi * (1 + (Math.random() * 2 - 1) * noise)
    ));
  }
  return result;
}
```

## Coat Rendering Pipeline {#rendering}

**`src/genetics/coat.js`** (Simplified):
```javascript
async function calculateBirthCoat(horse, alleleDB, geneRegistry) {
  const mask = createProceduralMask(horse.proportions);
  
  const sortedGenes = Object.keys(horse.genome.genes)
    .map(name => ({ name, priority: geneRegistry[name].priority }))
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    .map(g => g.name);
  
  for (let geneName of sortedGenes) {
    const geneData = horse.genome.genes[geneName];
    const alleles = geneData.alleles.map(id => alleleDB[id]);
    
    const ctx = {
      geneName,
      myAlleles: alleles,
      myEpigenetics: geneData.epigenetics,
      mask
    };
    
    const overlay = geneRegistry[geneName].alterCoat(ctx);
    applyOverlay(mask, overlay);
  }
  
  const filename = `coats/horse_${Date.now()}.png`;
  await bakeMaskToPNG(mask, filename);
  horse.finalCoat = filename;
}
```

## Modding Guide {#modding}

**See separate "Modding Guide.md"** (already provided) for modders.

## Production Checklist {#checklist}

### Required Files to Create
```
□ src/genetics/loader.js          [Provided above]
□ src/genetics/breeding.js        [Provided above]  
□ src/genetics/coat.js           [Skeleton provided]
□ src/genetics/mask.js           [Procedural spine/anchor generation]
□ src/index.js                   [Startup sequence]
□ genes/base_*.js                [6 core genes provided earlier]
□ Modding Guide.md               [Provided earlier]
```

### Required Core Genes (Priority Order)
```
□ base_extension.js     (priority: 0)
□ base_agouti.js        (priority: 0) 
□ base_champagne.js     (priority: 50)
□ base_cream.js         (priority: 50)
□ base_grey.js          (priority: 100)
□ base_splash.js        (priority: 255)
```

### Test Cases
```
□ [ ] Startup generates alleleDB.json (no collisions)
□ [ ] Breed two horses → readable genome output
□ [ ] calculateBirthCoat() → valid PNG cached
□ [ ] Add mod → auto-registers alleles
□ [ ] Duplicate mod alleles → crashes with error
□ [ ] UI displays "base_extension_E/e" correctly
```

## Implementation Priority

```
1. HIGH: loader.js + startup (2 hours)
2. HIGH: breeding.js (1 hour) 
3. MEDIUM: coat.js + mask.js (4-6 hours)
4. LOW: Runtime overlays (greying/scars) (2 hours)
5. LOW: UI display (1 hour)
```

## Success Criteria

When complete:
- ✅ Startup auto-generates `alleleDB.json`
- ✅ `E/e × A/a` → readable bay horse genome  
- ✅ `calculateBirthCoat()` → `coats/*.png`
- ✅ Mod in `mods/genes/test/` → auto-registers alleles
- ✅ Duplicate alleles → console crash + error

**Total implementation time**: ~12-15 hours for experienced Node.js developer.

***

**Ready to implement?** Start with `loader.js` + core 6 genes → test startup → breed horses → coat rendering. Ping for clarifications on mask generation or PNG baking APIs.