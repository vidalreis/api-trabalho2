/**
 * seed.ts — Popula o banco de dados com dados iniciais para demonstração.
 *
 * Execução:
 *   cd backend
 *   npx tsx prisma/seed.ts
 *
 * O script é idempotente: usa upsert onde possível para evitar duplicatas.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // ─────────────────────────────────────────────
  // 1. USUÁRIOS (mínimo 4)
  // ─────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('senha123', 10);

  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@finode.com' },
    update: {},
    create: {
      name: 'Admin Finode',
      email: 'admin@finode.com',
      password: senhaHash,
      role: 'dono',
    },
  });

  const userGerente = await prisma.user.upsert({
    where: { email: 'gerente@finode.com' },
    update: {},
    create: {
      name: 'Carlos Gerente',
      email: 'gerente@finode.com',
      password: senhaHash,
      role: 'gerente',
    },
  });

  const userContador1 = await prisma.user.upsert({
    where: { email: 'ana.contador@finode.com' },
    update: {},
    create: {
      name: 'Ana Paula',
      email: 'ana.contador@finode.com',
      password: senhaHash,
      role: 'contador',
    },
  });

  const userContador2 = await prisma.user.upsert({
    where: { email: 'marcos.contador@finode.com' },
    update: {},
    create: {
      name: 'Marcos Silva',
      email: 'marcos.contador@finode.com',
      password: senhaHash,
      role: 'contador',
    },
  });

  console.log(`✅ Usuários criados: ${userAdmin.name}, ${userGerente.name}, ${userContador1.name}, ${userContador2.name}`);

  // ─────────────────────────────────────────────
  // 2. EMPRESAS (mínimo 4)
  // ─────────────────────────────────────────────
  const empresas = [
    { name: 'Tech Solutions Ltda', cnpj: '12.345.678/0001-90', status: 'ativo' as const },
    { name: 'Comércio Rápido ME', cnpj: '98.765.432/0001-10', status: 'ativo' as const },
    { name: 'Indústria Beta S.A.', cnpj: '11.222.333/0001-44', status: 'ativo' as const },
    { name: 'Serviços Gamma Eireli', cnpj: '55.666.777/0001-88', status: 'inativo' as const },
  ];

  const companiesCreated = [];
  for (const emp of empresas) {
    const c = await prisma.company.upsert({
      where: { cnpj: emp.cnpj },
      update: {},
      create: emp,
    });
    companiesCreated.push(c);
    console.log(`  🏢 Empresa: ${c.name}`);
  }
  console.log(`✅ ${companiesCreated.length} empresas criadas.\n`);

  const [empTech, empComercio, empIndustria] = companiesCreated;

  // ─────────────────────────────────────────────
  // 3. DEMANDAS (mínimo 5)
  // ─────────────────────────────────────────────
  const demandasData = [
    {
      title: 'Entrega do Balanço Patrimonial 2025',
      description: 'Preparar e enviar o balanço patrimonial referente ao exercício de 2025 para a empresa Tech Solutions.',
      status: 'em_progresso' as const,
      priority: 'alta' as const,
      dueDate: new Date('2026-04-30'),
      assignedToId: userContador1.id,
      companyId: empTech.id,
    },
    {
      title: 'Declaração de Imposto de Renda PJ',
      description: 'Preparar a declaração de IRPJ para a empresa Comércio Rápido.',
      status: 'pendente' as const,
      priority: 'alta' as const,
      dueDate: new Date('2026-05-15'),
      assignedToId: userContador2.id,
      companyId: empComercio.id,
    },
    {
      title: 'Folha de Pagamento - Abril/2026',
      description: 'Processar e validar a folha de pagamento do mês de abril para a Indústria Beta.',
      status: 'pendente' as const,
      priority: 'media' as const,
      dueDate: new Date('2026-04-25'),
      assignedToId: userContador1.id,
      companyId: empIndustria.id,
    },
    {
      title: 'Revisão de Contratos com Fornecedores',
      description: 'Auditar e revisar todos os contratos ativos com fornecedores da Tech Solutions.',
      status: 'pendente' as const,
      priority: 'baixa' as const,
      dueDate: new Date('2026-06-01'),
      assignedToId: userGerente.id,
      companyId: empTech.id,
    },
    {
      title: 'Relatório de DRE Trimestral',
      description: 'Elaborar o Demonstrativo de Resultado do Exercício do 1º trimestre de 2026.',
      status: 'concluida' as const,
      priority: 'alta' as const,
      dueDate: new Date('2026-04-10'),
      assignedToId: userContador2.id,
      companyId: empComercio.id,
    },
    {
      title: 'Escrituração Fiscal Digital (EFD)',
      description: 'Transmitir o SPED Fiscal do mês de março/2026 para a Indústria Beta.',
      status: 'em_progresso' as const,
      priority: 'alta' as const,
      dueDate: new Date('2026-04-20'),
      assignedToId: userContador1.id,
      companyId: empIndustria.id,
    },
  ];

  for (const dem of demandasData) {
    const d = await prisma.demand.create({ data: dem });
    console.log(`  📋 Demanda: "${d.title}"`);
  }
  console.log(`✅ ${demandasData.length} demandas criadas.\n`);

  // ─────────────────────────────────────────────
  // 4. TEMPLATES DE CHECKLIST (2 templates)
  // ─────────────────────────────────────────────
  const templateFolha = await prisma.checklistTemplate.create({
    data: {
      title: 'Checklist Folha de Pagamento',
      description: 'Passos padrão para processamento da folha de pagamento mensal.',
      createdById: userGerente.id,
      items: {
        create: [
          { title: 'Coletar horas trabalhadas de todos os funcionários', priority: 'alta' },
          { title: 'Verificar férias e afastamentos do período', priority: 'media' },
          { title: 'Calcular horas extras e adicionais', priority: 'alta' },
          { title: 'Apurar encargos sociais (INSS, FGTS)', priority: 'alta' },
          { title: 'Gerar contracheques e enviar para aprovação', priority: 'media' },
        ],
      },
    },
  });

  const templateFiscal = await prisma.checklistTemplate.create({
    data: {
      title: 'Checklist Obrigações Fiscais Mensais',
      description: 'Roteiro para cumprimento das obrigações fiscais de cada mês.',
      createdById: userAdmin.id,
      items: {
        create: [
          { title: 'Apurar e recolher o ISS do mês', priority: 'alta' },
          { title: 'Calcular e pagar o PIS e COFINS', priority: 'alta' },
          { title: 'Transmitir a DCTF (mensal)', priority: 'alta' },
          { title: 'Verificar guias de INSS patronal', priority: 'media' },
          { title: 'Arquivar documentos fiscais do período', priority: 'baixa' },
        ],
      },
    },
  });

  console.log(`✅ Templates criados: "${templateFolha.title}", "${templateFiscal.title}"\n`);

  // ─────────────────────────────────────────────
  // 5. CHECKLISTS AVULSOS (vinculados a empresas)
  // ─────────────────────────────────────────────
  const checklistData = [
    {
      title: 'Integração Fiscal - Tech Solutions Abril/2026',
      serviceType: 'Fiscal',
      companyId: empTech.id,
      items: [
        { title: 'Coletar notas fiscais de entrada', priority: 'alta' as const },
        { title: 'Coletar notas fiscais de saída', priority: 'alta' as const },
        { title: 'Conciliar extrato bancário com lançamentos', priority: 'media' as const },
      ],
    },
    {
      title: 'Auditoria Interna - Comércio Rápido',
      serviceType: 'Auditoria',
      companyId: empComercio.id,
      items: [
        { title: 'Revisar caixa e equivalentes de caixa', priority: 'alta' as const },
        { title: 'Conferir estoque físico com sistema', priority: 'media' as const },
        { title: 'Analisar contas a receber vencidas', priority: 'media' as const },
      ],
    },
  ];

  for (const cl of checklistData) {
    const checklist = await prisma.checklist.create({
      data: {
        title: cl.title,
        serviceType: cl.serviceType,
        companyId: cl.companyId,
        items: { create: cl.items.map(i => ({ ...i, completed: false })) },
      },
    });
    console.log(`  ✔️  Checklist: "${checklist.title}"`);
  }
  console.log(`✅ ${checklistData.length} checklists avulsos criados.\n`);

  // ─────────────────────────────────────────────
  // 6. ATRIBUIÇÕES DE CHECKLIST (assignments)
  // ─────────────────────────────────────────────
  const assignmentFolha = await prisma.checklistAssignment.create({
    data: {
      templateId: templateFolha.id,
      assignedToId: userContador1.id,
      assignedById: userGerente.id,
      companyId: empIndustria.id,
      dueDate: new Date('2026-04-25'),
      status: 'pendente',
      items: {
        create: [
          { title: 'Coletar horas trabalhadas de todos os funcionários', priority: 'alta', completed: true },
          { title: 'Verificar férias e afastamentos do período', priority: 'media', completed: false },
          { title: 'Calcular horas extras e adicionais', priority: 'alta', completed: false },
          { title: 'Apurar encargos sociais (INSS, FGTS)', priority: 'alta', completed: false },
          { title: 'Gerar contracheques e enviar para aprovação', priority: 'media', completed: false },
        ],
      },
    },
  });

  const assignmentFiscal = await prisma.checklistAssignment.create({
    data: {
      templateId: templateFiscal.id,
      assignedToId: userContador2.id,
      assignedById: userAdmin.id,
      companyId: empTech.id,
      dueDate: new Date('2026-04-20'),
      status: 'em_progresso',
      items: {
        create: [
          { title: 'Apurar e recolher o ISS do mês', priority: 'alta', completed: true },
          { title: 'Calcular e pagar o PIS e COFINS', priority: 'alta', completed: true },
          { title: 'Transmitir a DCTF (mensal)', priority: 'alta', completed: false },
          { title: 'Verificar guias de INSS patronal', priority: 'media', completed: false },
          { title: 'Arquivar documentos fiscais do período', priority: 'baixa', completed: false },
        ],
      },
    },
  });

  console.log(`✅ Atribuições criadas: ${assignmentFolha.id.slice(0, 8)}..., ${assignmentFiscal.id.slice(0, 8)}...\n`);

  // ─────────────────────────────────────────────
  // RESUMO
  // ─────────────────────────────────────────────
  const totalUsers = await prisma.user.count();
  const totalCompanies = await prisma.company.count();
  const totalDemands = await prisma.demand.count();
  const totalChecklists = await prisma.checklist.count();
  const totalTemplates = await prisma.checklistTemplate.count();
  const totalAssignments = await prisma.checklistAssignment.count();

  console.log('─────────────────────────────────────────────');
  console.log('📊 Resumo do banco de dados após seed:');
  console.log(`   👤 Usuários:           ${totalUsers}`);
  console.log(`   🏢 Empresas:           ${totalCompanies}`);
  console.log(`   📋 Demandas:           ${totalDemands}`);
  console.log(`   ✔️  Checklists:         ${totalChecklists}`);
  console.log(`   📄 Templates:          ${totalTemplates}`);
  console.log(`   📌 Atribuições:        ${totalAssignments}`);
  console.log('─────────────────────────────────────────────');
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Dono:     admin@finode.com       / senha123');
  console.log('   Gerente:  gerente@finode.com     / senha123');
  console.log('   Contador: ana.contador@finode.com / senha123');
  console.log('   Contador: marcos.contador@finode.com / senha123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
