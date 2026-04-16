import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, validate } from '../middleware/auth.js';
import { createDemandSchema, updateDemandSchema, paginationSchema } from '../schemas/index.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/demands ─────────────────────────────────────────────────────────
// Filtros: status, priority, companyId, assignedToId, search (title)
// Paginação: page, limit
// Ordenação: orderBy (title|dueDate|createdAt|priority|status), order (asc|desc)
router.get('/', async (req: Request, res: Response) => {
  const {
    status, priority, companyId, assignedToId, search,
    orderBy = 'createdAt', order = 'desc',
  } = req.query as Record<string, string>;
  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where['status'] = status;
  if (priority) where['priority'] = priority;
  if (companyId) where['companyId'] = companyId;
  if (assignedToId) where['assignedToId'] = assignedToId;
  if (search) where['title'] = { contains: search };

  const validOrderFields = ['title', 'dueDate', 'createdAt', 'priority', 'status'];
  const sortField = validOrderFields.includes(orderBy) ? orderBy : 'createdAt';
  const sortOrder = order === 'asc' ? 'asc' : 'desc';

  try {
    const [total, demands] = await Promise.all([
      prisma.demand.count({ where }),
      prisma.demand.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          company: { select: { id: true, name: true, cnpj: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: demands,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar demandas.' });
  }
});

// ── GET /api/demands/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const demand = await prisma.demand.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        company: { select: { id: true, name: true, cnpj: true, status: true } },
      },
    });
    if (!demand) { res.status(404).json({ error: 'Demanda não encontrada.' }); return; }
    res.json(demand);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar demanda.' });
  }
});

// ── POST /api/demands ────────────────────────────────────────────────────────
router.post('/', validate(createDemandSchema), async (req: Request, res: Response) => {
  const { title, description, status, priority, assignedToId, companyId, dueDate } = req.body;
  try {
    // Verificar se usuário e empresa existem
    const [user, company] = await Promise.all([
      prisma.user.findUnique({ where: { id: assignedToId } }),
      prisma.company.findUnique({ where: { id: companyId } }),
    ]);
    if (!user) { res.status(404).json({ error: 'Usuário responsável não encontrado.' }); return; }
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }

    const demand = await prisma.demand.create({
      data: { title, description, status, priority, assignedToId, companyId, dueDate: new Date(dueDate) },
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

// ── PATCH /api/demands/:id ───────────────────────────────────────────────────
router.patch('/:id', validate(updateDemandSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, priority, assignedToId, companyId, dueDate } = req.body;
  try {
    const demand = await prisma.demand.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
        ...(companyId && { companyId }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });
    res.json(demand);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Demanda não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar demanda.' });
  }
});

// ── DELETE /api/demands/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.demand.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Demanda não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar demanda.' });
  }
});

export default router;
