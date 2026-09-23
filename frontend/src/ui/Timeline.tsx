import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';

// Animated waveform bars that pulse when playing
const WaveformBars: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => (
  <div className="flex items-end gap-px h-4 shrink-0">
    {[3, 7, 5, 10, 4, 8, 6, 11, 3, 7].map((h, i) => (
      <div
        key={i}
        className="w-0.5 bg-primary-container/70 rounded-full transition-all"
        style={{
          height: isPlaying ? `${h}px` : '2px',
          animation: isPlaying ? `waveform ${0.4 + i * 0.07}s ease-in-out infinite alternate` : 'none',
          transitionDelay: `${i * 30}ms`,
        }}
      />
    ))}
  </div>
);

export const Timeline: React.FC = () => {
  const { currentTime, matchDuration, isPlaying, playbackSpeed, setFilter, selectedMatch } = useStore();
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    if (totalSeconds < 10) {
      const millis = Math.floor((ms % 1000) / 100);
      return `${totalSeconds}.${millis}s`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = maxTime > 0 ? Math.min(100, (currentTime / maxTime) * 100) : 0;

  return (
    <footer className="relative shrink-0 z-40">
      {/* Ambient glow from above */}
      <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-primary-container/5 to-transparent pointer-events-none" />

      <div className="bg-surface-container-lowest border-t border-outline-variant/30 px-6 py-3 shadow-[0_-12px_40px_rgba(0,0,0,0.8)]">
        {/* Top metadata row */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-3">
            <WaveformBars isPlaying={isPlaying} />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-label-sm text-outline uppercase tracking-wider">MATCH REPLAY</span>
              {selectedMatch && (
                <span className="text-[10px] font-label-sm text-primary-container/70 font-mono">
                  {selectedMatch.substring(0, 12)}...
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Duration info */}
            <div className="flex items-center gap-1.5 text-[10px] font-label-sm">
              <span className="text-outline">DURATION</span>
              <span className="text-on-surface font-bold">{formatTime(maxTime)}</span>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-rose-500 animate-pulse' : 'bg-outline'}`} />
              <span className={`text-[10px] font-label-sm ${isPlaying ? 'text-rose-400' : 'text-outline'}`}>
                {isPlaying ? 'REC' : 'PAUSED'}
              </span>
            </div>
          </div>
        </div>

        {/* Main controls row */}
        <div className="flex items-center gap-4 w-full">
          {/* Play/Pause */}
          <button
            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all shrink-0
              ${isPlaying
                ? 'border-rose-500 text-rose-400 hover:bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'border-primary-container text-primary-container hover:bg-primary-container/10 shadow-[0_0_12px_rgba(0,242,254,0.25)] animate-neon-pulse'
              }`}
            onClick={() => setFilter('isPlaying', !isPlaying)}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
          >
            <span className="material-symbols-outlined text-2xl">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Reset */}
          <button
            onClick={() => { setFilter('currentTime', 0); setFilter('isPlaying', false); }}
            className="w-8 h-8 rounded flex items-center justify-center text-outline hover:text-primary-container hover:bg-surface-container transition-all shrink-0"
            aria-label="Reset to beginning"
          >
            <span className="material-symbols-outlined text-lg">skip_previous</span>
          </button>

          {/* Time display */}
          <div className="shrink-0 w-20 text-right">
            <div className="text-base font-bold font-label-md text-on-surface leading-none tracking-wider">
              {formatTime(currentTime)}
            </div>
          </div>

          {/* Scrubber */}
          <div
            className="relative flex-1 h-6 flex items-center cursor-pointer group"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
          >
            {/* Track bg */}
            <div className="absolute inset-x-0 h-1 bg-surface-container-highest rounded-full overflow-hidden">
              {/* Filled portion */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-primary-container rounded-full"
                style={{
                  width: `${progress}%`,
                  boxShadow: progress > 0 ? '0 0 8px rgba(0, 242, 254, 0.6)' : 'none'
                }}
              />
              {/* Ghost shimmer on track */}
              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                  style={{
                    left: `${Math.max(0, progress - 3)}%`,
                    transition: 'left 0.1s linear'
                  }}
                />
              )}
            </div>

            {/* Playhead diamond */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 bg-primary-container pointer-events-none transition-transform group-hover:scale-125 z-10"
              style={{
                left: `calc(${progress}% - 6px)`,
                boxShadow: '0 0 10px rgba(0, 242, 254, 0.8), 0 0 20px rgba(0, 242, 254, 0.4)',
                transition: isDragging ? 'none' : 'left 0.05s linear',
              }}
            />

            {/* Invisible range input on top */}
            <input
              type="range"
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-20 h-full"
              min="0"
              max={maxTime}
              value={currentTime}
              onChange={(e) => setFilter('currentTime', parseInt(e.target.value))}
            />
          </div>

          {/* Total time */}
          <div className="shrink-0 w-20">
            <div className="text-xs font-label-sm text-outline">/ {formatTime(maxTime)}</div>
          </div>

          {/* Speed pills */}
          <div className="flex items-center bg-surface-container rounded-lg p-0.5 gap-0.5 border border-outline-variant/30 shrink-0">
            {[1, 5, 10, 50, 100].map(speed => (
              <button
                key={speed}
                className={`px-2.5 py-1.5 text-xs font-label-md rounded transition-all ${
                  playbackSpeed === speed
                    ? 'bg-primary-container text-background font-bold shadow-[0_0_8px_rgba(0,242,254,0.5)]'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
                onClick={() => setFilter('playbackSpeed', speed)}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
