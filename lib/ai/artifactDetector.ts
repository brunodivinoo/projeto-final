/**
 * Detector de Artefatos
 * Analisa a resposta da IA e identifica conteúdos que devem virar artefatos interativos
 */

export type ArtifactType =
  | 'questoes'
  | 'flashcards'
  | 'simulado'
  | 'resumo'
  | 'plano_estudos'
  | 'mapa_mental'
  | 'tabela_comparativa'
  | 'imagem'

export interface DetectedArtifact {
  type: ArtifactType
  title: string
  content: unknown
  startIndex: number
  endIndex: number
  confidence: number // 0-1
}

/**
 * Detecta artefatos na resposta da IA
 */
export function detectArtifacts(response: string): DetectedArtifact[] {
  const artifacts: DetectedArtifact[] = []

  // Detectar questões
  const questoesArtifact = detectQuestoes(response)
  if (questoesArtifact) artifacts.push(questoesArtifact)

  // Detectar flashcards
  const flashcardsArtifact = detectFlashcards(response)
  if (flashcardsArtifact) artifacts.push(flashcardsArtifact)

  // Detectar plano de estudos
  const planoArtifact = detectPlanoEstudos(response)
  if (planoArtifact) artifacts.push(planoArtifact)

  // Detectar tabelas comparativas
  const tabelaArtifact = detectTabelaComparativa(response)
  if (tabelaArtifact) artifacts.push(tabelaArtifact)

  // Detectar imagens
  const imagensArtifact = detectImagens(response)
  if (imagensArtifact) artifacts.push(imagensArtifact)

  // Detectar resumo estruturado
  const resumoArtifact = detectResumo(response)
  if (resumoArtifact) artifacts.push(resumoArtifact)

  return artifacts
}

/**
 * Detecta questões de múltipla escolha
 */
function detectQuestoes(response: string): DetectedArtifact | null {
  // Pattern para questões numeradas com alternativas
  const questoesPattern = /\*\*Questão\s*\d+\*\*[\s\S]*?(?:[a-e]\)[\s\S]*?){4,5}/gi
  const matches = response.match(questoesPattern)

  if (matches && matches.length >= 1) {
    const questions = parseQuestions(matches)

    if (questions.length > 0) {
      const firstMatch = response.indexOf(matches[0])
      const lastMatch = response.lastIndexOf(matches[matches.length - 1])

      return {
        type: matches.length >= 5 ? 'simulado' : 'questoes',
        title: matches.length >= 5 ? `Simulado (${questions.length} questões)` : `${questions.length} Questões`,
        content: { questions },
        startIndex: firstMatch,
        endIndex: lastMatch + matches[matches.length - 1].length,
        confidence: 0.9
      }
    }
  }

  return null
}

/**
 * Detecta flashcards
 */
function detectFlashcards(response: string): DetectedArtifact | null {
  // Pattern: **Frente:** ... **Verso:** ...
  const flashcardsPattern = /\*\*Frente:\*\*\s*[\s\S]*?\*\*Verso:\*\*\s*[\s\S]*?(?=\*\*Frente:\*\*|---|$)/gi
  const matches = response.match(flashcardsPattern)

  if (matches && matches.length >= 1) {
    const cards = parseFlashcards(matches)

    if (cards.length > 0) {
      const firstMatch = response.indexOf(matches[0])
      const lastMatch = response.lastIndexOf(matches[matches.length - 1])

      return {
        type: 'flashcards',
        title: `${cards.length} Flashcards`,
        content: { cards },
        startIndex: firstMatch,
        endIndex: lastMatch + matches[matches.length - 1].length,
        confidence: 0.85
      }
    }
  }

  return null
}

/**
 * Detecta plano de estudos
 */
function detectPlanoEstudos(response: string): DetectedArtifact | null {
  const hasPlanoKeywords = /plano de estudos|cronograma|semana\s*\d+|dia\s*\d+/i.test(response)

  if (hasPlanoKeywords) {
    // Verificar se tem estrutura de plano (dias/semanas com checkboxes ou listas)
    const planoPattern = /##.*(?:plano|cronograma)[\s\S]*?(?:(?:semana|dia)\s*\d+[\s\S]*?){2,}/i
    const match = response.match(planoPattern)

    if (match) {
      const plan = parsePlanoEstudos(match[0])

      return {
        type: 'plano_estudos',
        title: 'Plano de Estudos',
        content: { plan },
        startIndex: response.indexOf(match[0]),
        endIndex: response.indexOf(match[0]) + match[0].length,
        confidence: 0.8
      }
    }
  }

  return null
}

/**
 * Detecta tabelas comparativas
 */
