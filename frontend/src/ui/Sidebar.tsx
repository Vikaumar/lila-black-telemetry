import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { MAPS } from '../config/maps';

/* ──────────────────────────────────────────────────────────────
   Section label — small uppercase overline with a short amber pip
   ────────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-1 h-3 bg-primary-container rounded-sm shrink-0" />
    <span className="text-[9px] font-label-sm text-outline uppercase tracking-[0.2em]">
      {children}
    </span>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Styled select wrapper
   ────────────────────────────────────────────────────────────── */
const SelectField = ({
  value, onChange, children, small,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  small?: boolean;
}) => (
  <div className="relative">
    <select
      className={`w-full appearance-none bg-surface-container-lowest border border-outline-variant
        text-on-surface font-label-sm focus:outline-none cursor-pointer
        pr-7 transition-colors hover:border-outline
        ${small ? 'text-[10px] py-1.5 pl-2.5' : 'text-xs py-2 pl-3'}`}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      {children}
    </select>
    <span className="material-symbols-outlined text-outline absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm">
      expand_more
    </span>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   Layer toggle row
   ────────────────────────────────────────────────────────────── */
interface ToggleRowProps {
  active: boolean;
  onToggle: () => void;
  label: string;
  dotColor: string;   /* Tailwind bg class */
}

const ToggleRow: React.FC<ToggleRowProps> = ({ active, onToggle, label, dotColor }) => (
  <label
    className={`flex items-center justify-between py-1.5 px-2.5 cursor-pointer group transition-colors rounded-sm
      ${active ? 'bg-surface-container-high' : 'hover:bg-surface-container'}`}
  >
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full shrink-0 transition-all ${active ? dotColor : 'bg-surface-container-highest'}`}
      />
      <span className={`text-[11px] font-label-sm transition-colors ${active ? 'text-on-surface' : 'text-outline'}`}>
        {label}
      </span>
    </div>
    {/* Toggle switch */}
    <div className={`toggle-track shrink-0 ${active ? 'on' : ''}`}>
      <div className="toggle-thumb" />
    </div>
    <input type="checkbox" checked={active} onChange={onToggle} className="hidden" />
  </label>
);

/* ──────────────────────────────────────────────────────────────
   MAIN SIDEBAR
   ────────────────────────────────────────────────────────────── */
export const Sidebar: React.FC = () => {
  const store = useStore();
  const [manifest, setManifest] = useState<any>(null);

  const selectedMatchData = manifest?.matches?.find((m: any) => m.match_id === store.selectedMatch);

  useEffect(() => {
    fetch('/data/manifest.json')
      .then(r => r.json())
      .then(data => {
        setManifest(data);
        if (data.matches.length > 0 && !store.selectedMatch) {
          const first = data.matches.find((m: any) => m.map_id === store.selectedMap) || data.matches[0];
          store.setFilter('selectedMatch', first.match_id);
        }
      });
  }, []);

  const dates: string[] = manifest?.dates || [];

  const matchesForMap = (manifest?.matches || []).filter((m: any) => {
    const mapOk = m.map_id === store.selectedMap;
    const dateOk = !store.selectedDate || store.selectedDate === 'all' || m.date === store.selectedDate;
    return mapOk && dateOk;
  });

  const handleMapChange = (val: string) => {
    store.setFilter('selectedMap', val);
    const first = (manifest?.matches || []).find((m: any) => {
      const mapOk = m.map_id === val;
      const dateOk = !store.selectedDate || store.selectedDate === 'all' || m.date === store.selectedDate;
      return mapOk && dateOk;
    });
    if (first) store.setFilter('selectedMatch', first.match_id);
  };

  const handleDateChange = (val: string) => {
    store.setFilter('selectedDate', val);
    const first = (manifest?.matches || []).find((m: any) => {
      const mapOk = m.map_id === store.selectedMap;
      const dateOk = !val || val === 'all' || m.date === val;
      return mapOk && dateOk;
    });
    if (first) store.setFilter('selectedMatch', first.match_id);
  };

  return (
    <aside className="w-72 flex flex-col h-full z-20 shrink-0 border-r border-outline-variant bg-surface-container-low relative">
      {/* Subtle grid backdrop */}
      <div className="absolute inset-0 bg-grid-hud pointer-events-none opacity-60" />

      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-container/80 via-primary-container/20 to-transparent" />

      <div className="relative z-10 flex flex-col h-full">

        {/* ── HEADER ── */}
        <div className="px-4 pt-4 pb-3 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              {/* Diamond logo mark */}
              <div className="w-7 h-7 bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary text-sm">radar</span>
              </div>
              <div>
                <div className="text-[11px] font-label-sm font-bold text-on-surface tracking-[0.12em] uppercase leading-tight">
                  Lila Black
                </div>
                <div className="text-[9px] font-label-sm text-outline tracking-[0.15em] uppercase">
                  Telemetry
                </div>
              </div>
            </div>
            {/* Status: ONLINE */}
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-secondary-container/30 border border-secondary/30 rounded-sm">
              <span className="w-1 h-1 rounded-full bg-secondary animate-status-pulse shrink-0" />
              <span className="text-[8px] font-label-sm text-secondary tracking-widest uppercase">Online</span>
            </div>
          </div>
        </div>

        {/* ── FILTERS ── */}
        <div className="px-3 py-3 border-b border-outline-variant space-y-3">

          {/* Map */}
          <div>
            <SectionLabel>Tactical Map</SectionLabel>
            <SelectField value={store.selectedMap} onChange={handleMapChange}>
              {Object.values(MAPS).map(m => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))}
            </SelectField>
          </div>

          {/* Date */}
          <div>
            <SectionLabel>Session Date</SectionLabel>
            <SelectField value={store.selectedDate || 'all'} onChange={handleDateChange} small>
              <option value="all">All dates  ({manifest?.matches?.length || 0} total)</option>
              {dates.map((d: string) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectField>
          </div>

          {/* Match */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Match Log</SectionLabel>
              <span className="text-[9px] font-label-sm text-outline">{matchesForMap.length} avail.</span>
            </div>
            <SelectField value={store.selectedMatch || ''} onChange={v => store.setFilter('selectedMatch', v)} small>
              {matchesForMap.map((m: any) => (
                <option key={m.match_id} value={m.match_id}>
                  {m.match_id.substring(0, 8)}… ({m.player_count}p, {m.bot_count}b) — {Math.round((m.duration || 0) / 1000)}s
                </option>
              ))}
            </SelectField>
          </div>

          {/* Match stats strip */}
          {selectedMatchData && (
            <div className="flex gap-1.5 pt-0.5">
              {[
                { label: 'PLAYERS', value: selectedMatchData.player_count, color: 'text-primary-container' },
                { label: 'BOTS',    value: selectedMatchData.bot_count,    color: 'text-secondary' },
                { label: 'EVENTS',  value: selectedMatchData.event_count || '—', color: 'text-on-surface-variant' },
              ].map(s => (
                <div key={s.label} className="flex-1 bg-surface-container border border-outline-variant py-1 text-center rounded-sm">
                  <div className={`text-sm font-bold font-label-md leading-none ${s.color}`}>{s.value}</div>
                  <div className="text-[8px] font-label-sm text-outline mt-0.5 tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── LAYERS ── */}
        <div className="flex-1 overflow-y-auto px-3 py-3 custom-scrollbar space-y-4">

          {/* Heatmap */}
          <div>
            <SectionLabel>Heatmap Overlay</SectionLabel>
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'none',    label: 'Off',          icon: 'visibility_off' },
                { id: 'kills',   label: 'Kill Zones',   icon: 'skull' },
                { id: 'deaths',  label: 'Death Zones',  icon: 'dangerous' },
                { id: 'traffic', label: 'Traffic',      icon: 'route' },
              ].map(tab => {
                const on = store.heatmapMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => store.setFilter('heatmapMode', tab.id)}
                    className={`flex items-center gap-1.5 px-2 py-2 text-left text-[10px] font-label-sm transition-all border rounded-sm
                      ${on
                        ? 'bg-primary-container/15 border-primary-container text-primary-container font-bold'
                        : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
                      }`}
                  >
                    <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="tac-divider">
            <span className="text-[9px] font-label-sm text-outline tracking-widest uppercase px-2">Layers</span>
          </div>

          {/* Layer toggles */}
          <div className="space-y-0.5">
            <ToggleRow active={store.showHumans}     onToggle={() => store.toggleLayer('showHumans')}     label="Humans"          dotColor="bg-primary-container" />
            <ToggleRow active={store.showBots}       onToggle={() => store.toggleLayer('showBots')}       label="AI Sentinels"    dotColor="bg-secondary" />
            <ToggleRow active={store.showKills}      onToggle={() => store.toggleLayer('showKills')}      label="Kills"           dotColor="bg-error" />
            <ToggleRow active={store.showDeaths}     onToggle={() => store.toggleLayer('showDeaths')}     label="Fallen Vectors"  dotColor="bg-orange-500" />
            <ToggleRow active={store.showStormDeaths} onToggle={() => store.toggleLayer('showStormDeaths')} label="Storm Deaths"  dotColor="bg-tertiary" />
            <ToggleRow active={store.showLoot}       onToggle={() => store.toggleLayer('showLoot')}       label="Supply Drops"    dotColor="bg-emerald-500" />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="px-3 py-2 border-t border-outline-variant">
          <div className="flex items-center justify-between text-[8px] font-label-sm text-outline/60 uppercase tracking-wider">
            <span>Lila Games Analytics</span>
            <span>v2.0 · 2025</span>
          </div>
        </div>

      </div>
    </aside>
  );
};
