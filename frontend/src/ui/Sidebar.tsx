import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { MAPS } from '../config/maps';

// Section header
const SectionHeader = ({ icon, title, badge }: { icon: string; title: string; badge?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-1.5">
      <span className="material-symbols-outlined text-primary-container text-sm">{icon}</span>
      <span className="text-[10px] font-label-sm text-on-surface-variant font-bold uppercase tracking-[0.15em]">
        {title}
      </span>
    </div>
    {badge}
  </div>
);

// Divider with label
const Divider = ({ label }: { label?: string }) => (
  <div className="flex items-center gap-2 my-2">
    <div className="flex-1 h-px bg-outline-variant/20" />
    {label && <span className="text-[9px] font-label-sm text-outline/50 tracking-widest">{label}</span>}
    <div className="flex-1 h-px bg-outline-variant/20" />
  </div>
);

interface LayerToggleProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  icon: string;
  iconColor: string;
  borderColor: string;
}

const LayerToggle: React.FC<LayerToggleProps> = ({ active, onToggle, label, icon, iconColor, borderColor }) => (
  <label
    className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all duration-200
      bg-surface-container-lowest/80
      border ${active ? borderColor : 'border-outline-variant/20'}
      ${active ? 'shadow-[0_0_8px_rgba(0,0,0,0.4)]' : 'hover:border-outline-variant/60'}
      group`}
  >
    <div className="flex items-center gap-2.5">
      <span className={`material-symbols-outlined text-base transition-colors ${active ? iconColor : 'text-outline-variant'}`}>
        {icon}
      </span>
      <span className={`text-xs font-label-md transition-colors ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2">
      {/* Custom toggle switch */}
      <div className={`relative w-8 h-4 rounded-full transition-all duration-300 ${active ? 'bg-primary-container/30 border border-primary-container/60' : 'bg-surface-container-highest border border-outline-variant/30'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${active ? 'left-4 bg-primary-container shadow-[0_0_6px_rgba(0,242,254,0.8)]' : 'left-0.5 bg-outline'}`} />
      </div>
    </div>
    <input type="checkbox" checked={active} onChange={onToggle} className="hidden" />
  </label>
);

