import request from 'supertest';
import app from '../server';
import { AuthService } from '../services/authService';

describe('Project Controller', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    // This is a simplified version - in real tests you'd mock the auth service
    const testUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      google_id: 'google-test-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    userId = testUser.id;
    const tokens = AuthService.generateTokens(testUser);
    authToken = tokens.accessToken;
  });

  describe('POST /api/projects', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        url: 'https://example.com',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.project).toMatchObject({
        name: projectData.name,
        url: projectData.url,
        user_id: userId,
      });
      expect(response.body.project.id).toBeDefined();
      expect(response.body.project.created_at).toBeDefined();
    });

    it('should return 400 for invalid project data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        url: 'not-a-valid-url',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const projectData = {
        name: 'Test Project',
        url: 'https://example.com',
      };

      await request(app).post('/api/projects').send(projectData).expect(401);
    });
  });

  describe('GET /api/projects', () => {
    it('should return user projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toBeDefined();
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.total).toBeDefined();
      expect(response.body.page).toBeDefined();
      expect(response.body.limit).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app).get('/api/projects').expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return 401 without authentication', async () => {
      await request(app).get('/api/projects/test-id').expect(401);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should return 401 without authentication', async () => {
      await request(app)
        .put('/api/projects/test-id')
        .send({ name: 'Updated Name' })
        .expect(401);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .put('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should return 401 without authentication', async () => {
      await request(app).delete('/api/projects/test-id').expect(401);
    });

    it('should return 404 for non-existent project', async () => {
      await request(app)
        .delete('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
