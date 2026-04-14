import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import companyRoutes from './routes/companies.js';
import demandRoutes from './routes/demands.js';
import checklistRoutes from './routes/checklists.js';
import templateRoutes from './routes/templates.js';
import assignmentRoutes from './routes/assignments.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Middlewares globais ──────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:8080'], credentials: true }));
app.use(helmet());
app.use(express.json());

// ── Rotas ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/assignments', assignmentRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor Finode rodando em http://localhost:${PORT}`);
});

export default app;
