// Citation Manager - Gerenciador de Citacoes em Portugues Brasileiro
// Usa Structured Outputs do OpenAI para garantir formato consistente
// Integra com Serper API para busca de fontes medicas

// ==========================================
// TIPOS
// ==========================================

export interface CitacaoMedica {
  id: number
  titulo: string
  autores?: string[]
  fonte: string
  ano?: number
  url?: string
  tipo: 'livro' | 'artigo' | 'guideline' | 'site' | 'revista'
  texto_citado: string
  relevancia: 'alta' | 'media' | 'baixa'
  verificado: boolean
}

export interface RespostaComCitacoes {
  resposta: string
  citacoes: CitacaoMedica[]
  fontes_consultadas: string[]
  nivel_confianca: number // 0-100
  disclaimer?: string
}

export interface SerperResult {
  title: string
  link: string
  snippet: string
  position: number
}

// ==========================================
// FONTES MEDICAS CONFIAVEIS
// ==========================================

export const FONTES_CONFIAVEIS = {
  livros: [
    'Harrison',
    'Cecil',
    'Robbins',
    'Guyton',
    'Sabiston',
    'Nelson',
    'Bates',
    'Porto',
    'Bogliolo',
    'Zugaib'
  ],
  guidelines: [
    'UpToDate',
    'Dynamed',
    'BMJ Best Practice',
    'NICE Guidelines',
    'AHA Guidelines',
    'ESC Guidelines',
    'ACOG',
    'AAP',
    'IDSA',
    'WHO'
  ],
  revistas: [
    'NEJM',
    'The Lancet',
    'JAMA',
    'BMJ',
    'Annals of Internal Medicine',
    'Circulation',
    'Nature Medicine',
    'Cell',
    'Science'
  ],
  sites: [
    'PubMed',
    'Scielo',
    'Medscape',
    'MSD Manuals',
    'Mayo Clinic',
    'CDC',
    'NIH',
    'FIOCRUZ',
    'Ministerio da Saude'
  ]
}

// ==========================================
// BUSCA COM SERPER API
// ==========================================

export async function buscarFontesMedicas(
  query: string,
  numResultados: number = 5
): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    console.warn('[Citations] SERPER_API_KEY nao configurada')
    return []
  }

  try {
    // Enriquecer query com termos medicos
    const queryEnriquecida = `${query} site:pubmed.ncbi.nlm.nih.gov OR site:scielo.br OR site:uptodate.com OR site:medscape.com`

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: queryEnriquecida,
        num: numResultados,
        gl: 'br',
        hl: 'pt-br'
      })
    })

    if (!response.ok) {
      console.error('[Citations] Erro na Serper API:', response.status)
      return []
    }

    const data = await response.json()
    const organic = data.organic || []

    return organic.map((result: { title: string; link: string; snippet: string }, index: number) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      position: index + 1
    }))
  } catch (error) {
    console.error('[Citations] Erro ao buscar fontes:', error)
    return []
  }
}

// ==========================================
// EXTRAIR CITACOES DE TEXTO
// ==========================================

export function extrairCitacoesDoTexto(texto: string): CitacaoMedica[] {
  const citacoes: CitacaoMedica[] = []
  let idCounter = 1

  // Padroes para detectar citacoes
  const padroes = [
    // [1] Autor et al., 2023
    /\[(\d+)\]\s*([^,]+(?:,\s*[^,]+)*)\s*(?:et\s*al\.?)?,?\s*(\d{4})?/gi,
    // (Harrison, 2022)
    /\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*(\d{4})?\)/g,
    // Segundo o Harrison...
    /(?:segundo|conforme|de acordo com)\s+(?:o\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    // *Fonte: UpToDate 2023*
    /\*?fonte:\s*([^*\n]+)\*?/gi
  ]

  // Buscar livros conhecidos
  for (const livro of FONTES_CONFIAVEIS.livros) {
    const regex = new RegExp(`\\b${livro}\\b`, 'gi')
    if (regex.test(texto)) {
      citacoes.push({
        id: idCounter++,
        titulo: `${livro} - Tratado de Medicina`,
        fonte: livro,
        tipo: 'livro',
        texto_citado: extrairContexto(texto, livro),
        relevancia: 'alta',
        verificado: true
      })
    }
  }

  // Buscar guidelines
  for (const guideline of FONTES_CONFIAVEIS.guidelines) {
    const regex = new RegExp(`\\b${guideline}\\b`, 'gi')
    if (regex.test(texto)) {
      citacoes.push({
        id: idCounter++,
        titulo: `${guideline} Guidelines`,
        fonte: guideline,
        tipo: 'guideline',
        texto_citado: extrairContexto(texto, guideline),
        relevancia: 'alta',
        verificado: true
      })
    }
  }

  // Buscar revistas cientificas
  for (const revista of FONTES_CONFIAVEIS.revistas) {
    const regex = new RegExp(`\\b${revista}\\b`, 'gi')
    if (regex.test(texto)) {
      citacoes.push({
        id: idCounter++,
        titulo: `Artigo publicado em ${revista}`,
        fonte: revista,
        tipo: 'artigo',
        texto_citado: extrairContexto(texto, revista),
        relevancia: 'alta',
        verificado: true
      })
    }
  }

  return citacoes
}

