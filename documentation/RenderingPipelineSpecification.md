# Rendering Pipeline Specification

Version 2.0 | Status: Authoritative

---

## 1. Game Overview & Framing

GlassHorses is a horse breeding simulator combined with a side-scrolling runner. The player is an ancient god observing their herd through a crystal ball — a glass sphere through which destiny is watched and shaped. All visual and UI decisions serve this framing.

**See also**: SettingSpecification.md (world and god framing), GeneImplementation.md (genetics pipeline), TravelSpecification.md (running mode context), DualVersionSpecification.md (platform architecture).

---

## 2. Platform Architecture

### Target Runtime: Electron (Desktop-First)

The game targets **Electron** as its primary runtime. Electron wraps a Chromium instance alongside a Node.js process, giving the renderer full access to both browser APIs and the local filesystem. This has direct consequences for every rendering and storage decision in this document.

| Component | Technology | Notes |
|-----------|-----------|-------|
| Runtime | Electron (Chromium + Node.js) | Desktop only. No mobile optimisation. |
| 3D Rendering | Three.js with WebGL | Via OffscreenCanvas in Web Workers |
| Asset Storage | Local filesystem via Node.js `fs` | See Section 17. IndexedDB is **not** used. |
| 3D Assets | GLTF/GLB | Authored in Blender, Y-up export |
| Coat Compositor | OffscreenCanvas 2D in Web Workers | Shared worker pool |
| Game Data | SQLite via `better-sqlite3` | Mirrors web PostgreSQL schema |

### Why Electron Changes Storage

The original spec used IndexedDB for all persistent asset storage (baked PNGs, spritesheets, atlas thumbnails). In Electron, the Node.js process has direct filesystem access. All baked image assets are written to disk as standard files in the user's AppData directory. SQLite stores all structured game data (horse JSON, genome records, asset path references). This approach:

- Mirrors the web PostgreSQL schema closely, reducing migration cost
- Makes baked assets inspectable and debuggable without browser tooling
- Avoids IndexedDB size limits and corruption risks on long-running saves
- Simplifies the modding pipeline — mod assets are folders on disk, not blobs in a browser store

### Web Version Compatibility

The rendering pipeline is written to be platform-agnostic at the Three.js/WebGL layer. The storage abstraction layer (Section 17) is the only component that differs meaningfully between Electron and web. All coat generation, sprite baking, and real-time rendering code runs identically on both platforms. The storage layer calls a unified interface; the implementation beneath it swaps between `fs` (Electron) and PostgreSQL blob storage or CDN URLs (web).

### Browsers Supported (Web Version)

Chrome 88+, Firefox 90+, Safari 16.4+. OffscreenCanvas required. Electron's bundled Chromium always satisfies this.

---

## 3. Visual Modes

| Mode | Visual Style | Performance Target |
|------|-------------|-------------------|
| **Grazing Mode** | Nearly photo-realistic real-time 3D. Primary experience. | Min 20 FPS. Stuttering acceptable. Quality over framerate. |
| **Running Mode** | Deliberately cartoony. Pre-baked sprites only. Zero 3D at runtime. | Maximum FPS. No 3D rendering whatsoever. |
| **Detail View** | Full real-time 3D, free camera, maximum quality. One horse. | 60 FPS target. |
| **Book View** | 2D atlas thumbnails. Instant display. | Negligible cost. |

Running Mode sprites are baked at birth using the cartoon shader applied to the 3D scene. **Running mode sprites are never updated after birth.** A horse that gains scars, clothing, or equipment post-birth appears unscarred in the running minigame. This is intentional — the running sprite represents the horse's essential self, not their current state. Players should be informed of this when scars or equipment are first applied.

---

## 4. Coordinate System & Units

- **1 unit = 1 metre.** Consistent across all systems including running mode physics.
- **Y-up.** Three.js is Y-up. GLTF exports from Blender use Y-up. Modders working in Blender do not need to manage this — the export converts automatically. All landmark normals, appendage offsets, and world-space math assume Y is up.
- **Horse scale**: Base mesh authored at 1.5–1.7m at the shoulder.

### Crystal Ball Scene Sizes

