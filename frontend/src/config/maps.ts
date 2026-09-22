export interface MapConfig {
  id: string;
  minimapUrl: string;
  scale: number;
  originX: number;
  originZ: number;
}

export const MAPS: Record<string, MapConfig> = {
  AmbroseValley: {
    id: "AmbroseValley",
    minimapUrl: "/minimaps/AmbroseValley_Minimap.png",
    scale: 900,
    originX: -370,
    originZ: -473
  },
  GrandRift: {
    id: "GrandRift",
    minimapUrl: "/minimaps/GrandRift_Minimap.png",
    scale: 581,
    originX: -290,
    originZ: -290
  },
  Lockdown: {
    id: "Lockdown",
    minimapUrl: "/minimaps/Lockdown_Minimap.jpg",
    scale: 1000,
    originX: -500,
    originZ: -500
  }
};
