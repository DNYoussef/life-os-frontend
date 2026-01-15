/**
 * Vitest Setup Configuration
 * ==========================
 *
 * Global setup and mock configuration for Vitest testing environment.
 * Import this in your vitest setup file (setupFiles).
 *
 * Adapted from jest-setup-collection library for Vitest compatibility.
 */

import '@testing-library/jest-dom/vitest';
import { vi, beforeAll, afterEach } from 'vitest';

// =============================================================================
// Configuration Types
// =============================================================================

export interface VitestSetupConfig {
  /** Enable ResizeObserver mock */
  enableResizeObserver?: boolean;
  /** Enable IntersectionObserver mock */
  enableIntersectionObserver?: boolean;
  /** Enable matchMedia mock */
  enableMatchMedia?: boolean;
  /** Enable localStorage/sessionStorage mock */
  enableStorage?: boolean;
  /** Enable window.scrollTo mock */
  enableScroll?: boolean;
  /** Enable fetch mock */
  enableFetch?: boolean;
  /** Custom API base URL for mocking */
  apiBaseUrl?: string;
}

const defaultConfig: VitestSetupConfig = {
  enableResizeObserver: true,
  enableIntersectionObserver: true,
  enableMatchMedia: true,
  enableStorage: true,
  enableScroll: true,
  enableFetch: true,
  apiBaseUrl: 'http://localhost:8000',
};

let currentConfig: VitestSetupConfig = { ...defaultConfig };

// =============================================================================
// Configuration
// =============================================================================

/**
 * Configure Vitest setup options.
 *
 * @example
 * configure({ apiBaseUrl: 'http://api.test.com' });
 */
export function configure(config: Partial<VitestSetupConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current configuration.
 */
export function getConfig(): VitestSetupConfig {
  return { ...currentConfig };
}

// =============================================================================
// Mock Implementations
// =============================================================================

/**
 * ResizeObserver mock implementation.
 */
class MockResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    // Trigger callback immediately with empty entries
    this.callback([], this);
  }

  unobserve(): void {}
  disconnect(): void {}
}

/**
 * IntersectionObserver mock implementation.
 */
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback;
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    // Trigger callback immediately as if element is visible
    this.callback(
      [
        {
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          target: document.createElement('div'),
          time: Date.now(),
        },
      ],
      this
    );
  }

  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/**
 * Storage mock implementation (localStorage/sessionStorage).
 */
function createStorageMock(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

/**
 * matchMedia mock implementation.
 */
function createMatchMediaMock(): (query: string) => MediaQueryList {
  return (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  });
}

/**
 * Fetch mock implementation with response builder.
 */
function createFetchMock(): ReturnType<typeof vi.fn> {
  return vi.fn().mockImplementation(
    (url: string): Promise<Response> =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
        blob: () => Promise.resolve(new Blob()),
        headers: new Headers(),
        url,
      } as Response)
  );
}

// =============================================================================
// Setup Functions
// =============================================================================

/**
 * Setup all mocks based on configuration.
 *
 * @example
 * // In vitest setup file
 * import { setupMocks } from '@/test-utils';
 * setupMocks();
 */
export function setupMocks(): void {
  const config = getConfig();

  // ResizeObserver
  if (config.enableResizeObserver) {
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  }

  // IntersectionObserver
  if (config.enableIntersectionObserver) {
    global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }

  // matchMedia
  if (config.enableMatchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: createMatchMediaMock(),
    });
  }

  // localStorage and sessionStorage
  if (config.enableStorage) {
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: createStorageMock(),
    });
    Object.defineProperty(window, 'sessionStorage', {
      writable: true,
      value: createStorageMock(),
    });
  }

  // scrollTo
  if (config.enableScroll) {
    Object.defineProperty(window, 'scrollTo', {
      writable: true,
      value: vi.fn(),
    });
    Element.prototype.scrollIntoView = vi.fn();
  }

  // fetch
  if (config.enableFetch) {
    global.fetch = createFetchMock();
  }
}

/**
 * Cleanup mocks after tests.
 */
export function cleanupMocks(): void {
  vi.clearAllMocks();
  vi.restoreAllMocks();
}

// =============================================================================
// Mock Utilities
// =============================================================================

/**
 * Create a mock API response.
 *
 * @example
 * global.fetch = vi.fn().mockResolvedValue(mockAPIResponse({ data: [...] }));
 */
export function mockAPIResponse<T>(
  data: T,
  options: { status?: number; ok?: boolean } = {}
): Response {
  const { status = 200, ok = true } = options;

  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as Response;
}

/**
 * Create a mock error response.
 *
 * @example
 * global.fetch = vi.fn().mockResolvedValue(mockErrorResponse(404, 'Not found'));
 */
export function mockErrorResponse(status: number, message: string): Response {
  return mockAPIResponse({ error: message }, { status, ok: false });
}

/**
 * Create a mock fetch that returns different responses based on URL.
 *
 * @example
 * global.fetch = createMockFetch({
 *   '/api/users': { data: [...] },
 *   '/api/projects': { data: [...] },
 * });
 */
export function createMockFetch(
  routes: Record<string, unknown>
): ReturnType<typeof vi.fn> {
  return vi.fn().mockImplementation((url: string) => {
    const baseUrl = getConfig().apiBaseUrl || '';
    const path = url.replace(baseUrl, '');

    for (const [route, response] of Object.entries(routes)) {
      if (path.startsWith(route)) {
        return Promise.resolve(mockAPIResponse(response));
      }
    }

    return Promise.resolve(mockErrorResponse(404, 'Not found'));
  });
}

// =============================================================================
// Auto-setup on import (if in Vitest environment)
// =============================================================================

if (typeof vi !== 'undefined') {
  beforeAll(() => {
    setupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });
}
