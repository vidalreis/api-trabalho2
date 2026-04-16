/**
 * seed.ts — Popula o banco de dados SQLite com dados iniciais para demonstração.
 *
 * Execução:
 *   npm run seed
 *
 * O script é idempotente: limpa e recria todos os dados.
 * Total de registros: 72+ (excede o mínimo de 20 com folga)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados SQLite...\n');

  // Limpar dados existentes (ordem de dependências invertida)
  await prisma.checklistAssignmentItem.deleteMany();
  await prisma.checklistAssignment.deleteMany();
  await prisma.checklistTemplateItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Dados anteriores removidos.\n');

  // ─────────────────────────────────────────────
  // 1. USUÁRIOS (6 usuários)
  // ─────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('senha123', 10);

  const [userAdmin, userGerente, userContador1, userContador2, userContador3, userContador4] =
    await Promise.all([
      prisma.user.create({
        data: {
          name: 'Admin Finode',
          email: 'admin@finode.com',
          password: senhaHash,
          role: 'dono',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Carlos Mendes',
          email: 'gerente@finode.com',
          password: senhaHash,
          role: 'gerente',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Ana Paula Costa',
          email: 'ana.costa@finode.com',
          password: senhaHash,
          role: 'contador',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Marcos Silva',
          email: 'marcos.silva@finode.com',
          password: senhaHash,
          role: 'contador',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Beatriz Oliveira',
          email: 'beatriz.oliveira@finode.com',
          password: senhaHash,
          role: 'contador',
        },
      }),
      prisma.user.create({
        data: {
          name: 'Rafael Souza',
          email: 'rafael.souza@finode.com',
          password: senhaHash,
          role: 'contador',
        },
      }),
    ]);

  console.log('✅ 6 usuários criados.\n');

  // ─────────────────────────────────────────────
  // 2. EMPRESAS (6 empresas)
  // ─────────────────────────────────────────────
  const [empTech, empComercio, empIndustria, empServicos, empAgro, empConstruck] =
    await Promise.all([
      prisma.company.create({ data: { name: 'Tech Solutions Ltda', cnpj: '12.345.678/0001-90', status: 'ativo' } }),
      prisma.company.create({ data: { name: 'Comércio Rápido ME', cnpj: '98.765.432/0001-10', status: 'ativo' } }),
      prisma.company.create({ data: { name: 'Indústria Beta S.A.', cnpj: '11.222.333/0001-44', status: 'ativo' } }),
      prisma.company.create({ data: { name: 'Serviços Gamma Eireli', cnpj: '55.666.777/0001-88', status: 'inativo' } }),
      prisma.company.create({ data: { name: 'AgroVerde Agropecuária', cnpj: '33.444.555/0001-22', status: 'ativo' } }),
      prisma.company.create({ data: { name: 'Construck Engenharia', cnpj: '77.888.999/0001-66', status: 'ativo' } }),
    ]);

  console.log('✅ 6 empresas criadas.\n');

  // ─────────────────────────────────────────────
  // 3. DEMANDAS (12 demandas)
  // ─────────────────────────────────────────────
  const demandasData = [
    {
      title: 'Entrega do Balanço Patrimonial 2025',
      description: 'Preparar e enviar o balanço patrimonial referente ao exercício de 2025 para a empresa Tech Solutions.',
      status: 'em_progresso',
      priority: 'alta',
      dueDate: new Date('2026-04-30'),
      assignedToId: userContador1.id,
      companyId: empTech.id,
    },
    {
      title: 'Declaração de Imposto de Renda PJ',
      description: 'Preparar a declaração de IRPJ para a empresa Comércio Rápido.',
      status: 'pendente',
      priority: 'alta',
      dueDate: new Date('2026-05-15'),
      assignedToId: userContador2.id,
      companyId: empComercio.id,
    },
    {
      title: 'Folha de Pagamento — Abril/2026',
      description: 'Processar e validar a folha de pagamento do mês de abril para a Indústria Beta.',
      status: 'pendente',
      priority: 'media',
      dueDate: new Date('2026-04-25'),
      assignedToId: userContador1.id,
      companyId: empIndustria.id,
    },
    {
      title: 'Revisão de Contratos com Fornecedores',
      description: 'Auditar e revisar todos os contratos ativos com fornecedores da Tech Solutions.',
      status: 'pendente',
      priority: 'baixa',
      dueDate: new Date('2026-06-01'),
      assignedToId: userGerente.id,
      companyId: empTech.id,
    },
    {
      title: 'Relatório de DRE Trimestral',
      description: 'Elaborar o Demonstrativo de Resultado do Exercício do 1º trimestre de 2026.',
      status: 'concluida',
      priority: 'alta',
      dueDate: new Date('2026-04-10'),
      assignedToId: userContador2.id,
      companyId: empComercio.id,
    },
    {
      title: 'Escrituração Fiscal Digital (EFD)',
      description: 'Transmitir o SPED Fiscal do mês de março/2026 para a Indústria Beta.',
      status: 'em_progresso',
      priority: 'alta',
      dueDate: new Date('2026-04-20'),
      assignedToId: userContador1.id,
      companyId: empIndustria.id,
    },
    {
      title: 'Apuração de ICMS — AgroVerde',
      description: 'Realizar a apuração mensal do ICMS para AgroVerde Agropecuária.',
      status: 'pendente',
      priority: 'alta',
      dueDate: new Date('2026-04-28'),
      assignedToId: userContador3.id,
      companyId: empAgro.id,
    },
    {
      title: 'Levantamento de Ativos — Construck',
      description: 'Inventariar e depreciar todos os ativos fixos da Construck Engenharia.',
      status: 'pendente',
      priority: 'media',
      dueDate: new Date('2026-05-10'),
      assignedToId: userContador4.id,
      companyId: empConstruck.id,
    },
    {
      title: 'Regularização Cadastral — Serviços Gamma',
      description: 'Atualizar cadastro junto à Receita Federal para empresa inativa.',
      status: 'cancelada',
      priority: 'baixa',
      dueDate: new Date('2026-03-31'),
      assignedToId: userGerente.id,
      companyId: empServicos.id,
    },
    {
      title: 'Parcelamento de Débito PGFN',
      description: 'Negociar e formalizar parcelamento de débito com a Procuradoria da Fazenda Nacional.',
      status: 'em_progresso',
      priority: 'alta',
      dueDate: new Date('2026-04-22'),
      assignedToId: userContador3.id,
      companyId: empComercio.id,
    },
    {
      title: 'Relatório de Controle Interno — Tech Solutions',
      description: 'Elaborar relatório de controles internos sobre processos financeiros da Tech Solutions.',
      status: 'pendente',
      priority: 'media',
      dueDate: new Date('2026-05-20'),
      assignedToId: userContador4.id,
      companyId: empTech.id,
    },
    {
      title: 'Certificação Digital — AgroVerde',
      description: 'Renovar o certificado digital A1/A3 da AgroVerde Agropecuária.',
      status: 'concluida',
      priority: 'alta',
      dueDate: new Date('2026-04-05'),
      assignedToId: userContador1.id,
      companyId: empAgro.id,
    },
  ];

  for (const dem of demandasData) {
    await prisma.demand.create({ data: dem });
  }
  console.log(`✅ ${demandasData.length} demandas criadas.\n`);

  // ─────────────────────────────────────────────
  // 4. TEMPLATES DE CHECKLIST (3 templates, 15 itens)
  // ─────────────────────────────────────────────
  const [templateFolha, templateFiscal, templateAuditoria] = await Promise.all([
    prisma.checklistTemplate.create({
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
    }),
    prisma.checklistTemplate.create({
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
    }),
    prisma.checklistTemplate.create({
      data: {
        title: 'Checklist de Auditoria Interna',
        description: 'Procedimentos padrão para realização de auditoria interna.',
        createdById: userAdmin.id,
        items: {
          create: [
            { title: 'Revisar caixa e equivalentes de caixa', priority: 'alta' },
            { title: 'Conferir estoque físico com sistema', priority: 'media' },
            { title: 'Analisar contas a receber vencidas', priority: 'media' },
            { title: 'Verificar conciliação bancária', priority: 'alta' },
            { title: 'Emitir relatório final de auditoria', priority: 'alta' },
          ],
        },
      },
    }),
  ]);

  console.log('✅ 3 templates criados (15 itens de template).\n');

  // ─────────────────────────────────────────────
  // 5. CHECKLISTS AVULSOS (4 checklists, 12 itens)
  // ─────────────────────────────────────────────
  const checklistsData = [
    {
      title: 'Integração Fiscal — Tech Solutions Abril/2026',
      serviceType: 'Fiscal',
      companyId: empTech.id,
      items: [
        { title: 'Coletar notas fiscais de entrada', priority: 'alta' },
        { title: 'Coletar notas fiscais de saída', priority: 'alta' },
        { title: 'Conciliar extrato bancário com lançamentos', priority: 'media' },
      ],
    },
    {
      title: 'Auditoria Interna — Comércio Rápido',
      serviceType: 'Auditoria',
      companyId: empComercio.id,
      items: [
        { title: 'Revisar caixa e equivalentes de caixa', priority: 'alta' },
        { title: 'Conferir estoque físico com sistema', priority: 'media' },
        { title: 'Analisar contas a receber vencidas', priority: 'media' },
      ],
    },
    {
      title: 'Abertura de Filial — Construck Engenharia',
      serviceType: 'Societário',
      companyId: empConstruck.id,
      items: [
        { title: 'Registrar nova filial na Junta Comercial', priority: 'alta' },
        { title: 'Obter CNPJ da filial na Receita Federal', priority: 'alta' },
        { title: 'Inscrição na Prefeitura para ISS', priority: 'media' },
      ],
    },
    {
      title: 'Fechamento Contábil — AgroVerde Março/2026',
      serviceType: 'Contábil',
      companyId: empAgro.id,
      items: [
        { title: 'Lançar depreciações do mês', priority: 'media' },
        { title: 'Apurar resultado do exercício', priority: 'alta' },
        { title: 'Enviar balancete para aprovação da diretoria', priority: 'alta' },
      ],
    },
  ];

  for (const cl of checklistsData) {
    await prisma.checklist.create({
      data: {
        title: cl.title,
        serviceType: cl.serviceType,
        companyId: cl.companyId,
        items: { create: cl.items.map((i) => ({ ...i, completed: false })) },
      },
    });
  }
  console.log(`✅ ${checklistsData.length} checklists criados (12 itens).\n`);

  // ─────────────────────────────────────────────
  // 6. ATRIBUIÇÕES (4 assignments, 20 itens)
  // ─────────────────────────────────────────────
  await Promise.all([
    prisma.checklistAssignment.create({
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
    }),
    prisma.checklistAssignment.create({
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
    }),
    prisma.checklistAssignment.create({
      data: {
        templateId: templateAuditoria.id,
        assignedToId: userContador3.id,
        assignedById: userGerente.id,
        companyId: empAgro.id,
        dueDate: new Date('2026-05-15'),
        status: 'pendente',
        items: {
          create: [
            { title: 'Revisar caixa e equivalentes de caixa', priority: 'alta', completed: false },
            { title: 'Conferir estoque físico com sistema', priority: 'media', completed: false },
            { title: 'Analisar contas a receber vencidas', priority: 'media', completed: false },
            { title: 'Verificar conciliação bancária', priority: 'alta', completed: false },
            { title: 'Emitir relatório final de auditoria', priority: 'alta', completed: false },
          ],
        },
      },
    }),
    prisma.checklistAssignment.create({
      data: {
        templateId: templateFiscal.id,
        assignedToId: userContador4.id,
        assignedById: userAdmin.id,
        companyId: empConstruck.id,
        dueDate: new Date('2026-04-30'),
        status: 'concluida',
        items: {
          create: [
            { title: 'Apurar e recolher o ISS do mês', priority: 'alta', completed: true },
            { title: 'Calcular e pagar o PIS e COFINS', priority: 'alta', completed: true },
            { title: 'Transmitir a DCTF (mensal)', priority: 'alta', completed: true },
            { title: 'Verificar guias de INSS patronal', priority: 'media', completed: true },
            { title: 'Arquivar documentos fiscais do período', priority: 'baixa', completed: true },
          ],
        },
      },
    }),
  ]);

  console.log('✅ 4 atribuições criadas (20 itens de assignment).\n');

  // ─────────────────────────────────────────────
  // RESUMO
  // ─────────────────────────────────────────────
  const [
    totalUsers, totalCompanies, totalDemands, totalChecklists,
    totalChecklistItems, totalTemplates, totalTemplateItems,
    totalAssignments, totalAssignmentItems,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.company.count(),
    prisma.demand.count(),
    prisma.checklist.count(),
    prisma.checklistItem.count(),
    prisma.checklistTemplate.count(),
    prisma.checklistTemplateItem.count(),
    prisma.checklistAssignment.count(),
    prisma.checklistAssignmentItem.count(),
  ]);

  const total = totalUsers + totalCompanies + totalDemands + totalChecklists +
    totalChecklistItems + totalTemplates + totalTemplateItems +
    totalAssignments + totalAssignmentItems;

  console.log('─────────────────────────────────────────────────────');
  console.log('📊 Resumo do banco de dados após seed:');
  console.log(`   👤 Usuários:                  ${totalUsers}`);
  console.log(`   🏢 Empresas:                  ${totalCompanies}`);
  console.log(`   📋 Demandas:                  ${totalDemands}`);
  console.log(`   ✔️  Checklists:                ${totalChecklists}`);
  console.log(`   📝 Itens de Checklist:        ${totalChecklistItems}`);
  console.log(`   📄 Templates:                 ${totalTemplates}`);
  console.log(`   📝 Itens de Template:         ${totalTemplateItems}`);
  console.log(`   📌 Atribuições:               ${totalAssignments}`);
  console.log(`   📝 Itens de Atribuição:       ${totalAssignmentItems}`);
  console.log('─────────────────────────────────────────────────────');
  console.log(`   📦 TOTAL DE REGISTROS:        ${total}`);
  console.log('─────────────────────────────────────────────────────');
  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Dono:     admin@finode.com            / senha123');
  console.log('   Gerente:  gerente@finode.com          / senha123');
  console.log('   Contador: ana.costa@finode.com        / senha123');
  console.log('   Contador: marcos.silva@finode.com     / senha123');
  console.log('   Contador: beatriz.oliveira@finode.com / senha123');
  console.log('   Contador: rafael.souza@finode.com     / senha123');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
