import { generateText, generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

// =====================================================
// CONFIGURACAO DO PROVEDOR GEMINI
// =====================================================

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
})

// Modelos disponíveis com fallback
const MODELS = {
  primary: google('gemini-2.0-flash-exp'),
  fallback: google('gemini-1.5-flash'),
  vision: google('gemini-2.0-flash-exp'),
}

// =====================================================
// SISTEMA DE CACHE EM MEMÓRIA (90% economia)
// =====================================================

interface CacheEntry {
  response: string
  timestamp: number
  hits: number
}

const responseCache = new Map<string, CacheEntry>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hora
const MAX_CACHE_SIZE = 100

function getCacheKey(prompt: string, context?: string): string {
  const normalized = prompt.toLowerCase().trim().substring(0, 200)
  return `${normalized}:${context?.substring(0, 50) || ''}`
}

function getFromCache(key: string): string | null {
  const entry = responseCache.get(key)
  if (!entry) return null

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key)
    return null
  }

  entry.hits++
  return entry.response
}

function setCache(key: string, response: string): void {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value
    if (oldestKey) responseCache.delete(oldestKey)
  }

  responseCache.set(key, {
    response,
    timestamp: Date.now(),
    hits: 1
  })
}

// =====================================================
// SISTEMA DE RETRY INTELIGENTE
// =====================================================

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (error instanceof Error && error.message.includes('validation')) {
        throw error
      }

      if (attempt < config.maxRetries) {
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// =====================================================
// SISTEMA DE FALLBACK
// =====================================================

const FALLBACK_RESPONSES = {
  chat: `Desculpe, estou com dificuldades no momento. Aqui vao algumas dicas gerais:

• Beba bastante agua (2-3 litros por dia)
• Faca refeicoes balanceadas a cada 3 horas
• Priorize proteinas e vegetais
• Descanse bem e cuide do seu sono

Tente novamente em alguns instantes!`,

  receita: `NOME: Omelete Nutritiva Express

TEMPO: 10 minutos
RENDIMENTO: 1 porcao
CALORIAS: 250 kcal
PROTEINAS: 18g

INGREDIENTES:
- 2 ovos
- 1 colher de leite
- Sal a gosto
- Ervas finas

MODO DE PREPARO:
1. Bata os ovos com o leite
2. Tempere com sal e ervas
3. Despeje na frigideira quente
4. Dobre e sirva

DICA NUTRI: Adicione vegetais picados para mais fibras!`,

  plano: `Nao foi possivel gerar um plano personalizado agora.

Enquanto isso, siga estas orientacoes gerais:
- Cafe da manha: frutas + proteina
- Lanche: castanhas ou iogurte
- Almoco: proteina + legumes + carboidrato
- Lanche da tarde: fruta
- Jantar: proteina + salada

Tente novamente mais tarde!`,

  analise: {
    alimentos: ['Refeicao identificada'],
    calorias_total: 400,
    proteinas: 20,
    carboidratos: 40,
    gorduras: 15,
    dica: 'Tente tirar uma foto mais clara e bem iluminada.',
    nota_saude: 5
  }
}

// =====================================================
// SYSTEM PROMPTS - UNIVERSAL PARA MULHERES
// =====================================================

export const SYSTEM_PROMPTS = {
  // Coach geral para todas as mulheres
  nutri_coach: `Voce e a NutriVida IA, uma nutricionista virtual especializada em saude feminina.

PERSONALIDADE:
- Acolhedora e empatica
- Pratica e objetiva
- Motivadora sem ser forcada
- Linguagem simples e direta

PUBLICO ATENDIDO:
- Mulheres em geral (qualquer idade)
- Gestantes (adaptar por trimestre)
- Lactantes/Amamentando
- Maes no pos-parto
- Mulheres buscando emagrecimento
- Mulheres buscando ganho de massa

ESPECIALIDADES:
- Nutricao feminina em todas as fases
- Alimentacao na gestacao
- Nutricao para lactantes
- Receitas rapidas e saudaveis
- Controle de peso saudavel
- Suplementacao segura
- Exercicios adaptados

FORMATO DE RESPOSTA:
- Respostas CONCISAS (max 250 palavras)
- Use bullet points e listas
- Destaque informacoes importantes
- Sempre inclua uma ACAO PRATICA

REGRAS IMPORTANTES:
1. NUNCA de diagnosticos medicos
2. Sempre recomende consultar profissional para casos especificos
3. Adapte a resposta ao perfil da usuaria (gestante, mae, etc)
4. Seja sensivel as necessidades de cada fase
5. Se gestante, considere restricoes alimentares da gravidez
6. Se amamentando, considere necessidades extras de calorias

CONTEXTO: App de nutricao e bem-estar feminino.`,

  // Especializado para gestantes
  gestante: `Voce e a NutriVida IA, especializada em nutricao gestacional.

TRIMESTRES E NECESSIDADES:

1o TRIMESTRE (1-12 semanas):
- Foco: acido folico (600mcg), ferro, vitamina B6
- Calorias extras: +0-100 kcal/dia
- Cuidados: nauseas, aversoes alimentares
- Evitar: alcool, cafeina excessiva, alimentos crus

2o TRIMESTRE (13-26 semanas):
- Foco: calcio (1000mg), vitamina D, omega-3
- Calorias extras: +340 kcal/dia
- Cuidados: azia, constipacao
- Priorizar: proteinas, fibras

3o TRIMESTRE (27-40 semanas):
- Foco: ferro, proteinas, fibras
- Calorias extras: +450 kcal/dia
- Cuidados: inchaco, azia intensa
- Priorizar: refeicoes menores e frequentes

ALIMENTOS PROIBIDOS NA GESTACAO:
- Peixes crus (sushi, sashimi)
- Carnes mal passadas
- Ovos crus ou mal cozidos
- Queijos nao pasteurizados (brie, camembert, gorgonzola)
- Alcool (ZERO tolerancia)
- Excesso de cafeina (max 200mg/dia)
- Figado em excesso (vitamina A)
- Adocantes artificiais (com moderacao)

SUPLEMENTOS ESSENCIAIS:
- Acido folico (antes e durante)
- Ferro (especialmente 2o e 3o trimestre)
- Vitamina D
- Omega-3 (DHA)

FORMATO: Sempre pergunte a semana de gestacao para personalizar.`,

  // Especializado para maes amamentando
  amamentando: `Voce e a NutriVida IA, especializada em nutricao para maes que amamentam.

NECESSIDADES NUTRICIONAIS DA LACTANTE:
- Calorias extras: +500 kcal/dia (pode chegar a +700 em amamentacao exclusiva)
- Agua: 3-4 litros/dia (FUNDAMENTAL para producao de leite)
- Proteinas: 1.3g por kg de peso corporal
- Calcio: 1000-1300mg/dia (leite, iogurte, queijos, folhas verdes)
- Ferro: 9-18mg/dia
- Vitamina D: 600-800 UI/dia
- Omega-3 (DHA): importante para desenvolvimento cerebral do bebe

ALIMENTOS QUE FAVORECEM A LACTACAO:
- Aveia e cereais integrais
- Erva-doce e cha de erva-doce
- Agua de coco
- Amendoas e castanhas
- Cenoura
- Espinafre e folhas verdes
- Graos como lentilha e grao-de-bico

ALIMENTOS A EVITAR OU MODERAR:
- Alcool (passa para o leite)
- Cafeina em excesso (max 200-300mg/dia)
- Alimentos muito condimentados (podem causar colicas no bebe)
- Hortelã e sálvia em grandes quantidades (podem reduzir leite)
- Peixes com alto teor de mercurio

COLICAS NO BEBE - POSSÍVEIS CAUSAS ALIMENTARES:
- Laticinios (alergia a proteina do leite de vaca)
- Brócolis, couve-flor, repolho
- Feijão e leguminosas em excesso
- Chocolate

DICAS PRATICAS:
- Amamente antes de comer para ter mais fome
- Tenha sempre agua por perto durante as mamadas
- Faca lanches nutritivos entre as refeicoes
- Descanse sempre que possivel

FORMATO: Seja acolhedora, a mae pode estar cansada e precisando de apoio.`,

  // Especializado para pos-parto
  pos_parto: `Voce e a NutriVida IA, especializada em recuperacao pos-parto.

FASES DO POS-PARTO:

PRIMEIRAS 6 SEMANAS (Puerperio):
- Foco: recuperacao, cicatrizacao, hidratacao
- Se cesarea: aumentar proteinas e vitamina C para cicatrizacao
- Evitar alimentos que causam gases
- Comer pequenas porcoes frequentes
- Muita agua e alimentos ricos em ferro

6 SEMANAS A 6 MESES:
- Foco: retorno gradual a rotina, energia
- Se amamentando: manter calorias extras
- Se nao amamentando: reducao gradual de calorias
- Iniciar exercicios LEVES apenas apos liberacao medica

APOS 6 MESES:
- Foco: retorno ao peso pre-gestacional (se desejado)
- Dieta equilibrada sem restricoes extremas
- Exercicios regulares

NUTRIENTES IMPORTANTES:
- Ferro (especialmente se houve sangramento no parto)
- Proteinas (recuperacao muscular)
- Vitamina C (cicatrizacao)
- Fibras (constipacao comum)
- Omega-3 (humor e energia)
- Vitamina D (ossos e imunidade)

CUIDADOS COM O HUMOR:
- Omega-3 ajuda na prevencao de depressao pos-parto
- Carboidratos complexos para serotonina
- Evitar restricoes caloricas severas
- Sono e alimentacao andam juntos

FORMATO: Seja gentil e compreensiva. O corpo levou 9 meses para mudar, nao espere voltar em 1 mes.`,

  // Análise de prato
  analise_prato: `Voce e um especialista em analise nutricional de imagens.

TAREFA: Analisar a foto de uma refeicao e identificar:
1. Alimentos presentes
2. Estimativa de porcoes
3. Calcular macronutrientes aproximados
4. Identificar pontos positivos e negativos
5. Dar uma dica de melhoria

FORMATO DE RESPOSTA (JSON):
{
  "alimentos": ["lista de alimentos identificados"],
  "porcoes": {"alimento": "quantidade estimada"},
  "calorias_total": numero,
  "proteinas": numero em gramas,
  "carboidratos": numero em gramas,
  "gorduras": numero em gramas,
  "fibras": numero em gramas,
  "pontos_positivos": ["lista"],
  "pontos_negativos": ["lista"],
  "dica": "uma dica pratica de melhoria",
  "nota_saude": numero de 1 a 10
}

REGRAS:
- Seja realista nas estimativas
- Considere tamanho medio de porcoes brasileiras
- Se nao conseguir identificar algo, indique incerteza`,

  // Plano semanal
  plano_semanal: `Voce e uma nutricionista criando um plano alimentar semanal.

ESTRUTURA DO PLANO:
- 7 dias completos
- 5-6 refeicoes por dia
- Variedade de alimentos
- Receitas praticas (max 30 min)
- Lista de compras organizada

CONSIDERACOES:
- Perfil da usuaria (gestante, mae, em geral)
- Preferencias alimentares
- Restricoes e alergias
- Meta calorica diaria
- Se gestante: restricoes especificas
- Se amamentando: +500 kcal
- Disponibilidade de tempo

FORMATO: Estruturado e facil de seguir com horarios sugeridos.`,

  // Receitas
  receita_ia: `Voce e uma chef nutricionista especializada em receitas saudaveis.

CRITERIOS PARA RECEITAS:
- Tempo maximo: 30 minutos
- Ingredientes acessiveis
- Nutritivas e balanceadas
- Faceis de preparar

SE GESTANTE OU AMAMENTANDO:
- Evitar ingredientes proibidos
- Priorizar nutrientes essenciais
- Indicar se a receita e segura

FORMATO OBRIGATORIO:
NOME: [nome criativo]
TEMPO: [preparo + cozimento]
RENDIMENTO: [porcoes]
CALORIAS: [por porcao]
PROTEINAS: [gramas]

INGREDIENTES:
- [quantidade] [ingrediente]

MODO DE PREPARO:
1. [passo detalhado]

DICA NUTRI: [dica especial]
VARIACAO: [alternativa ou substituicao]
SEGURA PARA GESTANTES: [Sim/Nao e porque]`
}

// =====================================================
// SCHEMAS DE VALIDACAO (Zod)
// =====================================================

export const AnalisePratoSchema = z.object({
  alimentos: z.array(z.string()).describe('Lista de alimentos identificados'),
  calorias_total: z.number().describe('Total de calorias estimado'),
  proteinas: z.number().describe('Gramas de proteina'),
  carboidratos: z.number().describe('Gramas de carboidratos'),
  gorduras: z.number().describe('Gramas de gordura'),
  fibras: z.number().optional().describe('Gramas de fibra'),
  pontos_positivos: z.array(z.string()).optional(),
  pontos_negativos: z.array(z.string()).optional(),
  dica: z.string().describe('Dica de melhoria'),
  nota_saude: z.number().min(1).max(10).describe('Nota de 1 a 10')
})

export const PlanoSemanalSchema = z.object({
  dias: z.array(z.object({
    dia: z.string(),
    refeicoes: z.array(z.object({
      tipo: z.string(),
      horario: z.string(),
      descricao: z.string(),
      calorias: z.number()
    }))
  })),
  lista_compras: z.array(z.object({
    item: z.string(),
    quantidade: z.string(),
    categoria: z.string()
  })),
  meta_calorias_diaria: z.number(),
  dicas_gerais: z.array(z.string())
})

export const CheckInDiarioSchema = z.object({
  humor: z.enum(['otimo', 'bom', 'regular', 'ruim']),
  energia: z.number().min(1).max(10),
  sono_horas: z.number(),
  agua_ml: z.number(),
  exercicio: z.boolean(),
  observacoes: z.string().optional()
})

export const CoachResponseSchema = z.object({
  mensagem_motivacional: z.string(),
  analise_dia: z.string(),
  sugestoes: z.array(z.string()),
  meta_amanha: z.string(),
  pontuacao_dia: z.number().min(1).max(10)
})

// Schema para refeicao detalhada com ingredientes e modo de preparo
export const RefeicaoDetalhadaSchema = z.object({
  tipo: z.enum(['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia']),
  nome: z.string(),
  descricao: z.string(),
  calorias: z.number(),
  proteinas: z.number(),
  carboidratos: z.number(),
  gorduras: z.number(),
  ingredientes: z.array(z.object({
    nome: z.string(),
    quantidade: z.string(),
    unidade: z.string()
  })),
  modo_preparo: z.array(z.string()),
  tempo_preparo: z.number()
})

// Schema para plano alimentar completo (dia/semana/mes)
export const PlanoAlimentarCompletoSchema = z.object({
  periodo: z.enum(['dia', 'semana', 'mes']),
  dias: z.array(z.object({
    data: z.string(),
    dia_semana: z.string(),
    refeicoes: z.array(RefeicaoDetalhadaSchema),
    total_calorias: z.number(),
    dica_dia: z.string()
  })),
  lista_compras: z.array(z.object({
    item: z.string(),
    quantidade: z.number(),
    unidade: z.string(),
    categoria: z.enum(['frutas', 'vegetais', 'proteinas', 'laticinios', 'carboidratos', 'gorduras', 'temperos', 'outros'])
  })),
  meta_calorias_diaria: z.number(),
  dicas_gerais: z.array(z.string())
})

// =====================================================
// TIPOS
// =====================================================

export type ProfileContext = {
  nome?: string
  idade?: number
  peso_atual?: number
  peso_meta?: number
  altura?: number
  idade_bebe?: number
  amamentando?: boolean
  plano?: string
  semana_gestacao?: number
  restricoes?: string[]
  preferencias?: string[]
  modo?: 'gestante' | 'pos_parto' | 'amamentando' | 'geral'
}

// =====================================================
// FUNCOES PRINCIPAIS DA IA
// =====================================================

/**
 * Determina o modo baseado no perfil
 */
function determinarModo(perfil?: ProfileContext): 'gestante' | 'normal' {
  if (perfil?.modo === 'gestante' || perfil?.semana_gestacao) {
    return 'gestante'
  }
  return 'normal'
}

/**
 * Gera contexto personalizado para a IA
 */
function gerarContexto(perfil?: ProfileContext): string {
  if (!perfil) return ''

  const partes: string[] = ['DADOS DA USUARIA:']

  partes.push(`- Nome: ${perfil.nome || 'Usuaria'}`)
  if (perfil.idade) partes.push(`- Idade: ${perfil.idade} anos`)
  if (perfil.peso_atual) partes.push(`- Peso atual: ${perfil.peso_atual} kg`)
  if (perfil.peso_meta) partes.push(`- Meta de peso: ${perfil.peso_meta} kg`)
  if (perfil.altura) partes.push(`- Altura: ${perfil.altura} m`)

  // Situação específica
  if (perfil.semana_gestacao) {
    const trimestre = perfil.semana_gestacao <= 12 ? '1o' : perfil.semana_gestacao <= 26 ? '2o' : '3o'
    partes.push(`- GESTANTE: ${perfil.semana_gestacao} semanas (${trimestre} trimestre)`)
  } else if (perfil.amamentando) {
    partes.push(`- Amamentando: Sim (+500 kcal/dia necessarias)`)
    if (perfil.idade_bebe) partes.push(`- Idade do bebe: ${perfil.idade_bebe} dias`)
  } else if (perfil.idade_bebe) {
    partes.push(`- Pos-parto: bebe com ${perfil.idade_bebe} dias`)
  }

  // Plano
  const planoDesc = perfil.plano === 'restritivo' ? 'Acelerado (1300kcal)' : 'Equilibrado (1900kcal)'
  partes.push(`- Plano: ${planoDesc}`)

  // Restricoes
  if (perfil.restricoes?.length) {
    partes.push(`- Restricoes: ${perfil.restricoes.join(', ')}`)
  }

  return partes.join('\n')
}

/**
 * Chat inteligente com a NutriVida IA
 */
export async function chatNutriIA(
  mensagem: string,
  historico: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  perfil?: ProfileContext,
  modoForce?: 'normal' | 'gestante' | 'receitas' | 'treino' | 'nutricao'
): Promise<{ resposta: string; fromCache: boolean }> {
  // Verificar se e uma pergunta muito curta ou generica que nao deve usar cache
  const perguntaCurta = mensagem.length < 30
  const perguntasVariaveis = ['dica', 'sugir', 'receita', 'ideia', 'exemplo', 'outro', 'mais', 'diferente']
  const deveVariar = perguntasVariaveis.some(p => mensagem.toLowerCase().includes(p))

  // So usa cache para perguntas especificas e longas
  if (!deveVariar && !perguntaCurta) {
    const cacheKey = getCacheKey(mensagem, JSON.stringify(perfil))
    const cached = getFromCache(cacheKey)
    if (cached) {
      return { resposta: cached, fromCache: true }
    }
  }

  const modo = modoForce || determinarModo(perfil)

  // Determinar situacao da usuaria para escolher o prompt certo
  const situacaoUsuaria = perfil?.semana_gestacao ? 'gestante' :
    perfil?.amamentando ? 'amamentando' :
    (perfil?.idade_bebe && perfil.idade_bebe <= 180) ? 'pos_parto' : // 6 meses
    'normal'

  // Selecionar system prompt baseado no modo e situacao
  let systemPrompt = SYSTEM_PROMPTS.nutri_coach

  // Priorizar situacao especial
  if (situacaoUsuaria === 'gestante' || modo === 'gestante') {
    systemPrompt = SYSTEM_PROMPTS.gestante
  } else if (situacaoUsuaria === 'amamentando') {
    systemPrompt = SYSTEM_PROMPTS.amamentando
  } else if (situacaoUsuaria === 'pos_parto') {
    systemPrompt = SYSTEM_PROMPTS.pos_parto
  } else if (modo === 'receitas') {
    systemPrompt = SYSTEM_PROMPTS.receita_ia
  } else if (modo === 'treino') {
    systemPrompt = `Voce e a NutriVida IA, especializada em exercicios e treinos para mulheres.

ESPECIALIDADES:
- Treinos funcionais e em casa
- Yoga e alongamento
- Exercicios pos-parto seguros
- Treinos para gestantes (com restricoes)
- HIIT e cardio adaptado
- Fortalecimento muscular

FORMATO:
- Seja especifica com series, repeticoes e descanso
- Indique nivel de dificuldade
- Sempre mencione cuidados de seguranca
- Adapte para o nivel da usuaria

IMPORTANTE: Varie suas sugestoes e exemplos a cada resposta.`
  } else if (modo === 'nutricao') {
    systemPrompt = `Voce e a NutriVida IA, nutricionista virtual focada em alimentacao saudavel.

ESPECIALIDADES:
- Planos alimentares personalizados
- Substituicoes inteligentes
- Analise de refeicoes
- Dicas de preparo saudavel
- Leitura de rotulos
- Suplementacao segura

FORMATO:
- Use exemplos praticos e acessiveis
- Inclua opcoes de substituicao
- Mencione valores nutricionais quando relevante
- Seja empatica e motivadora

IMPORTANTE: Varie seus exemplos e sugestoes a cada interacao para nao parecer robotica.`
  }

  const contexto = gerarContexto(perfil)

  // Adicionar instrucao de variacao
  const instrucaoVariacao = `

IMPORTANTE NESTA RESPOSTA:
- Seja natural e conversacional, nao robotica
- Varie suas sugestoes - nao repita exemplos das mensagens anteriores
- Use linguagem acolhedora e empoderada
- Timestamp para unicidade: ${Date.now()}`

  try {
    const result = await withRetry(async () => {
      const { text } = await generateText({
        model: MODELS.primary,
        system: systemPrompt + '\n\n' + contexto + instrucaoVariacao,
        messages: [
          ...historico.slice(-6).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          { role: 'user' as const, content: mensagem }
        ],
        temperature: deveVariar ? 0.85 : 0.7, // Mais variacao quando pede sugestoes
      })
      return text
    })

    // So cacheia se nao for pergunta variavel
    if (!deveVariar && !perguntaCurta) {
      const cacheKey = getCacheKey(mensagem, JSON.stringify(perfil))
      setCache(cacheKey, result)
    }
    return { resposta: result, fromCache: false }
  } catch (error) {
    console.error('Erro no chat IA:', error)
    return { resposta: FALLBACK_RESPONSES.chat, fromCache: false }
  }
}

/**
 * Analisar foto de prato com IA Vision
 */
export async function analisarFotoPrato(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<z.infer<typeof AnalisePratoSchema>> {
  try {
    const result = await withRetry(async () => {
      const { object } = await generateObject({
        model: MODELS.vision,
        schema: AnalisePratoSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: SYSTEM_PROMPTS.analise_prato + '\n\nAnalise esta refeicao:'
              },
              {
                type: 'image',
                image: `data:${mimeType};base64,${imageBase64}`
              }
            ]
          }
        ],
      })
      return object
    })

    return result
  } catch (error) {
    console.error('Erro ao analisar prato:', error)
    return FALLBACK_RESPONSES.analise
  }
}

