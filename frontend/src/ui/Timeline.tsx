import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

/* ──────────────────────────────────────────────────────────────
   Waveform activity indicator — only shows "life" when playing
   ────────────────────────────────────────────────────────────── */
const ActivityBars: React.FC<{ active: boolean }> = ({ active }) => (
  <div className="flex items-end gap-px h-3 shrink-0">
    {[4, 9, 5, 11, 3, 8, 6, 10].map((h, i) => (
      <div
        key={i}
        className="w-0.5 bg-primary-container/60 rounded-full transition-all"
        style={{
          height: active ? `${h}px` : '2px',
          animation: active ? `wave-bar ${0.45 + i * 0.06}s ease-in-out infinite alternate` : 'none',
        }}
      />
    ))}
  </div>
);

/* ──────────────────────────────────────────────────────────────
   TIMELINE
   ────────────────────────────────────────────────────────────── */
export const Timeline: React.FC = () => {
  const { currentTime, matchDuration, isPlaying, playbackSpeed, setFilter } = useStore();
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const maxTime = matchDuration > 0 ? matchDuration : 60000;

  const animate = (now: number) => {
    if (lastRef.current !== null) {
      const dt = now - lastRef.current;
      const s = useStore.getState();
      const max = s.matchDuration > 0 ? s.matchDuration : 60000;
      let next = s.currentTime + dt * s.playbackSpeed;
      if (next >= max) {
        next = max;
        setFilter('isPlaying', false);
      }
      setFilter('currentTime', next);
    }
    lastRef.current = now;
    if (useStore.getState().isPlaying) rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = null;
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying]);

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    if (s < 10) return `${s}.${Math.floor((ms % 1000) / 100)}s`;
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const pct = maxTime > 0 ? Math.min(100, (currentTime / maxTime) * 100) : 0;

  return (
    <footer className="shrink-0 z-40 border-t border-outline-variant bg-surface-container-low relative">

      {/* Top accent line when playing */}
      {isPlaying && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-container/40" />
      )}

      <div className="px-5 py-2.5">

        {/* Status row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <ActivityBars active={isPlaying} />
            <span className="text-[9px] font-label-sm text-outline uppercase tracking-widest">
              Match Replay
            </span>
            <span className={`text-[8px] font-label-sm px-1.5 py-px rounded-sm border tracking-wider uppercase
              ${isPlaying
                ? 'text-error border-error/40 bg-error/10'
                : 'text-outline border-outline-variant bg-surface-container'
              }`}>
              {isPlaying ? '● REC' : 'PAUSED'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[9px] font-label-sm">
            <span className="text-outline">Duration: <span className="text-on-surface-variant font-bold">{fmt(maxTime)}</span></span>
            <span className="text-outline">Speed: <span className="text-primary-container font-bold">{playbackSpeed}×</span></span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-4">

          {/* Buttons */}
          <button
            onClick={() => { setFilter('currentTime', 0); setFilter('isPlaying', false); }}
            className="w-7 h-7 flex items-center justify-center text-outline hover:text-on-surface transition-colors shrink-0"
            aria-label="Reset"
          >
            <span className="material-symbols-outlined text-base">skip_previous</span>
          </button>

          <button
            onClick={() => setFilter('isPlaying', !isPlaying)}
            className={`w-9 h-9 flex items-center justify-center border transition-all shrink-0
              ${isPlaying
                ? 'border-error/60 text-error bg-error/10 hover:bg-error/20'
                : 'border-primary-container/60 text-primary-container bg-primary-container/10 hover:bg-primary-container/20'
              }`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="material-symbols-outlined text-xl">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>

          {/* Current time */}
          <div className="shrink-0 w-16 text-right">
            <span className="text-base font-bold font-label-md text-on-surface leading-none">{fmt(currentTime)}</span>
          </div>

          {/* Scrubber */}
          <div className="relative flex-1 flex items-center group h-8">
            {/* Track */}
            <div className="absolute inset-x-0 h-0.5 bg-outline-variant">
              {/* Progress fill */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-primary-container transition-none"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Playhead — a vertical tick, not a diamond */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary-container pointer-events-none transition-none group-hover:h-5"
              style={{ left: `${pct}%` }}
            />

            {/* Invisible range input */}
            <input
              type="range"
              className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              min={0}
              max={maxTime}
              value={currentTime}
              onChange={e => setFilter('currentTime', parseInt(e.target.value))}
            />
          </div>

          {/* Total time */}
          <div className="shrink-0 text-[10px] font-label-sm text-outline">
            / {fmt(maxTime)}
          </div>

          {/* Speed pills */}
          <div className="flex items-center gap-px shrink-0">
            {[1, 5, 10, 50, 100].map(spd => (
              <button
                key={spd}
                onClick={() => setFilter('playbackSpeed', spd)}
                className={`px-2 py-1 text-[10px] font-label-sm transition-all border-y border-l last:border-r
                  ${playbackSpeed === spd
                    ? 'bg-primary-container text-on-primary font-bold border-primary-container'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface border-outline-variant hover:border-outline'
                  }`}
              >
                {spd}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
