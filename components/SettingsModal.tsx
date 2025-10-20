import React from 'react';
import { Icon } from './Icon';
import type { Theme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  fontSize: string;
  onFontSizeChange: (size: string) => void;
  fontSizes: string[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, 
    onClose,
    theme,
    onThemeChange,
    fontSize,
    onFontSizeChange,
    fontSizes
}) => {
  if (!isOpen) return null;

  const handleDialogClick = (e: React.MouseEvent) => e.stopPropagation();

  const themeOptionClass = (value: Theme) => 
    `flex-1 p-2 rounded-md flex items-center justify-center gap-2 transition-colors text-sm font-medium border ${
        theme === value 
            ? 'bg-cyan-600 text-white border-cyan-600'
            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600'
    }`;
  
  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4 text-slate-800 dark:text-slate-200"
        onClick={handleDialogClick}
      >
        <h3 id="settings-dialog-title" className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Settings</h3>
        
        {/* Theme Settings */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Theme</label>
            <div className="flex gap-2">
                <button onClick={() => onThemeChange('light')} className={themeOptionClass('light')}><Icon type="sun" className="w-5 h-5"/> Light</button>
                <button onClick={() => onThemeChange('dark')} className={themeOptionClass('dark')}><Icon type="moon" className="w-5 h-5"/> Dark</button>
                <button onClick={() => onThemeChange('system')} className={themeOptionClass('system')}>System</button>
            </div>
        </div>

        {/* Font Size Settings */}
        <div className="mb-6">
             <label htmlFor="font-size-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Font Size</label>
             <select 
                id="font-size-select"
                value={fontSize} 
                onChange={(e) => onFontSizeChange(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                {fontSizes.map(size => (
                    <option key={size} value={size}>{size.replace('text-', '').charAt(0).toUpperCase() + size.slice(6)}</option>
                ))}
            </select>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};