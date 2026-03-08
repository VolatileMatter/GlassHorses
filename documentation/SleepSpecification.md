# Sleep Module Specification

Version 2.0 | Status: Authoritative

---

## Overview

Sleep is the automated resolution phase that closes each day. The player triggers it manually after completing all grazing assignments. Sleep processes every outcome from the day's roles, heals the herd, advances pregnancies, spreads cultural memory, performs rites, and rolls the next morning's event. It requires no player input — it plays out as a short visual montage with running statistics.

**See also**: GrazingSpecification.md (day setup), RoleSpecification.md (role outputs), CultureSpecification.md (rite effects), TravelSpecification.md (post-travel sleep differences).

---

## Access & Flow

```
Grazing Complete → [Review assignments] → END DAY → Sleep Phase → Morning Event → New Grazing Day
```

The player can always trigger Sleep once all horses have been assigned roles. There are no additional preconditions.

---

## Cannot-Walk Horses & Sleep

Cannot-walk horses participate fully in Sleep resolution. They contribute to herd morale through Storyteller and Socialize outputs. They recover energy normally. They do not block Sleep in any way.

Cannot-walk horses **permanently block travel**. The player is never forced to resolve this — they may keep cannot-walk horses indefinitely, staying in the current location. Options for cannot-walk horses are presented post-Sleep when the player attempts to initiate travel. See TravelSpecification.md.

---

## Resolution Sequence

Sleep resolves in seven phases, displayed as a visual montage with stats ticking up in real time. Total display time: approximately 45 seconds.

---

### Phase 1: Role Resolution

All grazing role outputs are processed simultaneously.

1. **Foragers** return → inventory populated with target-modified yields
2. **Teaching resolves**: Teacher distributes `100 × teacher_skill_level` XP divided equally among all assigned Students. Teacher personally gains +10 XP.
3. **Food consumption**: each horse consumes their daily food requirement from inventory and grass. A horse ending at 0% food gains +1 malnutrition level.
4. **Breeding resolves**: pregnancies flagged; individual morale updated for each pair based on relationship quality
5. **Skill XP awarded**: all horses gain XP in their assigned role

Cannot-walk horses assigned to Storyteller or Socialize receive full XP for those roles.

---

### Phase 2: Healing & Recovery

**Energy recovery** (walk-capable horses, base 40%):

```
Energy Recovery = 40% × Sleep Quality Modifier × Weather Modifier × Herd Morale Modifier (0.8–1.2)
```

| Weather | Energy Modifier |
|---------|----------------|
| Sunny | +Full bonus |
| Rain | Normal |
| Pollution | −20% |
| Storm | −10% |

Cannot-walk horses recover energy normally — they are not penalised for their condition during sleep.

**Wound healing**:
- Minor wounds: −1 severity per sleep
- Healer poultices applied during the day: 2× healing speed
- Malnutrition: 24 consecutive hours above 50% food removes 1 level

**Pregnancy advancement**: gestation tracker advances +1 day. Foaling occurs at 340 days.

---

### Phase 3: Weather Carryover

Current weather persists into the next morning. Weather does not reset at midnight.

| Condition | Morning Effect |
|-----------|---------------|
| Rain | Wet ground (travel slip risk for walk-capable horses) |
| Pollution | Energy recovery −20% (already applied in Phase 2) |
| Sunny | Full energy recovery bonus |
| Storm | Resolves to Rain or Sunny at morning roll |

---

### Phase 4: Storytellers & Memory Spread

All active Storytellers — including cannot-walk horses — share 1–3 journal events with the herd.

- Horses who were present during the original event: +5 individual morale
- New listeners learn the event; the memory spreads through the herd
- If the last horse who remembers an event dies before it is spread, the event is permanently greyed out in the journal
- A greyed event contributes to cultural collapse risk (−10 total culture traits)

Cannot-walk Storytellers are particularly stable memory anchors — they never leave the herd and accumulate memories over time.

---

### Phase 5: Priest/ess Rites

Runs only if a Priest/ess is active (post Day 8 activation) and required materials are available.

Culture-specific effects:

