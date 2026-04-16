# Finode API — REST de Gestão Empresarial

> **Trabalho 2 — API REST** | Gestão para Escritórios de Contabilidade

Sistema completo com autenticação JWT, CRUD em 6 recursos, filtros, paginação, ordenação, validações Zod, testes automatizados e configuração de deploy.

---

## 📋 Tema e Descrição

**Finode** é uma API REST para escritórios de contabilidade gerenciarem:

- **Usuários** — contadores, gerentes e donos do escritório
- **Empresas** — clientes do escritório (com CNPJ, status)
- **Demandas** — tarefas atribuídas a contadores por empresa
- **Checklists** — listas avulsas vinculadas a empresas
- **Templates** — modelos de checklist reutilizáveis
- **Atribuições** — templates atribuídos a contadores para empresas específicas

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Linguagem | TypeScript 5 |
| ORM | Prisma 6 |
| Banco de Dados | **SQLite** (arquivo local) |
| Autenticação | JWT (jsonwebtoken 9) |
| Validação | **Zod 3** |
| Hash de Senhas | bcrypt 5 |
| Segurança | Helmet, CORS |
| Testes | **Vitest + Supertest** |
| Dev | tsx (hot-reload) |

---

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- npm 9+

> ✅ **Não precisa instalar banco de dados!** O SQLite cria o arquivo `.db` automaticamente.

### 1. Clone o repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd finode-api
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Conteúdo do `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3001
NODE_ENV=development
```

### 4. Execute as migrações e configure o banco
```bash
npx prisma db push
npx prisma generate
```

### 5. Popule o banco com dados iniciais
```bash
npm run seed
```

O seed cria **72+ registros** automaticamente:

| Modelo | Quantidade |
|---|---|
| User | 6 |
| Company | 6 |
| Demand | 12 |
| ChecklistTemplate | 3 |
| ChecklistTemplateItem | 15 |
| Checklist | 4 |
| ChecklistItem | 12 |
| ChecklistAssignment | 4 |
| ChecklistAssignmentItem | 20 |
| **Total** | **82+** |

**Credenciais criadas pelo seed:**

| Role | E-mail | Senha |
|---|---|---|
| dono | admin@finode.com | senha123 |
| gerente | gerente@finode.com | senha123 |
| contador | ana.costa@finode.com | senha123 |
| contador | marcos.silva@finode.com | senha123 |
| contador | beatriz.oliveira@finode.com | senha123 |
| contador | rafael.souza@finode.com | senha123 |

---

## ▶️ Como Executar

### Desenvolvimento (hot-reload)
```bash
npm run dev
```
API disponível em: `http://localhost:3001`

### Produção
```bash
npm run build
npm start
```

---

## 🧪 Testes Automatizados

```bash
# Executar todos os testes
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Com cobertura de código
npm run test:coverage
```

Os testes cobrem:
- ✅ Auth (register, login, token inválido)
- ✅ Companies (CRUD completo + filtros + paginação)
- ✅ Demands (CRUD completo + filtros + ordenação)
- ✅ Health check

> Os testes usam um banco SQLite isolado (`test.db`) que é criado e destruído automaticamente.

---

## 📡 Endpoints da API

Base URL: `http://localhost:3001`

### 🏥 Health Check

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| GET | `/health` | ❌ | Verifica se a API está online |

```json
{ "status": "ok", "timestamp": "2026-04-16T22:00:00.000Z" }
```

---

### 🔐 Autenticação (`/api/auth`)

> Rotas **públicas** — não requerem token

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastra novo usuário |
| POST | `/api/auth/login` | Autentica e retorna JWT |

#### POST /api/auth/register
```json
{
  "name": "Nome Completo",
  "email": "usuario@exemplo.com",
  "password": "minhasenha123",
  "role": "contador"
}
```
`role` aceita: `contador` | `gerente` | `dono`

| Código | Situação |
|---|---|
| 201 | Usuário criado (sem campo `password`) |
| 400 | Dados inválidos (Zod errors com detalhes) |
| 409 | E-mail já cadastrado |

#### POST /api/auth/login
```json
{ "email": "usuario@exemplo.com", "password": "minhasenha123" }
```

