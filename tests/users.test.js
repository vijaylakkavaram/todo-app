/**
 * ESSENTIAL MINIMAL TEST SUITE - TASK MANAGER API
 * 35 critical test cases covering all endpoints
 * 
 * Quick start: Copy this into __tests__/integration/server.test.js
 */

const request = require('supertest');
const app = require('../src/server'); // Update path to your app

describe('Task Manager API - Essential Tests', () => {

  // ========== CREATE TASK TESTS ==========
  describe('POST /api/tasks - Create', () => {
    
    test('should create task with title only', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test Task' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test Task');
      expect(res.body.data.id).toBeDefined();
    });

    test('should create with all fields', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Full Task',
          description: 'Description here',
          priority: 'high',
          status: 'in-progress',
          dueDate: '2024-12-31',
          tags: ['work', 'urgent']
        });

      expect(res.status).toBe(201);
      expect(res.body.data.priority).toBe('high');
      expect(res.body.data.status).toBe('in-progress');
      expect(res.body.data.tags).toEqual(['work', 'urgent']);
    });

    test('should trim whitespace from title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: '   Spaced Task   ' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Spaced Task');
    });

    test('should use defaults (priority=medium, status=todo)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task' });

      expect(res.body.data.priority).toBe('medium');
      expect(res.body.data.status).toBe('todo');
    });

    test('should fail without title (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Title is required');
    });

    test('should fail with empty title (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    test('should fail with invalid priority (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task', priority: 'critical' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid priority');
    });

    test('should fail with invalid status (400)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task', status: 'completed' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status');
    });
  });

  // ========== LIST TASKS TESTS ==========
  describe('GET /api/tasks - List', () => {

    test('should return all tasks', async () => {
      const res = await request(app)
        .get('/api/tasks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.count).toBeGreaterThanOrEqual(0);
    });

    test('should filter by status=todo', async () => {
      // Create a task first
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Todo task', status: 'todo' });

      const res = await request(app)
        .get('/api/tasks?status=todo');

      expect(res.status).toBe(200);
      res.body.data.forEach(task => {
        expect(task.status).toBe('todo');
      });
    });

    test('should filter by status=in-progress', async () => {
      const res = await request(app)
        .get('/api/tasks?status=in-progress');

      expect(res.status).toBe(200);
      res.body.data.forEach(task => {
        expect(task.status).toBe('in-progress');
      });
    });

    test('should filter by status=done', async () => {
      const res = await request(app)
        .get('/api/tasks?status=done');

      expect(res.status).toBe(200);
      res.body.data.forEach(task => {
        expect(task.status).toBe('done');
      });
    });

    test('should filter by priority=high', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high');

      expect(res.status).toBe(200);
      res.body.data.forEach(task => {
        expect(task.priority).toBe('high');
      });
    });

    test('should search by title', async () => {
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Searchable Task Title' });

      const res = await request(app)
        .get('/api/tasks?search=searchable');

      expect(res.status).toBe(200);
      expect(res.body.data.some(t => t.title.includes('Searchable'))).toBe(true);
    });

    test('should filter by tags', async () => {
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Task', tags: ['testtag'] });

      const res = await request(app)
        .get('/api/tasks?tags=testtag');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('should sort by createdAt (newest first)', async () => {
      const res = await request(app)
        .get('/api/tasks');

      const dates = res.body.data.map(t => new Date(t.createdAt));
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });
  });

  // ========== GET SINGLE TASK TESTS ==========
  describe('GET /api/tasks/:id - Get Single', () => {

    let taskId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to retrieve' });

      taskId = res.body.data.id;
    });

    test('should retrieve task by ID', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(taskId);
    });

    test('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .get('/api/tasks/99999');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Task not found');
    });
  });

  // ========== UPDATE TASK TESTS ==========
  describe('PATCH /api/tasks/:id - Update', () => {

    let taskId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Original', priority: 'low', status: 'todo' });

      taskId = res.body.data.id;
    });

    test('should update title', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    test('should update priority', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ priority: 'high' });

      expect(res.status).toBe(200);
      expect(res.body.data.priority).toBe('high');
    });

    test('should update status', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ status: 'in-progress' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in-progress');
    });

    test('should update multiple fields', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ 
          title: 'Multi Update',
          status: 'done',
          priority: 'low'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Multi Update');
      expect(res.body.data.status).toBe('done');
      expect(res.body.data.priority).toBe('low');
    });

    test('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .patch('/api/tasks/99999')
        .send({ title: 'Update' });

      expect(res.status).toBe(404);
    });

    test('should fail with invalid priority', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ priority: 'invalid' });

      expect(res.status).toBe(400);
    });

    test('should fail with invalid status', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
    });
  });

  // ========== DELETE TASK TESTS ==========
  describe('DELETE /api/tasks/:id - Delete', () => {

    test('should delete task', async () => {
      // Create task
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ title: 'Task to delete' });

      const taskId = createRes.body.data.id;

      // Delete it
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted');
    });

    test('should remove from database', async () => {
      // Create task
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ title: 'To be deleted' });

      const taskId = createRes.body.data.id;

      // Delete it
      await request(app)
        .delete(`/api/tasks/${taskId}`);

      // Try to get it
      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(getRes.status).toBe(404);
    });

    test('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .delete('/api/tasks/99999');

      expect(res.status).toBe(404);
    });
  });

  // ========== STATS AND HEALTH ==========
  describe('GET /api/stats - Statistics', () => {

    test('should return stats with all fields', async () => {
      const res = await request(app)
        .get('/api/stats');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('todo');
      expect(res.body.data).toHaveProperty('inProgress');
      expect(res.body.data).toHaveProperty('done');
      expect(res.body.data).toHaveProperty('high');
      expect(res.body.data).toHaveProperty('medium');
      expect(res.body.data).toHaveProperty('low');
    });
  });

  describe('GET /health - Health Check', () => {

    test('should return ok status', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.uptime).toBeGreaterThan(0);
      expect(res.body.tasks).toBeGreaterThanOrEqual(0);
    });
  });

  // ========== INTEGRATION TESTS ==========
  describe('🎯 Complete CRUD Workflow', () => {

    test('should complete full CRUD cycle', async () => {
      // CREATE
      const createRes = await request(app)
        .post('/api/tasks')
        .send({ title: 'CRUD Test', priority: 'low' });

      expect(createRes.status).toBe(201);
      const taskId = createRes.body.data.id;

      // READ
      const readRes = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.title).toBe('CRUD Test');

      // UPDATE
      const updateRes = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ status: 'done', priority: 'high' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.status).toBe('done');

      // DELETE
      const deleteRes = await request(app)
        .delete(`/api/tasks/${taskId}`);

      expect(deleteRes.status).toBe(200);

      // VERIFY DELETED
      const finalRes = await request(app)
        .get(`/api/tasks/${taskId}`);

      expect(finalRes.status).toBe(404);
    });
  });
});

/**
 * RUN TESTS:
 * npm test
 * npm run test:watch
 * npm run test:coverage
 * 
 * Total: 35 essential tests covering all endpoints
 */
