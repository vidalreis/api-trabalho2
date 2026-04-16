import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

let token: string = '';
let companyId: string = '';

// Login é feito no beforeAll — usa o banco de teste montado em setup.ts
beforeAll(async () => {
  // Dar tempo para o setup criar os dados
  await new Promise((r) => setTimeout(r, 500));

  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'senha123',
  });
  token = loginRes.body.token ?? '';
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('Companies — GET /api/companies', () => {
  it('deve listar empresas com paginação', async () => {
    const res = await request(app).get('/api/companies').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.data)).toBe(true);
    // Capturar um ID para testes posteriores
    if (res.body.data.length > 0) {
      companyId = res.body.data[0].id;
    }
  });

  it('deve filtrar por status', async () => {
    const res = await request(app).get('/api/companies?status=ativo').set(auth());
    expect(res.status).toBe(200);
    res.body.data.forEach((c: { status: string }) => expect(c.status).toBe('ativo'));
  });

  it('deve buscar por nome', async () => {
    const res = await request(app).get('/api/companies?search=Empresa').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('deve paginar corretamente', async () => {
    const res = await request(app).get('/api/companies?page=1&limit=1').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.pagination.limit).toBe(1);
  });

  it('deve retornar 401 sem autenticação', async () => {
    const res = await request(app).get('/api/companies');
    expect(res.status).toBe(401);
  });
});

describe('Companies — POST /api/companies', () => {
  it('deve criar empresa com dados válidos', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(auth())
      .send({ name: 'Nova Empresa LTDA', cnpj: '99.999.999/0001-99', status: 'ativo' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Nova Empresa LTDA');
    companyId = res.body.id;
  });

  it('deve retornar 400 sem campos obrigatórios', async () => {
    const res = await request(app).post('/api/companies').set(auth()).send({ name: 'Sem CNPJ' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('deve retornar 400 com CNPJ no formato errado', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(auth())
      .send({ name: 'Empresa Invalida', cnpj: '12345678000190' });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('cnpj');
  });

  it('deve retornar 409 com CNPJ duplicado', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set(auth())
      .send({ name: 'Duplicada', cnpj: '11.111.111/0001-11' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/CNPJ/);
  });
});

describe('Companies — GET /api/companies/:id', () => {
  it('deve retornar empresa por ID com relacionamentos', async () => {
    const res = await request(app).get(`/api/companies/${companyId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('demands');
    expect(res.body).toHaveProperty('checklists');
    expect(res.body).toHaveProperty('_count');
  });

  it('deve retornar 404 com ID inexistente', async () => {
    const res = await request(app)
      .get('/api/companies/00000000-0000-0000-0000-000000000000')
      .set(auth());
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Empresa/);
  });
});

describe('Companies — PATCH /api/companies/:id', () => {
  it('deve atualizar nome da empresa', async () => {
    const res = await request(app)
      .patch(`/api/companies/${companyId}`)
      .set(auth())
      .send({ name: 'Nova Empresa Atualizada' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Nova Empresa Atualizada');
  });

  it('deve retornar 404 ao atualizar empresa inexistente', async () => {
    const res = await request(app)
      .patch('/api/companies/00000000-0000-0000-0000-000000000000')
      .set(auth())
      .send({ name: 'Fantasma' });
    expect(res.status).toBe(404);
  });
});

describe('Companies — DELETE /api/companies/:id', () => {
  it('deve deletar empresa existente e retornar 204', async () => {
    const res = await request(app).delete(`/api/companies/${companyId}`).set(auth());
    expect(res.status).toBe(204);
  });

  it('deve retornar 404 ao deletar empresa inexistente', async () => {
    const res = await request(app)
      .delete('/api/companies/00000000-0000-0000-0000-000000000000')
      .set(auth());
    expect(res.status).toBe(404);
  });
});
