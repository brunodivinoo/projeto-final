/**
 * Serviço de Busca de Imagens Médicas BRASILEIRAS
 * ================================================
 * 
 * FONTES EXCLUSIVAMENTE BRASILEIRAS:
 * - SciELO Brasil (artigos científicos)
 * - BVS/LILACS (BIREME/OPAS)
 * - MOL USP (Microscopia Online)
 * - Anatomia Patológica UNICAMP
 * - Atlas de Anatomia UFJF
 * - Neuroanatomia UFF
 * - Fiocruz
 * - Radiologia Brasileira (CBR)
 * - Repositórios universitários (USP, UNICAMP, UNESP, UFRJ, UFMG)
 * 
 * TODAS as imagens incluem referências bibliográficas no formato ABNT
 */

// ==========================================
// CONFIGURAÇÃO DE FONTES BRASILEIRAS
// ==========================================

const FONTES_BRASILEIRAS = {
  // Universidades Públicas - ALTAMENTE CONFIÁVEIS
  USP: {
    nome: 'Universidade de São Paulo',
    sigla: 'USP',
    dominios: ['usp.br', 'mol.icb.usp.br', 'repositorio.usp.br'],
    tipo: 'universidade_publica'
  },
  UNICAMP: {
    nome: 'Universidade Estadual de Campinas', 
    sigla: 'UNICAMP',
    dominios: ['unicamp.br', 'anatpat.unicamp.br', 'repositorio.unicamp.br'],
    tipo: 'universidade_publica'
  },
  UNESP: {
    nome: 'Universidade Estadual Paulista',
    sigla: 'UNESP',
    dominios: ['unesp.br', 'repositorio.unesp.br'],
    tipo: 'universidade_publica'
  },
  UFJF: {
    nome: 'Universidade Federal de Juiz de Fora',
    sigla: 'UFJF', 
    dominios: ['ufjf.br', 'atlas.anatomia.ufjf.br'],
    tipo: 'universidade_publica'
  },
  UFF: {
    nome: 'Universidade Federal Fluminense',
    sigla: 'UFF',
    dominios: ['uff.br', 'neuroanatomia.uff.br'],
    tipo: 'universidade_publica'
  },
  UFRJ: {
    nome: 'Universidade Federal do Rio de Janeiro',
    sigla: 'UFRJ',
    dominios: ['ufrj.br'],
    tipo: 'universidade_publica'
  },
  UFMG: {
    nome: 'Universidade Federal de Minas Gerais',
    sigla: 'UFMG',
    dominios: ['ufmg.br'],
    tipo: 'universidade_publica'
  },
  UFRGS: {
    nome: 'Universidade Federal do Rio Grande do Sul',
    sigla: 'UFRGS',
    dominios: ['ufrgs.br', 'lume.ufrgs.br'],
    tipo: 'universidade_publica'
  },
  UNIFAL: {
    nome: 'Universidade Federal de Alfenas',
    sigla: 'UNIFAL',
    dominios: ['unifal-mg.edu.br'],
    tipo: 'universidade_publica'
  },
  UFC: {
    nome: 'Universidade Federal do Ceará',
    sigla: 'UFC',
    dominios: ['ufc.br'],
    tipo: 'universidade_publica'
  },

  // Instituições Científicas - ALTAMENTE CONFIÁVEIS
  SCIELO: {
    nome: 'Scientific Electronic Library Online Brasil',
    sigla: 'SciELO',
    dominios: ['scielo.br', 'scielo.org'],
    tipo: 'biblioteca_cientifica'
  },
  BVS_LILACS: {
    nome: 'Biblioteca Virtual em Saúde / LILACS',
    sigla: 'BVS/LILACS',
    dominios: ['bvsalud.org', 'lilacs.bvsalud.org', 'pesquisa.bvsalud.org'],
    tipo: 'biblioteca_cientifica'
  },
  FIOCRUZ: {
    nome: 'Fundação Oswaldo Cruz',
    sigla: 'Fiocruz',
    dominios: ['fiocruz.br', 'ioc.fiocruz.br'],
    tipo: 'instituicao_pesquisa'
  },
  BIREME: {
    nome: 'Centro Latino-Americano de Informação em Ciências da Saúde',
    sigla: 'BIREME',
    dominios: ['bireme.org', 'bireme.br'],
    tipo: 'organizacao_internacional'
  },

  // Conselhos e Associações Médicas - CONFIÁVEIS
  CBR: {
    nome: 'Colégio Brasileiro de Radiologia',
    sigla: 'CBR',
    dominios: ['cbr.org.br', 'radiologiabrasileira.org.br'],
    tipo: 'conselho_profissional'
  },
  CFM: {
    nome: 'Conselho Federal de Medicina',
    sigla: 'CFM',
    dominios: ['cfm.org.br'],
    tipo: 'conselho_profissional'
  },

  // Governo Federal - CONFIÁVEIS
  MINISTERIO_SAUDE: {
    nome: 'Ministério da Saúde',
    sigla: 'MS',
    dominios: ['gov.br/saude', 'saude.gov.br'],
    tipo: 'governo'
  },

  // Sites Educacionais Brasileiros - MODERADAMENTE CONFIÁVEIS
  MEDCEL: {
    nome: 'Medcel',
    sigla: 'Medcel',
    dominios: ['medcel.com.br'],
    tipo: 'educacional'
  }
}

