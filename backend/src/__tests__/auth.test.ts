import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Auth API', () => {
  it('POST /api/auth/login with invalid body returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });

  it('GET /api/teacher/assignments without token returns 401', async () => {
    const res = await request(app).get('/api/teacher/assignments');
    expect(res.status).toBe(401);
  });
});
