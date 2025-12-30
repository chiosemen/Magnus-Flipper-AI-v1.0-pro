/**
 * Unit tests for API client
 * 
 * Tests:
 * - Base URL resolution
 * - Demo mode parameter injection
 * - Timeout handling
 * - Error handling
 * - Authorization header injection
 */

import { getApiBaseUrl, apiRequest } from '../../lib/api';

// Store original fetch
const originalFetch = global.fetch;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('getApiBaseUrl', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return fallback URL when env is not set', () => {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
      
      // Re-import to get fresh module
      jest.isolateModules(() => {
        const { getApiBaseUrl } = require('../../lib/api');
        expect(getApiBaseUrl()).toBe('https://magnus-api.vercel.app');
      });
    });

    it('should return env URL when set', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://custom-api.example.com';
      
      jest.isolateModules(() => {
        const { getApiBaseUrl } = require('../../lib/api');
        expect(getApiBaseUrl()).toBe('https://custom-api.example.com');
      });
    });

    it('should strip trailing slash from env URL', () => {
      process.env.EXPO_PUBLIC_API_BASE_URL = 'https://custom-api.example.com/';
      
      jest.isolateModules(() => {
        const { getApiBaseUrl } = require('../../lib/api');
        expect(getApiBaseUrl()).toBe('https://custom-api.example.com');
      });
    });
  });

  describe('apiRequest', () => {
    describe('Basic Requests', () => {
      it('should make a GET request to the correct URL', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ items: [] }),
        });

        await apiRequest('/api/demo');

        expect(global.fetch).toHaveBeenCalled();
        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain('/api/demo');
      });

      it('should set Content-Type header by default', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/test');

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(options.headers.get('Content-Type')).toBe('application/json');
      });

      it('should return response and parsed JSON', async () => {
        const mockData = { items: [{ title: 'Test' }] };
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData),
        });

        const { response, json } = await apiRequest('/api/demo');

        expect(response.ok).toBe(true);
        expect(json).toEqual(mockData);
      });
    });

    describe('Demo Mode', () => {
      it('should add demo=true parameter when demoMode is true', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/demo', {}, null, true);

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).toContain('demo=true');
      });

      it('should not add demo parameter when demoMode is false', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/demo', {}, null, false);

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        expect(url).not.toContain('demo=true');
      });

      it('should not duplicate demo parameter if already present', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/demo?demo=false', {}, null, true);

        const [url] = (global.fetch as jest.Mock).mock.calls[0];
        // Should not add another demo param
        const matches = url.match(/demo=/g);
        expect(matches?.length).toBe(1);
      });
    });

    describe('Authorization', () => {
      it('should add Authorization header when token is provided', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/usage', {}, 'test-token-123');

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(options.headers.get('Authorization')).toBe('Bearer test-token-123');
      });

      it('should not add Authorization header when token is null', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/demo', {}, null);

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(options.headers.get('Authorization')).toBeNull();
      });
    });

    describe('Timeout Handling', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should abort request after 30 seconds', async () => {
        let abortSignal: AbortSignal | undefined;
        
        (global.fetch as jest.Mock).mockImplementation((_url, options) => {
          abortSignal = options.signal;
          return new Promise((_, reject) => {
            options.signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          });
        });

        const requestPromise = apiRequest('/api/slow');

        // Fast-forward 30 seconds
        jest.advanceTimersByTime(30000);

        await expect(requestPromise).rejects.toThrow('Request timeout');
        expect(abortSignal?.aborted).toBe(true);
      });

      it('should clear timeout on successful response', async () => {
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/demo');

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
      });
    });

    describe('Error Handling', () => {
      it('should return empty object when JSON parsing fails', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON')),
        });

        const { json } = await apiRequest('/api/demo');

        expect(json).toEqual({});
      });

      it('should throw on network error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Network request failed')
        );

        await expect(apiRequest('/api/demo')).rejects.toThrow('Network request failed');
      });

      it('should handle AbortError specifically', async () => {
        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        
        (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

        await expect(apiRequest('/api/demo')).rejects.toThrow('Request timeout');
      });

      it('should pass through other errors unchanged', async () => {
        const customError = new Error('Custom error');
        customError.name = 'CustomError';
        
        (global.fetch as jest.Mock).mockRejectedValueOnce(customError);

        await expect(apiRequest('/api/demo')).rejects.toThrow('Custom error');
      });
    });

    describe('Request Options', () => {
      it('should pass through custom headers', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/demo', {
          headers: { 'X-Custom-Header': 'test-value' },
        });

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(options.headers.get('X-Custom-Header')).toBe('test-value');
      });

      it('should allow overriding Content-Type', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        await apiRequest('/api/demo', {
          headers: { 'Content-Type': 'text/plain' },
        });

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(options.headers.get('Content-Type')).toBe('text/plain');
      });

      it('should support POST method with body', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

        const body = JSON.stringify({ query: 'test' });
        await apiRequest('/api/search', {
          method: 'POST',
          body,
        });

        const [, options] = (global.fetch as jest.Mock).mock.calls[0];
        expect(options.method).toBe('POST');
        expect(options.body).toBe(body);
      });
    });

    describe('Response Status', () => {
      it('should return response with ok=false for 4xx errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Bad request' }),
        });

        const { response, json } = await apiRequest('/api/demo');

        expect(response.ok).toBe(false);
        expect(json).toEqual({ error: 'Bad request' });
      });

      it('should return response with ok=false for 5xx errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' }),
        });

        const { response, json } = await apiRequest('/api/demo');

        expect(response.ok).toBe(false);
        expect(json).toEqual({ error: 'Internal server error' });
      });
    });
  });
});