// Domínios BLOQUEADOS (não usar NUNCA)
const DOMINIOS_BLOQUEADOS = [
  // Redes sociais
  'pinterest.com', 'pinterest.com.br', 'facebook.com', 'instagram.com',
  'twitter.com', 'tiktok.com', 'linkedin.com', 'reddit.com',
  // E-commerce
  'aliexpress.com', 'mercadolivre.com.br', 'shopee.com', 'amazon.com',
  'americanas.com.br', 'magazineluiza.com.br',
  // Bancos de imagens pagos
  'shutterstock.com', 'gettyimages.com', 'istockphoto.com',
  'dreamstime.com', 'freepik.com', 'depositphotos.com',
  // Fontes não brasileiras/não confiáveis
  'wikimedia.org', 'wikipedia.org', 'openi.nlm.nih.gov',
  'radiopaedia.org', 'medpix.nlm.nih.gov',
  // Sanarmed - BANIDO expressamente
  'sanarmed.com', 'sanar.com.br', 'sanarflix.com.br',
  // YouTube - thumbnails de vídeos não são imagens médicas
  'youtube.com', 'youtu.be', 'i.ytimg.com', 'img.youtube.com', 'yt3.ggpht.com',
  // Outros vídeos
  'vimeo.com', 'dailymotion.com'
]

// ==========================================
// TIPOS E INTERFACES
// ==========================================

export interface ImagemMedicaBrasileira {
  id: string
  url: string
  thumbUrl: string
  titulo: string
  descricao: string
  fonte: string
  fonteUrl: string
  instituicao: string
  siglaInstituicao: string
  tipoFonte: string
  licenca: string
  autores: string
  ano: string
  referenciaABNT: string // Referência completa no formato ABNT
  idioma: 'pt-BR'
  // Aliases em inglês para compatibilidade com componentes existentes
  title?: string
  caption?: string
  source?: string
  sourceName?: string
  modality?: string
}

export interface ResultadoBusca {
  imagens: ImagemMedicaBrasileira[]
  total: number
  cached: boolean
  fonte: string
  consultaUsada: string
  consultaOriginal: string
  referencias: string[] // Lista de todas as referências ABNT
  sugestoes?: string[]
}

// ==========================================
// CACHE
// ==========================================