| Adult Horses in Herd | Ball Diameter |
|---------------------|---------------|
| 1–20 | 0.5 km (500 units) |
| 20–100 | 1 km (1,000 units) |
| 100–200 | 2 km (2,000 units) |
| 200+ | 5 km (5,000 units) |

Ball size is fixed when Grazing Mode is first entered for a session. It does not change in real-time. It is keyed to adult horse count only. When the player re-enters Grazing Mode after the adult count crosses a threshold, the scene reloads entirely. This reload must be communicated to the player via a loading transition — no silent freeze.

**⚠️ Open Decision**: Ground plane definition per environment is not formalised. Must be a formal property of each environment's scene definition file — either a flat plane at a defined Y height, or a minimum polar camera angle. Without this contract, modders cannot correctly constrain camera movement for custom environments. **Blocking for modding guide.**

---

## 5. Genetics & Rendering Architecture

Genetics and rendering are deliberately decoupled.

```
Genome → TraitResolver → HorseTraits → Renderer
```

Genes do not draw anything. They produce trait values that the renderer reads. This abstraction is what makes the system moddable — new genes produce new traits, new renderer layers consume them.

### The Epigenetics Rule

**ZERO calls to `Math.random()` inside any coat generator function.** All randomness is resolved at birth when epigenetic values are set. The renderer is a pure function of genome + epigenetic values. Identical input always produces identical output.

`Math.random()` is permitted only during the breeding/birth process when epigenetic values are first established.

Epigenetic values are direct renderer parameters. A tobiano gene's `patch_count`, `patch_spread`, `edge_roughness`, and `white_dominance` are resolved at birth and fed directly to the compositor.

### Core Genes (Priority Order)

| Gene | Priority | Effect |
|------|----------|--------|
| base_extension | 0 | Whether black pigment can express (E/e) |
| base_agouti | 0 | Whether black restricts to points (A/a) |
| base_champagne | 50 | Champagne dilution |
| base_cream | 50 | Cream dilution — 1 copy palomino/buckskin; 2 copies cremello/perlino |
| base_grey | 100 | Progressive greying with age (dominant) |
| base_splash | 255 | Splash white marking pattern |

### Gene Definition Format

```javascript
module.exports = {
  name: 'extension',
  prefix: 'base',
  priority: 0,
  alleles: ['base_extension_E', 'base_extension_e'],
  epigenetics: {
    pigmentRestriction: { noisePercent: 5, defaultRange: [70, 95] }
  },
  alterCoat:   (ctx) => { /* paints coat colour layer at 1024px */ },
  alterNormal: (ctx) => { /* optional: paints normal map layer */ }
};
```

**⚠️ Open Decision**: Save schema migration strategy is not defined. When new gene loci are added, existing horses need a migration path. A formal save schema version number (separate from landmark versions) must be designed before the first public release. In Electron/SQLite, this is a database migration; in the web version, a PostgreSQL migration. Both must be coordinated.

**⚠️ Open Decision**: Missing-mod handling is not defined. When a saved horse references a mod gene no longer installed, a fallback visual must be defined. This must be resolved before the horse data format is finalised.

---

## 6. Horse Rendering: The Three Pipelines

All baked output is stored on the local filesystem (Electron) or equivalent persistent storage (web). Paths are recorded in the horse's SQLite record.

| Pipeline | Output | When | Storage |
|----------|--------|------|---------|
| **A — Atlas Thumbnail Bake** | 128px single frame, atlas-packed. Left + right facing. | At birth. Permanent. | Filesystem: `AppData/GlassHorses/atlas/` |
| **B — Running Sprite Bake** | 256px spritesheet, cartoon shader. Left + right facing. | At birth. Permanent. Never updated. | Filesystem: `AppData/GlassHorses/sprites/` |
| **C — Grazing / Detail Real-Time** | Full 3D PBR render. 512px coat (grazing) or 1024px (detail). | Live every frame. | RAM only. Never stored. |

Pipelines A and B run in a Web Worker using OffscreenCanvas. The main thread queues bake requests; the worker processes them and writes finished files via the Node.js IPC bridge to the main process, which writes to disk. The main thread is never blocked by a bake.

---

## 7. Coat Layer Stack

The compositor always runs at **1024×1024**. Generators are never resolution-aware. Downsampling to lower tiers uses a Lanczos filter after compositor completion. A parallel normal map pipeline runs alongside, producing a 1024px normal map.

