import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/assignments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assignments = await prisma.checklistAssignment.findMany({
      include: {
        template: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar atribuições.' });
  }
});

// POST /api/assignments — cria atribuição copiando os itens do template
router.post('/', async (req: AuthRequest, res: Response) => {
  const templateId = req.body['templateId'] as string | undefined;
  const assignedToId = req.body['assignedToId'] as string | undefined;
  const companyId = req.body['companyId'] as string | undefined;
  const dueDate = req.body['dueDate'] as string | undefined;

  if (!templateId || !assignedToId || !companyId || !dueDate) {
    res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    return;
  }
  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      include: { items: true },
    });
    if (!template) { res.status(404).json({ error: 'Template não encontrado.' }); return; }

    const assignment = await prisma.checklistAssignment.create({
      data: {
        templateId,
        assignedToId,
        assignedById: req.userId!,
        companyId,
        dueDate: new Date(dueDate),
        status: 'pendente',
        items: {
          create: template.items.map((item) => ({
            title: item.title,
            priority: item.priority,
            completed: false,
          })),
        },
      },
      include: {
        template: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        items: true,
      },
    });
    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar atribuição.' });
  }
});

// PATCH /api/assignments/:id — atualizar status
router.patch('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const status = req.body['status'] as string | undefined;
  try {
    const assignment = await prisma.checklistAssignment.update({
      where: { id },
      data: { ...(status && { status: status as any }) },
    });
    res.json(assignment);
  } catch (err: any) {
    if (err.code === 'P2025') { res.status(404).json({ error: 'Atribuição não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar atribuição.' });
  }
});

// PATCH /api/assignments/:id/items/:itemId — marcar item como completo
router.patch('/:id/items/:itemId', async (req: Request, res: Response) => {
  const itemId = req.params['itemId'] as string;
  const completed = req.body['completed'] as boolean | undefined;
  try {
    const item = await prisma.checklistAssignmentItem.update({
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

export default router;
