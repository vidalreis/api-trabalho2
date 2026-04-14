# Finode — API REST de Gestão Empresarial

> **Trabalho 2 — API REST** | Tema: Gestão Empresarial para Escritórios de Contabilidade

Sistema completo de gestão com autenticação JWT, CRUD completo em 6 recursos, validações e tratamento de erros.

---

## 📋 Tema e Descrição

**Finode** é uma API REST voltada para escritórios de contabilidade gerenciarem:
- **Usuários** (contadores, gerentes e donos)
- **Empresas** clientes do escritório
- **Demandas** (tarefas atribuídas a contadores)
- **Checklists** avulsos vinculados a empresas
- **Templates de Checklist** reutilizáveis
- **Atribuições** (templates atribuídos a um contador para uma empresa)

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Linguagem | TypeScript |
| ORM | Prisma 7 |
| Banco de Dados | PostgreSQL |
| Autenticação | JWT (jsonwebtoken) |
| Hash de Senhas | bcrypt |
| Segurança | Helmet, CORS |
| Dev | tsx (hot-reload), nodemon |

---

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente ou acessível via URL

### 1. Clone o repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd Finode-estagio
```

### 2. Instale as dependências do backend
```bash
cd backend
npm install
```

### 3. Configure variáveis de ambiente
Crie o arquivo `backend/.env`:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/finode_db"
JWT_SECRET="uma_chave_secreta_muito_segura"
PORT=3001
```

### 4. Execute as migrações do banco
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Popule o banco com dados iniciais (seed)
```bash
npm run seed
```

O seed cria automaticamente:
- 4 usuários (dono, gerente, 2 contadores)
- 4 empresas clientes
- 6 demandas em variados status
- 2 templates de checklist
- 2 checklists avulsos
- 2 atribuições de checklist

**Credenciais criadas pelo seed:**

| Role | E-mail | Senha |
|---|---|---|
| dono | admin@finode.com | senha123 |
| gerente | gerente@finode.com | senha123 |
| contador | ana.contador@finode.com | senha123 |
| contador | marcos.contador@finode.com | senha123 |

---

## ▶️ Como Executar

### Desenvolvimento (hot-reload)
```bash
cd backend
npm run dev
```
API disponível em: `http://localhost:3001`

### Produção
```bash
cd backend
npm run build
npm start
```

---

## 📡 Endpoints da API

Base URL: `http://localhost:3001`

### 🏥 Health Check

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/health` | Verifica se a API está online |

**Resposta:**
```json
{ "status": "ok", "timestamp": "2026-04-13T23:00:00.000Z" }
```

---

### 🔐 Autenticação (`/api/auth`)

> Rotas públicas — não requerem token

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastra novo usuário |
| POST | `/api/auth/login` | Autentica e retorna JWT |

#### POST /api/auth/register
**Body:**
```json
{
  "name": "Nome Completo",
  "email": "usuario@exemplo.com",
  "password": "minhasenha",
  "role": "contador"
}
```
`role` aceita: `contador`, `gerente`, `dono`

**Respostas:**
- `201 Created` — Usuário criado (sem campo `password`)
- `400 Bad Request` — Campos obrigatórios ausentes
- `409 Conflict` — E-mail já cadastrado

---

#### POST /api/auth/login
**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "minhasenha"
}
```

**Resposta 200:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "...", "email": "...", "role": "..." }
}
```

**Respostas:**
- `200 OK` — Token JWT gerado
- `400 Bad Request` — Campos ausentes
- `401 Unauthorized` — Credenciais inválidas

---

### 🔒 Autenticação nos demais endpoints

Todos os endpoints abaixo exigem o header:
```
Authorization: Bearer <token_jwt>
```

Sem token: `401 Unauthorized`

---

### 👤 Usuários (`/api/users`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/users` | Lista todos os usuários |
| GET | `/api/users/me` | Retorna perfil do usuário logado |

**Respostas:**
- `200 OK` — Lista/perfil do usuário (sem senha)
- `401 Unauthorized` — Token ausente ou inválido
- `404 Not Found` — Usuário não encontrado (apenas `/me`)

---

### 🏢 Empresas (`/api/companies`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/companies` | Lista todas as empresas |
| GET | `/api/companies/:id` | Busca empresa por ID |
| POST | `/api/companies` | Cria nova empresa |
| PATCH | `/api/companies/:id` | Atualiza dados da empresa |
| DELETE | `/api/companies/:id` | Remove empresa |

#### POST / PATCH Body
```json
{
  "name": "Nome da Empresa",
  "cnpj": "00.000.000/0001-00",
  "status": "ativo"
}
```
`status` aceita: `ativo`, `inativo`

**Status codes:**
- `200 OK` — Sucesso (GET, PATCH)
- `201 Created` — Empresa criada
- `204 No Content` — Empresa removida (DELETE)
- `400 Bad Request` — `name` e `cnpj` são obrigatórios no POST
- `404 Not Found` — Empresa não encontrada
- `409 Conflict` — CNPJ já cadastrado

---

### 📋 Demandas (`/api/demands`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/demands` | Lista todas as demandas |
| GET | `/api/demands/:id` | Busca demanda por ID |
| POST | `/api/demands` | Cria nova demanda |
| PATCH | `/api/demands/:id` | Atualiza dados da demanda |
| DELETE | `/api/demands/:id` | Remove demanda |

#### POST Body (campos obrigatórios*)
```json
{
  "title": "Título da Demanda",
  "description": "Descrição detalhada",
  "assignedToId": "uuid-do-usuario",
  "companyId": "uuid-da-empresa",
  "dueDate": "2026-05-30T00:00:00.000Z",
  "status": "pendente",
  "priority": "alta"
}
```
`status` aceita: `pendente`, `em_progresso`, `concluida`, `cancelada`  
`priority` aceita: `baixa`, `media`, `alta`

