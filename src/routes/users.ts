import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { authMiddleware, requireRole, validate, AuthRequest } from '../middleware/auth.js';
import { updateUserSchema, paginationSchema } from '../schemas/index.js';

const router = Router();
router.use(authMiddleware);

// ── GET /api/users ───────────────────────────────────────────────────────────
// Filtros: role, search
// Paginação: page, limit
// Ordenação: orderBy (name|email|createdAt), order (asc|desc)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { role, search, orderBy = 'name', order = 'asc' } = req.query as Record<string, string>;
  const { page, limit } = paginationSchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (role) where['role'] = role;
  if (search) {
    where['OR'] = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const validOrderFields = ['name', 'email', 'createdAt'];
  const sortField = validOrderFields.includes(orderBy) ? orderBy : 'name';
  const sortOrder = order === 'desc' ? 'desc' : 'asc';

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, updatedAt: true },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    res.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

// ── GET /api/users/me ────────────────────────────────────────────────────────
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, updatedAt: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
});

// ── GET /api/users/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true, updatedAt: true },
    });
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
});

// ── PATCH /api/users/:id ─────────────────────────────────────────────────────
router.patch('/:id', validate(updateUserSchema), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role, avatar } = req.body;

  // Apenas o próprio usuário ou dono pode editar
  if (req.userId !== id && req.userRole !== 'dono') {
    res.status(403).json({ error: 'Sem permissão para editar este usuário.' });
    return;
  }

  try {
    const data: Record<string, unknown> = {};
    if (name) data['name'] = name;
    if (email) data['email'] = email;
    if (password) data['password'] = await bcrypt.hash(password, 10);
    if (role && req.userRole === 'dono') data['role'] = role; // Só dono pode mudar role
    if (avatar !== undefined) data['avatar'] = avatar;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, avatar: true, updatedAt: true },
    });
    res.json(user);
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    if ((err as { code?: string }).code === 'P2002') { res.status(409).json({ error: 'E-mail já cadastrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
});

// ── DELETE /api/users/:id ────────────────────────────────────────────────────
router.delete('/:id', requireRole('dono'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (req.userId === id) {
    res.status(400).json({ error: 'Você não pode deletar a si mesmo.' });
    return;
  }
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2025') { res.status(404).json({ error: 'Usuário não encontrado.' }); return; }
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar usuário.' });
  }
});

export default router;
