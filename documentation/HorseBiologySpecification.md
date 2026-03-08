**Feral Horse Biology & Behaviour**

Reference Document for Game Design

*Sections marked 🎮 indicate direct connections to the Horse Breeding Game*

# **1\. Mate Selection**

Feral horses live in harems — family bands consisting of several mares, their young offspring, and one or occasionally a few adult stallions. Stallions gain breeding access primarily by controlling and defending a group of mares, not through female choice alone. However, mares do express preferences and may leave or join bands over time, effectively selecting among available stallions.

Bachelor stallions — mature males without mares — form separate bands and may challenge harem stallions or 'steal' mares away. Success depends on age, strength, and social rank. In multi-male harems, subordinate stallions can coexist and may sire some foals, but the dominant stallion fathers the majority of offspring.

### **Courtship Sequence**

Mating follows a stereotyped pattern. The stallion performs flehmen — a distinctive lip-curl gesture — to chemically test the mare's urine and assess her reproductive readiness. He then nuzzles her hindquarters and makes mounting attempts, which the mare meets with ritual squeals and kicks until her estrus peaks. No long-term pair bonds form; after copulation, the mare typically walks away abruptly.

| 🎮  Game Connection Breeding in this game is player-directed rather than behaviour-driven, but the biology of stallion access and mare preferences can inform several systems: • Stallion 'covering' ritual and scent marking could be represented as a grazing mode animation for stallions near mares. • The courtship sequence (flehmen, nuzzling, ritual rejection) is rich material for paired grazing animations between stallions and mares. • Mare preference and the concept of mares 'choosing' different bands provides narrative justification for why the player's choices about which horses to keep together matter — it's not just genetics, it's social compatibility. • Bachelor band behaviour (young males grouping together) could be a distinct herd composition mode with different grazing animations and social dynamics than a mixed harem. |
| :---- |

# **2\. Reproductive Ages & Safety**

| Milestone | Age | Notes |
| :---- | :---- | :---- |
| Earliest possible first foal (mare) | \~2 years old | Technically possible from puberty at 12–18 months. Biologically risky — mare still growing. |
| Typical first foal in feral conditions | 3–5 years old | Average first foaling age \~5.4 years in Przewalski's horse studies. |
| Peak fertility (mare) | 5–10 years (peak \~6–7) | Most physiologically efficient and safest reproductive window. |
| Declining fertility (mare) | After \~15 years | Complications and embryonic loss become more common. Pregnancy still possible. |
| Stallion sexual maturity | 2–3 years | Capable but rarely gets consistent herd access this young. |
| Stallion effective breeding age | \~4–5 years | Old enough to hold or share a harem successfully. |
| Stallion harem tenure | Typically lost by \~10 years | May keep a harem for several years before being displaced. |

| 🎮  Game Connection Age-gating in the breeding system: • Mares should not be breedable before age 2 in the game. A 'risky early breeding' mechanic could exist — allowing it at 2 years with negative health epigenetic consequences for the foal or mother. • The safest breeding window (ages 5–15) could be reflected in epigenetic fertility values that peak and decline with age, affecting conception chance. • Stallions should not gain herd access until age 4–5. Before that age, a male horse could be flagged as a 'bachelor' with its own grazing mode behaviour set. • Stallion effectiveness could decline after age 10 in the breeding sim — affecting conception probability rather than blocking breeding entirely. • The game's concept of a horse having a 'prime' aligns directly with the 5–15 year sweet spot for mares. |
| :---- |

# **3\. Gestation & Foaling Interval**

Typical equine gestation is approximately 11 months, with a mean of 333–335 days and a biological range of roughly 310–360 days. In free-living conditions with adequate resources, mares often produce one foal per year because they may conceive again in the first estrus cycle after foaling — as early as 5–12 days post-birth — or within the same breeding season.

The common natural pattern is: foal is born → overlapping late lactation and early new pregnancy → next foaling roughly one year later. In harsher environments or when a mare is in poor condition, she may skip years, extending the interval between foals and reducing her lifetime reproductive output.

| 🎮  Game Connection In-game time and breeding calendars: • An 11-month gestation is the baseline. Game time likely compresses this significantly — the exact compression ratio is a design decision, but the relative proportions should hold: gestation is long, recovery before next conception is very short. • The 'foal heat' concept (mare can conceive 5–12 days after birth) means in real biology, a well-conditioned mare is almost immediately available again. The game could model this as: a mare in good condition (high health epigenetic values) can be rebred almost immediately; a mare in poor condition has a longer mandatory rest before conception succeeds. • Year-skipping in harsh conditions could be modelled as a condition check at breeding time — if a mare's health/nutrition epigenetic values are below a threshold, conception chance drops significantly. • Natural weaning occurs around 10–11 months, just before the next foal is born. This means a mare nursing a foal AND pregnant simultaneously is biologically normal and expected. |
| :---- |

