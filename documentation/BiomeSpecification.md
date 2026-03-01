## 🛠️ Tech Spec: Modular 2D Biome Engine

### 1. Global Scale & Obstacle Logic

* **1 Tile (100px)** = 10 Meters.
* **Obstacle Width**: Defined in pixels. If an obstacle is 150px wide, the engine must reserve 2 tiles of space to ensure it doesn't overlap with other spawns.
* **Collision**: Obstacles require a `hitbox` definition so the game knows when the horse must jump.

---

### 2. Folder Structure

* **/biomes/[prefix]*[name]*[suffix]/**
* ... (previous JSONs)
* **/assets/obstacles/** (JSONs + PNGs for jumpable objects)



---

### 3. Updated File Schemas

#### A. `terrain_definitions.json` (Updated)

Each terrain piece now defines which obstacles can appear on it.

* **`obstacles`**: Array of `{"obstacle_json": string, "spawn_chance": float}`.
* *Example*: `{"obstacle_json": "./assets/obstacles/fallen_log.json", "spawn_chance": 0.05}`.



#### B. `obstacle_asset.json` (New Blueprint)

This defines the physical and visual properties of a jumpable object.

* **`width_px`**: Integer. The exact pixel width of the image.
* **`height_px`**: Integer. The exact pixel height.
* **`hitbox`**: `{"x_offset": num, "y_offset": num, "width": num, "height": num}`. Defines the "danger zone" that triggers a crash if the horse doesn't jump.
* **`default_color`**: Hex string (e.g., `"#ff0000"`). Renders as a block if the image fails.
* **`sprite`**: Relative path to `.png`.

---

### 4. Example: "The Fallen Oak"

**`biomes/base_forest_01/assets/obstacles/fallen_log.json`**

```json
{
  "name": "Fallen Oak",
  "width_px": 180,
  "height_px": 60,
  "hitbox": {
    "x_offset": 10,
    "y_offset": 0,
    "width": 160,
    "height": 40
  },
  "default_color": "#5C4033",
  "sprite": "./log.png"
}

```

---

### 5. Programming Logic Requirements

#### I. The Obstacle Spawner

When the generator creates a new tile, it checks the `spawn_chance` for the allowed obstacles.

1. **Selection**: Roll for an obstacle.
2. **Space Check**: If an obstacle is 180px wide, it occupies **2 tiles** (200px). The engine must not spawn another obstacle or a "Special Terrain" (like a Shrine) until those 2 tiles have passed.
3. **Placement**: The obstacle is anchored to the Y-coordinate (height) of the terrain it was spawned on.

#### II. The Jump/Collision Logic

The engine constantly checks the horse's bounding box against the active obstacle's `hitbox`.

```javascript
function checkCollision(horse, obstacle) {
    const hb = obstacle.hitbox;
    const obsX = obstacle.worldX + hb.x_offset;
    const obsY = obstacle.worldY + hb.y_offset;

    if (horse.x < obsX + hb.width &&
        horse.x + horse.width > obsX &&
        horse.y < obsY + hb.height &&
        horse.y + horse.height > obsY) {
        return "CRASH";
    }
}

```

#### III. Scaling & Speed

The obstacle moves left at the same rate as the terrain. Because **1 tile = 10 meters**, an obstacle that is 100px wide is physically 10 meters long in the game world.

---

### 🚀 Final Summary for Programmer

* **Modular**: Everything is local to the biome folder.
* **Deterministic**: 100px = 10m. All assets are multiples of 100px.
* **Flexible**: `tiles_per_10m_multiplier` controls the "perceived" speed.
* **Safe**: `default_color` prevents crashes on missing assets.
* **Interactive**: `obstacle_asset.json` handles the jump-logic via hitbox offsets.