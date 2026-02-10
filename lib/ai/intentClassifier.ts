/**
 * Classificador de Intenção e Decisor de Tools
 *
 * Meta AI usa:
 * - Classificador para detectar intenção: "aprender", "resumir", "exemplificar"
 * - Palavras-chave para acionar tools: "imagem", "vídeo", "exemplo", "código"
 * - Análise de estrutura da pergunta
 */

export type IntencaoUsuario =
  | 'aprender'      // Quer entender profundamente
  | 'resumir'       // Quer algo breve
  | 'exemplificar'  // Quer exemplos práticos
  | 'questionar'    // Quer questões/exercícios
  | 'visualizar'    // Quer imagens/diagramas
  | 'revisar'       // Quer revisar conteúdo
  | 'tirar_duvida'  // Dúvida específica

export type ToolNecessaria =
  | 'buscar_imagens_medicas'
  | 'gerar_imagem_medica'
  | 'buscar_questoes'
  | 'nenhuma'

export interface ClassificacaoIntencao {
  intencao: IntencaoUsuario
  confianca: number // 0-1
  toolsNecessarias: ToolNecessaria[]
  nivelDetalhe: 'resumido' | 'normal' | 'detalhado'
  formatoIdeal: 'paragrafos' | 'lista' | 'misto' | 'questoes'
  temperatureRecomendado: number // 0.3-0.9
}

// Palavras-chave que acionam tools (como Meta AI)
const PALAVRAS_CHAVE_TOOLS: Record<string, ToolNecessaria[]> = {
  // Imagens
  'imagem': ['buscar_imagens_medicas'],
  'imagens': ['buscar_imagens_medicas'],
  'figura': ['buscar_imagens_medicas'],
  'figuras': ['buscar_imagens_medicas'],
  'ilustração': ['buscar_imagens_medicas'],
  'ilustrações': ['buscar_imagens_medicas'],
  'diagrama': ['buscar_imagens_medicas'],
  'diagramas': ['buscar_imagens_medicas'],
  'foto': ['buscar_imagens_medicas'],
  'fotos': ['buscar_imagens_medicas'],
  'mostre': ['buscar_imagens_medicas'],
  'mostra': ['buscar_imagens_medicas'],
  'visualizar': ['buscar_imagens_medicas'],
  'visualize': ['buscar_imagens_medicas'],

  // Geração de imagem (IA)
  'gere uma imagem': ['gerar_imagem_medica'],
  'crie uma imagem': ['gerar_imagem_medica'],
  'desenhe': ['gerar_imagem_medica'],
  'gerar imagem': ['gerar_imagem_medica'],
  'criar imagem': ['gerar_imagem_medica'],

  // Questões
  'questão': ['buscar_questoes'],
  'questões': ['buscar_questoes'],
  'questoes': ['buscar_questoes'],
  'exercício': ['buscar_questoes'],
  'exercícios': ['buscar_questoes'],
  'exercicios': ['buscar_questoes'],
  'perguntas': ['buscar_questoes'],
  'prova': ['buscar_questoes'],
  'teste': ['buscar_questoes'],
  'simulado': ['buscar_questoes'],
}

