import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Health', () => {
  it('GET /health returns 200 and status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('timestamp');
  });
});