Resposta 200:
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "...", "email": "...", "role": "..." }
}
```

---

### 🔒 Header de Autenticação

Todos os endpoints abaixo exigem:
```
Authorization: Bearer <token_jwt>
```

---

### 👤 Usuários (`/api/users`)

| Método | Endpoint | Permissão | Descrição |
|---|---|---|---|
| GET | `/api/users` | Autenticado | Lista usuários (filtros + paginação) |
| GET | `/api/users/me` | Autenticado | Perfil do usuário logado |
| GET | `/api/users/:id` | Autenticado | Busca usuário por ID |
| PATCH | `/api/users/:id` | Próprio ou dono | Atualiza dados do usuário |
| DELETE | `/api/users/:id` | Apenas dono | Remove usuário |

#### Query Params para GET /api/users

| Parâmetro | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `role` | string | `contador` | Filtra por role |
| `search` | string | `Ana` | Busca em name e email |
| `page` | number | `1` | Página (padrão: 1) |
| `limit` | number | `10` | Itens por página (padrão: 10, máx: 100) |
| `orderBy` | string | `name` | Campo de ordenação |
| `order` | string | `asc` | Direção: `asc` ou `desc` |

---

### 🏢 Empresas (`/api/companies`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/companies` | Lista empresas (filtros + paginação) |
| GET | `/api/companies/:id` | Busca empresa por ID com demandas e checklists |
| POST | `/api/companies` | Cria nova empresa |
| PATCH | `/api/companies/:id` | Atualiza dados |
| DELETE | `/api/companies/:id` | Remove empresa |

#### Query Params para GET /api/companies

| Parâmetro | Tipo | Exemplo | Descrição |
|---|---|---|---|
| `search` | string | `Tech` | Busca em name e cnpj |
| `status` | string | `ativo` | Filtra por status (`ativo`/`inativo`) |
| `page` | number | `1` | Página |
| `limit` | number | `10` | Itens por página |
| `orderBy` | string | `name` | Campo de ordenação |
| `order` | string | `asc` | Direção |

#### POST/PATCH Body
```json
{
  "name": "Empresa Exemplo S.A.",
  "cnpj": "12.345.678/0001-90",
  "status": "ativo"
}
```

**GET /:id retorna** (com JOINs):
```json
{
  "id": "...",
  "name": "...",
  "demands": [...],
  "checklists": [...],
  "_count": { "demands": 3, "checklists": 2, "assignments": 1 }
}
```

---

### 📋 Demandas (`/api/demands`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/demands` | Lista demandas (múltiplos filtros) |
| GET | `/api/demands/:id` | Busca por ID com assignedTo e company |
| POST | `/api/demands` | Cria nova demanda |
| PATCH | `/api/demands/:id` | Atualiza parcialmente |
| DELETE | `/api/demands/:id` | Remove demanda |

#### Query Params

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `status` | string | `pendente` \| `em_progresso` \| `concluida` \| `cancelada` |
| `priority` | string | `baixa` \| `media` \| `alta` |
| `companyId` | uuid | Filtra por empresa |
| `assignedToId` | uuid | Filtra por responsável |
| `search` | string | Busca no título |
| `page` | number | Página |
| `limit` | number | Itens por página |
| `orderBy` | string | `title` \| `dueDate` \| `createdAt` \| `priority` \| `status` |
| `order` | string | `asc` \| `desc` |

#### POST Body
```json
{
  "title": "Entrega do Balanço 2026",
  "description": "Descrição detalhada da demanda (min 10 caracteres).",
  "assignedToId": "uuid-do-usuario",
  "companyId": "uuid-da-empresa",
  "dueDate": "2026-05-30T00:00:00.000Z",
  "status": "pendente",
  "priority": "alta"
}
```

---

### ✅ Checklists (`/api/checklists`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/checklists` | Lista checklists |
| GET | `/api/checklists/:id` | Busca por ID com itens |
| POST | `/api/checklists` | Cria checklist com itens |
| PATCH | `/api/checklists/:id` | Atualiza checklist |
| PATCH | `/api/checklists/:id/items/:itemId` | Marca/desmarca item |
| DELETE | `/api/checklists/:id` | Remove checklist (cascade) |

#### Query Params

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `companyId` | uuid | Filtra por empresa |
| `serviceType` | string | Filtra por tipo de serviço |
| `search` | string | Busca no título |
| `page` | number | Página |
| `limit` | number | Itens por página |

---

### 📄 Templates (`/api/templates`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/templates` | Lista templates |
| GET | `/api/templates/:id` | Busca por ID com itens |
| POST | `/api/templates` | Cria template |
| PATCH | `/api/templates/:id` | Atualiza template e itens |
| DELETE | `/api/templates/:id` | Remove template |

---

### 📌 Atribuições (`/api/assignments`)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/assignments` | Lista atribuições |
| GET | `/api/assignments/:id` | Busca por ID com todos os JOINs |
| POST | `/api/assignments` | Cria atribuição a partir de template |
| PATCH | `/api/assignments/:id` | Atualiza status/data |
| PATCH | `/api/assignments/:id/items/:itemId` | Marca/desmarca item |
| DELETE | `/api/assignments/:id` | Remove atribuição |

#### Query Params

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `status` | string | Filtra por status |
| `assignedToId` | uuid | Filtra por responsável |
| `companyId` | uuid | Filtra por empresa |
| `templateId` | uuid | Filtra por template |
| `page` | number | Página |
| `limit` | number | Itens por página |

