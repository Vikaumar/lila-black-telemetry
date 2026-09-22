import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { MAPS } from '../config/maps';

export const Sidebar: React.FC = () => {
  const store = useStore();
  const [manifest, setManifest] = useState<any>(null);
  
  useEffect(() => {
    fetch('/data/manifest.json')
      .then(res => res.json())
      .then(data => {
        setManifest(data);
        if (data.matches.length > 0 && !store.selectedMatch) {
          const firstForMap = data.matches.find((m: any) => m.map_id === store.selectedMap) || data.matches[0];
          store.setFilter('selectedMatch', firstForMap.match_id);
        }
      });
  }, []);

  const dates: string[] = manifest?.dates || [];
  
  // Filter matches by selectedMap and selectedDate (if any)
  const matchesForMap = (manifest?.matches || []).filter((m: any) => {
    const mapMatch = m.map_id === store.selectedMap;
    const dateMatch = !store.selectedDate || store.selectedDate === 'all' || m.date === store.selectedDate;
    return mapMatch && dateMatch;
  });

  return (
    <aside className="w-80 bg-surface-container-low/95 backdrop-blur-xl border-r border-outline-variant/40 flex flex-col justify-between h-full z-20 shrink-0 select-none shadow-2xl relative">
      <div className="absolute inset-0 bg-grid-hud opacity-30 pointer-events-none mix-blend-screen" />
      
      {/* Top Sector Metadata & Match Selection */}
      <div className="p-3 border-b border-outline-variant/30 space-y-3 relative z-10 bg-surface-container-low">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-surface-container-highest border border-outline-variant/50 text-primary-container">
              <span className="material-symbols-outlined text-lg">radar</span>
            </div>
            <div>
              <div className="text-label-md font-label-md font-bold text-primary tracking-widest flex items-center gap-1.5">
                LILA BLACK // TELEMETRY
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
              </div>
              <div className="text-label-sm font-label-sm text-outline">STATUS: REPLAY_ARCHIVE</div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {/* Map Selector */}
          <div className="relative">
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold">TACTICAL MAP</label>
            <div className="relative flex items-center">
              <select 
                className="w-full pl-3 pr-8 py-1.5 bg-surface-container-lowest border border-outline-variant hover:border-primary-container/60 cursor-pointer transition-colors text-label-md font-label-md text-primary font-bold focus:ring-0 focus:outline-none appearance-none rounded"
                value={store.selectedMap}
                onChange={e => {
                  store.setFilter('selectedMap', e.target.value);
                  const matches = (manifest?.matches || []).filter((m: any) => {
                    const mapMatch = m.map_id === e.target.value;
                    const dateMatch = !store.selectedDate || store.selectedDate === 'all' || m.date === store.selectedDate;
                    return mapMatch && dateMatch;
                  });
                  if (matches.length > 0) {
                    store.setFilter('selectedMatch', matches[0].match_id);
                  }
                }}
              >
                {Object.values(MAPS).map(m => (
                  <option key={m.id} value={m.id}>{m.id}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-outline absolute right-2 pointer-events-none text-xl">arrow_drop_down</span>
            </div>
          </div>

          {/* Date Selector */}
          <div className="relative">
            <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1 font-semibold">SESSION DATE</label>
            <div className="relative flex items-center">
              <select 
                className="w-full pl-3 pr-8 py-1.5 bg-surface-container-lowest border border-outline-variant hover:border-primary-container/60 cursor-pointer transition-colors text-label-sm font-label-sm text-on-surface focus:ring-0 focus:outline-none appearance-none rounded"
                value={store.selectedDate || 'all'}
                onChange={e => {
                  const val = e.target.value;
                  store.setFilter('selectedDate', val);
                  const matches = (manifest?.matches || []).filter((m: any) => {
                    const mapMatch = m.map_id === store.selectedMap;
                    const dateMatch = !val || val === 'all' || m.date === val;
                    return mapMatch && dateMatch;
                  });
                  if (matches.length > 0) {
                    store.setFilter('selectedMatch', matches[0].match_id);
                  }
                }}
              >
                <option value="all">All Dates ({manifest?.matches?.length || 0} matches)</option>
                {dates.map((d: string) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <span className="material-symbols-outlined text-outline absolute right-2 pointer-events-none text-xl">arrow_drop_down</span>
            </div>
          </div>

          {/* Match Selector */}
          <div className="relative">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-label-sm font-label-sm text-on-surface-variant font-semibold">MATCH LOG</label>
              <span className="text-[10px] text-outline">{matchesForMap.length} available</span>
            </div>
            <div className="relative flex items-center">
              <select 
                className="w-full pl-3 pr-8 py-1.5 bg-surface-container-lowest border border-outline-variant hover:border-primary-container/60 cursor-pointer transition-colors text-label-sm font-label-sm text-on-surface focus:ring-0 focus:outline-none appearance-none rounded"
                value={store.selectedMatch || ''}
                onChange={e => store.setFilter('selectedMatch', e.target.value)}
              >
                {matchesForMap.map((m: any) => (
                  <option key={m.match_id} value={m.match_id}>
                    {m.match_id.substring(0, 8)}... ({m.player_count}p, {m.bot_count}b) - {Math.round((m.duration || 0)/1000)}s
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-outline absolute right-2 pointer-events-none text-xl">arrow_drop_down</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layers & Heatmap Controls */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar relative z-10">
        
        {/* Heatmap Overlay Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-label-sm font-label-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-400 text-base">local_fire_department</span>
              HEATMAP_OVERLAY
            </span>
            {store.heatmapMode !== 'none' && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/40 uppercase font-mono">
                ACTIVE
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'none', label: 'Off', icon: 'visibility_off' },
              { id: 'kills', label: 'Kill Zones', icon: 'skull' },
              { id: 'deaths', label: 'Death Zones', icon: 'dangerous' },
              { id: 'traffic', label: 'High Traffic', icon: 'route' },
            ].map(tab => {
              const active = store.heatmapMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => store.setFilter('heatmapMode', tab.id)}
                  className={`flex items-center space-x-1.5 px-2 py-1.5 rounded text-left text-xs transition-all border ${
                    active 
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold shadow-[0_0_8px_rgba(251,191,36,0.25)]' 
                      : 'bg-surface-container/40 border-outline-variant/30 text-on-surface-variant hover:border-outline-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Telemetry Layers */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-label-sm font-label-sm font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary-container text-base">layers</span>
              TELEMETRY_LAYERS
            </span>
          </div>
          
          <div className="space-y-1.5">
            {/* Humans */}
            <label className={`flex items-center justify-between px-3 py-2 rounded bg-surface-container/60 border ${store.showHumans ? 'border-primary-container/50' : 'border-outline-variant/30'} hover:border-primary-container/50 cursor-pointer transition-all`}>
              <div className="flex items-center space-x-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${store.showHumans ? 'bg-primary-container shadow-[0_0_8px_#00f2fe]' : 'bg-outline-variant'}`}></span>
                <span className="text-label-md font-label-md text-on-surface font-medium">Humans (Cyan)</span>
              </div>
              <input type="checkbox" checked={store.showHumans} onChange={() => store.toggleLayer('showHumans')} className="hidden" />
            </label>

            {/* Bots */}
            <label className={`flex items-center justify-between px-3 py-2 rounded bg-surface-container/60 border ${store.showBots ? 'border-purple-500/50' : 'border-outline-variant/30'} hover:border-purple-500/50 cursor-pointer transition-all`}>
              <div className="flex items-center space-x-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${store.showBots ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-outline-variant'}`}></span>
                <span className="text-label-md font-label-md text-on-surface font-medium">AI Sentinels (Purple)</span>
              </div>
              <input type="checkbox" checked={store.showBots} onChange={() => store.toggleLayer('showBots')} className="hidden" />
            </label>

            {/* Kills */}
            <label className={`flex items-center justify-between px-3 py-2 rounded bg-surface-container/60 border ${store.showKills ? 'border-rose-500/50' : 'border-outline-variant/30'} hover:border-rose-500/50 cursor-pointer transition-all`}>
              <div className="flex items-center space-x-2.5">
                <span className={`material-symbols-outlined text-lg ${store.showKills ? 'text-rose-500' : 'text-outline-variant'}`}>skull</span>
                <span className="text-label-md font-label-md text-on-surface font-medium">Kills (Elims)</span>
              </div>
              <input type="checkbox" checked={store.showKills} onChange={() => store.toggleLayer('showKills')} className="hidden" />
            </label>

            {/* Deaths */}
            <label className={`flex items-center justify-between px-3 py-2 rounded bg-surface-container/60 border ${store.showDeaths ? 'border-orange-500/50' : 'border-outline-variant/30'} hover:border-orange-500/50 cursor-pointer transition-all`}>
              <div className="flex items-center space-x-2.5">
                <span className={`material-symbols-outlined text-lg ${store.showDeaths ? 'text-orange-500' : 'text-outline-variant'}`}>dangerous</span>
                <span className="text-label-md font-label-md text-on-surface font-medium">Fallen Vectors</span>
              </div>
              <input type="checkbox" checked={store.showDeaths} onChange={() => store.toggleLayer('showDeaths')} className="hidden" />
            </label>

            {/* Storm Deaths */}
            <label className={`flex items-center justify-between px-3 py-2 rounded bg-surface-container/60 border ${store.showStormDeaths ? 'border-purple-800/50' : 'border-outline-variant/30'} hover:border-purple-800/50 cursor-pointer transition-all`}>
              <div className="flex items-center space-x-2.5">
                <span className={`material-symbols-outlined text-lg ${store.showStormDeaths ? 'text-purple-500' : 'text-outline-variant'}`}>warning</span>
                <span className="text-label-md font-label-md text-on-surface font-medium">Storm Dissolved</span>
              </div>
              <input type="checkbox" checked={store.showStormDeaths} onChange={() => store.toggleLayer('showStormDeaths')} className="hidden" />
            </label>

            {/* Loot */}
            <label className={`flex items-center justify-between px-3 py-2 rounded bg-surface-container/60 border ${store.showLoot ? 'border-emerald-400/50' : 'border-outline-variant/30'} hover:border-emerald-400/50 cursor-pointer transition-all`}>
              <div className="flex items-center space-x-2.5">
                <span className={`material-symbols-outlined text-lg ${store.showLoot ? 'text-emerald-400' : 'text-outline-variant'}`}>inventory_2</span>
                <span className="text-label-md font-label-md text-on-surface font-medium">Supply Drops</span>
              </div>
              <input type="checkbox" checked={store.showLoot} onChange={() => store.toggleLayer('showLoot')} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
};
