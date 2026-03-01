# TRAVEL MODULE
## Complete Specification — Implementation-Accurate
*Current as of: Tile System + Terrain Swap Implementation*

---

## 1. Overview

Travel is the high-risk movement phase where genetics, individual horse max speeds, and specialised roles are tested against realistic distance/time/energy costs. **ALL horses must participate.** The player plans routes, speed is limited by the slowest horse, and navigates the herd through a side-scrolling minigame.

The minigame runs at 60fps on an 800×400px canvas. Score is accumulated in metres; the canonical distance unit is the **tile** (10 metres = 100px of scrolling). All checkpoints, terrain changes, and future event triggers are expressed in tiles.

---

## 2. Access & Flow

```
Grazing Complete → Travel Planning → END DAY →
Travel Minigame → Arrival → Sleep Resolution
```

### Entry Conditions

- ALL walk-capable horses above 50% energy
- NO "cannot walk" horses (ceremony must be performed first)
- Travel roles assigned for ALL horses (lead / flanking)

### Speed Availability

- All horses max ≥ 8 m/s → Walk / Trot / Canter / Forced available
- All horses max ≥ 6 m/s → Walk / Trot / Forced available
- All horses max ≥ 4 m/s → Walk / Forced available
- Forced: ALWAYS available (penalties scale with herd capability)

**Max speed formula:**
```
Max Speed = Base Genes − Age Penalty − Pregnancy(−20%) − Malnutrition(−5%/level) − Injuries(−10–50%)
```

> **FOALS (<1 yr):** Cannot lead. Auto-knockout when mother is knocked out.

---

## 3. Speed Presets

Herd speed is limited to the slowest horse's maximum.

| Speed | m/s | Real Time | In-Game Time | Energy Cost | Notes |
|-------|-----|-----------|--------------|-------------|-------|
| **Walk** | 3–4 | 4–6 min | 6–8 hrs | −2%/hr | Easy timing, foal-safe |
| **Trot** | 5–6 | 2–3 min | 4–6 hrs | −3%/hr | Standard |
| **Canter** | 7–8 | 1.5–2 min | 3–4 hrs | −4%/hr | Tight timing, no foals |
| **Forced** | 9–10 | 45–90 sec | 24 hrs max | −5%/hr + night | Hard; night penalties |

> Night penalties (8+ in-game hrs): dark screen, −25% visibility, +30% stumble chance.

---

## 4. Tile System

The tile is the **canonical unit of distance** in the Travel minigame. All game logic that depends on distance — checkpoints, terrain transitions, future event triggers, resource spawn rates — is expressed in tiles, never raw pixels or metres directly.

### 4.1 Definition

- **1 tile = 10 metres = 100 pixels** of canvas scroll
- Score is accumulated in metres each frame: `score += gameSpeed × SCORE_SCALE`
- `SCORE_SCALE = 0.01543`, calibrated so start speed (4.5 px/frame at 60fps) equals 15 km/h
- Current tile = `Math.floor(score / METRES_PER_TILE)` where `METRES_PER_TILE = 10`
- Tile logic fires only on tile boundary crossings — not every frame

### 4.2 Tile Reference Table

| Tiles | Metres | Pixels | Time @ Start Speed | Notes |
|-------|--------|--------|--------------------|-------|
| 1 | 10m | 100px | ~2.4 sec | One tile at start speed (4.5 px/frame, 60fps) |
| 10 | 100m | 1,000px | ~24 sec | Short sprint |
| 100 | 1 km | 10,000px | ~4 min | One checkpoint interval |
| 1,000 | 10 km | 100,000px | ~40 min | Full long-distance route |

### 4.3 Checkpoint Interval

- Checkpoints fire every **`CHECKPOINT_TILES = 100` tiles = 1 km**
- Intervals are evenly spaced — no scaling factor between checkpoints
- The HUD progress bar shows `tilesDone/tilesNext t` (e.g. `47/100t`)
- Checkpoint fanfare displays the kilometre number: `"2km CHECKPOINT"`

### 4.4 Why Tiles

Using tiles makes event scheduling speed-agnostic. Whether the herd is walking or cantering, terrain swaps and checkpoint intervals are defined in the same unit. The conversion to real time depends on current `gameSpeed` (which changes with acceleration and terrain modifiers) — but tile counts remain stable reference points for designers.

---

## 5. Terrain & Biome System

