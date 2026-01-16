'use client'

import { useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { useArtifactsStore, detectArtifactType, Question } from '@/stores/artifactsStore'

// Importar MermaidDiagram dinamicamente para evitar SSR issues
const MermaidDiagram = dynamic(() => import('./MermaidDiagram'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <span>Carregando diagrama...</span>
      </div>
    </div>
  )
})

// Importar LayeredDiagram dinamicamente
const LayeredDiagram = dynamic(() => import('./LayeredDiagram'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
        <span>Carregando diagrama de camadas...</span>
      </div>
    </div>
  )
})

// Importar StagingTable dinamicamente
const StagingTable = dynamic(() => import('./StagingTable'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span>Carregando tabela de estadiamento...</span>
      </div>
    </div>
  )
})

// Importar ImageGenerator dinamicamente
const ImageGenerator = dynamic(() => import('./ImageGenerator'), {
  ssr: false,
  loading: () => (
    <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
        <span>Carregando gerador de imagens...</span>
      </div>
    </div>
  )
})

// Importar MedicalImageGallery dinamicamente
const MedicalImageGallery = dynamic(() => import('./MedicalImageGallery'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-800/30 rounded-xl p-4 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span>Buscando imagens médicas...</span>
      </div>
    </div>
  )
})

// Importar QuestionArtifactCard dinamicamente
const QuestionArtifactCard = dynamic(() => import('./QuestionArtifactCard'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1A2332] border border-white/10 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <span>Carregando questão...</span>
      </div>
    </div>
  )
})

// Importar QuestionStreamingSkeleton dinamicamente para feedback visual durante geração
const QuestionStreamingSkeleton = dynamic(() => import('./QuestionStreamingSkeleton'), {
  ssr: false,
  loading: () => (
    <div className="bg-[#1A2332] border border-white/10 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <span>Preparando questão...</span>
      </div>
    </div>
  )
})

interface ArtifactRendererProps {
  content: string
  userId?: string
  messageId?: string
  conversaId?: string  // ID da conversa para filtrar artefatos
}

// Regex para detectar artefatos no formato ```artifact:tipo:titulo
const ARTIFACT_REGEX = /```artifact:(diagram|flowchart|table|comparison|mindmap):([^\n]*)\n([\s\S]*?)```/g

// Regex para detectar blocos de código Mermaid padrão
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/g

// Regex para detectar solicitações de geração de imagem
const IMAGE_GEN_REGEX = /```generate_image\n([\s\S]*?)```/g

// Regex para detectar marcadores de busca de imagens médicas reais
const IMAGE_SEARCH_REGEX = /\[IMAGE_SEARCH:\s*([^\]]+)\]/g

// Regex para detectar diagramas de camadas (layers)
const LAYERS_REGEX = /```layers:([^\n]*)\n([\s\S]*?)```/g

// Regex para detectar tabelas de estadiamento
const STAGING_REGEX = /```staging:([^\n]*)\n([\s\S]*?)```/g

// Regex para detectar questões geradas pela IA (formato JSON) - COMPLETAS
// Aceita: ```questao, ```question, ```question:Disciplina/Assunto
const QUESTION_REGEX = /```quest(?:ao|ion)(?::[^\n]*)?\n([\s\S]*?)```/g

