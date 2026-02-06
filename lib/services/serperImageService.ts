// Serviço de busca de imagens médicas via Serper.dev
// Busca imagens do Google de fontes brasileiras confiáveis

interface ImagemMedica {
  url: string
  titulo: string
  fonte: string
  dominio: string
  linkOriginal: string
  referencia: string // Formato ABNT
}

interface ResultadoBuscaImagens {
  success: boolean
  imagens: ImagemMedica[]
  query: string
  error?: string
}

// Domínios confiáveis para imagens médicas brasileiras
const DOMINIOS_CONFIAVEIS = [
  'brasilescola.uol.com.br',
  'mundoeducacao.uol.com.br',
  'todamateria.com.br',
  'infoescola.com',
  'biologianet.com',
  'anatomiaemfoco.com.br',
  'kenhub.com',
  'msdmanuals.com',
  'scielo.br',
  'gov.br',
  'fiocruz.br',
  'usp.br',
  'unicamp.br',
  'ufrj.br',
  'ufmg.br',
  'wikipedia.org',
  'medicinanet.com.br',
  'minhavida.com.br',
  'drauziovarella.uol.com.br'
]

// Domínios a EVITAR (não confiáveis)
const DOMINIOS_BLOQUEADOS = [
  'pinterest.com',
  'pinterest.com.br',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'tiktok.com',
  'aliexpress.com',
  'mercadolivre.com.br',
  'shopee.com',
  'amazon.com',
  'shutterstock.com',
  'gettyimages.com',
  'istockphoto.com',
  'dreamstime.com',
  'freepik.com',
  // Sanarmed - BANIDO expressamente
  'sanarmed.com',
  'sanar.com.br',
  'sanarflix.com.br'
]

/**
 * Verifica se uma URL de imagem é válida (existe e responde)
 * Meta AI faz isso para não mostrar imagens quebradas
 */
async function verificarUrlImagem(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })

    clearTimeout(timeout)

    // Verificar se é uma imagem válida
    const contentType = response.headers.get('content-type') || ''
    const isImage = contentType.startsWith('image/') ||
                    url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) !== null

    return response.ok && isImage
  } catch {
    // Se falhar, assumir que a imagem pode funcionar (fallback)
    return true
  }
}

// Interface interna com campo confiavel
interface ImagemComConfiavel extends ImagemMedica {
  confiavel: boolean
}

/**
 * Verifica múltiplas URLs em paralelo
 */
async function verificarUrlsEmParalelo(
  imagens: ImagemComConfiavel[],
  limite: number = 10
): Promise<ImagemComConfiavel[]> {
  // Verificar apenas as primeiras 'limite' imagens para não demorar
  const imagensParaVerificar = imagens.slice(0, limite)

  const verificacoes = await Promise.all(
    imagensParaVerificar.map(async (img) => ({
      imagem: img,
      valida: await verificarUrlImagem(img.url)
    }))
  )

  // Filtrar apenas imagens válidas
  const imagensValidas = verificacoes
    .filter(v => v.valida)
    .map(v => v.imagem)

  console.log(`[Serper] Verificação de URLs: ${imagensValidas.length}/${imagensParaVerificar.length} válidas`)

  return imagensValidas
}

