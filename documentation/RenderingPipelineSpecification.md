# Rendering Pipeline Specification

Version 3.0 | Status: Authoritative

---

## 1. Game Overview & Framing

GlassHorses is a horse breeding simulator combined with a side-scrolling runner. The player is an ancient god observing their herd through a crystal ball — a glass sphere through which destiny is watched and shaped. All visual and UI decisions serve this framing.

**See also**: SettingSpecification.md (world and god framing), GeneImplementation.md (genetics pipeline), TravelSpecification.md (running mode context), DualVersionSpecification.md (platform architecture).

---

## 2. Platform Architecture

### Target Runtime: Electron (Desktop-First)

The game targets **Electron** as its primary runtime. Electron wraps a Chromium instance alongside a Node.js process, giving the renderer full access to both browser APIs and the local filesystem.

| Component | Technology | Notes |
|-----------|-----------|-------|
| Runtime | Electron (Chromium + Node.js) | Desktop only. No mobile optimisation. |
| 3D Rendering | Three.js with WebGL | Via OffscreenCanvas in Web Workers |
| Asset Storage | Local filesystem via Node.js `fs` | See Section 19. IndexedDB is **not** used. |
| 3D Assets | GLTF/GLB | Authored in Blender, Y-up export |
| Coat Compositor | OffscreenCanvas 2D in Web Workers | Shared worker pool |
| Game Data | SQLite via `better-sqlite3` | Mirrors web PostgreSQL schema |

### Why Electron Changes Storage

All baked image assets are written to disk as standard files in the user's AppData directory. SQLite stores all structured game data (horse JSON, genome records, asset path references). This approach:

- Mirrors the web PostgreSQL schema closely, reducing migration cost
- Makes baked assets inspectable and debuggable without browser tooling
- Avoids IndexedDB size limits and corruption risks on long-running saves
- Simplifies the modding pipeline — mod assets are folders on disk, not blobs in a browser store

### Web Version Compatibility

The rendering pipeline is written to be platform-agnostic at the Three.js/WebGL layer. The storage abstraction layer (Section 19) is the only component that differs meaningfully between Electron and web. All coat generation, sprite baking, and real-time rendering code runs identically on both platforms. The storage layer calls a unified interface; the implementation beneath swaps between `fs` (Electron) and PostgreSQL blob storage or CDN URLs (web).

### Browsers Supported (Web Version)

Chrome 88+, Firefox 90+, Safari 16.4+. OffscreenCanvas required. Electron's bundled Chromium always satisfies this.

---

## 3. Visual Modes

| Mode | Visual Style | Performance Target |
|------|-------------|-------------------|
| **Grazing Mode** | Stylised real-time 3D. Primary experience. | Min 20 FPS. Stuttering acceptable. Quality over framerate. |
| **Running Mode** | Deliberately cartoony. Pre-baked sprites only. Zero 3D at runtime. | Maximum FPS. No 3D rendering whatsoever. |
| **Detail View** | Full real-time 3D, free camera, maximum quality. One horse. | 60 FPS target. |
| **Book View** | 2D atlas thumbnails. Instant display. | Negligible cost. |

Running Mode sprites are baked at birth using the cartoon shader applied to the 3D scene. **Running mode sprites are never updated after birth.** A horse that gains scars, clothing, or equipment post-birth appears unscarred in the running minigame. This is intentional — the running sprite represents the horse's essential self, not their current state. Players should be informed of this when scars or equipment are first applied.

Particle emitters are active in **Grazing Mode and Detail View only**. In running mode, any birth-time emitter effects (glow, shimmer, sparks) are captured statically in the sprite bake at birth. See Section 9 for the full emitter specification.

---

## 4. Coordinate System & Units

- **1 unit = 1 metre.** Consistent across all systems including running mode physics.
- **Y-up.** Three.js is Y-up. GLTF exports from Blender use Y-up at export. Modders in Blender do not need to manage this — the export converts automatically. All landmark normals, appendage offsets, and world-space math assume Y is up.
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

Genes do not draw anything. They produce trait values that the renderer reads. This abstraction is what makes the system moddable — new genes produce new traits, new renderer layers consume them. This extends fully to emitters: a gene that produces bioluminescence writes an emitter trait into the trait bag; the renderer reads it and instantiates the appropriate emitter definition.

### The Epigenetics Rule

**ZERO calls to `Math.random()` inside any coat generator function.** All randomness is resolved at birth when epigenetic values are set. The renderer is a pure function of genome + epigenetic values. Identical input always produces identical output.

