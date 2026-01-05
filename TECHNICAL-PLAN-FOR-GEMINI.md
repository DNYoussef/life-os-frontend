# Life OS Dashboard - Technical Implementation Plan

**For: Gemini AI Agent**
**Date:** 2026-01-04
**Objective:** Implement UI fixes addressing root causes, not symptoms

---

## META ROOT CAUSE

> The frontend was treated as a derivative artifact of the backend rather than a first-class product.

All 31 issues trace back to 3 fundamental patterns:
1. **Process Pattern** - Backend-first development, no frontend quality gates
2. **Architecture Pattern** - Missing design system, no single source of truth
3. **Strategy Pattern** - Unclear product vision (monitoring vs. workspace)

---

## KEYSTONE FIX: Design System Foundation

This single intervention addresses 80% of issues:

```
Token Foundation → Component Contract → Migration
```

---

## PHASE 1: Design Tokens (Do FIRST)

### Task 1.1: Extend tailwind.config.js

**File:** `tailwind.config.js`

Create semantic design tokens. The current file has EMPTY theme extension.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary accent - UNIFIED (replacing indigo/blue/cyan chaos)
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // PRIMARY - use this most
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Surfaces - Dark theme
        surface: {
          base: '#0a0e17',      // App background
          primary: '#111827',   // Card backgrounds
          elevated: '#1f2937',  // Elevated elements
          overlay: '#374151',   // Modals, dropdowns
        },
        // Semantic colors
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
```

### Task 1.2: Create CSS Custom Properties Bridge

**File:** `src/styles/tokens.css` (NEW FILE)

```css
:root {
  /* Primary Accent */
  --color-accent: theme('colors.accent.500');
  --color-accent-hover: theme('colors.accent.600');
  --color-accent-subtle: theme('colors.accent.500' / 20%);

  /* Surfaces */
  --color-bg-base: theme('colors.surface.base');
  --color-bg-surface: theme('colors.surface.primary');
  --color-bg-elevated: theme('colors.surface.elevated');

  /* Text */
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;

  /* Borders */
  --color-border-default: #334155;
  --color-border-subtle: #1e293b;

  /* Semantic */
  --color-success: theme('colors.success');
  --color-warning: theme('colors.warning');
  --color-error: theme('colors.error');

  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## PHASE 2: Critical Component Fixes

### Task 2.1: Fix Kanban Theme Collision (CRITICAL)

**File:** `src/components/kanban/Kanban.scss`

**PROBLEM:** Light theme hardcoded in dark app
**ROOT CAUSE:** No theming contract

**Changes Required:**

```scss
// BEFORE (lines 5-6)
.kanban-board {
  background: #f8fafc; // ❌ LIGHT THEME
}

// AFTER
.kanban-board {
  background: var(--color-bg-base); // ✅ DARK THEME
}

// BEFORE (lines 54-56)
.kanban-column {
  background: #ffffff; // ❌ WHITE
}

// AFTER
.kanban-column {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-subtle);
}

// BEFORE (line 163)
.kanban-card {
  background: white; // ❌ WHITE
}

// AFTER
.kanban-card {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
}
```

### Task 2.2: Create AppStateBanner Component (NEW)

**File:** `src/components/ui/AppStateBanner.tsx` (NEW)

**PURPOSE:** Replace raw error strings like `[object Object]`, "Not Found"

```tsx
import { AlertCircle, WifiOff, Database, Info } from 'lucide-react';

type BannerVariant = 'demo' | 'offline' | 'error' | 'empty' | 'info';

interface AppStateBannerProps {
  variant: BannerVariant;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const variantConfig = {
  demo: {
    icon: Info,
    bgClass: 'bg-accent-500/10 border-accent-500/30',
    textClass: 'text-accent-400',
  },
  offline: {
    icon: WifiOff,
    bgClass: 'bg-warning/10 border-warning/30',
    textClass: 'text-warning',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-error/10 border-error/30',
    textClass: 'text-error',
  },
  empty: {
    icon: Database,
    bgClass: 'bg-surface-elevated border-border-subtle',
    textClass: 'text-text-secondary',
  },
  info: {
    icon: Info,
    bgClass: 'bg-info/10 border-info/30',
    textClass: 'text-info',
  },
};

export function AppStateBanner({ variant, title, message, action }: AppStateBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border p-4 ${config.bgClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`flex-shrink-0 mt-0.5 ${config.textClass}`} size={20} />
        <div className="flex-1">
          <h3 className={`font-medium ${config.textClass}`}>{title}</h3>
          {message && (
            <p className="text-text-secondary text-sm mt-1">{message}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 px-4 py-2 rounded-md bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Task 2.3: Add Accessibility to Interactive Elements

**Files:** Multiple

**Pattern to Apply:**

```tsx
// BEFORE: div with onClick (no keyboard support)
<div onClick={handleClick} className="cursor-pointer">
  Card content
</div>

// AFTER: Proper keyboard support + ARIA
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  role="button"
  aria-label="Descriptive action label"
  className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-surface-base"
>
  Card content
</div>
```

**Files requiring this fix:**
- `AgentsPage.tsx` - AgentCard component
- `ProjectsPage.tsx` - ProjectCard component (lines 62-64)

---

## PHASE 3: Design System Components (12 Primitives)

Create these in `src/components/ui/`:

| Component | Priority | Notes |
|-----------|----------|-------|
| `PageContainer.tsx` | P0 | Max width, padding, vertical rhythm |
| `SectionHeader.tsx` | P0 | Title, subtitle, right-side actions |
| `Card.tsx` | P0 | Consistent surface styling |
| `Button.tsx` | P0 | Already exists - ensure used everywhere |
| `Input.tsx` | P1 | Themed form inputs |
| `Badge.tsx` | P1 | Status indicators |
| `AppStateBanner.tsx` | P0 | Created above |
| `ProgressBar.tsx` | P1 | Task/project progress |
| `Stepper.tsx` | P1 | Wizard navigation |
| `MetricCard.tsx` | P1 | Status metrics (like Home) |
| `ActivityFeed.tsx` | P2 | Recent activity panel |
| `Table.tsx` | P2 | Data display |

---

## ANTI-PATTERNS (WHAT IS NOT ACCEPTABLE)

### Color Anti-Patterns (NEVER DO)

```tsx
// ❌ FORBIDDEN: Hardcoded hex colors
className="bg-[#ffffff]"
className="text-[#6366f1]"
background: #f8fafc;

// ❌ FORBIDDEN: Mix of different accent families
className="bg-indigo-500" // in one component
className="bg-blue-500"   // in another component
className="bg-cyan-500"   // in yet another

// ✅ REQUIRED: Use semantic tokens
className="bg-surface-primary"
className="text-accent-500"
background: var(--color-bg-surface);
```

### Theme Anti-Patterns (NEVER DO)

```scss
// ❌ FORBIDDEN: Light theme colors in dark app
background: white;
background: #f8fafc;
background: #ffffff;
color: #1a1a1a;

// ✅ REQUIRED: Dark theme tokens only
background: var(--color-bg-surface);
background: var(--color-bg-elevated);
color: var(--color-text-primary);
```

### Accessibility Anti-Patterns (NEVER DO)

```tsx
// ❌ FORBIDDEN: Clickable div without keyboard support
<div onClick={handleClick}>Click me</div>

// ❌ FORBIDDEN: Color-only status indication
<span className="text-green-500">Active</span>

// ❌ FORBIDDEN: Icons without labels
<CheckCircle className="text-green-400" />

// ✅ REQUIRED: Full accessibility
<div
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  role="button"
  aria-label="Action description"
>
  Click me
</div>

// ✅ REQUIRED: Text + color indication
<span className="text-green-500">
  <CheckCircle aria-hidden="true" /> Active
</span>

// ✅ REQUIRED: Icons with aria-label OR aria-hidden
<CheckCircle className="text-green-400" aria-label="Status: Active" />
// OR
<CheckCircle className="text-green-400" aria-hidden="true" />
<span className="sr-only">Active</span>
```

### Styling Anti-Patterns (NEVER DO)

```tsx
// ❌ FORBIDDEN: Inline style blocks in TSX
<style>{`
  .my-component { background: white; }
`}</style>

// ❌ FORBIDDEN: Creating new CSS files per component
// (already have 3 systems - don't add more)

// ❌ FORBIDDEN: Mixed units
padding: 16px;    // in one place
padding: 1rem;    // in another
padding: 0.75rem; // in another

// ✅ REQUIRED: Tailwind utilities OR CSS variables
className="p-4"
padding: var(--space-4);
```

### Component Anti-Patterns (NEVER DO)

```tsx
// ❌ FORBIDDEN: Defining components inside other components
function ParentPage() {
  function ChildCard() { // ❌ Will recreate on every render
    return <div>Card</div>;
  }
  return <ChildCard />;
}

// ❌ FORBIDDEN: Raw error objects in UI
{error && <div>{error}</div>} // May render [object Object]

// ✅ REQUIRED: Extract components to separate files
// ✅ REQUIRED: Type-check error before display
{error && typeof error === 'string' && (
  <AppStateBanner variant="error" title={error} />
)}
```

---

## ARTISTIC FREEDOM (WHAT IS ACCEPTABLE)

Gemini has creative latitude for:

### Visual Enhancements (ALLOWED)
- Subtle gradients on surfaces (within dark theme palette)
- Glow effects on accent colors (for emphasis)
- Micro-animations on hover/focus (≤200ms)
- Drop shadows (dark, not light)
- Glass-morphism effects (if consistent)
- Icon animations (subtle, purposeful)
- Progress bar animations
- Skeleton loading states

### Layout Improvements (ALLOWED)
- Adjusting spacing for visual rhythm
- Card layouts and grid configurations
- Empty state illustrations (within color palette)
- Decorative elements (subtle, non-distracting)

### Typography (ALLOWED)
- Font weight variations for hierarchy
- Letter-spacing adjustments
- Line-height optimization
- Truncation with ellipsis for long text

### Interaction Polish (ALLOWED)
- Hover state variations
- Active/pressed states
- Focus ring styles (must remain visible)
- Transition timing adjustments
- Ripple effects on buttons
- Tooltip styling

---

## DEPENDENCY ORDER (MUST FOLLOW)

```
1. tailwind.config.js (tokens)
   ↓
2. src/styles/tokens.css (CSS bridge)
   ↓
3. Import tokens.css in main.tsx
   ↓
4. AppStateBanner.tsx (new component)
   ↓
5. Kanban.scss fixes (theme collision)
   ↓
6. AgentsPage.tsx fixes (accessibility + error display)
   ↓
7. ProjectsPage.tsx fixes (accessibility)
   ↓
8. Remaining components (parallel)
```

**CRITICAL:** Do not skip steps. Token foundation MUST exist before component fixes.

---

## SUCCESS CRITERIA

| Metric | Target |
|--------|--------|
| Hardcoded colors | 0 (all use tokens) |
| Light theme colors in dark app | 0 |
| Clickable elements without keyboard | 0 |
| `[object Object]` in UI | 0 |
| Design system components used | 100% of pages |
| WCAG 2.1 Level A compliance | 100% |

---

## FILES TO MODIFY (PRIORITY ORDER)

1. `tailwind.config.js` - P0
2. `src/styles/tokens.css` - P0 (CREATE)
3. `src/main.tsx` - P0 (import tokens)
4. `src/components/ui/AppStateBanner.tsx` - P0 (CREATE)
5. `src/components/kanban/Kanban.scss` - P0
6. `src/pages/AgentsPage.tsx` - P0
7. `src/pages/ProjectsPage.tsx` - P1
8. `src/pages/TasksPage.tsx` - P1
9. `src/components/ui/PageContainer.tsx` - P1 (CREATE)
10. `src/components/ui/Card.tsx` - P1 (CREATE)

---

**Document Version:** 1.0
**Created For:** Gemini AI Implementation Agent
**Anti-Patterns:** Strictly enforced
**Artistic Freedom:** Granted within constraints
