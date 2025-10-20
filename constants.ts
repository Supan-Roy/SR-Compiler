import type { Language } from './types';

export const LANGUAGES: Language[] = [
  { id: 'cpp', name: 'C++', extension: 'cpp' },
  { id: 'c', name: 'C', extension: 'c' },
  { id: 'javascript', name: 'JavaScript', alias: 'js', extension: 'js' },
  { id: 'python', name: 'Python', alias: 'py', extension: 'py' },
  { id: 'java', name: 'Java', extension: 'java' },
  { id: 'go', name: 'Go', extension: 'go' },
  { id: 'typescript', name: 'TypeScript', alias: 'ts', extension: 'ts' },
];

export const CODE_TEMPLATES: Record<Language['id'], string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    
    return 0;
}
`,
  c: `#include <stdio.h>

int main() {
    
    return 0;
}
`,
  javascript: `// Start coding here...
`,
  python: `# Start coding here...
`,
  java: `public class Main {
    public static void main(String[] args) {
        
    }
}
`,
  go: `package main

import "fmt"

func main() {
    
}
`,
  typescript: `// Start coding here...
`,
};