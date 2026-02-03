// Agente Planejador
// Responsavel por criar planos e cronogramas de estudo

import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

// ==========================================
// TIPOS E SCHEMAS
// ==========================================

export const PlanoEstudosSchema = z.object({
  titulo: z.string(),
  objetivo: z.string(),
  duracao: z.object({
    total_dias: z.number(),
    horas_por_dia: z.number(),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional()
  }),
  fases: z.array(z.object({
    nome: z.string(),
    duracao_dias: z.number(),
    foco: z.string(),
    topicos: z.array(z.string()),
    meta_questoes: z.number().optional(),
    meta_revisoes: z.number().optional()
  })),
  cronograma_semanal: z.array(z.object({
    dia: z.string(),
    manha: z.string().optional(),
    tarde: z.string().optional(),
    noite: z.string().optional()
  })),
  simulados: z.array(z.object({
    data: z.string(),
    tipo: z.string(),
    descricao: z.string()
  })).optional(),
  recomendacoes: z.array(z.string()),
  materiais_sugeridos: z.array(z.object({
    tipo: z.string(),
    nome: z.string(),
    prioridade: z.enum(['alta', 'media', 'baixa'])
  })).optional()
})

export type PlanoEstudos = z.infer<typeof PlanoEstudosSchema>

export interface PlanningTask {
  objetivo: string
  provaAlvo?: string
  dataProva?: string
  horasDisponiveis: number
  diasDisponiveis?: number
  areasFortes?: string[]
  areasFracas?: string[]
  contextoAdicional?: string
}

// ==========================================
// PROMPT DO AGENTE
// ==========================================

const PLANNER_SYSTEM_PROMPT = `Voce e um AGENTE PLANEJADOR especializado em preparacao para provas medicas.

SEU PAPEL:
- Criar planos de estudos personalizados
- Distribuir conteudo de forma otimizada
- Planejar revisoes espacadas
- Programar simulados estrategicos
- Adaptar carga horaria a disponibilidade

PRINCIPIOS DE PLANEJAMENTO:
1. PRIORIZACAO: Maior peso para areas fracas e temas mais cobrados
2. ESPACAMENTO: Revisoes distribuidas (1, 3, 7, 14, 30 dias)
3. INTERCALACAO: Alternar materias para melhor retencao
4. PRATICA ATIVA: Questoes > leitura passiva
5. DESCANSO: Incluir pausas estrategicas

DISTRIBUICAO TIPICA:
- 60% estudando novos conteudos
- 25% revisando conteudos anteriores
- 15% fazendo questoes e simulados

FORMATO DE SAIDA:
Retorne um JSON estruturado com plano completo.`

// ==========================================
// CLASSE DO AGENTE
// ==========================================

export class PlannerAgent {
  private model: ChatGoogleGenerativeAI | ChatAnthropic