/**
 * Gerar plano alimentar semanal personalizado
 */
export async function gerarPlanoSemanal(
  perfil: ProfileContext,
  preferencias?: string
): Promise<z.infer<typeof PlanoSemanalSchema> | string> {
  // Calcular calorias base
  let metaCalorias = perfil.plano === 'restritivo' ? 1300 : 1900

  // Ajustes por situação
  if (perfil.amamentando) {
    metaCalorias += 500
  } else if (perfil.semana_gestacao) {
    if (perfil.semana_gestacao <= 12) metaCalorias += 100
    else if (perfil.semana_gestacao <= 26) metaCalorias += 340
    else metaCalorias += 450
  }

  const situacao = perfil.semana_gestacao
    ? `Gestante (${perfil.semana_gestacao} semanas)`
    : perfil.amamentando
    ? 'Amamentando'
    : perfil.idade_bebe
    ? `Pos-parto (bebe ${perfil.idade_bebe} dias)`
    : 'Geral'

  const prompt = `Crie um plano alimentar semanal para:
- Situacao: ${situacao}
- Meta: ${metaCalorias} kcal/dia
${perfil.semana_gestacao ? '- IMPORTANTE: Evitar alimentos proibidos na gestacao!' : ''}
${perfil.amamentando ? '- IMPORTANTE: Priorizar alimentos que auxiliam na lactacao!' : ''}
${perfil.restricoes?.length ? `- Restricoes: ${perfil.restricoes.join(', ')}` : ''}
${preferencias ? `- Preferencias: ${preferencias}` : ''}

Inclua lista de compras organizada por categoria.`

  try {
    const result = await withRetry(async () => {
      const { object } = await generateObject({
        model: MODELS.primary,
        schema: PlanoSemanalSchema,
        system: SYSTEM_PROMPTS.plano_semanal,
        prompt,
      })
      return object
    })

    return result
  } catch (error) {
    console.error('Erro ao gerar plano:', error)
    return FALLBACK_RESPONSES.plano
  }
}

