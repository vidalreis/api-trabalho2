import { z } from 'zod';

// ─────────────────────────────────────────────
// CONSTANTES / ENUMS
// ─────────────────────────────────────────────

export const ROLES = ['gerente', 'contador', 'dono'] as const;
export const COMPANY_STATUSES = ['ativo', 'inativo'] as const;
export const PRIORITIES = ['baixa', 'media', 'alta'] as const;
export const TASK_STATUSES = ['pendente', 'em_progresso', 'concluida', 'cancelada'] as const;

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string({ required_error: 'Nome é obrigatório.' }).min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string({ required_error: 'E-mail é obrigatório.' }).email('E-mail inválido.'),
  password: z.string({ required_error: 'Senha é obrigatória.' }).min(6, 'Senha deve ter pelo menos 6 caracteres.'),
  role: z.enum(ROLES, { required_error: 'Role é obrigatório.', message: 'Role inválido. Use: gerente, contador ou dono.' }),
  avatar: z.string().url('Avatar deve ser uma URL válida.').optional(),
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'E-mail é obrigatório.' }).email('E-mail inválido.'),
  password: z.string({ required_error: 'Senha é obrigatória.' }),
});

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').optional(),
  email: z.string().email('E-mail inválido.').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.').optional(),
  role: z.enum(ROLES, { message: 'Role inválido.' }).optional(),
  avatar: z.string().url('Avatar deve ser uma URL válida.').optional().nullable(),
});

// ─────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────

const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

export const createCompanySchema = z.object({
  name: z.string({ required_error: 'Nome é obrigatório.' }).min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  cnpj: z
    .string({ required_error: 'CNPJ é obrigatório.' })
    .regex(cnpjRegex, 'CNPJ inválido. Use o formato: 00.000.000/0001-00.'),
  status: z.enum(COMPANY_STATUSES, { message: 'Status inválido. Use: ativo ou inativo.' }).optional().default('ativo'),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2).optional(),
  cnpj: z.string().regex(cnpjRegex, 'CNPJ inválido.').optional(),
  status: z.enum(COMPANY_STATUSES, { message: 'Status inválido.' }).optional(),
});

// ─────────────────────────────────────────────
// DEMANDS
// ─────────────────────────────────────────────

export const createDemandSchema = z.object({
  title: z.string({ required_error: 'Título é obrigatório.' }).min(3, 'Título deve ter pelo menos 3 caracteres.'),
  description: z.string({ required_error: 'Descrição é obrigatória.' }).min(10, 'Descrição deve ter pelo menos 10 caracteres.'),
  assignedToId: z.string({ required_error: 'Responsável é obrigatório.' }).uuid('ID do responsável inválido.'),
  companyId: z.string({ required_error: 'Empresa é obrigatória.' }).uuid('ID da empresa inválido.'),
  dueDate: z.string({ required_error: 'Data de vencimento é obrigatória.' }).datetime({ message: 'Data inválida. Use formato ISO 8601.' }),
  status: z.enum(TASK_STATUSES, { message: 'Status inválido.' }).optional().default('pendente'),
  priority: z.enum(PRIORITIES, { message: 'Prioridade inválida.' }).optional().default('media'),
});

export const updateDemandSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  assignedToId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(TASK_STATUSES, { message: 'Status inválido.' }).optional(),
  priority: z.enum(PRIORITIES, { message: 'Prioridade inválida.' }).optional(),
});

// ─────────────────────────────────────────────
// CHECKLISTS
// ─────────────────────────────────────────────

const checklistItemSchema = z.object({
  title: z.string({ required_error: 'Título do item é obrigatório.' }).min(2),
  priority: z.enum(PRIORITIES, { message: 'Prioridade inválida.' }).optional().default('media'),
  assignedTo: z.string().optional(),
});

export const createChecklistSchema = z.object({
  title: z.string({ required_error: 'Título é obrigatório.' }).min(3),
  serviceType: z.string({ required_error: 'Tipo de serviço é obrigatório.' }).min(2),
  companyId: z.string({ required_error: 'Empresa é obrigatória.' }).uuid('ID da empresa inválido.'),
  items: z.array(checklistItemSchema).optional().default([]),
});

export const updateChecklistSchema = z.object({
  title: z.string().min(3).optional(),
  serviceType: z.string().min(2).optional(),
  items: z.array(checklistItemSchema).optional(),
});

export const updateChecklistItemSchema = z.object({
  completed: z.boolean({ required_error: 'completed é obrigatório.' }),
  assignedTo: z.string().optional().nullable(),
});

// ─────────────────────────────────────────────
// TEMPLATES
// ─────────────────────────────────────────────

const templateItemSchema = z.object({
  title: z.string({ required_error: 'Título do item é obrigatório.' }).min(2),
  priority: z.enum(PRIORITIES, { message: 'Prioridade inválida.' }).optional().default('media'),
});

export const createTemplateSchema = z.object({
  title: z.string({ required_error: 'Título é obrigatório.' }).min(3),
  description: z.string().optional().default(''),
  items: z.array(templateItemSchema).optional().default([]),
});

export const updateTemplateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  items: z.array(templateItemSchema).optional(),
});

// ─────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────

export const createAssignmentSchema = z.object({
  templateId: z.string({ required_error: 'Template é obrigatório.' }).uuid('ID do template inválido.'),
  assignedToId: z.string({ required_error: 'Responsável é obrigatório.' }).uuid('ID do responsável inválido.'),
  companyId: z.string({ required_error: 'Empresa é obrigatória.' }).uuid('ID da empresa inválido.'),
  dueDate: z.string({ required_error: 'Data de vencimento é obrigatória.' }).datetime({ message: 'Data inválida.' }),
});

export const updateAssignmentSchema = z.object({
  status: z.enum(TASK_STATUSES, { message: 'Status inválido.' }).optional(),
  dueDate: z.string().datetime().optional(),
});

export const updateAssignmentItemSchema = z.object({
  completed: z.boolean({ required_error: 'completed é obrigatório.' }),
  assignedTo: z.string().optional().nullable(),
});

// ─────────────────────────────────────────────
// QUERY PARAMS / PAGINAÇÃO
// ─────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});
