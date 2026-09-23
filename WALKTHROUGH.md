# Evaluator Walkthrough & Feature Verification Guide

This walkthrough provides the evaluating team with a structured, step-by-step verification guide covering all core features and rubric requirements from the **LILA Product Engineer Written Test**.

---

## Quick Access

- **Local URL:** `http://localhost:5173`
- **Hosted Live URL:** **[https://lila-black-telemetry.vercel.app/](https://lila-black-telemetry.vercel.app/)**
- **Data Preloaded:** 796 matches across 3 tactical maps (AmbroseValley, GrandRift, Lockdown)

---

## Verification Checklist & Test Recipes

### 1. Minimap World Coordinate Mapping
- **Requirement:** World coordinates mapped accurately to 2D minimaps with zero landmark drift.
- **How to verify:**
  1. Open the dashboard and select **AmbroseValley** from the `TACTICAL MAP` selector.
  2. Notice how paths strictly follow ground corridors, valleys, and structures.
  3. Switch between **GrandRift** and **Lockdown**; verify each map auto-centers and sets the viewport bounds to the respective world coordinate limits.
  4. Notice `flipY: false` is active, ensuring proper orientation matching engine space.

### 2. Multi-Dimensional Filtering (Map, Date, Match)
- **Requirement:** Allow filtering by map, date, and/or match.
- **How to verify:**
  1. In the sidebar, select **SESSION DATE**: switch between `All Dates`, `2026-02-10`, `2026-02-11`, etc.
  2. Notice the `MATCH LOG` dropdown dynamically updates its count and available matches for that specific date and map.
  3. Select any match in the dropdown to instantly load its telemetry.

### 3. Human vs Bot Visual Differentiation
- **Requirement:** Distinguish between human players and bots visually.
- **How to verify:**
  1. In `TELEMETRY_LAYERS`, observe:
     - **Humans:** Rendered as **glowing Cyan trails** (`#00f2fe`).
     - **AI Sentinels:** Rendered as **Purple trails** (`#a855f7`).
  2. Toggle off the **Humans** checkbox: all human paths disappear, leaving only bot patrol routes.
  3. Toggle off **AI Sentinels**: only human exploration trails remain.

### 4. Event Markers with Temporal Accuracy
- **Requirement:** Show different event types (kills, deaths, loot, storm deaths) as distinct markers.
- **How to verify:**
  1. Observe the four event categories:
     - 🔴 **Kills (Elims):** Bright rose/red markers where an elimination occurred.
     - 🟠 **Fallen Vectors (Deaths):** Orange markers where a player was defeated.
     - 🟣 **Storm Dissolved:** Purple warning markers where the storm circle claimed a player.
     - 🟢 **Supply Drops (Loot):** Emerald green markers indicating loot interactions.
  2. Hover your mouse over any marker on the map to trigger a real-time HUD tooltip showing:
     - Event Type
     - Player ID (UUID or numeric Bot ID)
     - Elapsed match timestamp (in seconds)

### 5. Time-Scrubbing Playback Engine
- **Requirement:** Timeline/playback to watch a match unfold over time.
- **How to verify:**
  1. Look at the bottom control bar: notice the match duration dynamically adapts to the selected match (e.g. `0:00 / 8:28`).
  2. Click **PLAY (▶)**: paths progressively draw themselves in real-time, and event markers only pop onto the map once their exact timestamp is reached.
  3. Change the speed toggle:
     - **1x:** 1:1 real-time playback
     - **5x:** accelerated review
     - **50x:** full 8-minute match replay completed in ~10 seconds
  4. Drag the scrubber handle to any point in the match; observe paths and events instantly seek to that millisecond.
  5. Click **RESET (⏮)** to return to `0:00`.

### 6. Heatmap Overlays (Kill Zones, Death Zones, Traffic)
- **Requirement:** Heatmap overlays showing kill zones, death zones, or high-traffic areas.
- **How to verify:**
  1. In the sidebar under `HEATMAP_OVERLAY`, click **Kill Zones**:
     - A GPU-accelerated thermal density heatmap immediately overlays the minimap, highlighting major conflict clusters.
  2. Click **Death Zones**:
     - Visualizes mortality density, revealing fatal choke corridors.
  3. Click **High Traffic**:
     - Density heatmap aggregating all trajectory coordinate points, exposing player traversal highways and completely deserted dead-zones.
  4. Click **Off** to return to clean path inspection.

---

## Recommended Showcase Matches

To observe the clearest gameplay dynamics, try loading these matches:

| Scenario | Map | Match ID Preview | Why Evaluate This |
|---|---|---|---|
| **Bot Patrol Swarm** | GrandRift | `14a40253...` (12 bots) | 12 AI Sentinels patrolling simultaneously; highlights human vs bot pathing disparity. |
| **Intense Combat** | AmbroseValley | `0f169d20...` (1p, 6b) | Early kill events at 1:08; perfect for testing timeline event triggers. |
| **Late Game Storm Pressure** | AmbroseValley | `05302758...` (1p, 7b) | Long 8.5-minute match showing late-game circle collapse and storm casualties. |

---

## Summary of Evaluator Checklist Coverage

- [x] Hosted accessible tool with shareable deployment link
- [x] Full source code organized and cleanly structured
- [x] Zero-drift GPU-accelerated coordinate mapping on 3 minimaps
- [x] Clear visual distinction between humans and AI bots
- [x] Distinct markers for kills, deaths, storm deaths, and loot
- [x] Filtering by Map, Date, and Match
- [x] Dynamic timeline playback with 1x, 5x, and 50x scrub speeds
- [x] Heatmap overlays for Kill Zones, Death Zones, and High Traffic
- [x] Complete one-page `ARCHITECTURE.md` explaining coordinate math and pipeline
- [x] Three data-driven design insights in `INSIGHTS.md` with concrete metrics and actions
