import React from 'react';
import { useStore } from '../store/useStore';
import TacticalMap from '../components/map/TacticalMap';
import GlassCard from '../components/common/GlassCard';
import { ShieldAlert, Filter } from 'lucide-react';

export const MapPage: React.FC = () => {
  const store = useStore();

  const activeIncidentsCount = store.incidents.filter(i => i.status !== 'resolved').length;
  const activeRespondersCount = store.resources.filter(r => r.deployment_status !== 'idle').length;
  const availableSheltersCount = store.shelters.length;

  return (
    <div className="w-full h-full relative">
      {/* Fullscreen Map */}
      <div className="absolute inset-0 z-0">
        <TacticalMap onDispatchTrigger={(incident) => {
          store.setDispatchIncident(incident);
          store.setCurrentView('dispatch');
        }} />
      </div>

      {/* Floating Header UI */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-none">
        <GlassCard className="p-4 border border-cyan-800/40 pointer-events-auto max-w-[280px]">
          <h1 className="text-sm font-black text-white tracking-wider uppercase flex items-center">
            <ShieldAlert className="w-4 h-4 text-cyan-400 mr-2" />
            Tactical Operations Map
          </h1>
          <p className="text-[10px] text-gray-400 mt-1">
            Real-time digital twin visualization of region operations.
          </p>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800/60 text-center">
            <div>
              <div className="text-xs font-bold text-red-400 font-mono">{activeIncidentsCount}</div>
              <div className="text-[8px] text-gray-500 uppercase font-semibold">Alerts</div>
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 font-mono">{activeRespondersCount}</div>
              <div className="text-[8px] text-gray-500 uppercase font-semibold">En Route</div>
            </div>
            <div>
              <div className="text-xs font-bold text-purple-400 font-mono">{availableSheltersCount}</div>
              <div className="text-[8px] text-gray-500 uppercase font-semibold">Shelters</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Floating Filter Controls */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
        <GlassCard className="p-2 border border-gray-800/80 flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mr-2">Filter map:</span>
          
          <select
            value={store.filters.urgency}
            onChange={(e) => store.setFilter('urgency', e.target.value)}
            className="bg-gray-950 border border-gray-850 text-gray-300 text-[10px] rounded px-2 py-1 focus:outline-none"
          >
            <option value="">All Urgencies</option>
            <option value="critical">Critical Only</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <select
            value={store.filters.type}
            onChange={(e) => store.setFilter('type', e.target.value)}
            className="bg-gray-950 border border-gray-850 text-gray-300 text-[10px] rounded px-2 py-1 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="fire">Fire</option>
            <option value="flood">Flood</option>
            <option value="medical">Medical</option>
            <option value="hazmat">Hazmat</option>
          </select>
        </GlassCard>
      </div>
    </div>
  );
};

export default MapPage;