| Priority | Layer |
|----------|-------|
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

Runtime overlays (priority 255) are never baked. They are composited dynamically in grazing and detail view only, applied to the live render. Far-distance imposters do not reflect runtime overlays until the next mode entry.

**⚠️ Open Decision**: Normal map regeneration for scars is undefined. Scars ideally produce raised/indented surface detail requiring normal map modification. Decision required: are scars colour-only overlays (normal map immutable after birth), or does the normal map regenerate when scars are added? **Non-blocking but affects visual quality.**

---

## 8. 3D Model & Rigging

### Base Mesh

One base horse mesh, authored in Blender at real-world scale (1.5–1.7m at shoulder). Target polygon count: 800–1,500 triangles. Low poly is intentional — detail comes from textures and normal maps. Exported as GLTF/GLB.

### Morph Targets (Shape Keys)

Morph targets blend the base neutral form continuously, driven by the horse's proportions data. Applied via `morphTargetInfluences` in Three.js.

**Important**: Morph targets do not affect UV coordinates. Very long-legged horses will have slightly compressed markings in UV space. This is a known, accepted tradeoff — it reads as natural variation.

Core morph targets (not exhaustive): `legLength`, `neckLength`, `dishFace`, `broadForehead`, `heavyBuild`, `fineBuild`, `highWithers`, `broadChest`.

**⚠️ Open Decision**: The complete required list of core animation semantic names and morph target names that every model must implement has not been written. This must be documented before any modding guide is published.

### The Landmark System

Landmarks are named semantic positions on the horse mesh. They decouple coat generators from the UV map. Generators say "place marking at FOREHEAD"; the landmark system translates that to current UV coordinates. If the UV map ever changes, only the landmark file updates.

Landmarks are generated automatically by a Blender Python export script. Named Empty objects in the scene are projected onto the mesh surface, UV coordinates found, and the landmark JSON written. Modders use the same workflow.

Every horse stores the landmark version it was generated with. On UV map update, the version increments. Old horses are flagged for re-bake. All previous landmark files ship with every game update.

```javascript
alterCoat: (ctx) => {
  const foreheadUV = ctx.landmark('forehead');
  const faceRegion = ctx.region('face');
  // draw at foreheadUV within faceRegion
}
```

### Model Registry

The engine never loads a model file directly. It loads whichever model is registered under a semantic ID. All mappings from engine semantic names to GLTF internal names live in the registry. Modders can register new models or override existing ones.

In Electron, the model registry is a JSON file on disk in the game's install directory. Mod registries live in the user's mod folder. The engine merges them at startup.

---

## 9. UV Mapping & Coat Textures

All coat generation runs at **1024×1024**. Single working resolution. Generators are never resolution-aware. Downsampling is handled externally.

### Seam Placement

| Seam | Location |
|------|----------|
| Body | Centreline of belly, chest to tail base. Markings almost never cross the belly midline. |
| Legs | Down the back of each cannon bone and pastern to hoof. Always faces away from camera. |
| Head | Under jaw, throatlatch to chin. Keeps the entire face as one uninterrupted island. |
| Ears | Inner surface of each ear. |
| Mane / Tail / Forelock | Entirely separate models — no seams on base body. |

### UV Island Layout

All sides receive equal UV real estate. The horse faces both directions in all modes — left and right must have identical texel density. Each leg has its own unique UV island to support fully asymmetric markings.

| Region | Approximate Allocation |
|--------|----------------------|
| Left body side | ~25% |
| Right body side | ~25% |
| Head | ~10% |
| Each leg (×4) | ~5% each = 20% total |
| Misc / mane reference | ~10% |

### Cutie Mark System

The cutie mark is a screen-space decal, not a UV-space texture. A named anchor point (`flank_left`, `flank_right`) is projected from 3D world space to 2D screen space at render time. The cutie mark image is drawn centred on that point. It never stretches with morph deformation.

- **Detail View**: implemented as Three.js `DecalGeometry`, sitting fractionally above the mesh surface, receiving full PBR lighting.
- **Pre-baked sprites**: 2D canvas `drawImage` as a final compositor step, rendered under all post-processing shaders.