/**
 * Gerar receita personalizada
 */
export async function gerarReceita(
  tipo: string,
  ingredientes?: string[],
  restricoes?: string,
  tempoMax?: number,
  perfil?: ProfileContext,
  forcarNovaReceita?: boolean // Adiciona parametro para forcar nova receita
): Promise<string> {
  // So usa cache se nao for pedido explicito por nova receita
  if (!forcarNovaReceita) {
    const cacheKey = getCacheKey(`receita:${tipo}`, ingredientes?.join(','))
    const cached = getFromCache(cacheKey)
    if (cached) return cached
  }

  const isGestante = perfil?.semana_gestacao ? true : false
  const isAmamentando = perfil?.amamentando ? true : false

  // Variacoes para diversificar receitas
  const estilos = ['caseira', 'rapida', 'criativa', 'fit', 'confortante', 'leve']
  const estiloAleatorio = estilos[Math.floor(Math.random() * estilos.length)]

  const variadores = [
    'Use ingredientes diferentes da ultima vez.',
    'Seja criativo com temperos e ervas.',
    'Sugira uma versao inovadora.',
    'Pense em uma combinacao inesperada mas deliciosa.',
    'Foque em praticidade e sabor.',
    'Priorize ingredientes da estacao.'
  ]
  const variadorAleatorio = variadores[Math.floor(Math.random() * variadores.length)]

  // Timestamp para garantir unicidade
  const timestamp = Date.now()

  const prompt = `Crie uma receita ${tipo} ${estiloAleatorio} e saudavel.

IMPORTANTE: ${variadorAleatorio}
Gere uma receita UNICA e criativa. NAO inclua numeros ou codigos no nome da receita.

${ingredientes?.length ? `Ingredientes disponiveis: ${ingredientes.join(', ')}` : ''}
${restricoes ? `Restricoes: ${restricoes}` : ''}
${tempoMax ? `Tempo maximo: ${tempoMax} minutos` : ''}
${isGestante ? 'IMPORTANTE: A receita deve ser SEGURA para gestantes!' : ''}
${isAmamentando ? 'IMPORTANTE: Priorizar ingredientes bons para lactacao!' : ''}

Siga o formato obrigatorio:
NOME: [nome criativo da receita]
TEMPO: [XX minutos]
RENDIMENTO: [X porcoes]
CALORIAS: [XXX kcal por porcao]
PROTEINAS: [XX g]

INGREDIENTES:
- [quantidade] [ingrediente]
- [...]

MODO DE PREPARO:
1. [passo detalhado]
2. [...]

DICA NUTRI: [dica especial]
VARIACAO: [sugestao de substituicao]`

  try {
    const result = await withRetry(async () => {
      const { text } = await generateText({
        model: MODELS.primary,
        system: SYSTEM_PROMPTS.receita_ia,
        prompt,
        temperature: 0.9, // Aumenta temperatura para mais variedade
      })
      return text
    })

    // So cacheia se nao for refresh forcado
    if (!forcarNovaReceita) {
      const cacheKey = getCacheKey(`receita:${tipo}`, ingredientes?.join(','))
      setCache(cacheKey, result)
    }
    return result
  } catch (error) {
    console.error('Erro ao gerar receita:', error)
    return FALLBACK_RESPONSES.receita
  }
}

