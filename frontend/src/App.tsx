import { Sidebar } from './ui/Sidebar';
import { Timeline } from './ui/Timeline';
import { MapComponent } from './deck/MapComponent';

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-on-surface font-body-md select-none">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 relative">
          <MapComponent />
        </div>
        <Timeline />
      </div>
    </div>
  );
}

export default App;
