import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config
jest.mock('../config/index', () => ({
  config: {
    goatcounter: {
      apiToken: 'test-token',
    },
  },
}));

// Unmock analytics for this test file
jest.unmock('../config/analytics');

// Import the actual implementation after mocking dependencies
import { goatcounterClient } from '../config/analytics';

describe('GoatCounter Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GoatCounterClient', () => {
    it('should fetch hits successfully', async () => {
      const mockResponse = {
        data: {
          hits: [
            {
              count: 500,
              path_id: 1,
              path: '/home',
              event: false,
              title: 'Home Page',
              max: 500,
              stats: [{ day: '2024-01-01', hourly: [10, 20, 30], daily: 60 }],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await goatcounterClient.getHits(
        'test-site',
        'test-token',
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-site.goatcounter.com/api/v0/stats/hits',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            'User-Agent': 'Nexus/1.0',
          },
          params: {
            start: '2024-01-01',
            end: '2024-01-31',
          },
          timeout: 10000,
        }
      );

      expect(result).toEqual(mockResponse.data.hits);
    });

    it('should fetch total count successfully', async () => {
      const mockResponse = {
        data: {
          total: 1000,
          total_events: 50,
          total_utc: 1000,
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await goatcounterClient.getTotalCount(
        'test-site',
        'test-token',
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-site.goatcounter.com/api/v0/stats/total',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            'User-Agent': 'Nexus/1.0',
          },
          params: {
            start: '2024-01-01',
            end: '2024-01-31',
          },
          timeout: 10000,
        }
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch stats page successfully', async () => {
      const mockResponse = {
        data: {
          stats: [
            { id: '1', name: 'Chrome', count: 500 },
            { id: '2', name: 'Firefox', count: 300 },
          ],
        },
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await goatcounterClient.getStatsPage(
        'test-site',
        'test-token',
        'browsers',
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-site.goatcounter.com/api/v0/stats/browsers',
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            'User-Agent': 'Nexus/1.0',
          },
          params: {
            start: '2024-01-01',
            end: '2024-01-31',
          },
          timeout: 10000,
        }
      );

      expect(result).toEqual(mockResponse.data.stats);
    });

    it('should track pageview successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

      await goatcounterClient.trackPageview(
        'test-site',
        'test-token',
        '/test-page',
        'Test Page',
        'https://example.com'
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-site.goatcounter.com/api/v0/count',
        {
          no_sessions: false,
          hits: [
            {
              path: '/test-page',
              title: 'Test Page',
              ref: 'https://example.com',
              size: [0, 0],
            },
          ],
        },
        {
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            'User-Agent': 'Nexus/1.0',
          },
          timeout: 10000,
        }
      );
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(
        goatcounterClient.getHits(
          'test-site',
          'test-token',
          '2024-01-01',
          '2024-01-31'
        )
      ).rejects.toThrow('Failed to fetch hits data from GoatCounter');
    });

    it('should not throw error for tracking failures', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Tracking Error'));

      // Should not throw
      await expect(
        goatcounterClient.trackPageview('test-site', 'test-token', '/test-page')
      ).resolves.toBeUndefined();
    });
  });
});