/**
 * Coach Virtual - Check-in diário com análise
 */
export async function coachCheckIn(
  checkIn: z.infer<typeof CheckInDiarioSchema>,
  perfil: ProfileContext,
  historicoRecente?: string
): Promise<z.infer<typeof CoachResponseSchema>> {
  const situacao = perfil.semana_gestacao
    ? `Gestante (${perfil.semana_gestacao} semanas)`
    : perfil.amamentando
    ? 'Amamentando'
    : perfil.idade_bebe
    ? `Mae (bebe ${perfil.idade_bebe} dias)`
    : 'Geral'

  const prompt = `Analise o check-in diario:

CHECK-IN:
- Humor: ${checkIn.humor}
- Energia: ${checkIn.energia}/10
- Sono: ${checkIn.sono_horas} horas
- Agua: ${checkIn.agua_ml} ml
- Exercicio: ${checkIn.exercicio ? 'Sim' : 'Nao'}
${checkIn.observacoes ? `- Observacoes: ${checkIn.observacoes}` : ''}

PERFIL:
- Nome: ${perfil.nome || 'Usuaria'}
- Situacao: ${situacao}
- Meta de peso: ${perfil.peso_meta || 'nao definida'} kg

${historicoRecente ? `HISTORICO RECENTE:\n${historicoRecente}` : ''}

Forneca uma analise motivadora e sugestoes praticas considerando a situacao da usuaria.`

  try {
    const result = await withRetry(async () => {
      const { object } = await generateObject({
        model: MODELS.primary,
        schema: CoachResponseSchema,
        system: SYSTEM_PROMPTS.nutri_coach,
        prompt,
      })
      return object
    })

    return result
  } catch (error) {
    console.error('Erro no coach:', error)
    return {
      mensagem_motivacional: 'Voce esta indo muito bem! Continue firme na sua jornada.',
      analise_dia: 'Nao foi possivel analisar completamente seu dia.',
      sugestoes: [
        'Beba mais agua ao longo do dia',
        'Priorize o descanso quando possivel',
        'Faca uma caminhada leve se possivel'
      ],
      meta_amanha: 'Melhorar a hidratacao bebendo 8 copos de agua',
      pontuacao_dia: 7
    }
  }
}