function detectTabelaComparativa(response: string): DetectedArtifact | null {
  // Pattern para tabelas markdown com pelo menos 3 colunas
  const tabelaPattern = /\|[^|\n]+\|[^|\n]+\|[^|\n]+\|[\s\S]*?\|[^|\n]+\|[^|\n]+\|[^|\n]+\|/g
  const matches = response.match(tabelaPattern)

  if (matches && matches.length > 0) {
    // Pegar a primeira tabela encontrada
    const tabelaCompleta = extractFullTable(response, matches[0])

    if (tabelaCompleta) {
      const tableData = parseTabela(tabelaCompleta)

      if (tableData && tableData.rows.length >= 2) {
        return {
          type: 'tabela_comparativa',
          title: 'Tabela Comparativa',
          content: tableData,
          startIndex: response.indexOf(tabelaCompleta),
          endIndex: response.indexOf(tabelaCompleta) + tabelaCompleta.length,
          confidence: 0.75
        }
      }
    }
  }

  return null
}

/**
 * Detecta imagens
 */
function detectImagens(response: string): DetectedArtifact | null {
  // Pattern para imagens markdown
  const imagensPattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  const matches = [...response.matchAll(imagensPattern)]

  if (matches.length > 0) {
    const images = matches.map((m, i) => ({
      id: `img-${i + 1}`,
      alt: m[1] || 'Imagem',
      url: m[2],
      caption: m[1] || ''
    }))

    return {
      type: 'imagem',
      title: `${images.length} ${images.length === 1 ? 'Imagem' : 'Imagens'}`,
      content: { images },
      startIndex: matches[0].index || 0,
      endIndex: (matches[matches.length - 1].index || 0) + matches[matches.length - 1][0].length,
      confidence: 0.95
    }
  }

  return null
}

/**
 * Detecta resumo estruturado
 */
