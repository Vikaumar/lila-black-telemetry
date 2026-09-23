import { useState } from 'react';
import { Sidebar } from './ui/Sidebar';
import { Timeline } from './ui/Timeline';
import { MapComponent } from './deck/MapComponent';
import { BootSplash } from './ui/BootSplash';

function App() {
  const [booted, setBooted] = useState(false);

  return (
    <>
      {!booted && <BootSplash onComplete={() => setBooted(true)} />}
      <div
        className={`flex h-screen w-screen overflow-hidden bg-background text-on-surface font-body-md select-none transition-opacity duration-700 ${booted ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Scan line overlay across entire app */}
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Horizontal scan sweep */}
          <div className="animate-scan-sweep absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-container/30 to-transparent" />
        </div>

        <Sidebar />
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 relative">
            <MapComponent />
          </div>
          <Timeline />
        </div>
      </div>
    </>
  );
}

export default App;