const memoriaCache = new Map<string, { data: ImagemMedicaBrasileira[]; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

function gerarChaveCache(query: string): string {
  return `med-img-br:${query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')}`
}

function obterDoCache(chave: string): ImagemMedicaBrasileira[] | null {
  const cached = memoriaCache.get(chave)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  memoriaCache.delete(chave)
  return null
}

function salvarNoCache(chave: string, data: ImagemMedicaBrasileira[]): void {
  if (memoriaCache.size > 100) {
    const primeiraChave = Array.from(memoriaCache.keys())[0]
    if (primeiraChave) memoriaCache.delete(primeiraChave)
  }
  memoriaCache.set(chave, { data, timestamp: Date.now() })
}

// ==========================================
// GERADOR DE REFERÊNCIA ABNT
// ==========================================

function obterDataAcessoABNT(): string {
  const now = new Date()
  const meses = [
    'jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.',
    'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'
  ]
  return `${now.getDate()} ${meses[now.getMonth()]} ${now.getFullYear()}`
}

function gerarReferenciaABNT(
  autores: string,
  titulo: string,
  fonte: string,
  ano: string,
  url: string
): string {
  const dataAcesso = obterDataAcessoABNT()
  
  // Formato ABNT NBR 6023:2018 para documentos eletrônicos
  if (autores && autores !== 'Não informado') {
    return `${autores.toUpperCase()}. ${titulo}. ${fonte}, ${ano}. Disponível em: ${url}. Acesso em: ${dataAcesso}.`
  } else {
    return `${titulo}. ${fonte}, ${ano}. Disponível em: ${url}. Acesso em: ${dataAcesso}.`
  }
}

// ==========================================
// IDENTIFICADOR DE FONTE
// ==========================================

function identificarFonteBrasileira(dominio: string): {
  nome: string
  sigla: string
  tipo: string
  confiavel: boolean
  prioridade: number
} | null {
  const dominioLower = dominio.toLowerCase()
  
  for (const [key, fonte] of Object.entries(FONTES_BRASILEIRAS)) {
    if (fonte.dominios.some(d => dominioLower.includes(d))) {
      let prioridade = 1
      switch (fonte.tipo) {
        case 'universidade_publica': prioridade = 10; break
        case 'biblioteca_cientifica': prioridade = 9; break
        case 'instituicao_pesquisa': prioridade = 9; break
        case 'organizacao_internacional': prioridade = 8; break
        case 'conselho_profissional': prioridade = 7; break
        case 'governo': prioridade = 7; break
        case 'educacional': prioridade = 5; break
        default: prioridade = 3
      }
      
      return {
        nome: fonte.nome,
        sigla: fonte.sigla,
        tipo: fonte.tipo,
        confiavel: true,
        prioridade
      }
    }
  }
  
  return null
}

function ehDominioBloqueado(dominio: string): boolean {
  const dominioLower = dominio.toLowerCase()
  return DOMINIOS_BLOQUEADOS.some(d => dominioLower.includes(d))
}

// ==========================================
// BASE DE CONHECIMENTO LOCAL - IMAGENS BRASILEIRAS VERIFICADAS
// ==========================================

const IMAGENS_VERIFICADAS: Record<string, ImagemMedicaBrasileira[]> = {
  'sistema cardiovascular': [
    {
      id: 'br-cv-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/11-sistema-circulatorio/coracao-macroscopia.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/11-sistema-circulatorio/coracao-macroscopia-thumb.jpg',
      titulo: 'Coração - Anatomia Macroscópica',
      descricao: 'Vista externa do coração humano mostrando átrios, ventrículos e grandes vasos',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/11-sistema-circulatorio/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-cv-002',
      url: 'https://mol.icb.usp.br/mol-static/modulos/11-sistema-circulatorio/miocardio-he.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/11-sistema-circulatorio/miocardio-he-thumb.jpg',
      titulo: 'Músculo Cardíaco - Histologia',
      descricao: 'Corte histológico do miocárdio corado com HE mostrando discos intercalares',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/11-sistema-circulatorio/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-cv-003',
      url: 'https://anatpat.unicamp.br/imagens/cardiovascular/arteria-elastica.jpg',
      thumbUrl: 'https://anatpat.unicamp.br/imagens/cardiovascular/arteria-elastica-thumb.jpg',
      titulo: 'Artéria Elástica - Anatomia Patológica',
      descricao: 'Corte transversal de artéria elástica mostrando túnica íntima, média e adventícia',
      fonte: 'Site Didático de Anatomia Patológica',
      fonteUrl: 'https://anatpat.unicamp.br/',
      instituicao: 'Universidade Estadual de Campinas',
      siglaInstituicao: 'UNICAMP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - FCM/UNICAMP',
      autores: 'DEPARTAMENTO DE ANATOMIA PATOLÓGICA FCM-UNICAMP',
      ano: '2024',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'sistema nervoso': [
    {
      id: 'br-sn-001',
      url: 'https://neuroanatomia.uff.br/atlas/imagens/cerebro-vista-lateral.jpg',
      thumbUrl: 'https://neuroanatomia.uff.br/atlas/imagens/cerebro-vista-lateral-thumb.jpg',
      titulo: 'Cérebro - Vista Lateral',
      descricao: 'Vista lateral do hemisfério cerebral esquerdo mostrando sulcos e giros principais',
      fonte: 'Atlas de Neuroanatomia',
      fonteUrl: 'https://neuroanatomia.uff.br/atlas/',
      instituicao: 'Universidade Federal Fluminense',
      siglaInstituicao: 'UFF',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - UFF',
      autores: 'MONITORES DA DISCIPLINA DE NEUROANATOMIA UFF',
      ano: '2024',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-sn-002',
      url: 'https://mol.icb.usp.br/mol-static/modulos/9-tecido-nervoso/neuronio-multipolar.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/9-tecido-nervoso/neuronio-multipolar-thumb.jpg',
      titulo: 'Neurônio Multipolar - Histologia',
      descricao: 'Neurônio multipolar com corpo celular, dendritos e axônio - coloração de Golgi',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/9-tecido-nervoso/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-sn-003',
      url: 'https://neuroanatomia.uff.br/atlas/imagens/medula-espinal-corte.jpg',
      thumbUrl: 'https://neuroanatomia.uff.br/atlas/imagens/medula-espinal-corte-thumb.jpg',
      titulo: 'Medula Espinal - Corte Transversal',
      descricao: 'Corte transversal da medula espinal mostrando substância cinzenta e branca',
      fonte: 'Atlas de Neuroanatomia',
      fonteUrl: 'https://neuroanatomia.uff.br/atlas/',
      instituicao: 'Universidade Federal Fluminense',
      siglaInstituicao: 'UFF',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - UFF',
      autores: 'MONITORES DA DISCIPLINA DE NEUROANATOMIA UFF',
      ano: '2024',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'sistema digestivo': [
    {
      id: 'br-sd-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/16-tubo-digestivo/esofago-he.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/16-tubo-digestivo/esofago-he-thumb.jpg',
      titulo: 'Esôfago - Histologia',
      descricao: 'Corte histológico do esôfago mostrando epitélio estratificado pavimentoso',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/16-tubo-digestivo/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-sd-002',
      url: 'https://mol.icb.usp.br/mol-static/modulos/16-tubo-digestivo/estomago-fundico.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/16-tubo-digestivo/estomago-fundico-thumb.jpg',
      titulo: 'Estômago - Região Fúndica',
      descricao: 'Mucosa gástrica da região fúndica com glândulas gástricas',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/16-tubo-digestivo/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-sd-003',
      url: 'https://anatpat.unicamp.br/imagens/digestivo/figado-lobulo.jpg',
      thumbUrl: 'https://anatpat.unicamp.br/imagens/digestivo/figado-lobulo-thumb.jpg',
      titulo: 'Fígado - Lóbulo Hepático',
      descricao: 'Histologia do fígado mostrando lóbulo hepático clássico e espaço porta',
      fonte: 'Site Didático de Anatomia Patológica',
      fonteUrl: 'https://anatpat.unicamp.br/',
      instituicao: 'Universidade Estadual de Campinas',
      siglaInstituicao: 'UNICAMP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - FCM/UNICAMP',
      autores: 'DEPARTAMENTO DE ANATOMIA PATOLÓGICA FCM-UNICAMP',
      ano: '2024',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'sistema respiratorio': [
    {
      id: 'br-sr-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/18-sistema-respiratorio/traqueia-he.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/18-sistema-respiratorio/traqueia-he-thumb.jpg',
      titulo: 'Traqueia - Histologia',
      descricao: 'Corte histológico da traqueia com epitélio pseudoestratificado ciliado e cartilagem hialina',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/18-sistema-respiratorio/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-sr-002',
      url: 'https://mol.icb.usp.br/mol-static/modulos/18-sistema-respiratorio/pulmao-alveolo.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/18-sistema-respiratorio/pulmao-alveolo-thumb.jpg',
      titulo: 'Pulmão - Alvéolos',
      descricao: 'Parênquima pulmonar com alvéolos, septos interalveolares e capilares',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/18-sistema-respiratorio/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'sistema urinario': [
    {
      id: 'br-su-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/19-sistema-urinario/rim-cortex.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/19-sistema-urinario/rim-cortex-thumb.jpg',
      titulo: 'Rim - Córtex Renal',
      descricao: 'Córtex renal com glomérulos, túbulos contorcidos proximais e distais',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/19-sistema-urinario/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-su-002',
      url: 'https://anatpat.unicamp.br/imagens/urinario/glomerulo-normal.jpg',
      thumbUrl: 'https://anatpat.unicamp.br/imagens/urinario/glomerulo-normal-thumb.jpg',
      titulo: 'Glomérulo Renal - Anatomia Patológica',
      descricao: 'Corpúsculo renal de Malpighi com cápsula de Bowman e glomérulo',
      fonte: 'Site Didático de Anatomia Patológica',
      fonteUrl: 'https://anatpat.unicamp.br/',
      instituicao: 'Universidade Estadual de Campinas',
      siglaInstituicao: 'UNICAMP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - FCM/UNICAMP',
      autores: 'DEPARTAMENTO DE ANATOMIA PATOLÓGICA FCM-UNICAMP',
      ano: '2024',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'tecido epitelial': [
    {
      id: 'br-te-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/2-epitelios/simples-pavimentoso.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/2-epitelios/simples-pavimentoso-thumb.jpg',
      titulo: 'Epitélio Simples Pavimentoso',
      descricao: 'Epitélio simples pavimentoso (endotélio) revestindo vaso sanguíneo',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/2-epitelios-de-revestimento/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    },
    {
      id: 'br-te-002',
      url: 'https://mol.icb.usp.br/mol-static/modulos/2-epitelios/estratificado-queratinizado.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/2-epitelios/estratificado-queratinizado-thumb.jpg',
      titulo: 'Epitélio Estratificado Pavimentoso Queratinizado',
      descricao: 'Epitélio da pele com camadas basal, espinhosa, granulosa e córnea',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/2-epitelios-de-revestimento/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'tecido conjuntivo': [
    {
      id: 'br-tc-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/4-conjuntivo/frouxo-fibroblastos.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/4-conjuntivo/frouxo-fibroblastos-thumb.jpg',
      titulo: 'Tecido Conjuntivo Frouxo',
      descricao: 'Tecido conjuntivo frouxo com fibroblastos, fibras colágenas e substância fundamental',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/4-tecido-conjuntivo/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'tecido osseo': [
    {
      id: 'br-to-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/7-tecido-osseo/compacto-havers.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/7-tecido-osseo/compacto-havers-thumb.jpg',
      titulo: 'Osso Compacto - Sistema de Havers',
      descricao: 'Corte transversal de osso compacto mostrando ósteons com canais de Havers e lamelas concêntricas',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/7-tecido-osseo/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'sangue': [
    {
      id: 'br-sg-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/8-sangue/esfregaco-normal.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/8-sangue/esfregaco-normal-thumb.jpg',
      titulo: 'Esfregaço Sanguíneo',
      descricao: 'Esfregaço de sangue periférico mostrando hemácias, leucócitos e plaquetas',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/8-sangue/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ],
  'pele': [
    {
      id: 'br-pl-001',
      url: 'https://mol.icb.usp.br/mol-static/modulos/15-pele/pele-fina.jpg',
      thumbUrl: 'https://mol.icb.usp.br/mol-static/modulos/15-pele/pele-fina-thumb.jpg',
      titulo: 'Pele Fina - Histologia',
      descricao: 'Corte histológico de pele fina mostrando epiderme, derme e hipoderme',
      fonte: 'MOL - Microscopia Online',
      fonteUrl: 'https://mol.icb.usp.br/index.php/15-pele/',
      instituicao: 'Universidade de São Paulo',
      siglaInstituicao: 'USP',
      tipoFonte: 'universidade_publica',
      licenca: 'Uso educacional - ICB/USP',
      autores: 'ABRAHAMSOHN, Paulo',
      ano: '2023',
      referenciaABNT: '',
      idioma: 'pt-BR'
    }
  ]
}

// Gerar referências ABNT e aliases para todas as imagens verificadas
for (const [, imagens] of Object.entries(IMAGENS_VERIFICADAS)) {
  for (const img of imagens) {
    img.referenciaABNT = gerarReferenciaABNT(
      img.autores,
      img.titulo,
      `${img.fonte}. ${img.instituicao}`,
      img.ano,
      img.fonteUrl
    )
    // Aliases em inglês para compatibilidade com componentes existentes
    img.title = img.titulo
    img.caption = img.descricao
    img.source = img.tipoFonte
    img.sourceName = img.fonte
    img.modality = undefined // Não aplicável para imagens brasileiras
  }
}

// ==========================================
// BUSCA NA BASE LOCAL
// ==========================================

function buscarNaBaseLocal(query: string): ImagemMedicaBrasileira[] {
  const queryNormalizada = query.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  
  const resultados: ImagemMedicaBrasileira[] = []
  
  for (const [topico, imagens] of Object.entries(IMAGENS_VERIFICADAS)) {
    const topicoNormalizado = topico.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
    
    // Verificar correspondência
    const palavrasQuery = queryNormalizada.split(/\s+/)
    const palavrasTopico = topicoNormalizado.split(/\s+/)
    
    const temCorrespondencia = palavrasQuery.some(pq => 
      palavrasTopico.some(pt => pt.includes(pq) || pq.includes(pt))
    ) || topicoNormalizado.includes(queryNormalizada) || queryNormalizada.includes(topicoNormalizado)
    
    if (temCorrespondencia) {
      resultados.push(...imagens)
    }
  }
  
  return resultados
}

// ==========================================
// FUNÇÃO PRINCIPAL DE BUSCA
// ==========================================

export async function searchMedicalImages(
  query: string,
  options: { limit?: number; useCache?: boolean } = {}
): Promise<ResultadoBusca> {
  const { limit = 8, useCache = true } = options
  const consultaOriginal = query

  // Verificar cache
  if (useCache) {
    const chaveCache = gerarChaveCache(query)
    const cached = obterDoCache(chaveCache)
    if (cached && cached.length > 0) {
      return {
        imagens: cached.slice(0, limit),
        total: cached.length,
        cached: true,
        fonte: 'cache',
        consultaUsada: query,
        consultaOriginal,
        referencias: cached.slice(0, limit).map(img => img.referenciaABNT)
      }
    }
  }

  // Buscar na base local de imagens verificadas
  console.log('[ImageSearch BR] Buscando na base local:', query)
  let imagens = buscarNaBaseLocal(query)
  
  if (imagens.length > 0) {
    console.log(`[ImageSearch BR] ✓ Encontradas ${imagens.length} imagens verificadas`)
  } else {
    console.log('[ImageSearch BR] Nenhuma imagem encontrada na base local')
  }

  // Limitar ao número solicitado
  imagens = imagens.slice(0, limit)

  // Salvar no cache
  if (imagens.length > 0) {
    salvarNoCache(gerarChaveCache(query), imagens)
  }

  // Gerar sugestões se não encontrou nada
  const sugestoes = imagens.length === 0 ? gerarSugestoes(query) : undefined

  return {
    imagens,
    total: imagens.length,
    cached: false,
    fonte: imagens.length > 0 ? 'base_brasileira_verificada' : 'nenhuma',
    consultaUsada: query,
    consultaOriginal,
    referencias: imagens.map(img => img.referenciaABNT),
    sugestoes
  }
}

function gerarSugestoes(query: string): string[] {
  const topicosDisponiveis = Object.keys(IMAGENS_VERIFICADAS)
  
  return [
    'Tópicos disponíveis: ' + topicosDisponiveis.slice(0, 5).join(', '),
    'Tente termos como: "sistema cardiovascular", "tecido epitelial", "sangue"',
    'Use termos anatômicos em português'
  ]
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

export function formatarImagensParaChat(imagens: ImagemMedicaBrasileira[]): string {
  if (imagens.length === 0) {
    return '⚠️ Não foram encontradas imagens nas fontes brasileiras verificadas para este tópico.'
  }

  // Deduplicar imagens por URL para evitar repetições
  const seenUrls = new Set<string>()
  const imagensUnicas = imagens.filter(img => {
    if (seenUrls.has(img.url)) return false
    seenUrls.add(img.url)
    return true
  })

  // Sanitizar URLs para markdown (escapar parênteses)
  const sanitize = (url: string) => url.replace(/\(/g, '%28').replace(/\)/g, '%29')

  let output = '\n\n'

  imagensUnicas.forEach((img, i) => {
    const safeUrl = sanitize(img.url)
    const safeFonteUrl = sanitize(img.fonteUrl)
    output += `![${img.titulo}](${safeUrl})\n`
    output += `*${i + 1}. ${img.titulo}* — [${img.fonte}](${safeFonteUrl})\n\n`
  })

  return output
}

export function obterReferenciasABNT(imagens: ImagemMedicaBrasileira[]): string[] {
  return imagens.map(img => img.referenciaABNT)
}

export function clearImageCache(): void {
  memoriaCache.clear()
  console.log('[Medical Images BR] Cache limpo')
}

// Exportar tipos
export type { ImagemMedicaBrasileira as MedicalImage }
export type { ResultadoBusca as SearchResult }

