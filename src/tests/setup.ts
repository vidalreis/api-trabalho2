/**
 * setup.ts — Configuração global dos testes.
 *
 * Usa banco SQLite em arquivo temporário de teste isolado.
 * Roda migrations e seed antes de todos os testes.
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { beforeAll, afterAll } from 'vitest';

// Banco de dados de teste isolado
process.env['DATABASE_URL'] = 'file:./test.db';
process.env['JWT_SECRET'] = 'test-secret-key-for-vitest';
process.env['NODE_ENV'] = 'test';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Criar/atualizar schema no banco de teste
  execSync('npx prisma db push --force-reset', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
    stdio: 'pipe',
  });

  // Popular banco com dados mínimos para testes
  const senhaHash = await bcrypt.hash('senha123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Admin Test', email: 'admin@test.com', password: senhaHash, role: 'dono' },
  });

  const gerente = await prisma.user.create({
    data: { name: 'Gerente Test', email: 'gerente@test.com', password: senhaHash, role: 'gerente' },
  });

  const contador = await prisma.user.create({
    data: { name: 'Contador Test', email: 'contador@test.com', password: senhaHash, role: 'contador' },
  });

  const empresa = await prisma.company.create({
    data: { name: 'Empresa Teste S.A.', cnpj: '11.111.111/0001-11', status: 'ativo' },
  });

  await prisma.company.create({
    data: { name: 'Empresa Secundaria Ltda', cnpj: '22.222.222/0001-22', status: 'ativo' },
  });

  await prisma.demand.create({
    data: {
      title: 'Demanda de Teste',
      description: 'Descrição completa da demanda de teste para validação.',
      status: 'pendente',
      priority: 'alta',
      dueDate: new Date('2026-12-31'),
      assignedToId: contador.id,
      companyId: empresa.id,
    },
  });

  const template = await prisma.checklistTemplate.create({
    data: {
      title: 'Template de Teste',
      description: 'Template para testes automatizados.',
      createdById: gerente.id,
      items: {
        create: [
          { title: 'Item 1 do template', priority: 'alta' },
          { title: 'Item 2 do template', priority: 'media' },
        ],
      },
    },
  });

  await prisma.checklistAssignment.create({
    data: {
      templateId: template.id,
      assignedToId: contador.id,
      assignedById: gerente.id,
      companyId: empresa.id,
      dueDate: new Date('2026-12-31'),
      status: 'pendente',
      items: {
        create: [
          { title: 'Item 1 do template', priority: 'alta', completed: false },
          { title: 'Item 2 do template', priority: 'media', completed: false },
        ],
      },
    },
  });

  // Salvar IDs globalmente para uso nos testes
  (global as Record<string, unknown>)['testData'] = {
    adminId: admin.id,
    gerenteId: gerente.id,
    contadorId: contador.id,
    empresaId: empresa.id,
    templateId: template.id,
  };
});

afterAll(async () => {
  await prisma.$disconnect();
});