The minigame scrolls through three biomes that swap dynamically during a run. Each biome has distinct parallax layers, ground colour, sky gradient, rock style, and a speed multiplier.

### 5.1 Biome Definitions

| Biome ID | Colour | Speed Mult | Parallax Layers | Notes |
|----------|--------|------------|-----------------|-------|
| `plains` | Brown | 1.0× | Mountains + hills + trees | Default; standard grey rocks |
| `forest` | Green | 1.0× | Dark trees (far + mid) | Dark sky; green-tinted rocks |
| `desert` | Grey | 0.85× | Sand dunes (far + mid) | Slower; warm orange sky |

### 5.2 Terrain Swap Logic

On game start, `_pickNextTerrain()` schedules the first swap at a random tile offset between `TERRAIN_SWAP_MIN_TILES` (50) and `TERRAIN_SWAP_MAX_TILES` (200).

When `tiles >= nextTerrainAt`, `_switchTerrain()` fires:

1. A different biome is selected at random from the other two (never the same as current)
2. `TravelBackground.init(newBiomeId)` reloads parallax layers, sky, ground, cloud positions
3. `TravelObstacles.reset(newBiomeId)` applies the new rock colour style
4. `_pickNextTerrain()` immediately schedules the next swap (50–200 tiles ahead)

Terrain changes are **instantaneous** — there is no transition animation in the current implementation.

### 5.3 Future Biomes (Planned, Speed Multipliers Defined)

| Biome ID | Speed Mult | Notes |
|----------|------------|-------|
| `swamp` | 0.6× | Heavy gravity feel; water |
| `downhill` | 1.2× | Increased momentum sense |

---

## 6. Minigame: Controls & Physics

Only the **lead horse** has a collision hitbox. Follower horses mirror the lead's jump with a physics-calculated delay.

### 6.1 Jump Model

The jump is a two-phase system: ascent is rapid and unaffected by player input; descent can be slowed by holding the button.

| Phase | Gravity Applied | Effect |
|-------|-----------------|--------|
| Ascending (`vy < 0`) | `GRAVITY` (0.55) | Full gravity — hits apex fast, crisp launch |
| Falling + button held + frames remain | `HOLD_FALL_GRAVITY` (0.18) | Soft descent; holding floats the horse down slowly |
| Falling + button released | `GRAVITY × FALL_GRAVITY_MULT` (0.935) | Punchy drop; snaps back to ground |

- **Press** Space / LMB / tap: horse launches instantly at `JUMP_VELOCITY` (−17 px/frame)
- **Hold during fall:** gravity reduced to `HOLD_FALL_GRAVITY` for up to `MAX_HOLD_FRAMES` (28) frames
- **Release during fall:** full `FALL_GRAVITY_MULT` kicks in for a snappy landing

### 6.2 Coyote Time & Jump Buffering

- **Coyote Time** (`COYOTE_FRAMES = 7`): player can jump up to 7 frames after the lead horse leaves the ground
- **Jump Buffering** (`JUMP_BUFFER_FRAMES = 8`): pressing jump up to 8 frames before landing auto-fires the moment hooves touch ground

### 6.3 Horizontal Lunge

- On takeoff, the horse's X snaps forward by `LUNGE_FORWARD` (32px) from its base position
- The horse **stays at the lunged position for the entire arc** — it does not drift mid-air
- After landing, X lerps back to `baseX` at `LUNGE_RETURN` (0.018/frame) — roughly 3–4 seconds to fully settle

### 6.4 Jump Height Indicator

A green circle is rendered on the lead horse body while airborne:

- Fill ratio = `currentHeight / peakHeight` where peak = `JUMP_VELOCITY² / (2 × GRAVITY)`
- Circle fills upward as horse rises; drains as it falls
- Colour shifts from deep green at ground level to bright yellow-green at apex
- Disappears instantly on landing

### 6.5 Follower Ripple

Followers jump in a physically-calculated wave — **not** at a fixed interval:

```
delayFrames = round((followerIndex × HORSE_SPACING) / gameSpeed)
```

This ensures each follower reaches the jump point at exactly the moment the obstacle would arrive at their position, regardless of current speed.

| gameSpeed | Horse 2 delay (52px back) | Horse 3 delay (104px back) |
|-----------|--------------------------|---------------------------|
| 4.5 px/f (start) | ~12 frames | ~23 frames |
| 12 px/f (max) | ~4 frames | ~9 frames |

