**Rendering Pipeline Spec**

Version 1.0  |  Status: In Design

*A browser-based single-player horse breeding simulator combined with a Sonic-style side-scrolling runner. The player is an ancient god observing their herd through a crystal ball, controlling destiny through breeding choices.*

# **1\. Game Overview**

A browser-based single-player horse breeding simulator combined with a Sonic-style side-scrolling runner game. The core fantasy is that the player is an ancient god — a mystical force — controlling the destiny of their herd through breeding choices. They observe their herd through a crystal ball.

## **Visual Modes**

| Mode | Visual Style | Performance Priority |
| :---- | :---- | :---- |
| Grazing Mode | Nearly photo-realistic, full real-time 3D. Primary 'menu' experience. | Quality over FPS. Stuttering acceptable. Min 20 FPS. |
| Running Mode | Deliberately cartoony. Pre-baked sprites only. No 3D at runtime. | Maximum FPS. No 3D rendering whatsoever. |
| Detail View | Full real-time 3D, free camera, maximum quality. | 60 FPS target. One horse only. |
| Book View | 2D atlas thumbnails. Instant display. | Negligible cost. |

# **2\. Technology Stack**

| Component | Technology |
| :---- | :---- |
| Runtime | Browser-based. Desktop only. No mobile optimisation. |
| 3D Rendering | Three.js with WebGL, inside Web Workers via OffscreenCanvas |
| Browsers | Chrome 69+, Firefox 105+, Safari 16.4+ |
| Asset Storage | IndexedDB for persistence. All computation client-side. Server serves static files only. |
| 3D Assets | GLTF/GLB for all models, animations, morph targets |
| Coat Compositor | OffscreenCanvas 2D running in Web Workers |

**⚠️  Open Ambiguities & Decisions Required**

* No decision on audio system or whether audio sync hooks are needed in the animation event system. Must be decided before the animation system is built — retrofitting is painful.

* No central event bus architecture defined. Before building any cross-system communication (job system → animation, genetics → renderer, camera → LOD), a named event bus must be designed. All systems publish and subscribe to events rather than calling each other directly.

# **3\. Coordinate System & Units**

1 unit \= 1 metre. Consistent with running mode physics and extended to all systems.

Y-up. Three.js is Y-up. GLTF exports from Blender use Y-up at export. Modders working in Blender do not need to think about this — the export converts automatically. All landmark normals, appendage offsets, and world-space math assume Y is up.

Horse scale: A real horse stands approximately 1.5–1.7 metres at the shoulder. The base mesh is authored at this scale in Blender.

## **Crystal Ball Scene Sizes**

| Adult Horses in Herd | Ball Diameter |
| :---- | :---- |
| 1–20 | 0.5 km (500 units) |
| 20–100 | 1 km (1,000 units) |
| 100–200 | 2 km (2,000 units) |
| 200+ | 5 km (5,000 units) |

Ball size is fixed when grazing mode is first entered for a session. It does not change in real-time. It is keyed to the number of adult horses only. When the player re-enters grazing mode with a different adult count crossing a threshold, the scene reloads entirely.

**⚠️  Open Ambiguities & Decisions Required**

* The ground plane definition per environment is not formally specified. Needs to be a formal property of the scene definition file — either a flat plane at a defined Y height, or a minimum polar camera angle. Without this contract, modders cannot correctly specify ground constraints for custom environments.

* On ball size change (re-entry after herd count crosses threshold), the scene reloads and camera reinitialises completely. No continuity is attempted. This should be communicated to the player via a loading transition.

# **4\. Genetics System**

## **Architecture**

Genome → TraitResolver → HorseTraits → Renderer

Genes do not directly draw anything. They produce trait values that the renderer reads. This abstraction is what makes the system moddable — new genes produce new traits, new renderer layers consume them.

## **The Epigenetics Rule**

THERE ARE ZERO CALLS TO Math.random() INSIDE ANY COAT GENERATOR FUNCTION. All randomness is resolved when a foal is born and its epigenetic values are set. The renderer is a pure function of genome \+ epigenetic values. Same input always produces identical output. Epigenetic values are the direct parameters to the renderer — a tobiano gene's patch\_count, patch\_spread, edge\_roughness, and white\_dominance were resolved at birth and the renderer uses them directly.

Math.random() IS permitted only during the breeding/birth process when epigenetic values are first set.

