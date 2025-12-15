import React from 'react';

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ElementType }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`flex space-x-1 bg-gray-100/50 p-1 rounded-lg border border-gray-100 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 sm:flex-none
              ${isActive 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-100' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {Icon && <Icon size={16} className={isActive ? 'text-elio-yellow' : 'text-gray-400'} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};