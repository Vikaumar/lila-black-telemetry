# Architecture & Technical Design

## What I Built & Why

A **static-first, WebGL-accelerated telemetry replay tool** for LILA BLACK. The goal was to turn raw Parquet match data into something a Level Designer can actually *use* — fast, visual, spatial — not a data table.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OFFLINE PIPELINE                                │
│                                                                         │
│  player_data/                                                           │
│  └── Feb_10/ .. Feb_14/          1,243 × .nakama-0 Parquet files       │
│         │                                                               │
│         ▼                                                               │
│  preprocess.py  ──────────────────────────────────────────────────────  │
│    • pyarrow reads Parquet files                                        │
│    • Decodes event bytes → UTF-8                                        │
│    • Classifies human/bot (UUID vs numeric user_id)                     │
│    • Converts ts (Unix seconds mislabeled as ms) → match-relative ms   │
│    • Groups by match_id, splits paths vs events                        │
│    • Serialises one JSON per match + manifest.json                      │
│         │                                                               │
│         ▼                                                               │
│  frontend/public/data/                                                  │
│    ├── manifest.json         796 match index entries                    │
│    └── {match_id}.json       paths[] + events[] per match              │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │  HTTP (static CDN / Vite dev server)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          REACT FRONTEND (Vite)                          │
│                                                                         │
│  App.tsx                                                                │
│  ├── Sidebar.tsx  →  map/match selector + layer toggles                │
│  ├── MapComponent.tsx  →  deck.gl canvas                               │
│  │     ├── BitmapLayer      minimap image (map background)             │
│  │     ├── HeatmapLayer     GPU density heatmaps (kills, deaths, traffic)│
│  │     ├── TripsLayer       animated player paths                      │
│  │     └── ScatterplotLayer event markers (kills, deaths, loot)        │
│  └── Timeline.tsx  →  play/pause/scrub/speed controls                 │
│                                                                         │
│  State: Zustand store                                                   │
│    selectedMap, selectedMatch, currentTime, matchDuration,             │
│    isPlaying, playbackSpeed, showHumans, showBots, showKills...        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Coordinate Mapping — The Tricky Part

> The assignment explicitly called this out as the hardest problem. Here is the full approach.

### The Problem
The telemetry stores world coordinates in 3D engine space (`x`, `y`, `z`) with arbitrary origins and scales per map. The minimaps are 1024×1024 PNG images. Naively looping over every event and applying a formula would require a manual transform on ~89,000 points, and any error in the formula would cause visible drift against map landmarks.

### The Solution — deck.gl `OrthographicView` + `BitmapLayer` bounds

Instead of converting data coordinates to pixel coordinates, I let the **GPU do the alignment** by expressing both the minimap image and the data points in the **same world coordinate space**.

```
BitmapLayer bounds = [originX, originZ, originX + scale, originZ + scale]
```

For AmbroseValley (`originX=-370`, `originZ=-473`, `scale=900`):
```
bounds = [-370, -473, 530, 427]
```

The `BitmapLayer` stretches the minimap image to exactly fit those world-space corners. Any event at `(x=-301, z=-355)` is plotted in the same world space and automatically lands on the correct pixel of the image — **zero per-point math required**.

### The Y-Axis Flip

The game engine uses a right-handed coordinate system where `+Z` points "up" on the minimap. Standard image coordinates have `+Y` pointing *down*. The README formula confirms this: `pixel_y = (1 - v) * 1024`.

Setting `OrthographicView({ flipY: false })` flips the deck.gl canvas y-axis, matching image-space orientation to world-space orientation. Without this, all paths appear vertically mirrored.

### Elevation
The `y` column represents **height** in the 3D world (hills, buildings). It is intentionally **discarded** for 2D minimap plotting. Only `x` and `z` are used.

### Verification
Visual calibration: `KilledByStorm` markers consistently cluster at map edges (the storm perimeter) and combat kill markers cluster in named zones (Mine Pit, Cave House), confirming correct alignment.

---

## Assumptions & How I Handled Them

### 1. Bot Detection
**What the README says:** UUID `user_id` = human, short numeric `user_id` = bot.

**Implementation:** `'-' in str(user_id)` — UUIDs always contain hyphens; bot IDs like `1440` or `382` never do. This is cleaner and more reliable than the earlier `len(str(user_id)) < 10` heuristic.

### 2. Event Bytes Encoding
**What the README says:** `event` column is `binary` — decode with `.decode('utf-8')`.

**Implementation:** Applied as a vectorised pandas lambda before any processing.

### 3. Timestamp Unit Mismatch ⚠️ — The Critical Gotcha
**What the README says:** `ts` is `timestamp[ms]`, representing time elapsed within the match.

**What the data actually contains:** The Parquet schema labels the column as `timestamp[ms]`, but the raw int64 values are **Unix seconds** (e.g. `1,770,754,537` ≡ `2026-02-10 20:15:37 UTC`). When pandas reads these as `datetime64[ms]`, it interprets the values as milliseconds → renders as `1970-01-21`, and match durations appear as ~500ms instead of ~8 minutes.

**Fix:** `full_df['ts_ms'] = full_df['ts'].astype('int64') * 1000`

This was verified by checking that `1,770,754,537 seconds ≈ Feb 2026` (the data collection period).

### 4. Storm vs PvP Deaths
**The data:** `KilledByStorm` is its own event type, distinct from `Killed`. No ambiguity — filtered independently, rendered as purple markers.

### 5. Match-Relative Timestamps
Each match's events are re-zeroed to `ts_rel = ts_ms - min(ts_ms)` so the timeline always starts at `0ms`, regardless of absolute wall-clock time.

---

## Trade-Off Table

| Decision | What I Considered | What I Chose & Why |
|---|---|---|
| **Query engine** | DuckDB-WASM (live Parquet in browser) | **Static pre-baked JSON** — zero client-side compute, instant loads, hostable on any CDN |
| **Serialization format** | Apache Arrow / binary | **JSON** — simpler toolchain, no WASM dependency, negligible size difference at this scale |
| **Rendering engine** | Mapbox GL, Leaflet, raw Canvas 2D | **deck.gl** — purpose-built for large-scale point/path data, native `TripsLayer` for trail animation, GPU-accelerated |
| **Map projection** | Geographic (lat/lng) | **OrthographicView** — game world is flat Euclidean space, not geographic; no distortion needed |
| **Heatmaps** | Precomputed static heatmap tiles | **Live HeatmapLayer (`@deck.gl/aggregation-layers`)** — GPU-accelerated client-side Gaussian kernel aggregation for kill zones, death hotspots, and movement flow |
| **Timeline animation** | CSS transitions, `setInterval` | **`requestAnimationFrame` loop** — frame-perfect timing, respects tab visibility, zero drift |
| **Backend** | FastAPI / Express serving data | **No backend** — all data is static after preprocessing; eliminates ops complexity entirely |
| **Styling** | Raw CSS, Styled Components | **Tailwind CSS v4** — rapid iteration, consistent design tokens, no CSS-in-JS overhead |

---

## Code Quality Notes

- **TypeScript throughout** — all props, store state, and map config are typed
- **Config-driven map registry** (`src/config/maps.ts`) — adding a 4th map requires one object entry
- **Pure preprocessing** — `preprocess.py` is side-effect free and fully re-runnable; outputs are deterministic
- **Zustand store** — single source of truth for all UI state; no prop drilling
- **Separation of concerns** — data fetching in `MapComponent`, playback logic in `Timeline`, selection UI in `Sidebar`
