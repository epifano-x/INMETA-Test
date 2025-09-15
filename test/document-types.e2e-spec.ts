import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DocumentTypesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/document-types (POST)', async () => {
    const payload = {
      code: 'CTPS',
      name: 'Carteira de Trabalho',
      description: 'Documento trabalhista',
      validityPeriodMonths: 0,
      isMandatory: true,
    };

    const res = await request(app.getHttpServer())
      .post('/document-types')
      .send(payload);

    expect([201, 409]).toContain(res.status); // 201 criado ou 409 se já existir
  });
});