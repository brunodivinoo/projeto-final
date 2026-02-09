// Serviço de busca web médica via Serper.dev
// Substitui o web_search nativo do Claude (caro) por busca direta via Serper (barato)
// Prioriza diretrizes brasileiras nas buscas

interface ResultadoWeb {
  titulo: string
  url: string
  snippet: string
  dominio: string
  ehDiretriz: boolean
  posicao: number
}

export interface ResultadoBuscaWeb {
  success: boolean
  resultados: ResultadoWeb[]
  query: string
  queryDiretrizes?: string
  totalResults: number
  error?: string
}

// Domínios de diretrizes brasileiras (PRIORIDADE MÁXIMA)
const DOMINIOS_DIRETRIZES = [
  // Sociedades médicas brasileiras
  'abccardiol.org',
  'sbc.org.br',
  'sbcm.org.br',
  'febrasgo.org.br',
  'sbp.com.br',
  'sbgg.org.br',
  'sbpt.org.br',
  'sbn.org.br',
  'sbed.org.br',
  'sbd.org.br',
  'sbhci.org.br',
  'sbi.org.br',
  'sbmfc.org.br',
  'sbgg.org.br',
  // Governo e órgãos oficiais
  'conitec.gov.br',
  'bvsms.saude.gov.br',
  'saude.gov.br',
  'ans.gov.br',
  // Diretrizes e protocolos
  'diretrizes.amb.org.br',
  'pcdt.saude.gov.br',
  // Associação Médica Brasileira
  'amb.org.br',
]

// Domínios médicos confiáveis (segunda prioridade)
const DOMINIOS_MEDICOS_CONFIAVEIS = [
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'scielo.br',
  'bvsalud.org',
  'lilacs.bvsalud.org',
  'uptodate.com',
  'medscape.com',
  'who.int',
  'cdc.gov',
  'nejm.org',
  'thelancet.com',
  'bmj.com',
  'jamanetwork.com',
  'cochranelibrary.com',
  'msdmanuals.com',
  'dynamed.com',
  'fiocruz.br',
  'usp.br',
  'unicamp.br',
  'unifesp.br',
]

// Domínios bloqueados
const DOMINIOS_BLOQUEADOS = [
  'pinterest.com', 'facebook.com', 'instagram.com', 'twitter.com',
  'tiktok.com', 'amazon.com', 'mercadolivre.com.br', 'shopee.com',
  'sanarmed.com', 'sanar.com.br', 'sanarflix.com.br',
]