**⚠️ Open Decision**: Far-distance imposter baking must include a cutie mark pass. The pipeline for this is not defined.

---

## 10. Normal Maps & Surface Profiles

### Surface Profile System

Surface profiles define microstructure appearance: a tiling normal map and roughness parameters applied over the coat texture. The profile is heritable — a gene can write a surface profile ID into the trait bag, making scales or unusual textures breedable.

### Per-Foal Composite Normal Maps

The normal map compositor runs at birth in parallel with the colour coat compositor. Base layer is the active surface profile's tiling normal map. Gene layers that modify surface type stamp their own tiling normal map into specific UV regions. If no gene modifies the normal map, the horse uses a shared default — a flag in the horse record indicates which, and no custom file is stored.

**⚠️ Open Decision (Blocking)**: Normal map blending ownership is unresolved. The coat compositor produces a generated normal map. The surface profile system provides a tiling normal map. Who combines them — the coat compositor, the material system at load time, or a runtime shader? Must be decided before building either system.

---

## 11. Mane, Tail & Forelock System

Mane, tail, and forelock are entirely separate from the base horse mesh. Independent GLTF models with their own UV maps, coat layer stacks, attachment manifests, and physics simulation. The base horse has no mane or tail geometry. The base game ships defaults; modders can replace any independently.

### Physics Simulation

Verlet chain simulation. Each strand: 6–8 connected points. Root point rigidly attached to a named skeleton landmark. Lower points simulated, affected by gravity and horse velocity.

| Parameter | Effect |
|-----------|--------|
| strandCount | Number of hair strands simulated |
| chainLength | Points per strand (6–8) |
| stiffness | 1.0 = rigid (braided). Low = flowing fantasy mane. |
| damping | How quickly motion settles |
| velocityInfluence | How much horse movement affects the mane/tail |

For running mode sprite baking, physics simulation runs forward briefly before capturing each frame so the mane is in a natural resting position. Not simulated in real-time during running mode.

**⚠️ Open Decision (Blocking)**: Depth compositing for mane vs neck is unresolved. A horse viewed from the side has its mane in front of its neck from some angles and behind it from others. Must be resolved before building either the mane system or the main horse renderer.

| Option | Tradeoff |
|--------|----------|
| Accept interpenetration | Simplest. Mane sometimes clips through neck. |
| Stencil buffer | Correct result. Constrains transparency elsewhere in scene. |
| Per-frame depth sort | Correct result. Performance and complexity cost. |

---

## 12. Appendage System

Appendages (wings, horns, armour, etc.) are independent 3D models attaching to the horse at named landmark points. The horse model is never modified. Maximum 5 appendages per horse.

The engine finds the host landmark's position and surface normal in the horse's current morphed space. The appendage root bone is placed there with orientation from the surface normal. Morph targets automatically shift landmark positions — appendages follow body deformation.

### Animation Bindings

Appendage animations play on their own additive layer above the horse's base animation. They bind to semantic game event triggers: `on_jump`, `on_idle`, `on_gallop`. Multiple appendages can respond to the same trigger; priority determines the winner.

**Policy**: Clothing cannot interact with genetics. Clothing is player-applied via the appendage system. Genetics-driven appendages (wings, horns) are separate from clothing in the data model. These two categories must never be conflated.

**⚠️ Open Decision**: Running mode sprite baking must handle arbitrary modded appendages. The cartoon shader is not guaranteed to work on all possible geometry. A modder validation tool or a mechanism for supplying hand-drawn running sprites should be designed.

---

## 13. Animation System

### Layer Architecture

| Layer | Drives | Used By |
|-------|--------|---------|
| layer_full_body | All bones | Locomotion animations |
| layer_upper_body | Spine, neck, head | Actions, head movements |
| layer_legs_front | Front legs only | Specialised gaits |
| layer_legs_rear | Rear legs only | Specialised gaits |
| layer_tail | Tail root | Tail expressions (before physics takes over) |
| Appendage layers | Appendage bones | Per appendage, always additive |

### Neutral Poses

Every animation must start and end at a declared Neutral Pose. Core neutral poses: `neutral_standing`, `neutral_gallop_mid`, `neutral_trot_mid`, `neutral_alert`, `neutral_grazing`. Mods can register additional neutral poses.

