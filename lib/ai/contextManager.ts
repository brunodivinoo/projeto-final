/**
 * Gerenciador de Contexto - Inspirado na Meta AI
 *
 * Meta AI usa:
 * - Resumo de mensagens anteriores
 * - Extração de palavras-chave
 * - Armazenamento de contexto comprimido
 * - Limite de ~20 mensagens
 */

export interface ContextoComprimido {
  resumo: string
  palavrasChave: string[]
  topicosPrincipais: string[]
  ultimaPergunta: string
  ultimaResposta: string
  quantidadeMensagens: number
}

export interface MensagemHistorico {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

const MAX_MENSAGENS_CONTEXTO = 20 // Limite da Meta AI

// Stopwords em português para filtrar
const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
  'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob', 'sobre',
  'que', 'qual', 'quais', 'como', 'quando', 'onde', 'porque', 'porquê', 'pra',
  'e', 'ou', 'mas', 'se', 'não', 'nao', 'sim', 'também', 'tambem', 'já', 'ainda',
  'só', 'so', 'mais', 'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca',
  'bem', 'mal', 'aqui', 'ali', 'lá', 'la', 'isso', 'isto', 'esse', 'este',
  'essa', 'esta', 'ele', 'ela', 'eles', 'elas', 'eu', 'você', 'voce', 'nós', 'nos',
  'me', 'te', 'se', 'lhe', 'lhes', 'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa',
  'ser', 'estar', 'ter', 'haver', 'fazer', 'poder', 'querer', 'dever', 'ir',
  'foi', 'era', 'seria', 'pode', 'quer', 'vai', 'vou', 'tem', 'tinha', 'tive',
  'são', 'sao', 'eram', 'será', 'sera', 'sido', 'sendo', 'seja', 'fosse',
  'tenho', 'temos', 'tinha', 'tínhamos', 'teria', 'teriam', 'teve', 'tiveram',
  'estou', 'está', 'esta', 'estamos', 'estava', 'estavam', 'estive', 'estiveram',
  'vou', 'vai', 'vamos', 'vão', 'vao', 'fui', 'foi', 'fomos', 'foram',
  'faço', 'faz', 'fazemos', 'fazem', 'fazia', 'faziam', 'fiz', 'fez', 'fizeram',
  'digo', 'diz', 'dizemos', 'dizem', 'dizia', 'diziam', 'disse', 'disseram',
  'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas', 'num', 'numa',
  'pro', 'pra', 'pros', 'pras', 'desse', 'dessa', 'desses', 'dessas',
  'nesse', 'nessa', 'nesses', 'nessas', 'daquele', 'daquela', 'daqueles', 'daquelas',
  'mesmo', 'mesma', 'mesmos', 'mesmas', 'próprio', 'propria', 'próprios', 'proprias',
  'todo', 'toda', 'todos', 'todas', 'outro', 'outra', 'outros', 'outras',
  'algum', 'alguma', 'alguns', 'algumas', 'nenhum', 'nenhuma', 'nenhuns', 'nenhumas',
  'cada', 'qualquer', 'quaisquer', 'quanto', 'quanta', 'quantos', 'quantas',
  'tanto', 'tanta', 'tantos', 'tantas', 'tal', 'tais', 'certo', 'certa', 'certos', 'certas',
  'então', 'entao', 'assim', 'depois', 'antes', 'agora', 'sempre', 'nunca', 'talvez',
  'até', 'ate', 'desde', 'entre', 'contra', 'durante', 'mediante', 'segundo',
  'conforme', 'consoante', 'exceto', 'salvo', 'senão', 'senao', 'caso', 'embora',
  'porém', 'porem', 'contudo', 'todavia', 'entretanto', 'portanto', 'logo', 'pois',
  'porque', 'pois', 'visto', 'como', 'conquanto', 'apenas', 'somente',
  'min', 'mim', 'ti', 'si', 'consigo', 'conosco', 'convosco',
  'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'seus', 'suas', 'nossos', 'nossas',
  'vosso', 'vossa', 'vossos', 'vossas', 'dele', 'dela', 'deles', 'delas',
  'quero', 'preciso', 'gostaria', 'poderia', 'seria', 'deveria',
  'favor', 'obrigado', 'obrigada', 'olá', 'ola', 'oi', 'tchau', 'adeus',
])

