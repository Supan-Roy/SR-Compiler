import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Icon } from './Icon';
import type { Language } from '../types';

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  languageName: string;
  languageId: Language['id'];
  fontSize: string;
}

interface MenuState {
  visible: boolean;
  x: number;
  y: number;
}

declare global {
  interface Window {
    hljs: {
      highlight: (code: string, options: { language: string, ignoreIllegals?: boolean }) => { value: string };
      getLanguage: (name: string) => object | undefined;
    };
  }
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange, languageName, languageId, fontSize }) => {
  const [copyState, setCopyState] = useState<'copy' | 'check'>('copy');
  const [menu, setMenu] = useState<MenuState>({ visible: false, x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const lineCount = code.split('\n').length;

  const highlightedHTML = useMemo(() => {
    // Check if highlight.js is loaded and the language is supported
    if (window.hljs && window.hljs.getLanguage(languageId)) {
        // Appending a newline seems to fix issues with the last line not highlighting correctly.
        return window.hljs.highlight(code, { language: languageId, ignoreIllegals: true }).value + '\n';
    }
    // Fallback for no language support or hljs not loaded
    // Escape HTML entities to prevent rendering issues and append a newline
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\n';
  }, [code, languageId]);


  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopyState('check');
      setTimeout(() => setCopyState('copy'), 1500);
    });
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    setMenu({ visible: true, x: e.clientX, y: e.clientY });
  };
  
  const closeMenu = useCallback(() => setMenu(prev => ({...prev, visible: false})), []);

  useEffect(() => {
    if (menu.visible) {
      document.addEventListener('click', closeMenu);
      document.addEventListener('contextmenu', closeMenu);
    }
    return () => {
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('contextmenu', closeMenu);
    };
  }, [menu.visible, closeMenu]);

  const handleMenuAction = async (action: 'cut' | 'copy' | 'paste' | 'changeAll') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = code.substring(selectionStart, selectionEnd);

    if (action === 'copy') {
      if(selectedText) navigator.clipboard.writeText(selectedText);
    } else if (action === 'cut') {
      if(selectedText) {
        navigator.clipboard.writeText(selectedText);
        onCodeChange(code.slice(0, selectionStart) + code.slice(selectionEnd));
      }
    } else if (action === 'paste') {
        const textToPaste = await navigator.clipboard.readText();
        onCodeChange(code.slice(0, selectionStart) + textToPaste + code.slice(selectionEnd));
    } else if (action === 'changeAll') {
        if (!selectedText) {
            alert("Please select the text you want to replace.");
            return;
        }
        const replacement = prompt(`Replace all occurrences of "${selectedText}" with:`);
        if (replacement !== null) {
            onCodeChange(code.split(selectedText).join(replacement));
        }
    }
    closeMenu();
  };
  
  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current && preRef.current) {
        const { scrollTop, scrollLeft } = textareaRef.current;
        lineNumbersRef.current.scrollTop = scrollTop;
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner flex-grow flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="bg-slate-200/50 dark:bg-slate-900/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{languageName} Editor</h2>
        <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
          <Icon type={copyState} className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
      <div className="flex-grow flex flex-row overflow-hidden">
        <div 
          ref={lineNumbersRef}
          className={`py-4 pl-4 pr-3 text-right text-slate-400 dark:text-slate-500 font-mono leading-relaxed select-none overflow-y-hidden bg-slate-200/50 dark:bg-slate-900/50 ${fontSize}`}
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="grid flex-1">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onContextMenu={handleContextMenu}
              onScroll={handleScroll}
              className={`code-editor-textarea col-start-1 row-start-1 w-full h-full py-4 pl-3 pr-4 bg-transparent text-transparent resize-none focus:outline-none font-mono leading-relaxed whitespace-pre-wrap break-words z-10 overflow-auto ${fontSize}`}
              placeholder="Enter your code here..."
              spellCheck="false"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
            <pre
              ref={preRef}
              className={`hide-scrollbar col-start-1 row-start-1 w-full h-full py-4 pl-3 pr-4 font-mono leading-relaxed overflow-auto pointer-events-none whitespace-pre-wrap break-words z-0 ${fontSize}`}
              aria-hidden="true"
            >
              <code
                className={`language-${languageId} hljs`}
                dangerouslySetInnerHTML={{ __html: highlightedHTML }}
              />
            </pre>
        </div>
      </div>
      {menu.visible && (
         <div 
            className="absolute z-30 bg-slate-100 dark:bg-slate-700 rounded-md shadow-lg py-1 border border-slate-300 dark:border-slate-600 text-sm"
            style={{ top: menu.y, left: menu.x }}
            onClick={(e) => e.stopPropagation()}
         >
            <button onClick={() => handleMenuAction('cut')} className="block w-full text-left px-4 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-600">Cut</button>
            <button onClick={() => handleMenuAction('copy')} className="block w-full text-left px-4 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-600">Copy</button>
            <button onClick={() => handleMenuAction('paste')} className="block w-full text-left px-4 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-600">Paste</button>
            <div className="my-1 border-t border-slate-300 dark:border-slate-600"></div>
            <button onClick={() => handleMenuAction('changeAll')} className="block w-full text-left px-4 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-600">Change All Occurrences</button>
         </div>
      )}
    </div>
  );
};
