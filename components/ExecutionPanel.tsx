import React from 'react';
import type { ExecutionMode } from '../types';
import { InteractiveConsole } from './InteractiveConsole';
import { InputConsole } from './InputConsole';
import { OutputConsole } from './OutputConsole';
import { ExpectedOutputConsole } from './ExpectedOutputConsole';
import { Icon } from './Icon';

interface ExecutionPanelProps {
    mode: ExecutionMode;
    onModeChange: (mode: ExecutionMode) => void;
    // Interactive Props
    history: { type: 'stdout' | 'stdin'; content: string }[];
    isWaitingForInput: boolean;
    onUserInput: (input: string) => void;
    onClearTerminal: () => void;
    // Manual & Competitive Props
    input: string;
    onInputChange: (input: string) => void;
    output: string;
    // Competitive Props
    expectedOutput: string;
    onExpectedOutputChange: (output: string) => void;
    verdict: string | null;
    isLoading: boolean;
    // Common Props
    isError: boolean;
    isSuccess?: boolean;
    fontSize: string;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = (props) => {
    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-shrink-0">
                <select 
                    value={props.mode} 
                    onChange={(e) => props.onModeChange(e.target.value as ExecutionMode)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-slate-200"
                >
                    <option value="interactive">Terminal</option>
                    <option value="manual">Manual Input</option>
                    <option value="competitive">Competitive Companion</option>
                </select>
            </div>
            
            {props.mode === 'interactive' ? (
                <InteractiveConsole 
                    history={props.history}
                    isWaitingForInput={props.isWaitingForInput}
                    onUserInput={props.onUserInput}
                    onClear={props.onClearTerminal}
                    isError={props.isError}
                    fontSize={props.fontSize}
                />
            ) : props.mode === 'manual' ? (
                <div className="flex flex-col gap-4 flex-grow min-h-0">
                   <div className="h-3/5 flex flex-col min-h-0">
                        <InputConsole 
                            input={props.input}
                            onInputChange={props.onInputChange}
                            fontSize={props.fontSize}
                        />
                   </div>
                   <div className="h-2/5 flex flex-col min-h-0">
                        <OutputConsole 
                            output={props.output}
                            isError={props.isError}
                            isSuccess={props.isSuccess}
                            fontSize={props.fontSize}
                        />
                   </div>
                </div>
            ) : ( // Competitive Mode
                (() => {
                    let mainText: string;
                    let iconType: 'spinner' | 'check' | 'cross' | 'terminal' | null = null;
                    let textClass = 'text-slate-400 dark:text-slate-500';
                    let iconClass = 'w-8 h-8';

                    if (props.isLoading) {
                        mainText = 'Running...';
                        iconType = 'spinner';
                        textClass = 'text-slate-600 dark:text-slate-300';
                        iconClass += ' animate-spin';
                    } else if (props.verdict) {
                        mainText = props.verdict;
                        if (props.isSuccess) {
                            iconType = 'check';
                            textClass = 'text-green-500 dark:text-green-400';
                        } else if (props.isError) {
                            iconType = 'cross';
                            textClass = 'text-red-500 dark:text-red-400';
                        }
                    } else {
                        mainText = 'Run to see verdict';
                        iconType = 'terminal';
                    }
                    
                    return (
                        <div className="flex flex-col gap-4 flex-grow min-h-0">
                           {/* Side-by-side Input and Expected Output */}
                           <div className="flex-[2] flex flex-row gap-4 min-h-0">
                               <div className="flex-1 min-h-0 flex flex-col">
                                   <InputConsole 
                                       input={props.input}
                                       onInputChange={props.onInputChange}
                                       fontSize={props.fontSize}
                                   />
                               </div>
                               <div className="flex-1 min-h-0 flex flex-col">
                                   <ExpectedOutputConsole
                                       output={props.expectedOutput}
                                       onOutputChange={props.onExpectedOutputChange}
                                       fontSize={props.fontSize}
                                   />
                               </div>
                           </div>
                           {/* Verdict Area */}
                           <div className="flex-1 min-h-0 flex flex-col">
                               <div className={`bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner flex-grow flex flex-col border border-slate-200 dark:border-slate-700 p-4 ${
                                   !(props.isError && props.output) && 'items-center justify-center'
                               }`}>
                                   <div className={`flex flex-row items-center justify-center gap-4 flex-shrink-0 ${textClass}`}>
                                       {iconType && <Icon type={iconType} className={iconClass} />}
                                       <p className="text-2xl font-bold">{mainText}</p>
                                   </div>
                                   {props.isError && props.output && (
                                       <div className="mt-4 w-full text-left flex-1 min-h-0 flex flex-col">
                                           <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                                               {props.verdict === 'Wrong Answer' ? 'Received Output:' : 'Error:'}
                                           </p>
                                           <div className="relative flex-1 mt-1">
                                                <pre className="absolute inset-0 w-full h-full bg-slate-200 dark:bg-slate-900/50 p-3 rounded-md overflow-y-auto text-xs font-mono text-red-500 dark:text-red-400">
                                                    <code>{props.output}</code>
                                                </pre>
                                           </div>
                                       </div>
                                   )}
                               </div>
                           </div>
                        </div>
                    );
                })()
            )}
        </div>
    );
};