## **Core Genes (Priority Order)**

| Gene | Priority | Effect |
| :---- | :---- | :---- |
| base\_extension | 0 | Whether black pigment can express (E/e) |
| base\_agouti | 0 | Whether black restricts to points (A/a) |
| base\_champagne | 50 | Champagne dilution |
| base\_cream | 50 | Cream dilution — 1 copy palomino/buckskin, 2 copies cremello/perlino |
| base\_grey | 100 | Progressive greying with age (dominant) |
| base\_splash | 255 | Splash white marking pattern |

## **Gene Definition Format**

module.exports \= {

  name: 'extension',

  prefix: 'base',

  priority: 0,

  alleles: \['base\_extension\_E', 'base\_extension\_e'\],

  epigenetics: {

    pigmentRestriction: { noisePercent: 5, defaultRange: \[70, 95\] }

  },

  alterCoat:   (ctx) \=\> { /\* paints coat colour layer at 1024px \*/ },

  alterNormal: (ctx) \=\> { /\* optional: paints normal map layer \*/ }

};

**⚠️  Open Ambiguities & Decisions Required**

* Save data schema and migration strategy not fully defined. When the game adds new gene loci, existing horses need a migration path. A formal save schema version number (separate from landmark versions) must be designed.

* Mod identity and missing-mod handling not defined. When a saved horse references a mod gene no longer installed, a fallback behaviour must be defined before the horse data format is finalised.

# **5\. Horse Rendering Pipeline**

## **The Three Output Pipelines**

| Pipeline | Output | When |
| :---- | :---- | :---- |
| A — Atlas Thumbnail Bake | 128px single frame, packed into atlas. Left \+ right facing. | At birth. Permanent. Never updated. |
| B — Running Sprite Bake | 256px spritesheet, cartoon shader. Left \+ right facing. | At birth. Permanent. Never reflects post-birth changes. |
| C — Grazing / Detail Real-Time | Full 3D PBR render. 512px coat (grazing) or 1024px (detail). | Live every frame. Never stored. |

## **Coat Layer Stack (Priority Order)**

| Priority | Layer |
| :---- | :---- |
| 0 | Base coat colour |
| 10 | Point overlay (legs, mane, tail colour) |
| 20 | Dun markings (dorsal stripe, leg bars) |
| 30 | Roan stipple |
| 50 | Tobiano patches |
| 60 | Overo patches |
| 70 | Splash markings |
| 80 | Grey fade |
| 90 | Shading multiply |
| 255 | Runtime overlays (scars, clothing — grazing/detail only) |

The compositor ALWAYS runs at 1024×1024. Generators are NEVER resolution-aware. Downsampling to lower tiers uses a Lanczos filter after compositor completion. The compositor also runs a parallel normal map pipeline producing a 1024px normal map alongside the colour map.

**⚠️  Open Ambiguities & Decisions Required**

* Transparency and blending order for overlapping horses is unresolved. Options: painter's algorithm (correct but per-frame sorting), Z-buffer with alpha cutout (no sorting, hard edges on mane/tail), or order-independent transparency (expensive). Must decide before building the horse renderer.

* Shared vs. separate renderer instances for grazing mode and running mode bake is undefined. Shared WebGL state between a live render and a bake process is a source of subtle bugs.

* Normal map regeneration for post-birth scars is undefined. Are scars colour-only overlays, or does the normal map regenerate when scars are added?

# **6\. 3D Model & Rigging**

## **Base Mesh**

One base horse mesh, authored in Blender at real-world scale (1.5–1.7m at shoulder). Polygon count: 800–1500 triangles. Low poly is appropriate — detail comes from textures and normal maps, not geometry. Exported as GLTF/GLB with Y-up orientation.

## **Morph Targets (Shape Keys)**

Morph targets blend the base neutral form continuously. Applied via morphTargetInfluences in Three.js, driven by the horse's proportions data in its genome JSON. IMPORTANT: Morph targets do NOT affect UV coordinates. This is a known and accepted tradeoff — very long-legged horses will have slightly compressed markings, which reads as natural.

Morph targets include (not exhaustive): legLength, neckLength, dishFace, broadForehead, heavyBuild, fineBuild, highWithers, broadChest.

## **The Landmark System**

