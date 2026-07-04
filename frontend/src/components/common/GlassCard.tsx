import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        glass-panel 
        rounded-xl 
        border 
        border-[rgba(255,255,255,0.08)] 
        bg-opacity-40 
        transition-all 
        duration-300 
        ${hoverEffect ? 'glass-card-hover cursor-pointer' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};
export default GlassCard;
