/**
 * Vitest Setup Library Component
 * ==============================
 *
 * LEGO-compatible Vitest + React Testing Library setup for React 18/19 projects.
 * Provides reusable configuration, custom render, and test utilities.
 *
 * Adapted from jest-setup-collection library for Vitest compatibility.
 *
 * @example
 * // In your test files
 * import { render, screen, userEvent } from '@/test-utils';
 * import { Button } from '../Button';
 *
 * test('button click', async () => {
 *   const onClick = vi.fn();
 *   render(<Button onClick={onClick}>Click me</Button>);
 *   await userEvent.click(screen.getByRole('button'));
 *   expect(onClick).toHaveBeenCalled();
 * });
 */

export { configure, setupMocks, cleanupMocks, mockAPIResponse, mockErrorResponse, createMockFetch } from './setup';
export { render, renderHook, AllProviders, createTestQueryClient, waitForLoading, fillForm, getTextContent, debugDOM, createMockComponent, createMockHook } from './test-utils';
export {
  toBeValidJSON,
  toHaveBeenCalledWithMatch,
  toBeWithinRange,
  toMatchAPIResponse,
  toBeSorted,
  toHaveKeys,
  matchers,
} from './matchers';

// Re-export commonly used RTL utilities
export {
  screen,
  waitFor,
  within,
  fireEvent,
  cleanup,
} from '@testing-library/react';

export { default as userEvent } from '@testing-library/user-event';
