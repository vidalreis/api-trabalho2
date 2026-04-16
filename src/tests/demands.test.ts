import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let token: string = '';
let demandId: string = '';
let contadorId: string = '';
let empresaId: string = '';

beforeAll(async () => {
  await new Promise((r) => setTimeout(r, 500));

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'senha123',
  });
  token = loginRes.body.token ?? '';

  // Buscar IDs necessários do banco de teste
  const usersRes = await request(app)
    .get('/api/users?role=contador&limit=1')
    .set('Authorization', `Bearer ${token}`);
  contadorId = usersRes.body.data?.[0]?.id ?? '';

  const companiesRes = await request(app)
    .get('/api/companies?limit=1')
    .set('Authorization', `Bearer ${token}`);
  empresaId = companiesRes.body.data?.[0]?.id ?? '';
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('Demands — GET /api/demands', () => {
  it('deve listar demandas com paginação', async () => {
    const res = await request(app).get('/api/demands').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      demandId = res.body.data[0].id;
    }
  });

  it('deve filtrar por status', async () => {
    const res = await request(app).get('/api/demands?status=pendente').set(auth());
    expect(res.status).toBe(200);
    res.body.data.forEach((d: { status: string }) => expect(d.status).toBe('pendente'));
  });

  it('deve filtrar por prioridade', async () => {
    const res = await request(app).get('/api/demands?priority=alta').set(auth());
    expect(res.status).toBe(200);
    res.body.data.forEach((d: { priority: string }) => expect(d.priority).toBe('alta'));
  });

  it('deve buscar por título', async () => {
    const res = await request(app).get('/api/demands?search=Demanda').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('deve ordenar por dueDate asc', async () => {
    const res = await request(app).get('/api/demands?orderBy=dueDate&order=asc').set(auth());
    expect(res.status).toBe(200);
    const dates = res.body.data.map((d: { dueDate: string }) => new Date(d.dueDate).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]!);
    }
  });

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/api/demands');
    expect(res.status).toBe(401);
  });
});

describe('Demands — POST /api/demands', () => {
  it('deve criar demanda com dados válidos', async () => {
    if (!contadorId || !empresaId) {
      console.warn('Pulando teste: IDs não disponíveis');
      return;
    }
    const res = await request(app)
      .post('/api/demands')
      .set(auth())
      .send({
        title: 'Demanda Criada no Teste',
        description: 'Descrição detalhada desta demanda de teste automatizado.',
        assignedToId: contadorId,
        companyId: empresaId,
        dueDate: '2026-12-31T23:59:59.000Z',
        status: 'pendente',
        priority: 'alta',
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Demanda Criada no Teste');
    expect(res.body).toHaveProperty('assignedTo');
    expect(res.body).toHaveProperty('company');
    demandId = res.body.id;
  });

  it('deve retornar 400 sem campos obrigatórios', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set(auth())
      .send({ title: 'Sem outros campos' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('deve retornar 400 com descrição muito curta', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set(auth())
      .send({
        title: 'Demanda',
        description: 'Curta',
        assignedToId: contadorId || '00000000-0000-0000-0000-000000000000',
        companyId: empresaId || '00000000-0000-0000-0000-000000000000',
        dueDate: '2026-12-31T00:00:00.000Z',
      });
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 com status inválido', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set(auth())
      .send({
        title: 'Demanda Inválida',
        description: 'Descrição longa o suficiente para passar.',
        assignedToId: contadorId || '00000000-0000-0000-0000-000000000000',
        companyId: empresaId || '00000000-0000-0000-0000-000000000000',
        dueDate: '2026-12-31T00:00:00.000Z',
        status: 'status_invalido',
      });
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 com usuário inexistente', async () => {
    const res = await request(app)
      .post('/api/demands')
      .set(auth())
      .send({
        title: 'Demanda Teste 404',
        description: 'Descrição longa o suficiente para ser válida.',
        assignedToId: '00000000-0000-0000-0000-000000000000',
        companyId: empresaId || '00000000-0000-0000-0000-000000000001',
        dueDate: '2026-12-31T00:00:00.000Z',
      });
    expect(res.status).toBe(404);
  });
});

describe('Demands — GET /api/demands/:id', () => {
  it('deve retornar demanda por ID com JOINs', async () => {
    if (!demandId) {
      console.warn('Pulando teste: demandId não disponível');
      return;
    }
    const res = await request(app).get(`/api/demands/${demandId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('assignedTo');
    expect(res.body).toHaveProperty('company');
    expect(res.body.assignedTo).toHaveProperty('name');
    expect(res.body.company).toHaveProperty('name');
  });

  it('deve retornar 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/demands/00000000-0000-0000-0000-000000000000')
      .set(auth());
    expect(res.status).toBe(404);
  });
});

describe('Demands — PATCH /api/demands/:id', () => {
  it('deve atualizar status da demanda', async () => {
    if (!demandId) {
      console.warn('Pulando teste: demandId não disponível');
      return;
    }
    const res = await request(app)
      .patch(`/api/demands/${demandId}`)
      .set(auth())
      .send({ status: 'em_progresso' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_progresso');
  });

  it('deve retornar 400 com status inválido', async () => {
    if (!demandId) return;
    const res = await request(app)
      .patch(`/api/demands/${demandId}`)
      .set(auth())
      .send({ status: 'invalido' });
    expect(res.status).toBe(400);
  });
});

describe('Demands — DELETE /api/demands/:id', () => {
  it('deve retornar 204 ao deletar demanda', async () => {
    if (!demandId) {
      console.warn('Pulando teste: demandId não disponível');
      return;
    }
    const res = await request(app).delete(`/api/demands/${demandId}`).set(auth());
    expect(res.status).toBe(204);
  });

  it('deve retornar 404 após deletar', async () => {
    if (!demandId) return;
    const res = await request(app).get(`/api/demands/${demandId}`).set(auth());
    expect(res.status).toBe(404);
  });
});