Landmarks are named semantic positions on the horse mesh. They decouple coat generators from the UV map — generators say 'place marking at FOREHEAD' and the landmark system translates that to current UV coordinates. If the UV map ever changes, only the landmark file updates. Generators are untouched.

Landmarks are generated automatically via a Blender Python export script. Named Empty objects in the Blender scene are projected onto the mesh surface, UV coordinates found, and the landmark JSON written automatically. Modders use the same workflow.

Every horse stores the landmark version it was generated with. When the UV map updates, the version increments. Old horses flag for re-bake. All previous landmark files ship with every game update.

Coat generators receive a lookup function — never raw UV coordinates:

alterCoat: (ctx) \=\> {

  const foreheadUV \= ctx.landmark('forehead');

  const faceRegion \= ctx.region('face');

  // draw at foreheadUV within faceRegion

}

## **Model Registry**

The engine never loads a model file directly. It loads whichever model is registered under a semantic ID. All mappings from engine semantic names to GLTF internal names live in the registry. Modders can register new models or override existing ones.

**⚠️  Open Ambiguities & Decisions Required**

* The complete list of required core animation semantic names and morph target names every model must implement has not been formally written out. Must be documented before any modding guide is written.

# **7\. UV Mapping & Coat Textures**

## **Texture Resolution**

1024×1024 for ALL coat generation. Single working resolution. Generators are never resolution-aware. Downsampling is handled externally after generation.

## **Seam Placement**

| Seam | Location & Rationale |
| :---- | :---- |
| Body | Centreline of belly, chest to tail base. Markings almost never cross the belly midline. |
| Legs | Down the back of each cannon bone and pastern to hoof. Always faces away from camera. |
| Head | Under jaw, throatlatch to chin. Keeps entire face as one uninterrupted island. |
| Ears | Inner surface of each ear. Small enough that placement rarely matters. |
| Mane / Tail / Forelock | Entirely separate models — no seams needed on base body for these. |

## **UV Island Layout**

All sides of the horse receive EQUAL UV real estate. The horse wanders and faces both directions — left and right must have identical texel density. No mirroring of legs — each leg has its own unique UV island to support fully asymmetric markings.

| UV Region | Approximate Allocation |
| :---- | :---- |
| Left body side | \~25% of UV space |
| Right body side | \~25% of UV space |
| Head | \~10% |
| Each leg (×4) | \~5% each \= 20% total |
| Mane/tail reference / misc | \~10% |

## **Cutie Mark System**

The cutie mark is a screen-space decal, not a UV-space texture. A named anchor point (flank\_left, flank\_right) is projected from 3D world space to 2D screen space at render time. The cutie mark image is drawn centred on that point, scaled proportionally. It NEVER stretches with morph deformation.

In Detail View: implemented as Three.js DecalGeometry — sits fractionally above the mesh surface, receives full PBR lighting. On pre-baked sprites: 2D canvas drawImage as a final compositor step. Renders UNDER all post-processing shaders, inheriting all material effects.

**⚠️  Open Ambiguities & Decisions Required**

* When rendering a horse as a far-distance imposter, the cutie mark must be incorporated into the imposter image. The pipeline for this (does the imposter bake include a decal pass?) is not defined.

# **8\. Normal Maps & Surface Profiles**

## **Surface Profile System**

Surface profiles define microstructure appearance. Each profile contains a tiling normal map and roughness parameters applied over the coat texture. The profile is heritable — a gene can write a surface profile ID into the trait bag, making scales or unusual textures breedable traits.

## **Per-Foal Composite Normal Maps**

The normal map compositor runs at birth in parallel with the colour coat compositor. Base layer is the active surface profile's tiling normal map. Gene layers that modify surface type stamp their own tiling normal map into specific UV regions on top. If no gene modifies the normal map, the horse uses the shared default and no custom normal map is stored (a flag in horse data indicates which).

**⚠️  Open Ambiguities & Decisions Required**

* Normal map blending ownership is unresolved. The coat compositor produces a generated normal map. The surface profile system provides a tiling normal map. Who combines them — the coat compositor, the material system at load time, or a runtime shader? Must be decided before building either system.

* Cartoon shader treatment of surface profiles in running mode: should scales horses look visibly different under cartoon posterisation, or should the shader ignore surface normals for all horses in running mode for visual consistency?

* Modder shader extension contract: what exactly can modders replace — only material inputs (normal map, roughness), or entire shader passes? Without a formal contract, modded shaders can break the pipeline.

