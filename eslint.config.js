import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Patterns to prevent hardcoded colors - use design tokens instead
const hardcodedColorPatterns = [
  // Prevent hardcoded Tailwind gray/slate colors - use surface-* or text-* tokens
  { pattern: /bg-(?:slate|gray|zinc|neutral|stone)-\d{2,3}/, replacement: 'bg-surface-*' },
  { pattern: /text-(?:slate|gray|zinc|neutral|stone)-\d{2,3}/, replacement: 'text-text-*' },
  { pattern: /border-(?:slate|gray|zinc|neutral|stone)-\d{2,3}/, replacement: 'border-border-*' },
  // Prevent hardcoded accent colors - use accent-* tokens
  { pattern: /(?:bg|text|border)-(?:indigo|blue|purple|violet|cyan)-\d{2,3}/, replacement: 'accent-*' },
];

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Warn about hardcoded hex colors in strings (className, style)
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone)-\\d{2,3}/]',
          message: 'Avoid hardcoded gray colors. Use design tokens: bg-surface-*, text-text-*, border-border-*',
        },
        {
          selector: 'Literal[value=/(?:bg|text|border)-(?:indigo|blue|purple|violet)-\\d{2,3}/]',
          message: 'Avoid hardcoded accent colors. Use design tokens: accent-*, bg-accent-*, text-accent-*',
        },
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}/]',
          message: 'Avoid hardcoded hex colors. Use CSS variables from tokens.css or Tailwind design tokens.',
        },
      ],
    },
  },
])
