import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/checklists
router.get('/', async (_req: Request, res: Response) => {
  try {
    const checklists = await prisma.checklist.findMany({
      include: {
        company: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(checklists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar checklists.' });
  }
});

// GET /api/checklists/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: { company: true, items: true },
    });
    if (!checklist) { res.status(404).json({ error: 'Checklist não encontrado.' }); return; }
    res.json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar checklist.' });
  }
});

// POST /api/checklists
router.post('/', async (req: Request, res: Response) => {
  const title = req.body['title'] as string | undefined;
  const companyId = req.body['companyId'] as string | undefined;
  const serviceType = req.body['serviceType'] as string | undefined;
  const items = req.body['items'] as any[] | undefined;

  if (!title || !companyId || !serviceType) {
    res.status(400).json({ error: 'Título, empresa e tipo de serviço são obrigatórios.' });
    return;
  }
  try {
    const checklist = await prisma.checklist.create({
      data: {
        title,
        companyId,
        serviceType,
        items: items?.length
          ? { create: items.map((item: any) => ({ title: item.title as string, priority: (item.priority ?? 'media') as any, completed: false })) }
          : undefined,
      },
      include: { company: true, items: true },
    });
    res.status(201).json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar checklist.' });
  }
});

// PATCH /api/checklists/:id/items/:itemId — marcar item como completo
router.patch('/:id/items/:itemId', async (req: Request, res: Response) => {
  const itemId = req.params['itemId'] as string;
  const completed = req.body['completed'] as boolean | undefined;
  try {
    const item = await prisma.checklistItem.update({
      where: { id: itemId },
      data: { completed },
    });
    res.json(item);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Item não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar item.' });
  }
});

// DELETE /api/checklists/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    await prisma.checklist.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Checklist não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar checklist.' });
  }
});

export default router;