# **9\. Mane, Tail & Forelock System**

Mane, tail, and forelock are ENTIRELY SEPARATE from the base horse mesh. Independent GLTF models with their own UV maps, coat layer stacks, attachment manifests, and physics simulation. The base horse has no mane or tail geometry. The base game ships defaults; modders can replace any independently.

## **Physics Simulation**

Verlet chain simulation. Each strand: 6–8 connected points. Root point rigidly attached to a named skeleton landmark. All lower points simulated, affected by gravity and horse velocity. Physics parameters are defined in the attachment manifest.

| Parameter | Effect |
| :---- | :---- |
| strandCount | Number of hair strands simulated |
| chainLength | Points per strand (6–8) |
| stiffness | 1.0 \= rigid (braided mane). Low \= flowing fantasy mane. |
| damping | How quickly motion settles |
| velocityInfluence | How much horse movement affects the mane/tail |

For running mode sprite baking: physics simulation runs forward briefly before capturing each frame, so the mane has settled into a natural resting position. Not simulated in real-time during running mode.

## **⚠️  CRITICAL UNRESOLVED: Depth Compositing**

A horse viewed from the side has its mane in front of its neck from some angles and behind it from others. This is the single most architecturally consequential unresolved question in the rendering system. Must be resolved before building either the mane system or the main horse renderer.

| Option | Tradeoff |
| :---- | :---- |
| Accept interpenetration artifact | Simplest. Mane sometimes visually clips through neck. Aesthetics cost. |
| Stencil buffer approach | Correct result. Constrains how other transparency in the scene works. |
| Per-frame depth sorting (separate draw calls) | Correct result. Performance cost. Complexity cost. |

**⚠️  Open Ambiguities & Decisions Required**

* Collision between multiple horses' mane physics chains when horses stand close together is not addressed. Options: accept visual interpenetration, implement cheap inter-chain repulsion, or enforce minimum distances between job locations.

# **10\. Appendage System**

Appendages (wings, horns, armour, etc.) are independent 3D models that attach to the horse at named landmark points. The horse model is NEVER modified. The engine composes them at load time. Maximum 5 appendages per horse.

## **Attachment Resolution**

The engine finds the host landmark's position and surface normal in the horse's current morphed space. The appendage root bone is placed at that position with orientation from the surface normal. Morph targets automatically shift landmark positions — appendages follow body deformation automatically.

## **Animation Bindings**

Appendage animations play on their own additive layer above the horse's base animation. They bind to semantic game event triggers (on\_jump, on\_idle, on\_gallop). Multiple appendages can respond to the same trigger; priority determines the winner.

**⚠️  Open Ambiguities & Decisions Required**

* Data model boundary between genetics-driven appendages and player-applied clothing is not formally defined. Should probably be an explicit policy that clothing cannot interact with genetics.

* The running mode sprite bake must handle arbitrary modded appendages. The cartoon shader is not guaranteed to work on all possible geometry. A modder validation tool or mechanism for supplying hand-drawn running sprites should be considered.

# **11\. Animation System**

## **Layer Architecture**

| Layer | Drives | Used By |
| :---- | :---- | :---- |
| layer\_full\_body | All bones | Locomotion animations |
| layer\_upper\_body | Spine, neck, head | Actions, head movements |
| layer\_legs\_front | Front legs only | Specialised gaits |
| layer\_legs\_rear | Rear legs only | Specialised gaits |
| layer\_tail | Tail root | Tail expressions (before physics takes over) |
| Appendage layers | Appendage bones | Per appendage, always additive |

## **Neutral Poses**

Every animation must start and end at a declared Neutral Pose. Neutral poses are named stable interruptible states. Core neutral poses: neutral\_standing, neutral\_gallop\_mid, neutral\_trot\_mid, neutral\_alert, neutral\_grazing. Mods can register additional neutral poses.

## **Animation Types & Transitions**

| Type | Behaviour | Transition Rule |
| :---- | :---- | :---- |
| Locomotion | Cyclic. Lives on layer\_full\_body. Time-scales with speed. | Synchronised cross-fade at shared phase points (e.g. moment of full extension). Upward transitions feel snappy. Downward transitions feel like horse collecting. |
| Action | One-shot. Plays to completion, then returns to base layer. | Interrupts base layer. Additive blend on appropriate body layer. Fades out on finish. |
| Idle | Low-energy cyclic. Suppressed when locomotion speed above a walk. | Frozen cross-fade from locomotion freeze pose. |

