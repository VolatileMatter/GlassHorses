# Grazing Module Specification

Version 2.0 | Status: Authoritative

---

## Overview

Grazing is the daily management phase where the player assigns every horse in the herd to a role. It is the primary survival and culture-building engine of the game. All resource gathering, skill development, relationship management, and cultural progression happen here or are resolved at the end of the grazing day.

**See also**: RoleSpecification.md (full role definitions), SleepSpecification.md (end-of-day resolution), CultureSpecification.md (culture trait system), TravelSpecification.md (travel phase).

---

## Access & Flow

```
Morning Event → Grazing Screen → Assign ALL horses to roles → [Breeding] → END DAY → Sleep Resolution
```

The player cannot end the day until every horse has been assigned a role. There is no idling state.

---

## Horse Participation Rules

Every horse must be assigned a role every day, including injured and pregnant horses. Role eligibility depends on the horse's physical state.

### Physical State Modifiers

| State | Efficiency Impact |
|-------|------------------|
| Pregnant mare | −20% Forager/Scout efficiency |
| New mother (foal under 1yr with her) | −25% physical roles; foal gains +10% skill XP |
| Malnourished (1+ levels) | −5% speed and strength per level |
| Injured (walk-capable) | −15–50% efficiency depending on severity |
| Cannot walk (injured) | Ineligible for physical roles; auto-assigned Storyteller (see below) |

### Cannot-Walk Horses

A horse that cannot walk is **automatically assigned to the Storyteller role** the day after the injury occurs. This auto-assignment skips the normal 7-day Storyteller learning period — the horse becomes an active Storyteller immediately. This offset is intentional: it partially compensates for the hard travel block that cannot-walk horses impose on the herd.

Cannot-walk horses are eligible for Socialize in addition to Storyteller. They are **not** eligible for Priest/ess, Forager, Sentinel, Scout, Healer, Teacher, Student, or Artisan.

Cannot-walk horses who choose to take the Priest/ess role (if the player manually overrides) still require the full 7-day learning period with no output during that time.

### Yearlings (Age 1yr+)

At exactly 1 year of age, a horse graduates from foal status and becomes eligible for all roles without restriction. Prior to this birthday, foals follow their mother and cannot be independently assigned.

### Individual Morale Effect

A horse with individual morale below 30 operates at −20% efficiency in all roles.

---

## Forager Targeting System

Each Forager can be assigned one of five targeting modes. Targeting is set per individual horse.

| Mode | Effect |
|------|--------|
| **Known Items** | 100% focus on previously discovered items; −40% total yield |
| **Any Item** | Normal yield across all biome distributions |
| **Food Items** | +20% food yield; −20% all other yields |
| **Medicinal** | Herbs yielded at 2× normal rate for Healer conversion |
| **Trade Items** | Gems and gold dust yielded at 1.5× Artisan value |

**Discovery**: The first time any item is found, it is added to the "Known Items" list for all Foragers in the herd.

---

## Food & Malnutrition System

### Food Level (0–100%)

| Source | Recovery Rate |
|--------|--------------|
| Grass only | +10% per hour (full recovery in ~10 hours) |
| Food Items (foraged) | +30–75% per item |
| Prepared meals | +100% per serving |

### Malnutrition (0–14 levels)

- Ending a day at 0% food adds +1 malnutrition level
- Each level applies −5% speed and strength permanently until healed
- Healing: 24 consecutive hours above 50% food removes 1 level
- Level 14: death, with a journal entry generated

---

## Breeding & Relationships

Breeding resolves automatically during the grazing phase when eligible horses are in proximity.

- **Conditions**: Both horses healthy and fertile; −5% energy cost to both
- **Relationship effect on individual morale**:
  - Positive relationship: +8 morale to both horses
  - Neutral: no change
  - Negative: −10 morale to both horses

**Miscarriage risk**: A pregnant mare runs no miscarriage risk during the grazing phase unless she is attacked. Attack during grazing triggers a miscarriage check.

---

## Herd Morale

```
HERD MORALE = Average of all individual horse morale values (0–100)
```

The herd morale cap is **100**. It cannot exceed this value regardless of bonuses.

