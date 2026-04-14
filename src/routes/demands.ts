import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/demands
router.get('/', async (_req: Request, res: Response) => {
  try {
    const demands = await prisma.demand.findMany({
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(demands);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar demandas.' });
  }
});

// GET /api/demands/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        company: { select: { id: true, name: true } },
      },
    });
    if (!demand) { res.status(404).json({ error: 'Demanda não encontrada.' }); return; }
    res.json(demand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar demanda.' });
  }
});

// POST /api/demands
router.post('/', async (req: Request, res: Response) => {
  const title = req.body['title'] as string | undefined;
  const description = req.body['description'] as string | undefined;
  const status = req.body['status'] as string | undefined;
  const priority = req.body['priority'] as string | undefined;
  const assignedToId = req.body['assignedToId'] as string | undefined;
  const companyId = req.body['companyId'] as string | undefined;
  const dueDate = req.body['dueDate'] as string | undefined;

  if (!title || !description || !assignedToId || !companyId || !dueDate) {
    res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    return;
  }
  try {
    const demand = await prisma.demand.create({
      data: {
        title,
        description,
        status: (status ?? 'pendente') as any,
        priority: (priority ?? 'media') as any,
        assignedToId,
        companyId,
        dueDate: new Date(dueDate),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(demand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar demanda.' });
  }
});

// PATCH /api/demands/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const title = req.body['title'] as string | undefined;
  const description = req.body['description'] as string | undefined;
  const status = req.body['status'] as string | undefined;
  const priority = req.body['priority'] as string | undefined;
  const assignedToId = req.body['assignedToId'] as string | undefined;
  const companyId = req.body['companyId'] as string | undefined;
  const dueDate = req.body['dueDate'] as string | undefined;

  try {
    const demand = await prisma.demand.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status: status as any }),
        ...(priority && { priority: priority as any }),
        ...(assignedToId && { assignedToId }),
        ...(companyId && { companyId }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });
    res.json(demand);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Demanda não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar demanda.' });
  }
});

// DELETE /api/demands/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    await prisma.demand.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Demanda não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar demanda.' });
  }
});

export default router;
