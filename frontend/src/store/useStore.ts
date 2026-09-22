import { create } from 'zustand';

export interface FilterState {
  selectedMap: string;
  selectedDate: string;
  selectedMatch: string | null;
  
  // Layers
  showPaths: boolean;
  showEvents: boolean;
  
  // Toggles
  showHumans: boolean;
  showBots: boolean;
  
  // Event types
  showKills: boolean;
  showDeaths: boolean;
  showStormDeaths: boolean;
  showLoot: boolean;
  
  // Heatmap
  heatmapMode: 'none' | 'kills' | 'deaths' | 'traffic';

  // Playback
  currentTime: number;
  matchDuration: number; // real duration from match data (ms)
  isPlaying: boolean;
  playbackSpeed: number;
  
  // Actions
  setFilter: (key: keyof FilterState, value: any) => void;
  toggleLayer: (key: keyof FilterState) => void;
}

export const useStore = create<FilterState>((set) => ({
  selectedMap: 'AmbroseValley',
  selectedDate: '',
  selectedMatch: null,
  
  showPaths: true,
  showEvents: true,
  
  showHumans: true,
  showBots: true,
  
  showKills: true,
  showDeaths: true,
  showStormDeaths: true,
  showLoot: false,
  
  heatmapMode: 'none',
  
  currentTime: 0,
  matchDuration: 0,
  isPlaying: false,
  playbackSpeed: 1,
  
  setFilter: (key, value) => set({ [key]: value }),
  toggleLayer: (key) => set((state) => ({ [key]: !state[key as keyof FilterState] })),
}));