// Tópicos médicos conhecidos para detecção
const TOPICOS_MEDICOS = [
  'sistema cardiovascular', 'sistema respiratório', 'sistema nervoso',
  'sistema digestivo', 'sistema digestório', 'sistema urinário',
  'sistema reprodutor', 'sistema muscular', 'sistema esquelético',
  'sistema endócrino', 'sistema linfático', 'sistema imunológico',
  'sistema tegumentar', 'sistema sensorial',
  'anatomia', 'fisiologia', 'patologia', 'farmacologia',
  'bioquímica', 'histologia', 'embriologia', 'genética',
  'microbiologia', 'imunologia', 'parasitologia',
  'cardiologia', 'neurologia', 'pneumologia', 'gastroenterologia',
  'nefrologia', 'endocrinologia', 'hematologia', 'oncologia',
  'pediatria', 'ginecologia', 'obstetrícia', 'geriatria',
  'dermatologia', 'oftalmologia', 'otorrinolaringologia',
  'ortopedia', 'traumatologia', 'reumatologia',
  'psiquiatria', 'cirurgia', 'anestesiologia', 'radiologia',
  'coração', 'pulmão', 'fígado', 'rim', 'rins', 'cérebro',
  'estômago', 'intestino', 'pâncreas', 'baço', 'vesícula',
  'sangue', 'osso', 'ossos', 'músculo', 'músculos',
  'nervo', 'nervos', 'hormônio', 'hormônios',
  'célula', 'células', 'tecido', 'tecidos', 'órgão', 'órgãos',
  'artéria', 'veia', 'capilar', 'linfa', 'plasma',
  'hemácia', 'leucócito', 'plaqueta', 'hemoglobina',
  'proteína', 'enzima', 'vitamina', 'mineral',
  'diagnóstico', 'tratamento', 'prognóstico', 'etiologia',
  'sintoma', 'sinal', 'síndrome', 'doença', 'patologia',
  'infecção', 'inflamação', 'tumor', 'câncer', 'metástase',
  'medicamento', 'droga', 'fármaco', 'dose', 'posologia',
  'exame', 'teste', 'procedimento', 'cirurgia', 'biópsia',
]

/**
 * Extrai palavras-chave de um texto (como Meta AI faz)
 */
function extrairPalavrasChave(texto: string): string[] {
  const palavras = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos para comparação
    .replace(/[^\w\sáéíóúâêîôûãõç]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 3 && !STOPWORDS.has(p))

  // Contar frequência
  const frequencia: Record<string, number> = {}
  palavras.forEach(p => {
    frequencia[p] = (frequencia[p] || 0) + 1
  })

  // Retornar top 15 palavras mais frequentes
  return Object.entries(frequencia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([palavra]) => palavra)
}

/**
 * Detecta tópicos médicos no texto
 */
function detectarTopicosMedicos(texto: string): string[] {
  const textoLower = texto.toLowerCase()
  const topicosEncontrados: string[] = []

  for (const topico of TOPICOS_MEDICOS) {
    if (textoLower.includes(topico.toLowerCase())) {
      topicosEncontrados.push(topico)
    }
  }

  // Limitar a 10 tópicos mais relevantes
  return [...new Set(topicosEncontrados)].slice(0, 10)
}

/**
 * Gera resumo das últimas mensagens
 */
function gerarResumoMensagens(mensagens: MensagemHistorico[]): string {
  if (mensagens.length === 0) return 'Conversa nova.'

  const ultimasMensagens = mensagens.slice(-6) // Últimas 6 mensagens
  const resumos: string[] = []

  for (const msg of ultimasMensagens) {
    const prefix = msg.role === 'user' ? 'Usuário perguntou' : 'IA respondeu'
    const conteudoResumo = msg.content.slice(0, 150).replace(/\n/g, ' ')
    resumos.push(`${prefix}: "${conteudoResumo}..."`)
  }

  return resumos.join('\n')
}

/**
 * Comprime o histórico de mensagens (como Meta AI faz)
 */
export function comprimirContexto(mensagens: MensagemHistorico[]): ContextoComprimido {
  // Limitar a 20 mensagens mais recentes
  const mensagensRecentes = mensagens.slice(-MAX_MENSAGENS_CONTEXTO)

  // Separar mensagens do usuário e assistente
  const mensagensUsuario = mensagensRecentes
    .filter(m => m.role === 'user')
    .map(m => m.content)

  const mensagensAssistente = mensagensRecentes
    .filter(m => m.role === 'assistant')
    .map(m => m.content)

  // Extrair palavras-chave de todas as mensagens
  const todasMensagens = mensagensRecentes.map(m => m.content).join(' ')
  const palavrasChave = extrairPalavrasChave(todasMensagens)

  // Detectar tópicos médicos
  const topicosPrincipais = detectarTopicosMedicos(todasMensagens)

  // Gerar resumo
  const resumo = gerarResumoMensagens(mensagensRecentes)

  return {
    resumo,
    palavrasChave,
    topicosPrincipais,
    ultimaPergunta: mensagensUsuario[mensagensUsuario.length - 1] || '',
    ultimaResposta: mensagensAssistente[mensagensAssistente.length - 1]?.slice(0, 500) || '',
    quantidadeMensagens: mensagensRecentes.length,
  }
}