## **Running Mode Tag**

Every animation descriptor includes a running mode eligibility flag. eligible: false is the default for all mod animations. eligible: true allows running mode play, but users can still override to false in settings. isBuiltin: true (gallop, walk, idle standing) cannot be disabled by anyone. Filtered registry built at mode start — immutable for session.

**⚠️  Open Ambiguities & Decisions Required**

* Audio system is entirely undefined. If audio sync hooks need to fire on animation events (hoof sounds, vocalisations), this must be designed into the animation event system from the start.

* Paired animation system for social interactions (mutual grooming requires two horses playing complementary clips simultaneously) has no defined interruption behaviour. What happens if one horse is reassigned mid-paired-animation?

# **12\. Camera System**

## **Spherical Coordinate Camera**

The camera always points at world origin (crystal ball centre). Position is derived from three values: polar angle, azimuth, and radius.

camera.position.set(

  radius \* Math.sin(polar) \* Math.cos(azimuth),

  radius \* Math.cos(polar),

  radius \* Math.sin(polar) \* Math.sin(azimuth)

)

camera.lookAt(worldOrigin)

| Control | Input | Constraint |
| :---- | :---- | :---- |
| Azimuth (left/right) | A / D keys | Wraps freely 0 to 2π |
| Polar (up/down) | W / S keys | Clamped — cannot go below ground. Can traverse full sphere surface including over the top. |
| Radius (zoom) | Scroll wheel | Tight range. Always feels like peering into sphere from outside. |

Default polar angle: 45-degree game isometric. Camera decelerates as it approaches polar limits (soft stop, never a hard snap). WASD input is suppressed entirely during UI form entry — resumes when form loses focus.

## **Crystal Ball Edge Shader**

The 3D scene renders to a circular render target. The edge shader applies vignette darkening, chromatic aberration, and lens distortion toward the rim. Distortion is more prominent at maximum zoom-out (god far from ball), less at close zoom. All parameters tuned during testing.

**⚠️  Open Ambiguities & Decisions Required**

* Ground constraint mechanism needs a formal definition per environment. Either a world-space plane at defined Y, or a minimum polar angle in the environment definition file. Without a formal contract, modders cannot specify this correctly.

* The render target handoff — the crystal ball edge shader needs both the 3D scene colour texture and the ball boundary in screen space. Whether this shader lives in the 3D renderer or the UI compositor, and what data contract exists between them, is not yet defined.

# **13\. Grazing Mode**

## **Concept & Art Direction**

Grazing mode is a diorama viewed through a crystal ball. The player is an ancient god watching their herd through a precious glass sphere. Every artistic decision reinforces this framing. The scene is a theatre stage art-directed for the fixed camera angle. Everything is designed for the god's perspective looking into the ball.

## **Scene Layer Structure**

| Layer | Contents & Performance |
| :---- | :---- |
| Background | Sky, distant terrain silhouettes, atmospheric elements. Mostly static — essentially free to render. Clouds drift. Single plane mesh with painted/procedural texture. |
| Mid-background | Large environmental features (tree lines, cliff faces, hills). Low poly. Never interactive. No horses. |
| Mid-ground | Where all horses live. Highest quality rendering. Ground surface, rocks, water features, props, all job locations. |
| Foreground | Elements between camera and horses. Slight depth-of-field blur. Acts as compositional frame reinforcing depth. |

## **Fog Rules**

Fog is a DEPTH CUE only, never an atmosphere blanket. Height-based ground fog only, sitting below \~0.5m. Catches horse legs slightly in forest/plains. Lifts completely on beach and mountain environments. Distance fog only affects the background layer — never touches horses. Horses always read crisply against whatever is behind them.

## **LOD System**

| Tier | Quality | Cost |
| :---- | :---- | :---- |
| Full quality (close range) | 512px coat (standard) / 256px (low graphics). Live physics mane/tail. Full skeleton animation. Real-time shadows. | Most expensive. Limit to 3–8 horses near camera centre. |
| Medium LOD (mid range) | 256px coat. Baked swaying mane/tail animation. Skeleton updates every other frame. Blob shadow only. | Moderate. 5–10 horses. |
| Imposter (far range) | Flat billboard quad, pre-rendered image, updates every 2–3 seconds. | Essentially free. All remaining horses. |

