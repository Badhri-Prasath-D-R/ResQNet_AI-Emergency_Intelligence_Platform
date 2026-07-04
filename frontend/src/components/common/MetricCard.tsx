import React from 'react';
import GlassCard from './GlassCard';
import AnimatedCounter from './AnimatedCounter';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  decimals?: number;
  suffix?: string;
  glow?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  decimals = 0,
  suffix = '',
  glow = false
}) => {
  return (
    <GlassCard className={`p-5 flex items-center justify-between ${glow ? 'pulse-neon-cyan' : ''}`}>
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
          {title}
        </span>
        <div className="text-3xl font-extrabold text-white">
          <AnimatedCounter value={value} decimals={decimals} suffix={suffix} />
        </div>
        {description && (
          <p className="text-xs text-gray-500 font-medium">{description}</p>
        )}
        {trend && (
          <div className="flex items-center space-x-1 mt-1">
            <span className={`text-xs font-bold ${trend.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend.value}
            </span>
            <span className="text-xs text-gray-500">vs last hour</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-cyan-950 bg-opacity-30 rounded-lg text-cyan-400 border border-cyan-800 border-opacity-30">
        {icon}
      </div>
    </GlassCard>
  );
};
export default MetricCard;
