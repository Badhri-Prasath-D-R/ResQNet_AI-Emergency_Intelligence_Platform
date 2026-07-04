import React from 'react';
import { useStore } from '../../store/useStore';
import type { Incident } from '../../store/useStore';
import GlassCard from './GlassCard';
import { Users, ShieldAlert, Award, Clock } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onDispatch?: (incident: Incident) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onDispatch }) => {
  const { activeIncident, setActiveIncident } = useStore();
  const isSelected = activeIncident?._id === incident._id;

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return 'bg-red-950 text-red-400 border-red-800';
      case 'high':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'medium':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
      case 'active':
        return 'bg-red-950 text-red-400 border border-red-800 animate-pulse';
      case 'dispatching':
        return 'bg-cyan-950 text-cyan-400 border border-cyan-800';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const formattedTime = new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <GlassCard
      onClick={() => setActiveIncident(incident)}
      className={`p-4 transition-all duration-300 ${
        isSelected 
          ? 'border-cyan-500 border-opacity-70 bg-cyan-950 bg-opacity-10 shadow-lg shadow-cyan-950/20' 
          : 'hover:border-opacity-30 hover:border-cyan-500'
      }`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getUrgencyStyles(incident.urgency)}`}>
          {incident.urgency}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${getStatusBadge(incident.status)}`}>
          {incident.status}
        </span>
      </div>

      <h3 className="text-base font-bold text-white mt-3 truncate">{incident.title}</h3>
      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{incident.description}</p>
      
      {incident.ai_summary && (
        <div className="mt-3 p-2 bg-gray-950 bg-opacity-40 border border-gray-800 rounded text-[11px] text-cyan-300 italic">
          AI: {incident.ai_summary}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-800 border-opacity-50 text-gray-400">
        <div className="flex items-center space-x-1">
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[11px] font-mono font-medium">{incident.people_affected} affected</span>
        </div>
        <div className="flex items-center space-x-1">
          <ShieldAlert className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[11px] font-mono font-medium">Severity {incident.medical_severity}/10</span>
        </div>
        <div className="flex items-center space-x-1 justify-end">
          <Clock className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[11px] font-mono font-medium">{formattedTime}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 gap-2">
        <div className="flex items-center space-x-1">
          <Award className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] text-gray-400 font-mono">Conf: {(incident.ai_confidence * 100).toFixed(0)}%</span>
        </div>
        
        {onDispatch && incident.status !== 'resolved' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDispatch(incident);
            }}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white rounded text-xs font-bold transition-all"
          >
            Quick Dispatch
          </button>
        )}
      </div>
    </GlassCard>
  );
};
export default IncidentCard;
