/**
 * Validador de Respostas - Inspirado na Meta AI
 *
 * Meta AI faz antes de enviar:
 * 1. Conta questões geradas vs solicitadas
 * 2. Verifica se URLs de imagens funcionam
 * 3. Verifica coerência e completude
 * 4. Se faltou algo, gera continuação automática
 */

export interface ValidacaoResposta {
  completa: boolean
  questoesSolicitadas: number
  questoesGeradas: number
  temReferencias: boolean
  temImagens: boolean
  imagensDetectadas: number
  precisaContinuar: boolean
  promptContinuacao: string
  itensIncompletos: string[]
  confianca: number // 0-100
}

/**
 * Conta questões em diferentes formatos de markdown
 */
function contarQuestoes(resposta: string): number {
  // Padrões para detectar questões
  const padroes = [
    /\*\*\s*(?:Questão\s*)?\d+[\.\)\:]]/gi,     // **1. ou **Questão 1. ou **1)
    /^#{1,3}\s*(?:Questão\s*)?\d+[\.\)\:]/gim,  // ### 1. ou ### Questão 1
    /^\d+[\.\)]\s*\*\*/gm,                       // 1. ** ou 1) **
    /📋\s*\*\*Questão\s*\d+/gi,                  // 📋 **Questão 1
    /\*\*\d+[\.\)]\s/g,                          // **1. ou **1)
    /^>\s*\*\*\d+/gm                             // > **1 (blockquote)
  ]

  let maxQuestoes = 0

  for (const padrao of padroes) {
    const matches = resposta.match(padrao) || []
    if (matches.length > maxQuestoes) {
      maxQuestoes = matches.length
    }
  }

  // Se não encontrou por padrões diretos, tentar contar por blocos de questão
  if (maxQuestoes === 0) {
    // Contar por blocos ```questao
    const blocosQuestao = resposta.match(/```questao/gi) || []
    if (blocosQuestao.length > 0) {
      maxQuestoes = blocosQuestao.length
    }
  }

  // Fallback: contar por conjuntos de alternativas (5 alternativas = 1 questão)
  if (maxQuestoes === 0) {
    const alternativas = resposta.match(/\n[a-e]\)/gi) || []
    const questoesPorAlternativas = Math.floor(alternativas.length / 5)
    if (questoesPorAlternativas > 0) {
      maxQuestoes = questoesPorAlternativas
    }
  }

  return maxQuestoes
}

/**
 * Extrai quantidade de questões solicitadas na mensagem
 */
function extrairQuestoesSolicitadas(mensagem: string): number {
  const msg = mensagem.toLowerCase()

  // Padrões: "5 questões", "questões (10)", "10 perguntas", "me dê 5"
  const padroes = [
    /(\d+)\s*(?:quest[õo]es?|perguntas?|exercícios?)/i,
    /(?:quest[õo]es?|perguntas?)\s*[\(:]?\s*(\d+)/i,
    /(?:me\s+)?(?:dê|faça|crie|gere)\s+(\d+)/i
  ]

  for (const padrao of padroes) {
    const match = msg.match(padrao)
    if (match) {
      return parseInt(match[1])
    }
  }

  // Se menciona questões sem número, assume 5
  if (msg.includes('questões') || msg.includes('questoes') || msg.includes('perguntas')) {
    return 5
  }

  return 0
}

/**
 * Verifica se a resposta tem referências
 */
function verificarReferencias(resposta: string): boolean {
  const resp = resposta.toLowerCase()

  const indicadoresReferencia = [
    'referência',
    'referências',
    'bibliografia',
    '📚',
    'fonte:',
    'fontes:',
    'disponível em:',
    'acesso em:',
    '[1]', '[2]', '[3]', // Citações inline
    'abnt',
    'et al'
  ]

  return indicadoresReferencia.some(ind => resp.includes(ind))
}

/**
 * Conta imagens detectadas na resposta
 */
function contarImagens(resposta: string): number {
  // Padrões de imagem markdown
  const imagensMarkdown = resposta.match(/!\[.*?\]\(.*?\)/g) || []

  // Padrões de URL de imagem diretas
  const urlsImagem = resposta.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|svg)/gi) || []

  // Emoji de imagem (indicador de busca)
  const emojisImagem = (resposta.match(/📷/g) || []).length

  return Math.max(imagensMarkdown.length, urlsImagem.length, emojisImagem > 0 ? 1 : 0)
}

/**
 * Verifica se a resposta foi truncada no meio
 */
function verificarTruncamento(resposta: string): boolean {
  const trimmed = resposta.trim()

  // Padrões que indicam truncamento
  const padroesTruncamento = [
    /\.{3,}$/,                     // Termina com ...
    /,\s*$/,                       // Termina com vírgula
    /:\s*$/,                       // Termina com dois pontos
    /```\s*$/,                     // Termina com bloco de código aberto
    /\d+\.\s*$/,                   // Termina com número de lista
    /-\s*$/,                       // Termina com hífen
    /[a-z]\s*$/i,                  // Termina com letra (sem pontuação)
    /e\s*$/i,                      // Termina com "e"
    /ou\s*$/i,                     // Termina com "ou"
    /com\s*$/i,                    // Termina com "com"
    /\(\s*$/,                      // Termina com parêntese aberto
    /\{\s*$/,                      // Termina com chave aberta
  ]

  return padroesTruncamento.some(padrao => padrao.test(trimmed))
}

/**
 * Valida a resposta completa e retorna análise detalhada
 */
export function validarResposta(
  resposta: string,
  mensagemOriginal: string
): ValidacaoResposta {
  const itensIncompletos: string[] = []
  const msg = mensagemOriginal.toLowerCase()

  // ========== 1. CONTAR QUESTÕES ==========
  const questoesSolicitadas = extrairQuestoesSolicitadas(mensagemOriginal)
  const questoesGeradas = contarQuestoes(resposta)

  if (questoesSolicitadas > 0 && questoesGeradas < questoesSolicitadas) {
    itensIncompletos.push(
      `questões (geradas ${questoesGeradas} de ${questoesSolicitadas})`
    )
  }

  // ========== 2. VERIFICAR REFERÊNCIAS ==========
  const temReferencias = verificarReferencias(resposta)

  // Verificar se deveria ter referências
  const precisaReferencias =
    msg.includes('explic') ||
    msg.includes('sobre') ||
    msg.includes('como funciona') ||
    questoesSolicitadas > 0 ||
    resposta.length > 1000

  if (precisaReferencias && !temReferencias) {
    itensIncompletos.push('referências bibliográficas')
  }

  // ========== 3. VERIFICAR IMAGENS ==========
  const imagensSolicitadas =
    msg.includes('imagem') ||
    msg.includes('imagens') ||
    msg.includes('figura') ||
    msg.includes('ilustr') ||
    msg.includes('mostre')

  const imagensDetectadas = contarImagens(resposta)
  const temImagens = imagensDetectadas > 0

  if (imagensSolicitadas && !temImagens) {
    itensIncompletos.push('imagens')
  }

  // ========== 4. VERIFICAR TRUNCAMENTO ==========
  const foiTruncada = verificarTruncamento(resposta)

  if (foiTruncada) {
    itensIncompletos.push('resposta cortada no meio')
  }

  // ========== 5. CALCULAR CONFIANÇA ==========
  let confianca = 100

  // Penalizar por itens faltantes
  confianca -= itensIncompletos.length * 20

  // Penalizar se questões incompletas (proporcional)
  if (questoesSolicitadas > 0) {
    const percentualQuestoes = (questoesGeradas / questoesSolicitadas) * 100
    if (percentualQuestoes < 100) {
      confianca -= (100 - percentualQuestoes) * 0.3
    }
  }

  // Garantir range 0-100
  confianca = Math.max(0, Math.min(100, confianca))

  // ========== 6. GERAR PROMPT DE CONTINUAÇÃO ==========
  let promptContinuacao = ''

  if (itensIncompletos.length > 0) {
    promptContinuacao = `CONTINUE a resposta de onde parou.

ATENÇÃO - ITENS FALTANTES:
${itensIncompletos.map((item, i) => `${i + 1}. ${item}`).join('\n')}

REGRAS OBRIGATÓRIAS:
- NÃO repita conteúdo já escrito
- NÃO faça introdução, vá DIRETO ao conteúdo faltante`

    if (questoesSolicitadas > 0 && questoesGeradas < questoesSolicitadas) {
      promptContinuacao += `
- Continue das questões a partir da QUESTÃO ${questoesGeradas + 1}
- Gere mais ${questoesSolicitadas - questoesGeradas} questões`
    }

    if (!temReferencias && precisaReferencias) {
      promptContinuacao += `
- Finalize com 📚 **Fontes:** seguido de referências ABNT`
    }

    promptContinuacao += `
- Termine perguntando se quer mais detalhes`
  }

  // ========== 7. RETORNAR VALIDAÇÃO ==========
  return {
    completa: itensIncompletos.length === 0,
    questoesSolicitadas,
    questoesGeradas,
    temReferencias,
    temImagens,
    imagensDetectadas,
    precisaContinuar: itensIncompletos.length > 0,
    promptContinuacao,
    itensIncompletos,
    confianca: Math.round(confianca)
  }
}

/**
 * Valida continuação e verifica se completou os itens faltantes
 */
export function validarContinuacao(
  respostaCompleta: string,
  mensagemOriginal: string,
  validacaoAnterior: ValidacaoResposta
): ValidacaoResposta {
  const novaValidacao = validarResposta(respostaCompleta, mensagemOriginal)

  // Log para debug
  console.log(`[Validação] Antes: ${validacaoAnterior.questoesGeradas}/${validacaoAnterior.questoesSolicitadas} questões`)
  console.log(`[Validação] Depois: ${novaValidacao.questoesGeradas}/${novaValidacao.questoesSolicitadas} questões`)
  console.log(`[Validação] Completa: ${novaValidacao.completa}`)

  return novaValidacao
}

/**
 * Gera um resumo da validação para logs
 */
export function gerarResumoValidacao(validacao: ValidacaoResposta): string {
  const status = validacao.completa ? '✅ COMPLETA' : '⚠️ INCOMPLETA'

  let resumo = `[Validação] ${status} (${validacao.confianca}% confiança)\n`

  if (validacao.questoesSolicitadas > 0) {
    resumo += `  Questões: ${validacao.questoesGeradas}/${validacao.questoesSolicitadas}\n`
  }

  resumo += `  Referências: ${validacao.temReferencias ? 'Sim' : 'Não'}\n`
  resumo += `  Imagens: ${validacao.imagensDetectadas}\n`

  if (validacao.itensIncompletos.length > 0) {
    resumo += `  Faltando: ${validacao.itensIncompletos.join(', ')}\n`
  }

  return resumo
}
