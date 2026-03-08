# Travel Module Specification

Version 2.0 | Status: Authoritative

---

## Overview

Travel is the optional movement phase where the herd relocates between biomes. It takes the form of a side-scrolling runner minigame. Travel is never mandatory — the player can remain in any location indefinitely. However, cannot-walk horses permanently block travel until they are dealt with.

**See also**: RoleSpecification.md (travel role definitions), GrazingSpecification.md (pre-travel state), SleepSpecification.md (post-travel resolution), BiomeSpecification.md (terrain and obstacle assets).

---

## Access & Flow

```
Grazing Complete → Travel Planning → END DAY → Travel Minigame → Arrival → Sleep Resolution
```

### Entry Conditions

- **No cannot-walk horses** in the herd. This is a hard block — cannot-walk horses must be dealt with before travel is possible (see SleepSpecification.md for options: Keep, Sky Burial, Trade).
- All walk-capable horses above 50% energy.
- Travel roles assigned for all horses.

Travel is always optional. If no cannot-walk horses are present and energy conditions are met, the player may choose to stay instead.

---

## Rendering

The travel minigame is **Running Mode** — a deliberately cartoony visual style. No 3D rendering occurs during travel. Every horse is represented by their pre-baked 256px cartoon spritesheet generated at birth. Sprites are never updated after birth; a horse that has gained scars since birth will appear unscarred in the minigame. This is intentional.

The canvas is **800×400px** running at 60fps.

Horse render scale: `HORSE_SCALE = 0.72`, producing an effective height of approximately **184px** on screen.

---

## The Lead String & Follower Cloud

### Lead String

The lead string is the ordered sequence of horses that the player actively controls during the minigame. Each horse in the lead string has a collision hitbox and will be knocked out if it fails to clear an obstacle.

**Default lead string composition**: All walk-capable, non-pregnant, non-foal horses.

**Player customisation**:
- Pregnant mares can be added to the lead string voluntarily
- Injured walk-capable horses can be added voluntarily
- Any able-bodied horse can be removed from the lead string
- Foals (under 1yr) cannot be in the lead string independently; they follow their mother

The player selects this before travel begins in the Travel Planning screen.

### Follower Cloud

All horses not in the lead string travel in the follower cloud. They are visible during the minigame as greyed-out or background figures. Follower cloud horses:
- Have no collision hitbox
- Cannot be knocked out
- Do not have active travel role abilities
- Run no miscarriage risk (pregnant mares in the follower cloud are safe)

### Foals

Foals (under 1yr) are always attached to their mother. They cannot be assigned to the lead string independently. If the mother is in the lead string, the foal follows her there. If the mother is in the follower cloud, the foal is in the follower cloud. A foal auto-knocks out when its mother is knocked out.

At exactly 1 year of age, a horse graduates from foal status and becomes eligible for the lead string and all travel roles.

---

## Speed Presets

Herd speed is limited to the slowest horse's maximum speed.

| Speed | m/s | Real Time | In-Game Time | Energy Cost | Notes |
|-------|-----|-----------|--------------|-------------|-------|
| **Walk** | 3–4 | 4–6 min | 6–8 hrs | −2%/hr | Easy jump timing; foal-safe |
| **Trot** | 5–6 | 2–3 min | 4–6 hrs | −3%/hr | Standard |
| **Canter** | 7–8 | 1.5–2 min | 3–4 hrs | −4%/hr | Tight timing |
| **Forced** | 9–10 | 45–90 sec | 24 hrs max | −5%/hr + night penalties | Always available |

**Night penalties** (8+ in-game hours): dark screen, −25% visibility, +30% stumble chance.

**Max speed formula per horse**:
```
Max Speed = Base Genes − Age Penalty − Pregnancy(−20%) − Malnutrition(−5%/level) − Injuries(−10–50%)
```

**Speed availability**:
- All horses max ≥ 8 m/s → Walk / Trot / Canter / Forced
- All horses max ≥ 6 m/s → Walk / Trot / Forced
- All horses max ≥ 4 m/s → Walk / Forced
- Forced is always available regardless of herd capability

---

## Tile System

The tile is the canonical distance unit. All game logic — checkpoints, terrain transitions, event triggers, spawn rates — is expressed in tiles.

| Definition | Value |
|-----------|-------|
| 1 tile | 10 metres = 100px of canvas scroll |
| Score accumulation | `score += gameSpeed × SCORE_SCALE` each frame |
| SCORE_SCALE | 0.01543 (calibrated so start speed 4.5 px/frame at 60fps = 15 km/h) |
| Current tile | `Math.floor(score / 10)` |
| Tile logic | Fires only on tile boundary crossings, not every frame |

