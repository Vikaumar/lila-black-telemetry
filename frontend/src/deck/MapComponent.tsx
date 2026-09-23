import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { OrthographicView } from '@deck.gl/core';
import { BitmapLayer, ScatterplotLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MAPS } from '../config/maps';
import { useStore } from '../store/useStore';

export const MapComponent: React.FC = () => {
  const {
    selectedMap, selectedMatch,
    showPaths, showEvents,
    showHumans, showBots,
    showKills, showDeaths, showStormDeaths, showLoot,
    heatmapMode,
    currentTime
  } = useStore();
  
  const mapConfig = MAPS[selectedMap];
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState<{
    target: [number, number, number];
    zoom: number;
    minZoom: number;
    maxZoom: number;
  }>({
    target: [mapConfig.originX + mapConfig.scale / 2, mapConfig.originZ + mapConfig.scale / 2, 0],
    zoom: 0,
    minZoom: -2,
    maxZoom: 4
  });

  const { setFilter } = useStore();

  useEffect(() => {
    if (selectedMatch) {
      setLoading(true);
      fetch(`/data/${selectedMatch}.json`)
        .then(res => res.json())
        .then(data => {
          setMatchData(data);
          // Set real match duration in store so Timeline uses it
          setFilter('matchDuration', data.duration || 0);
          setFilter('currentTime', 0);
          setFilter('isPlaying', false);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setMatchData(null);
      setFilter('matchDuration', 0);
    }
  }, [selectedMatch]);

  useEffect(() => {
    // Reset view when map changes
    const newMap = MAPS[selectedMap];
    setViewState(prev => ({
      ...prev,
      target: [newMap.originX + newMap.scale / 2, newMap.originZ + newMap.scale / 2, 0],
      zoom: 0
    }));
  }, [selectedMap]);

  const layers = [];

  // Minimap background
  layers.push(
    new BitmapLayer({
      id: 'minimap',
      image: mapConfig.minimapUrl,
      bounds: [
        mapConfig.originX,
        mapConfig.originZ,
        mapConfig.originX + mapConfig.scale,
        mapConfig.originZ + mapConfig.scale
      ]
    })
  );

  // Heatmap Overlay (Kill Zones, Death Zones, or High-Traffic Areas)
  if (heatmapMode !== 'none' && matchData) {
    let heatmapPoints: { x: number; z: number; weight?: number }[] = [];
    
    if (heatmapMode === 'kills') {
      heatmapPoints = matchData.events
        .filter((e: any) => e.type.includes('Kill'))
        .map((e: any) => ({ x: e.x, z: e.z, weight: 1 }));
    } else if (heatmapMode === 'deaths') {
      heatmapPoints = matchData.events
        .filter((e: any) => e.type === 'Killed' || e.type === 'KilledByStorm')
        .map((e: any) => ({ x: e.x, z: e.z, weight: 1 }));
    } else if (heatmapMode === 'traffic') {
      // Sample points along trails for movement density
      heatmapPoints = matchData.paths.flatMap((p: any) => 
        p.path.filter((_: any, idx: number) => idx % 2 === 0).map(([x, z]: [number, number]) => ({ x, z, weight: 0.5 }))
      );
    }

    if (heatmapPoints.length > 0) {
      layers.push(
        new HeatmapLayer({
          id: 'heatmap-layer',
          data: heatmapPoints,
          getPosition: (d: any) => [d.x, d.z],
          getWeight: (d: any) => d.weight || 1,
          radiusPixels: 50,
          intensity: heatmapMode === 'traffic' ? 0.7 : 1.8,
          threshold: 0.05,
          opacity: 0.7,
        })
      );
    }
  }

  // Trips / Paths
  if (showPaths && matchData) {
    const paths = matchData.paths.filter((p: any) => 
      (p.isBot && showBots) || (!p.isBot && showHumans)
    );
    
    layers.push(
      new TripsLayer({
        id: 'trips',
        data: paths,
        getPath: (d: any) => d.path,
        getTimestamps: (d: any) => d.timestamps,
        getColor: (d: any) => d.isBot ? [143, 158, 114] : [212, 137, 26], // Bot: Olive green, Human: Amber gold
        opacity: 0.85,
        widthMinPixels: 2.5,
        jointRounded: true,
        capRounded: true,
        trailLength: 1500000, // Keep the entire path visible as it draws
        currentTime: currentTime
      })
    );
  }

  // Events — show only events that have occurred by currentTime
  if (showEvents && matchData) {
    const events = matchData.events.filter((e: any) => 
      ((e.isBot && showBots) || (!e.isBot && showHumans)) &&
      ((e.type.includes('Kill') && showKills) || 
       (e.type === 'Killed' && showDeaths) || 
       (e.type === 'KilledByStorm' && showStormDeaths) || 
       (e.type === 'Loot' && showLoot)) &&
       e.ts <= currentTime
    );

    layers.push(
      new ScatterplotLayer({
        id: 'events',
        data: events,
        getPosition: (d: any) => [d.x, d.z],
        getFillColor: (d: any) => {
          if (d.type === 'KilledByStorm') return [156, 143, 122]; // Muted taupe for storm
          if (d.type.includes('Kill'))   return [232, 90, 79];    // Rust red for kills
          if (d.type === 'Loot')         return [80, 180, 130];   // Muted green for loot
          return [200, 120, 60];                                  // Burnt orange for deaths
        },
        getRadius: 12,
        radiusMinPixels: 5,
        radiusMaxPixels: 20,
        opacity: 0.95,
        pickable: true,
        stroked: true,
        getLineColor: [255, 255, 255, 80],
        lineWidthMinPixels: 1
      })
    );
  }

  return (
    <div className="w-full h-full relative">
      <DeckGL
        views={new OrthographicView({ id: 'ortho', flipY: false })}
        viewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        layers={layers}
        controller={true}
        getTooltip={(info: any) => {
          if (!info || !info.object) return null;
          if (info.layer?.id === 'events') {
            const t = Math.floor(info.object.ts / 1000);
            const mins = Math.floor(t / 60);
            const secs = t % 60;
            return {
              html: `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.7;padding:2px 0">
                <div style="color:#D4891A;font-weight:bold;letter-spacing:0.1em;margin-bottom:3px">${info.object.type.toUpperCase()}</div>
                <div style="color:#A09880">Player: <span style="color:#EDE8DC">${info.object.user_id?.substring(0, 12) || 'N/A'}</span></div>
                <div style="color:#A09880">Time: <span style="color:#F5DFA0">${mins}:${secs.toString().padStart(2,'0')}</span></div>
              </div>`,
              style: {
                backgroundColor: 'rgba(20,18,16,0.96)',
                border: '1px solid rgba(90,82,64,0.5)',
                borderRadius: '2px',
                padding: '8px 12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
              }
            };
          }
          return null;
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-30">
          <div className="w-6 h-6 border-2 border-outline border-t-primary-container animate-spin-ring mb-3 rounded-full" />
          <div className="text-[10px] font-label-sm text-outline tracking-widest uppercase">Loading match data</div>
        </div>
      )}

      {/* No match selected state */}
      {!loading && !matchData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-4xl text-outline/30 mb-2">radar</span>
          <div className="text-xs font-label-sm text-outline/40 tracking-widest">SELECT A MATCH TO LOAD TELEMETRY</div>
        </div>
      )}

      {/* Top-left: map name chip */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-surface-container-low/90 border border-outline-variant px-2.5 py-1">
          <span className="material-symbols-outlined text-xs text-primary-container">map</span>
          <span className="text-[10px] font-label-sm text-on-surface-variant tracking-wider uppercase">{selectedMap}</span>
        </div>
      </div>

      {/* Top-right: agent count */}
      <div className="absolute top-3 right-3 pointer-events-none">
        <div className="bg-surface-container-low/90 border border-outline-variant px-2.5 py-1">
          <span className="text-[10px] font-label-sm text-outline tracking-wider uppercase">
            {matchData ? `${matchData.paths?.length || 0} Agents` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
