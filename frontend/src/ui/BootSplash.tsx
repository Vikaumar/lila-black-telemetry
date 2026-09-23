import React, { useEffect, useState } from 'react';

const BOOT_LINES = [
  { text: 'LILA BLACK TELEMETRY SYSTEM — FIELD EDITION', delay: 0, accent: true },
  { text: '  Mounting archive node...', delay: 250 },
  { text: '  Loading match database: 796 records found', delay: 550 },
  { text: '  Calibrating orthographic projection...', delay: 900 },
  { text: '  Linking sector data: AmbroseValley · GrandRift · Lockdown', delay: 1200 },
  { text: '  Warping replay engine to current timestamp...', delay: 1550 },
  { text: '  — SYSTEM READY —', delay: 1900, accent: true },
];

interface Props {
  onComplete: () => void;
}

export const BootSplash: React.FC<Props> = ({ onComplete }) => {
  const [visible, setVisible] = useState<number[]>([]);
  const [out, setOut] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((l, i) => {
      timers.push(setTimeout(() => setVisible(p => [...p, i]), l.delay));
    });

    timers.push(setTimeout(() => setOut(true), 2600));
    timers.push(setTimeout(() => onComplete(), 3200));

    return () => timers.forEach(clearTimeout);
  }, []);

  const progress = (visible.length / BOOT_LINES.length) * 100;

  return (
    <div
      className={`fixed inset-0 z-[9999] boot-bg flex flex-col items-center justify-center transition-opacity duration-500 ${out ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid-hud opacity-50 pointer-events-none" />

      {/* Corner marks — simple right-angle lines */}
      {[
        'top-6 left-6 border-t border-l',
        'top-6 right-6 border-t border-r',
        'bottom-6 left-6 border-b border-l',
        'bottom-6 right-6 border-b border-r',
      ].map((cls, i) => (
        <div
          key={i}
          className={`absolute w-8 h-8 ${cls} border-outline`}
        />
      ))}

      {/* Central content */}
      <div className="w-full max-w-xl px-8 animate-fade-in">

        {/* Logo block */}
        <div className="mb-10">
          <div className="text-[10px] font-label-sm text-outline uppercase tracking-[0.3em] mb-2">
            LILA GAMES PRODUCT ANALYTICS
          </div>
          <div className="text-3xl font-headline-lg font-bold text-on-surface tracking-tight leading-none mb-1">
            LILA BLACK
          </div>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-primary-container opacity-60" />
            <span className="text-[11px] font-label-sm text-primary-container tracking-[0.25em] uppercase">
              TELEMETRY
            </span>
            <div className="h-px flex-1 bg-primary-container opacity-60" />
          </div>
        </div>

        {/* Boot lines */}
        <div className="space-y-1 mb-8 font-label-sm text-[11px] min-h-[140px]">
          {BOOT_LINES.map((line, idx) => (
            <div
              key={idx}
              className={`transition-all duration-300 ${visible.includes(idx) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} ${line.accent ? 'text-primary-container font-bold tracking-wider' : 'text-on-surface-variant'}`}
              style={{ transitionDelay: '0ms' }}
            >
              {line.text}
              {idx === visible[visible.length - 1] && !line.accent && (
                <span className="text-primary-container animate-blink ml-0.5">█</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress */}
        <div>
          <div className="h-0.5 bg-outline-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container transition-all duration-400 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5">
            <span className="text-[9px] font-label-sm text-outline tracking-wider uppercase">Boot sequence</span>
            <span className="text-[9px] font-label-sm text-outline font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="absolute bottom-5 flex items-center gap-2 text-[9px] font-label-sm text-outline">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-status-pulse" />
        <span className="tracking-widest uppercase">Archive node active</span>
      </div>
    </div>
  );
};
