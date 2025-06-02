import request from 'supertest';
import app from '../server';
import { AuthService } from '../services/authService';

describe('Board Controller', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Use the seeded test user
    const testUser = {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
      google_id: '123456789',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    userId = testUser.id;
    const tokens = AuthService.generateTokens(testUser);
    authToken = tokens.accessToken;

    // Use the seeded test project
    projectId = 'test-project-1';
  });

  describe('POST /api/board/:projectId', () => {
    it('should create a new board item with valid data', async () => {
      const boardItemData = {
        title: 'Test Bug',
        description: 'This is a test bug',
        type: 'bug',
        priority: 'now',
      };

      const response = await request(app)
        .post(`/api/board/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(boardItemData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.item).toMatchObject({
        title: boardItemData.title,
        description: boardItemData.description,
        type: boardItemData.type,
        priority: boardItemData.priority,
        project_id: projectId,
      });
      expect(response.body.item.id).toBeDefined();
      expect(response.body.item.created_at).toBeDefined();
    });

    it('should create a board item with default values', async () => {
      const boardItemData = {
        title: 'Test Idea',
        type: 'idea',
      };

      const response = await request(app)
        .post(`/api/board/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(boardItemData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.item.priority).toBe('later');
    });

    it('should return 400 for invalid board item data', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        type: 'invalid-type',
      };

      const response = await request(app)
        .post(`/api/board/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const boardItemData = {
        title: 'Test Item',
        type: 'bug',
      };

      await request(app)
        .post(`/api/board/${projectId}`)
        .send(boardItemData)
        .expect(401);
    });
  });

  describe('GET /api/board/:projectId/items', () => {
    it('should return board items for a project', async () => {
      const response = await request(app)
        .get(`/api/board/${projectId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBeDefined();
      expect(response.body.limit).toBeDefined();
    });

    it('should support filtering by type', async () => {
      const response = await request(app)
        .get(`/api/board/${projectId}/items?type=bug`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get(`/api/board/${projectId}/items?status=open`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get(`/api/board/${projectId}/items?search=test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app).get(`/api/board/${projectId}/items`).expect(401);
    });
  });

  describe('GET /api/board/:projectId/stats', () => {
    it('should return board statistics', async () => {
      const response = await request(app)
        .get(`/api/board/${projectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total).toBeDefined();
      expect(response.body.stats.bugs).toBeDefined();
      expect(response.body.stats.ideas).toBeDefined();
      expect(response.body.stats.byPriority).toBeDefined();
      expect(response.body.stats.byPriority.now).toBeDefined();
      expect(response.body.stats.byPriority.later).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app).get(`/api/board/${projectId}/stats`).expect(401);
    });
  });

  describe('GET /api/board/:projectId/:itemId', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/board/${projectId}/test-item-id`)
        .expect(401);
    });

    it('should return 404 for non-existent board item', async () => {
      await request(app)
        .get(`/api/board/${projectId}/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/board/:projectId/:itemId', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .put(`/api/board/${projectId}/test-item-id`)
        .send({ title: 'Updated Title' })
        .expect(401);
    });

    it('should return 404 for non-existent board item', async () => {
      await request(app)
        .put(`/api/board/${projectId}/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);
    });
  });

  describe('DELETE /api/board/:projectId/:itemId', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .delete(`/api/board/${projectId}/test-item-id`)
        .expect(401);
    });

    it('should return 404 for non-existent board item', async () => {
      await request(app)
        .delete(`/api/board/${projectId}/non-existent-id`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/board/:projectId/bulk', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .patch(`/api/board/${projectId}/bulk`)
        .send({
          operation: 'update',
          itemIds: ['test-id'],
          updates: { status: 'closed' },
        })
        .expect(401);
    });

    it('should return 400 for invalid operation', async () => {
      await request(app)
        .patch(`/api/board/${projectId}/bulk`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'invalid',
          itemIds: ['test-id'],
        })
        .expect(400);
    });

    it('should return 400 for missing itemIds', async () => {
      await request(app)
        .patch(`/api/board/${projectId}/bulk`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operation: 'update',
          itemIds: [],
          updates: { status: 'closed' },
        })
        .expect(400);
    });
  });
});
