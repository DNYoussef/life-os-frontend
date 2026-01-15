# Vitest Setup Library Component

LEGO-compatible Vitest + React Testing Library setup for React 18/19 projects with TypeScript.

Adapted from the `jest-setup-collection` library component for Vitest compatibility.

## Source

Deployed from: `C:\Users\17175\.claude\library\components\testing\jest-setup\`

## Installation

This component is already integrated. The dependencies are in package.json:

- `vitest` (test runner)
- `@testing-library/react` (RTL)
- `@testing-library/jest-dom/vitest` (DOM matchers)
- `@testing-library/user-event` (user interactions)
- `@tanstack/react-query` (for QueryClientProvider)
- `react-router-dom` (for Router providers)

## Quick Start

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '@/test-utils';
import { Button } from '../Button';

describe('Button', () => {
  it('handles click', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## Custom Matchers

```typescript
// Valid JSON check
expect('{"valid": true}').toBeValidJSON();

// Partial object matching for mocks
expect(mockFn).toHaveBeenCalledWithMatch({ id: expect.any(String) });

// Number range check
expect(5).toBeWithinRange(1, 10);

// API response structure
expect(response).toMatchAPIResponse({ status: 200 });

// Array sorting
expect([1, 2, 3]).toBeSorted();

// Object keys check
expect(obj).toHaveKeys(['id', 'name']);
```

## Built-in Mocks

| API | Mock Behavior |
|-----|---------------|
| ResizeObserver | Triggers callback immediately |
| IntersectionObserver | Reports element as visible |
| localStorage | In-memory storage |
| sessionStorage | In-memory storage |
| matchMedia | Returns matches: false |
| scrollTo | No-op |
| fetch | Returns empty successful response |

## API Mock Utilities

```typescript
import { mockAPIResponse, mockErrorResponse, createMockFetch } from '@/test-utils';

// Simple mock response
global.fetch = vi.fn().mockResolvedValue(mockAPIResponse({ data: [...] }));

// Error response
global.fetch = vi.fn().mockResolvedValue(mockErrorResponse(404, 'Not found'));

// Route-based mock
global.fetch = createMockFetch({
  '/api/users': { data: [...] },
  '/api/projects': { data: [...] },
});
```

## Custom Render with Providers

```typescript
import { render, renderHook } from '@/test-utils';

// Basic render with all providers (Router + React Query)
render(<MyComponent />);

// With custom route
render(<MyComponent />, {
  providerOptions: { initialRoute: '/users/123' }
});

// Test hooks with providers
const { result } = renderHook(() => useMyHook());
```

## File Structure

```
src/test-utils/
  index.ts       # Package exports
  setup.ts       # Global setup and mocks (Vitest-compatible)
  test-utils.tsx # Custom render with providers
  matchers.ts    # Custom Vitest matchers
  README.md      # This documentation
```

## Version

1.0.0 - Initial deployment from jest-setup-collection, adapted for Vitest
