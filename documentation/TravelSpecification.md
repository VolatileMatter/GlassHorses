## Travel Module: Complete Specification

Travel is the **high-risk movement phase** where genetics, individual horse max speeds, and specialized roles are tested against realistic distance/time/energy costs. **ALL horses must participate**. Player plans routes, speed is limited by slowest horse, plays herd line runner minigame.

## Access & Flow
```
Grazing Complete → Travel Planning → END DAY → 
Travel Minigame → Arrival → Sleep Resolution
```

## Entry Conditions (Updated)
```
✅ ALL walk-capable horses >50% energy
✅ NO "cannot walk" horses (ceremony first)
✅ Travel roles assigned for ALL horses (lead/flanking)
```
**Speed availability** based on **slowest horse max speed**:
```
All horses max ≥8m/s → Walk/Trot/Canter/Forced available
All horses max ≥6m/s → Walk/Trot/Forced available  
All horses max ≥4m/s → Walk/Forced available
Forced: ALWAYS available (penalties scale with herd capability)
```

**Max speed formula**: Base genes - Age penalty - Pregnancy(-20%) - Malnutrition(-5%/level) - Injuries(-10-50%)

**FOALS** (<1yr): Cannot lead. Knockout when mother knocked out.

## Route Planning Screen
```
Verdant Riverlands → Ironspike Foothills (18km)
HERD MAX SPEEDS: Canter(7 horses) Trot(18) Walk(3 foals)

SPEED OPTIONS:
✅ Walk (3.5m/s): 4.5hrs | -12% energy
✅ Trot (5m/s): 3hrs | -18% energy  
❌ Canter (LOCKED: 3 foals too slow)
✅ Forced (9m/s): 21hrs | -60% energy + night

[DETOUR: River path +25% herbs] [CONFIRM]
```

## Speed Presets (Herd-Limited)
| Speed | m/s | Real Time | In-Game Time | Energy Cost | Mechanical |
|-------|-----|-----------|--------------|-------------|------------|
| **Walk** | 3-4 | 4-6 min | 6-8hrs | -2%/hr | Easy timing |
| **Trot** | 5-6 | 2-3 min | 4-6hrs | -3%/hr | Normal |
| **Canter** | 7-8 | 1.5-2 min | 3-4hrs | -4%/hr | Tight |
| **Forced** | 9-10 | 45-90s | 24hrs max | -5%/hr +night | Hard |

**Night penalties** (8hrs+): Dark screen, -25% visibility, +30% stumble.

## Travel Roles: Lead vs Flanking

### **LEAD ROLES** (Front position, rotates on knockout)
| Role | Bonus | Genetic Synergy |
|------|--------|----------------|
| **Crosscountry** | Smaller hitbox, +20% jump forgiveness | Agility genes |
| **Moonseer** | +35% night/forest visibility | Perception genes |
| **Gladiator** | +3sec QTE combat time | Strength/fire/horn genes |

### **FLANKING ROLES** (Behind lead, full line)
| Role | Bonus | Genetic Synergy |
|------|--------|----------------|
| **Scavenger** | +Pickup range, +15% rare finds | Forage perception |
| **Sentinel** | Rear warnings, -20% Esroh ambush | Perception/stamina |
| **Cartographer** | Maps route (future Travel -10% energy) | Intelligence genes |

**FOALS**: Auto-assigned mother's flanking role. Knockout with mom.

## Line Formation & Rotation
```
[LEAD: StormChaser★ Crosscountry] 92% HP
[FLANK: Ember Scavenger] [DawnFire Sentinel] 
[RiverSong(Pregnant) Cartographer] [Foal w/RiverSong]
[ElderLeaf Guardian] [Pregnant Mare2 Scavenger]

LEAD KNOCKOUT → StormChaser injured → Ember becomes LEAD (Scavenger role inactive)
```

## Knockout Mechanics
```
1. Lead hits obstacle → KNOCKOUT (injury + fatigue)
2. Lead slides off-screen 
3. **Next horse auto-becomes LEAD** (flanking role → inactive)
4. Line continues until destination or all knocked

SPECIAL:
• PREGNANT: 25% miscarriage
• FOAL: Auto-knockout with mother
• **TOTAL FAILURE**: Emergency graze (micro-biome)
```

## Resource Gathering
```
PASSIVE (whole line): Biome items × speed density
SCAVENGER: +50% pickup range, +rare magical items
CARTOLOGRAPHER: First pass unlocks Known Forage in destination
SENTINEL: Converts Esroh encounters → scrap loot
```

## Weather Effects
| Weather | Lead Jump | Visibility | Stumble |
|---------|-----------|------------|---------|
| **Rain** | -15% grip | Normal | +20% |
| **Night** | Moonseer +35% | -25% base | +30% |
| **Pollution** | Fatigue drain | -20% | +10% |

## Esroh Encounters (QTE)
```
[SCREEN SHAKE] "ESROH ABOMINATION!"
[3sec Gladiator timer]

LEFT: EVADE (+2hr route)
RIGHT: FIGHT (lead strength vs Esroh)
SPACE: CHARGE (genes determine win)

Gladiator role: +3sec decision time
```

## Energy Calculation (Individual)
```
Horse Energy Cost = Distance(km) × HerdSpeed(m/s) × 
(PersonalMaxSpeedMod × FatigueMod × RoleMod)

Foals: 1.5x cost (protected)
Pregnant: 1.3x cost
Malnourished L3+: +10% per level
```

## UI During Travel
```
ROUTE: Ironspike 14.2/18km | Trot 5.3m/s | 2.8hrs left
LINE: [StormChaser★ CROSSCOUNTRY 88%] [Ember SCAVENGER 92%]
     [DawnFire SENTINEL 95%] [RiverSong(Preg) CARTO 78% +FOAL]
ENERGY: -2.1%/min | PICKUPS: +12 herbs +1 moonstone

[SPACE JUMP] [PAUSE] [ABORT]
```

## Arrival Resolution
```
✅ Inventory: +Travel loot + Cartographer unlocks
✅ Injuries: All knocked leads processed
✅ Energy: Individual drain applied
✅ Morale: -5 fatigue or +5 victory
✅ Journal: "Ember mapped Ironspike trails"

LOCATION BONUS (first visit):
• Known Forage unlocked
• Cartographer: Future Travel -10% energy cost
```

## Progression Impact
```
**SURVIVAL** (foals limit to Walk):
• Constant pregnancy = Walk-only
• Esroh force evasive detours
• No Canter = slow world exploration

**STABILIZATION**:
• Fewer foals/pregnancies → Trot unlocks
• Cartographers unlock efficient routes
• Scavengers find first magical items

**CULTURE**:
• Mature herd → Canter/Forced viable
• Specialized lead teams (Gladiator vs Esroh)
• Mapped world = Dragon assault routes
```

## Failure States
```
PARTIAL (3/8 knocked):
• Lead injuries → Healer demand
• Energy -10% penalty
• Morale -10

TOTAL FAILURE:
• Emergency micro-biome 
• All injured, foals stunted
• Morale -25, "Herd broken by cliffs"
```

**Core tension**: Pregnancy/foals force slow speeds → vulnerability to Esroh → pressure to time breeding → genetic optimization for Travel roles. Late-game herds with mature specialists can Canter/Forced assault Necrocratic Dragon facilities.