| Culture | Rite Effect |
|---------|------------|
| River | Water blessing → +15 individual morale herd-wide |
| Solar | Dawn preparation → +10% all yields next day |
| Mountain | Stone endurance → malnutrition resistance for next day |
| Plains | Route blessing → −5% energy cost on next travel |
| Rebel | Combat rite → +Sentinel effectiveness next day |

Rites also generate +1 relevant culture trait. See CultureSpecification.md for full culture trait rules.

---

### Phase 6: Herd Morale Recalculation

After all individual morale changes from Phases 1–5 are applied, herd morale is recalculated.

```
HERD MORALE = Average of all individual horse morale values (0–100)
```

Hard cap: 100. Cannot-walk horses are included in this average.

---

### Phase 7: Morning Event Roll

A single event is rolled for the next morning based on:
- Current biome
- Recent travel risk level
- Current herd morale and culture level
- Necrocratic Dragon expansion state

| Event Category | Weight (early game) | Effect |
|----------------|---------------------|--------|
| Predator | High | Coyote pack / predator sighting → Sentinel test next day |
| Esroh Patrol | High | Abomination sighting → forces Sentinel focus |
| Pollution | Medium | Factory smoke → Forager −30% next day |
| Solarpunk | Medium | Solar bloom, crystal spring → food or morale bonus |
| Herd Contact | Low | Refugee herd sighted → possible joiner or trade |

**Early game bias**: 70% Predator/Esroh events. This eases as culture level rises and the herd stabilises.

Morning event is displayed at the start of the next Grazing screen.

---

## Narrative Journal Entry

Every Sleep auto-generates a journal entry summarising the night.

```
🌕 Full Moon, Verdant Riverlands
"BrokenLeg told the mountain lion story again.
Three new foals heard it for the first time."
```

Journal entries are the primary vehicle for cultural memory. They record births, deaths, first discoveries, Esroh encounters, rite completions, and Storyteller events. Entries that are remembered by living horses are marked active. Entries with no living rememberers are greyed.

---

## Output Summary Screen

Displayed after the montage before the new day begins.

```
SLEEP SUMMARY
💤 Herd energy recovered: avg +42% (walk-capable)
💤 BrokenLeg (cannot walk): +52% energy
🍎 Food: 3 malnutrition levels healed across herd
💚 Morale: +6 avg (BrokenLeg +8 via Storyteller)
📜 New journal: "BrokenLeg's Esroh warning"
🌅 Morning: Esroh smoke spotted east

✅ Inventory: +47 herbs, +12 fruits, +2 moonstone
✅ Herd: 28 horses (1 cannot walk, 1 pregnant)
✅ Weather: Sunny
```

---

## Post-Sleep Travel Decision

If the player wishes to travel after Sleep, and any cannot-walk horses are present, the following prompt appears before the Travel Planning screen:

```
TRAVEL BLOCKED: [Horse Name] cannot walk.

[Keep — stay indefinitely]   [Sky Burial Ceremony]   [Seek Trade to Allied Herd]
```

- **Keep**: herd stays. Cannot-walk horse continues as Storyteller/Socialize. No time limit.
- **Sky Burial**: ceremonial death. Generates a high-value journal entry and a significant morale event. Unlocks travel.
- **Seek Trade**: diplomatic option if an allied herd is within range. The horse joins their herd. Generates a bittersweet journal entry. Unlocks travel.

This prompt only appears when the player actively attempts to travel. Staying put requires no decision.

---

## Progression Integration

### Survival Phase
Sleep is tense. High Predator/Esroh event weights mean each morning brings new threats. Energy recovery is often partial due to low morale. No rites. Storytellers are rare — the herd has few memories worth sharing.

### Stabilization Phase
First Storytellers activate. Memories begin spreading. Morale stabilises above 60, improving energy recovery. First Priest/ess rites appear. Morning events begin mixing in Solarpunk and Herd Contact rolls.

### Culture Phase
Sleep becomes a rich resolution phase. Multiple Storytellers spread layered memories. Rites produce meaningful culture traits and morale boosts. Cannot-walk elders are living legends whose nightly stories shape the next generation. Morning events begin referencing the Necrocratic Dragon by name.