### Animation Types

| Type | Behaviour | Transition Rule |
|------|-----------|----------------|
| Locomotion | Cyclic. Lives on layer_full_body. Time-scales with speed. | Synchronised cross-fade at shared phase points. Upward transitions: snappy. Downward: horse collecting. |
| Action | One-shot. Plays to completion, returns to base layer. | Interrupts base layer. Additive blend on body layer. Fades out on finish. |
| Idle | Low-energy cyclic. Suppressed above walk speed. | Frozen cross-fade from locomotion freeze pose. |

### Running Mode Tag

Every animation descriptor includes a running mode eligibility flag. `eligible: false` is the default for mod animations. `eligible: true` allows running mode play but users can still override. `isBuiltin: true` (gallop, walk, idle standing) cannot be disabled. A filtered registry is built at mode start and is immutable for the session.

**⚠️ Open Decision (Blocking)**: Audio system is entirely undefined. If audio sync hooks fire on animation events (hoof sounds, vocalisations), this must be designed into the animation event system from the start. Retrofitting is painful.

**⚠️ Open Decision (Blocking)**: Paired animation interruption behaviour is undefined. Mutual grooming requires two horses playing complementary clips simultaneously. What happens if one horse is reassigned mid-paired-animation?

---

## 14. Camera System

### Spherical Coordinate Camera

The camera always points at world origin (crystal ball centre). Position derived from polar angle, azimuth, and radius.

```javascript
camera.position.set(
  radius * Math.sin(polar) * Math.cos(azimuth),
  radius * Math.cos(polar),
  radius * Math.sin(polar) * Math.sin(azimuth)
)
camera.lookAt(worldOrigin)
```

| Control | Input | Constraint |
|---------|-------|-----------|
| Azimuth | A / D keys | Wraps freely 0 to 2π |
| Polar | W / S keys | Clamped — cannot go below ground. Can traverse full sphere including over the top. |
| Radius | Scroll wheel | Tight range. Always feels like peering into sphere from outside. |

Default polar angle: 45-degree isometric. Camera decelerates approaching polar limits (soft stop, never hard snap). WASD suppressed during UI form entry — resumes when form loses focus.

### Crystal Ball Edge Shader

The 3D scene renders to a circular render target. The edge shader applies vignette darkening, chromatic aberration, and lens distortion toward the rim. Distortion is more prominent at maximum zoom-out. All parameters tuned during testing.

**⚠️ Open Decision (Blocking)**: The render target handoff between the 3D renderer and the crystal ball edge shader needs a defined data contract — which system owns the render target, and what does the shader receive. Must be decided before building the camera system.

---

## 15. Grazing Mode

### Scene Layer Structure

| Layer | Contents |
|-------|----------|
| Background | Sky, distant terrain silhouettes, atmospheric elements. Mostly static. Clouds drift. |
| Mid-background | Large environmental features (tree lines, cliff faces). Low poly. Never interactive. No horses. |
| Mid-ground | All horses. Highest quality rendering. Ground surface, rocks, water, props, job locations. |
| Foreground | Elements between camera and horses. Slight depth-of-field blur. Compositional frame. |

### Fog Rules

Fog is a depth cue only, never an atmosphere blanket. Height-based ground fog only, sitting below ~0.5m. Catches horse legs slightly in forest/plains environments. Lifts completely on beach and mountain. Distance fog affects background layer only — never touches horses. Horses always read crisply.

### LOD System

| Tier | Quality | Approximate Count |
|------|---------|------------------|
| Full quality | 512px coat. Live physics mane/tail. Full skeleton. Real-time shadows. | 3–8 horses near camera centre |
| Medium LOD | 256px coat. Baked swaying mane/tail. Skeleton every other frame. Blob shadow. | 5–10 horses |
| Imposter | Flat billboard quad, pre-rendered image, updates every 2–3 seconds. | All remaining horses |

Hysteresis rule: upgrade threshold distance ≠ downgrade threshold distance. Gap between them prevents oscillation near the boundary. LOD transitions are instant (snap, no cross-fade). Upgrade rate limited — at most N horses upgrade per frame, priority to horses nearest camera centre.

Imposters regenerated every time Grazing Mode is entered. Horses without a valid imposter show a placeholder during regeneration.

