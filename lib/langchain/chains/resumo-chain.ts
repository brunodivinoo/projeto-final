// LangChain - Chain para Geracao de Resumos
// Gera resumos estruturados de conteudo medico

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

// ==========================================
// TIPOS E SCHEMAS
// ==========================================

export const ResumoSchema = z.object({
  titulo: z.string(),
  introducao: z.string(),
  topicos: z.array(z.object({
    titulo: z.string(),
    conteudo: z.string(),
    pontosChave: z.array(z.string())
  })),
  conclusao: z.string(),
  diagramas: z.array(z.object({
    tipo: z.enum(['mermaid', 'tabela', 'lista']),
    titulo: z.string(),
    conteudo: z.string()
  })).optional(),
  referencias: z.array(z.string()).optional(),
  memorize: z.array(z.string()).optional() // Pontos para memorizar
})

export type Resumo = z.infer<typeof ResumoSchema>

// ==========================================
// PROMPT PARA GERACAO DE RESUMOS
// ==========================================

const RESUMO_SYSTEM_PROMPT = `Voce e um especialista em criar resumos didaticos para estudantes de medicina.

ESTRUTURA DO RESUMO:
1. INTRODUCAO: Contextualizacao breve do tema
2. TOPICOS: Dividir o conteudo em secoes logicas
   - Cada topico com titulo, conteudo e pontos-chave
3. DIAGRAMAS: Incluir quando util
   - Mermaid para fluxogramas e diagramas
   - Tabelas para comparacoes
4. CONCLUSAO: Sintese e conexoes clinicas
5. MEMORIZE: Lista de itens essenciais para prova

REGRAS:
- Use linguagem clara e objetiva
- Destaque informacoes clinicamente relevantes
- Inclua mneumonicos quando possivel
- Relacione teoria com pratica clinica
- Foque no que cai em provas de residencia

FORMATO MERMAID PARA DIAGRAMAS:
\`\`\`mermaid
graph TD
    A[Inicio] --> B{Decisao}
    B -->|Sim| C[Acao 1]
    B -->|Nao| D[Acao 2]
\`\`\`

ESTRUTURA JSON OBRIGATORIA:
{
  "titulo": "Resumo de Insuficiencia Cardiaca",
  "introducao": "A ICC e uma sindrome clinica...",
  "topicos": [
    {
      "titulo": "Definicao e Epidemiologia",
      "conteudo": "Texto detalhado...",
      "pontosChave": ["Ponto 1", "Ponto 2"]
    }
  ],
  "conclusao": "Em resumo...",
  "diagramas": [
    {
      "tipo": "mermaid",
      "titulo": "Fluxograma de Tratamento",
      "conteudo": "graph TD\\n    A[Diagnostico] --> B{FEVE}"
    },
    {
      "tipo": "tabela",
      "titulo": "Comparacao de Medicamentos",
      "conteudo": "| Medicamento | Indicacao | Dose |\\n|---|---|---|\\n| IECA | FEVE reduzida | ..."
    }
  ],
  "memorize": [
    "FEVE < 40% = IC com fracao reduzida",
    "IECA + BB + Espironolactona = tripla terapia"
  ]
}

RESPONDA APENAS O JSON, SEM TEXTO ADICIONAL.`

// ==========================================
// FUNCAO PRINCIPAL
// ==========================================

export interface ResumoChainInput {
  tema: string
  profundidade?: 'basico' | 'intermediario' | 'avancado'
  focoEm?: string[] // Aspectos especificos para focar
  incluirDiagramas?: boolean
  provider?: 'claude' | 'gemini'
  contextoAdicional?: string
}

export async function runResumoChain(input: ResumoChainInput): Promise<Resumo> {
  const {
    tema,
    profundidade = 'intermediario',
    focoEm,
    incluirDiagramas = true,
    provider = 'gemini', // Gemini Flash para otimizar custo (40x mais barato)
    contextoAdicional
  } = input

  // Construir prompt
  let userPrompt = `Crie um resumo completo sobre: ${tema}\n\n`
  userPrompt += `Profundidade: ${profundidade}\n`

  if (focoEm && focoEm.length > 0) {
    userPrompt += `Foque especialmente em: ${focoEm.join(', ')}\n`
  }

  if (incluirDiagramas) {
    userPrompt += `Inclua diagramas Mermaid e tabelas quando apropriado.\n`
  }

  if (contextoAdicional) {
    userPrompt += `\nContexto adicional: ${contextoAdicional}\n`
  }

  userPrompt += `\nResponda APENAS com o JSON estruturado.`

  // Selecionar modelo
  let llm

  if (provider === 'claude') {
    llm = new ChatAnthropic({
      modelName: 'claude-sonnet-4-20250514',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
      temperature: 0.6,
      maxTokens: 8000
    })
  } else {
    llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      temperature: 0.6,
      maxOutputTokens: 8000
    })
  }

  // Executar
  const response = await llm.invoke([
    new SystemMessage(RESUMO_SYSTEM_PROMPT),
    new HumanMessage(userPrompt)
  ])

  const content = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content)

  // Extrair JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Nao foi possivel extrair JSON da resposta')
  }

  // Parsear e validar
  const parsed = JSON.parse(jsonMatch[0])
  const validated = ResumoSchema.parse(parsed)

  return validated
}

// ==========================================
// FUNCAO PARA FORMATAR PARA EXIBICAO
// ==========================================

export function formatResumoParaExibicao(resumo: Resumo): string {
  let texto = `# ${resumo.titulo}\n\n`
  texto += `## Introducao\n${resumo.introducao}\n\n`

  // Topicos
  resumo.topicos.forEach(topico => {
    texto += `## ${topico.titulo}\n\n`
    texto += `${topico.conteudo}\n\n`

    if (topico.pontosChave.length > 0) {
      texto += `**Pontos-chave:**\n`
      topico.pontosChave.forEach(ponto => {
        texto += `- ${ponto}\n`
      })
      texto += '\n'
    }
  })

  // Diagramas
  if (resumo.diagramas && resumo.diagramas.length > 0) {
    texto += `## Diagramas e Tabelas\n\n`
    resumo.diagramas.forEach(diagrama => {
      texto += `### ${diagrama.titulo}\n\n`
      if (diagrama.tipo === 'mermaid') {
        texto += '```mermaid\n'
        texto += diagrama.conteudo
        texto += '\n```\n\n'
      } else {
        texto += diagrama.conteudo + '\n\n'
      }
    })
  }

  // Conclusao
  texto += `## Conclusao\n${resumo.conclusao}\n\n`

  // Memorize
  if (resumo.memorize && resumo.memorize.length > 0) {
    texto += `## MEMORIZE (para a prova)\n\n`
    resumo.memorize.forEach((item, i) => {
      texto += `${i + 1}. ${item}\n`
    })
    texto += '\n'
  }

  // Referencias
  if (resumo.referencias && resumo.referencias.length > 0) {
    texto += `## Referencias\n\n`
    resumo.referencias.forEach(ref => {
      texto += `- ${ref}\n`
    })
  }

  return texto
}

// ==========================================
// EXPORT
// ==========================================

export default {
  runResumoChain,
  formatResumoParaExibicao,
  ResumoSchema
}
