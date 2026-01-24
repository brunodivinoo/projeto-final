/**
 * Sistema de Divisão de Tarefas - Inspirado na Meta AI
 * Analisa perguntas complexas e divide em tarefas sequenciais
 *
 * Meta AI executa tarefas sequencialmente: Texto → Imagens → Questões → Referências
 */

export type TipoTarefa = 'explicacao' | 'imagens' | 'questoes' | 'referencias'

export interface AnalisePergunta {
  tarefas: TipoTarefa[]
  termo: string
  quantidadeQuestoes: number
  quantidadeImagens: number
  nivelDetalhe: 'resumido' | 'normal' | 'detalhado'
  temaDetectado: string
  tipoConteudo: 'teoria' | 'pratica' | 'misto'
}

/**
 * Analisa a pergunta do usuário e extrai metadados importantes
 */
export function analisarPergunta(mensagem: string): AnalisePergunta {
  const msg = mensagem.toLowerCase()

  // ========== DETECTAR NÍVEL DE DETALHE ==========
  let nivelDetalhe: 'resumido' | 'normal' | 'detalhado' = 'normal'

  const palavrasDetalhado = ['detalh', 'aprofund', 'completo', 'profundidade', 'extenso', 'tudo sobre']
  const palavrasResumido = ['resum', 'breve', 'rápido', 'resumid', 'só o essencial', 'direto']

  if (palavrasDetalhado.some(p => msg.includes(p))) {
    nivelDetalhe = 'detalhado'
  } else if (palavrasResumido.some(p => msg.includes(p))) {
    nivelDetalhe = 'resumido'
  }

  // ========== DETECTAR QUANTIDADE DE QUESTÕES ==========
  let quantidadeQuestoes = 0

  // Padrões: "5 questões", "questões (10)", "10 perguntas"
  const matchQuestoes = msg.match(/(\d+)\s*(?:quest[õo]es?|perguntas?|exercícios?)/i)
  const matchQuestoes2 = msg.match(/(?:quest[õo]es?|perguntas?)\s*[\(:]?\s*(\d+)/i)

  if (matchQuestoes) {
    quantidadeQuestoes = parseInt(matchQuestoes[1])
  } else if (matchQuestoes2) {
    quantidadeQuestoes = parseInt(matchQuestoes2[1])
  } else if (msg.includes('questões') || msg.includes('questoes') || msg.includes('perguntas')) {
    // Se menciona questões mas não especifica quantidade
    quantidadeQuestoes = 5 // Padrão
  }

  // Limitar a quantidade máxima
  quantidadeQuestoes = Math.min(quantidadeQuestoes, 20)

  // ========== DETECTAR QUANTIDADE DE IMAGENS ==========
  let quantidadeImagens = 0

  const matchImagens = msg.match(/(\d+)\s*(?:imagen[s]?|figura[s]?|ilustra[çc][õo]es?)/i)
  const matchImagens2 = msg.match(/(?:imagen[s]?|figura[s]?)\s*[\(:]?\s*(\d+)/i)

  if (matchImagens) {
    quantidadeImagens = parseInt(matchImagens[1])
  } else if (matchImagens2) {
    quantidadeImagens = parseInt(matchImagens2[1])
  } else if (msg.includes('imagem') || msg.includes('imagens') ||
             msg.includes('figura') || msg.includes('ilustr') ||
             msg.includes('mostre') || msg.includes('visualiz')) {
    quantidadeImagens = 3 // Padrão
  }

  // Limitar quantidade
  quantidadeImagens = Math.min(quantidadeImagens, 5)

  // ========== EXTRAIR TERMO PRINCIPAL ==========
  const termo = extrairTermoPrincipal(mensagem)

  // ========== DETECTAR TEMA MÉDICO ==========
  const temaDetectado = detectarTemaMedico(msg)

  // ========== DETECTAR TIPO DE CONTEÚDO ==========
  let tipoConteudo: 'teoria' | 'pratica' | 'misto' = 'teoria'

  if (quantidadeQuestoes > 0 && (msg.includes('explic') || msg.includes('sobre'))) {
    tipoConteudo = 'misto'
  } else if (quantidadeQuestoes > 0) {
    tipoConteudo = 'pratica'
  }

  // ========== MONTAR LISTA DE TAREFAS NA ORDEM CORRETA ==========
  const tarefas: TipoTarefa[] = []

  // 1. Explicação sempre primeiro (se não for só questões)
  const querExplicacao = msg.includes('explic') ||
                         msg.includes('como funciona') ||
                         msg.includes('o que é') ||
                         msg.includes('sobre') ||
                         msg.includes('descreva') ||
                         msg.includes('fale sobre')

  if (querExplicacao || (quantidadeQuestoes > 0 && tipoConteudo === 'misto')) {
    tarefas.push('explicacao')
  }

  // 2. Imagens depois do texto (se solicitadas)
  if (quantidadeImagens > 0) {
    tarefas.push('imagens')
  }

  // 3. Questões por último
  if (quantidadeQuestoes > 0) {
    tarefas.push('questoes')
  }

  // 4. Referências sempre no final (exceto para perguntas muito simples)
  if (tarefas.length > 0 || nivelDetalhe !== 'resumido') {
    tarefas.push('referencias')
  }

  // Se não detectou nenhuma tarefa específica, adicionar explicação
  if (tarefas.length === 0) {
    tarefas.push('explicacao')
    tarefas.push('referencias')
  }

  return {
    tarefas,
    termo,
    quantidadeQuestoes,
    quantidadeImagens,
    nivelDetalhe,
    temaDetectado,
    tipoConteudo
  }
}

/**
 * Remove palavras de comando e extrai o termo principal
 */
function extrairTermoPrincipal(mensagem: string): string {
  const palavrasRemover = [
    'quero', 'preciso', 'me', 'mostre', 'explique', 'faça', 'gere', 'crie',
    'questões', 'questoes', 'perguntas', 'exercícios',
    'imagens', 'imagem', 'figuras', 'ilustrações',
    'sobre', 'como', 'funciona', 'detalhado', 'resumo', 'completo',
    'pode', 'poderia', 'gostaria', 'favor', 'por favor',
    'com', 'para', 'de', 'do', 'da', 'dos', 'das', 'um', 'uma', 'uns', 'umas',
    'e', 'ou', 'mas', 'porém', 'também', 'ainda'
  ]

  let termo = mensagem.toLowerCase()

  // Remover números soltos
  termo = termo.replace(/\b\d+\b/g, '')

  // Remover palavras de comando
  palavrasRemover.forEach(p => {
    termo = termo.replace(new RegExp(`\\b${p}\\b`, 'gi'), '')
  })

  // Limpar espaços extras
  termo = termo.replace(/\s+/g, ' ').trim()

  return termo || 'tema médico'
}

/**
 * Detecta área/tema médico baseado em palavras-chave
 */
function detectarTemaMedico(msg: string): string {
  const temasMedicos: Record<string, string[]> = {
    'Cardiologia': ['coração', 'cardía', 'infarto', 'arritmia', 'hipertensão', 'sopro', 'ecg', 'eletrocardiograma'],
    'Pneumologia': ['pulmão', 'pulmon', 'respirat', 'pneumonia', 'asma', 'dpoc', 'brônquio'],
    'Gastroenterologia': ['estômago', 'intestino', 'fígado', 'hepat', 'gastri', 'esofag', 'pancrea'],
    'Neurologia': ['cérebro', 'neuro', 'avc', 'derrame', 'epilepsia', 'parkinson', 'alzheimer'],
    'Nefrologia': ['rim', 'renal', 'nefr', 'urina', 'diálise'],
    'Endocrinologia': ['diabetes', 'tireoide', 'hormônio', 'endócrin', 'insulina'],
    'Infectologia': ['infecção', 'vírus', 'bactéria', 'tuberculose', 'aids', 'hiv'],
    'Oncologia': ['câncer', 'tumor', 'neoplasia', 'oncolog', 'carcinoma'],
    'Anatomia': ['anatomia', 'anatômi', 'estrutura', 'órgão'],
    'Histologia': ['histolog', 'tecido', 'célula', 'lâmina', 'microscop'],
    'Farmacologia': ['medicamento', 'fármaco', 'droga', 'farmacolog', 'dose'],
    'Patologia': ['patolog', 'doença', 'patogênese', 'fisiopatolog']
  }

  for (const [tema, palavras] of Object.entries(temasMedicos)) {
    if (palavras.some(p => msg.includes(p))) {
      return tema
    }
  }

  return 'Medicina Geral'
}

/**
 * Gera instruções adicionais para o Claude baseado na análise
 * Essas instruções serão adicionadas à mensagem do usuário
 */
export function gerarInstrucoesAdicionais(analise: AnalisePergunta): string {
  // Se é uma pergunta simples sem requisitos especiais, não adicionar instruções
  if (analise.quantidadeQuestoes === 0 &&
      analise.quantidadeImagens === 0 &&
      analise.nivelDetalhe === 'normal') {
    return ''
  }

  let instrucoes = '\n\n[INSTRUÇÕES DE EXECUÇÃO - META AI]:\n'

  // Ordem de execução
  instrucoes += `ORDEM DAS TAREFAS: ${analise.tarefas.join(' → ')}\n`

  // Questões
  if (analise.quantidadeQuestoes > 0) {
    instrucoes += `\nQUESTÕES:\n`
    instrucoes += `- Gerar EXATAMENTE ${analise.quantidadeQuestoes} questões\n`
    instrucoes += `- CONTAR as questões antes de finalizar\n`
    instrucoes += `- Se gerou menos, CONTINUAR até completar ${analise.quantidadeQuestoes}\n`
  }

  // Imagens
  if (analise.quantidadeImagens > 0) {
    instrucoes += `\nIMAGENS:\n`
    instrucoes += `- Buscar ${analise.quantidadeImagens} imagens usando buscar_imagens_medicas\n`
    instrucoes += `- Termo sugerido: "${analise.termo}"\n`
  }

  // Nível de detalhe
  const nivelTexto = {
    'resumido': '1-2 parágrafos, apenas pontos essenciais',
    'normal': '2-3 parágrafos, explicação completa mas concisa',
    'detalhado': '4-6 parágrafos, explicação aprofundada com exemplos'
  }
  instrucoes += `\nNÍVEL DE DETALHE: ${analise.nivelDetalhe.toUpperCase()}\n`
  instrucoes += `(${nivelTexto[analise.nivelDetalhe]})\n`

  // Área médica detectada
  if (analise.temaDetectado !== 'Medicina Geral') {
    instrucoes += `\nÁREA: ${analise.temaDetectado}\n`
  }

  // Regras finais
  instrucoes += `\nREGRAS:\n`
  instrucoes += `- NÃO truncar resposta\n`
  instrucoes += `- Se atingir limite de tokens, CONTINUAR automaticamente\n`
  instrucoes += `- SEMPRE incluir referências no final\n`
  instrucoes += `- Terminar com: "Quer que eu detalhe algum ponto específico?"\n`

  return instrucoes
}

/**
 * Calcula estimativa de tokens necessários para a resposta
 */
export function estimarTokensNecessarios(analise: AnalisePergunta): number {
  let tokens = 0

  // Base para explicação
  const tokensExplicacao = {
    'resumido': 500,
    'normal': 1000,
    'detalhado': 2000
  }

  if (analise.tarefas.includes('explicacao')) {
    tokens += tokensExplicacao[analise.nivelDetalhe]
  }

  // Tokens por questão (aproximadamente 300 tokens por questão com gabarito)
  tokens += analise.quantidadeQuestoes * 300

  // Tokens para imagens (descrições e referências)
  tokens += analise.quantidadeImagens * 100

  // Referências
  if (analise.tarefas.includes('referencias')) {
    tokens += 200
  }

  // Margem de segurança de 20%
  return Math.ceil(tokens * 1.2)
}
