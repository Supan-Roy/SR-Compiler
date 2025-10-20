import React from 'react';
import type { Language } from '../types';
import { LANGUAGES } from '../constants';
import { Icon } from './Icon';

interface HeaderProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onRunCode: () => void;
  onFormatCode: () => void;
  onClearCode: () => void;
  onShowSettings: () => void;
  onDownload: () => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isRunLoading: boolean;
  isFormatLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLanguage,
  onLanguageChange,
  onRunCode,
  onFormatCode,
  onClearCode,
  onShowSettings,
  onDownload,
  onUpload,
  isRunLoading,
  isFormatLoading,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isAnyLoading = isRunLoading || isFormatLoading;

  const handleSelectLanguage = (lang: Language) => {
    onLanguageChange(lang);
    setIsDropdownOpen(false);
  };

  React.useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const commonButtonClass = "flex items-center gap-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium";
  const secondaryButtonClass = "bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200";

  return (
    <header className="bg-slate-100 dark:bg-slate-800 p-2 md:p-3 flex items-center justify-between shadow-md z-30 border-b border-slate-200 dark:border-slate-700 relative">
      <div className="flex items-center gap-2">
        <Icon type="logo" className="w-8 h-8"/>
        <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-cyan-700 dark:from-cyan-400 dark:to-cyan-600 bg-clip-text text-transparent hidden sm:block">SR Compiler</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isAnyLoading}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600`}
          >
            {selectedLanguage.name}
            <Icon
              type="chevronDown"
              className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              strokeWidth="1.5"
            />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full mt-2 left-0 bg-slate-100 dark:bg-slate-700 rounded-md shadow-lg w-40 z-50 border border-slate-200 dark:border-slate-600">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang)}
                  className="w-full text-left px-4 py-2 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* File Management */}
        <button title="Download code" onClick={onDownload} disabled={isAnyLoading} className={`${commonButtonClass} ${secondaryButtonClass} p-2`}>
          <Icon type="download" className="w-5 h-5" />
        </button>
        <input type="file" ref={fileInputRef} onChange={onUpload} className="hidden" />
        <button title="Upload file" onClick={() => fileInputRef.current?.click()} disabled={isAnyLoading} className={`${commonButtonClass} ${secondaryButtonClass} p-2`}>
          <Icon type="upload" className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button title="Settings" onClick={onShowSettings} disabled={isAnyLoading} className={`${commonButtonClass} ${secondaryButtonClass} p-2`}>
          <Icon type="settings" className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>

        {/* Core Actions */}
        <button onClick={onFormatCode} disabled={isAnyLoading} className={`${commonButtonClass} ${secondaryButtonClass} px-3 sm:px-4 py-2`}>
          {isFormatLoading ? <Icon type="spinner" className="w-5 h-5 animate-spin" /> : <Icon type="format" className="w-5 h-5" />}
          <span className="hidden sm:inline">{isFormatLoading ? 'Formatting...' : 'Format'}</span>
        </button>
        <button onClick={onClearCode} disabled={isAnyLoading} className={`${commonButtonClass} bg-red-800/10 hover:bg-red-700/20 dark:bg-red-800/50 dark:hover:bg-red-700/60 text-red-600 dark:text-red-200 px-3 sm:px-4 py-2`}>
          <Icon type="clear" className="w-5 h-5" />
           <span className="hidden sm:inline">Clear</span>
        </button>
        <button onClick={onRunCode} disabled={isAnyLoading} className={`${commonButtonClass} bg-green-600 hover:bg-green-500 text-white px-3 sm:px-4 py-2`}>
          {isRunLoading ? <Icon type="spinner" className="w-5 h-5 animate-spin" /> : <Icon type="run" className="w-5 h-5" />}
          <span className="hidden sm:inline font-semibold">{isRunLoading ? 'Running...' : 'Run'}</span>
        </button>
      </div>
    </header>
  );
};