`Math.random()` is permitted only during the breeding/birth process when epigenetic values are first established. This rule applies equally to emitter parameters — particle counts, glow intensity, colour variation ranges are all resolved as epigenetic values at birth, not rolled at runtime.

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
  alterCoat:    (ctx) => { /* paints coat colour layer at 1024px */ },
  alterNormal:  (ctx) => { /* optional: paints normal map layer */ },
  alterEmitter: (ctx) => { /* optional: returns emitter attachment list */ }
};
```

`alterEmitter` is optional. If absent, the gene produces no emitters. See Section 9 for full authoring details.

**⚠️ Open Decision**: Save schema migration strategy is not defined. When new gene loci are added, existing horses need a migration path. A formal save schema version number (separate from landmark versions) must be designed before first public release.

**⚠️ Open Decision**: Missing-mod handling is not defined. When a saved horse references a mod gene no longer installed, a fallback visual must be defined before the horse data format is finalised.

---

## 6. Mesh & Art Direction

### Low-Poly Mesh with High-Resolution Textures

The horse model uses a **low-poly mesh with high-resolution textures and normal maps baked from a high-poly sculpt**. This is a deliberate aesthetic choice that serves the crystal ball framing — viewed through curved glass as a god looking down, slightly faceted horses read as jewel-like and intentional, consistent with the stained-glass coat colour language in the setting spec.

**Target polygon count**: 1,500–2,500 triangles for the base horse body. All surface detail — coat patterns, fine hairs, musculature, surface microstructure — comes from the 1024×1024 texture and normal map, not from geometry.

**Normal map baking**: The normal map is baked from a high-poly sculpt (50,000–100,000 polygons) onto the low-poly game mesh. The sculpt is not shipped with the game — only the baked normal map is used at runtime. The game mesh silhouette is angular, but the normals encode the curvature of the high-poly form. Lighting responds as if the surface is smoothly curved. The one place this does not help is the **silhouette edge** — at the boundary of the mesh the faceted geometry is always visible. Legs are the most noticeable area.

**Polygon distribution**: The leg geometry receives a slightly higher polygon budget within the 1,500–2,500 target. The mane and tail (separate models) mask the neck silhouette, so the base body can be more aggressively low-poly. The barrel of the body is the least sensitive area.

**Modder obligation**: Modders who replace the base mesh must provide a new normal map baked from their own high-poly source or authored by hand. A replacement mesh without a new normal map will use the default normal map, which will not match the new geometry's surface.

### Interaction with the Cartoon Shader

Low-poly meshes interact well with the running mode cartoon shader. The posterisation step (3–4 discrete light bands) causes each flat face of the mesh to read as a clean, single-toned cel-shaded panel. High-poly models at this step produce muddier mid-tones across curved surfaces. The low-poly aesthetic is actually **more legible** under posterisation than a high-poly equivalent would be.

### Morph Targets (Shape Keys)

Morph targets blend the base neutral form continuously, driven by the horse's proportions data. Applied via `morphTargetInfluences` in Three.js.

**Known limitation**: Morph targets do not affect UV coordinates. A very long-legged horse will have slightly compressed markings in UV space on its legs. This is a known, accepted tradeoff — it reads as natural variation and is less noticeable on a low-poly mesh where leg UVs are already somewhat compressed.

Core morph targets (not exhaustive): `legLength`, `neckLength`, `dishFace`, `broadForehead`, `heavyBuild`, `fineBuild`, `highWithers`, `broadChest`.

**⚠️ Open Decision**: The complete required list of core animation semantic names and morph target names that every compliant model must implement has not been written. This must be documented before any modding guide is published.

---

## 7. Horse Rendering: The Three Pipelines

All baked output is stored on the local filesystem (Electron) or equivalent persistent storage (web). Paths are recorded in the horse's SQLite record.

| Pipeline | Output | When | Storage |
|----------|--------|------|---------|
| **A — Atlas Thumbnail Bake** | 128px single frame, atlas-packed. Left + right facing. No bloom. | At birth. Permanent. | `AppData/GlassHorses/atlas/` |
| **B — Running Sprite Bake** | 256px spritesheet, cartoon shader. Left + right facing. Bloom active if emitters present. | At birth. Permanent. Never updated. | `AppData/GlassHorses/sprites/` |
| **C — Grazing / Detail Real-Time** | Full 3D PBR render. 512px coat (grazing) or 1024px (detail). Live emitters + bloom active. | Live every frame. | RAM only. Never stored. |

Pipelines A and B run in a Web Worker using OffscreenCanvas. The main thread queues bake requests; the worker processes them and writes finished files via the Node.js IPC bridge to the main process, which writes to disk. The main thread is never blocked by a bake.

---

## 8. Coat Layer Stack

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

Runtime overlays (priority 255) are never baked into the stored coat PNG. They are composited dynamically in Grazing Mode and Detail View only. Far-distance imposters do not reflect runtime overlays until the next mode entry.

**⚠️ Open Decision**: Normal map regeneration for scars is undefined. Scars ideally produce raised/indented surface detail requiring normal map modification. Are scars colour-only overlays (normal map immutable after birth), or does the normal map regenerate when scars are added? **Non-blocking but affects visual quality.**

---

## 9. Particle Emitter System

### Overview

The emitter system allows any 3D element attached to a horse — the base body, appendages (wings, horns, halos, armour), mane, tail, and forelock — to shed particles. Emitters are driven by genes via the trait bag, authored as JSON definition files, and attached to the horse via the landmark or appendage anchor system.

**Active modes**: Grazing Mode and Detail View only. In running mode, emitter visual contribution is captured statically in the sprite bake at birth.

### Architecture

```
Gene → alterEmitter(ctx) → EmitterAttachment[] → EmitterSystem → THREE.Points per emitter
```

Each emitter attachment specifies a host (landmark or appendage anchor), an offset, and a reference to an emitter definition file. The emitter system reads these attachments when the horse's scene entity is constructed and instantiates one `THREE.Points` object per active emitter. Emitters are owned by their host object's LOD tier — when the horse drops to imposter range, all its emitters are destroyed.

### Emitter Attachment (Gene Output)

The `alterEmitter` function returns an array of emitter attachments. Epigenetic values resolved at birth are used to scale emitter output — the definition file provides the shape and behaviour; epigenetics provide the intensity.

```javascript
alterEmitter: (ctx) => {
  const intensity = ctx.myEpigenetics.glowIntensity; // 0–100, resolved at birth
  return [
    {
      // Attachment on the base horse mesh
      hostLandmark: 'poll',
      hostType: 'landmark',           // 'landmark' | 'appendage' | 'mane' | 'tail' | 'forelock'
      offset: [0, 0.1, 0],            // Y-up offset in metres
      emitterDef: 'glow_solar.json',  // path relative to gene/mod folder
      scale: intensity / 100          // scales maxParticles and spawnRate proportionally
    },
    {
      // Attachment on an appendage anchor point
      hostAnchor: 'horn_tip',
      hostType: 'appendage',
      offset: [0, 0.05, 0],
      emitterDef: 'spark_horn.json',
      scale: 1.0
    }
  ];
}
```

`hostType` determines which system resolves the world-space position of the anchor each frame:
- `landmark` — resolves via the base mesh landmark system (tracks morph deformation)
- `appendage` — resolves via the appendage's named anchor points (declared in its attachment manifest)
- `mane` / `tail` / `forelock` — resolves via named anchor points on those models' attachment manifests

### Emitter Definition File

Emitter definitions are JSON files shipped with genes or mods. All variation ranges are sampled **once per particle at spawn time** using `Math.random()` — which is permitted in the spawn process. The definition itself is static and deterministic.

```json
{
  "name": "Solar Glow",
  "type": "continuous",
  "maxParticles": 40,
  "spawnRate": 8,
  "texture": "particle_soft.png",
  "blending": "additive",
  "depthWrite": false,

  "lifetime":     { "min": 0.8, "max": 1.4 },
  "startSize":    { "min": 2,   "max": 5   },
  "endSize":      0,
  "startOpacity": 0.9,
  "endOpacity":   0.0,
  "startColor":   "#ffe066",
  "endColor":     "#ff8800",

  "velocity": {
    "direction": [0, 1, 0],
    "spread":    0.4,
    "speed":     { "min": 0.2, "max": 0.6 }
  },

  "gravity":     -0.05,
  "worldSpace":   true
}
```

**`type`**:
- `continuous` — spawns at `spawnRate` per second indefinitely
- `burst` — one-shot at `maxParticles` on trigger, then idle
- `pulse` — repeating burst at a defined interval

**`blending`**:
- `additive` — particles add light to the scene. Correct for glow, fire, magic. Never darkens underlying pixels.
- `normal` — standard alpha blend. Correct for smoke, debris, solid particles.

**`worldSpace`**: if `true`, spawned particles drift freely from their spawn point as the horse moves. If `false`, particles move rigidly with the host anchor (correct for a dust cloud fixed to a hoof).

### Three.js Implementation

Each emitter is one `THREE.Points` object with pre-allocated `BufferGeometry` sized to `maxParticles`. Dead particle slots are moved to the end of the buffer each frame; `setDrawRange` limits the GPU draw call to live particles only. The geometry is never resized after construction.

```javascript
class HorseEmitter {
  constructor(def, getAnchorPosition) {
    this.def = def;
    this.getAnchorPosition = getAnchorPosition; // function returning THREE.Vector3 each frame
    this.particles = [];
    this.spawnAccumulator = 0;

    const pos       = new Float32Array(def.maxParticles * 3);
    const opacities = new Float32Array(def.maxParticles);
    const sizes     = new Float32Array(def.maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(pos,       3));
    this.geometry.setAttribute('opacity',  new THREE.BufferAttribute(opacities, 1));
    this.geometry.setAttribute('pSize',    new THREE.BufferAttribute(sizes,     1));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tex:   { value: loadParticleTexture(def.texture) },
        color: { value: new THREE.Color(def.startColor)  }
      },
      vertexShader:   PARTICLE_VERT_SHADER,
      fragmentShader: PARTICLE_FRAG_SHADER,
      transparent: true,
      depthWrite:  false,
      blending: def.blending === 'additive'
        ? THREE.AdditiveBlending
        : THREE.NormalBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  update(deltaTime) {
    const anchor = this.getAnchorPosition();

    // Spawn
    this.spawnAccumulator += this.def.spawnRate * deltaTime;
    while (this.spawnAccumulator >= 1 && this.particles.length < this.def.maxParticles) {
      this._spawnParticle(anchor);
      this.spawnAccumulator--;
    }

    // Simulate
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += deltaTime;
      if (p.age >= p.lifetime) { this.particles.splice(i, 1); continue; }
      const t = p.age / p.lifetime;
      if (this.def.worldSpace) {
        p.position.addScaledVector(p.velocity, deltaTime);
        p.position.y += this.def.gravity * deltaTime;
      } else {
        p.position.copy(anchor).add(p.localOffset);
      }
      p.opacity = lerp(this.def.startOpacity, this.def.endOpacity, t);
      p.size    = lerp(this.def.startSize,    this.def.endSize,    t);
    }

