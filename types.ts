export interface Language {
  id: 'javascript' | 'python' | 'java' | 'cpp' | 'go' | 'typescript' | 'c';
  name: string;
  alias?: string;
}

export type ExecutionMode = 'interactive' | 'manual';