**⚠️ Open Decision (Blocking)**: Imposter billboarding type is unresolved. Options: spherical (always faces camera — perspective incorrect at off-angles), cylindrical (rotates vertical axis only — industry standard for characters), fixed-direction (faces bake angle only). Must decide before building the imposter shader.

**⚠️ Open Decision (Blocking)**: Transparency and blending order for overlapping horses is unresolved. Options: painter's algorithm (correct but per-frame sorting), Z-buffer with alpha cutout (no sorting, hard edges on mane/tail), or order-independent transparency (expensive). Must decide before building the horse renderer.

### Job System

A job location is a named point in the environment with an animation type, optional prop, and a capacity. Horses are assigned to job locations when Grazing Mode is entered. Capacity prevents clipping. Social jobs require minimum occupancy. `requiresAdult` flag marks locations foals cannot hold independently.

### Foal Behaviour in Grazing Mode

Foals (under 1yr) are not independent agents in grazing mode. A foal is an attachment to its mother's scene entity. Position is always derived from the mother's position plus an offset. Foals never pathfind independently and never hold job locations independently.

| State | Condition | Behaviour |
|-------|-----------|-----------|
| Playing | Daytime, mother at stationary job | Gentle wandering within leash radius. Small kicks, circling. |
| Nursing | Nursing interval elapsed, mother stationary | Foal moves to mother's flank. Paired nursing animation on both. |
| Sleeping | Night / rest period | Foal lies down near mother with small random offset. |
| Grazing | Yearling transition (approaching 1yr) | Foal begins grazing near mother before graduating to independence. |

Nursing interval is an epigenetic value set at birth. At exactly 1 year, foals graduate to full independence and job eligibility.

---

## 16. Running Mode

Running mode is a side-scrolling runner. It is deliberately cartoony — a distinct visual world from grazing mode. **No 3D rendering occurs during running mode.** Everything is pre-baked sprites. The cartoon aesthetic is a design choice.

See TravelSpecification.md for the full running mode gameplay spec including canvas size, physics constants, and obstacle rules.

### Sprite Pipeline

Running mode sprites are baked at birth using the cartoon shader applied to the 3D scene. Two spritesheets per horse: left-facing and right-facing. These are never mirrored — all horses are treated as fully asymmetric. Sprites are stored permanently and never reflect post-birth changes.

### Cartoon Shader Stages

| Stage | Effect |
|-------|--------|
| Posterisation | Reduces continuous PBR shading to 3–4 discrete light bands. The foundational cel-shading step. |
| Outline pass | Silhouette lines via back-face expansion. Interior edges via normal-change detection. |
| Colour simplification | Saturation boost. Compresses subtle coat tones toward flatter, more saturated values. |
| Specular suppression | Removes or heavily reduces PBR specular highlights. Cartoon horses don't shine. |

Bake lighting: canonical neutral running-mode light defined in a config file. All horses baked under identical lighting. Running map colour grade overlays apply at runtime on top — horses remain visually consistent across all environments.

**⚠️ Open Decision**: Cartoon shader treatment of modded surface profiles — scaled horses will have different normal data feeding posterisation. Is this visual variety intentional, or should all horses use flat lighting in running mode for consistency?

---

## 17. Asset Storage & Caching

In Electron, all persistent assets are files on the local filesystem under `AppData/GlassHorses/`. The Node.js main process owns all disk writes. The renderer process requests writes via IPC. No renderer process writes to disk directly.

| Asset | Format | Path | Lifetime |
|-------|--------|------|---------|
| Atlas thumbnails (L+R) | 128px PNG, atlas-packed | `AppData/.../atlas/sheet_N.png` + `atlasIndex.json` | Forever from birth |
| Running sprites (L+R) | 256px PNG spritesheet, cartoon | `AppData/.../sprites/horse_[id].png` | Forever from birth |
| Detail static frame | 1024px PNG | `AppData/.../detail/horse_[id].png` | Generated on first click; cached |
| Grazing real-time | Live render | RAM only | Never stored |
| Imposter images | 64–128px PNG, 8 angles | `AppData/.../imposters/horse_[id]_[angle].png` | Re-baked on each mode entry |
| Horse game data | JSON fields in SQLite | SQLite DB file | Forever |
| Genome + epigenetics | Stored in SQLite | SQLite DB file | Forever |
| Mod assets | GLTF/PNG/JS files | `AppData/.../mods/[modname]/` | Until mod removed |

