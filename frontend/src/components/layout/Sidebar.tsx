import React from 'react';
import { useStore } from '../../store/useStore';
import {
  LayoutDashboard,
  Map,
  Package,
  ClockArrowUp,
  Settings,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view: 'dashboard' | 'map' | 'resources' | 'dispatch' | 'history' | 'settings';
}

const navItems: NavItem[] = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, view: 'dashboard' },
  { id: 'nav-map', label: 'Tactical Map', icon: <Map className="w-5 h-5" />, view: 'map' },
  { id: 'nav-resources', label: 'Resources', icon: <Package className="w-5 h-5" />, view: 'resources' },
  { id: 'nav-history', label: 'Dispatch Log', icon: <ClockArrowUp className="w-5 h-5" />, view: 'history' },
  { id: 'nav-settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, view: 'settings' },
];

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, username, role, logout } = useStore();

  return (
    <aside className="h-screen w-16 hover:w-56 transition-all duration-300 ease-in-out flex flex-col glass-panel border-r border-gray-800/60 overflow-hidden group flex-shrink-0 z-40">
      {/* Logo */}
      <div className="flex items-center px-4 py-5 space-x-3 border-b border-gray-800/40 flex-shrink-0">
        <ShieldAlert className="w-7 h-7 text-cyan-400 flex-shrink-0" />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
          <div className="text-sm font-black text-white tracking-wider uppercase">ResQNet</div>
          <div className="text-[9px] text-gray-500 font-mono">AI COMMAND CENTER</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => setCurrentView(item.view)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 shadow-sm shadow-cyan-950/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/40 border border-transparent'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-gray-800/40 p-3 flex-shrink-0">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap overflow-hidden">
            <div className="text-xs font-bold text-white">{username}</div>
            <div className="text-[9px] text-cyan-400 font-mono uppercase tracking-wider">{role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-950/30 transition-all duration-200 whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 overflow-hidden">
            Sign Out
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