  constructor(provider: 'gemini' | 'claude' = 'claude') {
    if (provider === 'claude') {
      this.model = new ChatAnthropic({
        modelName: 'claude-sonnet-4-20250514',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
        temperature: 0.5,
        maxTokens: 6000
      })
    } else {
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        apiKey: process.env.GEMINI_API_KEY!,
        temperature: 0.5,
        maxOutputTokens: 6000
      })
    }
  }

  /**
   * Cria um plano de estudos
   */
  async createPlan(task: PlanningTask): Promise<PlanoEstudos> {
    const {
      objetivo,
      provaAlvo,
      dataProva,
      horasDisponiveis,
      diasDisponiveis,
      areasFortes,
      areasFracas,
      contextoAdicional
    } = task

    console.log(`[PlannerAgent] Criando plano para: ${objetivo}`)

    // Calcular dias ate a prova se data fornecida
    let diasAteProva = diasDisponiveis || 90
    if (dataProva) {
      const hoje = new Date()
      const prova = new Date(dataProva)
      diasAteProva = Math.ceil((prova.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Construir prompt
    let userPrompt = `CRIAR PLANO DE ESTUDOS:\n\n`
    userPrompt += `Objetivo: ${objetivo}\n`

    if (provaAlvo) {
      userPrompt += `Prova alvo: ${provaAlvo}\n`
    }

    userPrompt += `Dias disponiveis: ${diasAteProva}\n`
    userPrompt += `Horas por dia: ${horasDisponiveis}\n`

    if (areasFortes && areasFortes.length > 0) {
      userPrompt += `Areas fortes: ${areasFortes.join(', ')}\n`
    }

    if (areasFracas && areasFracas.length > 0) {
      userPrompt += `Areas para melhorar: ${areasFracas.join(', ')}\n`
    }

    if (contextoAdicional) {
      userPrompt += `\nContexto adicional: ${contextoAdicional}\n`
    }

    userPrompt += `
Crie um plano de estudos detalhado em JSON:
{
  "titulo": "Plano de Estudos para...",
  "objetivo": "...",
  "duracao": {
    "total_dias": ${diasAteProva},
    "horas_por_dia": ${horasDisponiveis}
  },
  "fases": [
    {
      "nome": "Fase 1 - Base",
      "duracao_dias": X,
      "foco": "...",
      "topicos": ["..."],
      "meta_questoes": 50
    }
  ],
  "cronograma_semanal": [
    {"dia": "Segunda", "manha": "...", "tarde": "...", "noite": "..."}
  ],
  "simulados": [
    {"data": "Semana X", "tipo": "...", "descricao": "..."}
  ],
  "recomendacoes": ["..."],
  "materiais_sugeridos": [
    {"tipo": "Livro", "nome": "...", "prioridade": "alta"}
  ]
}`

    const response = await this.model.invoke([
      new SystemMessage(PLANNER_SYSTEM_PROMPT),
      new HumanMessage(userPrompt)
    ])

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

    // Extrair JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Nao foi possivel extrair plano do JSON')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return PlanoEstudosSchema.parse(parsed)
  }

  /**
   * Ajusta um plano existente baseado em feedback
   */
  async adjustPlan(
    planoAtual: PlanoEstudos,
    feedback: string
  ): Promise<PlanoEstudos> {
    const userPrompt = `AJUSTAR PLANO DE ESTUDOS:

PLANO ATUAL:
${JSON.stringify(planoAtual, null, 2)}

FEEDBACK DO USUARIO:
${feedback}

Ajuste o plano considerando o feedback e retorne o JSON atualizado.`

    const response = await this.model.invoke([
      new SystemMessage(PLANNER_SYSTEM_PROMPT),
      new HumanMessage(userPrompt)
    ])

    const content = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Nao foi possivel extrair plano ajustado')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return PlanoEstudosSchema.parse(parsed)
  }
}

// ==========================================
// FUNCAO PARA FORMATAR PLANO
// ==========================================

export function formatPlanoParaExibicao(plano: PlanoEstudos): string {
  let texto = `# ${plano.titulo}\n\n`
  texto += `**Objetivo:** ${plano.objetivo}\n\n`
  texto += `**Duracao:** ${plano.duracao.total_dias} dias | ${plano.duracao.horas_por_dia}h/dia\n\n`

  // Fases
  texto += `## Fases do Estudo\n\n`
  plano.fases.forEach((fase, i) => {
    texto += `### ${i + 1}. ${fase.nome} (${fase.duracao_dias} dias)\n`
    texto += `**Foco:** ${fase.foco}\n\n`
    texto += `**Topicos:**\n`
    fase.topicos.forEach(t => texto += `- ${t}\n`)
    if (fase.meta_questoes) {
      texto += `\n**Meta:** ${fase.meta_questoes} questoes\n`
    }
    texto += '\n'
  })

  // Cronograma semanal
  if (plano.cronograma_semanal.length > 0) {
    texto += `## Cronograma Semanal\n\n`
    texto += `| Dia | Manha | Tarde | Noite |\n`
    texto += `|-----|-------|-------|-------|\n`
    plano.cronograma_semanal.forEach(dia => {
      texto += `| ${dia.dia} | ${dia.manha || '-'} | ${dia.tarde || '-'} | ${dia.noite || '-'} |\n`
    })
    texto += '\n'
  }

  // Simulados
  if (plano.simulados && plano.simulados.length > 0) {
    texto += `## Simulados Programados\n\n`
    plano.simulados.forEach(sim => {
      texto += `- **${sim.data}** - ${sim.tipo}: ${sim.descricao}\n`
    })
    texto += '\n'
  }

  // Recomendacoes
  texto += `## Recomendacoes\n\n`
  plano.recomendacoes.forEach(rec => texto += `- ${rec}\n`)

  // Materiais
  if (plano.materiais_sugeridos && plano.materiais_sugeridos.length > 0) {
    texto += `\n## Materiais Sugeridos\n\n`
    plano.materiais_sugeridos.forEach(mat => {
      const prioridadeIcon = mat.prioridade === 'alta' ? '🔴' : mat.prioridade === 'media' ? '🟡' : '🟢'
      texto += `- ${prioridadeIcon} **${mat.tipo}:** ${mat.nome}\n`
    })
  }

  return texto
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export function createPlannerAgent(provider?: 'gemini' | 'claude'): PlannerAgent {
  return new PlannerAgent(provider)
}

// ==========================================
// EXPORT
// ==========================================

export default PlannerAgent
