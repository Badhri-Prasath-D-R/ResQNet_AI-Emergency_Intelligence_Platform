import React from 'react';
import type { Resource } from '../../store/useStore';
import GlassCard from './GlassCard';
import { Activity, Truck, AlertTriangle } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'idle':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      case 'deployed':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      default:
        return 'bg-amber-950 text-amber-400 border-amber-800';
    }
  };

  const availabilityRate = resource.quantity > 0 ? (resource.availability / resource.quantity) * 100 : 0;
  const isStockLow = resource.availability <= 2;

  return (
    <GlassCard className="p-4 hover:border-gray-700 transition-all duration-300">
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-bold text-white truncate max-w-[150px]">{resource.name}</h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getStatusStyles(resource.deployment_status)}`}>
          {resource.deployment_status}
        </span>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-black text-white">{resource.availability}</span>
          <span className="text-xs text-gray-500 font-medium"> / {resource.quantity} available</span>
        </div>
        
        {isStockLow && resource.availability > 0 && (
          <div className="flex items-center space-x-1 text-amber-500 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Low Stock</span>
          </div>
        )}
        {resource.availability === 0 && (
          <div className="flex items-center space-x-1 text-red-500 font-bold">
            <span className="text-[10px] font-bold uppercase">Depleted</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-950 rounded-full h-1.5 mt-3 overflow-hidden border border-gray-800">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${
            availabilityRate > 50 
              ? 'bg-cyan-500' 
              : availabilityRate > 20 
                ? 'bg-amber-500' 
                : 'bg-red-500'
          }`}
          style={{ width: `${availabilityRate}%` }}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800 border-opacity-50 flex items-center justify-between text-gray-400 text-[10px] font-mono">
        <div className="flex items-center space-x-1">
          <Truck className="w-3.5 h-3.5 text-gray-500" />
          <span className="uppercase">{resource.resource_type.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Activity className="w-3.5 h-3.5 text-gray-500" />
          <span>${resource.cost_per_unit}/unit</span>
        </div>
      </div>
    </GlassCard>
  );
};
export default ResourceCard;