    this._writeToBuffers();
    this.points.geometry.setDrawRange(0, this.particles.length);
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.opacity.needsUpdate  = true;
    this.points.geometry.attributes.pSize.needsUpdate    = true;
  }
}
```

### Bloom Post-Processing

Additive emitters are significantly more convincing with a bloom pass. `UnrealBloomPass` is used in Grazing Mode and Detail View.

```javascript
import { EffectComposer }  from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,    // strength  — tune during testing
  0.4,    // radius    — tune during testing
  0.85    // threshold — only pixels above this luminance value bloom
));
// Crystal ball edge shader pass added after bloom
// so glow is contained within the sphere boundary
```

Bloom runs **before** the crystal ball edge shader in the post-process chain. Glow effects are contained within the sphere — they do not bleed over the UI chrome surrounding the ball.

Bloom is not active during running mode. The sprite bake pipeline activates bloom during baking if the horse has any emitter traits, capturing the glow statically in the spritesheet.

### Emitter LOD Rules

| LOD Tier | Emitter Behaviour |
|----------|------------------|
| Full quality (close) | All emitters fully active at authored `maxParticles` and `spawnRate` |
| Medium LOD (mid) | All emitters active at 50% `maxParticles` and 50% `spawnRate` — automatic, no authoring required |
| Imposter (far) | All emitters destroyed. Glow approximated by a soft colour tint on the imposter quad, sampled from the emitter's `startColor`. |

The imposter tint is crude but sufficient at imposter distances. It is applied at mode entry when imposters are regenerated.

### Emitter Hard Limits

- Maximum **5** simultaneous emitter attachments per horse (across body, all appendages, mane, tail, forelock combined)
- Maximum **200** live particles across all emitters for a single horse
- These limits apply to modded genes and appendages as well as core content
- Validated at mod load time; violations are a hard error

### Sprite Bake with Emitters

When a horse has emitter traits, the running sprite bake captures their visual contribution:

1. Construct horse scene normally
2. Instantiate all emitters at their anchor positions
3. Advance emitter simulation for 2 seconds (settling into a natural steady state)
4. Activate the bloom pass
5. Capture the frame

The result is a static sprite where glowing horses appear to glow, sparkling horses have a shimmer, and smoke-emitting horses have a faint haze. This is the only time particles appear in running mode — frozen into the birth sprite permanently.

**⚠️ Open Decision**: Whether bloom is included in the low graphics quality tier is not decided. Bloom is the largest fixed per-frame cost in the emitter system and may need to be disabled on low-end hardware. Without bloom, additive emitters still glow additively but light does not bleed into surrounding pixels.

---

## 10. The Landmark System

Landmarks are named semantic positions on the horse mesh. They decouple coat generators and emitter anchors from UV coordinates and mesh topology. If the UV map ever changes, only the landmark file updates — generators and emitters are untouched.

Landmarks are generated automatically by a Blender Python export script. Named Empty objects in the scene are projected onto the mesh surface, UV coordinates and world-space positions found, and the landmark JSON written. Modders use the same workflow.

Every horse stores the landmark version it was generated with. On UV map update, the version increments. Old horses are flagged for re-bake. All previous landmark files ship with every game update.

```javascript
// Coat generator — landmark returns UV coordinates
alterCoat: (ctx) => {
  const foreheadUV = ctx.landmark('forehead');
  const faceRegion = ctx.region('face');
  // draw at foreheadUV within faceRegion
}