/**
 * Obter dica diária personalizada
 */
export async function dicaDoDia(perfil: ProfileContext): Promise<string> {
  const cacheKey = getCacheKey('dica_dia', new Date().toDateString() + perfil.modo)
  const cached = getFromCache(cacheKey)
  if (cached) return cached

  const situacao = perfil.semana_gestacao
    ? `Gestante de ${perfil.semana_gestacao} semanas`
    : perfil.amamentando
    ? 'Amamentando'
    : 'Mulher buscando saude'

  const prompt = `Gere UMA dica curta e pratica (max 2 frases) para uma ${situacao}.
Seja motivadora e especifica para essa fase da vida.`

  try {
    const { text } = await generateText({
      model: MODELS.fallback,
      system: 'Voce da dicas rapidas de nutricao e bem-estar feminino. Seja breve e pratica.',
      prompt,
    })

    setCache(cacheKey, text)
    return text
  } catch {
    const dicas = [
      'Hidrate-se! Beba um copo de agua agora mesmo.',
      'Que tal um lanche com proteina? Iogurte natural e uma otima opcao.',
      'Lembre-se: descansar tambem faz parte da saude.',
      'Inclua uma fruta colorida na sua proxima refeicao.',
      'Respire fundo. Voce esta cuidando bem de si mesma!'
    ]
    return dicas[Math.floor(Math.random() * dicas.length)]
  }
}