/**
 * Extrai contexto ao redor de uma palavra-chave
 */
function extrairContexto(texto: string, palavra: string, tamanho: number = 100): string {
  const regex = new RegExp(`(.{0,${tamanho}}\\b${palavra}\\b.{0,${tamanho}})`, 'gi')
  const match = regex.exec(texto)
  return match ? match[1].trim() : ''
}

// ==========================================
// FORMATAR CITACAO EM ABNT
// ==========================================

export function formatarCitacaoABNT(citacao: CitacaoMedica): string {
  const { autores, titulo, fonte, ano, tipo, url } = citacao

  let formatada = ''

  switch (tipo) {
    case 'livro':
      if (autores && autores.length > 0) {
        const autoresStr = autores.length > 3
          ? `${autores[0].toUpperCase()} et al.`
          : autores.map(a => a.toUpperCase()).join('; ')
        formatada = `${autoresStr}. **${titulo}**. ${fonte}${ano ? `, ${ano}` : ''}.`
      } else {
        formatada = `${fonte.toUpperCase()}. **${titulo}**${ano ? `. ${ano}` : ''}.`
      }
      break

    case 'artigo':
      if (autores && autores.length > 0) {
        const autoresStr = autores.length > 3
          ? `${autores[0].toUpperCase()} et al.`
          : autores.map(a => a.toUpperCase()).join('; ')
        formatada = `${autoresStr}. ${titulo}. **${fonte}**${ano ? `, ${ano}` : ''}.`
      } else {
        formatada = `${titulo}. **${fonte}**${ano ? `, ${ano}` : ''}.`
      }
      break

    case 'guideline':
      formatada = `${fonte.toUpperCase()}. **${titulo}**${ano ? `. ${ano}` : ''}.`
      if (url) {
        formatada += ` Disponível em: ${url}.`
      }
      break

    case 'site':
      formatada = `${fonte.toUpperCase()}. **${titulo}**${ano ? `. ${ano}` : ''}.`
      if (url) {
        formatada += ` Disponível em: ${url}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`
      }
      break

    case 'revista':
      if (autores && autores.length > 0) {
        formatada = `${autores[0].toUpperCase()} et al. ${titulo}. **${fonte}**${ano ? `, ${ano}` : ''}.`
      } else {
        formatada = `${titulo}. **${fonte}**${ano ? `, ${ano}` : ''}.`
      }
      break

    default:
      formatada = `${fonte}. ${titulo}${ano ? `. ${ano}` : ''}.`
  }

  return formatada
}

// ==========================================
// GERAR SECAO DE REFERENCIAS
// ==========================================

export function gerarSecaoReferencias(citacoes: CitacaoMedica[]): string {
  if (citacoes.length === 0) return ''

  let secao = '\n\n---\n\n📚 **Fontes:**\n\n'

  // Ordenar por relevancia e depois por id
  const citacoesOrdenadas = [...citacoes].sort((a, b) => {
    const relevanciaOrdem = { alta: 1, media: 2, baixa: 3 }
    const diff = relevanciaOrdem[a.relevancia] - relevanciaOrdem[b.relevancia]
    return diff !== 0 ? diff : a.id - b.id
  })

  citacoesOrdenadas.forEach((citacao, index) => {
    const formatada = formatarCitacaoABNT(citacao)
    secao += `[${index + 1}] ${formatada}\n`
  })

  return secao
}

// ==========================================
// VALIDAR CITACOES
// ==========================================

export function validarCitacoes(citacoes: CitacaoMedica[]): {
  validas: CitacaoMedica[]
  invalidas: CitacaoMedica[]
  alertas: string[]
} {
  const validas: CitacaoMedica[] = []
  const invalidas: CitacaoMedica[] = []
  const alertas: string[] = []

  for (const citacao of citacoes) {
    // Verificar se e fonte confiavel
    const fonteConfiavel =
      FONTES_CONFIAVEIS.livros.some(l => citacao.fonte.toLowerCase().includes(l.toLowerCase())) ||
      FONTES_CONFIAVEIS.guidelines.some(g => citacao.fonte.toLowerCase().includes(g.toLowerCase())) ||
      FONTES_CONFIAVEIS.revistas.some(r => citacao.fonte.toLowerCase().includes(r.toLowerCase())) ||
      FONTES_CONFIAVEIS.sites.some(s => citacao.fonte.toLowerCase().includes(s.toLowerCase()))

    if (fonteConfiavel) {
      validas.push({ ...citacao, verificado: true })
    } else {
      invalidas.push({ ...citacao, verificado: false })
      alertas.push(`Fonte "${citacao.fonte}" nao esta na lista de fontes confiaveis`)
    }

    // Verificar ano
    if (citacao.ano && citacao.ano < 2015) {
      alertas.push(`Citacao [${citacao.id}] pode estar desatualizada (${citacao.ano})`)
    }
  }

  return { validas, invalidas, alertas }
}