function extrairDominio(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

function ehDominioDiretriz(dominio: string): boolean {
  return DOMINIOS_DIRETRIZES.some(d => dominio.includes(d))
}

function ehDominioConfiavel(dominio: string): boolean {
  return ehDominioDiretriz(dominio) ||
    DOMINIOS_MEDICOS_CONFIAVEIS.some(d => dominio.includes(d))
}

function ehDominioBloqueado(dominio: string): boolean {
  return DOMINIOS_BLOQUEADOS.some(d => dominio.includes(d))
}

/**
 * Busca web médica via Serper.dev
 * Faz duas buscas: uma focada em diretrizes brasileiras + uma geral
 */
export async function buscarWebMedica(
  tema: string,
  maxResultados: number = 8
): Promise<ResultadoBuscaWeb> {
  const SERPER_API_KEY = process.env.SERPER_API_KEY

  if (!SERPER_API_KEY) {
    console.error('[SerperWeb] API Key não configurada')
    return { success: false, resultados: [], query: tema, totalResults: 0, error: 'SERPER_API_KEY não configurada' }
  }

  try {
    console.log(`[SerperWeb] Buscando: "${tema}"`)

    // Busca 1: Diretrizes brasileiras (PRIORIDADE)
    const queryDiretrizes = `diretrizes brasileiras ${tema} medicina`

    // Busca 2: Fontes científicas gerais
    const queryGeral = `${tema} medicina tratamento diagnóstico`

    // Executar ambas em paralelo
    const [resDiretrizes, resGeral] = await Promise.all([
      fetchSerper(SERPER_API_KEY, queryDiretrizes, 10),
      fetchSerper(SERPER_API_KEY, queryGeral, 10),
    ])

    // Combinar e processar resultados
    const urlsVistas = new Set<string>()
    const todosResultados: ResultadoWeb[] = []

    // Processar diretrizes primeiro (prioridade)
    if (resDiretrizes?.organic) {
      for (const item of resDiretrizes.organic) {
        const dominio = extrairDominio(item.link || '')
        if (ehDominioBloqueado(dominio) || urlsVistas.has(item.link)) continue
        urlsVistas.add(item.link)

        todosResultados.push({
          titulo: item.title || '',
          url: item.link || '',
          snippet: (item.snippet || '').slice(0, 400),
          dominio,
          ehDiretriz: ehDominioDiretriz(dominio),
          posicao: todosResultados.length,
        })
      }
    }

    // Processar busca geral (sem duplicatas)
    if (resGeral?.organic) {
      for (const item of resGeral.organic) {
        const dominio = extrairDominio(item.link || '')
        if (ehDominioBloqueado(dominio) || urlsVistas.has(item.link)) continue
        urlsVistas.add(item.link)

        todosResultados.push({
          titulo: item.title || '',
          url: item.link || '',
          snippet: (item.snippet || '').slice(0, 400),
          dominio,
          ehDiretriz: ehDominioDiretriz(dominio),
          posicao: todosResultados.length,
        })
      }
    }

    // Rankear: diretrizes > confiáveis > outros
    const rankeados = todosResultados.sort((a, b) => {
      // Diretrizes brasileiras no topo
      if (a.ehDiretriz && !b.ehDiretriz) return -1
      if (!a.ehDiretriz && b.ehDiretriz) return 1
      // Domínios confiáveis em segundo
      const aConfiavel = ehDominioConfiavel(a.dominio)
      const bConfiavel = ehDominioConfiavel(b.dominio)
      if (aConfiavel && !bConfiavel) return -1
      if (!aConfiavel && bConfiavel) return 1
      // Manter ordem original
      return a.posicao - b.posicao
    })

    const resultadosFinal = rankeados.slice(0, maxResultados)

    console.log(`[SerperWeb] ${resultadosFinal.length} resultados (${resultadosFinal.filter(r => r.ehDiretriz).length} de diretrizes)`)

    return {
      success: true,
      resultados: resultadosFinal,
      query: tema,
      queryDiretrizes,
      totalResults: resultadosFinal.length,
    }
  } catch (error) {
    console.error('[SerperWeb] Erro na busca:', error)
    return {
      success: false,
      resultados: [],
      query: tema,
      totalResults: 0,
      error: String(error),
    }
  }
}

/**
 * Chamada direta ao Serper.dev Google Search
 */
async function fetchSerper(
  apiKey: string,
  query: string,
  num: number = 10
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: 'br',
        hl: 'pt-br',
        num,
      }),
    })

    if (!response.ok) {
      console.error(`[SerperWeb] API error: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[SerperWeb] Fetch error:', error)
    return null
  }
}

/**
 * Formata resultados para injeção no prompt da IA
 * Retorna texto compacto com snippets + fontes em formato ABNT
 */
export function formatarResultadosParaPrompt(resultados: ResultadoWeb[]): string {
  if (resultados.length === 0) return ''

  const dataAtual = new Date().toLocaleDateString('pt-BR')
  let texto = ''

  // Trechos relevantes
  resultados.forEach((r, i) => {
    const tag = r.ehDiretriz ? '[DIRETRIZ]' : '[FONTE]'
    texto += `${tag} ${r.titulo}: ${r.snippet}\n\n`
  })

  // Referências ABNT
  texto += '\nFontes consultadas:\n'
  resultados.forEach((r, i) => {
    texto += `[${i + 1}] ${r.titulo}. Disponível em: ${r.url}. Acesso em: ${dataAtual}.\n`
  })

  return texto
}

/**
 * Detecta o tema médico principal da mensagem do usuário
 * Usado para construir a query de busca
 */
export function extrairTemaMedico(mensagem: string): string | null {
  const msgLower = mensagem.toLowerCase()

  // Termos que indicam que o usuário quer informação médica buscável
  const indicadores = [
    'o que é', 'o que e', 'explique', 'como funciona', 'como tratar',
    'tratamento', 'diagnóstico', 'diagnostico', 'fisiopatologia',
    'etiologia', 'epidemiologia', 'sintomas', 'sinais', 'quadro clínico',
    'conduta', 'manejo', 'abordagem', 'protocolo', 'diretriz',
    'classificação', 'classificacao', 'estadiamento', 'prognóstico',
    'profilaxia', 'prevenção', 'prevencao', 'complicações', 'complicacoes',
    'caso clínico', 'caso clinico', 'paciente com', 'diferencial',
  ]

  const temIndicador = indicadores.some(t => msgLower.includes(t))

  if (!temIndicador && msgLower.length < 20) return null

  // Limpar a mensagem para extrair o tema
  let tema = mensagem
    .replace(/\?/g, '')
    .replace(/^(me |por favor |pode |quero |preciso |gostaria )/i, '')
    .replace(/^(explique|explica|fale|conte|diga|descreva) (sobre |de |a |o |como )?/i, '')
    .replace(/^(o que é|o que e|qual|quais|como) (é |e |são |sao )?/i, '')
    .trim()

  // Se ficou muito longo, pegar as primeiras palavras relevantes
  if (tema.length > 100) {
    tema = tema.slice(0, 100)
  }

  return tema || null
}

/**
 * Verifica se a mensagem se beneficiaria de busca web
 */
export function precisaDeBusca(mensagem: string): boolean {
  const msgLower = mensagem.toLowerCase()

  // Mensagens curtas/casuais não precisam
  if (msgLower.length < 15) return false

  // Saudações e respostas curtas
  const casual = ['oi', 'olá', 'ola', 'obrigado', 'valeu', 'sim', 'não', 'nao', 'ok', 'tudo bem']
  if (casual.some(c => msgLower.trim() === c)) return false

  // Pedidos de artefatos específicos (questões, flashcards) não precisam de busca
  const artefatos = ['questão', 'questao', 'flashcard', 'simulado', 'gere', 'crie']
  if (artefatos.some(a => msgLower.startsWith(a))) return false

  // Temas médicos que se beneficiam de busca
  const temasMedicos = [
    'fisiopatologia', 'tratamento', 'diagnóstico', 'diagnostico',
    'epidemiologia', 'etiologia', 'patogênese', 'patogenese',
    'conduta', 'manejo', 'protocolo', 'diretriz', 'consenso',
    'classificação', 'classificacao', 'estadiamento', 'prognóstico',
    'doença', 'doenca', 'síndrome', 'sindrome', 'infecção', 'infeccao',
    'insuficiência', 'insuficiencia', 'hipertensão', 'hipertensao',
    'diabetes', 'câncer', 'cancer', 'tumor', 'neoplasia',
    'farmacologia', 'medicamento', 'droga', 'antibiótico', 'antibiotico',
  ]

  return temasMedicos.some(t => msgLower.includes(t))
}