# **4\. Daily Time Budgets**

Studies of free-ranging and semi-feral horses reveal consistent patterns in how time is allocated across a 24-hour day. These proportions shift with season, pasture quality, temperature, and daylight length, but the core pattern is: eat a great deal, rest a moderate amount, move and socialise in the remaining time.

| Behaviour | % of Day | Notes |
| :---- | :---- | :---- |
| Foraging (grazing \+ searching) | 50–67% | The dominant activity. Horses are trickle feeders requiring near-constant intake. |
| Standing rest | 13–29% | Polyphasic — many short rest bouts, not one long block. |
| Lying down (sleep/deep rest) | 4–16% | Multiple short bouts; REM sleep requires lying down. |
| Locomotion (walking, trotting) | Remaining | Stallions move more than mares; spend more time alert. |
| Social behaviour | Remaining | Grooming, play, courtship, agonistic encounters. |

| 🎮  Game Connection Grazing mode job system and animations: • The time budget data directly informs how job locations should be populated. In a realistic simulation: \~60% of horses at any moment should be at grazing-type jobs, \~20% resting (standing or lying), \~10–15% socialising, and a small number in motion between locations. • The game's job system assigns horses to locations — the probability weights for which job type a horse gets assigned could be drawn directly from these percentages. • Stallions as a distinct behaviour type: they spend more time on alert and moving, less time foraging. Stallion-specific job types (patrolling, alerting, scent-marking) would be biologically accurate and visually distinctive. • The lying-down rest animation is important — up to 16% of horses may be lying down at any given time, which means on a screen of 8–15 horses, 1–3 should plausibly be recumbent at any moment. • Polyphasic sleep means horses should NOT stay at rest jobs indefinitely — they should cycle back to grazing after relatively short rest periods. |
| :---- |

# **5\. Grazing Spacing & Group Cohesion**

Horses are highly social and prefer to graze in visual and often close tactile contact with band-mates. The precise spacing depends on environment, resource availability, and social relationships.

| Environment | Typical Spacing | Notes |
| :---- | :---- | :---- |
| Open rangeland, abundant forage | Several metres apart | Loose cluster; horses spread out but maintain line-of-sight. Regroup tightly when moving, resting, or threatened. |
| Resource-limited or confined areas | Closer together | Quality patches scarce; little benefit to spreading. Social tolerance matters more here. |
| Night / resting | 1–5 metres | Tight cluster for predator protection. Head-to-tail positioning common. |
| During storms or threat | \<2 metres | Ultra-tight clustering; dominant mare positions the group. |

Dominant horses may claim high-quality grazing spots and displace subordinates, but band cohesion usually prevents individuals from drifting far from the group. Social tolerance and dominance relationships are the primary regulators of spacing within a band.

| 🎮  Game Connection Crystal ball scene and job location placement: • The several-metres spacing on open rangeland maps to real-world distances of 2–8m between horses at grazing jobs. At the game's 1 unit \= 1 metre scale, job locations should be placed no closer than 2 units apart and no further than 8–10 units apart for a realistic grazing scene. • The ultra-tight spacing during storms could be a special weather event mode in grazing scenes — horses cluster to a 2-unit proximity, which would look visually dramatic and distinctive. • The dominant mare positioning the group during threats suggests an interesting animation: one horse (the lead mare) faces outward while others cluster behind her. This could be a rare group alert event triggered occasionally in the grazing scene. • Dominant horses displacing subordinates at good grazing spots is a natural agonistic interaction that could appear as an occasional paired animation between two horses — one pins ears and the other moves away. |
| :---- |

# **6\. Sleeping Area & Nighttime Behaviour**

Feral horses rest in tight clusters at night, with individuals often head-to-tail or within 1–5 metres of each other. Not all horses lie down simultaneously — typically 1–3 animals remain standing as sentinels while others achieve recumbent REM sleep in short bouts. The group footprint at night is remarkably small relative to their daytime range.

| Band Size | Approx. Sleeping Area | Equivalent Footprint |
| :---- | :---- | :---- |
| 5 horses | 100–300 m² | Roughly a 10×30 metre zone |
| 10 horses | 300–600 m² | Roughly a 20×30 metre zone |
| 15+ horses | 600–1,000 m² | Rare for a single band; still compact |