### 6.6 Physics Constants Reference

| Constant | Value | Description |
|----------|-------|-------------|
| `GRAVITY` | 0.55 | Base gravity (px/frame²) |
| `HOLD_FALL_GRAVITY` | 0.18 | Gravity while falling + button held |
| `JUMP_VELOCITY` | −17 | Initial upward velocity on press (px/frame) |
| `MAX_HOLD_FRAMES` | 28 | Max frames hold can slow the fall |
| `FALL_GRAVITY_MULT` | 1.7 | Multiplier when falling without hold |
| `COYOTE_FRAMES` | 7 | Frames after leaving ground jump still fires |
| `JUMP_BUFFER_FRAMES` | 8 | Frames before landing a pre-press queues |
| `LUNGE_FORWARD` | 32px | Pixels horse snaps forward on takeoff |
| `LUNGE_RETURN` | 0.018 | Lerp rate back to base X per frame after landing |
| `LEAD_X` | 200px | Lead horse resting X (25% of 800px canvas) |
| `HORSE_SPACING` | 52px | Pixel gap between each horse in the line |
| `HORSE_SCALE` | 0.72 | All horses drawn at 72% size |

---

## 7. Knockout & Immunity Frames

### 7.1 Knockout Sequence

1. Lead horse collides with a rock → `lead.kill()` fires
2. Lead animates off-screen (spin-out, opacity fades over 40 frames)
3. Next horse in line is promoted to lead (`isLead = true`); its flanking role becomes inactive
4. Line continues until destination or all horses are knocked out

### 7.2 Immunity Frames (Grace Period)

When the lead horse is knocked out, **all surviving horses** — including the newly promoted lead — receive **600 immunity frames (10 seconds at 60fps).**

- Immune horses: `getBounds()` returns `null` → skipped in all collision checks
- Visual: horse flickers between full opacity and 45% opacity every 2 frames (classic invincibility blink)
- Prevents chain-wiping the entire line through the same rock that killed the lead
- The newly promoted lead also receives immunity, preventing instant double-knockout

### 7.3 Special Knockout Rules

- **Pregnant horses:** 25% miscarriage chance on knockout
- **Foals (<1 yr):** auto-knockout when their mother is knocked out
- **Total failure (all knocked):** run ends; summary screen displayed

---

## 8. Resource Gathering

### 8.1 Apples (Current Implementation)

Apples spawn in clusters of 2–5 ahead of the herd and bob vertically.

- Spawn rate: `APPLE_SPAWN_CHANCE` (0.003) × `gameSpeed` per frame — faster speed spawns more apples per unit time
- Only the **lead horse** collects apples on contact
- Collected apples are held as **pending** until a checkpoint
- At each checkpoint: ALL pending apples are saved to herd inventory; pending resets to 0
- **Apples pending at total failure are lost** — only checkpointed apples are kept

### 8.2 Future Roles (Spec, Not Yet Implemented)

- **Scavenger:** +50% pickup range, +15% rare item finds
- **Cartographer:** Maps route; future Travel to same destination costs −10% energy
- **Sentinel:** Converts Esroh encounters to scrap loot; −20% ambush chance

---

## 9. Checkpoint System

- Checkpoints fire every **100 tiles (1 km)**
- Evenly spaced — no scaling factor between checkpoints
- On trigger: pending apples saved to herd inventory; pending count resets to 0
- Full-screen fanfare overlay plays for 110 frames (~1.8 seconds)
- Progress bar (top-right HUD): `tilesDone/tilesNext t`
- Game-over summary shows: total distance (km), last checkpoint reached, total apples saved, unsaved apples lost

---

## 10. Travel Roles

### Lead Roles (Front position — rotates on knockout)

| Role | Bonus | Genetic Synergy |
|------|-------|-----------------|
| **Crosscountry** | Smaller hitbox, +20% jump forgiveness | Agility genes |
| **Moonseer** | +35% night/forest visibility | Perception genes |
| **Gladiator** | +3 sec QTE combat time | Strength / fire / horn genes |

### Flanking Roles (Behind lead — full line)

| Role | Bonus | Genetic Synergy |
|------|-------|-----------------|
| **Scavenger** | +Pickup range, +15% rare finds | Forage perception |
| **Sentinel** | Rear warnings, −20% Esroh ambush | Perception / stamina |
| **Cartographer** | Maps route for future efficiency | Intelligence genes |

