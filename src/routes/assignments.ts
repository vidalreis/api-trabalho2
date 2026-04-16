import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, validate, AuthRequest } from '../middleware/auth.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  updateAssignmentItemSchema,
  paginationSchema,
} from '../schemas/index.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/assignments ─────────────────────────────────────────────────────
// Filtros: status, assignedToId, companyId, templateId
// Paginação: page, limit
// Ordenação: orderBy (dueDate|createdAt|status), order (asc|desc)
router.get('/', async (req: Request, res: Response) => {
  const { status, assignedToId, companyId, templateId, orderBy = 'createdAt', order = 'desc' } = req.query as Record<string, string>;
  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where['status'] = status;
  if (assignedToId) where['assignedToId'] = assignedToId;
  if (companyId) where['companyId'] = companyId;
  if (templateId) where['templateId'] = templateId;

  const validOrderFields = ['dueDate', 'createdAt', 'updatedAt', 'status'];
  const sortField = validOrderFields.includes(orderBy) ? orderBy : 'createdAt';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  try {
    const [total, assignments] = await Promise.all([
      prisma.checklistAssignment.count({ where }),
      prisma.checklistAssignment.findMany({
        where,
        include: {
          template: { select: { id: true, title: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          assignedBy: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: assignments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar atribuições.' });
  }
});

// ── GET /api/assignments/:id ─────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const assignment = await prisma.checklistAssignment.findUnique({
      where: { id },
      include: {
        template: { select: { id: true, title: true, description: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        assignedBy: { select: { id: true, name: true, email: true, role: true } },
        company: { select: { id: true, name: true, cnpj: true } },
        items: { orderBy: [{ completed: 'asc' }, { priority: 'desc' }] },
      },
    });
    if (!assignment) { res.status(404).json({ error: 'Atribuição não encontrada.' }); return; }
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar atribuição.' });
  }
});

// ── POST /api/assignments ────────────────────────────────────────────────────
router.post('/', validate(createAssignmentSchema), async (req: AuthRequest, res: Response) => {
  const { templateId, assignedToId, companyId, dueDate } = req.body;
  try {
    const [template, user, company] = await Promise.all([
      prisma.checklistTemplate.findUnique({ where: { id: templateId }, include: { items: true } }),
      prisma.user.findUnique({ where: { id: assignedToId } }),
      prisma.company.findUnique({ where: { id: companyId } }),
    ]);

    if (!template) { res.status(404).json({ error: 'Template não encontrado.' }); return; }
    if (!user) { res.status(404).json({ error: 'Usuário responsável não encontrado.' }); return; }
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }

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

// ── PATCH /api/assignments/:id ───────────────────────────────────────────────
router.patch('/:id', validate(updateAssignmentSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, dueDate } = req.body;
  try {
    const assignment = await prisma.checklistAssignment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
    });
    res.json(assignment);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Atribuição não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar atribuição.' });
  }
});

// ── PATCH /api/assignments/:id/items/:itemId ─────────────────────────────────
router.patch('/:id/items/:itemId', validate(updateAssignmentItemSchema), async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { completed, assignedTo } = req.body;
  try {
    const item = await prisma.checklistAssignmentItem.update({
      where: { id: itemId },
      data: { completed, ...(assignedTo !== undefined && { assignedTo }) },
    });
    res.json(item);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Item não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar item.' });
  }
});

// ── DELETE /api/assignments/:id ──────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.checklistAssignment.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Atribuição não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar atribuição.' });
  }
});

export default router;