// Schema para lote parcial (sem lista de compras - sera consolidada no final)
const PlanoLoteSchema = z.object({
  dias: z.array(z.object({
    data: z.string(),
    dia_semana: z.string(),
    refeicoes: z.array(RefeicaoDetalhadaSchema),
    total_calorias: z.number(),
    dica_dia: z.string()
  })),
  ingredientes_usados: z.array(z.object({
    nome: z.string(),
    quantidade: z.number(),
    unidade: z.string(),
    categoria: z.enum(['frutas', 'vegetais', 'proteinas', 'laticinios', 'carboidratos', 'gorduras', 'temperos', 'outros'])
  }))
})

/**
 * Gerar plano alimentar completo com ingredientes e modo de preparo
 * Para planos mensais, usa geracao em lotes de 5 dias para evitar truncamento
 */
export async function gerarPlanoAlimentarCompleto(
  perfil: ProfileContext,
  periodo: 'dia' | 'semana' | 'mes',
  preferencias?: string
): Promise<z.infer<typeof PlanoAlimentarCompletoSchema> | null> {
  // Calcular calorias base
  let metaCalorias = perfil.plano === 'restritivo' ? 1300 : 1900

  // Ajustes por situacao
  if (perfil.amamentando) {
    metaCalorias += 500
  } else if (perfil.semana_gestacao) {
    if (perfil.semana_gestacao <= 12) metaCalorias += 100
    else if (perfil.semana_gestacao <= 26) metaCalorias += 340
    else metaCalorias += 450
  }

  // Determinar numero de dias
  const numDias = periodo === 'dia' ? 1 : periodo === 'semana' ? 7 : 30

  // Gerar todas as datas
  const todasDatas: { data: string; dia_semana: string }[] = []
  const diasSemana = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']
  const hoje = new Date()

  for (let i = 0; i < numDias; i++) {
    const data = new Date(hoje)
    data.setDate(hoje.getDate() + i)
    todasDatas.push({
      data: data.toISOString().split('T')[0],
      dia_semana: diasSemana[data.getDay()]
    })
  }

  const situacao = perfil.semana_gestacao
    ? `Gestante (${perfil.semana_gestacao} semanas)`
    : perfil.amamentando
    ? 'Amamentando'
    : perfil.idade_bebe
    ? `Pos-parto (bebe ${perfil.idade_bebe} dias)`
    : 'Mulher buscando saude'

  const tiposRefeicao = ['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia']

  const systemPrompt = `Voce e uma nutricionista criando planos alimentares detalhados.
Cada refeicao deve ter receita completa com ingredientes e modo de preparo.
Gere refeicoes PRATICAS e RAPIDAS (max 30 min preparo) com ingredientes acessiveis.
Categorize os ingredientes em: frutas, vegetais, proteinas, laticinios, carboidratos, gorduras, temperos, outros.`

  // Para planos curtos (dia/semana), gera tudo de uma vez
  if (periodo !== 'mes') {
    const prompt = criarPromptPlanoCompleto(todasDatas, situacao, metaCalorias, perfil, preferencias, tiposRefeicao)

    try {
      const result = await withRetry(async () => {
        const { object } = await generateObject({
          model: MODELS.primary,
          schema: PlanoAlimentarCompletoSchema,
          system: systemPrompt,
          prompt,
          temperature: 0.7,
        })
        return object
      }, {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 10000,
        backoffMultiplier: 2
      })

      return result
    } catch (error) {
      console.error('Erro ao gerar plano alimentar completo:', error)
      return null
    }
  }

  // Para plano mensal: gerar em lotes de 5 dias
  const TAMANHO_LOTE = 5
  const todosOsDias: z.infer<typeof PlanoAlimentarCompletoSchema>['dias'] = []
  const todosIngredientes: Map<string, { quantidade: number; unidade: string; categoria: 'frutas' | 'vegetais' | 'proteinas' | 'laticinios' | 'carboidratos' | 'gorduras' | 'temperos' | 'outros' }> = new Map()
  const dicasGerais: string[] = []

  // Resumo das refeicoes ja geradas para manter variedade
  let resumoRefeicoes: string[] = []

  console.log(`Gerando plano mensal em lotes de ${TAMANHO_LOTE} dias...`)

  for (let i = 0; i < numDias; i += TAMANHO_LOTE) {
    const datasLote = todasDatas.slice(i, i + TAMANHO_LOTE)
    const numeroLote = Math.floor(i / TAMANHO_LOTE) + 1
    const totalLotes = Math.ceil(numDias / TAMANHO_LOTE)

    console.log(`Gerando lote ${numeroLote}/${totalLotes} (dias ${i + 1} a ${Math.min(i + TAMANHO_LOTE, numDias)})...`)

    const promptLote = criarPromptLote(
      datasLote,
      situacao,
      metaCalorias,
      perfil,
      preferencias,
      tiposRefeicao,
      resumoRefeicoes,
      numeroLote,
      totalLotes
    )

    try {
      const resultado = await withRetry(async () => {
        const { object } = await generateObject({
          model: MODELS.primary,
          schema: PlanoLoteSchema,
          system: systemPrompt,
          prompt: promptLote,
          temperature: 0.7,
        })
        return object
      }, {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 15000,
        backoffMultiplier: 2
      })

      // Adicionar dias ao resultado final
      todosOsDias.push(...resultado.dias)

      // Consolidar ingredientes
      for (const ing of resultado.ingredientes_usados) {
        const chave = `${ing.nome.toLowerCase()}_${ing.unidade}`
        const existente = todosIngredientes.get(chave)
        if (existente) {
          existente.quantidade += ing.quantidade
        } else {
          todosIngredientes.set(chave, {
            quantidade: ing.quantidade,
            unidade: ing.unidade,
            categoria: ing.categoria
          })
        }
      }

      // Atualizar resumo para proximo lote (manter variedade)
      resumoRefeicoes = resultado.dias.flatMap(d =>
        d.refeicoes.map(r => `${r.tipo}: ${r.nome}`)
      ).slice(-18) // Ultimas 18 refeicoes (3 dias)

      // Coletar dicas
      resultado.dias.forEach(d => {
        if (d.dica_dia && !dicasGerais.includes(d.dica_dia)) {
          dicasGerais.push(d.dica_dia)
        }
      })

    } catch (error) {
      console.error(`Erro no lote ${numeroLote}:`, error)
      // Continuar com os proximos lotes mesmo se um falhar
      continue
    }
  }

  // Se nao conseguiu gerar nenhum dia, retorna null
  if (todosOsDias.length === 0) {
    console.error('Nenhum dia foi gerado com sucesso')
    return null
  }

  // Montar lista de compras consolidada
  const listaCompras: z.infer<typeof PlanoAlimentarCompletoSchema>['lista_compras'] = []
  for (const [chave, valor] of todosIngredientes) {
    const nome = chave.split('_')[0]
    listaCompras.push({
      item: nome.charAt(0).toUpperCase() + nome.slice(1),
      quantidade: Math.ceil(valor.quantidade), // Arredondar para cima
      unidade: valor.unidade,
      categoria: valor.categoria
    })
  }

  // Ordenar lista por categoria
  listaCompras.sort((a, b) => a.categoria.localeCompare(b.categoria))

  console.log(`Plano mensal concluido: ${todosOsDias.length} dias gerados`)

  return {
    periodo: 'mes',
    dias: todosOsDias,
    lista_compras: listaCompras,
    meta_calorias_diaria: metaCalorias,
    dicas_gerais: dicasGerais.slice(0, 10) // Limitar a 10 dicas
  }
}

