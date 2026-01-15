/**
 * Test Utils Verification Test
 * ============================
 *
 * Verifies that the jest-setup-collection (adapted for Vitest) is working correctly.
 * Tests custom render, matchers, and mock utilities.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  render,
  screen,
  cleanup,
  mockAPIResponse,
  mockErrorResponse,
  createMockFetch,
  createTestQueryClient,
  getTextContent,
} from '@/test-utils';

// Ensure cleanup after each test to prevent DOM pollution
afterEach(() => {
  cleanup();
});

// Simple test component
function TestComponent({ message }: { message: string }) {
  return (
    <div data-testid="test-container">
      <h1>Test Component</h1>
      <p data-testid="message">{message}</p>
    </div>
  );
}

describe('Test Utils Verification', () => {
  describe('Custom Render', () => {
    it('renders component with providers', () => {
      render(<TestComponent message="Hello World" />);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
      expect(screen.getByTestId('message')).toHaveTextContent('Hello World');
    });

    it('creates test query client without errors', () => {
      const client = createTestQueryClient();
      expect(client).toBeDefined();
      expect(client.getDefaultOptions().queries?.retry).toBe(false);
    });
  });

  describe('Custom Matchers', () => {
    it('toBeValidJSON passes for valid JSON', () => {
      expect('{"valid": true}').toBeValidJSON();
      expect('[]').toBeValidJSON();
      expect('"string"').toBeValidJSON();
    });

    it('toBeWithinRange checks number bounds', () => {
      expect(5).toBeWithinRange(1, 10);
      expect(1).toBeWithinRange(1, 10);
      expect(10).toBeWithinRange(1, 10);
    });

    it('toBeSorted checks array ordering', () => {
      expect([1, 2, 3]).toBeSorted();
      expect(['a', 'b', 'c']).toBeSorted();
    });

    it('toHaveKeys checks object keys', () => {
      expect({ a: 1, b: 2, c: 3 }).toHaveKeys(['a', 'b']);
      expect({ name: 'test', id: 123 }).toHaveKeys(['name', 'id']);
    });

    it('toMatchAPIResponse checks response structure', () => {
      const response = { status: 200, ok: true, data: { id: '1' } };
      expect(response).toMatchAPIResponse({ status: 200 });
      expect(response).toMatchAPIResponse({ ok: true });
    });

    it('toHaveBeenCalledWithMatch checks partial mock calls', () => {
      const mockFn = vi.fn();
      mockFn({ id: '123', name: 'test', timestamp: Date.now() });
      expect(mockFn).toHaveBeenCalledWithMatch({ id: '123' });
      expect(mockFn).toHaveBeenCalledWithMatch({ name: 'test' });
    });
  });

  describe('Mock Utilities', () => {
    it('mockAPIResponse creates valid response object', async () => {
      const response = mockAPIResponse({ users: [{ id: 1 }] });
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ users: [{ id: 1 }] });
    });

    it('mockErrorResponse creates error response', async () => {
      const response = mockErrorResponse(404, 'Not found');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Not found' });
    });

    it('createMockFetch routes by URL', async () => {
      const mockFetch = createMockFetch({
        '/api/users': { data: [{ id: 1 }] },
        '/api/projects': { data: [] },
      });

      const usersResponse = await mockFetch('/api/users');
      const usersData = await usersResponse.json();
      expect(usersData).toEqual({ data: [{ id: 1 }] });

      const projectsResponse = await mockFetch('/api/projects');
      const projectsData = await projectsResponse.json();
      expect(projectsData).toEqual({ data: [] });

      const notFoundResponse = await mockFetch('/api/unknown');
      expect(notFoundResponse.ok).toBe(false);
    });
  });

  describe('Helper Utilities', () => {
    it('getTextContent strips whitespace', () => {
      render(<TestComponent message="  Hello   World  " />);
      const element = screen.getByTestId('message');
      const text = getTextContent(element);
      expect(text).toBe('Hello World');
    });
  });
});