// Emitter — landmark system returns world-space position each frame
alterEmitter: (ctx) => {
  return [{
    hostLandmark: 'poll',
    hostType: 'landmark',
    offset: [0, 0.1, 0],
    emitterDef: 'glow_solar.json',
    scale: ctx.myEpigenetics.glowIntensity / 100
  }];
}
```

### Model Registry

The engine never loads a model file directly. It loads whichever model is registered under a semantic ID. In Electron, the model registry is a JSON file in the game's install directory. Mod registries live in the user's mod folder and are merged at startup.

---

## 11. UV Mapping & Coat Textures

All coat generation runs at **1024×1024**. Single working resolution. Generators are never resolution-aware. Downsampling handled externally after compositor completion.

### Seam Placement

| Seam | Location |
|------|----------|
| Body | Centreline of belly, chest to tail base. Markings almost never cross the belly midline. |
| Legs | Down the back of each cannon bone and pastern to hoof. Always faces away from camera. |
| Head | Under jaw, throatlatch to chin. Entire face is one uninterrupted island. |
| Ears | Inner surface of each ear. |
| Mane / Tail / Forelock | Entirely separate models — no seams on base body. |

### UV Island Layout

All sides receive equal UV real estate. Each leg has its own unique UV island to support fully asymmetric markings.

| Region | Approximate Allocation |
|--------|----------------------|
| Left body side | ~25% |
| Right body side | ~25% |
| Head | ~10% |
| Each leg (×4) | ~5% each = 20% total |
| Misc / mane reference | ~10% |

### Cutie Mark System

The cutie mark is a screen-space decal, not a UV-space texture. A named anchor point (`flank_left`, `flank_right`) is projected from 3D world space to 2D screen space at render time. Never stretches with morph deformation.

- **Detail View**: Three.js `DecalGeometry`, sitting fractionally above the mesh surface, receiving full PBR lighting.
- **Pre-baked sprites**: 2D canvas `drawImage` as a final compositor step, under all post-processing shaders.

**⚠️ Open Decision**: Far-distance imposter baking must include a cutie mark pass. The pipeline for this is not defined.

---

## 12. Normal Maps & Surface Profiles

### Surface Profile System

Surface profiles define microstructure appearance: a tiling normal map and roughness parameters applied over the coat texture. The profile is heritable — a gene can write a surface profile ID into the trait bag, making scales or unusual textures breedable.

Because the game uses low-poly meshes, the normal map is load-bearing for visual quality. A horse's coat detail at close range is almost entirely carried by the normal map, not the geometry. This makes the normal map compositor a first-class system, not an optional enhancement.

### Per-Foal Composite Normal Maps

The normal map compositor runs at birth in parallel with the colour coat compositor. Base layer is the active surface profile's tiling normal map. Gene layers that modify surface type stamp their own tiling normal map into specific UV regions. If no gene modifies the normal map, the horse uses a shared default — a flag in the horse record indicates which, and no custom file is stored.

**⚠️ Open Decision (Blocking)**: Normal map blending ownership is unresolved. The coat compositor produces a generated normal map. The surface profile system provides a tiling normal map. Who combines them — the coat compositor, the material system at load time, or a runtime shader? Must be decided before building either system.

---

## 13. Mane, Tail & Forelock System

Mane, tail, and forelock are entirely separate from the base horse mesh. Independent GLTF models with their own UV maps, coat layer stacks, attachment manifests, physics simulation, and named emitter anchor points. The base horse has no mane or tail geometry. The base game ships defaults; modders can replace any independently.

Emitter anchors on mane, tail, and forelock models are declared in their attachment manifest in the same format as appendage anchors. A mane can shed sparks from its tip. A tail can trail smoke from its base. Any named anchor on any attached model is available to `alterEmitter`.

### Physics Simulation

Verlet chain simulation. Each strand: 6–8 connected points. Root point rigidly attached to a named skeleton landmark. Lower points simulated under gravity and horse velocity.

| Parameter | Effect |
|-----------|--------|
| strandCount | Number of hair strands simulated |
| chainLength | Points per strand (6–8) |
| stiffness | 1.0 = rigid (braided). Low = flowing fantasy mane. |
| damping | How quickly motion settles |
| velocityInfluence | How much horse movement affects the mane/tail |

For running mode sprite baking, physics simulation runs forward briefly before frame capture so the mane is in a natural resting position.

**⚠️ Open Decision (Blocking)**: Depth compositing for mane vs neck is unresolved. A horse viewed from the side has its mane in front of its neck from some angles and behind it from others. Must be resolved before building either the mane system or the main horse renderer.

| Option | Tradeoff |
|--------|----------|
| Accept interpenetration | Simplest. Mane sometimes clips through neck. |
| Stencil buffer | Correct result. Constrains transparency use elsewhere in scene. |
| Per-frame depth sort | Correct result. Performance and complexity cost. |

---

## 14. Appendage System

Appendages (wings, horns, armour, halos, etc.) are independent 3D models attaching to the horse at named landmark points. The horse model is never modified. Maximum 5 appendages per horse.

**Appendages support emitter attachments.** Each appendage's attachment manifest declares named anchor points. These anchors are available to the `alterEmitter` function via `hostType: 'appendage'` and a matching `hostAnchor` string. Examples:

- A halo appendage declares a `halo_ring` anchor — genes can attach a golden light shower there
- A wing appendage declares `wing_tip_left` and `wing_tip_right` — genes can trail feather sparks from each tip
- A horn appendage declares `horn_tip` — genes can spark from the point

The engine finds the host landmark's position and surface normal in the horse's current morphed space. The appendage root bone is placed there with orientation from the surface normal. Morph targets automatically shift landmark positions — appendages follow body deformation, and their emitter anchors follow with them.

### Animation Bindings

Appendage animations play on their own additive layer. They bind to semantic game event triggers: `on_jump`, `on_idle`, `on_gallop`. Multiple appendages can respond to the same trigger; priority determines the winner.

**Policy**: Clothing cannot interact with genetics. Clothing is player-applied via the appendage system. Genetics-driven appendages (wings, horns, halos) are separate from clothing in the data model. These two categories must never be conflated. Clothing applied post-birth may include emitter-bearing models; those emitters are live in Grazing Mode and Detail View but are not reflected in the running sprite.

**⚠️ Open Decision**: Running mode sprite baking must handle arbitrary modded appendages. The cartoon shader is not guaranteed to work on all possible geometry. A modder validation tool or a mechanism for supplying hand-drawn running sprites should be designed.

---

## 15. Animation System

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
| Locomotion | Cyclic. Lives on layer_full_body. Time-scales with speed. | Synchronised cross-fade at shared phase points. Upward: snappy. Downward: collecting. |
| Action | One-shot. Plays to completion, returns to base layer. | Interrupts base layer. Additive blend on body layer. Fades out on finish. |
| Idle | Low-energy cyclic. Suppressed above walk speed. | Frozen cross-fade from locomotion freeze pose. |

### Running Mode Tag

Every animation descriptor includes a running mode eligibility flag. `eligible: false` is the default for mod animations. `eligible: true` allows running mode play but users can override. `isBuiltin: true` (gallop, walk, idle standing) cannot be disabled. A filtered registry is built at mode start and is immutable for the session.

**⚠️ Open Decision (Blocking)**: Audio system is entirely undefined. If audio sync hooks fire on animation events (hoof sounds, vocalisations), this must be designed into the animation event system from the start. Retrofitting is painful.

**⚠️ Open Decision (Blocking)**: Paired animation interruption behaviour is undefined. Mutual grooming requires two horses playing complementary clips simultaneously. What happens if one horse is reassigned mid-paired-animation?

---

## 16. Camera System

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

Default polar angle: 45-degree isometric. Camera decelerates approaching polar limits (soft stop, never hard snap). WASD suppressed during UI form entry.

### Post-Process Pass Order

The post-process chain runs in this order:

1. **Render pass** — 3D scene rendered to texture
2. **Bloom pass** — glow bleeds into surrounding pixels within the render target
3. **Crystal ball edge shader** — vignette, chromatic aberration, lens distortion applied to the circular render target boundary

Bloom runs before the edge shader so glow is contained within the sphere and does not bleed over the UI chrome surrounding the ball.

**⚠️ Open Decision (Blocking)**: The render target handoff — what data contract exists between the render pass, the bloom pass, and the crystal ball edge shader — is not formally defined. Must be decided before building any of these three systems.

---

## 17. Grazing Mode

### Scene Layer Structure

| Layer | Contents |
|-------|----------|
| Background | Sky, distant terrain silhouettes, atmospheric elements. Mostly static. Clouds drift. |
| Mid-background | Large environmental features (tree lines, cliff faces). Low poly. Never interactive. No horses. |
| Mid-ground | All horses. Highest quality rendering. Ground surface, rocks, water, props, job locations. |
| Foreground | Elements between camera and horses. Slight depth-of-field blur. Compositional frame. |

### Fog Rules

Fog is a depth cue only, never an atmosphere blanket. Height-based ground fog only, sitting below ~0.5m. Catches horse legs slightly in forest/plains. Lifts completely on beach and mountain. Distance fog affects background layer only — never touches horses. Horses always read crisply.

### LOD System

| Tier | Quality | Emitters | Approximate Count |
|------|---------|----------|------------------|
| Full quality | 1024px coat. Live physics mane/tail. Full skeleton. Real-time shadows. | Full — all emitters at authored limits | 3–8 near camera centre |
| Medium LOD | 512px coat. Baked swaying mane/tail. Skeleton every other frame. Blob shadow. | 50% particle counts and spawn rates | 5–10 horses |
| Imposter | Flat billboard quad, pre-rendered, updates every 2–3 seconds. | None — emitters destroyed. Glow tint only. | All remaining horses |

Hysteresis rule: upgrade threshold ≠ downgrade threshold. Gap prevents oscillation. LOD transitions are instant (snap, no cross-fade). Upgrade rate limited — at most N horses upgrade per frame, priority to horses nearest camera centre.

Imposters regenerated every time Grazing Mode is entered.

**⚠️ Open Decision (Blocking)**: Imposter billboarding type is unresolved — spherical, cylindrical, or fixed-direction. Must decide before building the imposter shader.

**⚠️ Open Decision (Blocking)**: Transparency and blending order for overlapping horses is unresolved. Additive emitter particles from one horse may visually bleed into an adjacent horse's silhouette. This interacts with the general transparency ordering problem and must be solved together.

### Job System

A job location is a named point in the environment with an animation type, optional prop, and a capacity. Horses assigned to job locations when Grazing Mode is entered. Capacity prevents clipping. Social jobs require minimum occupancy. `requiresAdult` flag marks locations foals cannot hold independently.

### Foal Behaviour in Grazing Mode

Foals (under 1yr) are not independent agents. A foal is an attachment to its mother's scene entity. Position always derived from the mother's position plus an offset. Foals never pathfind independently and never hold job locations independently.

| State | Condition | Behaviour |
|-------|-----------|-----------|
| Playing | Daytime, mother at stationary job | Gentle wandering within leash radius. Small kicks, circling. |
| Nursing | Nursing interval elapsed, mother stationary | Foal moves to mother's flank. Paired nursing animation. |
| Sleeping | Night / rest period | Foal lies down near mother with small random offset. |
| Grazing | Yearling transition (approaching 1yr) | Foal begins grazing near mother before graduating. |

Nursing interval is an epigenetic value set at birth. At exactly 1 year, foals graduate to full independence. Foals inherit emitter traits from the genetic inheritance rules — a foal born of a bioluminescent horse has its own emitter traits resolved at birth.

---

## 18. Running Mode

Running mode is a side-scrolling runner. It is deliberately cartoony — a distinct visual world from grazing mode. **No 3D rendering occurs during running mode.** Everything is pre-baked sprites.

See TravelSpecification.md for the full running mode gameplay spec including canvas size, physics constants, and obstacle rules.

### Sprite Pipeline

Running mode sprites are baked at birth using the cartoon shader. Two spritesheets per horse: left-facing and right-facing. Never mirrored. Sprites are stored permanently and never reflect post-birth changes. If the horse has emitter traits, the bake pipeline activates bloom and captures the glow statically.

### Cartoon Shader Stages

| Stage | Effect |
|-------|--------|
| Posterisation | Reduces continuous PBR shading to 3–4 discrete light bands. Low-poly flat faces read as clean, single-toned cel-shaded panels — more legible under posterisation than a high-poly equivalent. |
| Outline pass | Silhouette lines via back-face expansion. Interior edges via normal-change detection. |
| Colour simplification | Saturation boost. Compresses subtle coat tones toward flatter, more saturated values. |
| Specular suppression | Removes or heavily reduces PBR specular highlights. Cartoon horses don't shine. |
| Bloom (conditional) | Active only if horse has emitter traits. Captures glow statically. Runs before frame capture. |

Bake lighting: canonical neutral running-mode light defined in a config file. All horses baked under identical lighting.

**⚠️ Open Decision**: Cartoon shader treatment of modded surface profiles. Scaled horses have different normal data feeding posterisation — is this intentional visual variety, or should all horses use flat normals in running mode for consistency?

---

## 19. Asset Storage & Caching

In Electron, all persistent assets are files on the local filesystem under `AppData/GlassHorses/`. The Node.js main process owns all disk writes. The renderer process requests writes via IPC. No renderer process writes to disk directly.

| Asset | Format | Path | Lifetime |
|-------|--------|------|---------|
| Atlas thumbnails (L+R) | 128px PNG, atlas-packed | `AppData/.../atlas/sheet_N.png` + `atlasIndex.json` | Forever from birth |
| Running sprites (L+R) | 256px PNG spritesheet, cartoon | `AppData/.../sprites/horse_[id].png` | Forever from birth |
| Detail static frame | 1024px PNG | `AppData/.../detail/horse_[id].png` | Generated on first click; cached |
| Grazing real-time | Live render | RAM only | Never stored |
| Imposter images | 64–128px PNG, 8 angles | `AppData/.../imposters/horse_[id]_[angle].png` | Re-baked on each mode entry |
| Horse game data | Fields in SQLite | SQLite DB file | Forever |
| Genome + epigenetics | Stored in SQLite | SQLite DB file | Forever |
| Mod assets | GLTF/PNG/JS/JSON | `AppData/.../mods/[modname]/` | Until mod removed |
| Emitter definitions | JSON files | Shipped with gene/mod folder | Until mod removed |

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

## 20. Detail View

Full real-time 3D render of a single horse. Free orbit camera. Maximum quality. 1024px coat texture. Full emitters active at maximum particle counts. Bloom active at full strength.

Uses the same render pipeline as Grazing Mode. No separate pipeline. The player can apply any unlocked environment's lighting rig to the Detail View — this does not affect the horse's stored appearance.

---

## 21. Book View & Atlas System

The Book shows all horses as browsable thumbnails. All thumbnails pre-baked at birth. Opens instantly.

| Property | Value |
|----------|-------|
| Atlas sheet size | 2048×2048px — holds 256 thumbnails at 128×128px each |
| Atlas series | Two series: left-facing and right-facing (separate files) |
| Index file | `atlasIndex.json` maps horse ID to sheet number and pixel coordinates |
| Slot management | Next free slot allocated at birth. Freed and reused on horse death. |
| Regeneration | Never regenerated after birth under normal circumstances. |

Atlas thumbnails do not include emitter effects — they are single static frames baked without the bloom pass. The thumbnail communicates coat colour and pattern; live emitters are discoverable in Detail View.

---

## 22. Mod System

### What Modders Can Do

- Register new genes with custom `alterCoat`, `alterNormal`, and `alterEmitter` functions
- Register new emitter definition JSON files
- Register new surface profiles (normal maps, roughness maps)
- Register new appendage models with attachment manifests and named emitter anchor points
- Register new mane/tail/forelock models with physics parameters and emitter anchor points
- Register new animations with JSON descriptors
- Register new environment scenes with lighting, fog, and object placement
- Register new environmental prop objects (GLTF or billboard PNG)
- Register new cutie mark images
- Override existing registered items by ID (subject to conflict resolution policy)

### Mod Folder Structure (Electron)

```
AppData/GlassHorses/mods/
└── mystic/
    ├── mod.json              ← Manifest: name, version, author, dependencies
    ├── genes/
    │   └── unicorn.js        ← Calls alterEmitter, references horn_sparkle.json
    ├── emitters/
    │   └── horn_sparkle.json ← Emitter definition
    ├── models/
    │   └── horn.glb          ← Appendage model with horn_tip anchor declared
    └── environments/
        └── crystal_vale/