> FOALS are auto-assigned their mother's flanking role and knock out with her.

---

## 11. Pause & Input

### 11.1 Input Mapping

All inputs share the same `_triggerJump()` / `_releaseJump()` code path:

| Input | Jump Start | Jump Release |
|-------|-----------|--------------|
| Space / Arrow Up | `keydown` | `keyup` |
| Left Mouse Button | `mousedown` on canvas | `mouseup` / `mouseleave` |
| Touch | `touchstart` | `touchend` |

### 11.2 Auto-Pause

- Clicking anywhere **outside** the canvas triggers an immediate pause
- Window losing focus (alt-tab, switching apps) also triggers pause via `window blur` event
- A `PAUSED` overlay renders on top of the frozen scene — no game logic advances while paused
- **Resume:** click the canvas, press Space, or press Arrow Up
- Pause is not available during the game-over screen

---

## 12. HUD Layout

```
[ Tile: 47 ]  [ Speed: 5.2 ]  [ 🐴 3/4 ]  [ 🍎 ×12 ]  [ Herd Name ]  [ Hold to float down ]
─────────────────────────────────────────────────────────────────────────────────────────────
                              GAME CANVAS (800 × 400px)
─────────────────────────────────────────────────────────────────────────────────────────────
                                            [ 🏁 47/100t ████████░░░░░░░░ ]  (top-right bar)
```

| Element | Position | Content |
|---------|----------|---------|
| Tile counter | Top-left | Current tile number |
| Speed | Top-left | Current `gameSpeed` in px/frame |
| Horse count | Top-left | Alive / total |
| Apple count | Top-left | Pending (unsaved) apples |
| Hint | Top-right | "Hold to float down" |
| Progress bar | Top-right | `tilesDone/tilesNext t` — fills toward next checkpoint |
| Jump indicator | On lead horse | Green fill circle; rises with horse, drains on descent |

---

## 13. Arrival Resolution

- **Inventory:** apples from completed checkpoints are already saved; pending apples since last checkpoint are lost on total failure
- **Injuries:** all knocked leads processed for injury severity
- **Energy:** individual drain applied based on distance × speed × role modifiers
- **Morale:** −5 fatigue for partial failure; +5 for clean run
- **Journal:** notable events recorded (e.g. "Ember mapped Ironspike trails")

### First-Visit Bonus

- Known Forage unlocked for destination biome
- Cartographer: future Travel to this destination costs −10% energy

---

## 14. Failure States

### Partial Failure (some horses knocked)

- Knocked horses receive injuries requiring healer attention
- Energy −10% penalty on remaining horses
- Morale −10

### Total Failure (all horses knocked)

- Emergency micro-biome triggered at point of failure
- All horses injured; foals stunted
- Morale −25; journal entry: *"Herd broken by cliffs"*
- All apples pending since last checkpoint are lost

---

## 15. Future Systems (Spec, Not Yet Implemented)

- **Weather Effects:** Rain (−15% grip, +20% stumble), Night (−25% visibility, +30% stumble), Pollution (fatigue drain)
- **Esroh Encounters:** QTE with 3-second timer; Gladiator extends to 6 seconds; outcomes: Evade (+2hr detour), Fight (lead strength vs Esroh), Charge (gene-determined)
- **Route Planning Screen:** Detour options (e.g. +25% herb yield for +3km)
- **Tile-triggered events:** Specific tile crossings can fire scripted encounters, weather changes, or resource windfalls
- **Tile-based spawn tables:** Replace uniform `APPLE_SPAWN_CHANCE` with per-tile tables varying by biome and distance travelled
- **Energy Calculation (Individual):**
  ```
  Horse Energy Cost = Distance(km) × HerdSpeed(m/s) ×
                      (PersonalMaxSpeedMod × FatigueMod × RoleMod)
  Foals: 1.5× cost | Pregnant: 1.3× cost | Malnourished L3+: +10%/level
  ```

---

## 16. Progression Impact

**Survival** (foals limit to Walk): Constant pregnancy = Walk-only; Esroh force evasive detours; no Canter = slow world exploration.

**Stabilisation:** Fewer foals/pregnancies → Trot unlocks; Cartographers unlock efficient routes; Scavengers find first magical items.

**Culture:** Mature herd → Canter/Forced viable; specialised lead teams (Gladiator vs Esroh); mapped world = Dragon assault routes.