// Padrões de intenção (como Meta AI classifica)
const PADROES_INTENCAO: Record<IntencaoUsuario, RegExp[]> = {
  aprender: [
    /como funciona/i,
    /o que é/i,
    /o que são/i,
    /explique/i,
    /explicar/i,
    /me ensine/i,
    /quero entender/i,
    /qual a função/i,
    /quais as funções/i,
    /por que/i,
    /por quê/i,
    /como ocorre/i,
    /como acontece/i,
    /qual o mecanismo/i,
    /qual a importância/i,
    /fale sobre/i,
    /me fale/i,
    /discorra/i,
  ],
  resumir: [
    /resuma/i,
    /resumo/i,
    /breve/i,
    /rapidamente/i,
    /em poucas palavras/i,
    /de forma curta/i,
    /simplificado/i,
    /simplificada/i,
    /resumidamente/i,
    /de forma simples/i,
    /de maneira breve/i,
  ],
  exemplificar: [
    /exemplo/i,
    /exemplos/i,
    /na prática/i,
    /caso clínico/i,
    /casos clínicos/i,
    /situação real/i,
    /aplicação/i,
    /aplicações/i,
    /como aplicar/i,
    /dê um exemplo/i,
    /cite exemplos/i,
  ],
  questionar: [
    /questão/i,
    /questões/i,
    /questoes/i,
    /exercício/i,
    /exercícios/i,
    /pergunta/i,
    /perguntas/i,
    /teste/i,
    /prova/i,
    /avalie/i,
    /simulado/i,
    /\d+\s*quest/i, // "5 questões", "10 questoes"
    /gere.*quest/i,
    /crie.*quest/i,
    /faça.*quest/i,
  ],
  visualizar: [
    /mostre/i,
    /mostra/i,
    /imagem/i,
    /imagens/i,
    /figura/i,
    /figuras/i,
    /diagrama/i,
    /ilustre/i,
    /ilustração/i,
    /visualiz/i,
    /ver como/i,
    /como é visualmente/i,
  ],
  revisar: [
    /revisar/i,
    /revisão/i,
    /relembrar/i,
    /reforçar/i,
    /estudar/i,
    /estudando/i,
    /fixar/i,
    /memorizar/i,
    /decorar/i,
    /flashcard/i,
  ],
  tirar_duvida: [
    /dúvida/i,
    /duvida/i,
    /não entendi/i,
    /nao entendi/i,
    /pode explicar melhor/i,
    /o que significa/i,
    /qual a diferença/i,
    /qual diferença/i,
    /diferença entre/i,
    /quando usar/i,
    /por que não/i,
    /é verdade que/i,
    /pesquisa\s+(ai|aí)?/i,
    /compara/i,
    /compare/i,
    /diferenças?/i,
    /versus/i,
    /vs\.?\s/i,
    /qual\s+(é\s+)?(melhor|pior|mais|menos)/i,
  ],
}

// Temas visuais que se beneficiam de imagens automaticamente
const TEMAS_VISUAIS = [
  'anatom', 'órgão', 'orgao', 'sistema', 'estrutura',
  'músculo', 'musculo', 'osso', 'célula', 'celula',
  'tecido', 'esqueleto', 'coração', 'coracao', 'pulmão',
  'pulmao', 'cérebro', 'cerebro', 'fígado', 'figado',
  'rim', 'estômago', 'estomago', 'intestino', 'veia',
  'artéria', 'arteria', 'nervo', 'medula', 'coluna',
  'crânio', 'cranio', 'olho', 'ouvido', 'pele',
  'histolog', 'microscop', 'radiolog', 'tomograf',
  'ressonância', 'ressonancia', 'ultrassom', 'raio-x',
]

/**
 * Classifica a intenção do usuário (como Meta AI faz)
 */
