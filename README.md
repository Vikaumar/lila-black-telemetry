# LILA BLACK — Player Journey Visualization Tool

<div align="center">

```
██╗     ██╗██╗      █████╗     ██████╗ ██╗      █████╗  ██████╗██╗  ██╗
██║     ██║██║     ██╔══██╗    ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝
██║     ██║██║     ███████║    ██████╔╝██║     ███████║██║     █████╔╝ 
██║     ██║██║     ██╔══██║    ██╔══██╗██║     ██╔══██║██║     ██╔═██╗ 
███████╗██║███████╗██║  ██║    ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗
╚══════╝╚═╝╚══════╝╚═╝  ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
                  TELEMETRY VISUALIZATION SYSTEM
```

**A WebGL-accelerated analytics dashboard for Level Designers to replay, inspect, and derive insights from LILA BLACK match telemetry.**

![Status](https://img.shields.io/badge/Status-Production%20Ready-00f2fe?style=for-the-badge)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Deck.GL%20%7C%20Python-10131a?style=for-the-badge)
![Data](https://img.shields.io/badge/Data-796%20Matches%20%7C%205%20Days%20%7C%201%2C243%20Files-10131a?style=for-the-badge)

</div>

---

## 🌐 Live Deployment

- **Hosted URL:** *(Add your deployed Vercel / Netlify / Cloudflare link here, e.g., `https://lila-telemetry.vercel.app`)*
- **Evaluator Walkthrough:** [`WALKTHROUGH.md`](./WALKTHROUGH.md)
- **Technical Architecture:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Game Insights & Metrics:** [`INSIGHTS.md`](./INSIGHTS.md)

---

## What This Is

This tool transforms 1,243 raw Parquet telemetry files from 5 days of LILA BLACK production gameplay into an **interactive, time-scrubbable replay dashboard** that a Level Designer can use to answer real questions:

- **Where do players actually go** — and what map areas are ignored?
- **Where do fights break out** — intended chokepoints or frustrating camp spots?
- **Where do players die to the storm** — and are rotations too difficult?
- **How does a single match unfold over time** — rotations, pressure, pacing?
- **Where do humans and bots behave differently** — and what does that tell us about pathing?
- **Where are the high-density heat zones** — kill clusters, death hotspots, and transit arteries?

---

## Quick Start (Run Locally)

The repository comes pre-bundled with the lightweight (~6 MB) processed telemetry JSON for all 796 matches, so you can run the dashboard immediately with zero Python setup.

```bash
# 1. Clone repository
git clone https://github.com/Vikaumar/lila-black-telemetry.git
cd lila-black-telemetry

# 2. Launch Frontend
cd frontend
npm install
npm run dev
```

Navigate to **http://localhost:5173** — the dashboard opens immediately with a live match loaded.

---

## Re-running the Data Pipeline (Optional)

If you have the raw Parquet dataset and wish to re-execute the preprocessing pipeline from scratch:

```bash
# 1. Prepare environment
cd preprocess
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt

# 2. Run the preprocessor
python preprocess.py
```

This transforms raw `.nakama-0` Parquet files, resolves schema timestamp discrepancies, associates session dates, separates continuous trajectories from discrete game events, and generates:
- `frontend/public/data/manifest.json` — index of all 796 matches with map, date, duration, and player/bot counts.
- `frontend/public/data/{match_id}.json` — individual match trajectories and events.

---

## How to Use the Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SIDEBAR (left)                  │   MAP CANVAS (center)                │
│                                  │                                      │
│  • Tactical Map (3 maps)         │   • Cyan trails = Human paths        │
│  • Session Date filter           │   • Purple trails = Bot paths        │
│  • Match Log selector            │   • Red dots = Kills                 │
│  • Heatmap Overlay:              │   • Orange dots = Deaths             │
│    [Off | Kills | Deaths | Flow] │   • Purple dots = Storm Deaths       │
│  • Telemetry Layers:             │   • Green dots = Supply Drops        │
│    - Humans / AI Sentinels       │   • GPU Density Heatmap overlay      │
│    - Kills / Deaths / Storm/Loot │                                      │
├──────────────────────────────────────────────────────────────────────────┤
│  TIMELINE (bottom)                                                       │
│  ▶ Play │ 1:23 ──●──────────────────────── / 8:28 │ ⏮ RESET │ 1x 5x 50x │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Capabilities:
1. **Multi-Speed Replay Engine**: Scrub through matches at 1x (real-time), 5x, or 50x (complete an 8-minute match in 10 seconds).
2. **GPU Heatmap Overlays**: Toggle thermal density overlays for Kill Zones, Death Zones, and Movement Arteries directly over the minimap.
3. **Temporal Landmark Synchronisation**: Kill and death markers appear on map at the exact second they occurred during playback.
4. **Interactive HUD Inspection**: Hover over any event to inspect player UUID/bot tag, event classification, and timestamp.
5. **Zero-Drift Coordinate Calibration**: Uses Deck.gl Orthographic projection with exact map bounding boxes matching game coordinates.

---

## 1-Click Deployment Guide (Vercel / Netlify)

Deploying this dashboard live takes under 2 minutes:

### Deploy on Vercel:
1. Push this repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Framework Preset: **Vite**.
6. Click **Deploy**. The site will build and provide a public shareable URL.

---

## Architecture Overview

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full technical deep-dive including:
- WebGL / Deck.gl rendering pipeline
- Zero-drift coordinate mapping formula and GPU corner bounds
- The critical timestamp schema gotcha and its mathematical resolution
- Complete architectural trade-off evaluation matrix

---

## Key Insights

See [`INSIGHTS.md`](./INSIGHTS.md) for three data-driven Level Design findings with concrete metrics and actionable recommendations:
1. **The Mine Pit Deathtrap:** Storm deaths cluster at one GrandRift bottleneck at 3–4× normal rates.
2. **Bot-Human Spawn Collision:** Scripted early encounters reduce replay variance on AmbroseValley.
3. **The Highway Problem:** The high-traffic central corridor on Lockdown suffers from near-zero combat density.

---

## Project Structure

```
Lila Assignment/
├── preprocess/
│   ├── preprocess.py          # Parquet → JSON conversion pipeline
│   └── requirements.txt       # Python dependencies (pyarrow, pandas, numpy)
├── frontend/
│   ├── public/
│   │   ├── data/              # Preprocessed match JSONs & manifest (6 MB)
│   │   └── minimaps/          # 1024x1024 game minimaps
│   └── src/
│       ├── config/maps.ts     # World bounds, origins, scales for each map
│       ├── store/useStore.ts  # Zustand reactive global state
│       ├── deck/
│       │   └── MapComponent.tsx  # Deck.gl (Bitmap + Trips + Scatterplot + Heatmap)
│       └── ui/
│           ├── Sidebar.tsx    # Map/Date/Match selectors, Heatmaps, Layer toggles
│           └── Timeline.tsx   # Scrubbing controls, play/pause, 1x/5x/50x speeds
├── README.md                  # Main overview & quick start
├── ARCHITECTURE.md            # Technical design & coordinate math doc
├── INSIGHTS.md                # 3 data-driven Level Design insights
├── WALKTHROUGH.md             # Step-by-step evaluator testing guide
└── .gitignore                 # Excludes heavy raw parquets, venvs, node_modules
```

---

## Data Facts

| Metric | Value |
|--------|-------|
| Date Range | Feb 10–14, 2026 |
| Total source files | 1,243 `.nakama-0` Parquet files |
| Unique matches processed | 796 |
| Unique human players | 339 |
| Total event rows | ~89,000 |
| Maps | AmbroseValley, GrandRift, Lockdown |
| Typical match duration | 5–10 minutes |

---

*Built for the LILA Games — Product Engineer Written Assessment.*
