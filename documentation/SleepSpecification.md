## Sleep Module: Complete Specification (Updated)

Sleep is the **resolution phase** that advances time, processes the day's outcomes, heals the herd, rolls morning events tied to the Necrocratic Dragon threat, and generates narrative journal entries. Player manually triggers Sleep after completing Grazing assignments. **No travel restrictions** - horses that cannot walk can stay indefinitely.

## Access & Flow
```
Grazing Complete → [Review assignments] → END DAY → SLEEP PHASE → MORNING EVENT
```

## Entry Conditions
Player can **always** Sleep when:
- All horses assigned roles (including "cannot walk" horses)
```
[Confirm] "The herd settles for the night. Time advances."
```
**Cannot walk horses**: Stay with herd indefinitely, eligible for Storyteller/Socialize roles.

## Resolution Sequence (Night Processing)

### Phase 1: Role Resolution (30 seconds visual)
```
1. **Foragers** return → Inventory populated (target-modified yields)
2. **Teaching complete**: 100XP ÷ Students (1 student = full transfer)
3. **Food consumption**: Grass + gathered items → Food levels
   - 0% food → +1 Malnutrition level
4. **Breeding resolutions**: Pregnancies flagged, individual morale updated
5. **Skill XP awarded**: All horses gain daily XP in assigned roles
   - **Cannot walk horses**: Full XP in Storyteller/Socialize
```

### Phase 2: Healing & Recovery (Weather-dependent)
```
**Energy Recovery** (base 40% for walk-capable horses):
× Sleep quality (6-10hrs) 
× Weather modifier 
× Herd morale bonus (0.8-1.2)

**Cannot walk horses**:
- Energy: Normal recovery 
- No movement penalties
- Storyteller/Socialize: Full efficiency

**Wound healing**: 
- Minor wounds: -1 severity 
- Healer poultices: 2x speed
- Malnutrition: 24hrs >50% food → -1 level

**Pregnancy advancement**: Gestation tracker +1 day (foaling at 340 days)
```

### Phase 3: Weather Carryover
```
Current weather persists into morning:
- Rain → Wet ground (Travel slip risk for walk-capable horses)
- Pollution → Energy recovery -20% 
- Sunny → Full recovery bonus
```

### Phase 4: Storytellers & Memory Spread
```
Active Storytellers (including cannot walk horses) share 1-3 journal events:
- Horses present during original event: +5 individual morale
- New listeners learn event (memory spreads)
- Last rememberer dies → Event greys in journal
```

### Phase 5: Priest/ess Rites (Culture-specific)
```
If materials available + Priest/ess active:
River Culture: Water blessing → +15 morale
Solar Culture: Dawn preparation → +10% next day yields
Mountain Culture: Stone endurance → Malnutrition resistance
```

## Morning Event Roll (Necrocratic Dragon Plot)

**Single daily event** based on:
- Current biome
- Recent Travel risk
- Herd morale/culture
- Necrocratic Dragon expansion

| Event Category | Weight | Effect | Cannot Walk Impact |
|----------------|--------|---------|-------------------|
| **Predator** | High | Coyote pack → Sentinel test | Storytellers warn early |
| **Esroh Patrol** | High | Abomination sighting | Socialize horses detect vibration |
| **Pollution** | Medium | Factory smoke → Forager -30% | Cannot walk horses immune |
| **Solarpunk** | Medium | Solar bloom → FOOD bonus | Storytellers preserve knowledge |
| **Herd Contact** | Low | Refugee herd → Joiner/trade | Cannot walk elders = diplomats |

**Early game bias**: 70% Predator/Esroh → Forces Sentinel focus.

## Updated Herd Morale Calculation
```
HERD MORALE = Average(all individual horse morale 0-100)
**Cannot walk horses contribute fully** to average via:
• Storyteller: +3-8 morale spread
• Socialize: +5-10 morale recovery
```

**Morale thresholds**:
```
<30: XP gain -30%, breeding -50%
30-60: Survival focus
60-80: Stabilization
>80: Culture flourishes
```

## Narrative Journal Entry
```
**Auto-generated per Sleep**:
🌕 Full Moon, Verdant Riverlands  
"BrokenLeg (cannot walk) told the mountain lion story. 
Three foals learned it."

**Cannot walk horses** = **living history**:
- Perfect for Storyteller role
- Immune to Travel risks
- Cultural memory anchors
```

## Visual & Audio Presentation
```
[Soft nighttime music]
[Montage: Horses settling, BrokenLeg telling stories by fire, stars rising]
[Herd stats ticking: Energy +42%, Morale +6, Stories shared: 2]

🌅 MORNING BREAKS
"Esroh smoke east. BrokenLeg sensed it first."
```

## Output States (Post-Sleep)
```
✅ Inventory: +47 herbs, +12 fruits, +2 moonstone
✅ Herd: 28 horses (1 cannot walk: Storyteller, 1 pregnant)
✅ Energy: Walk-capable avg 78%, Cannot walk: 85%
✅ Morale: 71/100 (+5 from Storytellers incl. BrokenLeg)
✅ Journal: "BrokenLeg warns of Esroh" (5 horses remember)
✅ Weather: Sunny

[New Grazing Day Begins]
```

## Travel Decision (Post-Sleep)
```
**If Travel planned**:
✅ All walk-capable horses >50% energy
❌ ANY cannot walk horse → Travel blocked
```
```
OPTIONS for cannot walk horses:
1. **Keep indefinitely** (Storyteller/Socialize roles)
2. **Sky Burial Ceremony** (when Travel needed)
3. **Trade to allied herd** (diplomatic option)
```

## Progression Integration
```
**SURVIVAL PHASE**:
• Cannot walk horses = liability (constant Travel blocks)
• All Sentinels/Foragers vs predators/Esroh

**STABILIZATION**:
• Cannot walk horses become Storytellers
• First stable location found
• Cultural memory preserved

**CULTURE PHASE**:
• Elder cannot walk horses = Living legends
• Storytellers preserve anti-Dragon lore
• Foals learn from stationary wisdom
```

## UI Flow
```
SLEEP SUMMARY
💤 Walk-capable recovered: +1,247 (78% avg)
💤 BrokenLeg (cannot walk): +52 energy (85%)
🍎 Food: 3 malnutrition healed
💚 Morale: +6 avg (BrokenLeg +8 via stories)
📜 New journal: "BrokenLeg's Esroh warning"

TRAVEL BLOCKED: BrokenLeg cannot walk
[Keep Elder] [Ceremony] [Seek Trade] [Stay Put]

[BEGIN GRAZING]
```

**Key change**: Cannot walk horses become **cultural assets** rather than liabilities. Early game = heartbreaking choices, late game = revered elders preserving herd wisdom against the Necrocratic Dragon.