### SQLite Schema Note

The SQLite schema is written to mirror the web PostgreSQL schema as closely as possible. Horse records contain all genome data, epigenetic values, pedigree links, and filesystem paths to baked assets. The only difference between the desktop and web schema is the asset path column — desktop stores a local `AppData` path; web stores a CDN URL or database blob reference. All other columns are identical.

### IPC Write Pattern

```javascript
// Renderer process (Web Worker) — requests a disk write via IPC
postMessage({ type: 'WRITE_ASSET', path: 'sprites/horse_123.png', buffer: pngBuffer });

// Main process — owns all disk access
ipcMain.on('WRITE_ASSET', (event, { path, buffer }) => {
  fs.writeFileSync(resolveAppData(path), buffer);
});
```

---

## 18. Detail View

Full real-time 3D render of a single horse. Free orbit camera. Maximum quality. 1024px coat texture (full resolution — only context where this is displayed live).

Uses the same render pipeline as Grazing Mode: same PBR materials, same lighting rig, same physics mane simulation, same coat texture system. No separate pipeline.

The player can apply any unlocked environment's lighting rig to the Detail View (golden hour, overcast, stable interior, etc.). This is a camera mode feature only — it does not affect the horse's stored appearance.

---

## 19. Book View & Atlas System

The Book shows all horses as browsable thumbnails. All thumbnails are pre-baked at birth. The Book opens instantly with no on-demand generation.

| Property | Value |
|----------|-------|
| Atlas sheet size | 2048×2048px — holds 256 thumbnails at 128×128px each |
| Atlas series | Two series: left-facing and right-facing (separate files) |
| Index file | `atlasIndex.json` maps horse ID to sheet number and pixel coordinates for both orientations |
| Slot management | Next free slot allocated at birth. Slot freed and reused on horse death. |
| Regeneration | Never regenerated after birth under normal circumstances. |

Clicking a thumbnail triggers Detail View. If the 1024px detail frame is not cached, it generates (50–150ms, shows loading shimmer). Cached to disk on first generation. Subsequent views are instant.

---

## 20. Mod System

### What Modders Can Do

- Register new genes with custom `alterCoat` and `alterNormal` functions
- Register new surface profiles (normal maps, roughness maps)
- Register new appendage models with attachment manifests
- Register new mane/tail/forelock models with physics parameters
- Register new animations with JSON descriptors
- Register new environment scenes with lighting, fog, and object placement
- Register new environmental prop objects (GLTF or billboard PNG)
- Register new cutie mark images
- Override existing registered items by ID (subject to conflict resolution policy)

### Mod Folder Structure (Electron)

In Electron, mods are folders placed in `AppData/GlassHorses/mods/[modname]/`. The mod loader reads all mod folders at startup. This is equivalent to the Steam Workshop folder placement on the desktop version.

```
AppData/GlassHorses/mods/
└── mystic/
    ├── mod.json          ← Mod manifest (name, version, author, dependencies)
    ├── genes/
    │   └── unicorn.js
    ├── models/
    │   └── horn.glb
    └── environments/
        └── crystal_vale/
```

### Validation at Mod Load Time

- All `hostLandmark` references checked against the horse landmark file
- All animation `entry/exitNeutral` values checked against the neutral pose registry
- All model registry entries checked for required core animation and morph target mappings
- Duplicate allele IDs: hard crash at startup with explicit error message naming the collision
- Missing landmark or neutral pose references: hard error naming exactly what is missing

**⚠️ Open Decision (Blocking)**: Mod load order and conflict resolution policy is not defined. When two mods register the same ID: last-loaded wins? First-loaded wins? Hard error? Must decide before building the mod loader.

**⚠️ Open Decision**: Modder shader extension contract is not defined. What can modders replace — material inputs only, or entire shader passes? Without a formal contract, modded shaders can break the pipeline.

---

## 21. Environmental System

### Environmental Object Types

