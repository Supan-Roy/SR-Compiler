import React, { useState, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { ExecutionPanel } from './components/ExecutionPanel';
import { ResizablePanels } from './components/ResizablePanels';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Icon } from './components/Icon';
import { formatCode, startInteractiveRun, continueInteractiveRun, runCodeOnce } from './services/geminiService';
import { LANGUAGES, CODE_TEMPLATES } from './constants';
import type { Language, ExecutionMode, Theme } from './types';

const FONT_SIZES = ['text-sm', 'text-base', 'text-lg'];

// --- State Initialization ---
const getInitialState = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedLangId = urlParams.get('lang');
  const sharedCode = urlParams.get('code');

  let language: Language = LANGUAGES[0];
  let code = '';

  if (sharedLangId && sharedCode) {
    const foundLang = LANGUAGES.find(l => l.id === sharedLangId);
    if (foundLang) {
      language = foundLang;
      try {
        code = atob(sharedCode);
      } catch (e) {
        console.error("Failed to decode shared code", e);
        code = `// Could not load shared code. Invalid format.\n\n${getInitialCode(language)}`;
      }
    }
  } else {
      language = getInitialLanguage();
      code = getInitialCode(language);
  }
  
  // Clean URL after reading params
  if(sharedLangId || sharedCode) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  return {
    language,
    code,
    fontSize: getInitialFontSize(),
    theme: getInitialTheme(),
    panelPosition: getInitialPanelPosition()
  };
};

const getInitialLanguage = (): Language => {
  try {
    const savedLangJson = localStorage.getItem('sr-compiler:language');
    if (savedLangJson) {
      const savedLang = JSON.parse(savedLangJson) as Language;
      if (LANGUAGES.some(l => l.id === savedLang.id)) {
        return savedLang;
      }
    }
  } catch (e) { console.error("Failed to parse saved language", e); }
  return LANGUAGES[0];
};

const getInitialCode = (lang: Language): string => {
  const savedCode = localStorage.getItem(`sr-compiler:code:${lang.id}`);
  return savedCode !== null ? savedCode : CODE_TEMPLATES[lang.id];
};

const getInitialFontSize = (): string => {
  const savedFontSize = localStorage.getItem('sr-compiler:fontSize');
  return savedFontSize && FONT_SIZES.includes(savedFontSize) ? savedFontSize : FONT_SIZES[1];
};

const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem('sr-compiler:theme');
  return (savedTheme as Theme) || 'dark';
};

const getInitialPanelPosition = (): number => {
    const savedPosition = localStorage.getItem('sr-compiler:panelPosition');
    return savedPosition ? parseFloat(savedPosition) : 50;
};
// --- End State Initialization ---

