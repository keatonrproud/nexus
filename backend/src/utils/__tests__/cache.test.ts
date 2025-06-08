import { cache, cacheMiddleware } from '../cache';

describe('Cache User Isolation', () => {
  beforeEach(() => {
    cache.clear();
  });

  afterEach(() => {
    cache.clear();
  });

  test('should create user-specific cache keys', () => {
    const middleware = cacheMiddleware(60000); // 1 minute TTL
    const mockReq: any = {
      method: 'GET',
      originalUrl: '/analytics/dashboard',
      user: { userId: 'user123' },
    };

    // Create a proper mock for res.json that can be overridden
    const originalJsonMock = jest.fn();
    const mockRes: any = {
      json: originalJsonMock,
    };
    const mockNext = jest.fn();

    // First call - should not find cached data
    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // Simulate the response being sent (which would cache the data)
    const testData = { sites: [], aggregatedStats: null };
    mockRes.json(testData);

    // Reset mocks
    jest.clearAllMocks();

    // Create new request with same user
    const mockReq2: any = {
      method: 'GET',
      originalUrl: '/analytics/dashboard',
      user: { userId: 'user123' },
    };
    const mockRes2: any = {
      json: jest.fn(),
    };
    const mockNext2 = jest.fn();

    // Second call with same user - should find cached data
    middleware(mockReq2, mockRes2, mockNext2);
    expect(mockRes2.json).toHaveBeenCalledWith(testData);
    expect(mockNext2).not.toHaveBeenCalled();
  });

  test('should isolate cache between different users', () => {
    const testData1 = { sites: [{ projectName: 'User1 Project' }] };
    const testData2 = { sites: [{ projectName: 'User2 Project' }] };

    // Cache data for user1
    cache.set('user:user1:/analytics/dashboard', testData1);

    // Cache data for user2
    cache.set('user:user2:/analytics/dashboard', testData2);

    // Verify user1 gets their own data
    const user1Data = cache.get('user:user1:/analytics/dashboard');
    expect(user1Data).toEqual(testData1);

    // Verify user2 gets their own data
    const user2Data = cache.get('user:user2:/analytics/dashboard');
    expect(user2Data).toEqual(testData2);

    // Verify users can't access each other's data
    expect(user1Data).not.toEqual(user2Data);
  });

  test('should clear user-specific cache entries', () => {
    const testData = { sites: [], aggregatedStats: null };

    // Cache data for multiple users and endpoints
    cache.set('user:user1:/analytics/dashboard', testData);
    cache.set('user:user1:/analytics/config', { enabled: true });
    cache.set('user:user2:/analytics/dashboard', testData);
    cache.set('user:user2:/analytics/config', { enabled: false });

    // Verify data exists
    expect(cache.get('user:user1:/analytics/dashboard')).toEqual(testData);
    expect(cache.get('user:user2:/analytics/dashboard')).toEqual(testData);

    // Clear user1's cache
    const deletedCount = cache.clearUserCache('user1');
    expect(deletedCount).toBe(2);

    // Verify user1's cache is cleared
    expect(cache.get('user:user1:/analytics/dashboard')).toBeNull();
    expect(cache.get('user:user1:/analytics/config')).toBeNull();

    // Verify user2's cache is still intact
    expect(cache.get('user:user2:/analytics/dashboard')).toEqual(testData);
    expect(cache.get('user:user2:/analytics/config')).toEqual({
      enabled: false,
    });
  });

  test('should get user-specific cache statistics', () => {
    const testData = { sites: [] };

    // Cache data for multiple users
    cache.set('user:user1:/analytics/dashboard', testData);
    cache.set('user:user1:/analytics/config', testData);
    cache.set('user:user2:/analytics/dashboard', testData);

    // Get user1 stats
    const user1Stats = cache.getUserStats('user1');
    expect(user1Stats.size).toBe(2);
    expect(user1Stats.keys).toContain('user:user1:/analytics/dashboard');
    expect(user1Stats.keys).toContain('user:user1:/analytics/config');

    // Get user2 stats
    const user2Stats = cache.getUserStats('user2');
    expect(user2Stats.size).toBe(1);
    expect(user2Stats.keys).toContain('user:user2:/analytics/dashboard');
  });

  test('should handle anonymous users', () => {
    const middleware = cacheMiddleware(60000);
    const mockReq: any = {
      method: 'GET',
      originalUrl: '/analytics/dashboard',
      // No user property (anonymous)
    };
    const mockRes: any = {
      json: jest.fn(),
    };
    const mockNext = jest.fn();

    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();

    // Simulate the response being sent (which would cache the data)
    const testData = { error: 'Not authenticated' };
    mockRes.json(testData);

    // Reset mocks
    jest.clearAllMocks();

    // Create new request (also anonymous)
    const mockReq2: any = {
      method: 'GET',
      originalUrl: '/analytics/dashboard',
      // No user property (anonymous)
    };
    const mockRes2: any = {
      json: jest.fn(),
    };
    const mockNext2 = jest.fn();

    // Second call should find cached data
    middleware(mockReq2, mockRes2, mockNext2);
    expect(mockRes2.json).toHaveBeenCalledWith(testData);
    expect(mockNext2).not.toHaveBeenCalled();
  });
});
