/**
 * Custom Vitest Matchers
 * ======================
 *
 * Additional Vitest matchers for common testing patterns.
 * Import and extend in your vitest setup file.
 *
 * Adapted from jest-setup-collection library for Vitest compatibility.
 *
 * @example
 * // In vitest setup
 * import { matchers } from '@/test-utils/matchers';
 * expect.extend(matchers);
 *
 * // In tests
 * expect('{"valid": true}').toBeValidJSON();
 * expect(mockFn).toHaveBeenCalledWithMatch({ id: expect.any(String) });
 */

import { expect, vi } from 'vitest';

// =============================================================================
// Matcher Types - Extend Vitest's expect
// =============================================================================

interface CustomMatchers<R = unknown> {
  /** Check if string is valid JSON */
  toBeValidJSON(): R;
  /** Check if mock was called with object matching partial */
  toHaveBeenCalledWithMatch(expected: Record<string, unknown>): R;
  /** Check if number is within range (inclusive) */
  toBeWithinRange(min: number, max: number): R;
  /** Check if value matches API response structure */
  toMatchAPIResponse(expected: { status?: number; data?: unknown; ok?: boolean }): R;
  /** Check if array is sorted */
  toBeSorted(compareFn?: (a: unknown, b: unknown) => number): R;
  /** Check if object has all keys */
  toHaveKeys(keys: string[]): R;
}

