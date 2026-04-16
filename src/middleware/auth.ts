import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ZodSchema, ZodError } from 'zod';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

// ─────────────────────────────────────────────
// MIDDLEWARE DE AUTENTICAÇÃO JWT
// ─────────────────────────────────────────────

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as { userId: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// ─────────────────────────────────────────────
// MIDDLEWARE DE CONTROLE POR ROLE
// ─────────────────────────────────────────────

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({
        error: 'Acesso negado.',
        message: `Requer um dos seguintes roles: ${roles.join(', ')}.`,
      });
      return;
    }
    next();
  };
}

// ─────────────────────────────────────────────
// MIDDLEWARE DE VALIDAÇÃO ZOD
// ─────────────────────────────────────────────

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(400).json({ error: 'Dados inválidos.', details: errors });
      return;
    }
    req.body = result.data;
    next();
  };
}
