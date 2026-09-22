import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export const Timeline: React.FC = () => {
  const { currentTime, matchDuration, isPlaying, playbackSpeed, setFilter } = useStore();
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Use actual match duration, with a sensible minimum fallback
  const maxTime = matchDuration > 0 ? matchDuration : 60000;

  const animate = (time: number) => {
    if (lastTimeRef.current !== null) {
      const deltaTime = time - lastTimeRef.current;
      const currentState = useStore.getState();
      const maxT = currentState.matchDuration > 0 ? currentState.matchDuration : 60000;
      let newTime = currentState.currentTime + deltaTime * currentState.playbackSpeed;
      
      // Stop at match end
      if (newTime >= maxT) {
        newTime = maxT;
        setFilter('isPlaying', false);
      }
      
      setFilter('currentTime', newTime);
    }
    lastTimeRef.current = time;
    
    if (useStore.getState().isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((ms % 1000) / 100); // 1 decimal place
    if (totalSeconds < 10) {
      // Show ms for short matches
      return `${totalSeconds}.${millis}s`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = maxTime > 0 ? Math.min(100, (currentTime / maxTime) * 100) : 0;

  return (
    <footer className="h-24 bg-surface-container-low/95 backdrop-blur-2xl border-t border-outline-variant/40 px-space-lg flex flex-col justify-center relative z-40 shrink-0 shadow-[0_-8px_32px_rgba(0,0,0,0.65)] text-on-surface">
      <div className="flex items-center justify-between max-w-7xl mx-auto w-full px-6 gap-6">
        
        {/* Play/Pause Button */}
        <div className="flex items-center shrink-0">
          <button 
            className="w-12 h-12 rounded-full border-2 border-primary-container flex items-center justify-center text-primary-container hover:bg-primary-container/10 transition-colors shadow-[0_0_12px_rgba(0,242,254,0.3)]"
            onClick={() => setFilter('isPlaying', !isPlaying)}
          >
            <span className="material-symbols-outlined text-3xl">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>

        {/* Speed & Scrub Controls */}
        <div className="flex items-center space-x-6 flex-1 px-4">
          {/* Current / Total time */}
          <div className="flex flex-col items-end shrink-0 w-28">
            <span className="font-telemetry-num text-on-surface tracking-wider font-bold text-lg leading-none">
              {formatTime(currentTime)}
            </span>
            <span className="text-outline text-xs mt-0.5 font-label-sm">/ {formatTime(maxTime)}</span>
          </div>

          <div className="relative w-full h-1.5 bg-surface-container-highest flex items-center cursor-pointer group rounded-sm">
            <input
              type="range"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              min="0"
              max={maxTime}
              value={currentTime}
              onChange={(e) => setFilter('currentTime', parseInt(e.target.value))}
            />
            
            {/* Filled Track */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-primary-container shadow-[0_0_8px_rgba(0,242,254,0.5)] rounded-sm pointer-events-none" 
              style={{ width: `${progress}%` }}
            ></div>
            
            {/* Playhead Marker (Diamond) */}
            <div 
               className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary-container shadow-[0_0_12px_#00f2fe] pointer-events-none rotate-45 transition-transform duration-200 group-hover:scale-125 z-10"
               style={{ left: `calc(${progress}% - 6px)` }}
            ></div>
          </div>
          
          <button onClick={() => { setFilter('currentTime', 0); setFilter('isPlaying', false); }} className="text-outline hover:text-primary transition-colors text-label-md font-label-md shrink-0 px-2 py-1">
            RESET
          </button>
        </div>

        {/* Speed Selector Pills */}
        <div className="flex items-center bg-surface-container-highest rounded-lg p-1 space-x-1 border border-outline-variant/50 shrink-0">
          {[1, 5, 10, 50, 100].map(speed => (
            <button
              key={speed}
              className={`px-3 py-1.5 text-label-md font-label-md rounded-md transition-colors ${playbackSpeed === speed ? 'bg-primary-container text-on-primary font-bold shadow-[0_0_8px_rgba(0,242,254,0.4)]' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
              onClick={() => setFilter('playbackSpeed', speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
};