Hysteresis rule: The upgrade threshold distance is not the same as the downgrade threshold distance. The gap between them prevents oscillation for horses near the boundary. LOD tier transitions are instant (snap, no cross-fade). Upgrade rate limited — at most N horses upgrade per frame. Priority goes to horses nearest camera centre.

Imposter regeneration: All imposters regenerated every time grazing mode is entered. Horses without a valid imposter show a placeholder during regeneration. Acceptable because mode swaps are infrequent.

## **Job System**

A job location is a named point in the environment with an animation type, optional prop, and capacity. Horses are assigned to job locations when grazing mode is entered. Capacity prevents clipping. Social jobs require minimum occupancy (no single horse performing a social animation alone). requiresAdult flag marks locations foals cannot hold independently.

Paired animations for social interactions (mutual grooming) assign two horses as a unit and release them as a unit.

**⚠️  Open Ambiguities & Decisions Required**

* Imposter billboarding type is unresolved — MUST DECIDE BEFORE BUILDING IMPOSTER SHADER. Options: spherical (always faces camera — perspective incorrect at off-angles), cylindrical (rotates vertical axis only — industry standard for characters), fixed-direction (faces bake angle only).

* Lighting rig interaction with imposters: imposters baked under neutral lighting won't match dramatic scene lighting. Policy: tint imposter quads with scene colour grade as approximation. Exact implementation not defined.

* Environmental object occlusion policy: when a horse is behind a tree, does this affect its LOD priority? Does clicking a partially occluded horse register?

* Formal vs. informal environment layer system: must objects declare their layer in scene files (formal), or just use Z-depth placement (informal)? Formal allows global layer-based render settings but requires modders to declare layer membership.

* Depth of field during camera movement: does DOF recalculate dynamically (requires depth buffer pass) or is it a fixed screen-space blur on the foreground layer?

# **14\. Running Mode**

Running mode is a Sonic-style side-scrolling runner. It is DELIBERATELY cartoony — a different artistic world from grazing mode. The visual simplicity is intentional. NO 3D rendering occurs during running mode. Everything is pre-baked sprites. The cartoon aesthetic is a design choice, not a limitation.

## **Sprite Pipeline**

Running mode sprites are baked at birth using the cartoon shader applied to the 3D scene. Two spritesheets per horse: left-facing and right-facing. These are NEVER MIRRORED — all horses are treated as fully asymmetric. Sprites are stored to disk permanently and NEVER reflect post-birth changes.

## **Cartoon Shader Stages**

| Stage | Effect |
| :---- | :---- |
| Posterisation | Reduces continuous PBR shading to 3–4 discrete light bands. The foundational cel-shading step. |
| Outline pass | Silhouette lines via back-face expansion. Interior edges via normal-change detection. |
| Colour simplification | Saturation boost. Compresses subtle coat tone variations toward flatter, more saturated values. |
| Specular suppression | Removes or heavily reduces PBR specular highlights. Cartoon horses don't have shiny coats. |

Bake lighting: canonical neutral running-mode light defined in a config file. All horses baked under identical lighting. Running maps apply colour grade overlays at runtime on top — horses look consistent against all running map overlays.

**⚠️  Open Ambiguities & Decisions Required**

* Cartoon shader treatment of modded surface profiles — scales horses will have different normal data feeding posterisation. Is this visual variety intentional, or should all horses use flat lighting in running mode?

* Modded appendages in the cartoon shader bake — shader not guaranteed to work on arbitrary geometry. A modder validation tool or hand-drawn sprite submission mechanism should be considered.

* Running sprite re-bake policy — currently never updated after birth. If this policy ever changes, the pipeline needs formal definition.

# **15\. Detail View**

Full real-time 3D render of a single horse. Free orbit camera. Maximum quality. The player can rotate, tilt, zoom freely around the horse. 1024px coat texture (full resolution — only context where this is displayed live).

Uses the SAME render pipeline as grazing mode — same PBR materials, same lighting rig, same physics mane simulation, same coat texture system. No separate pipeline to maintain.

The player can apply any unlocked environment's lighting rig to the detail view. This is the camera mode feature — golden hour, overcast, stable interior, etc. as backdrop for inspecting a horse.

