import { useEffect, useState } from 'react';
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
      fetch(`/data/${selectedMatch}.json`)
        .then(res => res.json())
        .then(data => {
          setMatchData(data);
          // Set real match duration in store so Timeline uses it
          setFilter('matchDuration', data.duration || 0);
          setFilter('currentTime', 0);
          setFilter('isPlaying', false);
        })
        .catch(err => console.error(err));
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
        getRadius: 10,
        radiusMinPixels: 4,
        radiusMaxPixels: 16,
        opacity: 0.9,
        pickable: true
      })
    );
  }

  return (
    <DeckGL
      views={new OrthographicView({ id: 'ortho', flipY: false })}
      viewState={viewState}
      onViewStateChange={(e: any) => setViewState(e.viewState)}
      layers={layers}
      controller={true}
      getTooltip={(info: any) => {
        if (!info || !info.object) return null;
        if (info.layer?.id === 'events') {
          return `${info.object.type}\nPlayer: ${info.object.user_id}\nTime: ${Math.floor(info.object.ts / 1000)}s`;
        }
        return null;
      }}
    />
  );
};