/**
 * Gera contexto para continuação de resposta (como Meta AI)
 */
export function gerarContextoContinuacao(
  contexto: ContextoComprimido,
  respostaAnterior: string
): string {
  const topicos = contexto.topicosPrincipais.length > 0
    ? contexto.topicosPrincipais.join(', ')
    : 'medicina geral'

  const palavras = contexto.palavrasChave.slice(0, 5).join(', ')

  return `
[CONTEXTO DA CONVERSA]
Tópicos discutidos: ${topicos}
Palavras-chave: ${palavras}
Última pergunta do usuário: "${contexto.ultimaPergunta.slice(0, 200)}"

[RESPOSTA ANTERIOR - NÃO REPETIR]
${respostaAnterior.slice(-600)}

[INSTRUÇÃO]
Continue EXATAMENTE de onde parou. NÃO repita o conteúdo acima.
Mantenha a mesma estrutura e formato.
`.trim()
}

/**
 * Verifica se precisa comprimir o histórico
 */
export function precisaComprimirHistorico(mensagens: MensagemHistorico[]): boolean {
  return mensagens.length > MAX_MENSAGENS_CONTEXTO
}

/**
 * Prepara histórico para envio à API (limita tamanho)
 */
export function prepararHistoricoParaAPI(
  mensagens: MensagemHistorico[],
  maxMensagens: number = MAX_MENSAGENS_CONTEXTO
): MensagemHistorico[] {
  const mensagensLimitadas = mensagens.slice(-maxMensagens)

  // Se tiver muitas mensagens, comprimir as mais antigas
  if (mensagens.length > maxMensagens) {
    const contexto = comprimirContexto(mensagens.slice(0, -maxMensagens))

    // Adicionar resumo como primeira mensagem de contexto
    const mensagemContexto: MensagemHistorico = {
      role: 'user',
      content: `[CONTEXTO ANTERIOR]\n${contexto.resumo}\n\nTópicos: ${contexto.topicosPrincipais.join(', ')}`
    }

    return [mensagemContexto, ...mensagensLimitadas]
  }

  return mensagensLimitadas
}

/**
 * Extrai entidades médicas do texto (doenças, medicamentos, etc.)
 */
export function extrairEntidadesMedicas(texto: string): {
  doencas: string[]
  medicamentos: string[]
  procedimentos: string[]
  anatomia: string[]
} {
  const textoLower = texto.toLowerCase()

  // Padrões comuns (simplificado - em produção usaria NER)
  const doencas: string[] = []
  const medicamentos: string[] = []
  const procedimentos: string[] = []
  const anatomia: string[] = []

  // Detectar padrões de doenças
  const padraoDoenca = /(?:síndrome|doença|transtorno|distúrbio|infecção|tumor|câncer|diabetes|hipertensão|asma)\s+\w+/gi
  const matchesDoenca = textoLower.match(padraoDoenca)
  if (matchesDoenca) doencas.push(...matchesDoenca)

  // Detectar padrões de medicamentos (terminações comuns)
  const padraoMedicamento = /\b\w+(?:ol|ina|mab|nib|pril|sartan|statina|cilina|micina)\b/gi
  const matchesMedicamento = textoLower.match(padraoMedicamento)
  if (matchesMedicamento) medicamentos.push(...matchesMedicamento)

  // Detectar procedimentos
  const padraoProcedimento = /(?:cirurgia|exame|biópsia|tomografia|ressonância|ultrassom|endoscopia|colonoscopia)\s*\w*/gi
  const matchesProcedimento = textoLower.match(padraoProcedimento)
  if (matchesProcedimento) procedimentos.push(...matchesProcedimento)

  // Detectar anatomia
  const padraoAnatomia = /(?:coração|pulmão|fígado|rim|cérebro|estômago|intestino|osso|músculo|nervo|artéria|veia)\s*\w*/gi
  const matchesAnatomia = textoLower.match(padraoAnatomia)
  if (matchesAnatomia) anatomia.push(...matchesAnatomia)

  return {
    doencas: [...new Set(doencas)],
    medicamentos: [...new Set(medicamentos)],
    procedimentos: [...new Set(procedimentos)],
    anatomia: [...new Set(anatomia)],
  }
}
