import React from 'react';
import { useStore } from '../../store/useStore';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const NotificationPanel: React.FC = () => {
  const { alerts, dismissAlert } = useStore();

  const getIcon = (type?: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="fixed top-20 right-5 z-50 w-80 space-y-3 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="pointer-events-auto w-full p-4 glass-panel rounded-lg shadow-2xl border border-[rgba(255,255,255,0.08)] flex gap-3 relative"
          >
            <div className="flex-shrink-0 mt-0.5">{getIcon(alert.type)}</div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-sm font-semibold text-white truncate">{alert.title}</h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{alert.message}</p>
              <span className="text-[10px] text-gray-500 mt-2 block font-mono">{alert.timestamp}</span>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
export default NotificationPanel;