| Tiles | Metres | Pixels | Time @ Start Speed |
|-------|--------|--------|--------------------|
| 1 | 10m | 100px | ~2.4 sec |
| 10 | 100m | 1,000px | ~24 sec |
| 100 | 1 km | 10,000px | ~4 min |
| 1,000 | 10 km | 100,000px | ~40 min |

### Checkpoint Interval

- Checkpoints fire every **100 tiles (1 km)**
- Evenly spaced — no scaling between checkpoints
- On checkpoint: all pending pickups saved to herd inventory; pending count resets
- HUD progress bar shows `tilesDone/tilesNext t` (e.g. `47/100t`)
- Full-screen fanfare overlay plays for 110 frames (~1.8 seconds)

---

## Terrain & Biome System

The minigame scrolls through biomes that swap dynamically. See BiomeSpecification.md for biome and obstacle asset definitions.

| Biome ID | Speed Mult | Notes |
|----------|------------|-------|
| `plains` | 1.0× | Default; standard rocks |
| `forest` | 1.0× | Dark sky; green-tinted rocks |
| `desert` | 0.85× | Slower; warm orange sky |
| `swamp` *(planned)* | 0.6× | Heavy feel; water |
| `downhill` *(planned)* | 1.2× | Increased momentum |

**Terrain swap logic**: First swap scheduled at random tile offset between 50–200 tiles. On swap, a different biome is selected at random (never the same as current). Terrain changes are instantaneous — no transition animation.

---

## Obstacles

Obstacles are jumpable objects spawned on terrain tiles. Full asset definitions live in BiomeSpecification.md.

**Size constraints**:
- Maximum width: **100px** (1 tile). The lead horse can clear up to 1 tile wide.
- Maximum height: **100px**. Obstacles must never be taller than a horse's shoulder. The horse renders at approximately 184px tall on screen, so a 100px obstacle sits well below shoulder height.

The horse's jump is designed around the 100px maximum. An obstacle wider or taller than these limits is physically unjumpable and must not be spawned.

---

## Controls & Physics

Only the lead horse has a collision hitbox. Follower horses in the lead string mirror the lead's jump with a physics-calculated delay.

### Jump Model

| Phase | Gravity | Effect |
|-------|---------|--------|
| Ascending (vy < 0) | GRAVITY (0.55) | Full gravity — fast apex |
| Falling + button held + frames remain | HOLD_FALL_GRAVITY (0.18) | Soft, floaty descent |
| Falling + button released | GRAVITY × FALL_GRAVITY_MULT (0.935) | Punchy snap to ground |

- **Press** Space / LMB / tap: launches at `JUMP_VELOCITY` (−17 px/frame)
- **Hold during fall**: reduced gravity for up to `MAX_HOLD_FRAMES` (28) frames
- **Release during fall**: full fall multiplier kicks in

### Coyote Time & Jump Buffering

- **Coyote Time** (`COYOTE_FRAMES = 7`): jump allowed up to 7 frames after leaving ground
- **Jump Buffering** (`JUMP_BUFFER_FRAMES = 8`): jump input up to 8 frames before landing auto-fires on touchdown

### Horizontal Lunge

- On takeoff, horse X snaps forward by `LUNGE_FORWARD` (32px)
- Horse stays at lunged position for the entire arc
- After landing, X lerps back to `baseX` at `LUNGE_RETURN` (0.018/frame) — ~3–4 seconds

### Jump Height Indicator

Green circle rendered on the lead horse while airborne. Fill ratio = `currentHeight / peakHeight`. Shifts from deep green at ground to bright yellow-green at apex. Disappears on landing.

### Follower Ripple

Lead string followers jump with a physics-calculated delay:

```
delayFrames = round((followerIndex × HORSE_SPACING) / gameSpeed)
```

| gameSpeed | Horse 2 delay | Horse 3 delay |
|-----------|--------------|--------------|
| 4.5 px/f (start) | ~12 frames | ~23 frames |
| 12 px/f (max) | ~4 frames | ~9 frames |

### Physics Constants

| Constant | Value |
|----------|-------|
| GRAVITY | 0.55 px/frame² |
| HOLD_FALL_GRAVITY | 0.18 px/frame² |
| FALL_GRAVITY_MULT | 0.935 |
| JUMP_VELOCITY | −17 px/frame |
| MAX_HOLD_FRAMES | 28 |
| COYOTE_FRAMES | 7 |
| JUMP_BUFFER_FRAMES | 8 |
| LUNGE_FORWARD | 32px |
| LUNGE_RETURN | 0.018/frame |
| LEAD_X | 200px |
| HORSE_SPACING | 52px |
| HORSE_SCALE | 0.72 |

