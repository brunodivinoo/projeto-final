/**
 * Verificador de Qualidade - Inspirado na Meta AI
 *
 * Meta AI verifica antes de enviar:
 * - Coerência com a pergunta
 * - Relevância do conteúdo
 * - Tamanho adequado
 * - Completude da resposta
 */

export interface MetricasQualidade {
  coerencia: number       // 0-1: resposta faz sentido com a pergunta?
  relevancia: number      // 0-1: resposta é relevante ao tema?
  completude: number      // 0-1: resposta está completa?
  tamanhoAdequado: boolean
  score: number           // 0-1: média geral
  aprovada: boolean
  sugestoes: string[]
  detalhes: {
    palavrasTotal: number
    questoesDetectadas: number
    imagensDetectadas: number
    temReferencias: boolean
    foiTruncada: boolean
  }
}

export interface ExpectativasResposta {
  questoesEsperadas?: number
  imagensEsperadas?: boolean
  referenciasEsperadas?: boolean
  nivelDetalhe?: 'resumido' | 'normal' | 'detalhado'
  formatoEsperado?: 'paragrafos' | 'lista' | 'misto' | 'questoes'
}

// Termos educacionais/médicos que indicam relevância
const TERMOS_EDUCACIONAIS = [
  'função', 'funções', 'estrutura', 'estruturas',
  'processo', 'processos', 'sistema', 'sistemas',
  'órgão', 'órgãos', 'célula', 'células',
  'característica', 'características', 'importância',
  'exemplo', 'exemplos', 'causa', 'causas',
  'efeito', 'efeitos', 'consequência', 'consequências',
  'tratamento', 'tratamentos', 'diagnóstico', 'diagnósticos',
  'sintoma', 'sintomas', 'sinal', 'sinais',
  'anatomia', 'fisiologia', 'patologia', 'fisiopatologia',
  'mecanismo', 'mecanismos', 'via', 'vias',
  'receptor', 'receptores', 'hormônio', 'hormônios',
  'enzima', 'enzimas', 'proteína', 'proteínas',
  'medicamento', 'medicamentos', 'fármaco', 'fármacos',
  'indicação', 'indicações', 'contraindicação', 'contraindicações',
  'classificação', 'classificações', 'tipo', 'tipos',
  'fase', 'fases', 'etapa', 'etapas', 'estágio', 'estágios',
]

