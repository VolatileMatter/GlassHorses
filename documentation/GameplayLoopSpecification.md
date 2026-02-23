## High-Level Gameplay Loop

```
MORNING EVENT → GRAZING → [TRAVEL] → SLEEP → Repeat
```

## Daily Cycle (Core 15-20 min loop)

### 1. Morning Event (30s)
- Single daily event rolled (biome + recent actions)
- Sets priorities: Esroh patrol → Sentinel focus, Solar bloom → Forager bonus
- All events feed culture traits (+1 relevant culture)

### 2. Grazing (8-12 min) - **Primary Management**
```
Assign ALL horses to 1 of 10 roles:
• Daily: Sentinel, Forager, Healer, Teacher, Student, Artisan, Scout, Socialize
• Long-term (7-day lock): Storyteller, Priest/ess

Forager targeting (per horse): Known/Food/Medicinal/Trade/Any
Teaching: 100XP ÷ Students (1 student optimal)
```
**Outputs**:
- Inventory filled (biome + weather + targeting)
- Skill XP gained (all horses)
- Food consumed → Malnutrition tracked
- Breeding resolved (relationships → individual morale)
```
HERD MORALE = AVG(all individual morale)
```

### 3. Travel Planning (1 min, optional)
```
Route preview: Distance → Time → Energy cost
Speed limited by slowest horse max speed:
Walk/Trot/Canter/Forced (Forced always available)
Assign ALL horses: Lead roles (3 options) OR Flanking roles (3 options)
```
**Preconditions**: No "cannot walk" horses, all >50% energy

### 4. Travel Minigame (2-6 min, if chosen)
```
Endless runner: Control current Lead only (Spacebar jump)
Lead knockout → Next horse auto-promoted to Lead
Pregnant mares: 25% miscarriage risk
Foals: Knockout with mother
```
**Flanking roles active** (Scavenger/Sentinel/Cartographer):
- +Pickups, rear warnings, route mapping
**Outputs**: Travel loot, injuries, energy drain, Known Forage unlocks

### 5. Sleep Resolution (45s auto)
```
Phase 1: Role results processed (inventory, XP, food)
Phase 2: Energy/wound healing (weather dependent)  
Phase 3: Storytellers spread memories (+morale)
Phase 4: Priest/ess rites (+culture/morale)
Phase 5: New Morning Event rolled
```

## Core Resource Systems

| Resource | Source | Sink | Effects |
|----------|--------|------|---------|
| **Energy** | Sleep recovery | Travel, roles | <50% blocks Travel |
| **Food** | Forage, grass | Daily consumption | 0% → Malnutrition (+14 = death) |
| **Morale** | Rites, stories, births | Deaths, Esroh, malnutrition | AVG individual morale → XP/breeding |
| **Materials** | Forage, Travel | Rites, crafting | Culture progression |
| **Skills** | Role assignment | None | Role efficiency (0→1.0+) |
| **Culture** | Rites, events, stay duration | Memory loss | Diplomacy, foal XP, Dragon tactics |

## Win/Loss States
```
**Soft Loss**: Malnutrition deaths → Cultural collapse
**Hard Loss**: Total Travel failure → Emergency biome, morale crash
**Win Path**: Culture 100+ → Coalition vs Necrocratic Dragon
```

## Progression Gates
```
Early: Walk-only Travel, FOOD focus, Sentinel survival
Mid: Trot unlocks, Known Forage, basic rites
Late: Canter/Forced, culture identity, Dragon facilities
```

## Decision Tension
```
**Daily**: Survival roles vs culture roles vs Travel prep
**Strategic**: Stay (culture/bonds) vs Travel (resources/new biomes)  
**Long-term**: Breeding timing vs Travel speed limitations
```

**One complete cycle** = Resource gain → Skill growth → Culture development → Better Travel → Richer biomes → Stronger anti-Dragon position.