---

## Knockout & Immunity

### Knockout Sequence

1. Lead horse collides with obstacle → `lead.kill()` fires
2. Lead animates off-screen (spin-out, fades over 40 frames)
3. Next horse in lead string promoted to lead; their flanking role deactivates
4. Line continues until destination or all lead string horses knocked out

### Immunity Frames

On knockout, **all surviving lead string horses** receive **600 immunity frames (10 seconds at 60fps)**. Immune horses return `null` from `getBounds()` and are skipped in all collision checks. Visual: flicker between full and 45% opacity every 2 frames.

### Special Knockout Rules

- **Pregnant mares in the lead string**: knockout counts as an injury. A miscarriage check is triggered (25% chance). Pregnant mares in the follower cloud run no miscarriage risk.
- **Foals**: auto-knockout when their mother is knocked out, regardless of cloud or lead string.
- **Total failure** (all lead string horses knocked out): run ends; summary screen displayed.

---

## Travel Roles

Travel roles are assigned during Travel Planning. See RoleSpecification.md for full descriptions.

### Lead Roles (active only when horse is current lead)

| Role | Bonus |
|------|-------|
| **Crosscountry** | Smaller hitbox; +20% jump forgiveness |
| **Moonseer** | +35% night/forest visibility |
| **Gladiator** | +3 sec QTE combat time vs Esroh |

### Flanking Roles (active while horse is in lead string but not lead)

| Role | Bonus |
|------|-------|
| **Scavenger** | +Pickup range; +15% rare item finds |
| **Sentinel** | Rear warnings; −20% Esroh ambush chance |
| **Cartographer** | Maps route; future travel to destination costs −10% energy |

Follower cloud horses have no active travel role and receive none of these bonuses.

---

## Resource Gathering

Apples spawn in clusters of 2–5 ahead of the herd and bob vertically.

- Spawn rate: `APPLE_SPAWN_CHANCE` (0.003) × `gameSpeed` per frame
- Only the current lead horse collects apples on contact
- Collected apples held as **pending** until a checkpoint
- At checkpoint: all pending apples saved to inventory; pending resets
- **Apples pending at total failure are lost**

---

## Pause & Input

| Input | Jump Start | Jump Release |
|-------|-----------|--------------|
| Space / Arrow Up | keydown | keyup |
| Left Mouse Button | mousedown on canvas | mouseup / mouseleave |
| Touch | touchstart | touchend |

**Auto-pause**: clicking outside canvas or window losing focus pauses immediately. Resume: click canvas, press Space, or press Arrow Up. Pause unavailable on game-over screen.

---

## HUD Layout

```
[ Tile: 47 ]  [ Speed: 5.2 ]  [ 🐴 3/4 ]  [ 🍎 ×12 ]  [ Herd Name ]  [ Hold to float down ]
─────────────────────────────────────────────────────────────────────────────────────────────
                              GAME CANVAS (800 × 400px)
─────────────────────────────────────────────────────────────────────────────────────────────
                                             [ 🏁 47/100t ████████░░░░░░░ ]
```

---

## Arrival Resolution

- Checkpointed pickups already saved; pending pickups since last checkpoint lost on total failure
- Knocked lead string horses processed for injury severity
- Energy drained individually: `Distance(km) × HerdSpeed(m/s) × (PersonalMaxSpeedMod × FatigueMod × RoleMod)`
  - Foals: 1.5× energy cost
  - Pregnant mares: 1.3× energy cost
  - Malnourished L3+: +10% per level
- Morale: −5 for partial failure; +5 for clean run
- Journal entries generated for notable events

### First-Visit Bonus

- Known Forage unlocked for destination biome
- Cartographer: future travel to this destination costs −10% energy

---

## Failure States

### Partial Failure (some horses knocked out)

- Knocked horses receive injuries requiring Healer attention
- Remaining horses: −10% energy penalty
- Herd morale: −10

### Total Failure (all lead string horses knocked out)

- Emergency micro-biome triggered at point of failure
- All lead string horses injured; foals stunted
- Herd morale: −25
- Journal entry generated
- All pending pickups since last checkpoint lost

---

## Planned Systems (Not Yet Implemented)

- **Weather effects**: Rain (−15% grip, +20% stumble), Night (already specced above), Pollution (fatigue drain)
- **Esroh Encounters**: QTE with 3-second timer; Gladiator extends to 6 seconds; outcomes: Evade, Fight, Charge
- **Route Planning Screen**: Detour options (e.g. +25% herb yield for +3km)
- **Tile-triggered events**: Scripted encounters, weather changes, resource windfalls at specific tiles
- **Tile-based spawn tables**: Per-tile apple/item tables varying by biome and distance