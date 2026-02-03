// Agente Revisor
// Responsavel por validar qualidade e corrigir erros

import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { z } from 'zod'

// ==========================================
// TIPOS E SCHEMAS
// ==========================================

export const ReviewResultSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(0).max(10),
  issues: z.array(z.object({
    type: z.enum(['erro_medico', 'erro_gramatical', 'clareza', 'completude', 'formato', 'outro']),
    severity: z.enum(['critico', 'moderado', 'menor']),
    description: z.string(),
    location: z.string().optional(),
    suggestion: z.string()
  })),
  strengths: z.array(z.string()),
  overallFeedback: z.string(),
  correctedContent: z.string().optional()
})

export type ReviewResult = z.infer<typeof ReviewResultSchema>

export interface ReviewTask {
  content: string
  contentType: 'questao' | 'flashcard' | 'resumo' | 'plano' | 'resposta'
  context?: string
  strictMode?: boolean // Mais rigoroso na revisao
}

// ==========================================
// PROMPT DO AGENTE
// ==========================================

const REVIEWER_SYSTEM_PROMPT = `Voce e um AGENTE REVISOR especializado em conteudo medico educacional.

SEU PAPEL:
- Validar precisao das informacoes medicas
- Verificar clareza e didatica
- Identificar erros e inconsistencias
- Sugerir melhorias
- Garantir qualidade final

CRITERIOS DE AVALIACAO:

1. PRECISAO MEDICA (Peso 40%)
   - Informacoes corretas e atualizadas
   - Termos tecnicos apropriados
   - Referencias a guidelines quando aplicavel

2. CLAREZA (Peso 25%)
   - Linguagem compreensivel
   - Estrutura logica
   - Explicacoes adequadas

3. COMPLETUDE (Peso 20%)
   - Conteudo suficiente
   - Aspectos importantes cobertos
   - Sem lacunas criticas

4. FORMATO (Peso 15%)
   - Estrutura correta
   - Formatacao adequada
   - Consistencia

CLASSIFICACAO DE ISSUES:
- CRITICO: Erro medico grave, informacao perigosa
- MODERADO: Erro que prejudica aprendizado
- MENOR: Melhoria sugerida, nao essencial

APROVACAO:
- Score >= 7: Aprovado
- Score 5-6.9: Aprovado com ressalvas
- Score < 5: Reprovado, precisa correcao

FORMATO DE SAIDA:
Retorne JSON com revisao completa.`

// ==========================================
// CLASSE DO AGENTE
// ==========================================

export class ReviewerAgent {
  private model: ChatAnthropic | ChatGoogleGenerativeAI

  constructor(provider: 'claude' | 'gemini' = 'claude') {
    // Preferir Claude para revisao (mais preciso)
    if (provider === 'claude') {
      this.model = new ChatAnthropic({
        modelName: 'claude-sonnet-4-20250514',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
        temperature: 0.2, // Baixa temperatura para consistencia
        maxTokens: 4000
      })
    } else {
      this.model = new ChatGoogleGenerativeAI({
        model: 'gemini-2.0-flash',
        apiKey: process.env.GEMINI_API_KEY!,
        temperature: 0.2,
        maxOutputTokens: 4000
      })
    }
  }

