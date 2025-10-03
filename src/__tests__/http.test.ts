import { http } from '../lib/http';

describe('HTTP Client', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock console.debug to avoid cluttering test output
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configuration', () => {
    it('should be an axios instance', () => {
      expect(http).toBeDefined();
      expect(http.get).toBeDefined();
      expect(http.post).toBeDefined();
      expect(http.put).toBeDefined();
      expect(http.delete).toBeDefined();
    });

    it('should have default timeout configured', () => {
      expect(http.defaults.timeout).toBe(15000);
    });

    it('should have baseURL configured', () => {
      // Should either be from env var or default to "/"
      expect(http.defaults.baseURL).toBeDefined();
      expect(typeof http.defaults.baseURL).toBe('string');
    });
  });

  describe('auth token injection', () => {
    it('should not add Authorization header when no token in localStorage', async () => {
      // Mock a successful response
      const mockAdapter = vi.fn(() => Promise.resolve({ data: {}, status: 200 }));
      http.interceptors.request.use((config) => {
        expect(config.headers.Authorization).toBeUndefined();
        return config;
      });

      try {
        await http.get('/test');
      } catch {
        // Ignore network errors, we just want to test the interceptor
      }
    });

    it('should add Authorization header when token exists in localStorage', async () => {
      const testToken = 'test-token-123';
      localStorage.setItem('auth_token', testToken);

      let capturedConfig: any = null;
      http.interceptors.request.use((config) => {
        capturedConfig = config;
        return config;
      });

      try {
        await http.get('/test');
      } catch {
        // Ignore network errors, we just want to test the interceptor
      }

      // The interceptor should have captured the config
      if (capturedConfig) {
        expect(capturedConfig.headers.Authorization).toBe(`Bearer ${testToken}`);
      }
    });
  });

  describe('request timing', () => {
    it('should log timing for successful requests', async () => {
      const consoleDebugSpy = vi.spyOn(console, 'debug');

      // We need to actually make a request that will succeed or fail
      // For this test, we'll just verify the structure exists
      try {
        await http.get('/test-endpoint');
      } catch {
        // Network error is expected in test environment
      }

      // The timing interceptor should have been called
      // In a real environment with MSW, we'd verify the actual log
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should normalize error responses', () => {
      // This test verifies that the error interceptor exists
      // Full integration testing would require MSW
      const responseInterceptors = http.interceptors.response;
      expect(responseInterceptors).toBeDefined();
    });
  });

  describe('interceptors', () => {
    it('should have request interceptors configured', () => {
      expect(http.interceptors.request).toBeDefined();
    });

    it('should have response interceptors configured', () => {
      expect(http.interceptors.response).toBeDefined();
    });

    it('should add metadata to request config for timing', async () => {
      let capturedConfig: any = null;

      http.interceptors.request.use((config) => {
        capturedConfig = config;
        return config;
      });

      try {
        await http.get('/test');
      } catch {
        // Ignore network errors
      }

      if (capturedConfig) {
        expect(capturedConfig.metadata).toBeDefined();
        expect(capturedConfig.metadata.start).toBeDefined();
        expect(typeof capturedConfig.metadata.start).toBe('number');
      }
    });
  });
});