function detectResumo(response: string): DetectedArtifact | null {
  // Verifica se tem estrutura de resumo (headers, listas, seções)
  const hasResumoStructure =
    (response.match(/^##\s+/gm) || []).length >= 3 && // Pelo menos 3 seções
    (response.match(/^[-*]\s+/gm) || []).length >= 5 // Pelo menos 5 itens de lista

  if (hasResumoStructure) {
    const references = extractReferences(response)

    return {
      type: 'resumo',
      title: 'Resumo',
      content: {
        text: response,
        references,
        sections: extractSections(response)
      },
      startIndex: 0,
      endIndex: response.length,
      confidence: 0.6 // Menor confiança pois pode ser confundido com explicação normal
    }
  }

  return null
}

// ===========================================
// FUNÇÕES DE PARSING
// ===========================================

interface ParsedQuestion {
  id: string
  enunciado: string
  alternativas: { letra: string; texto: string }[]
  respostaCorreta: string
  explicacao: string
  dificuldade: 'facil' | 'medio' | 'dificil'
}

function parseQuestions(matches: string[]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  matches.forEach((questionText, index) => {
    // Extrair enunciado (antes das alternativas)
    const enunciadoMatch = questionText.match(/\*\*Questão\s*\d+\*\*[^\n]*\n+([\s\S]*?)(?=\n\s*[a-e]\))/i)
    const enunciado = enunciadoMatch ? enunciadoMatch[1].trim() : ''

    // Extrair alternativas
    const alternativas: { letra: string; texto: string }[] = []
    const altPattern = /([a-e])\)\s*([^\n]+)/gi
    let altMatch

    while ((altMatch = altPattern.exec(questionText)) !== null) {
      alternativas.push({
        letra: altMatch[1].toUpperCase(),
        texto: altMatch[2].trim()
      })
    }

    // Extrair resposta correta
    const respostaMatch = questionText.match(/(?:Resposta|Gabarito):\s*([A-E])/i)
    const respostaCorreta = respostaMatch ? respostaMatch[1].toUpperCase() : ''

    // Extrair explicação
    const explicacaoMatch = questionText.match(/(?:Explicação|Comentário):\s*([\s\S]*?)(?=\n\n|$)/i)
    const explicacao = explicacaoMatch ? explicacaoMatch[1].trim() : ''

    // Extrair dificuldade
    const diffMatch = questionText.match(/Nível:\s*(fácil|médio|difícil|facil|medio|dificil)/i)
    let dificuldade: 'facil' | 'medio' | 'dificil' = 'medio'
    if (diffMatch) {
      const d = diffMatch[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      dificuldade = d === 'facil' ? 'facil' : d === 'dificil' ? 'dificil' : 'medio'
    }

    if (enunciado && alternativas.length >= 4) {
      questions.push({
        id: `q-${index + 1}-${Date.now()}`,
        enunciado,
        alternativas,
        respostaCorreta,
        explicacao,
        dificuldade
      })
    }
  })

  return questions
}

interface ParsedFlashcard {
  id: string
  front: string
  back: string
  learned: boolean
}

function parseFlashcards(matches: string[]): ParsedFlashcard[] {
  const cards: ParsedFlashcard[] = []

  matches.forEach((text, index) => {
    const frontMatch = text.match(/\*\*Frente:\*\*\s*([\s\S]*?)(?=\*\*Verso:\*\*)/i)
    const backMatch = text.match(/\*\*Verso:\*\*\s*([\s\S]*?)$/i)

    if (frontMatch && backMatch) {
      cards.push({
        id: `fc-${index + 1}-${Date.now()}`,
        front: frontMatch[1].trim(),
        back: backMatch[1].trim(),
        learned: false
      })
    }
  })

  return cards
}

interface PlanoItem {
  dia: string
  tarefas: { texto: string; concluida: boolean }[]
}

interface ParsedPlano {
  titulo: string
  semanas: { numero: number; dias: PlanoItem[] }[]
}

function parsePlanoEstudos(text: string): ParsedPlano {
  const tituloMatch = text.match(/##\s*([^\n]+)/i)
  const titulo = tituloMatch ? tituloMatch[1].trim() : 'Plano de Estudos'

  const semanas: ParsedPlano['semanas'] = []

  // Pattern para semanas
  const semanaPattern = /###?\s*Semana\s*(\d+)[\s\S]*?(?=###?\s*Semana|\n##[^#]|$)/gi
  let semanaMatch

  while ((semanaMatch = semanaPattern.exec(text)) !== null) {
    const numero = parseInt(semanaMatch[1])
    const semanaText = semanaMatch[0]
    const dias: PlanoItem[] = []

    // Pattern para dias dentro da semana
    const diaPattern = /(?:Dia|Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)\s*\d*[:\s]*([\s\S]*?)(?=(?:Dia|Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)\s*\d*[:\s]|$)/gi
    let diaMatch

    while ((diaMatch = diaPattern.exec(semanaText)) !== null) {
      const diaText = diaMatch[1]
      const tarefas: PlanoItem['tarefas'] = []

      // Extrair tarefas (checkboxes ou listas)
      const tarefaPattern = /[-*]\s*\[?\s*[xX ]?\s*\]?\s*(.+)/g
      let tarefaMatch

      while ((tarefaMatch = tarefaPattern.exec(diaText)) !== null) {
        const texto = tarefaMatch[1].trim()
        const concluida = /\[x\]/i.test(tarefaMatch[0])

        tarefas.push({ texto, concluida })
      }

      if (tarefas.length > 0) {
        dias.push({
          dia: diaMatch[0].match(/(?:Dia|Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)\s*\d*/i)?.[0] || `Dia ${dias.length + 1}`,
          tarefas
        })
      }
    }

    if (dias.length > 0) {
      semanas.push({ numero, dias })
    }
  }

  return { titulo, semanas }
}

interface ParsedTabela {
  headers: string[]
  rows: string[][]
}

function parseTabela(text: string): ParsedTabela | null {
  const lines = text.split('\n').filter(line => line.trim().startsWith('|'))

  if (lines.length < 2) return null

  // Primeira linha são os headers
  const headers = lines[0]
    .split('|')
    .filter(cell => cell.trim())
    .map(cell => cell.trim())

  // Pular linha de separação (---|---|---)
  const dataLines = lines.slice(2)

  const rows = dataLines.map(line =>
    line
      .split('|')
      .filter(cell => cell.trim())
      .map(cell => cell.trim())
  )

  return { headers, rows }
}

function extractFullTable(response: string, partialMatch: string): string | null {
  const startIndex = response.indexOf(partialMatch)
  if (startIndex === -1) return null

  // Encontrar o fim da tabela (primeira linha que não começa com |)
  let endIndex = startIndex
  const lines = response.substring(startIndex).split('\n')

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() && !lines[i].trim().startsWith('|')) {
      break
    }
    endIndex += lines[i].length + 1
  }

  return response.substring(startIndex, endIndex).trim()
}

interface Reference {
  numero: number
  texto: string
}

function extractReferences(response: string): Reference[] {
  const references: Reference[] = []

  // Pattern para referências numeradas
  const refPattern = /\[(\d+)\]\s*([^\[\n]+)/g
  let match

  while ((match = refPattern.exec(response)) !== null) {
    references.push({
      numero: parseInt(match[1]),
      texto: match[2].trim()
    })
  }

  return references
}

interface Section {
  titulo: string
  conteudo: string
}

function extractSections(response: string): Section[] {
  const sections: Section[] = []

  // Pattern para seções (## Título)
  const sectionPattern = /^##\s+([^\n]+)\n([\s\S]*?)(?=^##\s+|$)/gm
  let match

  while ((match = sectionPattern.exec(response)) !== null) {
    sections.push({
      titulo: match[1].trim(),
      conteudo: match[2].trim()
    })
  }

  return sections
}

/**
 * Verifica se uma resposta contém artefatos
 */
export function hasArtifacts(response: string): boolean {
  return detectArtifacts(response).length > 0
}

/**
 * Obtém o tipo principal de artefato
 */
export function getPrimaryArtifactType(response: string): ArtifactType | null {
  const artifacts = detectArtifacts(response)

  if (artifacts.length === 0) return null

  // Ordenar por confiança e retornar o mais confiável
  artifacts.sort((a, b) => b.confidence - a.confidence)

  return artifacts[0].type
}
