# Role Specification

Version 2.0 | Status: Authoritative

---

## Overview

Every horse is assigned a role every day. Roles are the primary mechanism through which horses gain skills, the herd gathers resources, and culture develops. There is no idle state — every horse works.

**See also**: GrazingSpecification.md (assignment rules, morale, food), TravelSpecification.md (travel role rules), CultureSpecification.md (culture trait generation from roles).

---

## Role Categories

| Category | Roles | Lock-in |
|----------|-------|---------|
| Daily | Sentinel, Forager, Healer, Teacher, Student, Artisan, Scout, Socialize | None — reassignable each day |
| Long-term | Storyteller, Priest/ess | 7-day learning period (see below) |
| Travel (Lead) | Crosscountry, Moonseer, Gladiator | Active only during travel minigame |
| Travel (Flanking) | Scavenger, Sentinel, Cartographer | Active only during travel minigame |

---

## Long-Term Role Lock-in

Storyteller and Priest/ess require a **7-day learning period** before producing any output. During these 7 days the horse is assigned the role but generates nothing — no XP distribution, no morale effects, no culture gains. Output begins on Day 8.

**Exception**: A horse that becomes unable to walk is **automatically assigned Storyteller** and **skips the learning period entirely**, becoming an active Storyteller the day after the injury. This skip applies only to Storyteller, not Priest/ess. A cannot-walk horse assigned to Priest/ess still requires the full 7-day learning period.

A horse locked into a long-term role cannot be reassigned until the lock-in period ends or they are manually pulled out (resetting progress).

---

## Daily Roles

### Sentinel

| Property | Value |
|----------|-------|
| Daily XP gain | +25 XP |
| Primary output | Early warnings against Esroh patrols and predators |
| Genetic synergy | Perception genes |

Sentinels are critical in the early game when Esroh patrols are frequent. High-perception horses are more effective. Weather affects detection range (see GrazingSpecification.md).

---

### Forager

| Property | Value |
|----------|-------|
| Daily XP gain | +30 XP |
| Primary output | Biome resources (food, medicinals, trade goods) |
| Genetic synergy | Stamina, perception genes |
| State modifier | Pregnant mare: −20% yield |

Each Forager is individually assigned one of five targeting modes. See GrazingSpecification.md for full targeting rules.

---

### Healer

| Property | Value |
|----------|-------|
| Daily XP gain | +25 XP |
| Primary output | Treatments for injured horses; converts medicinal herbs to poultices |
| Genetic synergy | Charisma, perception genes |

Healer poultices double wound healing speed during Sleep. Higher Healer skill level increases conversion efficiency and treatment quality.

---

### Teacher

| Property | Value |
|----------|-------|
| Daily XP gain (personal) | +10 XP |
| XP distributed to students | `100 × teacher_skill_level` divided equally among all assigned Students |
| Optimal ratio | 1 Teacher : 1 Student (full transfer; no dilution) |
| Genetic synergy | Charisma, intelligence genes |

A Teacher at skill level 8 distributes 800 XP total. With 2 students, each receives 400 XP. With 4 students, each receives 200 XP. The teacher's own +10 XP gain is separate from and unaffected by student count.

Teachers cannot be reassigned mid-day once Students are assigned to them (LOCKED state in UI).

---

### Student

| Property | Value |
|----------|-------|
| Daily XP gain | XP received from Teacher (see above) |
| Role learned | Student's assigned role (set alongside teacher assignment) |
| Modifier | +10% skill XP if student's mother is present in the herd (foal bonus) |

A Student with no Teacher assigned receives no XP. Students should always be paired with a Teacher.

---

### Artisan

| Property | Value |
|----------|-------|
| Daily XP gain | +20 XP |
| Primary output | Converts raw materials into trade art; increases material trade value |
| Genetic synergy | Intelligence, dexterity genes |

Artisan-produced goods carry a 1.5× value multiplier for trade with allied herds. Culture-phase Artisans produce culture-themed works that contribute to diplomatic relationships.

---

### Scout

| Property | Value |
|----------|-------|
| Daily XP gain | +35 XP |
| Primary output | Intelligence on adjacent tiles; unlocks Known Forage for neighbouring areas |
| Genetic synergy | Stamina, perception genes |
| State modifier | Pregnant mare: −20% range |

Scouts discovering a new item in an adjacent tile add it to the herd's Known Items list, enabling Forager targeting of that item next time the herd is in that biome.

---

### Socialize

| Property | Value |
|----------|-------|
| Daily XP gain | +10 XP |
| Primary output | Energy recovery and individual morale boost for the socialising horse |
| Eligible | All horses including cannot-walk horses |

