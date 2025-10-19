import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';

interface InteractiveConsoleProps {
  history: { type: 'stdout' | 'stdin'; content: string }[];
  isWaitingForInput: boolean;
  onUserInput: (input: string) => void;
  isError: boolean;
  fontSize: string;
}

export const InteractiveConsole: React.FC<InteractiveConsoleProps> = ({ history, isWaitingForInput, onUserInput, isError, fontSize }) => {
  const [currentInput, setCurrentInput] = useState('');
  const [copyState, setCopyState] = useState<'copy' | 'check'>('copy');
  const endOfHistoryRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<null | HTMLInputElement>(null);

  useEffect(() => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (isWaitingForInput) {
      inputRef.current?.focus();
    }
  }, [isWaitingForInput]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || !isWaitingForInput) return;
    onUserInput(currentInput);
    setCurrentInput('');
  };

  const handleCopy = () => {
    if (history.length === 0) return;
    const historyText = history.map(line => line.type === 'stdin' ? `> ${line.content}` : line.content).join('\n');
    navigator.clipboard.writeText(historyText).then(() => {
      setCopyState('check');
      setTimeout(() => setCopyState('copy'), 1500);
    });
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner flex-grow flex flex-col overflow-hidden h-full border border-slate-200 dark:border-slate-700" onClick={() => inputRef.current?.focus()}>
      <div className="bg-slate-200/50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Icon type="terminal" className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Terminal</h2>
        </div>
        <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
          <Icon type={copyState} className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
      <div className={`flex-grow p-4 font-mono overflow-auto ${fontSize}`}>
        <div className={`whitespace-pre-wrap break-words leading-relaxed ${isError ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
          {history.map((line, index) => (
            <div key={index} style={{minHeight: '20px'}}>
              {line.type === 'stdin' ? (
                <>
                  <span className="text-cyan-600 dark:text-cyan-400 mr-2">&gt;</span>
                  <span>{line.content}</span>
                </>
              ) : (
                <span>{line.content}</span>
              )}
            </div>
          ))}
        </div>
        {isWaitingForInput && (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                className="bg-transparent focus:outline-none text-slate-800 dark:text-slate-200 w-full"
                autoFocus
              />
            </form>
        )}
        <div ref={endOfHistoryRef} />
      </div>
    </div>
  );
};