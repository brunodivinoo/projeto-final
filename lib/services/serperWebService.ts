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
  'wikipedia.org', 'pt.wikipedia.org', 'en.wikipedia.org',
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

    // Detectar se é tema médico ou tema geral
    const temaLower = tema.toLowerCase()
    const ehTemaMedico = [
      'tratamento', 'diagnóstico', 'diagnostico', 'fisiopatologia', 'doença', 'doenca',
      'síndrome', 'sindrome', 'medicamento', 'droga', 'antibiótico', 'antibiotico',
      'cirurgia', 'paciente', 'clínico', 'clinico', 'patologia', 'anatomia',
      'fisiologia', 'farmacologia', 'epidemiologia', 'hipertensão', 'hipertensao',
      'diabetes', 'câncer', 'cancer', 'infecção', 'infeccao', 'pediatria',
      'obstetrícia', 'obstetricia', 'cardiologia', 'neurologia', 'dermatologia',
    ].some(t => temaLower.includes(t))

    // Busca 1: Diretrizes/fontes confiáveis (adapta conforme o tema)
    const queryDiretrizes = ehTemaMedico
      ? `diretrizes brasileiras ${tema} medicina`
      : `${tema} informações completas`

    // Busca 2: Fontes gerais/complementares
    const queryGeral = ehTemaMedico
      ? `${tema} medicina tratamento diagnóstico`
      : `${tema} comparação características`

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
 * Detecta o tema principal da mensagem do usuário para busca web
 * Funciona para qualquer assunto (não só medicina) - como ChatGPT
 */
export function extrairTemaMedico(mensagem: string): string | null {
  // Limpar a mensagem para extrair o tema de busca
  let tema = mensagem
    .replace(/\?/g, '')
    .replace(/^(me |por favor |pode |quero |preciso |gostaria |pesquisa |busca |pesquise |busque )/i, '')
    .replace(/^(explique|explica|fale|conte|diga|descreva|pesquisa) (sobre |de |a |o |como |ai |aí )?/i, '')
    .replace(/^(o que é|o que e|qual|quais|como) (é |e |são |sao )?/i, '')
    .replace(/^(qual |quais |me diga |me fale |me conte )(a |o |as |os )?(diferenças?|diferenca) (entre |de |do |da )?/i, '')
    .trim()

  // Se ficou muito longo, pegar as primeiras palavras relevantes
  if (tema.length > 120) {
    tema = tema.slice(0, 120)
  }

  // Se ficou muito curto ou vazio, usar mensagem original
  if (tema.length < 5) {
    tema = mensagem.slice(0, 120).trim()
  }

  return tema.length >= 5 ? tema : null
}

/**
 * Verifica se a mensagem se beneficiaria de busca web
 * ESTRATÉGIA: Buscar SEMPRE (como ChatGPT), exceto em mensagens casuais/curtas
 * Isso garante respostas sempre atualizadas e baseadas em fontes reais
 */
export function precisaDeBusca(mensagem: string): boolean {
  const msgLower = mensagem.toLowerCase().trim()

  // Mensagens muito curtas (< 8 chars) não precisam
  if (msgLower.length < 8) return false

  // Saudações e respostas curtas/afirmativas
  const casual = [
    'oi', 'olá', 'ola', 'obrigado', 'valeu', 'sim', 'não', 'nao', 'ok',
    'tudo bem', 'beleza', 'entendi', 'obg', 'vlw', 'uhum', 'aham',
    'bom dia', 'boa tarde', 'boa noite', 'pronto', 'fechou', 'dale',
    'pode', 'quero', 'isso', 'bora', 'vamos', 'próximo', 'proximo',
    'certo', 'blz', 'top', 'show', 'pode ser', '1', '2', '3', 'a', 'b', 'c',
  ]
  if (casual.some(c => msgLower === c || msgLower === c + '!')) return false

  // Pedidos PURAMENTE de artefatos (sem tema novo para buscar)
  // Ex: "gere 5 questões" sem tema → não busca
  // Ex: "gere questões sobre diabetes" → SIM busca (tem tema)
  const artefatosSemTema = [
    /^(gere|crie|cria|faça|faz|monte)\s+(mais\s+)?(questões?|questoes?|flashcards?|simulado|diagrama)/i,
    /^(mais|próxim[ao]|outr[ao])\s+(questões?|questoes?|flashcards?)/i,
    /^(repita|continue|prossiga)/i,
  ]
  if (artefatosSemTema.some(r => r.test(msgLower))) return false

  // Mensagens de feedback sobre questões/respostas anteriores
  const feedback = [
    /^(errei|acertei|alternativa|letra)\s/i,
    /^(a|b|c|d|e)\)?$/i, // Escolhendo alternativa
  ]
  if (feedback.some(r => r.test(msgLower))) return false

  // TUDO MAIS: BUSCAR NA WEB (como ChatGPT faz)
  // Se tem mais de 8 chars e não é casual/feedback → buscar
  return true
}