---

## ✅ Validações

| Situação | Código HTTP |
|---|---|
| Dados inválidos (Zod) | `400 Bad Request` + JSON com `details[]` |
| Token ausente | `401 Unauthorized` |
| Token inválido/expirado | `401 Unauthorized` |
| Sem permissão de role | `403 Forbidden` |
| Recurso não encontrado | `404 Not Found` |
| Conflito (email/CNPJ dup.) | `409 Conflict` |
| Erro interno | `500 Internal Server Error` |

**Exemplo de erro 400:**
```json
{
  "error": "Dados inválidos.",
  "details": [
    { "field": "email", "message": "E-mail inválido." },
    { "field": "cnpj", "message": "CNPJ inválido. Use o formato: 00.000.000/0001-00." }
  ]
}
```

---

## 📮 Testando com Postman

1. Abra o Postman
2. Clique em **Import** → selecione `Finode_API.postman_collection.json`
3. Execute **Auth / Login** para obter o token automaticamente
4. O token é salvo em variável de ambiente `{{authToken}}`

**Fluxo recomendado:**
1. `GET /health` — confirma que API está online
2. `POST /auth/login` — obtém token (configuração automática)
3. `GET /companies` — lista empresas e captura ID
4. `POST /companies` — cria empresa
5. Teste os filtros: `GET /demands?status=pendente&priority=alta`
6. Execute os casos de erro (400, 401, 404, 409)

---

## 🗄️ Estrutura do Banco

```
User ──────────── demands (Designated)
  │               templates criados (Author)
  │               assignments recebidas (Assignee)
  └─────────────── assignments enviadas (Assigner)

Company ────────── checklists
  │                demands
  └──────────────── assignments

Checklist ─────────── ChecklistItem (cascade delete)

ChecklistTemplate ──── ChecklistTemplateItem (cascade delete)
  └───────────────── ChecklistAssignment
                         └── ChecklistAssignmentItem (cascade delete)
```

---

## 📁 Estrutura de Arquivos

```
finode-api/
├── prisma/
│   ├── schema.prisma        # Schema SQLite
│   ├── migrations/          # Histórico de migrações
│   └── seed.ts              # 72+ registros iniciais
├── src/
│   ├── index.ts             # Entry point
│   ├── lib/
│   │   └── prisma.ts        # PrismaClient singleton
│   ├── middleware/
│   │   └── auth.ts          # JWT + requireRole + validate(Zod)
│   ├── schemas/
│   │   └── index.ts         # Todos os schemas Zod
│   ├── routes/
│   │   ├── auth.ts          # POST /register, POST /login
│   │   ├── users.ts         # CRUD /users (+ filtros)
│   │   ├── companies.ts     # CRUD /companies (+ filtros)
│   │   ├── demands.ts       # CRUD /demands (+ filtros)
│   │   ├── checklists.ts    # CRUD /checklists (+ filtros)
│   │   ├── templates.ts     # CRUD /templates (+ filtros)
│   │   └── assignments.ts   # CRUD /assignments (+ filtros)
│   └── tests/
│       ├── setup.ts         # Setup Vitest (banco de teste)
│       ├── auth.test.ts     # Testes de autenticação
│       ├── companies.test.ts# Testes de empresas
│       └── demands.test.ts  # Testes de demandas
├── .env.example             # Variáveis de ambiente de exemplo
├── render.yaml              # Deploy Render.com
├── vitest.config.ts         # Configuração Vitest
├── Finode_API.postman_collection.json
└── README.md
```

---

## 🚀 Deploy

### Render.com (recomendado)

1. Crie conta em [render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Render detecta automaticamente o `render.yaml`
4. Configure a variável `JWT_SECRET` no painel (ou use `generateValue: true`)
5. Deploy automático a cada `git push`

**Build Command:**
```
npm install && npx prisma generate && npx prisma db push && npm run build
```

**Start Command:**
```
node dist/index.js
```

### Railway

1. Crie conta em [railway.app](https://railway.app)
2. New Project → Deploy from GitHub Repo
3. Adicione variáveis de ambiente:
   - `DATABASE_URL=file:./prod.db`
   - `JWT_SECRET=<chave_aleatória>`
   - `PORT=3001`

---

## 🔒 Segurança

- **Helmet** — Headers de segurança HTTP (XSS, CSRF, etc.)
- **CORS** — Configurado para origens específicas
- **JWT** — Tokens com expiração de 7 dias
- **bcrypt** — Hash de senhas com salt rounds = 10
- **Zod** — Validação e sanitização de entrada em todos os endpoints
- **Senhas nunca retornadas** — `select` explícito em todas as queries

---

## 📄 Licença

ISC
