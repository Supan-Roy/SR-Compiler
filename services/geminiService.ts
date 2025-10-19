import { GoogleGenAI, Chat } from "@google/genai";
import { LANGUAGES } from "../constants";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getLanguageAlias = (languageName: string): string => {
    const lang = LANGUAGES.find(l => l.name === languageName);
    return lang?.alias || lang?.id || 'plaintext';
};

const EXECUTION_MODEL = 'gemini-2.5-flash';

export const runCodeOnce = async (code: string, language: string, input: string): Promise<string> => {
    const languageAlias = getLanguageAlias(language);
    const prompt = `
You are an expert code execution engine.
Execute the following ${language} code with the provided standard input.
Return ONLY the raw standard output of the code.
If there is a compilation or runtime error, return ONLY the exact error message.
Do not add any explanations, preambles, or markdown formatting.

Standard Input:
---
${input || "(empty)"}
---

Code:
\`\`\`${languageAlias}
${code}
\`\`\`
`;
    try {
         const response = await ai.models.generateContent({
            model: EXECUTION_MODEL,
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error running code with Gemini API:", error);
        throw new Error("Failed to communicate with the execution service.");
    }
}

export const startInteractiveRun = async (code: string, language: string): Promise<{ chat: Chat; responseText: string; }> => {
    const languageAlias = getLanguageAlias(language);
    const chat = ai.chats.create({
        model: EXECUTION_MODEL,
    });

    const prompt = `
You are an expert interactive code execution engine.
Your task is to execute the given code step-by-step.
- When the code prints to standard output, return that output.
- When the code needs to read from standard input (e.g., using cin, input(), scanf), you MUST stop execution. Respond with ALL output generated so far, immediately followed by the special token "[NEEDS_INPUT]".
- Do NOT invent or guess any user input. Await the next message for the input.
- After receiving the input, resume execution from where you left off.
- When the program finishes successfully, provide the final output and then on a new line, the special token "[EXECUTION_COMPLETE]".
- If there is a compilation or runtime error, return ONLY the exact error message, followed by the special token "[EXECUTION_ERROR]".
- Return ONLY the raw output, errors, or special tokens. Do not add any explanations, preambles, or markdown formatting.

Here is the ${language} code to execute:
\`\`\`${languageAlias}
${code}
\`\`\`
Begin execution now.
`;

    try {
        const response = await chat.sendMessage({ message: prompt });
        return { chat, responseText: response.text.trim() };
    } catch (error) {
        console.error("Error starting interactive run with Gemini API:", error);
        throw new Error("Failed to start the execution service.");
    }
};

export const continueInteractiveRun = async (chat: Chat, userInput: string): Promise<string> => {
    try {
        const response = await chat.sendMessage({ message: userInput });
        return response.text.trim();
    } catch (error) {
        console.error("Error continuing interactive run with Gemini API:", error);
        throw new Error("Failed to communicate with the execution service.");
    }
};


export const formatCode = async (code: string, language: string): Promise<string> => {
    const languageAlias = getLanguageAlias(language);
    const prompt = `
You are an expert code formatting tool.
Reformat the following ${language} code to adhere to standard, conventional style guides for that language (e.g., PEP 8 for Python, Prettier for JavaScript/TypeScript, etc.).
Return ONLY the formatted code.
Do not add any explanation, preamble, or markdown code block fences. Just the raw, formatted code.

Code:
\`\`\`${languageAlias}
${code}
\`\`\`
`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        
        // Clean up potential markdown fences just in case
        let formattedCode = response.text.trim();
        const regex = new RegExp(`^\`\`\`(${languageAlias})?\\s*|\\s*\`\`\`$`, 'g');
        formattedCode = formattedCode.replace(regex, '');

        return formattedCode.trim();
    } catch (error) {
        console.error("Error formatting code with Gemini API:", error);
        throw new Error("Failed to communicate with the formatting service.");
    }
};