**Retorna:** Demanda com dados de `assignedTo` e `company` incluídos.

---

### ✅ Checklists (`/api/checklists`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/checklists` | Lista todos os checklists |
| GET | `/api/checklists/:id` | Busca checklist por ID |
| POST | `/api/checklists` | Cria novo checklist |
| PATCH | `/api/checklists/:id/items/:itemId` | Marca/desmarca item |
| DELETE | `/api/checklists/:id` | Remove checklist (cascade nos itens) |

#### POST Body
```json
{
  "title": "Nome do Checklist",
  "serviceType": "Fiscal",
  "companyId": "uuid-da-empresa",
  "items": [
    { "title": "Item 1", "priority": "alta" },
    { "title": "Item 2", "priority": "media" }
  ]
}
```

#### PATCH Item Body
```json
{ "completed": true }
```

---

### 📄 Templates (`/api/templates`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/templates` | Lista todos os templates |
| POST | `/api/templates` | Cria novo template |
| PATCH | `/api/templates/:id` | Atualiza template e seus itens |
| DELETE | `/api/templates/:id` | Remove template |

#### POST Body
```json
{
  "title": "Nome do Template",
  "description": "Descrição",
  "items": [
    { "title": "Passo 1", "priority": "alta" }
  ]
}
```

---

### 📌 Atribuições (`/api/assignments`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/assignments` | Lista todas as atribuições |
| POST | `/api/assignments` | Cria atribuição a partir de template |
| PATCH | `/api/assignments/:id` | Atualiza status da atribuição |
| PATCH | `/api/assignments/:id/items/:itemId` | Marca/desmarca item |

#### POST Body (todos obrigatórios)
```json
{
  "templateId": "uuid-do-template",
  "assignedToId": "uuid-do-usuario",
  "companyId": "uuid-da-empresa",
  "dueDate": "2026-05-30T00:00:00.000Z"
}
```
> Os itens do template são copiados automaticamente para a atribuição.

---

## 🗄️ Estrutura do Banco de Dados

```
User ─────────────────────── demandas (AssignedDemands)
  │                          templates criados (CreatedTemplates)
  │                          assignments recebidas (AssignedTo)
  └──────────────────────── assignments dadas (AssignedBy)

Company ──────────────────── checklists
  │                          demandas
  └──────────────────────── assignments

Checklist ────────────────── ChecklistItem (cascade delete)

ChecklistTemplate ────────── ChecklistTemplateItem (cascade delete)
  └──────────────────────── ChecklistAssignment
                               └── ChecklistAssignmentItem (cascade delete)
```

---

## 📁 Estrutura de Arquivos

```
backend/
├── prisma/
│   ├── schema.prisma      # Esquema do banco de dados
│   ├── migrations/        # Histórico de migrações
│   └── seed.ts            # Script de população inicial (10+ registros)
├── src/
│   ├── index.ts           # Ponto de entrada da aplicação
│   ├── lib/
│   │   └── prisma.ts      # Instância do Prisma Client
│   ├── middleware/
│   │   └── auth.ts        # Middleware de autenticação JWT
│   └── routes/
│       ├── auth.ts        # POST /register, POST /login
│       ├── users.ts       # GET /users, GET /users/me
│       ├── companies.ts   # CRUD /companies
│       ├── demands.ts     # CRUD /demands
│       ├── checklists.ts  # CRUD /checklists
│       ├── templates.ts   # CRUD /templates
│       └── assignments.ts # CRUD /assignments
├── package.json
└── tsconfig.json

Finode_API.postman_collection.json   # ← Collection do Postman
```

---

## 🧪 Testando com o Postman

1. Abra o Postman
2. Clique em **Import** → selecione `Finode_API.postman_collection.json`
3. Execute **Auth / Login** primeiro para obter o token automaticamente
4. Todos os endpoints já possuem testes automatizados (aba Tests)

**Fluxo recomendado de testes:**
1. `GET /health` — verifica se a API está online
2. `POST /auth/login` — obtém token (configuração automática)
3. `GET /companies` — lista empresas e captura ID automaticamente
4. `POST /companies` — cria empresa e captura ID
5. Execute os testes de erro (400, 404, 409) para cada recurso

---

## ✅ Validações implementadas

| Situação | Código |
|---|---|
| Campos obrigatórios ausentes | `400 Bad Request` |
| Token ausente ou inválido | `401 Unauthorized` |
| Recurso não encontrado | `404 Not Found` |
| Conflito (ex: CNPJ duplicado, e-mail duplicado) | `409 Conflict` |
| Erro interno do servidor | `500 Internal Server Error` |

---

## 🔒 Segurança

- **Helmet** — Headers de segurança HTTP
- **CORS** — Configurado para `localhost:5173` e `localhost:8080`
- **JWT** — Tokens com expiração de 7 dias
- **bcrypt** — Hash de senhas com salt rounds = 10
- **Senhas nunca retornadas** — Select explícito em todas as queries de usuário

---

## 📦 Registros Iniciais (Seed)

O banco é populado com **mais de 10 registros** distribuídos entre:

| Modelo | Quantidade |
|---|---|
| User | 4 |
| Company | 4 |
| Demand | 6 |
| ChecklistTemplate | 2 |
| ChecklistTemplateItem | 10 |
| Checklist | 2 |
| ChecklistItem | 6 |
| ChecklistAssignment | 2 |
| ChecklistAssignmentItem | 10 |
| **Total de registros** | **46+** |

---

## 📄 Licença

ISC