# **16\. Book View & Atlas System**

The Book shows all horses as browsable thumbnails. All thumbnails are pre-baked at birth — the Book opens instantly with no generation on demand.

| Property | Value |
| :---- | :---- |
| Atlas sheet size | 2048×2048px — holds 256 thumbnails at 128×128px each |
| Atlas series | Two series: left-facing and right-facing (stored separately) |
| Index file | atlasIndex.json maps each horse ID to sheet number and pixel coordinates for both orientations |
| Slot management | Next free slot allocated at birth. Slot freed and reused on horse death. |
| Regeneration | Never regenerated after birth under normal circumstances. |

Clicking a horse thumbnail triggers detail view. If the 1000px detail frame is not cached, it generates (50–150ms, shows loading shimmer). Cached to disk on first generation. Subsequent views instant.

# **17\. Asset Storage & Caching Tiers**

| Tier | Content | Storage | Lifetime |
| :---- | :---- | :---- | :---- |
| Atlas thumbnails (L+R) | 128px, atlas-packed | IndexedDB, permanent | Forever from birth |
| Running sprites (L+R) | 256px spritesheet, cartoon | IndexedDB, permanent | Forever from birth |
| Detail static frame | 1000px single frame | IndexedDB, lazy | From first click |
| Grazing real-time | Live render — no baking | RAM only | Never stored |
| Imposter images | 64–128px, 8 angles | IndexedDB | Re-baked on mode entry |
| Horse JSON data | Genome, epigenetics, etc. | IndexedDB | Forever |

# **18\. Mod System**

## **What Modders Can Do**

* Register new genes with custom alterCoat and alterNormal functions

* Register new surface profiles (normal maps, roughness maps)

* Register new appendage models with attachment manifests

* Register new mane/tail/forelock models with physics parameters

* Register new animations with JSON descriptors

* Register new environment scenes with lighting, fog, and object placement

* Register new environmental prop objects (3D GLTF or billboard PNG)

* Register new cutie mark images

* Override existing registered items by ID (subject to conflict resolution policy)

## **Validation at Mod Load Time**

All hostLandmark references checked against horse landmark file. All animation entry/exitNeutral values checked against neutral pose registry. All model registry entries checked for required core animation and morph target mappings. Clear specific error messages for all failures, naming exactly what is missing. Duplicate allele IDs throw a hard crash at startup.

**⚠️  Open Ambiguities & Decisions Required**

* Mod load order and conflict resolution policy is not defined. MUST DECIDE BEFORE BUILDING MOD LOADER. When two mods register the same ID: last-loaded wins? First-loaded wins? Hard error?

* Mod versioning and missing-mod handling: what does a horse look like when a mod gene, appendage, or model it depends on is no longer installed? Fallback behaviour must be defined before the horse data format is finalised.

* Modder shader extension contract: what exactly can modders replace — material inputs only, or entire shader passes? Without a formal contract, modded shaders can break the pipeline.

# **19\. Environmental System**

## **Environmental Object Types**

| Type | Description | Best For |
| :---- | :---- | :---- |
| Full 3D | GLTF mesh rendered normally. Proper geometry, shadows, normal maps. | Foreground / mid-ground elements player may zoom close to. |
| Billboard imposter | Flat quad facing camera, displaying a PNG. Modders need no 3D skills. | Distant background elements. Degrades visibly at close range. |
| Hybrid | Full 3D at close range, billboard beyond a defined distance. Billboard ideally pre-rendered from the scene camera angle. | Recommended for mid-ground objects modders want to look good up close. |

## **Sky System**

Physically accurate sky model (Three.js Sky — Preetham or Hosek-Wilkie). Uses the environment's key light direction as sun position. Produces accurate sky colour from any camera angle. Automatically matches the lighting rig. Looks correct from all camera positions including side-on and near-top.

**⚠️  Open Ambiguities & Decisions Required**

* Formal vs. informal environment layer system: must objects declare their layer in scene files, or just use Z-depth placement? Formal enables global layer-based render settings (e.g. disable shadows on background layer globally). Informal is simpler for modders.

* Ground plane definition per environment: how environments specify the camera polar angle floor constraint is not formalised.

* Environmental object state: can objects change during a grazing session (depleting hay bale)? If yes, needs a state system. Should probably be explicitly ruled out to prevent scope creep.

