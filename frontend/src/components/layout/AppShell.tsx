import React from 'react';
import Sidebar from './Sidebar';
import { CommandPalette } from '../tactical/CommandPalette';
import { NotificationPanel } from '../common/NotificationPanel';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#030712] text-gray-100 font-sans">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto min-h-0 relative">
          {children}
        </div>
      </main>

      {/* Overlay components (mounted at shell root to avoid Leaflet z-index issues) */}
      <CommandPalette />
      <NotificationPanel />
    </div>
  );
};

export default AppShell;
