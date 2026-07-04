import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import GlassCard from '../components/common/GlassCard';
import { Search, Clock } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const store = useStore();
  const [search, setSearch] = useState('');

  const filteredLogs = store.dispatchHistory.filter((log) => {
    const term = search.toLowerCase();
    return (
      log.responder_name.toLowerCase().includes(term) ||
      log.resource_type.toLowerCase().includes(term) ||
      log.status.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white uppercase tracking-wider">
          EOC Dispatch & Incident History
        </h1>
        <p className="text-xs text-gray-400">
          Complete dispatch logs, incident assignments, and response timelines.
        </p>
      </div>

      {/* Control bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search dispatch logs (e.g. Responder team name, status)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-600 font-medium"
        />
      </div>

      {/* History table */}
      <GlassCard className="overflow-hidden border border-gray-850">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-[10px] uppercase font-bold text-gray-500 tracking-wider bg-gray-950 bg-opacity-30">
                <th className="p-4">Dispatched Time</th>
                <th className="p-4">Resource Dispatched</th>
                <th className="p-4">Responder Team</th>
                <th className="p-4">Status</th>
                <th className="p-4">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-850/40 text-xs font-semibold text-gray-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No dispatch log history records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const statusColors: Record<string, string> = {
                    en_route: 'bg-cyan-950 text-cyan-400 border-cyan-800',
                    completed: 'bg-emerald-950 text-emerald-400 border-emerald-800',
                    failed: 'bg-rose-950 text-rose-400 border-rose-800'
                  };
                  const badgeStyle = statusColors[log.status.toLowerCase()] || 'bg-gray-850 text-gray-400';

                  return (
                    <tr key={log._id} className="hover:bg-gray-900/25 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-gray-400">
                        <span className="flex items-center">
                          <Clock className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                          {new Date(log.dispatched_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-bold">{log.quantity}x</span>
                          <span className="uppercase text-[10px] font-mono tracking-wider text-cyan-400">
                            {log.resource_type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-200">
                        {log.responder_name}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase rounded font-mono ${badgeStyle}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-cyan-400 text-xs">
                        {log.eta_minutes ? `${log.eta_minutes} mins` : 'N/A'}
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

export default HistoryPage;
