import React, { useState } from 'react';
import type { Language } from '../types';
import { LANGUAGES } from '../constants';
import { Icon } from './Icon';

interface HeaderProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  onRunCode: () => void;
  onFormatCode: () => void;
  onClearCode: () => void;
  onFontSizeChange: () => void;
  isRunLoading: boolean;
  isFormatLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedLanguage,
  onLanguageChange,
  onRunCode,
  onFormatCode,
  onClearCode,
  onFontSizeChange,
  isRunLoading,
  isFormatLoading,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isAnyLoading = isRunLoading || isFormatLoading;

  const handleSelectLanguage = (lang: Language) => {
    onLanguageChange(lang);
    setIsDropdownOpen(false);
  };

  const commonButtonClass = "flex items-center gap-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium";

  return (
    <header className="bg-slate-800 p-2 md:p-3 flex items-center justify-between shadow-md z-10 border-b border-slate-700">
      <div className="flex items-center gap-2">
        <Icon type="logo" className="w-8 h-8 text-cyan-500"/>
        <h1 className="text-xl font-bold text-slate-100 hidden sm:block">SR Compiler</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isAnyLoading}
            className="bg-slate-700 hover:bg-slate-600 px-3 sm:px-4 py-2 rounded-md flex items-center gap-2 text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedLanguage.name}
            <Icon type="chevronDown" className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 bg-slate-700 rounded-md shadow-lg w-40 z-20 border border-slate-600">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => handleSelectLanguage(lang)}
                  className="w-full text-left px-4 py-2 hover:bg-slate-600"
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <button title="Change font size" onClick={onFontSizeChange} disabled={isAnyLoading} className={`${commonButtonClass} bg-slate-700 hover:bg-slate-600 p-2`}>
          <Icon type="fontSize" className="w-5 h-5" />
        </button>

        <button onClick={onFormatCode} disabled={isAnyLoading} className={`${commonButtonClass} bg-slate-700 hover:bg-slate-600 px-3 sm:px-4 py-2`}>
          {isFormatLoading ? (
            <Icon type="spinner" className="w-5 h-5 animate-spin" />
          ) : (
            <Icon type="format" className="w-5 h-5" />
          )}
          <span className="hidden sm:inline">{isFormatLoading ? 'Formatting...' : 'Format'}</span>
        </button>

         <button onClick={onClearCode} disabled={isAnyLoading} className={`${commonButtonClass} bg-red-800/50 hover:bg-red-700/60 text-red-200 px-3 sm:px-4 py-2`}>
          <Icon type="clear" className="w-5 h-5" />
           <span className="hidden sm:inline">Clear</span>
        </button>

        <button onClick={onRunCode} disabled={isAnyLoading} className={`${commonButtonClass} bg-green-600 hover:bg-green-500 text-white px-3 sm:px-4 py-2`}>
          {isRunLoading ? (
            <Icon type="spinner" className="w-5 h-5 animate-spin" />
          ) : (
            <Icon type="run" className="w-5 h-5" />
          )}
          <span className="hidden sm:inline font-semibold">{isRunLoading ? 'Running...' : 'Run'}</span>
        </button>
      </div>
    </header>
  );
};