| Type | Description | Best For |
|------|-------------|----------|
| Full 3D | GLTF mesh, proper geometry, shadows, normal maps. | Foreground / mid-ground elements near camera. |
| Billboard imposter | Flat quad facing camera, displaying a PNG. No 3D skills required for modders. | Distant background elements. Degrades at close range. |
| Hybrid | Full 3D close, billboard beyond a defined distance. | Mid-ground objects modders want to look good up close. |

### Sky System

Physically accurate sky model (Three.js Sky — Preetham or Hosek-Wilkie). Uses the environment's key light direction as sun position. Produces accurate sky colour from all camera angles including side-on and near-top. Automatically matches the lighting rig.

**⚠️ Open Decision**: Formal vs. informal environment layer system. Must objects declare their layer in scene definition files (formal — enables global layer-based render settings), or just use Z-depth placement (informal — simpler for modders)? Must decide before writing the modding guide.

**⚠️ Open Decision**: Environmental object dynamic state. Can objects change during a grazing session (depleting hay bale, filling water trough)? Recommend explicitly ruling this out to prevent scope creep. If ruled in, a state system is required.

---

## 22. Post-Birth Appearance Changes

Horses can gain scars, clothing, and equipment after birth. These affect appearance in **Grazing Mode and Detail View only**. Running mode sprites are never updated.

Post-birth modifications are composited dynamically at priority 255 on top of the baked base coat. Clothing uses the appendage system. Scars are coat layer overlays. Neither is baked — they are applied live each frame.

Clothing and scars load only for horses at close LOD range. Far-distance imposters do not reflect post-birth changes until the next mode entry.

**Policy**: Clothing cannot interact with genetics. This is absolute.

---

## 23. Performance Budgets

| Mode | Target | Main Bottleneck |
|------|--------|----------------|
| Running Mode | Maximum FPS. Must never drop below playable. | Canvas sprite blitting. No GPU cost per horse. |
| Grazing Mode | Minimum 20 FPS. Stuttering acceptable. | PBR shader on close-range horses. Mane/tail physics chains. Imposter regen at mode entry. |
| Detail View | 60 FPS target. | Trivial. One horse, low poly. |

**⚠️ Open Decision**: Graphics quality settings matrix is not fully defined. At minimum: coat texture resolution scaling, shadow quality scaling. Additional quality tiers needed before first release.

**⚠️ Open Decision**: Fallback mode for low-end integrated GPUs that cannot sustain 20 FPS in Grazing Mode. Minimum viable fallback should be defined before launch.

---

## 24. Central Event Bus

**⚠️ Open Decision (Blocking)**: No central event bus architecture is defined. Before building any cross-system communication (job system → animation, genetics → renderer, camera → LOD, IPC → storage), a named event bus must be designed. All systems should publish and subscribe to events rather than calling each other directly. This is required before any multi-system feature is built.

---

## 25. Summary: All Open Decisions

### Blocking — Must Decide Before Building

| Decision | Blocks |
|----------|--------|
| Central event bus architecture | All cross-system communication |
| Audio system and animation sync hooks | Animation system |
| Mane/tail depth compositing method | Horse renderer + mane system |
| Imposter billboarding type | Imposter shader |
| Transparency/blending order for overlapping horses | Horse renderer |
| Normal map blending ownership | Coat compositor + material system |
| Mod load order and conflict resolution policy | Mod loader |
| Crystal ball edge shader render target handoff | Camera system |
| Ground plane definition contract per environment | Camera system + modding guide |
| Formal vs. informal environment layer system | Scene renderer + modding guide |
| Paired animation interruption behaviour | Social animation system |

### Non-Blocking — Tune During Testing or Defer

- All specific numerical values (LOD thresholds, camera speeds, physics parameters, cross-fade durations, fog densities)
- Crystal ball edge shader visual parameters (vignette, chromatic aberration, lens distortion curve)
- Complete required list of core animation semantic names and morph target names
- Full graphics quality settings matrix
- Fallback mode for low-end hardware
- Cartoon shader treatment of modded surface profiles in running mode
- Running sprite re-bake policy if policy ever changes
- Whether environmental objects can have dynamic state
- Normal map regeneration for post-birth scars
- Cutie mark pass in far-distance imposter baking
- Save schema migration strategy for new gene loci
- Missing-mod fallback visual behaviour
- Modder shader extension contract
- Canonical test horse genome for regression testing