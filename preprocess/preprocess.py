import os
import json
import pyarrow.parquet as pq
import pandas as pd
import numpy as np

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "player_data_raw", "player_data")
OUT_DIR = os.path.join(PROJECT_DIR, "frontend", "public", "data")

def is_bot(user_id: str) -> bool:
    """Per README: UUID = human, short numeric ID = bot."""
    # UUIDs contain hyphens, numeric bot IDs do not
    return '-' not in str(user_id)

def process_data():
    if not os.path.exists(OUT_DIR):
        os.makedirs(OUT_DIR)
        
    print("Finding all parquet files...")
    all_files = []
    for root, dirs, files in os.walk(DATA_DIR):
        for file in files:
            # Skip non-data files; accept .nakama-0 parquet files per README
            if file.endswith(".md") or file == ".DS_Store" or file.endswith(".png") or file.endswith(".jpg"):
                continue
            if not file.endswith(".nakama-0"):
                continue
            all_files.append(os.path.join(root, file))
            
    print(f"Found {len(all_files)} files. Reading...")
    
    # Read all tables
    dfs = []
    for f in all_files:
        try:
            table = pq.read_table(f)
            df = table.to_pandas()
            dfs.append(df)
        except Exception as e:
            print(f"Failed to read {f}: {e}")
            
    if not dfs:
        print("No data found!")
        return
        
    print("Concatenating...")
    full_df = pd.concat(dfs, ignore_index=True)
    
    print("Decoding bytes...")
    full_df['event'] = full_df['event'].apply(lambda x: x.decode('utf-8') if isinstance(x, bytes) else x)
    
    # IMPORTANT: Despite the Parquet schema labeling ts as timestamp[ms],
    # the actual stored int64 values are Unix SECONDS (verified: value ~1.77B matches Feb 2026).
    # Pandas reads them as datetime64[ms] treating the value as ms → shows Jan 1970.
    # Fix: multiply by 1000 to convert from seconds to actual milliseconds.
    print(f"ts dtype: {full_df['ts'].dtype}")
    full_df['ts_ms'] = full_df['ts'].astype('int64') * 1000  # sec -> ms (schema bug in data)
    
    sample_sec = full_df['ts_ms'].iloc[0] // 1000
    print(f"Sample ts as seconds: {sample_sec} => {pd.Timestamp(sample_sec, unit='s')}")
    
    # Add isBot — per README: UUID = human (has hyphens), short numeric = bot
    full_df['isBot'] = full_df['user_id'].apply(is_bot)
    print(f"Humans: {(~full_df['isBot']).sum()}, Bots: {full_df['isBot'].sum()}")
    
    # Group by match_id
    matches = full_df.groupby('match_id')
    
    manifest = {
        "maps": {},
        "dates": {},
        "matches": []
    }
    
    print(f"Processing {len(matches)} matches...")
    count = 0
    
    for match_id, m_df in matches:
        m_df = m_df.sort_values('ts_ms')
        
        map_id = str(m_df['map_id'].iloc[0])
        match_start = m_df['ts_ms'].min()
        
        # Compute match-relative time in ms (starts at 0)
        m_df = m_df.copy()
        m_df['ts_rel'] = (m_df['ts_ms'] - match_start).astype(int)
        
        # Separate paths (position events) from discrete events
        paths_df = m_df[m_df['event'].isin(['Position', 'BotPosition'])]
        events_df = m_df[~m_df['event'].isin(['Position', 'BotPosition'])]
        
        paths = []
        for user_id, u_df in paths_df.groupby('user_id'):
            u_df = u_df.sort_values('ts_rel')
            path_bot = bool(u_df['isBot'].iloc[0])
            
            path_coords = u_df[['x', 'z']].values.tolist()
            timestamps = u_df['ts_rel'].values.tolist()
            
            if len(path_coords) < 2:
                continue
                
            paths.append({
                "user_id": str(user_id),
                "isBot": path_bot,
                "path": path_coords,
                "timestamps": timestamps
            })
            
        events = []
        for _, row in events_df.iterrows():
            events.append({
                "user_id": str(row['user_id']),
                "isBot": bool(row['isBot']),
                "type": str(row['event']),
                "x": float(row['x']),
                "z": float(row['z']),
                "ts": int(row['ts_rel'])
            })
            
        duration = int(m_df['ts_rel'].max()) if not m_df.empty else 0
        match_data = {
            "match_id": str(match_id),
            "map_id": map_id,
            "duration": duration,
            "player_count": int(len(m_df[~m_df['isBot']]['user_id'].unique())),
            "bot_count": int(len(m_df[m_df['isBot']]['user_id'].unique())),
            "paths": paths,
            "events": events
        }
        
        out_file = os.path.join(OUT_DIR, f"{match_id}.json")
        with open(out_file, 'w') as f:
            json.dump(match_data, f)
            
        match_date = pd.to_datetime(match_start, unit='ms').strftime('%Y-%m-%d')
        manifest['matches'].append({
            "match_id": str(match_id),
            "map_id": map_id,
            "date": match_date,
            "duration": duration,
            "player_count": match_data["player_count"],
            "bot_count": match_data["bot_count"]
        })
        manifest['dates'][match_date] = manifest['dates'].get(match_date, 0) + 1
        
        count += 1
        if count % 100 == 0:
            print(f"Processed {count} matches...")
            
    manifest['dates'] = sorted(list(manifest['dates'].keys()))
    with open(os.path.join(OUT_DIR, "manifest.json"), 'w') as f:
        json.dump(manifest, f)
        
    print(f"Done! Processed {count} matches and saved to {OUT_DIR}")
    
    # Quick sanity check on a match with events
    for m in manifest['matches']:
        if m['bot_count'] > 0:
            check_file = os.path.join(OUT_DIR, f"{m['match_id']}.json")
            with open(check_file) as f:
                check = json.load(f)
            kill_evts = [e for e in check['events'] if 'Kill' in e['type']]
            if kill_evts:
                print(f"\n=== SANITY CHECK: {m['match_id'][:8]} ===")
                print(f"  Duration: {check['duration']}ms ({check['duration']//1000}s)")
                print(f"  Kill event ts: {kill_evts[0]['ts']}ms")
                print(f"  Players: {m['player_count']} humans, {m['bot_count']} bots")
                break

if __name__ == "__main__":
    process_data()