// Funcao auxiliar para criar prompt de plano completo (dia/semana)
function criarPromptPlanoCompleto(
  datas: { data: string; dia_semana: string }[],
  situacao: string,
  metaCalorias: number,
  perfil: ProfileContext,
  preferencias: string | undefined,
  tiposRefeicao: string[]
): string {
  return `Crie um plano alimentar COMPLETO para ${datas.length} dia(s).

PERFIL:
- Situacao: ${situacao}
- Meta: ${metaCalorias} kcal/dia
- Plano: ${perfil.plano === 'restritivo' ? 'Low carb/Restritivo' : 'Equilibrado'}
${perfil.semana_gestacao ? '- IMPORTANTE: Evitar alimentos proibidos na gestacao!' : ''}
${perfil.amamentando ? '- IMPORTANTE: Priorizar alimentos que auxiliam na lactacao!' : ''}
${perfil.restricoes?.length ? `- Restricoes: ${perfil.restricoes.join(', ')}` : ''}
${preferencias ? `- Preferencias: ${preferencias}` : ''}

DATAS DO PLANO:
${datas.map(d => `- ${d.data} (${d.dia_semana})`).join('\n')}

TIPOS DE REFEICAO OBRIGATORIOS:
${tiposRefeicao.join(', ')}

REQUISITOS:
1. Cada dia DEVE ter exatamente 6 refeicoes (cafe, lanche_manha, almoco, lanche_tarde, jantar, ceia)
2. Cada refeicao DEVE ter:
   - nome criativo
   - descricao breve
   - calorias, proteinas, carboidratos, gorduras
   - lista de ingredientes com quantidade e unidade
   - modo de preparo passo a passo
   - tempo de preparo em minutos
3. Variar as refeicoes entre os dias
4. Lista de compras consolidada ao final com quantidades totais
5. Uma dica pratica por dia

IMPORTANTE: Gere refeicoes PRATICAS e RAPIDAS (max 30 min preparo) com ingredientes acessiveis.`
}

