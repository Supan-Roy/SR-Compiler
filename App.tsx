import React, { useState, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { Header } from './components/Header';
import { CodeEditor } from './components/CodeEditor';
import { ExecutionPanel } from './components/ExecutionPanel';
import { formatCode, startInteractiveRun, continueInteractiveRun, runCodeOnce } from './services/geminiService';
import { LANGUAGES, CODE_TEMPLATES } from './constants';
import type { Language, ExecutionMode } from './types';
import { Icon } from './components/Icon';

const FONT_SIZES = ['text-sm', 'text-base', 'text-lg'];

// --- LocalStorage Persistence ---
const getInitialLanguage = (): Language => {
  try {
    const savedLangJson = localStorage.getItem('sr-compiler:language');
    if (savedLangJson) {
      const savedLang = JSON.parse(savedLangJson) as Language;
      if (LANGUAGES.some(l => l.id === savedLang.id)) {
        return savedLang;
      }
    }
  } catch (e) {
    console.error("Failed to parse saved language", e);
  }
  return LANGUAGES[0];
};

const getInitialCode = (lang: Language): string => {
  const savedCode = localStorage.getItem(`sr-compiler:code:${lang.id}`);
  return savedCode !== null ? savedCode : CODE_TEMPLATES[lang.id];
};

const getInitialFontSize = (): string => {
  const savedFontSize = localStorage.getItem('sr-compiler:fontSize');
  if (savedFontSize && FONT_SIZES.includes(savedFontSize)) {
    return savedFontSize;
  }
  return FONT_SIZES[1];
};
// --- End LocalStorage Persistence ---

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(getInitialLanguage);
  const [code, setCode] = useState<string>(() => getInitialCode(getInitialLanguage()));
  const [fontSize, setFontSize] = useState<string>(getInitialFontSize);
  
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
  
  // Save state to localStorage on change
  useEffect(() => {
    localStorage.setItem('sr-compiler:language', JSON.stringify(selectedLanguage));
  }, [selectedLanguage]);

  useEffect(() => {
    localStorage.setItem(`sr-compiler:code:${selectedLanguage.id}`, code);
  }, [code, selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('sr-compiler:fontSize', fontSize);
  }, [fontSize]);


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
    setCode(getInitialCode(lang)); // Load saved code for the new language
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
  
  const handleClearCode = useCallback(() => {
    setCode('');
    setHistory([]);
    setManualOutput('');
    setIsError(false);
    setChat(null);
    setIsWaitingForInput(false);
  }, []);

  const handleFontSizeChange = useCallback(() => {
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % FONT_SIZES.length;
    setFontSize(FONT_SIZES[nextIndex]);
  }, [fontSize]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col font-sans">
      <Header
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
        onRunCode={handleRunCode}
        onFormatCode={handleFormatCode}
        onClearCode={handleClearCode}
        onFontSizeChange={handleFontSizeChange}
        isRunLoading={isRunLoading}
        isFormatLoading={isFormatLoading}
      />
      <main className="flex-grow flex flex-col md:flex-row p-2 md:p-4 gap-4 overflow-hidden pb-20 md:pb-4">
        <div className={`flex-1 flex-col min-h-0 ${activeMobileView === 'editor' ? 'flex' : 'hidden'} md:flex`}>
          <CodeEditor
            code={code}
            onCodeChange={setCode}
            languageName={selectedLanguage.name}
            languageId={selectedLanguage.id}
            fontSize={fontSize}
          />
        </div>
        <div className={`flex-1 flex-col min-h-0 ${activeMobileView === 'output' ? 'flex' : 'hidden'} md:flex`}>
          <ExecutionPanel
            mode={executionMode}
            onModeChange={setExecutionMode}
            // Interactive Props
            history={history}
            isWaitingForInput={isWaitingForInput}
            onUserInput={handleUserInput}
            // Manual Props
            input={manualInput}
            onInputChange={setManualInput}
            output={manualOutput}
            // Common Props
            isError={isError}
            fontSize={fontSize}
          />
        </div>
      </main>

      {/* Mobile View Toggle */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 p-2 flex justify-around items-center gap-2 z-20">
        <button
          onClick={() => setActiveMobileView('editor')}
          className={`flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeMobileView === 'editor' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
        >
          <Icon type="code" className="w-5 h-5" />
          Editor
        </button>
        <button
          onClick={() => setActiveMobileView('output')}
          className={`flex flex-1 justify-center items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeMobileView === 'output' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}
        >
          <Icon type="terminal" className="w-5 h-5" />
          Output
        </button>
      </div>
    </div>
  );
};

export default App;