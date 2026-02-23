## Grazing Module: Final Specification

Grazing is the daily survival-to-culture engine. Every horse works. **Herd morale = average of all individual horse morale levels** (0-100). Early game = prey animal survival against predators/Esrohs and the **Necrocratic Dragon**.

## Access & Flow
```
Morning Event → Grazing Screen → 
Assign ALL horses to roles → Breeding → Food management → 
[Travel roles if moving] → END DAY → Sleep Resolution
```

## Horse Participation Rules
- **ALL horses** get roles (no idling)
- **Physical state modifiers**:
  | State | Efficiency Impact |
  |-------|------------------|
  | Pregnant mare | -20% Forager/Scout |
  | New mother (foal <1yr) | -25% physical roles, foal +10% skill gain |
  | Malnourished (1+ levels) | -5% speed per level |
  | Injured | -15-50% based on severity |

**Individual morale** affects role efficiency: <30 morale = -20% efficiency.

## Complete Role List

| Role | Type | Daily XP Gain | Effects |
|------|------|---------------|---------|
| **Sentinel** | Daily | +25 XP | Early warnings (critical early-game vs Esroh/predators) |
| **Forager** | Daily | +30 XP | Biome resources (5 targeting modes) |
| **Healer** | Daily | +25 XP | Treatments, herb conversion |
| **Storyteller** | Long-term | +15 XP (Day 8+) | Shares journal → individual morale boost |
| **Teacher** | Daily | +10 XP | **100 XP ÷ all Students** (1 student optimal) |
| **Student** | Daily | **2x base XP** | Learns assigned role + Teacher bonus |
| **Artisan** | Daily | +20 XP | Materials → trade art |
| **Scout** | Daily | +35 XP | Adjacent tile intel/resources |
| **Socialize** | Daily | +10 XP | Energy + individual morale recovery (all horses eligible) |
| **Priest/ess** | Long-term | +20 XP (Day 8+) | Ceremonies boost individual morale |

## Forager Targeting System (5 Modes)
```
**KNOWN ITEMS** (previously discovered): 100% focus, -40% total yield
**ANY ITEM** (random biome distribution): Normal yield
**FOOD ITEMS** (fruits/nuts): +20% food yield, -20% other
**MEDICINAL** (herbs): Healer conversion ×2
**TRADE ITEMS** (gems, gold dust): Artisan ×1.5 value

Individual targeting per Forager:
DawnFire → FOOD ITEMS | Ember → KNOWN: Moonstone
```

**Discovery**: First find unlocks "KNOWN ITEMS" for all Foragers.

## Food & Malnutrition System
```
FOOD (0-100%):
Grass only: +10%/hour (10hr full recovery)
FOOD ITEMS: +30-75%/item
Meals: +100%/serving

MALNUTRITION (0-14 levels):
End Day 0% food → +1 level (-5% speed/strength per level)
Healing: 24hrs >50% food → -1 level
Level 14: Death + journal entry
```

## Breeding & Relationships
```
Healthy + Fertile → 2min breeding (-5% energy)
Individual morale effect:
• Positive relationship: +8 both horses
• Neutral: 0 change
• Negative: -10 both horses
```
**Herd morale** = average of all individual morale → affects breeding success.

## Weather Effects
| Weather | Sentinel | Forager | Healer | Socialize |
|---------|----------|---------|--------|-----------|
| **Sunny** | Normal | +15% | Normal | +10% energy |
| **Rain** | Normal | -20% | +Herbs | +15% morale |
| **Pollution** | -Warnings | -40% | -30% | Morale risk |
| **Storm** | Normal | None | Normal | Normal |

## UI Layout: Herd Assignment
```
🌤️ SUNNY | 💚 HERD MORALE: 68/100 (Avg) | 🍎 AVG FOOD: 65% | 🥩 MALNUTRITION: 2 horses

HERD (28 horses)                          ROLE PROGRESS
DawnFire     [Forager★] FOOD ITEMS       → 2,847/5k (+30 XP) [Reassign ▼]
Ember        [Student☆] Healing         → Teacher: RiverSong [Reassign ▼] 
RiverSong    [Teacher]  Healing         → 100XP÷2 students [LOCKED]
StormChaser  [Sentinel★]                → Esroh watch        [Reassign ▼]
Foal-Spark   [w/ mom]  [Socialize]      → +10 Social XP      [Reassign ▼]
ElderLeaf    [Priestess]                → Day 4/7 (57%)      [LOCKED]

ROLE SUMMARY
Forager: 4 (FOOD×1, Moonstone×1, Random×1, Herbs×1)
Teaching: RiverSong → Ember(50XP), Spark(50XP)
INDIVIDUAL MORALE: DawnFire(82) Ember(71) RiverSong(64)...

FORAGER TARGETS: [KNOWN: Moonstone ●] [FOOD ○] [TRADE □] [MEDICINAL ■]

[ RELATIONSHIP MATRIX ] [ CRAFTING ] [ JOURNAL ] [ END DAY ]
```

## Daily Resolution Sequence
```
1. Roles execute → Forager yields → inventory
2. **Teaching**: 100XP ÷ Students (1 student = 100% transfer)
3. **Food consumption** → Malnutrition check
4. **Breeding** → Individual morale changes → Herd morale recalc
5. **Skill XP gained** → Role progression
6. **Storytellers** → Individual morale from shared memories
7. **Priest/ess** → Culture-specific morale boosts
8. Energy/food tick down, weather carries
9. **Narrative journal** entry (survival vs Esroh/predators)
```

## Progression Arc: Survival → Culture

**SURVIVAL PHASE** (Necrocratic Dragon threat):
```
All Sentinels/Foragers/Healers
• Esroh patrols force constant movement
• Predators → malnutrition deaths
• No known forage → FOOD ITEMS focus
• Herd morale <40 → panic risk
```
**You're prey animals** hiding from the Necrocratic Dragon's Esrohs.

**STABILIZATION PHASE**:
```
Scouts unlock KNOWN ITEMS
Teachers create specialists
Food security → first Storytellers
```

**CULTURE PHASE** (late game):
```
Priestess + Storytellers maintain high herd morale
Foals born with 1,000+ XP (mom + rites + teachers)
Artisans fund alliances vs Necrocratic Dragon
Specialized Forager teams (FOOD/MEDICINE/TRADE)
```

## Morale Integration (Individual → Herd)
```
HERD MORALE = AVG(all individual morale)
Individual sources:
• Storytellers: +3-8/horse listening
• Socialize: +5-10/horse
• Priestess: +10-20/herd
• Breeding: +8/-10/pair
• Malnutrition: -3/level

LOW HERD MORALE EFFECTS (<40):
• XP gain -30%, breeding -50%
• Horses may flee Esroh encounters
HIGH MORALE (>80): +15% yields, joiners approach
```

## Genetics Integration
```
ROLE BONUSES:
• Stamina → Physical roles
• Perception → Sentinel/Scout
• Charisma → Storyteller/Socialize/Priestess
FOALS: Mom's XP(10%) + Teacher + Rites
```

**Core progression**: Prey → Specialists → Culture warriors against the Necrocratic Dragon. Every role assignment builds this arc.