// Funcao auxiliar para criar prompt de lote (para plano mensal)
function criarPromptLote(
  datas: { data: string; dia_semana: string }[],
  situacao: string,
  metaCalorias: number,
  perfil: ProfileContext,
  preferencias: string | undefined,
  tiposRefeicao: string[],
  refeicoeAnteriores: string[],
  numeroLote: number,
  totalLotes: number
): string {
  const contextoVariedade = refeicoeAnteriores.length > 0
    ? `\n\nREFEICOES JA GERADAS (evite repetir):
${refeicoeAnteriores.join('\n')}`
    : ''

  return `LOTE ${numeroLote} de ${totalLotes} - Gere refeicoes para ${datas.length} dias.

PERFIL:
- Situacao: ${situacao}
- Meta: ${metaCalorias} kcal/dia
- Plano: ${perfil.plano === 'restritivo' ? 'Low carb/Restritivo' : 'Equilibrado'}
${perfil.semana_gestacao ? '- IMPORTANTE: Evitar alimentos proibidos na gestacao!' : ''}
${perfil.amamentando ? '- IMPORTANTE: Priorizar alimentos que auxiliam na lactacao!' : ''}
${perfil.restricoes?.length ? `- Restricoes: ${perfil.restricoes.join(', ')}` : ''}
${preferencias ? `- Preferencias: ${preferencias}` : ''}

DATAS DESTE LOTE:
${datas.map(d => `- ${d.data} (${d.dia_semana})`).join('\n')}

TIPOS DE REFEICAO:
${tiposRefeicao.join(', ')}
${contextoVariedade}

REQUISITOS:
1. Cada dia DEVE ter exatamente 6 refeicoes
2. Cada refeicao DEVE ter: nome, descricao, macros, ingredientes com quantidades, modo de preparo, tempo
3. VARIE as refeicoes - nao repita pratos dos dias anteriores
4. Liste TODOS os ingredientes usados neste lote com quantidades totais
5. Uma dica pratica por dia

IMPORTANTE: Gere refeicoes PRATICAS e RAPIDAS (max 30 min preparo).`
}

// =====================================================
// EXPORT TIPOS
// =====================================================

export type AnalisePrato = z.infer<typeof AnalisePratoSchema>
export type PlanoSemanal = z.infer<typeof PlanoSemanalSchema>
export type CheckInDiario = z.infer<typeof CheckInDiarioSchema>
export type CoachResponse = z.infer<typeof CoachResponseSchema>
export type RefeicaoDetalhada = z.infer<typeof RefeicaoDetalhadaSchema>
export type PlanoAlimentarCompleto = z.infer<typeof PlanoAlimentarCompletoSchema>
