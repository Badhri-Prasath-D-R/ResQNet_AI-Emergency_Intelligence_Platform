import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import GlassCard from '../components/common/GlassCard';
import { Search, MapPin, Truck } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const store = useStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredResources = store.resources.filter((res) => {
    const matchesSearch = res.name.toLowerCase().includes(search.toLowerCase()) || 
                          res.resource_type.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === '' || res.resource_type.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === '' || res.deployment_status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">
            Emergency Resource Inventory
          </h1>
          <p className="text-xs text-gray-400">
            Real-time tracking, quantities, and deployment status of EOC assets.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search assets (e.g. Ambulance, Fire Engine)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-600 font-medium"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="ambulance">Ambulance</option>
            <option value="fire_engine">Fire Engine</option>
            <option value="rescue_boat">Rescue Boat</option>
            <option value="rescue_team">Rescue Team</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="idle">Idle / Available</option>
            <option value="en_route">En Route</option>
            <option value="deployed">Deployed</option>
          </select>
        </div>
      </div>

      {/* Table grid */}
      <GlassCard className="overflow-hidden border border-gray-850">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider bg-gray-950 bg-opacity-30">
                <th className="p-4">Resource Info</th>
                <th className="p-4">Category</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Status</th>
                <th className="p-4">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850/40 text-xs font-semibold text-gray-300">
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No resources matched the current filters.
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  const statusColors: Record<string, string> = {
                    idle: 'bg-emerald-950 text-emerald-400 border-emerald-800',
                    en_route: 'bg-cyan-950 text-cyan-400 border-cyan-800',
                    deployed: 'bg-rose-950 text-rose-400 border-rose-800'
                  };
                  const badgeStyle = statusColors[res.deployment_status.toLowerCase()] || 'bg-gray-850 text-gray-400';

                  return (
                    <tr key={res._id} className="hover:bg-gray-900/25 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-950/40 border border-gray-850 rounded-lg">
                            <Truck className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{res.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {res._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 uppercase text-[10px] font-mono tracking-wider text-cyan-400">
                        {res.resource_type.replace('_', ' ')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono text-sm font-black ${res.availability <= 2 ? 'text-red-400' : 'text-white'}`}>
                            {res.availability}
                          </span>
                          <span className="text-gray-600 text-xs">/</span>
                          <span className="text-gray-500 text-xs">{res.quantity}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase rounded font-mono ${badgeStyle}`}>
                          {res.deployment_status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[10px] text-gray-400">
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 text-gray-500 mr-1" />
                          {res.location?.coordinates ? `${res.location.coordinates[1].toFixed(4)}, ${res.location.coordinates[0].toFixed(4)}` : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default ResourcesPage;
