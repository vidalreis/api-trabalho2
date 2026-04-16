import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Auth — POST /api/auth/register', () => {
  it('deve retornar 201 ao registrar um novo usuário', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Novo Usuário Teste',
      email: `novo.${Date.now()}@test.com`,
      password: 'senha123',
      role: 'contador',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });

  it('deve retornar 400 com campos obrigatórios faltando', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'incompleto@test.com',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('details');
  });

  it('deve retornar 400 com email inválido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Usuario',
      email: 'email-invalido',
      password: 'senha123',
      role: 'contador',
    });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('email');
  });

  it('deve retornar 400 com role inválido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Usuario',
      email: 'valido@test.com',
      password: 'senha123',
      role: 'superpoder',
    });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('role');
  });

  it('deve retornar 400 com senha muito curta', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Usuario',
      email: 'valido2@test.com',
      password: '123',
      role: 'contador',
    });
    expect(res.status).toBe(400);
  });

  it('deve retornar 409 ao registrar email duplicado', async () => {
    const body = {
      name: 'Usuario Dup',
      email: `dup.${Date.now()}@test.com`,
      password: 'senha123',
      role: 'contador',
    };
    await request(app).post('/api/auth/register').send(body);
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/E-mail/);
  });
});

describe('Auth — POST /api/auth/login', () => {
  it('deve retornar 200 com token JWT ao fazer login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'senha123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('deve retornar 400 com campos faltando', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@test.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('deve retornar 401 com email inexistente', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'inexistente@test.com',
      password: 'senha123',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas.');
  });

  it('deve retornar 401 com senha incorreta', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'senhaerrada',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas.');
  });

  it('deve retornar 401 ao acessar rota protegida sem token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Token não fornecido.');
  });

  it('deve retornar 401 com token inválido', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer token.invalido.jwt');
    expect(res.status).toBe(401);
  });
});

describe('Health Check', () => {
  it('GET /health deve retornar status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });
});
