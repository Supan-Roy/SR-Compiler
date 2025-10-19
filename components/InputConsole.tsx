import React from 'react';
import { Icon } from './Icon';

interface InputConsoleProps {
  input: string;
  onInputChange: (newInput: string) => void;
  fontSize: string;
}

export const InputConsole: React.FC<InputConsoleProps> = ({ input, onInputChange, fontSize }) => {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner flex-grow flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-slate-200/50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
        <Icon type="input" className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Input (stdin)</h2>
      </div>
      <textarea
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        className={`w-full flex-grow p-4 bg-transparent text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono resize-none focus:outline-none leading-relaxed ${fontSize}`}
        placeholder="Enter standard input for your program here..."
        spellCheck="false"
      />
    </div>
  );
};