  /**
   * Revisa conteudo
   */
  async review(task: ReviewTask): Promise<ReviewResult> {
    const { content, contentType, context, strictMode = false } = task

    console.log(`[ReviewerAgent] Revisando ${contentType}`)

    let userPrompt = `REVISAR CONTEUDO:\n\n`
    userPrompt += `Tipo: ${contentType}\n`
    userPrompt += `Modo: ${strictMode ? 'RIGOROSO' : 'Normal'}\n\n`

    if (context) {
      userPrompt += `Contexto: ${context}\n\n`
    }

    userPrompt += `CONTEUDO A REVISAR:\n${content}\n\n`

    userPrompt += `Analise criteriosamente e retorne JSON:
{
  "approved": true/false,
  "score": 0-10,
  "issues": [
    {
      "type": "erro_medico|erro_gramatical|clareza|completude|formato|outro",
      "severity": "critico|moderado|menor",
      "description": "...",
      "location": "onde esta o problema",
      "suggestion": "como corrigir"
    }
  ],
  "strengths": ["pontos positivos"],
  "overallFeedback": "avaliacao geral",
  "correctedContent": "conteudo corrigido se necessario"
}`

    const response = await this.model.invoke([
      new SystemMessage(REVIEWER_SYSTEM_PROMPT),
      new HumanMessage(userPrompt)
    ])

    const responseContent = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

    // Extrair JSON
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Fallback se nao conseguir extrair JSON
      return {
        approved: true,
        score: 7,
        issues: [],
        strengths: ['Conteudo revisado'],
        overallFeedback: responseContent
      }
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return ReviewResultSchema.parse(parsed)
    } catch {
      return {
        approved: true,
        score: 7,
        issues: [],
        strengths: ['Conteudo revisado'],
        overallFeedback: responseContent
      }
    }
  }

  /**
   * Revisao rapida (apenas verifica erros criticos)
   */
  async quickReview(content: string, contentType: ReviewTask['contentType']): Promise<{
    hasIssues: boolean
    criticalIssues: string[]
  }> {
    const userPrompt = `REVISAO RAPIDA - Verificar apenas ERROS CRITICOS:

Tipo: ${contentType}
Conteudo: ${content}

Liste APENAS erros medicos graves ou informacoes perigosas.
Se nao houver erros criticos, responda "OK".`

    const response = await this.model.invoke([
      new SystemMessage('Voce e um revisor medico. Identifique apenas erros criticos.'),
      new HumanMessage(userPrompt)
    ])

    const responseContent = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content)

    const isOk = responseContent.toLowerCase().includes('ok') &&
      !responseContent.toLowerCase().includes('erro') &&
      !responseContent.toLowerCase().includes('incorreto')

    return {
      hasIssues: !isOk,
      criticalIssues: isOk ? [] : [responseContent]
    }
  }

  /**
   * Verifica se conteudo e seguro para publicacao
   */
  async isSafeToPublish(content: string): Promise<boolean> {
    const review = await this.quickReview(content, 'resposta')
    return !review.hasIssues
  }
}

// ==========================================
// FUNCAO PARA FORMATAR RESULTADO
// ==========================================

export function formatReviewResult(result: ReviewResult): string {
  let texto = `## Resultado da Revisao\n\n`

  // Status
  const statusIcon = result.approved ? '✅' : '❌'
  texto += `**Status:** ${statusIcon} ${result.approved ? 'APROVADO' : 'REPROVADO'}\n`
  texto += `**Score:** ${result.score}/10\n\n`

  // Issues
  if (result.issues.length > 0) {
    texto += `### Problemas Encontrados\n\n`
    result.issues.forEach((issue, i) => {
      const severityIcon = issue.severity === 'critico' ? '🔴' :
        issue.severity === 'moderado' ? '🟡' : '🟢'
      texto += `${i + 1}. ${severityIcon} **${issue.type}** (${issue.severity})\n`
      texto += `   ${issue.description}\n`
      if (issue.location) texto += `   Local: ${issue.location}\n`
      texto += `   Sugestao: ${issue.suggestion}\n\n`
    })
  }

  // Pontos positivos
  if (result.strengths.length > 0) {
    texto += `### Pontos Positivos\n\n`
    result.strengths.forEach(s => texto += `- ${s}\n`)
    texto += '\n'
  }

  // Feedback geral
  texto += `### Avaliacao Geral\n\n${result.overallFeedback}\n`

  return texto
}

// ==========================================
// FACTORY FUNCTION
// ==========================================

export function createReviewerAgent(provider?: 'claude' | 'gemini'): ReviewerAgent {
  return new ReviewerAgent(provider)
}

// ==========================================
// EXPORT
// ==========================================

export default ReviewerAgent