// Padrões que indicam truncamento
const PADROES_TRUNCAMENTO = [
  /\.{3,}$/,                     // Termina com ...
  /,\s*$/,                       // Termina com vírgula
  /:\s*$/,                       // Termina com dois pontos
  /```\s*$/,                     // Termina com bloco de código aberto
  /\d+\.\s*$/,                   // Termina com número de lista
  /-\s*$/,                       // Termina com hífen
  /[a-záéíóú]\s*$/i,             // Termina com letra minúscula (sem pontuação)
  /\be\s*$/i,                    // Termina com "e"
  /\bou\s*$/i,                   // Termina com "ou"
  /\bcom\s*$/i,                  // Termina com "com"
  /\bde\s*$/i,                   // Termina com "de"
  /\bpara\s*$/i,                 // Termina com "para"
  /\(\s*$/,                      // Termina com parêntese aberto
  /\{\s*$/,                      // Termina com chave aberta
  /\[\s*$/,                      // Termina com colchete aberto
]

/**
 * Conta questões na resposta usando vários padrões
 */
function contarQuestoes(resposta: string): number {
  const padroes = [
    /\*\*\s*(?:Questão\s*)?(\d+)[\.\)]/gi,     // **1. ou **Questão 1)
    /^#{1,3}\s*(?:Questão\s*)?(\d+)[\.\)]/gim, // ### 1. ou ### Questão 1
    /^(\d+)[\.\)]\s*\*\*/gm,                   // 1. ** ou 1) **
    /📋\s*\*\*Questão\s*(\d+)/gi,              // 📋 **Questão 1
    /\*\*(\d+)[\.\)]\s/g,                      // **1. ou **1)
    /questão\s+(\d+)\s+de\s+\d+/gi,            // Questão 1 de 5
  ]

  const numerosEncontrados = new Set<number>()

  for (const padrao of padroes) {
    let match
    while ((match = padrao.exec(resposta)) !== null) {
      const numero = parseInt(match[1])
      if (numero > 0 && numero <= 100) { // Limite razoável
        numerosEncontrados.add(numero)
      }
    }
  }

  // Se encontrou números, retorna o maior (indica quantas questões tem)
  if (numerosEncontrados.size > 0) {
    return Math.max(...numerosEncontrados)
  }

  // Fallback: contar por blocos de alternativas
  const blocos = resposta.match(/\n[a-e]\)/gi) || []
  return Math.floor(blocos.length / 5)
}

/**
 * Conta imagens na resposta
 */
function contarImagens(resposta: string): number {
  const imagensMarkdown = resposta.match(/!\[.*?\]\(.*?\)/g) || []
  const urlsImagem = resposta.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|svg)/gi) || []
  const emojisImagem = (resposta.match(/📷/g) || []).length

  return Math.max(imagensMarkdown.length, urlsImagem.length, emojisImagem > 0 ? 1 : 0)
}

/**
 * Verifica se tem referências bibliográficas
 */
function temReferencias(resposta: string): boolean {
  const respostaLower = resposta.toLowerCase()

  const indicadores = [
    'referência', 'referências', 'referencias',
    'bibliografia', 'fontes:', 'fonte:',
    '📚', 'disponível em:', 'acesso em:',
    '[1]', '[2]', '[3]', // Citações inline
    'et al', 'abnt',
  ]

  return indicadores.some(ind => respostaLower.includes(ind))
}

/**
 * Verifica se a resposta foi truncada
 */
function foiTruncada(resposta: string): boolean {
  const trimmed = resposta.trim()
  return PADROES_TRUNCAMENTO.some(padrao => padrao.test(trimmed))
}

/**
 * Extrai termos da pergunta (para verificar coerência)
 */
function extrairTermosPergunta(pergunta: string): string[] {
  return pergunta
    .toLowerCase()
    .replace(/[^\wáéíóúâêîôûãõç]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 4)
}

/**
 * Verifica qualidade da resposta antes de enviar (como Meta AI)
 */
export function verificarQualidade(
  pergunta: string,
  resposta: string,
  expectativas: ExpectativasResposta = {}
): MetricasQualidade {
  const sugestoes: string[] = []
  const respostaLower = resposta.toLowerCase()

  // Detalhes para análise
  const palavrasTotal = resposta.split(/\s+/).length
  const questoesDetectadas = contarQuestoes(resposta)
  const imagensDetectadas = contarImagens(resposta)
  const temRef = temReferencias(resposta)
  const truncada = foiTruncada(resposta)

  // ========== 1. COERÊNCIA ==========
  // Verifica se a resposta menciona termos da pergunta
  const termosPergunta = extrairTermosPergunta(pergunta)
  const termosEncontrados = termosPergunta.filter(t => respostaLower.includes(t))
  const coerencia = termosPergunta.length > 0
    ? Math.min(termosEncontrados.length / termosPergunta.length, 1)
    : 0.7 // Default se pergunta muito curta

  if (coerencia < 0.4) {
    sugestoes.push('Resposta pode não estar alinhada com a pergunta')
  }

  // ========== 2. RELEVÂNCIA ==========
  // Verifica se contém termos educacionais/médicos
  const termosEncontradosEdu = TERMOS_EDUCACIONAIS.filter(t => respostaLower.includes(t))
  const relevancia = Math.min(termosEncontradosEdu.length / 8, 1) // 8+ termos = 100%

  if (relevancia < 0.3) {
    sugestoes.push('Resposta pode ter pouco conteúdo educacional')
  }

  // ========== 3. COMPLETUDE ==========
  let completude = 1.0

  // Verificar questões esperadas
  if (expectativas.questoesEsperadas && expectativas.questoesEsperadas > 0) {
    const proporcao = questoesDetectadas / expectativas.questoesEsperadas
    completude *= Math.min(proporcao, 1)

    if (questoesDetectadas < expectativas.questoesEsperadas) {
      sugestoes.push(`Faltam ${expectativas.questoesEsperadas - questoesDetectadas} questões`)
    }
  }

  // Verificar referências esperadas
  if (expectativas.referenciasEsperadas && !temRef) {
    completude *= 0.85
    sugestoes.push('Faltam referências bibliográficas')
  }

  // Verificar imagens esperadas
  if (expectativas.imagensEsperadas && imagensDetectadas === 0) {
    completude *= 0.9
    sugestoes.push('Não incluiu imagens de referência')
  }

  // Verificar truncamento
  if (truncada) {
    completude *= 0.7
    sugestoes.push('Resposta parece estar cortada no meio')
  }

  // ========== 4. TAMANHO ADEQUADO ==========
  let tamanhoAdequado = true

  if (expectativas.nivelDetalhe === 'resumido' && palavrasTotal > 350) {
    tamanhoAdequado = false
    sugestoes.push('Resposta muito longa para um resumo')
  } else if (expectativas.nivelDetalhe === 'detalhado' && palavrasTotal < 200) {
    tamanhoAdequado = false
    sugestoes.push('Resposta curta demais para nível detalhado')
  }

  // Verificar se resposta é muito curta para o contexto
  if (palavrasTotal < 50 && !pergunta.toLowerCase().includes('sim ou não')) {
    tamanhoAdequado = false
    sugestoes.push('Resposta muito curta')
  }

  // ========== 5. CALCULAR SCORE FINAL ==========
  const pesos = {
    coerencia: 0.25,
    relevancia: 0.25,
    completude: 0.35,
    tamanho: 0.15
  }

  const score =
    coerencia * pesos.coerencia +
    relevancia * pesos.relevancia +
    completude * pesos.completude +
    (tamanhoAdequado ? 1 : 0.5) * pesos.tamanho

  // Aprovada se score >= 0.7 e não está truncada criticamente
  const aprovada = score >= 0.7 && completude >= 0.75 && !truncada

  return {
    coerencia,
    relevancia,
    completude,
    tamanhoAdequado,
    score,
    aprovada,
    sugestoes,
    detalhes: {
      palavrasTotal,
      questoesDetectadas,
      imagensDetectadas,
      temReferencias: temRef,
      foiTruncada: truncada,
    }
  }
}

/**
 * Gera relatório de qualidade para logs
 */
export function gerarRelatorioQualidade(metricas: MetricasQualidade): string {
  const status = metricas.aprovada ? '✅ APROVADA' : '⚠️ PRECISA MELHORIA'
  const scorePercent = (metricas.score * 100).toFixed(0)

  let relatorio = `[Qualidade] ${status} (${scorePercent}%)\n`
  relatorio += `  Coerência: ${(metricas.coerencia * 100).toFixed(0)}%\n`
  relatorio += `  Relevância: ${(metricas.relevancia * 100).toFixed(0)}%\n`
  relatorio += `  Completude: ${(metricas.completude * 100).toFixed(0)}%\n`
  relatorio += `  Tamanho: ${metricas.tamanhoAdequado ? 'OK' : 'Inadequado'}\n`
  relatorio += `  Palavras: ${metricas.detalhes.palavrasTotal}\n`

  if (metricas.detalhes.questoesDetectadas > 0) {
    relatorio += `  Questões: ${metricas.detalhes.questoesDetectadas}\n`
  }

  if (metricas.detalhes.imagensDetectadas > 0) {
    relatorio += `  Imagens: ${metricas.detalhes.imagensDetectadas}\n`
  }

  relatorio += `  Referências: ${metricas.detalhes.temReferencias ? 'Sim' : 'Não'}\n`
  relatorio += `  Truncada: ${metricas.detalhes.foiTruncada ? 'Sim' : 'Não'}\n`

  if (metricas.sugestoes.length > 0) {
    relatorio += `  Sugestões: ${metricas.sugestoes.join('; ')}\n`
  }

  return relatorio
}

/**
 * Verifica se precisa continuar gerando resposta
 */
export function precisaContinuar(metricas: MetricasQualidade): boolean {
  // Continuar se:
  // 1. Está truncada
  // 2. Faltam questões
  // 3. Completude muito baixa
  // 4. Score muito baixo

  return (
    metricas.detalhes.foiTruncada ||
    metricas.completude < 0.8 ||
    metricas.score < 0.65
  )
}

/**
 * Gera prompt de melhoria baseado nas métricas
 */
export function gerarPromptMelhoria(metricas: MetricasQualidade): string | null {
  if (metricas.aprovada) return null

  const melhorias: string[] = []

  if (metricas.detalhes.foiTruncada) {
    melhorias.push('Continue EXATAMENTE de onde parou, sem repetir conteúdo')
  }

  if (metricas.sugestoes.includes('Faltam referências bibliográficas')) {
    melhorias.push('Adicione referências bibliográficas no final (📚 Fontes:)')
  }

  for (const sugestao of metricas.sugestoes) {
    if (sugestao.includes('Faltam') && sugestao.includes('questões')) {
      melhorias.push(sugestao.replace('Faltam', 'Gere mais'))
    }
  }

  if (metricas.coerencia < 0.5) {
    melhorias.push('Foque mais no tema específico da pergunta')
  }

  if (melhorias.length === 0) return null

  return `[MELHORIA NECESSÁRIA]\n${melhorias.join('\n')}`
}
