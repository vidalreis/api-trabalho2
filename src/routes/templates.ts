import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/templates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.checklistTemplate.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar templates.' });
  }
});

// POST /api/templates
router.post('/', async (req: AuthRequest, res: Response) => {
  const title = req.body['title'] as string | undefined;
  const description = req.body['description'] as string | undefined;
  const items = req.body['items'] as any[] | undefined;
  if (!title) { res.status(400).json({ error: 'Título é obrigatório.' }); return; }
  try {
    const template = await prisma.checklistTemplate.create({
      data: {
        title,
        description: description ?? '',
        createdById: req.userId!,
        items: items?.length
          ? { create: items.map((item: any) => ({ title: item.title as string, priority: (item.priority ?? 'media') as any })) }
          : undefined,
      },
      include: { createdBy: { select: { id: true, name: true } }, items: true },
    });
    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar template.' });
  }
});

// PATCH /api/templates/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const title = req.body['title'] as string | undefined;
  const description = req.body['description'] as string | undefined;
  const items = req.body['items'] as any[] | undefined;
  try {
    const template = await prisma.checklistTemplate.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            create: items.map((item: any) => ({ title: item.title as string, priority: (item.priority ?? 'media') as any })),
          },
        }),
      },
      include: { createdBy: { select: { id: true, name: true } }, items: true },
    });
    res.json(template);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Template não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar template.' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  try {
    await prisma.checklistTemplate.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Template não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar template.' });
  }
});

export default router;
