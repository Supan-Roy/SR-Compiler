import React, { useState } from 'react';
import { Icon } from './Icon';

interface OutputConsoleProps {
  output: string;
  isError: boolean;
  fontSize: string;
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({ output, isError, fontSize }) => {
  const [copyState, setCopyState] = useState<'copy' | 'check'>('copy');

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopyState('check');
      setTimeout(() => setCopyState('copy'), 1500);
    });
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner flex-grow flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-slate-200/50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Icon type="terminal" className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Output Console</h2>
         </div>
         <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
          <Icon type={copyState} className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
      <pre
        className={`w-full flex-grow p-4 font-mono leading-relaxed overflow-auto whitespace-pre-wrap break-words ${fontSize} ${
          isError ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'
        }`}
      >
        {/* FIX: Corrected invalid JSX syntax from `code>{output}</code>` to `<code>{output}</code>`. This also resolves the subsequent parser error. */}
        {output ? <code>{output}</code> : <span className="text-slate-400 dark:text-slate-500">Output will be displayed here...</span>}
      </pre>
    </div>
  );
};
