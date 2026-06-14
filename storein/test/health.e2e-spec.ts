import { INestApplication } from '@nestjs/common';
import request              from 'supertest';
import { createTestApp }    from './helpers/app.helper';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health → 200 with mongodb up', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.info?.mongodb?.status).toBe('up');
  });
});
