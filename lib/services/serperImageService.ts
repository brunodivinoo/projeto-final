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
  'sanarmed.com',
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
  'freepik.com'
]

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

    interface ImagemComConfiavel extends ImagemMedica {
      confiavel: boolean
    }

    const imagensFiltradas: ImagemMedica[] = data.images
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
      .slice(0, quantidade)
      // Remover campo auxiliar confiavel do resultado final
      .map(({ confiavel, ...rest }: ImagemComConfiavel) => rest)

    console.log(`[Serper] Retornando ${imagensFiltradas.length} imagens filtradas`)

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