# **20\. Foal Behaviour**

Foals are NOT independent agents. A foal is an attachment to its mother's scene entity. Position is always derived from the mother's position plus an offset. Foals never pathfind independently. Foals never hold job locations independently. When the mother moves, the foal follows.

| State | Condition | Behaviour |
| :---- | :---- | :---- |
| Playing (default) | Daytime, mother at stationary job | Gentle wandering within leash radius. Occasional bursts — small kicks, circling. Most visually alive state. |
| Nursing | Nursing interval elapsed, mother stationary | Foal moves to mother's flank. Paired nursing animation on both. Returns to playing after. |
| Sleeping | Night / rest period | Foal lies down near mother with small random offset. Mother stands guard or grazes slowly nearby. |
| Grazing | Yearling transition | Foal begins grazing near mother before graduating to full job eligibility. |

Nursing interval is an epigenetic value — set at birth, never changes. Adds natural individuality to observed behaviour without additional systems. At yearling age, foals graduate to full job eligibility and become independent agents.

# **21\. Post-Birth Appearance Changes**

Horses can gain scars, clothing, and equipment after birth. These affect appearance in GRAZING MODE and DETAIL VIEW ONLY. Running mode sprites are NEVER updated — the birth sprite is the running sprite forever.

Post-birth modifications are implemented as additional coat layers composited dynamically on top of the baked base coat (priority 255 reserved for runtime overlays). Clothing uses the appendage system. Scars are coat layer overlays.

Clothing and scars load only for horses at close LOD range. Far-distance imposters do not reflect post-birth changes until the next mode entry (when imposters are regenerated).

**⚠️  Open Ambiguities & Decisions Required**

* Normal map regeneration for scars is undefined. Scars ideally have raised/indented surface detail requiring normal map modification. Is the normal map immutable after birth (scars are colour-only overlays), or regenerated?

* The data model boundary between appendage-type clothing and genetics-driven appendages needs explicit definition. Can clothing interact with genetics? Recommend explicit policy of 'no'.

# **22\. Performance Budgets**

| Mode | Target | Main Cost |
| :---- | :---- | :---- |
| Running Mode | Maximum FPS. Never drops below playable. | Sprite blitting only. No GPU cost per horse. Bottleneck: canvas operations. |
| Grazing Mode | Minimum 20 FPS. Stuttering acceptable. | PBR shader on close-range horses. Mane/tail physics chains. Imposter regeneration at mode entry. |
| Detail View | 60 FPS target. | Trivial. One horse, low polygon count. |

**⚠️  Open Ambiguities & Decisions Required**

* The complete graphics quality settings matrix is not defined. At minimum: coat texture resolution scales, shadow quality scales. What else reduces on low graphics?

* A fallback mode for low-end integrated GPUs that cannot maintain 20 FPS in grazing mode has not been designed.

# **23\. Summary: All Open Decisions**

## **BLOCKING — Must Decide Before Building**

The following decisions will cause painful refactoring if deferred:

| Decision | Blocks |
| :---- | :---- |
| Mane/tail depth compositing method (interpenetration, stencil, or depth sort) | Horse renderer \+ mane system |
| Imposter billboarding type (spherical, cylindrical, or fixed) | Imposter shader |
| Transparency/blending order for overlapping horses | Horse renderer |
| Mod load order and conflict resolution policy | Mod loader |
| Central event bus architecture | All cross-system communication |
| Audio system existence and animation sync hooks | Animation system |
| Normal map blending ownership | Coat compositor \+ material system |
| Ground plane definition contract per environment | Camera system \+ environments |
| Formal vs. informal environment layer system | Scene renderer \+ modding guide |

## **NON-BLOCKING — Tune During Testing**

* All specific numerical values (LOD thresholds, camera speeds, physics parameters, animation cross-fade durations, fog densities)

* Crystal ball edge shader visual parameters (vignette strength, chromatic aberration, lens distortion curve)

* Complete list of required core animation semantic names and morph target names every model must implement

* Graphics quality settings matrix beyond coat texture resolution

* Fallback mode for low-end hardware

* Running sprite re-bake policy

* Whether environmental objects can have dynamic state (depleting hay bales, etc.)

* Data model boundary between clothing and genetics-driven appendages

* The canonical test horse genome for regression testing

*Document generated from design conversation. Version 1.0. All systems subject to revision during implementation.*