Cannot-walk horses contribute fully to the herd morale average via Storyteller and Socialize outputs.

### Individual Morale Sources

| Source | Effect |
|--------|--------|
| Storytellers sharing memories | +3–8 per horse listening |
| Socialize role | +5–10 per horse |
| Priest/ess ceremonies (post-activation) | +10–20 herd-wide |
| Positive breeding relationship | +8 |
| Negative breeding relationship | −10 |
| Malnutrition | −3 per level |

### Herd Morale Thresholds

| Range | Effect |
|-------|--------|
| <30 | XP gain −30%; breeding success −50% |
| 30–60 | Survival focus; no bonuses |
| 60–80 | Stabilization range |
| >80 | +15% all yields; joiners may approach herd |

---

## Weather Effects on Grazing

| Weather | Sentinel | Forager | Healer | Socialize |
|---------|----------|---------|--------|-----------|
| **Sunny** | Normal | +15% | Normal | +10% energy recovery |
| **Rain** | Normal | −20% | +Herb yield | +15% morale |
| **Pollution** | −Warning range | −40% | −30% | Morale risk |
| **Storm** | Normal | No yield | Normal | Normal |

---

## Daily Resolution Sequence

Resolution happens automatically when the player ends the day. See SleepSpecification.md for the full sleep phase. The grazing-specific resolution order is:

1. Foragers return → inventory populated with target-modified yields
2. Teaching resolves: Teacher distributes `100 × teacher_skill_level` XP divided equally among all assigned Students. Teacher personally gains +10 XP.
3. Food consumption calculated → malnutrition check run
4. Breeding resolves → pregnancies flagged, individual morale updated → herd morale recalculated
5. Skill XP awarded to all horses for their assigned roles
6. Storytellers spread journal memories → individual morale updated
7. Priest/ess rites resolve (post-activation only) → culture trait gains and morale boosts applied
8. Energy and food tick; weather carries into next morning

---

## UI Layout

```
🌤️ SUNNY | 💚 HERD MORALE: 68/100 | 🍎 AVG FOOD: 65% | 🥩 MALNUTRITION: 2 horses

HERD (28 horses)                           ROLE PROGRESS
DawnFire     [Forager★] FOOD ITEMS        → 2,847/5k (+30 XP)        [Reassign ▼]
Ember        [Student☆] Healing           → Teacher: RiverSong        [Reassign ▼]
RiverSong    [Teacher]  Healing           → 100×Lv8 XP ÷ 2 students  [LOCKED]
StormChaser  [Sentinel★]                  → Esroh watch               [Reassign ▼]
Foal-Spark   [w/ mom]  [Socialize]        → +10 Social XP             [Reassign ▼]
ElderLeaf    [Priestess]                  → Day 4/7 (57%)             [LOCKED]
BrokenLeg    [Storyteller — auto]         → Active (injured Day 1)    [Reassign ▼]

ROLE SUMMARY
Forager: 4 (FOOD×1, Moonstone×1, Random×1, Herbs×1)
Teaching: RiverSong Lv8 → Ember (400 XP), Spark (400 XP)
INDIVIDUAL MORALE: DawnFire(82) Ember(71) RiverSong(64)...

FORAGER TARGETS: [KNOWN: Moonstone ●] [FOOD ○] [TRADE □] [MEDICINAL ■]

[ RELATIONSHIP MATRIX ] [ CRAFTING ] [ JOURNAL ] [ END DAY ]
```

---

## Progression Arc

### Survival Phase
All horses on Sentinels, Foragers, Healers. Esroh patrols force constant movement. No known forage — Food Items targeting is priority. Herd morale below 40 risks panic events. The herd is prey.

### Stabilization Phase
Scouts begin unlocking Known Items. Teachers create the first specialists. Food security allows the first Storytellers. Cannot-walk elders become living memory anchors.

### Culture Phase
Priest/ess and Storytellers maintain high herd morale. Foals born into herds with active teachers and rites arrive with significant starting XP. Artisans fund alliances. Specialized Forager teams operate in parallel across Food, Medicine, and Trade targets.