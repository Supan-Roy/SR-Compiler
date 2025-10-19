import React from 'react';
import type { ExecutionMode } from '../types';
import { InteractiveConsole } from './InteractiveConsole';
import { InputConsole } from './InputConsole';
import { OutputConsole } from './OutputConsole';

interface ExecutionPanelProps {
    mode: ExecutionMode;
    onModeChange: (mode: ExecutionMode) => void;
    // Interactive Props
    history: { type: 'stdout' | 'stdin'; content: string }[];
    isWaitingForInput: boolean;
    onUserInput: (input: string) => void;
    // Manual Props
    input: string;
    onInputChange: (input: string) => void;
    output: string;
    // Common Props
    isError: boolean;
    fontSize: string;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = (props) => {
    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-shrink-0">
                <select 
                    value={props.mode} 
                    onChange={(e) => props.onModeChange(e.target.value as ExecutionMode)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                    <option value="interactive">Terminal</option>
                    <option value="manual">Manual Input</option>
                </select>
            </div>
            
            {props.mode === 'interactive' ? (
                <InteractiveConsole 
                    history={props.history}
                    isWaitingForInput={props.isWaitingForInput}
                    onUserInput={props.onUserInput}
                    isError={props.isError}
                    fontSize={props.fontSize}
                />
            ) : (
                <div className="flex flex-col gap-4 flex-grow min-h-0">
                   <div className="flex-1 min-h-0">
                        <InputConsole 
                            input={props.input}
                            onInputChange={props.onInputChange}
                            fontSize={props.fontSize}
                        />
                   </div>
                   <div className="flex-1 min-h-0">
                        <OutputConsole 
                            output={props.output}
                            isError={props.isError}
                            fontSize={props.fontSize}
                        />
                   </div>
                </div>
            )}
        </div>
    );
};