import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/companies
router.get('/', async (_req: Request, res: Response) => {
  try {
    const companies = await prisma.company.findMany({ orderBy: { name: 'asc' } });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar empresas.' });
  }
});

// GET /api/companies/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar empresa.' });
  }
});

// POST /api/companies
router.post('/', async (req: Request, res: Response) => {
  const name = req.body['name'] as string | undefined;
  const cnpj = req.body['cnpj'] as string | undefined;
  const status = req.body['status'] as string | undefined;
  if (!name || !cnpj) { res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' }); return; }
  try {
    const company = await prisma.company.create({ data: { name, cnpj, status: (status ?? 'ativo') as any } });
    res.status(201).json(company);
  } catch (err: any) {
    if (err.code === 'P2002') { res.status(409).json({ error: 'CNPJ já cadastrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar empresa.' });
  }
});

// PATCH /api/companies/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const name = req.body['name'] as string | undefined;
  const cnpj = req.body['cnpj'] as string | undefined;
  const status = req.body['status'] as string | undefined;
  try {
    const company = await prisma.company.update({
      where: { id },
      data: { ...(name && { name }), ...(cnpj && { cnpj }), ...(status && { status: status as any }) },
    });
    res.json(company);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar empresa.' });
  }
});

// DELETE /api/companies/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    await prisma.company.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar empresa.' });
  }
});

export default router;