Socialize recovers +5–10 individual morale and a small energy amount. It is the primary recovery role for horses that are not injured enough to need full Healer attention but are running low on morale.

---

## Long-Term Roles

### Storyteller

| Property | Value |
|----------|-------|
| Daily XP gain (post-activation) | +15 XP |
| Learning period | 7 days (skipped for cannot-walk horses) |
| Activation | Day 8 for healthy horses; Day 1 (day after injury) for cannot-walk horses |
| Primary output | Shares journal events → +3–8 individual morale per listening horse |
| Eligible | All horses including cannot-walk horses |
| Genetic synergy | Charisma, memory genes |

Storytellers select 1–3 journal events to share during Sleep resolution (Phase 4). Horses present during the original event gain +5 morale. New listeners learn the event, spreading cultural memory. If the last horse who remembers an event dies, the event is greyed out in the journal and cultural collapse risk increases.

Cannot-walk horses make especially effective Storytellers — they are anchored in place, accumulate memories, and benefit from the learning period skip.

---

### Priest/ess

| Property | Value |
|----------|-------|
| Daily XP gain (post-activation) | +20 XP |
| Learning period | 7 days — no exceptions |
| Activation | Day 8 |
| Primary output | Culture-specific ceremonies → morale boost + culture trait gain |
| Genetic synergy | Charisma, spiritual genes |

During the 7-day learning period, the Priest/ess produces **nothing** — no morale, no culture traits, no XP distributed. This applies even to cannot-walk horses.

Post-activation, the Priest/ess generates +1 relevant culture trait per active day and delivers a morale boost during Sleep Phase 5. The specific morale and trait effects depend on the herd's active culture. See CultureSpecification.md for culture-specific rite effects.

Weather interacts with Priest/ess output — certain cultures receive bonuses under specific weather conditions (e.g. River Culture rites are enhanced in rain).

---

## Travel Roles

Travel roles are assigned during Travel Planning and are only active during the travel minigame. They have no effect during Grazing. See TravelSpecification.md for full context.

### Lead Roles

Lead roles are only active when the horse is the **current lead** in the lead string. When a horse is knocked out and the next horse is promoted, that horse's lead role activates.

| Role | Effect | Genetic Synergy |
|------|--------|-----------------|
| **Crosscountry** | Smaller collision hitbox; +20% jump forgiveness | Agility genes |
| **Moonseer** | +35% visibility in night/forest biomes | Perception genes |
| **Gladiator** | +3 seconds added to Esroh QTE timer (total 6 sec) | Strength, fire, horn genes |

### Flanking Roles

Flanking roles are active for all lead string horses that are **not currently the lead**. A horse promoted to lead loses their flanking role bonus.

| Role | Effect | Genetic Synergy |
|------|--------|-----------------|
| **Scavenger** | Increased pickup collection range; +15% chance of rare item finds | Foraging perception genes |
| **Sentinel** | Provides rear warnings; −20% Esroh ambush chance | Perception, stamina genes |
| **Cartographer** | Maps the route; future travel to this destination costs −10% energy | Intelligence genes |

Horses in the **follower cloud** are not assigned travel roles and receive none of these bonuses.

---

## Role XP Reference

| Role | Personal Daily XP | Notes |
|------|------------------|-------|
| Sentinel | +25 | — |
| Forager | +30 | — |
| Healer | +25 | — |
| Teacher | +10 | Distributes additional XP to Students separately |
| Student | Variable | `(100 × teacher_level) ÷ student_count` |
| Artisan | +20 | — |
| Scout | +35 | Highest daily XP of all roles |
| Socialize | +10 | — |
| Storyteller | +15 | Day 8+ only (or Day 2+ for cannot-walk) |
| Priest/ess | +20 | Day 8+ only, no exceptions |

---

## Skill Level & Efficiency

Role efficiency scales with skill level in that role (0 → 1.0+). A horse with no skill in a role operates at base efficiency. Skill levels above 1.0 are possible and produce above-base output.

Individual morale below 30 applies a −20% efficiency penalty to all roles regardless of skill level.

Physical state modifiers (pregnancy, malnutrition, injury) apply multiplicatively on top of skill and morale modifiers.

---

## Genetics Integration

| Gene Type | Role Synergy |
|-----------|-------------|
| Stamina | Physical roles (Forager, Scout, Sentinel) |
| Perception | Sentinel, Scout |
| Charisma | Storyteller, Socialize, Priest/ess, Teacher |
| Intelligence | Artisan, Cartographer, Teacher |
| Strength | Gladiator |
| Agility | Crosscountry |