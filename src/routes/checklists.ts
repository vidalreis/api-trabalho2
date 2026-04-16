import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, validate } from '../middleware/auth.js';
import {
  createChecklistSchema,
  updateChecklistSchema,
  updateChecklistItemSchema,
  paginationSchema,
} from '../schemas/index.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/checklists ──────────────────────────────────────────────────────
// Filtros: companyId, serviceType, search (title)
// Paginação: page, limit
// Ordenação: orderBy (title|createdAt), order (asc|desc)
router.get('/', async (req: Request, res: Response) => {
  const { companyId, serviceType, search, orderBy = 'createdAt', order = 'desc' } = req.query as Record<string, string>;
  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (companyId) where['companyId'] = companyId;
  if (serviceType) where['serviceType'] = { contains: serviceType };
  if (search) where['title'] = { contains: search };

  const validOrderFields = ['title', 'createdAt', 'updatedAt', 'serviceType'];
  const sortField = validOrderFields.includes(orderBy) ? orderBy : 'createdAt';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  try {
    const [total, checklists] = await Promise.all([
      prisma.checklist.count({ where }),
      prisma.checklist.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          items: { orderBy: { priority: 'desc' } },
          _count: { select: { items: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: checklists,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar checklists.' });
  }
});

// ── GET /api/checklists/:id ──────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const checklist = await prisma.checklist.findUnique({
      where: { id },
      include: {
        company: true,
        items: { orderBy: [{ completed: 'asc' }, { priority: 'desc' }] },
      },
    });
    if (!checklist) { res.status(404).json({ error: 'Checklist não encontrado.' }); return; }
    res.json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar checklist.' });
  }
});

// ── POST /api/checklists ─────────────────────────────────────────────────────
router.post('/', validate(createChecklistSchema), async (req: Request, res: Response) => {
  const { title, companyId, serviceType, items } = req.body;
  try {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }

    const checklist = await prisma.checklist.create({
      data: {
        title,
        companyId,
        serviceType,
        items: items.length ? { create: items.map((item: { title: string; priority?: string; assignedTo?: string }) => ({
          title: item.title,
          priority: item.priority ?? 'media',
          assignedTo: item.assignedTo,
          completed: false,
        })) } : undefined,
      },
      include: { company: true, items: true },
    });
    res.status(201).json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar checklist.' });
  }
});

// ── PATCH /api/checklists/:id ────────────────────────────────────────────────
router.patch('/:id', validate(updateChecklistSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, serviceType, items } = req.body;
  try {
    const checklist = await prisma.checklist.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(serviceType && { serviceType }),
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            create: items.map((item: { title: string; priority?: string; assignedTo?: string }) => ({
              title: item.title,
              priority: item.priority ?? 'media',
              assignedTo: item.assignedTo,
              completed: false,
            })),
          },
        }),
      },
      include: { company: true, items: true },
    });
    res.json(checklist);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Checklist não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar checklist.' });
  }
});

// ── PATCH /api/checklists/:id/items/:itemId ──────────────────────────────────
router.patch('/:id/items/:itemId', validate(updateChecklistItemSchema), async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { completed, assignedTo } = req.body;
  try {
    const item = await prisma.checklistItem.update({
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

// ── DELETE /api/checklists/:id ───────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.checklist.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Checklist não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar checklist.' });
  }
});

export default router;
