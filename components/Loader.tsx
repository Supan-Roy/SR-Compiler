
import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-slate-500 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="text-lg text-slate-200 font-semibold">Processing...</p>
      </div>
    </div>
  );
};