declare module 'vitest' {
  interface Assertion<T = unknown> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// =============================================================================
// Matcher Implementations
// =============================================================================

/**
 * Check if string is valid JSON.
 *
 * @example
 * expect('{"valid": true}').toBeValidJSON(); // passes
 * expect('not json').toBeValidJSON(); // fails
 */
export function toBeValidJSON(
  received: unknown
): { pass: boolean; message: () => string } {
  if (typeof received !== 'string') {
    return {
      pass: false,
      message: () => `Expected ${JSON.stringify(received)} to be a string`,
    };
  }

  try {
    JSON.parse(received);
    return {
      pass: true,
      message: () => `Expected ${JSON.stringify(received)} not to be valid JSON`,
    };
  } catch {
    return {
      pass: false,
      message: () => `Expected ${JSON.stringify(received)} to be valid JSON`,
    };
  }
}

/**
 * Check if mock was called with object matching partial structure.
 *
 * @example
 * mockFn({ id: '123', name: 'test', timestamp: Date.now() });
 * expect(mockFn).toHaveBeenCalledWithMatch({ id: '123' }); // passes
 */
export function toHaveBeenCalledWithMatch(
  received: ReturnType<typeof vi.fn>,
  expected: Record<string, unknown>
): { pass: boolean; message: () => string } {
  if (!vi.isMockFunction(received)) {
    return {
      pass: false,
      message: () => `Expected ${JSON.stringify(received)} to be a mock function`,
    };
  }

  const calls = received.mock.calls;
  const matchingCall = calls.find((call: unknown[]) => {
    const arg = call[0];
    if (typeof arg !== 'object' || arg === null) return false;

    return Object.entries(expected).every(([key, value]) => {
      const argObj = arg as Record<string, unknown>;
      if (argObj[key] === value) return true;
      // Support asymmetric matchers like expect.any(String)
      if (
        typeof value === 'object' &&
        value !== null &&
        'asymmetricMatch' in value
      ) {
        return (value as { asymmetricMatch: (v: unknown) => boolean }).asymmetricMatch(
          argObj[key]
        );
      }
      return false;
    });
  });

  return {
    pass: !!matchingCall,
    message: () =>
      matchingCall
        ? `Expected mock not to have been called with object matching ${JSON.stringify(expected)}`
        : `Expected mock to have been called with object matching ${JSON.stringify(expected)}\nReceived calls: ${JSON.stringify(calls)}`,
  };
}

/**
 * Check if number is within range (inclusive).
 *
 * @example
 * expect(5).toBeWithinRange(1, 10); // passes
 * expect(15).toBeWithinRange(1, 10); // fails
 */
export function toBeWithinRange(
  received: unknown,
  min: number,
  max: number
): { pass: boolean; message: () => string } {
  if (typeof received !== 'number') {
    return {
      pass: false,
      message: () => `Expected ${JSON.stringify(received)} to be a number`,
    };
  }

  const pass = received >= min && received <= max;
  return {
    pass,
    message: () =>
      pass
        ? `Expected ${received} not to be within range ${min} - ${max}`
        : `Expected ${received} to be within range ${min} - ${max}`,
  };
}

/**
 * Check if value matches API response structure.
 *
 * @example
 * expect(response).toMatchAPIResponse({ status: 200, data: { id: '1' } });
 */
export function toMatchAPIResponse(
  received: unknown,
  expected: { status?: number; data?: unknown; ok?: boolean }
): { pass: boolean; message: () => string } {
  if (typeof received !== 'object' || received === null) {
    return {
      pass: false,
      message: () => `Expected ${JSON.stringify(received)} to be an object`,
    };
  }

  const response = received as Record<string, unknown>;
  const checks: string[] = [];

  if (expected.status !== undefined && response.status !== expected.status) {
    checks.push(`status: expected ${expected.status}, got ${response.status}`);
  }

  if (expected.ok !== undefined && response.ok !== expected.ok) {
    checks.push(`ok: expected ${expected.ok}, got ${response.ok}`);
  }

  if (expected.data !== undefined && JSON.stringify(response.data) !== JSON.stringify(expected.data)) {
    checks.push(
      `data: expected ${JSON.stringify(expected.data)}, got ${JSON.stringify(response.data)}`
    );
  }

  return {
    pass: checks.length === 0,
    message: () =>
      checks.length === 0
        ? `Expected response not to match API response structure`
        : `Expected response to match API response structure:\n${checks.join('\n')}`,
  };
}

/**
 * Check if array is sorted.
 *
 * @example
 * expect([1, 2, 3]).toBeSorted(); // passes
 * expect(['a', 'b', 'c']).toBeSorted(); // passes
 * expect([3, 1, 2]).toBeSorted(); // fails
 */
export function toBeSorted(
  received: unknown,
  compareFn?: (a: unknown, b: unknown) => number
): { pass: boolean; message: () => string } {
  if (!Array.isArray(received)) {
    return {
      pass: false,
      message: () => `Expected ${JSON.stringify(received)} to be an array`,
    };
  }

  const defaultCompare = (a: unknown, b: unknown): number => {
    if (a === b) return 0;
    return (a as number) < (b as number) ? -1 : 1;
  };

  const compare = compareFn ?? defaultCompare;
  const sorted = [...received].sort(compare);
  const pass = JSON.stringify(received) === JSON.stringify(sorted);

  return {
    pass,
    message: () =>
      pass
        ? `Expected array not to be sorted`
        : `Expected array to be sorted\nReceived: ${JSON.stringify(received)}\nExpected: ${JSON.stringify(sorted)}`,
  };
}

/**
 * Check if object has all specified keys.
 *
 * @example
 * expect({ a: 1, b: 2, c: 3 }).toHaveKeys(['a', 'b']); // passes
 * expect({ a: 1 }).toHaveKeys(['a', 'b']); // fails
 */
export function toHaveKeys(
  received: unknown,
  keys: string[]
): { pass: boolean; message: () => string } {
  if (typeof received !== 'object' || received === null) {
    return {
      pass: false,
      message: () => `Expected ${JSON.stringify(received)} to be an object`,
    };
  }

  const obj = received as Record<string, unknown>;
  const missingKeys = keys.filter((key) => !(key in obj));

  return {
    pass: missingKeys.length === 0,
    message: () =>
      missingKeys.length === 0
        ? `Expected object not to have keys ${JSON.stringify(keys)}`
        : `Expected object to have keys ${JSON.stringify(keys)}\nMissing: ${JSON.stringify(missingKeys)}`,
  };
}

// =============================================================================
// Matcher Export
// =============================================================================

/**
 * All custom matchers bundled for expect.extend().
 *
 * @example
 * import { matchers } from '@/test-utils/matchers';
 * expect.extend(matchers);
 */
export const matchers = {
  toBeValidJSON,
  toHaveBeenCalledWithMatch,
  toBeWithinRange,
  toMatchAPIResponse,
  toBeSorted,
  toHaveKeys,
};

// Auto-extend if in Vitest environment
if (typeof expect !== 'undefined' && typeof expect.extend === 'function') {
  expect.extend(matchers);
}