Horses rarely spread beyond visual range of each other even at night (\~50–100 metres maximum). Subgroups of 2–3 bonded horses or mothers with foals rest even closer together, often in physical contact.

| 🎮  Game Connection Night mode and time-of-day systems: • If the game implements a day/night cycle in grazing mode, nighttime should show all horses clustered tightly in one area of the scene, with 1–2 standing sentinels and the rest lying down or standing very close together. • At 1 unit \= 1 metre, a band of 10 horses sleeping would occupy roughly a 20×30 unit area — very compact in the crystal ball scene. This could be a visually beautiful and distinctive nighttime view. • The sentinel behaviour (1–3 horses standing while others sleep) is a natural role that could be assigned during nighttime job allocation — a 'sentinel' job with a heads-up alert animation. • Foals sleeping pressed against their mothers (physical contact range, essentially 0 distance) reinforces the foal-follows-mother system already designed. • Mother-foal pairs and strongly bonded horses clustering together even tighter than the rest of the group creates natural visual subgrouping within the scene. |
| :---- |

# **7\. Foal Nursing, Weaning & Grazing Transition**

Foals begin nibbling grass and mimicking adult grazing behaviour within the first weeks to months of life, but milk remains a critical nutrient source for many months. The transition from milk to grass is gradual over the course of the first year rather than a sudden event.

| Age | Nursing Frequency | Solid Food |
| :---- | :---- | :---- |
| Newborn to weeks old | \~Every 15 minutes | None — entirely milk-dependent |
| Weeks to months | Gradually decreasing | Begins mimicking grazing; nibbles grass |
| Several months to 1 year | \~Once per hour | Increasingly grass-dependent; milk supplemental |
| \~10–11 months (feral) | Natural weaning begins | Weaning driven by mare's approaching next foaling |

Most nursing behaviour is initiated by the foal and terminated by the mare, especially in the first month. As the foal ages, the mare progressively pins her ears or kicks at nursing attempts — a gradual ritual over weeks rather than a sudden cut-off. In feral conditions, if the mare is pregnant again, natural weaning usually occurs around 10–11 months before the next foal arrives.

