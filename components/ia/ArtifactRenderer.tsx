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

interface ArtifactRendererProps {
  content: string
  userId?: string
  messageId?: string
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

// Regex para detectar questões geradas pela IA (formato JSON)
const QUESTION_REGEX = /```questao\n([\s\S]*?)```/g

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
const CODE_BLOCK_REGEX = /```(?!mermaid|layers|staging|generate_image|artifact|questao)(\w*)\n([\s\S]*?)```/g

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

function parseArtifacts(content: string): { parts: (string | Artifact)[]; artifacts: Artifact[] } {
  const artifacts: Artifact[] = []
  let lastIndex = 0
  const parts: (string | Artifact)[] = []

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
  while ((match = artifactRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'artifact' })
  }

  // Buscar blocos Mermaid padrão
  const mermaidRegex = new RegExp(MERMAID_REGEX.source, 'g')
  while ((match = mermaidRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'mermaid' })
  }

  // Buscar solicitações de geração de imagem
  const imageRegex = new RegExp(IMAGE_GEN_REGEX.source, 'g')
  while ((match = imageRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'image_request' })
  }

  // Buscar diagramas de camadas (layers)
  const layersRegex = new RegExp(LAYERS_REGEX.source, 'g')
  while ((match = layersRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'layers' })
  }

  // Buscar tabelas de estadiamento
  const stagingRegex = new RegExp(STAGING_REGEX.source, 'g')
  while ((match = stagingRegex.exec(content)) !== null) {
    allMatches.push({ match, type: 'staging' })
  }

  // Buscar questões geradas pela IA
  const questionRegex = new RegExp(QUESTION_REGEX.source, 'g')
  while ((match = questionRegex.exec(content)) !== null) {
    try {
      const questionJson = match[1].trim()
      const questionData = JSON.parse(questionJson) as Question
      allMatches.push({ match, type: 'question', questionData })
    } catch {
      // Se não for JSON válido, ignorar
      console.warn('Failed to parse question JSON:', match[1])
    }
  }

  // NOVO: Buscar blocos de código que podem conter ASCII art
  const codeBlockRegex = new RegExp(CODE_BLOCK_REGEX.source, 'g')
  while ((match = codeBlockRegex.exec(content)) !== null) {
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
  const textWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '')
  const asciiInTextDetection = detectAsciiArt(textWithoutCodeBlocks)

  // Se detectou ASCII significativo fora de blocos de código
  if (asciiInTextDetection.isAscii && asciiInTextDetection.confidence >= 0.4) {
    // Encontrar o bloco de ASCII no texto original
    const asciiBlockPattern = /(?:^|\n)((?:[\s]*[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬|+].*\n?){3,})/gm
    let asciiMatch
    while ((asciiMatch = asciiBlockPattern.exec(content)) !== null) {
      // Verificar se não está dentro de um bloco de código
      const beforeMatch = content.substring(0, asciiMatch.index)
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
            syntheticMatch.input = content

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
      parts.push(content.substring(lastIndex, startIndex))
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
  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex))
  }

  return { parts, artifacts }
}

export default function ArtifactRenderer({ content, userId, messageId }: ArtifactRendererProps) {
  const { parts, artifacts } = useMemo(() => parseArtifacts(content), [content])
  const { addArtifact, artifacts: storeArtifacts } = useArtifactsStore()
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
        metadata: {
          subtype: artifact.subtype,
          question: artifact.questionData
        }
      })

      addedArtifactsRef.current.add(artifactKey)
    })
  }, [artifacts, messageId, addArtifact, storeArtifacts])

  return (
    <div className="artifact-renderer">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
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
          return (
            <div key={index} className="my-4">
              <QuestionArtifactCard
                question={part.questionData}
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
