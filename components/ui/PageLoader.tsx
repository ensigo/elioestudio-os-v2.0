import React from 'react';

interface PageLoaderProps {
  label?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ label }) => (
  <div className="flex flex-col items-center justify-center h-72 gap-4">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
      <div className="absolute inset-0 rounded-full border-4 border-t-elio-yellow border-r-transparent border-b-transparent border-l-transparent animate-spin" />
    </div>
    {label && <p className="text-sm text-slate-400 font-medium">{label}</p>}
  </div>
);