const App: React.FC = () => {
  const [initialState] = useState(getInitialState);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(initialState.language);
  const [code, setCode] = useState<string>(initialState.code);
  const [fontSize, setFontSize] = useState<string>(initialState.fontSize);
  const [theme, setTheme] = useState<Theme>(initialState.theme);
  const [panelPosition, setPanelPosition] = useState<number>(initialState.panelPosition);

  const [history, setHistory] = useState<{ type: 'stdout' | 'stdin'; content: string }[]>([]);
  const [manualOutput, setManualOutput] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const [isWaitingForInput, setIsWaitingForInput] = useState<boolean>(false);
  const [isRunLoading, setIsRunLoading] = useState<boolean>(false);
  const [isFormatLoading, setIsFormatLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('interactive');
  const [activeMobileView, setActiveMobileView] = useState<'editor' | 'output'>('editor');
  
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  
  // --- Effects for Persistence & System Integration ---
  useEffect(() => localStorage.setItem('sr-compiler:language', JSON.stringify(selectedLanguage)), [selectedLanguage]);
  useEffect(() => localStorage.setItem(`sr-compiler:code:${selectedLanguage.id}`, code), [code, selectedLanguage]);
  useEffect(() => localStorage.setItem('sr-compiler:fontSize', fontSize), [fontSize]);
  useEffect(() => localStorage.setItem('sr-compiler:panelPosition', panelPosition.toString()), [panelPosition]);
  
  useEffect(() => {
    localStorage.setItem('sr-compiler:theme', theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
            document.documentElement.classList.toggle('dark', mediaQuery.matches);
            document.documentElement.classList.toggle('light', !mediaQuery.matches);
        }
    };
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
    } else { // system
        document.documentElement.classList.toggle('dark', mediaQuery.matches);
        document.documentElement.classList.toggle('light', !mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);
    }
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


  // --- Core Handlers ---
  const processInteractiveResponse = (responseText: string) => {
    let output = responseText;
    let hadUpdate = false;
    
    if (output.includes("[NEEDS_INPUT]")) {
        output = output.replace("[NEEDS_INPUT]", "").trimEnd();
        setIsWaitingForInput(true);
        hadUpdate = true;
    }
    if (output.includes("[EXECUTION_COMPLETE]")) {
        output = output.replace("[EXECUTION_COMPLETE]", "\n\n[Program finished]").trim();
        setIsWaitingForInput(false);
        setChat(null);
        hadUpdate = true;
    }
    if (output.includes("[EXECUTION_ERROR]")) {
        output = output.replace("[EXECUTION_ERROR]", "").trim();
        setIsError(true);
        setIsWaitingForInput(false);
        setChat(null);
        hadUpdate = true;
    }
    if (output || hadUpdate) {
      setHistory(prev => [...prev, { type: 'stdout', content: output }]);
    }
  };

  const handleLanguageChange = useCallback((lang: Language) => {
    setSelectedLanguage(lang);
    setCode(getInitialCode(lang));
    setHistory([]);
    setManualOutput('');
    setIsError(false);
    setChat(null);
    setIsWaitingForInput(false);
  }, []);

  const handleRunCode = useCallback(async () => {
    if (!code.trim()) {
      setManualOutput('Please enter some code to run.');
      setHistory([{ type: 'stdout', content: 'Please enter some code to run.' }]);
      setIsError(true);
      return;
    }
    setActiveMobileView('output');
    setIsRunLoading(true);
    setHistory([]);
    setManualOutput('');
    setIsError(false);
    setIsWaitingForInput(false);
    setChat(null);

    if (executionMode === 'interactive') {
      try {
        const { chat: newChat, responseText } = await startInteractiveRun(code, selectedLanguage.name);
        setChat(newChat);
        processInteractiveResponse(responseText);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setHistory([{ type: 'stdout', content: `Error: ${errorMessage}` }]);
        setIsError(true);
      } finally {
        setIsRunLoading(false);
      }
    } else { // Manual mode
       try {
        const result = await runCodeOnce(code, selectedLanguage.name, manualInput);
        setManualOutput(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setManualOutput(`Error: ${errorMessage}`);
        setIsError(true);
      } finally {
        setIsRunLoading(false);
      }
    }
  }, [code, selectedLanguage, executionMode, manualInput]);

  const handleUserInput = useCallback(async (userInput: string) => {
    if (!chat || !userInput.trim()) return;
    setHistory(prev => [...prev, { type: 'stdin', content: userInput }]);
    setIsWaitingForInput(false);
    setIsRunLoading(true);

    try {
        const responseText = await continueInteractiveRun(chat, userInput);
        processInteractiveResponse(responseText);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        setHistory(prev => [...prev, { type: 'stdout', content: `Error: ${errorMessage}` }]);
        setIsError(true);
    } finally {
        setIsRunLoading(false);
    }
  }, [chat]);

  const handleFormatCode = useCallback(async () => {
    if (!code.trim()) return;
    setIsFormatLoading(true);
    try {
      const formattedCode = await formatCode(code, selectedLanguage.name);
      setCode(formattedCode);
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
       setActiveMobileView('output');
       setHistory(prev => [...prev, { type: 'stdout', content: `Formatting Error: ${errorMessage}` }]);
       setManualOutput(`Formatting Error: ${errorMessage}`);
       setIsError(true);
    } finally {
        setIsFormatLoading(false);
    }
  }, [code, selectedLanguage]);
  
  const handleConfirmClear = useCallback(() => {
    setCode(CODE_TEMPLATES[selectedLanguage.id]);
    setHistory([]);
    setManualOutput('');
    setIsError(false);
    setChat(null);
    setIsWaitingForInput(false);
    setShowClearConfirm(false);
  }, [selectedLanguage]);

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${selectedLanguage.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadCode = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCode(content);
        const extension = file.name.split('.').pop();
        const lang = LANGUAGES.find(l => l.extension === extension);
        if (lang) {
          setSelectedLanguage(lang);
        }
        setToast({ message: "File uploaded successfully!", key: Date.now() });
      };
      reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    if(event.target) event.target.value = '';
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 flex flex-col font-sans">
      <Header
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onFormatCode={handleFormatCode}
        onClearCode={() => setShowClearConfirm(true)}
        onShowSettings={() => setShowSettings(true)}
        onDownload={handleDownloadCode}
        onUpload={handleUploadCode}
        isRunLoading={isRunLoading}
        isFormatLoading={isFormatLoading}
      />
      <main className="flex-grow flex-col md:flex-row p-2 md:p-4 gap-4 overflow-hidden pb-20 md:pb-4 hidden md:flex">
        <ResizablePanels
          initialPosition={panelPosition}
          onPositionChange={setPanelPosition}
        >
          <CodeEditor
            code={code}
            onCodeChange={setCode}
            languageName={selectedLanguage.name}
            languageId={selectedLanguage.id}
            fontSize={fontSize}
          />
          <ExecutionPanel
            mode={executionMode}
            onModeChange={setExecutionMode}
            history={history}
            isWaitingForInput={isWaitingForInput}
            onUserInput={handleUserInput}
            input={manualInput}
            onInputChange={setManualInput}
            output={manualOutput}
            isError={isError}
            fontSize={fontSize}
          />
        </ResizablePanels>
      </main>

      {/* Mobile View (Non-resizable) */}
      <main className="flex-grow flex flex-col md:hidden p-2 gap-4 overflow-hidden pb-20">
         <div className={`flex-1 flex-col min-h-0 ${activeMobileView === 'editor' ? 'flex' : 'hidden'}`}>
           <CodeEditor code={code} onCodeChange={setCode} languageName={selectedLanguage.name} languageId={selectedLanguage.id} fontSize={fontSize} />
         </div>
         <div className={`flex-1 flex-col min-h-0 ${activeMobileView === 'output' ? 'flex' : 'hidden'}`}>
           <ExecutionPanel mode={executionMode} onModeChange={setExecutionMode} history={history} isWaitingForInput={isWaitingForInput} onUserInput={handleUserInput} input={manualInput} onInputChange={setManualInput} output={manualOutput} isError={isError} fontSize={fontSize} />
         </div>
      </main>

      {/* Mobile View Toggle */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-300 dark:border-slate-700 p-2 flex justify-around items-center gap-2 z-20">
        <button
          onClick={() => setActiveMobileView('editor')}
          className={`flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeMobileView === 'editor' ? 'bg-cyan-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}
        >
          <Icon type="code" className="w-5 h-5" />
          Editor
        </button>
        <button
          onClick={() => setActiveMobileView('output')}
          className={`flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeMobileView === 'output' ? 'bg-cyan-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}
        >
          <Icon type="terminal" className="w-5 h-5" />
          Output
        </button>
      </div>

      {showSettings && (
        <SettingsModal 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            theme={theme}
            onThemeChange={setTheme}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            fontSizes={FONT_SIZES}
        />
      )}
      {showClearConfirm && (
        <ConfirmDialog title="Clear Editor" message="Are you sure you want to clear the editor? This will reset the code to the default template." onConfirm={handleConfirmClear} onCancel={() => setShowClearConfirm(false)} />
      )}
      {toast && (
          <Toast key={toast.key} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default App;