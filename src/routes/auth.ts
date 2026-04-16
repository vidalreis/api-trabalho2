import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { validate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../schemas/index.js';

const router = Router();

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, password, role, avatar } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'E-mail já cadastrado.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, avatar },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const secret = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao fazer login.' });
  }
});

export default router;