| 🎮  Game Connection Foal behaviour in grazing mode: • The nursing animation (foal moves to mare's flank, both play paired clip) is already planned. The biological frequency data suggests this should trigger relatively rarely in older foals but quite often for very young ones. An age-scaled nursing interval epigenetic value is consistent with real biology. • Young foals (first weeks) should spend almost all time close to the mare — very short leash radius for the play wandering behaviour. Older foals can wander further. • The foal mimicking adult grazing is a natural animation to include — a foal lowering its head alongside its grazing mother, clearly imitating her behaviour. This could be part of the 'playing near mom' state for older foals. • The weaning ritual (mare pinning ears, kicking at nursing attempts) could be a late-stage foal animation that appears as the foal approaches yearling age — the mare's rejection becoming more frequent over time. • The biology supports the game design: foals always following their mothers is not just a simplification, it is literally what feral foals do. |
| :---- |

# **8\. Foal Play & Early Social Behaviour**

Foals devote significantly more time to play than adults. Play behaviours include running, bucking, mock fights, and social chasing. Play is especially vigorous among male foals (colts), who engage in more frequent and physically intense play that directly rehearses future stallion competition and courtship behaviours.

Female foals (fillies) tend toward more grooming and calmer affiliative contact. As foals approach weaning age, their time budget shifts: time spent lying and sleeping decreases, time spent foraging and moving with the group increases. The foal gradually transitions from the play-and-sleep schedule of infancy toward the graze-and-rest schedule of adulthood.

| 🎮  Game Connection Foal animations and gender-differentiated behaviour: • Colt and filly foals could have distinct play animation sets. Colts: more running, bucking, mock rearing, chasing. Fillies: more mutual grooming, calmer proximity play. • The gender difference is driven by genetics — a gene determining sex could also influence which play animation set the foal uses, reinforcing that genetics shapes visible behaviour. • As foals age toward yearling, their play frequency could decrease and grazing frequency increase. This is a natural animation weight shift that could be modelled as an age-based epigenetic value. • The early social experiences of foals shaping future adult behaviour is relevant to the breeding sim: colts with good social play backgrounds (healthy, with playmates) could have better eventual breeding success represented in their epigenetic values. |
| :---- |

# **9\. Stallion Dispersal & When Males Leave**

In feral bands, offspring typically remain with their natal group only until about 2–3 years of age. Colts usually leave before fillies — often before 2 years — particularly when there are no similar-aged play partners, or when the resident stallion begins treating them as rivals rather than offspring.

| Stage | Age | Social Status |
| :---- | :---- | :---- |
| Colt leaves natal band | Before 2 years (colts) or 2–3 years (fillies) | Driven out or drifts away. Joins bachelor band. |
| Bachelor phase | 2–4 years | Groups with other young males. Practices fighting, social skills. |
| Challenges for mares begin | \~4–5 years | Strong and socially competent enough to attempt harem control. |
| Harem tenure | \~5–10 years | May hold or share a harem for several years. |
| Loss of harem | Often by \~10 years | Displaced by younger rivals; may return to bachelor status. |

In single-stallion harems, maturing colts are typically driven out by around 2–3 years. In multi-male bands, subordinate stallions may remain if they accept their lower rank and do not aggressively challenge the dominant male, allowing adult males to coexist when the hierarchy is stable.

| 🎮  Game Connection Herd composition rules and bachelor band mechanics: • The 2-year rule for colts is a natural game trigger: a colt reaching age 2 could generate a notification or event prompting the player to decide what to do with him — sell, keep as a bachelor, add to a herd. • Bachelor bands are a distinct herd type. A group of only young males would have different grazing mode animations and social dynamics — more play-fighting, more roughhousing, more energy. • The stallion's declining effectiveness after age 10 is a natural game mechanic — the player must manage their stallion's career, perhaps retiring him or replacing him with a younger rival. • The dominant stallion covering the intruder's urine scent marks is a distinctive grazing animation that could occur when a new stallion is introduced to a herd. • Multi-stallion harems are biologically plausible — the game could allow this with a dominance hierarchy mechanic where the subordinate stallion has lower breeding probability than the dominant one. |
| :---- |

# **10\. Herd Size & Territory**

| Property | Typical Value | Notes |
| :---- | :---- | :---- |
| Basic band size | 4–12 horses | 1–2 stallions, several mares, and dependent offspring |
| Maximum stable single band | \~20–25 horses | Bands rarely exceed this even in unmanaged conditions |
| Daily distance travelled | 15–16 km average (range 8–28 km) | Driven by foraging, watering, and resting needs |
| Home range | Up to 40 km² | Often overlapping near water and trails |
| Nighttime sleeping area | 0.01–0.1 km² | Extremely compact relative to daily range |
| Large aggregation triggers | Scarce water, mineral licks, high-quality forage patches | Temporary; overrides normal band spacing |

The largest feral horse populations (not single bands) number in the thousands, such as BLM Herd Management Areas in Nevada or Wyoming with 1,000–5,000+ horses before management gathers. These are population-level counts, not single cohesive herds — the basic social unit (the band) always remains small.

| 🎮  Game Connection Crystal ball scene scale and herd composition: • The game's crystal ball sizes (0.5km to 5km diameter) are actually quite realistic relative to real home range sizes (up to 40 km²). Even the largest crystal ball at 5km diameter gives a comfortable scene for a large herd. • The biological band size (4–12 horses as a social unit) maps naturally to the game's grazing scene, which shows 8–15 horses at a time. A player with 100+ horses is managing something more like a population than a single band, which justifies the diorama framing — the god-player is observing a curated sample of their herd at any moment. • The daily travel distance (15–16 km) is much larger than the crystal ball scene. This is fine — the crystal ball is a snapshot view of the herd at a moment in time, not a simulation of their full territory. • The extreme compactness of nighttime sleeping areas (100–1,000 m²) versus daytime ranging (up to 40 km²) is a striking real-world contrast that justifies having noticeably different horse density in day vs. night grazing scenes. |
| :---- |

# **11\. Weather Responses**

### **Snow**

Horses stand with rumps to the wind in tight bands (2–5 metres spacing), seeking leeward slopes or tree lines. Their winter coat traps air pockets, preventing snow from melting to skin. They increase grazing before and after storms for fermentation heat, reduce movement and activity significantly during blizzards, and huddle for shared warmth with foals nested centrally. Dominant mares position the group.

### **Hail**

Hail prompts immediate flight to cover — thickets, ravines, or low ground. Horses turn their backs and lower their heads to shield faces and eyes. Bands cluster ultra-tight (under 2 metres) during barrages. Short hail bursts increase alertness and post-storm energy (bucking, gallops). Heavy events reduce activity like blizzards. Horses preemptively avoid hail-prone open areas using wind and pressure cues.

| 🎮  Game Connection Weather events in grazing mode: • Snow and hail are natural weather event triggers for special grazing mode animations. During a snow event: horses cluster tight, rumps to wind, foals centrally positioned — a beautiful and distinctive group formation. • A 'shelter-seeking' animation where the herd moves from open ground to a leeward slope or tree line would be biologically accurate and visually interesting. • Post-hail friskiness (bucking, galloping) is a vivid animation opportunity — a sudden burst of energy across the whole herd after a storm passes. • The dominant mare positioning the group during bad weather is consistent with the lead mare animation concept mentioned in the spacing section — one horse visibly organising the others. • Winter coat variation could be a seasonal epigenetic modifier — horses in cold environments develop thicker coats, which could be a visible rendering difference between summer and winter versions of the same horse. |
| :---- |

# **12\. Ritual & Social Behaviours**

### **Stallion Territory & Hierarchy**

Stallions maintain stud piles — manure mounds refreshed daily — as territorial markers. When an intruding stallion approaches, the resident performs ritual posturing: arched neck, raised tail, prancing gait, stomping, and snorting. The intruder responds by pawing over the resident's urine scent. This 'covering' ritual asserts dominance and resolves most confrontations without physical fighting. Roughly 80–90% of agonistic displays are resolved through ritual rather than violence.

### **Hierarchy Maintenance**

Within bands, horses use low-level agonistic rituals — ear-pinning, head-throwing, hind-leg threats, or brief charges — to enforce linear dominance ranks without contact. These are most common among mares during grazing to regulate spacing near high-quality forage patches. Mutual grooming (allogrooming) reinforces bonds, particularly among kin or preferred partners, and reduces post-conflict tension.

### **Responses to Death**

Feral horses show curiosity and mild affiliative behaviours toward dying or dead conspecifics but lack elaborate rituals. Band members approach, sniff, and may stand nearby briefly. Kin — especially dams — show prolonged interest via whinnies and close proximity. Interest fades within hours as the group moves on. Unlike elephants, horses do not revisit carcass sites or engage in prolonged mourning behaviour.

| 🎮  Game Connection Grazing mode animations and social interactions: • The stallion challenge ritual (arched neck, raised tail, prancing, stamping, snorting) is one of the richest animation opportunities in the whole game — distinctive, physically dramatic, and visually unmistakeable. This should be a paired animation between two adult males. • Stud pile marking (stallion pausing, pawing at a spot, depositing, moving on) is a subtle ambient animation for stallions that adds realistic detail to the grazing scene without being disruptive. • Mutual grooming (allogrooming) between bonded horses is already planned as a paired social animation. Biology confirms it should preferentially occur between kin or socially close horses — which could be reflected in the social relationship data the game tracks. • The low-level agonistic interactions during grazing (ear-pin, brief charge, subordinate moves away) are natural brief paired animations between any two horses and would make the grazing scene feel politically alive rather than peaceful and static. • The response to death could be a rare, emotionally significant event animation — if a horse in the player's herd dies, the remaining horses in the grazing scene could briefly cluster around the area with heads low, creating a poignant visual moment before moving on. |
| :---- |

# **Summary: Key Numbers at a Glance**

| Parameter | Real Biology | Game Implication |
| :---- | :---- | :---- |
| Mare first safe foaling | Age 3–5 (avg first foal at \~5.4 years) | Block breeding before age 3\. Optional risky breeding at age 2 with consequences. |
| Mare peak fertility | Ages 5–10 (peak \~6–7) | Conception epigenetic value peaks in this window, declines after 15\. |
| Stallion effective breeding age | 4–5 years | Males flagged 'bachelor' before this; harem access unlocks at 4–5. |
| Gestation | \~11 months (333–335 days) | Longest phase of the breeding cycle. Game time compression applies. |
| Foal heat (earliest rebreed) | 5–12 days post-birth | Near-immediate rebreeding possible in good condition mares. |
| Natural weaning age | \~10–11 months | Foal transitions to grass-eating gradually; nursing becomes less frequent. |
| Daily grazing time | 50–67% of 24 hours | \~60% of grazing mode horses should be at grazing-type job locations. |
| Daily rest time | 17–45% combined standing \+ lying | 1–3 horses lying down at any moment in a group of 8–15 is realistic. |
| Colt leaves natal band | Before 2 years typically | Age-2 trigger event: player prompted to manage young male. |
| Stallion loses harem | Often by age \~10 | Stallion breeding effectiveness declines; natural career endpoint. |
| Basic band size | 4–12 horses | Natural visual unit for the grazing scene. |
| Sleeping area (10 horses) | 300–600 m² | Extremely compact; \~20×30 unit area at game scale. |

*Biology reference compiled from studies of feral and free-ranging horse populations including Przewalski's horses, North American BLM herds, and semi-feral island populations. All figures are observed ranges; individual variation is significant.*