// ==========================================
// ENRIQUECER RESPOSTA COM CITACOES
// ==========================================

export async function enriquecerComCitacoes(
  resposta: string,
  pergunta: string,
  buscarOnline: boolean = false
): Promise<RespostaComCitacoes> {
  // Extrair citacoes do texto
  const citacoesExtraidas = extrairCitacoesDoTexto(resposta)

  // Buscar fontes online se habilitado
  let fontesOnline: SerperResult[] = []
  if (buscarOnline) {
    fontesOnline = await buscarFontesMedicas(pergunta, 3)
  }

  // Adicionar fontes online como citacoes
  let citacaoId = citacoesExtraidas.length + 1
  for (const fonte of fontesOnline) {
    citacoesExtraidas.push({
      id: citacaoId++,
      titulo: fonte.title,
      fonte: extrairDominio(fonte.link),
      url: fonte.link,
      tipo: 'site',
      texto_citado: fonte.snippet,
      relevancia: fonte.position <= 2 ? 'alta' : 'media',
      verificado: false
    })
  }

  // Validar citacoes
  const { validas, alertas } = validarCitacoes(citacoesExtraidas)

  // Calcular nivel de confianca
  const nivelConfianca = calcularConfianca(validas, resposta, pergunta)

  // Gerar disclaimer se necessario
  let disclaimer: string | undefined
  if (nivelConfianca < 70) {
    disclaimer = '⚠️ Esta resposta pode conter informacoes que precisam de verificacao adicional em fontes primarias.'
  }

  // Adicionar secao de referencias ao final
  const respostaComRefs = resposta + gerarSecaoReferencias(validas)

  return {
    resposta: respostaComRefs,
    citacoes: validas,
    fontes_consultadas: fontesOnline.map(f => f.link),
    nivel_confianca: nivelConfianca,
    disclaimer
  }
}

/**
 * Extrai dominio de uma URL
 */
function extrairDominio(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * Calcula nivel de confianca baseado nas citacoes
 */
function calcularConfianca(
  citacoes: CitacaoMedica[],
  resposta: string,
  pergunta: string
): number {
  let pontos = 50 // Base

  // Bonus por citacoes de alta relevancia
  const citacoesAltas = citacoes.filter(c => c.relevancia === 'alta')
  pontos += citacoesAltas.length * 10

  // Bonus por citacoes verificadas
  const citacoesVerificadas = citacoes.filter(c => c.verificado)
  pontos += citacoesVerificadas.length * 5

  // Bonus por ter resposta substancial
  if (resposta.length > 500) pontos += 10

  // Penalidade se nao tem citacoes
  if (citacoes.length === 0) pontos -= 20

  // Penalidade para perguntas sobre tratamento sem guidelines
  const perguntaTratamento = pergunta.toLowerCase().includes('tratamento') ||
                             pergunta.toLowerCase().includes('conduta') ||
                             pergunta.toLowerCase().includes('terapia')
  const temGuideline = citacoes.some(c => c.tipo === 'guideline')

  if (perguntaTratamento && !temGuideline) {
    pontos -= 15
  }

  return Math.max(0, Math.min(100, pontos))
}

// ==========================================
// SCHEMA PARA STRUCTURED OUTPUT
// ==========================================

export const CITATION_SCHEMA = {
  type: 'object' as const,
  properties: {
    resposta: {
      type: 'string' as const,
      description: 'A resposta completa em portugues brasileiro'
    },
    citacoes: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          id: { type: 'number' as const },
          titulo: { type: 'string' as const },
          autores: {
            type: 'array' as const,
            items: { type: 'string' as const }
          },
          fonte: { type: 'string' as const },
          ano: { type: 'number' as const },
          url: { type: 'string' as const },
          tipo: {
            type: 'string' as const,
            enum: ['livro', 'artigo', 'guideline', 'site', 'revista']
          },
          texto_citado: { type: 'string' as const },
          relevancia: {
            type: 'string' as const,
            enum: ['alta', 'media', 'baixa']
          }
        },
        required: ['id', 'titulo', 'fonte', 'tipo', 'texto_citado', 'relevancia']
      }
    },
    nivel_confianca: {
      type: 'number' as const,
      description: 'Nivel de confianca de 0 a 100'
    }
  },
  required: ['resposta', 'citacoes', 'nivel_confianca']
}

// ==========================================
// EXPORTS
// ==========================================

export default enriquecerComCitacoes