export async function buscarImagensMedicas(
  termo: string,
  quantidade: number = 5
): Promise<ResultadoBuscaImagens> {
  const SERPER_API_KEY = process.env.SERPER_API_KEY

  if (!SERPER_API_KEY) {
    console.error('[Serper] API Key não configurada')
    return { success: false, imagens: [], query: termo, error: 'API Key não configurada' }
  }

  try {
    console.log(`[Serper] Buscando imagens para: "${termo}"`)

    const response = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: `${termo} anatomia medicina`,
        gl: 'br',
        hl: 'pt-br',
        num: quantidade * 3 // Busca mais para filtrar depois
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Serper] Erro na API:', response.status, errorText)
      throw new Error(`Serper API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.images || data.images.length === 0) {
      console.log('[Serper] Nenhuma imagem encontrada')
      return { success: true, imagens: [], query: termo }
    }

    console.log(`[Serper] Recebidas ${data.images.length} imagens brutas`)

    // Filtrar e formatar imagens
    interface SerperImage {
      imageUrl?: string
      title?: string
      source?: string
      domain?: string
      link?: string
    }

    const imagensProcessadas: ImagemComConfiavel[] = data.images
      .filter((img: SerperImage) => {
        // Verificar se tem URL válida
        if (!img.imageUrl) return false

        // Remover domínios bloqueados
        const dominio = img.domain?.toLowerCase() || ''
        const bloqueado = DOMINIOS_BLOQUEADOS.some(d => dominio.includes(d))
        if (bloqueado) {
          console.log(`[Serper] Domínio bloqueado: ${dominio}`)
        }
        return !bloqueado
      })
      .map((img: SerperImage): ImagemComConfiavel => {
        const dominio = img.domain?.toLowerCase() || ''
        const ehConfiavel = DOMINIOS_CONFIAVEIS.some(d =>
          dominio.includes(d)
        )

        // Gerar referência formato ABNT
        const dataAtual = new Date().toLocaleDateString('pt-BR')
        const fonte = img.source || img.domain || 'Fonte não identificada'
        const titulo = img.title || 'Imagem médica'
        const referencia = `${fonte}. ${titulo}. Disponível em: ${img.link || img.imageUrl}. Acesso em: ${dataAtual}.`

        return {
          url: img.imageUrl || '',
          titulo: titulo,
          fonte: fonte,
          dominio: dominio,
          linkOriginal: img.link || '',
          referencia,
          confiavel: ehConfiavel
        }
      })
      // Priorizar fontes confiáveis
      .sort((a: ImagemComConfiavel, b: ImagemComConfiavel) => (b.confiavel ? 1 : 0) - (a.confiavel ? 1 : 0))

    // Verificar URLs em paralelo (Meta AI faz isso para não mostrar imagens quebradas)
    const imagensVerificadas = await verificarUrlsEmParalelo(imagensProcessadas, quantidade * 2)

    // Remover campo auxiliar confiavel e limitar quantidade
    const imagensFiltradas: ImagemMedica[] = imagensVerificadas
      .slice(0, quantidade)
      .map(({ confiavel, ...rest }) => rest)

    console.log(`[Serper] Retornando ${imagensFiltradas.length} imagens filtradas e verificadas`)

    return {
      success: true,
      imagens: imagensFiltradas,
      query: termo
    }
  } catch (error) {
    console.error('[Serper] Erro na busca:', error)
    return {
      success: false,
      imagens: [],
      query: termo,
      error: String(error)
    }
  }
}

// Função para formatar imagens para exibição no chat
export function formatarImagensParaChat(imagens: ImagemMedica[]): string {
  if (imagens.length === 0) return ''

  let texto = '\n\n📷 **Imagens de Referência:**\n\n'

  imagens.forEach((img, index) => {
    texto += `**${index + 1}. ${img.titulo}**\n`
    texto += `![${img.titulo}](${img.url})\n`
    texto += `📌 Fonte: [${img.fonte}](${img.linkOriginal})\n\n`
  })

  texto += '\n---\n**Referências das Imagens (ABNT):**\n'
  imagens.forEach((img, index) => {
    texto += `${index + 1}. ${img.referencia}\n`
  })

  return texto
}

// =========================================
// SISTEMA DE FALLBACK E RANKING (Meta AI)
// =========================================

// Interface estendida para resultado com fallback
interface ResultadoBuscaImagensComFallback extends ResultadoBuscaImagens {
  fallbackDescricao?: string
  usouFallback?: boolean
}

// Domínios top para ranking (maior prioridade)
const DOMINIOS_TOP = [
  'brasilescola', 'infoescola', 'usp', 'unicamp', 'ufrj',
  'ufmg', 'fiocruz', 'scielo', 'kenhub', 'msdmanuals'
]

/**
 * Sistema de Fallback para imagens (como Meta AI)
 * Ordem: Serper.dev → Descrição textual
 */
export async function buscarImagensComFallback(
  termo: string,
  quantidade: number = 3
): Promise<ResultadoBuscaImagensComFallback> {
  // 1. Tentar API primária (Serper.dev)
  console.log('[Fallback] Tentando Serper.dev...')
  const resultado = await buscarImagensMedicas(termo, quantidade)

  if (resultado.success && resultado.imagens.length > 0) {
    console.log(`[Fallback] Serper.dev retornou ${resultado.imagens.length} imagens`)

    // Aplicar ranking antes de retornar
    const imagensRankeadas = rankearImagens(resultado.imagens, termo)

    return {
      ...resultado,
      imagens: imagensRankeadas,
      usouFallback: false
    }
  }

  // 2. Se falhou, retornar com descrição textual como fallback
  console.log('[Fallback] Serper.dev falhou, gerando descrição textual...')

  return {
    success: true,
    imagens: [],
    query: termo,
    fallbackDescricao: gerarDescricaoTextualFallback(termo),
    usouFallback: true
  }
}

/**
 * Gera descrição textual quando não encontra imagens (como Meta AI faz)
 */
function gerarDescricaoTextualFallback(termo: string): string {
  return `
📝 **Descrição Visual: ${termo}**

Não foi possível carregar imagens neste momento, mas aqui está uma orientação visual:

Para visualizar "${termo}", imagine as principais estruturas anatômicas envolvidas, suas relações espaciais e características morfológicas típicas encontradas em atlas de anatomia como Netter ou Sobotta.

💡 **Sugestões para consulta:**
- Pesquise no Google Imagens: "${termo} anatomia atlas"
- Consulte o Atlas de Anatomia Humana (Netter)
- Acesse recursos da USP, Unicamp ou Fiocruz

📚 *Observação: Para fins de estudo, recomenda-se sempre consultar fontes acadêmicas confiáveis.*
`.trim()
}

/**
 * Sistema de Ranking de Resultados (como Meta AI)
 * Critérios: Relevância + Qualidade da fonte + Título
 */
function rankearImagens(imagens: ImagemMedica[], termo: string): ImagemMedica[] {
  const termoLower = termo.toLowerCase()
  const termosPesquisa = termoLower.split(/\s+/).filter(t => t.length > 3)

  interface ImagemComScore extends ImagemMedica {
    _score: number
  }

  const imagensComScore: ImagemComScore[] = imagens.map(img => {
    let score = 0
    const tituloLower = img.titulo.toLowerCase()

    // 1. Relevância: título contém termos da pesquisa (até 40 pontos)
    const termosNoTitulo = termosPesquisa.filter(t => tituloLower.includes(t))
    score += Math.min(termosNoTitulo.length * 15, 40)

    // 2. Match exato do termo (20 pontos)
    if (tituloLower.includes(termoLower)) {
      score += 20
    }

    // 3. Qualidade da fonte - domínios TOP (40 pontos)
    const dominioLower = img.dominio.toLowerCase()
    if (DOMINIOS_TOP.some(d => dominioLower.includes(d))) {
      score += 40
    } else if (DOMINIOS_CONFIAVEIS.some(d => dominioLower.includes(d))) {
      score += 20
    }

    // 4. Penalizar títulos genéricos (-10 pontos)
    const titulosGenericos = ['imagem', 'image', 'foto', 'picture', 'sem título', 'untitled']
    if (titulosGenericos.some(t => tituloLower === t)) {
      score -= 10
    }

    // 5. Bonus para termos médicos específicos no título (10 pontos)
    const termosMedicos = ['anatomia', 'sistema', 'órgão', 'estrutura', 'atlas', 'diagrama']
    if (termosMedicos.some(t => tituloLower.includes(t))) {
      score += 10
    }

    return { ...img, _score: score }
  })

  // Ordenar por score (maior primeiro)
  imagensComScore.sort((a, b) => b._score - a._score)

  // Remover campo _score e retornar
  return imagensComScore.map(({ _score, ...img }) => img)
}

/**
 * Verifica se a busca de imagens é recomendada para o tema
 */
export function deveRecomendarImagens(mensagem: string): boolean {
  const msgLower = mensagem.toLowerCase()

  // Temas que se beneficiam de imagens
  const temasVisuais = [
    'anatom', 'órgão', 'orgao', 'sistema', 'estrutura',
    'músculo', 'musculo', 'osso', 'célula', 'celula',
    'tecido', 'histolog', 'microscop', 'corte', 'lâmina',
    'radiolog', 'tomograf', 'ressonância', 'raio-x',
    'ultrassom', 'eletrocardiograma', 'ecg', 'eeg',
    'coração', 'coracao', 'pulmão', 'pulmao',
    'cérebro', 'cerebro', 'fígado', 'figado', 'rim',
    'veia', 'artéria', 'arteria', 'nervo', 'medula',
    'coluna', 'crânio', 'cranio', 'esqueleto',
  ]

  // Verificar se menciona termos visuais
  const mencionaTemaVisual = temasVisuais.some(t => msgLower.includes(t))

  // Verificar se pediu explicitamente imagens
  const pediuImagens = /imagem|figura|ilustr|mostre|visualiz|foto|diagram/i.test(msgLower)

  return mencionaTemaVisual || pediuImagens
}