export const Sidebar: React.FC = () => {
  const store = useStore();
  const [manifest, setManifest] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  // For selected match stats
  const selectedMatchData = manifest?.matches?.find((m: any) => m.match_id === store.selectedMatch);

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

  const matchesForMap = (manifest?.matches || []).filter((m: any) => {
    const mapMatch = m.map_id === store.selectedMap;
    const dateMatch = !store.selectedDate || store.selectedDate === 'all' || m.date === store.selectedDate;
    return mapMatch && dateMatch;
  });

  const activeLayerCount = [store.showHumans, store.showBots, store.showKills, store.showDeaths, store.showStormDeaths, store.showLoot].filter(Boolean).length;

  return (
    <aside
      className={`${collapsed ? 'w-12' : 'w-80'} transition-all duration-300 bg-surface-container-lowest border-r border-outline-variant/25 flex flex-col h-full z-20 shrink-0 select-none relative overflow-hidden`}
      style={{ boxShadow: '4px 0 32px rgba(0,0,0,0.7)' }}
    >
      {/* Subtle grid backdrop */}
      <div className="absolute inset-0 bg-grid-hud opacity-20 pointer-events-none" />

      {/* Left edge accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-primary-container/50 to-transparent" />

      {collapsed ? (
        /* Collapsed mini rail */
        <div className="flex flex-col items-center py-4 gap-3 relative z-10">
          <button onClick={() => setCollapsed(false)} className="text-outline hover:text-primary-container transition-colors p-1">
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
          <div className="w-0.5 flex-1 bg-outline-variant/20" />
          {[store.showHumans, store.showBots, store.showKills].map((s, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${s ? 'bg-primary-container' : 'bg-outline-variant/40'}`} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-full relative z-10">

          {/* === HEADER === */}
          <div className="px-4 py-3 border-b border-outline-variant/20 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-surface-container border border-primary-container/30 text-primary-container rounded">
                  <span className="material-symbols-outlined text-base">radar</span>
                </div>
                <div>
                  <div className="text-xs font-label-md font-bold text-primary tracking-[0.2em] leading-tight">
                    LILA BLACK
                  </div>
                  <div className="text-[10px] font-label-sm text-primary-container/70 tracking-widest">
                    TELEMETRY // v2.0
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Online ping */}
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[9px] font-label-sm text-emerald-400/70">LIVE</span>
                </div>
                {/* Collapse */}
                <button onClick={() => setCollapsed(true)} className="text-outline/50 hover:text-outline transition-colors">
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
              </div>
            </div>
          </div>

          {/* === SELECTORS === */}
          <div className="px-3 py-3 border-b border-outline-variant/20 space-y-2.5">
            {/* Map */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-label-sm text-outline uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-xs">map</span> Tactical Map
              </label>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-8 py-2 bg-surface-container border border-outline-variant/30 hover:border-primary-container/50 cursor-pointer transition-all text-xs font-label-md text-primary-container font-bold focus:outline-none appearance-none rounded-md"
                  value={store.selectedMap}
                  onChange={e => {
                    store.setFilter('selectedMap', e.target.value);
                    const matches = (manifest?.matches || []).filter((m: any) => {
                      const mapMatch = m.map_id === e.target.value;
                      const dateMatch = !store.selectedDate || store.selectedDate === 'all' || m.date === store.selectedDate;
                      return mapMatch && dateMatch;
                    });
                    if (matches.length > 0) store.setFilter('selectedMatch', matches[0].match_id);
                  }}
                >
                  {Object.values(MAPS).map(m => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-outline absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-label-sm text-outline uppercase tracking-wider mb-1">
                <span className="material-symbols-outlined text-xs">calendar_month</span> Session Date
              </label>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-8 py-2 bg-surface-container border border-outline-variant/30 hover:border-primary-container/50 cursor-pointer transition-all text-xs font-label-sm text-on-surface focus:outline-none appearance-none rounded-md"
                  value={store.selectedDate || 'all'}
                  onChange={e => {
                    const val = e.target.value;
                    store.setFilter('selectedDate', val);
                    const matches = (manifest?.matches || []).filter((m: any) => {
                      const mapMatch = m.map_id === store.selectedMap;
                      const dateMatch = !val || val === 'all' || m.date === val;
                      return mapMatch && dateMatch;
                    });
                    if (matches.length > 0) store.setFilter('selectedMatch', matches[0].match_id);
                  }}
                >
                  <option value="all">All Dates ({manifest?.matches?.length || 0} matches)</option>
                  {dates.map((d: string) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-outline absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            {/* Match */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1 text-[10px] font-label-sm text-outline uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">sports_esports</span> Match Log
                </label>
                <span className="text-[9px] bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/30 font-mono text-outline">
                  {matchesForMap.length} avail.
                </span>
              </div>
              <div className="relative">
                <select
                  className="w-full pl-3 pr-8 py-2 bg-surface-container border border-outline-variant/30 hover:border-primary-container/50 cursor-pointer transition-all text-xs font-label-sm text-on-surface focus:outline-none appearance-none rounded-md"
                  value={store.selectedMatch || ''}
                  onChange={e => store.setFilter('selectedMatch', e.target.value)}
                >
                  {matchesForMap.map((m: any) => (
                    <option key={m.match_id} value={m.match_id}>
                      {m.match_id.substring(0, 8)}... ({m.player_count}p, {m.bot_count}b) — {Math.round((m.duration || 0) / 1000)}s
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-outline absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base">expand_more</span>
              </div>
            </div>

            {/* Selected match stat badges */}
            {selectedMatchData && (
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { label: 'PLAYERS', value: selectedMatchData.player_count, color: 'text-primary-container' },
                  { label: 'BOTS', value: selectedMatchData.bot_count, color: 'text-purple-400' },
                  { label: 'EVENTS', value: (selectedMatchData.event_count || '—'), color: 'text-amber-400' },
                ].map(stat => (
                  <div key={stat.label} className="bg-surface-container rounded p-1.5 text-center border border-outline-variant/20">
                    <div className={`text-sm font-bold font-label-md ${stat.color} leading-none`}>{stat.value}</div>
                    <div className="text-[8px] text-outline font-label-sm mt-0.5 tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === LAYERS & HEATMAP === */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar">

            {/* Heatmap Section */}
            <div>
              <SectionHeader
                icon="local_fire_department"
                title="Heatmap Overlay"
                badge={
                  store.heatmapMode !== 'none' ? (
                    <span className="text-[9px] text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded-full border border-amber-600/30 uppercase font-mono">
                      ● ACTIVE
                    </span>
                  ) : undefined
                }
              />
              <div className="grid grid-cols-2 gap-1">
                {[
                  { id: 'none', label: 'Off', icon: 'visibility_off' },
                  { id: 'kills', label: 'Kill Zones', icon: 'skull' },
                  { id: 'deaths', label: 'Death Zones', icon: 'dangerous' },
                  { id: 'traffic', label: 'Traffic Flow', icon: 'route' },
                ].map(tab => {
                  const active = store.heatmapMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => store.setFilter('heatmapMode', tab.id)}
                      className={`flex items-center gap-1.5 px-2 py-2 rounded text-xs text-left transition-all border ${
                        active
                          ? 'bg-amber-500/15 border-amber-400/60 text-amber-300 font-semibold shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                          : 'bg-surface-container/50 border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50 hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                      <span className="truncate text-[11px]">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Divider label="TELEMETRY LAYERS" />

            {/* Layer count badge */}
            <div className="flex items-center justify-between">
              <SectionHeader icon="layers" title="Active Layers" />
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${activeLayerCount > 0 ? 'text-primary-container border-primary-container/40 bg-primary-container/10' : 'text-outline border-outline-variant/30'}`}>
                {activeLayerCount}/6 ON
              </span>
            </div>

            <div className="space-y-1.5">
              <LayerToggle
                active={store.showHumans}
                onToggle={() => store.toggleLayer('showHumans')}
                label="Humans (Cyan)"
                icon="person"
                iconColor="text-primary-container"
                borderColor="border-primary-container/50"
              />
              <LayerToggle
                active={store.showBots}
                onToggle={() => store.toggleLayer('showBots')}
                label="AI Sentinels (Purple)"
                icon="smart_toy"
                iconColor="text-purple-400"
                borderColor="border-purple-500/50"
              />
              <LayerToggle
                active={store.showKills}
                onToggle={() => store.toggleLayer('showKills')}
                label="Kills (Eliminations)"
                icon="skull"
                iconColor="text-rose-500"
                borderColor="border-rose-500/50"
              />
              <LayerToggle
                active={store.showDeaths}
                onToggle={() => store.toggleLayer('showDeaths')}
                label="Fallen Vectors"
                icon="dangerous"
                iconColor="text-orange-400"
                borderColor="border-orange-500/50"
              />
              <LayerToggle
                active={store.showStormDeaths}
                onToggle={() => store.toggleLayer('showStormDeaths')}
                label="Storm Dissolved"
                icon="thunderstorm"
                iconColor="text-purple-500"
                borderColor="border-purple-800/50"
              />
              <LayerToggle
                active={store.showLoot}
                onToggle={() => store.toggleLayer('showLoot')}
                label="Supply Drops"
                icon="inventory_2"
                iconColor="text-emerald-400"
                borderColor="border-emerald-400/50"
              />
            </div>
          </div>

          {/* === FOOTER === */}
          <div className="px-3 py-2 border-t border-outline-variant/20">
            <div className="flex items-center justify-between text-[9px] font-label-sm text-outline/50">
              <span>LILA GAMES // ANALYTICS</span>
              <span className="font-mono">2025</span>
            </div>
          </div>

        </div>
      )}
    </aside>
  );
};