export function classificarIntencao(mensagem: string): ClassificacaoIntencao {
  const msg = mensagem.toLowerCase()

  // 1. DETECTAR INTENÇÃO
  let intencaoDetectada: IntencaoUsuario = 'aprender' // Default
  let maiorConfianca = 0.5 // Confiança base

  for (const [intencao, padroes] of Object.entries(PADROES_INTENCAO)) {
    for (const padrao of padroes) {
      if (padrao.test(msg)) {
        const confianca = 0.85 // Confiança quando há match
        if (confianca > maiorConfianca) {
          maiorConfianca = confianca
          intencaoDetectada = intencao as IntencaoUsuario
        }
        break // Encontrou um match para essa intenção
      }
    }
  }

  // 2. DETECTAR TOOLS NECESSÁRIAS (palavras-chave como Meta AI)
  const toolsNecessarias: Set<ToolNecessaria> = new Set()

  for (const [palavra, tools] of Object.entries(PALAVRAS_CHAVE_TOOLS)) {
    if (msg.includes(palavra.toLowerCase())) {
      tools.forEach(tool => toolsNecessarias.add(tool))
    }
  }

  // Se é sobre tema visual e não pediu explicitamente imagem,
  // sugerir imagens automaticamente (como Meta AI faz)
  const temaVisual = TEMAS_VISUAIS.some(tema => msg.includes(tema))
  if (temaVisual && toolsNecessarias.size === 0 &&
      (intencaoDetectada === 'aprender' || intencaoDetectada === 'visualizar')) {
    toolsNecessarias.add('buscar_imagens_medicas')
  }

  // Se é intenção de questionar, sugerir busca de questões
  if (intencaoDetectada === 'questionar' && !toolsNecessarias.has('buscar_questoes')) {
    // Não adicionar automaticamente - deixar o Claude decidir se gera ou busca
  }

  // 3. DETERMINAR NÍVEL DE DETALHE (mais inteligente)
  let nivelDetalhe: 'resumido' | 'normal' | 'detalhado' = 'normal'

  if (/detalh|aprofund|completo|tudo sobre|explicação completa|em detalhes|explique tudo|conte tudo|fale tudo|me explique bem/i.test(msg)) {
    nivelDetalhe = 'detalhado'
  } else if (/resum|breve|rápido|rapido|curto|simplif|objetivo|direto|sem enrolação|sem enrolacao|de forma curta|rapidinho|só o principal|so o principal/i.test(msg)) {
    nivelDetalhe = 'resumido'
  } else if (/pesquisa|diferença|diferenca|compare|qual (é |e )?(melhor|pior)|versus|vs\b/i.test(msg)) {
    // Pesquisas e comparações geralmente querem nível normal-detalhado
    nivelDetalhe = 'normal'
  }

  // 4. DETERMINAR FORMATO IDEAL (como Meta AI escolhe)
  let formatoIdeal: 'paragrafos' | 'lista' | 'misto' | 'questoes' = 'paragrafos'

  if (intencaoDetectada === 'questionar') {
    formatoIdeal = 'questoes'
  } else if (intencaoDetectada === 'resumir' || /liste|enumere|quais são|quais sao|tópicos|topicos/i.test(msg)) {
    formatoIdeal = 'lista'
  } else if (intencaoDetectada === 'aprender' && nivelDetalhe === 'detalhado') {
    formatoIdeal = 'misto' // Parágrafos + listas quando necessário
  } else if (intencaoDetectada === 'revisar') {
    formatoIdeal = 'lista' // Revisão funciona bem em tópicos
  }

  // 5. DETERMINAR TEMPERATURE (como Meta AI ajusta)
  let temperatureRecomendado = 0.7 // Default balanceado

  if (intencaoDetectada === 'questionar') {
    temperatureRecomendado = 0.5 // Mais preciso para questões
  } else if (intencaoDetectada === 'exemplificar') {
    temperatureRecomendado = 0.8 // Mais criativo para exemplos
  } else if (nivelDetalhe === 'resumido') {
    temperatureRecomendado = 0.4 // Mais direto
  } else if (nivelDetalhe === 'detalhado') {
    temperatureRecomendado = 0.6 // Balanceado para conteúdo longo
  } else if (intencaoDetectada === 'tirar_duvida') {
    temperatureRecomendado = 0.5 // Preciso para dúvidas
  }

  return {
    intencao: intencaoDetectada,
    confianca: maiorConfianca,
    toolsNecessarias: Array.from(toolsNecessarias),
    nivelDetalhe,
    formatoIdeal,
    temperatureRecomendado,
  }
}

/**
 * Gera instruções para o Claude baseado na classificação
 */
