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
        getColor: (d: any) => d.isBot ? [168, 85, 247] : [0, 242, 254], // Bot: Purple, Human: Cyan
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
          if (d.type === 'KilledByStorm') return [168, 85, 247]; // Purple
          if (d.type.includes('Kill')) return [244, 63, 94];     // Rose / Red
          if (d.type === 'Loot') return [52, 211, 153];           // Emerald green
          return [249, 115, 22];                                 // Orange for Killed
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
              html: `<div style="font-family:monospace;font-size:11px;line-height:1.6;padding:2px 0">
                <div style="color:#00f2fe;font-weight:bold;margin-bottom:2px">${info.object.type.toUpperCase()}</div>
                <div style="color:#aab8c2">Player: <span style="color:#e8fbff">${info.object.user_id?.substring(0, 10) || 'N/A'}</span></div>
                <div style="color:#aab8c2">Time: <span style="color:#ffcf90">${mins}:${secs.toString().padStart(2,'0')}</span></div>
              </div>`,
              style: {
                backgroundColor: 'rgba(14,18,28,0.95)',
                border: '1px solid rgba(0,242,254,0.3)',
                borderRadius: '6px',
                padding: '8px 12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 12px rgba(0,242,254,0.1)',
              }
            };
          }
          return null;
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-30">
          <div className="w-8 h-8 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin mb-3" />
          <div className="text-xs font-label-sm text-primary-container/70 tracking-widest">LOADING MATCH DATA...</div>
        </div>
      )}

      {/* No match selected state */}
      {!loading && !matchData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="material-symbols-outlined text-4xl text-outline/30 mb-2">radar</span>
          <div className="text-xs font-label-sm text-outline/40 tracking-widest">SELECT A MATCH TO LOAD TELEMETRY</div>
        </div>
      )}

      {/* Corner HUD overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/30 rounded px-2 py-1">
          <span className="material-symbols-outlined text-xs text-primary-container">map</span>
          <span className="text-[10px] font-label-sm text-primary-container/80 tracking-wider">{selectedMap.toUpperCase()}</span>
        </div>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none">
        <div className="bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/30 rounded px-2 py-1">
          <span className="text-[10px] font-label-sm text-outline tracking-wider">
            {matchData ? `${matchData.paths?.length || 0} AGENTS` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
