import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, validate, AuthRequest } from '../middleware/auth.js';
import { createTemplateSchema, updateTemplateSchema, paginationSchema } from '../schemas/index.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/templates ───────────────────────────────────────────────────────
// Filtros: search (title/description)
// Paginação: page, limit
// Ordenação: orderBy (title|createdAt), order (asc|desc)
router.get('/', async (req: Request, res: Response) => {
  const { search, orderBy = 'createdAt', order = 'desc' } = req.query as Record<string, string>;
  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where['OR'] = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const validOrderFields = ['title', 'createdAt', 'updatedAt'];
  const sortField = validOrderFields.includes(orderBy) ? orderBy : 'createdAt';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  try {
    const [total, templates] = await Promise.all([
      prisma.checklistTemplate.count({ where }),
      prisma.checklistTemplate.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          items: { orderBy: { priority: 'desc' } },
          _count: { select: { items: true, assignments: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar templates.' });
  }
});

// ── GET /api/templates/:id ───────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const template = await prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        items: true,
        _count: { select: { assignments: true } },
      },
    });
    if (!template) { res.status(404).json({ error: 'Template não encontrado.' }); return; }
    res.json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar template.' });
  }
});

// ── POST /api/templates ──────────────────────────────────────────────────────
router.post('/', validate(createTemplateSchema), async (req: AuthRequest, res: Response) => {
  const { title, description, items } = req.body;
  try {
    const template = await prisma.checklistTemplate.create({
      data: {
        title,
        description,
        createdById: req.userId!,
        items: items.length ? { create: items.map((item: { title: string; priority?: string }) => ({
          title: item.title,
          priority: item.priority ?? 'media',
        })) } : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        items: true,
      },
    });
    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar template.' });
  }
});

// ── PATCH /api/templates/:id ─────────────────────────────────────────────────
router.patch('/:id', validate(updateTemplateSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, items } = req.body;
  try {
    const template = await prisma.checklistTemplate.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(items !== undefined && {
          items: {
            deleteMany: {},
            create: items.map((item: { title: string; priority?: string }) => ({
              title: item.title,
              priority: item.priority ?? 'media',
            })),
          },
        }),
      },
      include: { createdBy: { select: { id: true, name: true } }, items: true },
    });
    res.json(template);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Template não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar template.' });
  }
});

// ── DELETE /api/templates/:id ────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.checklistTemplate.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Template não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar template.' });
  }
});

export default router;