export function gerarInstrucoesDeIntencao(classificacao: ClassificacaoIntencao): string {
  const instrucoes: string[] = []

  // Instruções baseadas na intenção
  switch (classificacao.intencao) {
    case 'aprender':
      instrucoes.push('[INTENÇÃO: APRENDER] O usuário quer entender o tema. Explique de forma didática, com conceitos claros e progressivos.')
      break
    case 'resumir':
      instrucoes.push('[INTENÇÃO: RESUMIR] O usuário quer brevidade. Seja direto e conciso, máximo 2-3 parágrafos ou lista de tópicos.')
      break
    case 'exemplificar':
      instrucoes.push('[INTENÇÃO: EXEMPLOS] O usuário quer casos práticos. Foque em situações reais, casos clínicos e aplicações.')
      break
    case 'questionar':
      instrucoes.push('[INTENÇÃO: QUESTÕES] O usuário quer exercícios. Gere questões de múltipla escolha (a-e) com gabarito comentado.')
      break
    case 'visualizar':
      instrucoes.push('[INTENÇÃO: VISUALIZAR] O usuário quer ver. USE a tool buscar_imagens_medicas para ilustrar.')
      break
    case 'revisar':
      instrucoes.push('[INTENÇÃO: REVISAR] O usuário quer consolidar. Organize em tópicos claros, destaque pontos-chave.')
      break
    case 'tirar_duvida':
      instrucoes.push('[INTENÇÃO: DÚVIDA] O usuário tem uma dúvida específica. Responda de forma clara, objetiva e direta.')
      break
  }

  // Instruções de formato
  switch (classificacao.formatoIdeal) {
    case 'paragrafos':
      instrucoes.push('[FORMATO: PARÁGRAFOS] Use texto fluido e bem estruturado.')
      break
    case 'lista':
      instrucoes.push('[FORMATO: LISTA] Organize em tópicos/bullets para facilitar leitura.')
      break
    case 'misto':
      instrucoes.push('[FORMATO: MISTO] Combine parágrafos explicativos com listas quando útil.')
      break
    case 'questoes':
      instrucoes.push('[FORMATO: QUESTÕES] Numere cada questão, use alternativas a) b) c) d) e), inclua gabarito.')
      break
  }

  // Instruções de nível de detalhe
  switch (classificacao.nivelDetalhe) {
    case 'resumido':
      instrucoes.push('[NÍVEL: RESUMIDO] Seja breve e objetivo.')
      break
    case 'detalhado':
      instrucoes.push('[NÍVEL: DETALHADO] Aprofunde nos conceitos, inclua detalhes e nuances.')
      break
    default:
      instrucoes.push('[NÍVEL: NORMAL] Equilíbrio entre brevidade e completude.')
  }

  // Instruções de tools
  if (classificacao.toolsNecessarias.length > 0) {
    const toolsStr = classificacao.toolsNecessarias.join(', ')
    instrucoes.push(`[TOOLS SUGERIDAS: ${toolsStr}] Use essas ferramentas para enriquecer a resposta.`)
  }

  return instrucoes.join('\n')
}

/**
 * Verifica se deve usar tool específica baseado na classificação
 */
export function deveUsarTool(classificacao: ClassificacaoIntencao, tool: ToolNecessaria): boolean {
  return classificacao.toolsNecessarias.includes(tool)
}

/**
 * Retorna configurações recomendadas para a API baseado na classificação
 */
export function getConfiguracoesAPI(classificacao: ClassificacaoIntencao): {
  temperature: number
  maxTokens: number
} {
  let maxTokens = 4096 // Default

  if (classificacao.nivelDetalhe === 'resumido') {
    maxTokens = 2048
  } else if (classificacao.nivelDetalhe === 'detalhado') {
    maxTokens = 8192
  } else if (classificacao.intencao === 'questionar') {
    maxTokens = 6144 // Questões precisam de espaço
  }

  return {
    temperature: classificacao.temperatureRecomendado,
    maxTokens
  }
}
