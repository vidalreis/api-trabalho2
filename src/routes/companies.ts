import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware, validate } from '../middleware/auth.js';
import { createCompanySchema, updateCompanySchema, paginationSchema } from '../schemas/index.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/companies ───────────────────────────────────────────────────────
// Filtros: search (name/cnpj), status
// Paginação: page, limit
// Ordenação: orderBy (name|createdAt), order (asc|desc)
router.get('/', async (req: Request, res: Response) => {
  const { search, status, orderBy = 'name', order = 'asc' } = req.query as Record<string, string>;
  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where['status'] = status;
  if (search) {
    where['OR'] = [
      { name: { contains: search } },
      { cnpj: { contains: search } },
    ];
  }

  const validOrderFields = ['name', 'createdAt', 'updatedAt'];
  const sortField = validOrderFields.includes(orderBy) ? orderBy : 'name';
  const sortOrder = order === 'desc' ? 'desc' : 'asc';

  try {
    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
        include: {
          _count: { select: { demands: true, checklists: true, assignments: true } },
        },
      }),
    ]);

    res.json({
      data: companies,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar empresas.' });
  }
});

// ── GET /api/companies/:id ───────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        demands: {
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
          orderBy: { dueDate: 'asc' },
        },
        checklists: {
          select: { id: true, title: true, serviceType: true, createdAt: true },
        },
        _count: { select: { demands: true, checklists: true, assignments: true } },
      },
    });
    if (!company) { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar empresa.' });
  }
});

// ── POST /api/companies ──────────────────────────────────────────────────────
router.post('/', validate(createCompanySchema), async (req: Request, res: Response) => {
  const { name, cnpj, status } = req.body;
  try {
    const company = await prisma.company.create({
      data: { name, cnpj, status },
      include: { _count: { select: { demands: true, checklists: true } } },
    });
    res.status(201).json(company);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') { res.status(409).json({ error: 'CNPJ já cadastrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar empresa.' });
  }
});

// ── PATCH /api/companies/:id ─────────────────────────────────────────────────
router.patch('/:id', validate(updateCompanySchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, cnpj, status } = req.body;
  try {
    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(cnpj && { cnpj }),
        ...(status && { status }),
      },
    });
    res.json(company);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }
    if ((err as { code?: string }).code === 'P2002') { res.status(409).json({ error: 'CNPJ já cadastrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar empresa.' });
  }
});

// ── DELETE /api/companies/:id ────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.company.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Empresa não encontrada.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar empresa.' });
  }
});

export default router;