// Objeto para detectar questões INCOMPLETAS durante streaming (sem o ``` final)
// CORREÇÃO: O regex antigo usava [\s\S]*$ que capturava tudo até o final do texto,
// ignorando completamente qualquer ``` de fechamento. Agora usamos uma função
// que verifica CORRETAMENTE se existe um fechamento válido.
const INCOMPLETE_QUESTION_REGEX = {
  test: (content: string): boolean => {
    // Encontrar todas as aberturas de bloco ```questao ou ```question
    const openMatches = [...content.matchAll(/```quest(?:ao|ion)(?::[^\n]*)?\n/g)]
    if (openMatches.length === 0) return false

    // Para cada abertura, verificar se existe um fechamento correspondente
    for (const openMatch of openMatches) {
      const startIndex = openMatch.index! + openMatch[0].length
      const afterOpen = content.substring(startIndex)

      // Procurar por ``` que NÃO seja seguido de "quest" (fechamento válido)
      const closeMatch = afterOpen.match(/^([\s\S]*?)```(?!quest)/)

      // Se não encontrou fechamento, esta questão está incompleta
      if (!closeMatch) {
        console.log('[INCOMPLETE_QUESTION_REGEX] Questão incompleta detectada, posição:', openMatch.index)
        return true
      }
    }

    // Todas as questões têm fechamento válido
    return false
  }
}

// ============================================================
// DETECÇÃO E CONVERSÃO DE ASCII ART
// ============================================================

// Padrões comuns de ASCII art
const ASCII_PATTERNS = {
  // Caixas com bordas
  boxChars: /[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]/,
  // Setas ASCII
  arrows: /(?:-->|<--|->|<-|=>|<=|→|←|↓|↑|↔|⟶|⟵)/,
  // Linhas horizontais feitas de caracteres
  horizontalLines: /[-=_]{5,}|[─═]{3,}/,
  // Linhas verticais
  verticalLines: /[|│║]{2,}/,
  // Padrões de hierarquia/árvore
  treePatterns: /(?:├──|└──|│\s{2,}├|│\s{2,}└)/,
  // Estruturas com + para interseções
  plusIntersections: /\+[-─]+\+/,
  // Brackets repetidos para estruturas
  bracketStructures: /\[[-─\s]{3,}\]|\{[-─\s]{3,}\}/,
  // Padrões de camadas empilhadas
  layeredPatterns: /^[\s]*[╔═╗│║┌─┐]+[\s]*$/m,
  // ASCII art de fluxogramas básicos
  flowPatterns: /\(\s*[^\)]+\s*\)\s*[-─→>]+\s*\(\s*[^\)]+\s*\)/,
}

// Função para detectar se o texto contém ASCII art significativo
function detectAsciiArt(text: string): { isAscii: boolean; type: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'; confidence: number } {
  const lines = text.split('\n')
  let boxCharCount = 0
  let arrowCount = 0
  let horizontalLineCount = 0
  let treePatternCount = 0
  let flowPatternCount = 0
  let totalSpecialChars = 0

  for (const line of lines) {
    if (ASCII_PATTERNS.boxChars.test(line)) boxCharCount++
    if (ASCII_PATTERNS.arrows.test(line)) arrowCount++
    if (ASCII_PATTERNS.horizontalLines.test(line)) horizontalLineCount++
    if (ASCII_PATTERNS.treePatterns.test(line)) treePatternCount++
    if (ASCII_PATTERNS.flowPatterns.test(line)) flowPatternCount++

    // Contar caracteres especiais de desenho
    const specialChars = line.match(/[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬+|]/g)
    if (specialChars) totalSpecialChars += specialChars.length
  }

  const totalLines = lines.length
  const specialCharRatio = totalSpecialChars / text.length

  // Determinar se é ASCII art e qual tipo
  const isAscii = (
    boxCharCount >= 3 ||
    (arrowCount >= 2 && horizontalLineCount >= 1) ||
    treePatternCount >= 2 ||
    flowPatternCount >= 1 ||
    specialCharRatio > 0.1
  )

  if (!isAscii) {
    return { isAscii: false, type: 'generic', confidence: 0 }
  }

  // Calcular confiança
  const confidence = Math.min(1, (boxCharCount + arrowCount * 2 + treePatternCount * 2) / totalLines)

  // Determinar tipo
  let type: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic' = 'generic'

  if (flowPatternCount > 0 || (arrowCount >= 3 && boxCharCount >= 2)) {
    type = 'flowchart'
  } else if (treePatternCount >= 2) {
    type = 'tree'
  } else if (boxCharCount >= 4 && horizontalLineCount >= 2) {
    // Verificar se parece uma tabela ou camadas
    const hasVerticalSeparators = lines.some(l => (l.match(/[│|]/g) || []).length >= 2)
    type = hasVerticalSeparators ? 'table' : 'layers'
  } else if (boxCharCount >= 3) {
    type = 'layers'
  }

  return { isAscii, type, confidence }
}

// Função para extrair nós de uma estrutura ASCII
function extractNodesFromAscii(text: string): { nodes: string[]; connections: Array<{ from: string; to: string }> } {
  const nodes: string[] = []
  const connections: Array<{ from: string; to: string }> = []

  // Extrair texto dentro de parênteses, colchetes ou caixas
  const nodePatterns = [
    /\(\s*([^)]+)\s*\)/g,           // (texto)
    /\[\s*([^\]]+)\s*\]/g,          // [texto]
    /\{\s*([^}]+)\s*\}/g,           // {texto}
    /│\s*([^│]+)\s*│/g,             // │texto│
    /║\s*([^║]+)\s*║/g,             // ║texto║
  ]

  for (const pattern of nodePatterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const nodeText = match[1].trim()
      if (nodeText && nodeText.length > 1 && !nodes.includes(nodeText)) {
        // Filtrar linhas que são só caracteres de desenho
        if (!/^[-─═_+|│║]+$/.test(nodeText)) {
          nodes.push(nodeText)
        }
      }
    }
  }

  // Tentar detectar conexões baseado em setas
  const lines = text.split('\n')
  for (const line of lines) {
    // Padrão: nó --> nó ou nó -> nó
    const connectionMatch = line.match(/([^-→<]+)\s*(?:-->|->|→|=>)\s*([^-→<]+)/)
    if (connectionMatch) {
      const from = connectionMatch[1].trim().replace(/[()[\]{}│║]/g, '')
      const to = connectionMatch[2].trim().replace(/[()[\]{}│║]/g, '')
      if (from && to && from !== to) {
        connections.push({ from, to })
      }
    }
  }

  return { nodes, connections }
}

// Função para converter ASCII em diagrama Mermaid
function convertAsciiToMermaid(text: string, type: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'): string | null {
  const { nodes, connections } = extractNodesFromAscii(text)

  if (nodes.length < 2) return null

  // Gerar IDs seguros para Mermaid
  const nodeIds = new Map<string, string>()
  nodes.forEach((node, i) => {
    nodeIds.set(node, `node${i}`)
  })

  let mermaidCode = ''

  if (type === 'flowchart' || type === 'generic') {
    mermaidCode = 'flowchart TB\n'

    // Adicionar nós
    nodes.forEach((node, i) => {
      const id = `node${i}`
      // Usar diferentes formas baseado na posição
      if (i === 0) {
        mermaidCode += `    ${id}[["${node}"]]\n` // Início
      } else if (i === nodes.length - 1 && connections.length > 0) {
        mermaidCode += `    ${id}(("${node}"))\n` // Fim (círculo)
      } else {
        mermaidCode += `    ${id}["${node}"]\n`
      }
    })

    // Adicionar conexões se detectadas
    if (connections.length > 0) {
      mermaidCode += '\n'
      connections.forEach(conn => {
        const fromId = nodeIds.get(conn.from)
        const toId = nodeIds.get(conn.to)
        if (fromId && toId) {
          mermaidCode += `    ${fromId} --> ${toId}\n`
        }
      })
    } else {
      // Se não detectou conexões, criar fluxo sequencial
      mermaidCode += '\n'
      for (let i = 0; i < nodes.length - 1; i++) {
        mermaidCode += `    node${i} --> node${i + 1}\n`
      }
    }

    // Adicionar estilos
    mermaidCode += '\n    classDef default fill:#1e3a5f,stroke:#60a5fa,stroke-width:2px,color:#fff\n'
    mermaidCode += '    classDef highlight fill:#065f46,stroke:#34d399,stroke-width:2px,color:#fff\n'
  } else if (type === 'tree') {
    mermaidCode = 'flowchart TB\n'

    // Para árvores, criar estrutura hierárquica
    nodes.forEach((node, i) => {
      mermaidCode += `    node${i}["${node}"]\n`
    })

    // Conectar como árvore (assumindo ordem hierárquica)
    mermaidCode += '\n'
    if (nodes.length > 1) {
      // Raiz conecta aos primeiros filhos
      mermaidCode += `    node0 --> node1\n`
      for (let i = 2; i < nodes.length; i++) {
        // Heurística: conectar ao nó anterior ou à raiz
        const parent = i < 4 ? 0 : Math.floor((i - 1) / 2)
        mermaidCode += `    node${parent} --> node${i}\n`
      }
    }

    mermaidCode += '\n    classDef default fill:#1e3a5f,stroke:#60a5fa,stroke-width:2px,color:#fff\n'
  }

  return mermaidCode.trim()
}

// Função para converter ASCII em diagrama de camadas (LayeredDiagram)
function convertAsciiToLayers(text: string): string | null {
  const { nodes } = extractNodesFromAscii(text)

  if (nodes.length < 2) return null

  // Cores para as camadas
  const colors = ['pink', 'rose', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple', 'red', 'teal']

  const layersData = {
    title: 'Estrutura em Camadas',
    layers: nodes.map((node, i) => ({
      id: `layer-${i}`,
      name: node,
      color: colors[i % colors.length],
      details: `Camada ${i + 1} da estrutura`
    })),
    showStaging: false,
    interactive: true,
    theme: 'histology'
  }

  return JSON.stringify(layersData)
}

// Regex para detectar blocos de código que podem conter ASCII
const CODE_BLOCK_REGEX = /```(?!mermaid|layers|staging|generate_image|artifact|quest)(\w*)\n([\s\S]*?)```/g

interface Artifact {
  type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging' | 'converted_ascii' | 'question'
  subtype?: string
  title?: string
  content: string
  startIndex: number
  endIndex: number
  originalAscii?: string  // Guarda o ASCII original para referência
  conversionType?: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'
  questionData?: Question  // Dados estruturados da questão
}

// Função para extrair termos de busca de imagens do conteúdo
function extractImageSearchTerms(content: string): string[] {
  const terms: string[] = []
  let match
  const regex = new RegExp(IMAGE_SEARCH_REGEX.source, 'g')
  while ((match = regex.exec(content)) !== null) {
    terms.push(match[1].trim())
  }
  return terms
}

// Função para remover marcadores IMAGE_SEARCH do texto
function removeImageSearchMarkers(content: string): string {
  return content.replace(IMAGE_SEARCH_REGEX, '')
}

// Interface para dados parciais extraídos de JSON incompleto
interface PartialQuestionData {
  disciplina?: string
  assunto?: string
  subassunto?: string
  enunciado?: string
  caso_clinico?: string
  alternativasCount?: number
  questionIndex?: number  // Índice da questão sendo gerada (1, 2, 3...)
  totalExpected?: number  // Total esperado de questões
}

// Função para extrair dados parciais de um JSON incompleto de questão
function extractPartialQuestionData(incompleteJson: string, fullContent?: string): PartialQuestionData {
  const data: PartialQuestionData = {}

  // Tentar extrair campos usando regex (funciona mesmo com JSON incompleto)
  const disciplinaMatch = incompleteJson.match(/"disciplina"\s*:\s*"([^"]+)"/)
  if (disciplinaMatch) data.disciplina = disciplinaMatch[1]

  const assuntoMatch = incompleteJson.match(/"assunto"\s*:\s*"([^"]+)"/)
  if (assuntoMatch) data.assunto = assuntoMatch[1]

  const subassuntoMatch = incompleteJson.match(/"subassunto"\s*:\s*"([^"]+)"/)
  if (subassuntoMatch) data.subassunto = subassuntoMatch[1]

  const casoMatch = incompleteJson.match(/"caso_clinico"\s*:\s*"((?:[^"\\]|\\.)*)/)
  if (casoMatch) {
    // Decodificar escapes de JSON
    try {
      data.caso_clinico = JSON.parse(`"${casoMatch[1]}"`)
    } catch {
      data.caso_clinico = casoMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }
  }

  const enunciadoMatch = incompleteJson.match(/"enunciado"\s*:\s*"((?:[^"\\]|\\.)*)/)
  if (enunciadoMatch) {
    try {
      data.enunciado = JSON.parse(`"${enunciadoMatch[1]}"`)
    } catch {
      data.enunciado = enunciadoMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }
  }

  // Contar quantas alternativas já foram geradas
  const alternativasMatches = incompleteJson.match(/"letra"\s*:\s*"[A-E]"/g)
  if (alternativasMatches) data.alternativasCount = alternativasMatches.length

  // Extrair número da questão do próprio JSON parcial (campo "numero")
  const numeroMatch = incompleteJson.match(/"numero"\s*:\s*(\d+)/)
  if (numeroMatch) {
    data.questionIndex = parseInt(numeroMatch[1])
  }

  // Se temos o conteúdo completo, usar para determinar índice e total
  if (fullContent) {
    // Primeiro, tentar extrair do formato "Questão X de Y"
    const questaoDeMatch = fullContent.match(/quest[aã]o\s*(\d+)\s*de\s*(\d+)/i)
    if (questaoDeMatch) {
      data.questionIndex = parseInt(questaoDeMatch[1])
      data.totalExpected = parseInt(questaoDeMatch[2])
    } else {
      // Fallback: contar questões completas + 1
      if (!data.questionIndex) {
        const completedQuestions = fullContent.match(/```quest(?:ao|ion)(?::[^\n]*)?\n[\s\S]*?```/g)
        data.questionIndex = (completedQuestions?.length || 0) + 1
      }

      // Tentar detectar total esperado de múltiplas formas
      // Formato: "criar N questões" ou "N questões sobre"
      const totalMatch = fullContent.match(/(?:criar?|gerar?|fazer?|vou\s+criar?)\s*(\d+)\s*quest(?:ões|oes)/i)
        || fullContent.match(/(\d+)\s*quest(?:ões|oes)\s+sobre/i)
      if (totalMatch) {
        data.totalExpected = parseInt(totalMatch[1])
      }
    }
  }

  return data
}

// Variável global para armazenar dados parciais da última questão sendo gerada
let lastPartialQuestionData: PartialQuestionData | null = null

// Função para obter dados parciais da questão atual
export function getPartialQuestionData(): PartialQuestionData | null {
  return lastPartialQuestionData
}

// Função para detectar e remover blocos de questão incompletos durante streaming
// Isso evita mostrar o JSON bruto enquanto a questão está sendo gerada
// Agora também extrai dados parciais para mostrar no skeleton
function hideIncompleteQuestions(content: string): string {
  // Verifica se há um bloco de questão incompleto (iniciado mas não fechado)
  if (INCOMPLETE_QUESTION_REGEX.test(content)) {
    // Encontrar a ÚLTIMA abertura de bloco que NÃO tem fechamento
    const openMatches = [...content.matchAll(/```quest(?:ao|ion)(?::[^\n]*)?\n/g)]

    for (let i = openMatches.length - 1; i >= 0; i--) {
      const openMatch = openMatches[i]
      const startIndex = openMatch.index! + openMatch[0].length
      const afterOpen = content.substring(startIndex)

      // Verificar se este bloco específico tem fechamento
      const closeMatch = afterOpen.match(/^([\s\S]*?)```(?!quest)/)

      if (!closeMatch) {
        // Este é o bloco incompleto - extrair dados parciais
        const incompleteJson = afterOpen
        lastPartialQuestionData = extractPartialQuestionData(incompleteJson, content)

        console.log('[ArtifactRenderer] Questão incompleta detectada, mostrando skeleton', {
          hasEnunciado: !!lastPartialQuestionData.enunciado,
          hasCasoClinico: !!lastPartialQuestionData.caso_clinico,
          alternativasCount: lastPartialQuestionData.alternativasCount || 0,
          questionIndex: lastPartialQuestionData.questionIndex,
          jsonLength: incompleteJson.length
        })

        // Remove o bloco incompleto e adiciona um marcador especial
        const beforeBlock = content.substring(0, openMatch.index)
        // Usar marcador especial que será renderizado como skeleton
        return beforeBlock + '\n\n[QUESTION_STREAMING_SKELETON]\n'
      }
    }
  }

  // Limpar dados parciais se não há questão incompleta
  lastPartialQuestionData = null
  return content
}

// Verifica se um bloco de questão JSON está completo e válido
function isCompleteQuestionJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr.trim())
    // Verifica se tem os campos mínimos de uma questão
    const hasEnunciado = !!(parsed.enunciado && parsed.enunciado.length > 10)
    // Aceita 2+ alternativas (pode ser C/E com só 2, ou questão ainda gerando)
    const hasAlternativas = !!(parsed.alternativas && Array.isArray(parsed.alternativas) && parsed.alternativas.length >= 2)
    const hasGabarito = !!(parsed.gabarito || parsed.gabarito_comentado)

    // Se temos enunciado + alternativas (2+), considera completo
    // Gabarito não é obrigatório para renderizar o card
    if (hasEnunciado && hasAlternativas) {
      console.log('[ArtifactRenderer] JSON completo validado:', {
        hasEnunciado,
        alternativasCount: parsed.alternativas.length,
        hasGabarito
      })
      return true
    }

    // Log para debug quando não passa na validação
    console.log('[ArtifactRenderer] JSON incompleto:', {
      hasEnunciado,
      enunciadoLength: parsed.enunciado?.length || 0,
      hasAlternativas,
      alternativasCount: parsed.alternativas?.length || 0,
      hasGabarito
    })

    return false
  } catch (e) {
    console.log('[ArtifactRenderer] JSON parse falhou em isCompleteQuestionJson:', (e as Error).message?.substring(0, 50))
    return false
  }
}

// Extrai um valor de string de um JSON parcial usando regex
function extractJsonStringValue(json: string, key: string): string | null {
  // Padrão para capturar valor de string, lidando com escapes
  const pattern = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)(?:"|$)`)
  const match = json.match(pattern)
  if (match && match[1]) {
    try {
      // Tentar decodificar escapes JSON
      return JSON.parse(`"${match[1]}"`)
    } catch {
      // Fallback: decodificar manualmente escapes comuns
      return match[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }
  }
  return null
}

// Extrai alternativas de um JSON parcial
function extractAlternativasFromPartial(json: string): Array<{ letra: string; texto: string }> {
  const alternativas: Array<{ letra: string; texto: string }> = []

  // Padrão para encontrar alternativas completas
  const altPattern = /\{\s*"letra"\s*:\s*"([A-E])"\s*,\s*"texto"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g
  let match
  while ((match = altPattern.exec(json)) !== null) {
    try {
      const texto = JSON.parse(`"${match[2]}"`)
      alternativas.push({ letra: match[1], texto })
    } catch {
      alternativas.push({
        letra: match[1],
        texto: match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"')
      })
    }
  }

  return alternativas
}

// Extrai gabarito_comentado de um JSON parcial
function extractGabaritoComentadoFromPartial(json: string): Record<string, unknown> | null {
  // Tentar encontrar o objeto gabarito_comentado
  const gabaritoMatch = json.match(/"gabarito_comentado"\s*:\s*\{([\s\S]*?)(?:\}(?:\s*\})?$|\}\s*,)/)
  if (!gabaritoMatch) return null

  const gabaritoContent = gabaritoMatch[1]

  const gabarito: Record<string, unknown> = {}

  // Extrair resposta_correta
  const respostaMatch = gabaritoContent.match(/"resposta_correta"\s*:\s*"([A-E])"/)
  if (respostaMatch) gabarito.resposta_correta = respostaMatch[1]

  // Extrair explicacao
  const explicacaoMatch = gabaritoContent.match(/"explicacao"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (explicacaoMatch) {
    try {
      gabarito.explicacao = JSON.parse(`"${explicacaoMatch[1]}"`)
    } catch {
      gabarito.explicacao = explicacaoMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }
  }

  // Extrair ponto_chave
  const pontoMatch = gabaritoContent.match(/"ponto_chave"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (pontoMatch) {
    try {
      gabarito.ponto_chave = JSON.parse(`"${pontoMatch[1]}"`)
    } catch {
      gabarito.ponto_chave = pontoMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')
    }
  }

  return Object.keys(gabarito).length > 0 ? gabarito : null
}

// Tenta reparar JSON incompleto de questão - versão robusta
function tryRepairQuestionJson(jsonStr: string): string | null {
  let repaired = jsonStr.trim()
  console.log('[ArtifactRenderer] Iniciando reparo de JSON, tamanho:', repaired.length)

  // =====================================================
  // FASE 1: Detectar e corrigir strings truncadas
  // =====================================================

  // Contar aspas - se ímpar, temos uma string não fechada
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length
  const hasUnclosedString = quoteCount % 2 !== 0

  if (hasUnclosedString) {
    console.log('[ArtifactRenderer] String não fechada detectada, corrigindo...')

    // Encontrar a última aspas de abertura de string
    let inString = false
    let lastStringStart = -1
    for (let i = 0; i < repaired.length; i++) {
      if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
        if (!inString) {
          lastStringStart = i
        }
        inString = !inString
      }
    }

    // Se terminamos dentro de uma string, precisamos fechá-la
    if (inString && lastStringStart > 0) {
      // Truncar no último ponto/vírgula/espaço antes do final para ter conteúdo sensato
      let truncateAt = repaired.length
      for (let i = repaired.length - 1; i > lastStringStart; i--) {
        const char = repaired[i]
        if (char === '.' || char === ',' || char === ' ' || char === '\\') {
          if (repaired[i - 1] !== '\\') { // Não truncar em escapes
            truncateAt = i
            break
          }
        }
      }

      // Fechar a string truncada
      repaired = repaired.substring(0, truncateAt) + '"'
      console.log('[ArtifactRenderer] String fechada na posição', truncateAt)
    }
  }

  // =====================================================
  // FASE 2: Limpar terminações problemáticas
  // =====================================================

  // Remover vírgulas, dois-pontos e caracteres órfãos no final
  while (repaired.match(/[,:\s]+$/)) {
    repaired = repaired.replace(/[,:\s]+$/, '')
  }

  // Se termina com uma chave de objeto sem valor, remover
  const trailingKeyMatch = repaired.match(/,\s*"[^"]+"\s*:\s*$/)
  if (trailingKeyMatch) {
    repaired = repaired.substring(0, repaired.length - trailingKeyMatch[0].length)
  }

  // Remover vírgulas finais novamente após limpeza
  while (repaired.endsWith(',')) {
    repaired = repaired.slice(0, -1).trim()
  }

  // =====================================================
  // FASE 3: Balancear e fechar brackets
  // =====================================================

  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length

  // Adicionar brackets faltando na ordem correta
  // Primeiro fechar arrays, depois objetos
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']'
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}'
  }

  // =====================================================
  // FASE 4: Tentar parsear o JSON reparado
  // =====================================================

  try {
    const parsed = JSON.parse(repaired)
    if (parsed.enunciado && parsed.alternativas && parsed.alternativas.length >= 2) {
      console.log('[ArtifactRenderer] JSON reparado com sucesso via fechamento de brackets')
      return repaired
    }
  } catch (e) {
    console.log('[ArtifactRenderer] Parse falhou após fechamento:', (e as Error).message?.substring(0, 100))
  }

  // =====================================================
  // FASE 5: Extração manual de campos (fallback robusto)
  // =====================================================

  console.log('[ArtifactRenderer] Tentando extração manual de campos...')

  // Extrair campos individualmente
  const enunciado = extractJsonStringValue(jsonStr, 'enunciado')
  const disciplina = extractJsonStringValue(jsonStr, 'disciplina')
  const assunto = extractJsonStringValue(jsonStr, 'assunto')
  const subassunto = extractJsonStringValue(jsonStr, 'subassunto')
  const dificuldade = extractJsonStringValue(jsonStr, 'dificuldade')
  const tipo = extractJsonStringValue(jsonStr, 'tipo')
  const numero = extractJsonStringValue(jsonStr, 'numero')
  const casoClinico = extractJsonStringValue(jsonStr, 'caso_clinico')
  const alternativas = extractAlternativasFromPartial(jsonStr)
  const gabaritoComentado = extractGabaritoComentadoFromPartial(jsonStr)

  console.log('[ArtifactRenderer] Campos extraídos manualmente:', {
    hasEnunciado: !!enunciado,
    enunciadoLength: enunciado?.length || 0,
    hasDisciplina: !!disciplina,
    alternativasCount: alternativas.length,
    hasGabarito: !!gabaritoComentado,
    gabaritoFields: gabaritoComentado ? Object.keys(gabaritoComentado) : []
  })

  // Se temos enunciado e pelo menos algumas alternativas, reconstruir
  if (enunciado && enunciado.length > 20 && alternativas.length >= 2) {
    const reconstructed: Record<string, unknown> = {
      enunciado,
      alternativas
    }

    // Adicionar campos opcionais se existirem
    if (disciplina) reconstructed.disciplina = disciplina
    if (assunto) reconstructed.assunto = assunto
    if (subassunto) reconstructed.subassunto = subassunto
    if (dificuldade) reconstructed.dificuldade = dificuldade
    if (tipo) reconstructed.tipo = tipo
    if (numero) reconstructed.numero = numero
    if (casoClinico) reconstructed.caso_clinico = casoClinico
    if (gabaritoComentado) reconstructed.gabarito_comentado = gabaritoComentado

    const reconstructedJson = JSON.stringify(reconstructed)
    console.log('[ArtifactRenderer] JSON reconstruído via extração manual, alternativas:', alternativas.length)
    return reconstructedJson
  }

  // =====================================================
  // FASE 6: Último recurso - truncamento progressivo
  // =====================================================

  console.log('[ArtifactRenderer] Tentando truncamento progressivo...')

  // Tentar encontrar o maior substring válido
  for (let cutoff = repaired.length - 1; cutoff > repaired.length * 0.5; cutoff--) {
    let attempt = repaired.substring(0, cutoff)

    // Limpar final
    attempt = attempt.replace(/[,:\s"]+$/, '')

    // Rebalancear brackets
    const ob = (attempt.match(/\{/g) || []).length
    const cb = (attempt.match(/\}/g) || []).length
    const obrk = (attempt.match(/\[/g) || []).length
    const cbrk = (attempt.match(/\]/g) || []).length

    for (let i = 0; i < obrk - cbrk; i++) attempt += ']'
    for (let i = 0; i < ob - cb; i++) attempt += '}'

    try {
      const parsed = JSON.parse(attempt)
      if (parsed.enunciado && parsed.alternativas && parsed.alternativas.length >= 2) {
        console.log('[ArtifactRenderer] JSON recuperado via truncamento em posição', cutoff)
        return attempt
      }
    } catch {
      // Continuar tentando
    }
  }

  console.log('[ArtifactRenderer] Todas as tentativas de reparo falharam')
  return null
}

function parseArtifacts(content: string): { parts: (string | Artifact)[]; artifacts: Artifact[]; hasIncompleteQuestion: boolean } {
  const artifacts: Artifact[] = []
  let lastIndex = 0
  const parts: (string | Artifact)[] = []

  // Detectar se há questão incompleta para mostrar indicador de carregamento
  const hasIncompleteQuestion = INCOMPLETE_QUESTION_REGEX.test(content)

  // Contar questões completas no conteúdo
  const completedQuestions = content.match(/```quest(?:ao|ion)(?::[^\n]*)?\n[\s\S]*?```/g)
  if (completedQuestions || hasIncompleteQuestion) {
    console.log('[ArtifactRenderer] parseArtifacts:', {
      contentLength: content.length,
      completedQuestionsCount: completedQuestions?.length || 0,
      hasIncompleteQuestion,
      hasQuestionMarker: content.includes('```quest')
    })
  }

  // Processar conteúdo, escondendo blocos incompletos
  const processedContent = hideIncompleteQuestions(content)

  // Combinar todas as regex em uma busca
  const allMatches: Array<{
    match: RegExpMatchArray
    type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging' | 'converted_ascii' | 'question'
    asciiType?: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'
    convertedContent?: string
    originalAscii?: string
    questionData?: Question
  }> = []

  // Buscar artefatos personalizados
  let match
  const artifactRegex = new RegExp(ARTIFACT_REGEX.source, 'g')
  while ((match = artifactRegex.exec(processedContent)) !== null) {
    allMatches.push({ match, type: 'artifact' })
  }

  // Buscar blocos Mermaid padrão
  const mermaidRegex = new RegExp(MERMAID_REGEX.source, 'g')
  while ((match = mermaidRegex.exec(processedContent)) !== null) {
    allMatches.push({ match, type: 'mermaid' })
  }

  // Buscar solicitações de geração de imagem
  const imageRegex = new RegExp(IMAGE_GEN_REGEX.source, 'g')
  while ((match = imageRegex.exec(processedContent)) !== null) {
    allMatches.push({ match, type: 'image_request' })
  }

  // Buscar diagramas de camadas (layers)
  const layersRegex = new RegExp(LAYERS_REGEX.source, 'g')
  while ((match = layersRegex.exec(processedContent)) !== null) {
    allMatches.push({ match, type: 'layers' })
  }

  // Buscar tabelas de estadiamento
  const stagingRegex = new RegExp(STAGING_REGEX.source, 'g')
  while ((match = stagingRegex.exec(processedContent)) !== null) {
    allMatches.push({ match, type: 'staging' })
  }

  // Buscar questões geradas pela IA (COMPLETAS ou que podem ser reparadas)
  const questionRegex = new RegExp(QUESTION_REGEX.source, 'g')
  let questionMatchCount = 0

  while ((match = questionRegex.exec(processedContent)) !== null) {
    questionMatchCount++
    const jsonLength = match[1].length
    console.log(`[ArtifactRenderer] ========== QUESTÃO #${questionMatchCount} ==========`)
    console.log(`[ArtifactRenderer] Tamanho do JSON: ${jsonLength} chars`)

    try {
      let questionJson = match[1].trim()

      // Log do início e final do JSON para debug
      console.log('[ArtifactRenderer] Início:', questionJson.substring(0, 80).replace(/\n/g, ' '))
      console.log('[ArtifactRenderer] Final:', questionJson.substring(Math.max(0, questionJson.length - 80)).replace(/\n/g, ' '))

      // Verificar estrutura básica
      const looksComplete = questionJson.endsWith('}')
      const openBraces = (questionJson.match(/\{/g) || []).length
      const closeBraces = (questionJson.match(/\}/g) || []).length
      const hasBracketBalance = openBraces === closeBraces

      console.log('[ArtifactRenderer] Termina com }:', looksComplete)
      console.log('[ArtifactRenderer] Brackets: { =', openBraces, '} =', closeBraces, 'Balanceado:', hasBracketBalance)

      // Primeiro tentar como está
      if (!isCompleteQuestionJson(questionJson)) {
        console.log('[ArtifactRenderer] JSON incompleto, tentando reparar...')

        // Tentar reparar JSON incompleto
        const repaired = tryRepairQuestionJson(questionJson)
        if (repaired) {
          questionJson = repaired
          console.log('[ArtifactRenderer] ✅ JSON reparado, novo tamanho:', repaired.length)
        } else {
          // Não foi possível reparar, pular
          console.log('[ArtifactRenderer] ❌ Reparo falhou, pulando questão')
          continue
        }
      } else {
        console.log('[ArtifactRenderer] ✅ JSON já está completo')
      }

      const questionData = JSON.parse(questionJson) as Question

      // Garantir campos obrigatórios
      if (!questionData.id) {
        questionData.id = `q-${Date.now()}-${questionMatchCount}`
      }
      if (!questionData.numero) {
        questionData.numero = questionMatchCount
      }
      if (!questionData.gabarito_comentado) {
        questionData.gabarito_comentado = {
          resposta_correta: 'A',
          explicacao: 'Gabarito sendo processado...',
          analise_alternativas: [],
          ponto_chave: '',
          referencias: []
        }
      }

      allMatches.push({ match, type: 'question', questionData })
      console.log('[ArtifactRenderer] ✅ Questão adicionada:', {
        numero: questionData.numero,
        disciplina: questionData.disciplina,
        assunto: questionData.assunto,
        alternativas: questionData.alternativas?.length || 0
      })
    } catch (error) {
      console.error('[ArtifactRenderer] ❌ Erro ao parsear questão:', error)
      console.error('[ArtifactRenderer] JSON problemático (500 chars):', match[1].substring(0, 500))
    }
  }

  if (questionMatchCount > 0) {
    console.log(`[ArtifactRenderer] ========== TOTAL: ${questionMatchCount} questões processadas ==========`)
  }

  // NOVO: Buscar blocos de código que podem conter ASCII art
  const codeBlockRegex = new RegExp(CODE_BLOCK_REGEX.source, 'g')
  while ((match = codeBlockRegex.exec(processedContent)) !== null) {
    const codeContent = match[2]
    const asciiDetection = detectAsciiArt(codeContent)

    // Se detectou ASCII art com confiança suficiente
    if (asciiDetection.isAscii && asciiDetection.confidence >= 0.3) {
      let convertedContent: string | null = null

      // Converter baseado no tipo detectado
      if (asciiDetection.type === 'layers') {
        convertedContent = convertAsciiToLayers(codeContent)
      } else {
        convertedContent = convertAsciiToMermaid(codeContent, asciiDetection.type)
      }

      if (convertedContent) {
        allMatches.push({
          match,
          type: 'converted_ascii',
          asciiType: asciiDetection.type,
          convertedContent,
          originalAscii: codeContent
        })
      }
    }
  }

  // NOVO: Também detectar ASCII fora de blocos de código (texto livre)
  // Procurar por padrões de ASCII art que não estão em blocos de código
  const textWithoutCodeBlocks = processedContent.replace(/```[\s\S]*?```/g, '')
  const asciiInTextDetection = detectAsciiArt(textWithoutCodeBlocks)

  // Se detectou ASCII significativo fora de blocos de código
  if (asciiInTextDetection.isAscii && asciiInTextDetection.confidence >= 0.4) {
    // Encontrar o bloco de ASCII no texto original
    const asciiBlockPattern = /(?:^|\n)((?:[\s]*[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬|+].*\n?){3,})/gm
    let asciiMatch
    while ((asciiMatch = asciiBlockPattern.exec(processedContent)) !== null) {
      // Verificar se não está dentro de um bloco de código
      const beforeMatch = processedContent.substring(0, asciiMatch.index)
      const codeBlocksBeforeCount = (beforeMatch.match(/```/g) || []).length
      if (codeBlocksBeforeCount % 2 === 0) {
        // Não está dentro de um bloco de código
        const asciiContent = asciiMatch[1]
        const detection = detectAsciiArt(asciiContent)

        if (detection.isAscii) {
          let convertedContent: string | null = null

          if (detection.type === 'layers') {
            convertedContent = convertAsciiToLayers(asciiContent)
          } else {
            convertedContent = convertAsciiToMermaid(asciiContent, detection.type)
          }

          if (convertedContent) {
            // Criar um match sintético
            const syntheticMatch = [asciiContent] as RegExpMatchArray
            syntheticMatch.index = asciiMatch.index + (asciiMatch[0].indexOf(asciiContent))
            syntheticMatch.input = processedContent

            allMatches.push({
              match: syntheticMatch,
              type: 'converted_ascii',
              asciiType: detection.type,
              convertedContent,
              originalAscii: asciiContent
            })
          }
        }
      }
    }
  }

  // Ordenar por índice
  allMatches.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0))

  // Processar matches
  for (const matchData of allMatches) {
    const { match, type, asciiType, convertedContent, originalAscii, questionData } = matchData
    const startIndex = match.index ?? 0
    const endIndex = startIndex + match[0].length

    // Adicionar texto antes do artefato
    if (startIndex > lastIndex) {
      parts.push(processedContent.substring(lastIndex, startIndex))
    }

    let artifact: Artifact

    if (type === 'artifact') {
      artifact = {
        type: 'artifact',
        subtype: match[1],
        title: match[2].trim(),
        content: match[3].trim(),
        startIndex,
        endIndex
      }
    } else if (type === 'mermaid') {
      artifact = {
        type: 'mermaid',
        title: 'Diagrama',
        content: match[1].trim(),
        startIndex,
        endIndex
      }
    } else if (type === 'layers') {
      artifact = {
        type: 'layers',
        title: match[1].trim() || 'Diagrama de Camadas',
        content: match[2].trim(),
        startIndex,
        endIndex
      }
    } else if (type === 'staging') {
      artifact = {
        type: 'staging',
        title: match[1].trim() || 'Estadiamento',
        content: match[2].trim(),
        startIndex,
        endIndex
      }
    } else if (type === 'question') {
      // Questão gerada pela IA
      artifact = {
        type: 'question',
        title: `Questão ${questionData?.numero || ''} - ${questionData?.disciplina || 'Medicina'}`,
        content: match[1].trim(),
        startIndex,
        endIndex,
        questionData: questionData
      }
    } else if (type === 'converted_ascii') {
      // ASCII convertido para visual
      artifact = {
        type: 'converted_ascii',
        title: asciiType === 'layers' ? 'Estrutura em Camadas' : 'Diagrama Convertido',
        content: convertedContent || '',
        startIndex,
        endIndex,
        originalAscii: originalAscii,
        conversionType: asciiType
      }
    } else {
      artifact = {
        type: 'image_request',
        title: 'Solicitação de Imagem',
        content: match[1].trim(),
        startIndex,
        endIndex
      }
    }

    artifacts.push(artifact)
    parts.push(artifact)
    lastIndex = endIndex
  }

  // Adicionar texto restante
  if (lastIndex < processedContent.length) {
    parts.push(processedContent.substring(lastIndex))
  }

  return { parts, artifacts, hasIncompleteQuestion }
}

export default function ArtifactRenderer({ content, userId, messageId, conversaId }: ArtifactRendererProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { parts, artifacts, hasIncompleteQuestion } = useMemo(() => parseArtifacts(content), [content])
  const { addArtifact, artifacts: storeArtifacts, updateQuestionAnswer } = useArtifactsStore()
  const addedArtifactsRef = useRef<Set<string>>(new Set())

  // Extrair termos de busca de imagens médicas reais
  const imageSearchTerms = useMemo(() => extractImageSearchTerms(content), [content])

  // Adicionar artefatos à store quando detectados
  useEffect(() => {
    if (artifacts.length === 0) return

    artifacts.forEach((artifact) => {
      // Criar uma chave única para evitar duplicatas
      const artifactKey = `${messageId}-${artifact.startIndex}-${artifact.type}`

      // Verificar se já foi adicionado nesta sessão ou está na store
      if (addedArtifactsRef.current.has(artifactKey)) return

      // Verificar se já existe na store (para evitar duplicatas em re-renders)
      const exists = storeArtifacts.some(
        (a) => a.messageId === messageId && a.content === artifact.content
      )
      if (exists) return

      // Adicionar à store - usar tipo do artefato se já definido
      // Mapear tipos internos para tipos da store
      let storeType: string
      if (artifact.type === 'layers' || artifact.type === 'converted_ascii' && artifact.conversionType === 'layers') {
        storeType = 'layers'
      } else if (artifact.type === 'staging') {
        storeType = 'staging'
      } else if (artifact.type === 'mermaid') {
        storeType = 'flowchart'
      } else if (artifact.type === 'question') {
        storeType = 'question'
      } else {
        storeType = detectArtifactType(artifact.content) || 'diagram'
      }

      addArtifact({
        type: storeType as import('@/stores/artifactsStore').ArtifactType,
        title: artifact.title || 'Artefato',
        content: artifact.content,
        messageId,
        conversaId,
        metadata: {
          subtype: artifact.subtype,
          question: artifact.questionData
        }
      })

      addedArtifactsRef.current.add(artifactKey)
    })
  }, [artifacts, messageId, addArtifact, storeArtifacts])

  // Obter dados parciais da questão sendo gerada
  const partialQuestionData = useMemo(() => getPartialQuestionData(), [content])

  return (
    <div className="artifact-renderer">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
          // Verificar se é o marcador de skeleton de questão
          if (part.includes('[QUESTION_STREAMING_SKELETON]')) {
            // Dividir o texto e renderizar o skeleton no lugar do marcador
            const segments = part.split('[QUESTION_STREAMING_SKELETON]')
            return (
              <div key={index}>
                {segments.map((segment, segIndex) => (
                  <div key={segIndex}>
                    {segment.trim() && (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {removeImageSearchMarkers(segment)}
                      </ReactMarkdown>
                    )}
                    {segIndex < segments.length - 1 && (
                      <div className="my-2">
                        <QuestionStreamingSkeleton
                          partialData={partialQuestionData || undefined}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }

          // Remover marcadores IMAGE_SEARCH do texto antes de renderizar
          const cleanedPart = removeImageSearchMarkers(part)

          // Renderizar Markdown normal
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                // Headings - menores e mais compactos
                h1: ({ children }) => (
                  <h1 className="text-lg md:text-xl font-bold text-white mt-4 mb-2 pb-1 border-b border-white/10">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base md:text-lg font-semibold text-white mt-3 mb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm md:text-base font-semibold text-emerald-400 mt-3 mb-1.5">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold text-white/90 mt-2 mb-1">
                    {children}
                  </h4>
                ),

                // Paragraphs - texto menor
                p: ({ children }) => (
                  <p className="text-white/80 leading-relaxed mb-2 text-sm">
                    {children}
                  </p>
                ),

                // Lists - espaçamento reduzido
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-0.5 mb-2 text-white/80 ml-2 text-sm">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-0.5 mb-2 text-white/80 ml-2 text-sm">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-white/80 text-sm">
                    {children}
                  </li>
                ),

                // Strong and emphasis
                strong: ({ children }) => (
                  <strong className="font-semibold text-emerald-400">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-white/70">
                    {children}
                  </em>
                ),

                // Code - tamanho reduzido
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code className="bg-emerald-500/20 text-emerald-300 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    )
                  }

                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg my-2 text-xs"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  )
                },

                // Pre (for code blocks without language) - mais compacto
                pre: ({ children }) => (
                  <pre className="bg-slate-800/80 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-white/80">
                    {children}
                  </pre>
                ),

                // Tables - células mais compactas
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border-collapse border border-white/10 rounded-lg overflow-hidden text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-emerald-500/20">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-white/10">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-white/5 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold text-emerald-400 border-b border-white/10">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2 md:px-3 py-2 text-xs text-white/80">
                    {children}
                  </td>
                ),

                // Blockquotes (para boxes de destaque) - mais compacto
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-emerald-500 bg-emerald-500/10 pl-3 py-1.5 my-2 rounded-r-lg">
                    <div className="text-white/80 text-sm">
                      {children}
                    </div>
                  </blockquote>
                ),

                // Links
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),

                // Horizontal rule - espaçamento reduzido
                hr: () => (
                  <hr className="my-4 border-white/10" />
                ),

                // Images - responsivas
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="max-w-full h-auto rounded-lg my-3 max-h-[300px] md:max-h-[400px] object-contain"
                  />
                )
              }}
            >
              {cleanedPart}
            </ReactMarkdown>
          )
        }

        // Renderizar artefatos - com containers responsivos
        if (part.type === 'mermaid' || (part.type === 'artifact' && (part.subtype === 'diagram' || part.subtype === 'flowchart'))) {
          return (
            <div key={index} className="my-3 max-h-[350px] md:max-h-[450px] overflow-auto rounded-xl">
              <MermaidDiagram
                chart={part.content}
                title={part.title}
              />
            </div>
          )
        }

        // Renderizar diagramas de camadas (layers) - responsivos
        if (part.type === 'layers') {
          try {
            const layerData = JSON.parse(part.content)
            return (
              <div key={index} className="my-3 max-h-[350px] md:max-h-[450px] overflow-auto">
                <LayeredDiagram
                  title={part.title || layerData.title || 'Diagrama de Camadas'}
                  layers={layerData.layers || []}
                  showStaging={layerData.showStaging}
                  interactive={layerData.interactive !== false}
                  theme={layerData.theme || 'histology'}
                  description={layerData.description}
                  orientation={layerData.orientation}
                />
              </div>
            )
          } catch {
            // Se não for JSON válido, mostrar como texto
            return (
              <div key={index} className="my-3 bg-slate-800/50 border border-white/10 rounded-xl p-3">
                <pre className="text-white/80 text-xs whitespace-pre-wrap">{part.content}</pre>
              </div>
            )
          }
        }

        // Renderizar tabelas de estadiamento - responsivas
        if (part.type === 'staging') {
          try {
            const stagingData = JSON.parse(part.content)
            return (
              <div key={index} className="my-3 max-h-[400px] md:max-h-[500px] overflow-auto">
                <StagingTable
                  title={part.title || stagingData.title || 'Estadiamento'}
                  rows={stagingData.rows || []}
                  highlightStage={stagingData.highlightStage}
                  cancerType={stagingData.cancerType}
                  source={stagingData.source}
                />
              </div>
            )
          } catch {
            // Se não for JSON válido, mostrar como texto
            return (
              <div key={index} className="my-3 bg-slate-800/50 border border-white/10 rounded-xl p-3">
                <pre className="text-white/80 text-xs whitespace-pre-wrap">{part.content}</pre>
              </div>
            )
          }
        }

        if (part.type === 'image_request') {
          return (
            <div key={index} className="my-3 max-h-[350px] md:max-h-[450px] overflow-auto">
              <ImageGenerator
                prompt={part.content}
              />
            </div>
          )
        }

        // Renderizar ASCII convertido para visual - responsivo
        if (part.type === 'converted_ascii') {
          // Se foi convertido para layers (JSON)
          if (part.conversionType === 'layers') {
            try {
              const layerData = JSON.parse(part.content)
              return (
                <div key={index} className="my-3 max-h-[350px] md:max-h-[450px] overflow-auto">
                  {/* Banner indicando conversão automática */}
                  <div className="mb-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg inline-flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] text-purple-300">
                      ASCII convertido para visual
                    </span>
                  </div>
                  <LayeredDiagram
                    title={layerData.title || 'Estrutura em Camadas'}
                    layers={layerData.layers || []}
                    showStaging={layerData.showStaging}
                    interactive={true}
                    theme={layerData.theme || 'histology'}
                  />
                </div>
              )
            } catch {
              // Fallback: mostrar como Mermaid
              return (
                <div key={index} className="my-3 max-h-[350px] md:max-h-[450px] overflow-auto">
                  <div className="mb-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg inline-flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[10px] text-purple-300">
                      ASCII convertido
                    </span>
                  </div>
                  <MermaidDiagram
                    chart={part.content}
                    title={part.title || 'Diagrama Convertido'}
                  />
                </div>
              )
            }
          }

          // Se foi convertido para Mermaid (flowchart, tree, etc)
          return (
            <div key={index} className="my-3 max-h-[350px] md:max-h-[450px] overflow-auto">
              {/* Banner indicando conversão automática */}
              <div className="mb-2 px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg inline-flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] text-purple-300">
                  ASCII convertido para fluxograma
                </span>
              </div>
              <MermaidDiagram
                chart={part.content}
                title={part.title || 'Diagrama Convertido'}
              />
            </div>
          )
        }

        // Renderizar questões geradas pela IA
        if (part.type === 'question' && part.questionData) {
          // Encontrar o artefato correspondente na store para sincronização
          // Busca melhorada: primeiro por messageId+numero, depois por enunciado
          const matchingArtifact = storeArtifacts.find(
            a => a.type === 'question' &&
                 a.messageId === messageId &&
                 a.metadata?.question?.numero === part.questionData?.numero
          ) || storeArtifacts.find(
            a => a.type === 'question' &&
                 a.conversaId === conversaId &&
                 a.metadata?.question?.enunciado === part.questionData?.enunciado
          )

          return (
            <div key={index} className="my-2">
              <QuestionArtifactCard
                question={matchingArtifact?.metadata?.question || part.questionData}
                userId={userId}
                conversaId={conversaId}
                onAnswerSubmit={(questionId, answer, correct) => {
                  // Sincronizar com a store de artefatos
                  if (matchingArtifact) {
                    updateQuestionAnswer(matchingArtifact.id, answer, correct)
                  }
                }}
              />
            </div>
          )
        }

        // Outros tipos de artefato (tabela, comparação, mindmap) - responsivo
        if (part.type === 'artifact') {
          return (
            <div key={index} className="my-3 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden max-h-[300px] md:max-h-[400px] overflow-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border-b border-white/10 sticky top-0">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-white/80 text-xs font-medium">
                  {part.title || part.subtype}
                </span>
              </div>
              <div className="p-3 text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {part.content}
                </ReactMarkdown>
              </div>
            </div>
          )
        }

        return null
      })}

      {/* Renderizar galeria de imagens médicas reais se houver termos de busca */}
      {imageSearchTerms.length > 0 && userId && (
        <MedicalImageGallery
          searchTerms={imageSearchTerms}
          userId={userId}
        />
      )}
    </div>
  )
}
