import React, { useEffect, useState } from 'react';

const BOOT_LINES = [
  { text: 'LILA BLACK TELEMETRY SYSTEM v2.0', delay: 0 },
  { text: '> Initialising WebGL renderer...', delay: 200 },
  { text: '> Connecting to match archive...', delay: 500 },
  { text: '> Loading 796 match records...', delay: 900 },
  { text: '> Authenticating sector credentials...', delay: 1300 },
  { text: '> Calibrating map projection matrices...', delay: 1700 },
  { text: '> SYSTEM ONLINE — ENTERING TELEMETRY', delay: 2100 },
];

interface BootSplashProps {
  onComplete: () => void;
}

export const BootSplash: React.FC<BootSplashProps> = ({ onComplete }) => {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, idx) => {
      timers.push(setTimeout(() => {
        setVisibleLines(prev => [...prev, idx]);
      }, line.delay));
    });

    // Start exit after last line
    timers.push(setTimeout(() => {
      setExiting(true);
    }, 2900));

    // Complete after fade
    timers.push(setTimeout(() => {
      onComplete();
    }, 3500));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] boot-splash flex flex-col items-center justify-center transition-opacity duration-500 ${exiting ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-hud opacity-40 pointer-events-none" />

      {/* Corner brackets */}
      <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-primary-container/60" />
      <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-primary-container/60" />
      <div className="absolute bottom-8 left-8 w-10 h-10 border-b-2 border-l-2 border-primary-container/60" />
      <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-primary-container/60" />

      {/* Central panel */}
      <div className="w-full max-w-2xl px-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-primary-container font-label-sm tracking-[0.5em] text-xs mb-1 opacity-60">LILA GAMES // PRODUCT ENGINEERING</div>
          <div className="text-primary text-4xl font-headline-lg font-bold tracking-[0.15em] text-glow-cyan animate-flicker-in">
            LILA BLACK
          </div>
          <div className="text-primary-container font-label-md tracking-[0.4em] text-sm mt-1">
            TELEMETRY VISUALIZATION SYSTEM
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary-container/60 to-transparent mb-6" />

        {/* Boot lines */}
        <div className="font-label-sm text-sm space-y-1.5 min-h-[180px]">
          {BOOT_LINES.map((line, idx) => (
            <div
              key={idx}
              className={`transition-all duration-300 ${visibleLines.includes(idx) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            >
              <span className={idx === BOOT_LINES.length - 1 ? 'text-primary-container text-glow-cyan font-bold' : 'text-on-surface-variant'}>
                {line.text}
              </span>
              {idx === visibleLines[visibleLines.length - 1] && idx < BOOT_LINES.length - 1 && (
                <span className="text-primary-container animate-blink-cursor ml-0.5">_</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-px bg-surface-container-highest overflow-hidden rounded-full">
            <div
              className="h-full bg-primary-container transition-all ease-linear shadow-[0_0_8px_rgba(0,242,254,0.6)]"
              style={{
                width: `${Math.min(100, (visibleLines.length / BOOT_LINES.length) * 100)}%`,
                transitionDuration: '400ms'
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-outline text-[10px] font-label-sm">
            <span>BOOT SEQUENCE</span>
            <span>{Math.round((visibleLines.length / BOOT_LINES.length) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2 text-[10px] font-label-sm text-outline/60">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping" />
          <span>SYS // ARCHIVE NODE ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
