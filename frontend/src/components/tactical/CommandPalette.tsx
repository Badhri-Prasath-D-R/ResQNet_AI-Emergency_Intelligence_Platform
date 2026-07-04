import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Search, Terminal, HelpCircle, SunMoon } from 'lucide-react';
import GlassCard from '../common/GlassCard';

export const CommandPalette: React.FC = () => {
  const { paletteOpen, setPaletteOpen, incidents, toggleTheme, setFilter } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [paletteOpen]);

  if (!paletteOpen) return null;

  const actions = [
    {
      name: 'Toggle Dark / Light Theme',
      icon: <SunMoon className="w-4 h-4 text-cyan-400" />,
      perform: () => {
        toggleTheme();
        setPaletteOpen(false);
      }
    },
    {
      name: 'Filter Urgency: Critical',
      icon: <Terminal className="w-4 h-4 text-rose-500" />,
      perform: () => {
        setFilter('urgency', 'critical');
        setPaletteOpen(false);
      }
    },
    {
      name: 'Reset Filters',
      icon: <Terminal className="w-4 h-4 text-gray-400" />,
      perform: () => {
        setFilter('urgency', '');
        setFilter('type', '');
        setFilter('status', '');
        setPaletteOpen(false);
      }
    }
  ];

  const filteredIncidents = incidents
    .filter(inc => inc.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4);

  const filteredActions = actions.filter(act => act.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-blur-sm pt-[15vh] px-4">
      <div className="w-full max-w-xl">
        <GlassCard className="p-4 border border-cyan-800 shadow-2xl overflow-hidden max-h-[60vh] flex flex-col">
          <div className="flex items-center space-x-3 border-b border-gray-800 pb-3">
            <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search EOC platform commands, incidents..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none font-medium"
            />
            <span className="text-[10px] text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded font-mono">
              ESC
            </span>
          </div>

          <div className="overflow-y-auto mt-3 flex-1 pr-1 space-y-4">
            {/* System Actions */}
            {filteredActions.length > 0 && (
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
                  Tactical Operations
                </span>
                <div className="space-y-1">
                  {filteredActions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={act.perform}
                      className="w-full text-left p-2.5 hover:bg-cyan-950/40 rounded-lg flex items-center space-x-3 text-xs text-white transition-colors"
                    >
                      {act.icon}
                      <span className="font-semibold">{act.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Incidents Search */}
            {filteredIncidents.length > 0 && (
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block mb-1">
                  Operational Incidents
                </span>
                <div className="space-y-1">
                  {filteredIncidents.map((inc) => (
                    <button
                      key={inc._id}
                      onClick={() => {
                        useStore.getState().setActiveIncident(inc);
                        setPaletteOpen(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-cyan-950/40 rounded-lg flex flex-col text-xs text-white transition-colors border border-transparent hover:border-cyan-950"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-200">{inc.title}</span>
                        <span className="text-[9px] text-cyan-400 uppercase font-mono">{inc.urgency}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{inc.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredActions.length === 0 && filteredIncidents.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-500 flex flex-col items-center">
                <HelpCircle className="w-8 h-8 text-gray-600 mb-2" />
                <span>No results matched query command.</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
export default CommandPalette;
