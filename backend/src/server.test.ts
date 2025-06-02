import request from 'supertest';
import app from './server';

describe('Server', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app).get('/api').expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'Bug Idea Board API is running!'
      );
    });
  });

  describe('GET /api/nonexistent', () => {
    it('should return 404 for unknown API routes', async () => {
      const response = await request(app).get('/api/nonexistent').expect(404);

      expect(response.body).toHaveProperty('error', 'API route not found');
    });
  });
});
