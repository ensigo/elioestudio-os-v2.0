import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = "", 
  title, 
  action,
  noPadding = false 
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
          {title && <h3 className="font-semibold text-gray-900 text-lg tracking-tight">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
    </div>
  );
};