```

### Validation at Mod Load Time

- All `hostLandmark` values exist in the current landmark file
- All `hostAnchor` values exist in the referenced model's attachment manifest
- All `emitterDef` file paths resolve to existing JSON files
- `maxParticles` does not exceed 200 per emitter attachment (hard limit)
- `blending` is one of the permitted strings (`additive`, `normal`)
- All animation `entry/exitNeutral` values checked against the neutral pose registry
- All model registry entries checked for required core animation and morph target mappings
- Duplicate allele IDs: hard crash at startup with explicit error message naming the collision
- Missing landmark, anchor, or neutral pose references: hard error naming exactly what is missing

**⚠️ Open Decision (Blocking)**: Mod load order and conflict resolution policy is not defined. When two mods register the same ID: last-loaded wins? First-loaded wins? Hard error? Must decide before building the mod loader.

**⚠️ Open Decision**: Modder shader extension contract is not defined. What can modders replace — material inputs only, or entire shader passes? Without a formal contract, modded shaders can break the pipeline.

---

## 23. Environmental System

### Environmental Object Types

| Type | Description | Best For |
|------|-------------|----------|
| Full 3D | GLTF mesh, proper geometry, shadows, normal maps. | Foreground / mid-ground elements near camera. |
| Billboard imposter | Flat quad facing camera, displaying a PNG. No 3D skills required for modders. | Distant background elements. Degrades at close range. |
| Hybrid | Full 3D close, billboard beyond a defined distance. | Mid-ground objects modders want to look good up close. |

### Sky System

Physically accurate sky model (Three.js Sky — Preetham or Hosek-Wilkie). Uses the environment's key light direction as sun position. Produces accurate sky colour from all camera angles. Automatically matches the lighting rig.

**⚠️ Open Decision**: Formal vs. informal environment layer system. Must objects declare their layer in scene definition files, or just use Z-depth placement? Must decide before writing the modding guide.

**⚠️ Open Decision**: Environmental object dynamic state. Can objects change during a grazing session (depleting hay bale)? Recommend explicitly ruling this out to prevent scope creep.

---

## 24. Post-Birth Appearance Changes

Horses can gain scars, clothing, and equipment after birth. These affect appearance in Grazing Mode and Detail View only. Running mode sprites are never updated.

Post-birth modifications are composited dynamically at priority 255. Clothing uses the appendage system. Scars are coat layer overlays. Neither is baked.

Clothing applied via the appendage system may include emitter-bearing models — a glowing armour piece applied post-birth will have live emitters in Grazing Mode and Detail View. These emitters are not reflected in the running sprite and are not captured in the atlas thumbnail.

**Policy**: Clothing cannot interact with genetics. This is absolute.

---

## 25. Performance Budgets

| Mode | Target | Main Bottleneck |
|------|--------|----------------|
| Running Mode | Maximum FPS. Must never drop below playable. | Canvas sprite blitting. No GPU cost per horse. |
| Grazing Mode | Minimum 20 FPS. Stuttering acceptable. | PBR shader on close-range horses. Mane/tail physics. Bloom pass (fixed cost). Imposter regen at mode entry. |
| Detail View | 60 FPS target. | Trivial. One horse, low poly. |

**⚠️ Open Decision**: Graphics quality settings matrix is not fully defined. At minimum: coat texture resolution scaling, shadow quality scaling, bloom on/off, emitter particle count scaling. Additional quality tiers needed before first release.

**⚠️ Open Decision**: Fallback mode for low-end integrated GPUs that cannot sustain 20 FPS in Grazing Mode is not designed.

---

## 26. Central Event Bus

**⚠️ Open Decision (Blocking)**: No central event bus architecture is defined. Before building any cross-system communication (job system → animation, genetics → renderer, camera → LOD, emitter system → LOD manager, IPC → storage), a named event bus must be designed. All systems should publish and subscribe to events rather than calling each other directly.

---

## 27. Summary: All Open Decisions

### Blocking — Must Decide Before Building

| Decision | Blocks |
|----------|--------|
| Central event bus architecture | All cross-system communication |
| Audio system and animation sync hooks | Animation system |
| Mane/tail depth compositing method | Horse renderer + mane system |
| Imposter billboarding type | Imposter shader |
| Transparency and blending order for overlapping horses (including additive emitter particles) | Horse renderer + emitter system |
| Normal map blending ownership | Coat compositor + material system |
| Mod load order and conflict resolution policy | Mod loader |
| Post-process pass ordering and render target handoff (render → bloom → edge shader) | Camera system |
| Ground plane definition contract per environment | Camera system + modding guide |
| Formal vs. informal environment layer system | Scene renderer + modding guide |
| Paired animation interruption behaviour | Social animation system |

### Non-Blocking — Tune During Testing or Defer

- All specific numerical values (LOD thresholds, camera speeds, physics parameters, cross-fade durations, fog densities, bloom strength/radius/threshold)
- Crystal ball edge shader visual parameters (vignette, chromatic aberration, lens distortion curve)
- Complete required list of core animation semantic names and morph target names
- Full graphics quality settings matrix (including bloom on/off and emitter particle count tiers)
- Fallback mode for low-end hardware
- Whether bloom is included in the low graphics quality tier
- Cartoon shader treatment of modded surface profiles in running mode
- Whether environmental objects can have dynamic state
- Normal map regeneration for post-birth scars
- Cutie mark pass in far-distance imposter baking
- Save schema migration strategy for new gene loci
- Missing-mod fallback visual behaviour
- Modder shader extension contract
- Canonical test horse genome for regression testing