'use client'

import { useMemo, useEffect, useRef, useState, useCallback, memo } from 'react'

// Hook de debounce para evitar recálculos excessivos durante streaming
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Se o valor mudou significativamente (mais de 100 chars de diferença), atualizar imediatamente
    const currentStr = typeof value === 'string' ? value : JSON.stringify(value)
    const debouncedStr = typeof debouncedValue === 'string' ? debouncedValue : JSON.stringify(debouncedValue)

    if (Math.abs(currentStr.length - debouncedStr.length) > 100) {
      setDebouncedValue(value)
      return
    }

    // Caso contrário, usar debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, debouncedValue])

  return debouncedValue
}
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { useArtifactsStore, detectArtifactType, Question, type ChatModeType } from '@/stores/artifactsStore'
import { extractReferences, processCitations, type Reference, CITATION_REGEX } from './CitationTooltip'
import { ImageModal } from '@/components/ui/ImageModal'
import { ZoomIn } from 'lucide-react'

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

// Importar FlashcardDeck dinamicamente para renderização interativa
const FlashcardDeck = dynamic(() => import('./FlashcardDeck'), {
  ssr: false,
  loading: () => (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
        <span>Carregando flashcards interativos...</span>
      </div>
    </div>
  )
})

// Importar SimuladoCard dinamicamente para renderização de simulados
const SimuladoCard = dynamic(() => import('./SimuladoCard'), {
  ssr: false,
  loading: () => (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-white/40">
        <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        <span>Carregando simulado...</span>
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

export type PlanoUsuario = 'gratuito' | 'premium' | 'residencia'

interface ArtifactRendererProps {
  content: string
  userId?: string
  messageId?: string
  conversaId?: string  // ID da conversa para filtrar artefatos
  chatMode?: ChatModeType  // Modo de chat atual (chat, caso_clinico, tutor, questoes)
  // Props para blur no gabarito
  planoUsuario?: PlanoUsuario
  trialAtivo?: boolean
  onUpgradeClick?: () => void
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

// Regex para detectar simulados gerados pela IA (formato JSON completo)
// Aceita: ```simulado:Titulo
const SIMULADO_REGEX = /```simulado(?::([^\n]*))?\n([\s\S]*?)```/g

// Regex para detectar flashcards gerados pela IA
// Aceita: ```flashcards:Titulo ou detecta padrão FLASHCARD X ou **CARD X**
const FLASHCARD_BLOCK_REGEX = /```flashcards?(?::([^\n]*))?\n([\s\S]*?)```/g

// Regex para detectar flashcards em formato JSON direto
const FLASHCARD_JSON_REGEX = /```(?:json)?\s*\n?\s*(\[\s*\{[^`]*"frente"[^`]*"verso"[^`]*\}\s*\])\s*```/g

// Funcao para extrair flashcards do texto formatado - VERSÃO MELHORADA
function extractFlashcardsFromText(text: string): { titulo: string; cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: string }> } | null {
  // Detectar titulo dos flashcards
  const tituloMatch = text.match(/#+\s*(?:🃏|📝|🧠)?\s*(?:FLASHCARDS?|Flashcards?):?\s*([^\n]+)/i) ||
                      text.match(/\*\*(?:FLASHCARDS?|Flashcards?):?\s*([^*\n]+)\*\*/i) ||
                      text.match(/Flashcards?:?\s+([^\n]+)/i)
  const titulo = tituloMatch ? tituloMatch[1].trim() : 'Flashcards'

  const cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: string }> = []

  // PADRÃO 1: Formato JSON array - MAIS COMUM (a IA geralmente gera assim)
  const jsonArrayMatch = text.match(/\[\s*\{[\s\S]*?"frente"[\s\S]*?"verso"[\s\S]*?\}\s*\]/g)
  if (jsonArrayMatch) {
    for (const jsonStr of jsonArrayMatch) {
      try {
        const parsed = JSON.parse(jsonStr)
        if (Array.isArray(parsed)) {
          parsed.forEach((card, idx) => {
            if (card.frente && card.verso) {
              cards.push({
                id: `flashcard-${idx + 1}-${Date.now()}`,
                frente: card.frente,
                verso: card.verso,
                referencia: card.referencia,
                tags: card.tags,
                dificuldade: card.dificuldade
              })
            }
          })
        }
      } catch (e) {
        console.log('[Flashcards] Erro ao parsear JSON array:', e)
      }
    }
  }

  // Se encontrou via JSON, retornar
  if (cards.length >= 2) {
    return { titulo, cards }
  }

  // PADRÃO 2: Formato JSON objeto único com array de cards
  const jsonObjMatch = text.match(/\{[\s\S]*?"cards?"[\s\S]*?:\s*\[[\s\S]*?\][\s\S]*?\}/g)
  if (jsonObjMatch) {
    for (const jsonStr of jsonObjMatch) {
      try {
        const parsed = JSON.parse(jsonStr)
        const cardsArray = parsed.cards || parsed.flashcards
        if (Array.isArray(cardsArray)) {
          cardsArray.forEach((card: { frente?: string; verso?: string; referencia?: string; tags?: string[]; dificuldade?: string }, idx: number) => {
            if (card.frente && card.verso) {
              cards.push({
                id: `flashcard-${idx + 1}-${Date.now()}`,
                frente: card.frente,
                verso: card.verso,
                referencia: card.referencia,
                tags: card.tags,
                dificuldade: card.dificuldade
              })
            }
          })
        }
      } catch (e) {
        console.log('[Flashcards] Erro ao parsear JSON objeto:', e)
      }
    }
  }

  if (cards.length >= 2) {
    return { titulo, cards }
  }

  // PADRÃO 3: **CARD X** ou FLASHCARD X (markdown)
  const cardPattern = /(?:\*\*(?:CARD|FLASHCARD)\s*(\d+)\*\*|(?:🃏|📝)\s*(?:CARD|FLASHCARD)\s*(\d+))(?:\s*[-–]\s*[^\n]*)?\n+\*\*(?:FRENTE|Frente):\*\*\s*([^\n]+(?:\n(?!\*\*(?:VERSO|Verso)).*)*)\n+\*\*(?:VERSO|Verso):\*\*\s*([\s\S]*?)(?=\n---|\n\*\*(?:CARD|FLASHCARD)|\n🃏|\n📝|$)/gi

  let match
  while ((match = cardPattern.exec(text)) !== null) {
    const cardNum = match[1] || match[2]
    const frente = match[3].trim().replace(/\n/g, ' ')
    const verso = match[4].trim()

    cards.push({
      id: `flashcard-${cardNum}-${Date.now()}`,
      frente,
      verso
    })
  }

  // PADRÃO 4: Formato simplificado com --- separador
  if (cards.length === 0) {
    const simplePattern = /(?:\*\*)?(?:PERGUNTA|FRENTE|Q)(?:\d+)?(?:\*\*)?[:\s]+([^\n]+)\n+(?:\*\*)?(?:RESPOSTA|VERSO|A)(?:\d+)?(?:\*\*)?[:\s]+([\s\S]*?)(?=\n---|\n(?:\*\*)?(?:PERGUNTA|FRENTE|Q)|\$)/gi

    while ((match = simplePattern.exec(text)) !== null) {
      cards.push({
        id: `flashcard-${cards.length + 1}-${Date.now()}`,
        frente: match[1].trim(),
        verso: match[2].trim()
      })
    }
  }

  // Retornar se tem pelo menos 2 cards (era 3, reduzido para 2)
  if (cards.length >= 2) {
    return { titulo, cards }
  }

  return null
}

// Objeto para detectar questões INCOMPLETAS durante streaming (sem o ``` final)
// CORREÇÃO: O regex antigo usava [\s\S]*$ que capturava tudo até o final do texto,
// ignorando completamente qualquer ``` de fechamento. Agora usamos uma função
// que verifica CORRETAMENTE se existe um fechamento válido.
// Variável para controlar rate-limit de logs
let lastIncompleteLogTime = 0
const INCOMPLETE_LOG_INTERVAL = 2000 // Log a cada 2 segundos no máximo

const INCOMPLETE_QUESTION_REGEX = {
  test: (content: string): boolean => {
    // Encontrar todas as aberturas de bloco ```questao ou ```question
    const openMatches = [...content.matchAll(/```quest(?:ao|ion)(?::[^\n]*)?\n/g)]
    if (openMatches.length === 0) return false

    // Para cada abertura, verificar se existe um fechamento correspondente
    for (const openMatch of openMatches) {
      const startIndex = openMatch.index! + openMatch[0].length
      const afterOpen = content.substring(startIndex)

      // Procurar por ``` no início de uma linha (fechamento de bloco de código)
      // O fechamento DEVE estar no início de uma linha (após \n ou no início)
      const closeMatch = afterOpen.match(/([\s\S]*?)(\n```|\n\s*```)/)

      // Se não encontrou fechamento, esta questão está incompleta
      if (!closeMatch) {
        // Rate-limit logs para evitar spam no console
        const now = Date.now()
        if (now - lastIncompleteLogTime > INCOMPLETE_LOG_INTERVAL) {
          lastIncompleteLogTime = now
          console.log('[INCOMPLETE_QUESTION] Detectada, posição:', openMatch.index, 'len:', content.length)
        }
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

// Interface para dados de simulado
interface SimuladoData {
  titulo: string
  disciplina: string
  total_questoes: number
  tempo_estimado: string
  dificuldade_media: string
  questoes: Array<{
    numero: number
    tipo: string
    dificuldade: string
    tema: string
    enunciado: string
    alternativas: Array<{ letra: string; texto: string }>
    gabarito_comentado: {
      resposta_correta: string
      explicacao: string
      ponto_chave?: string
    }
  }>
}

interface Artifact {
  type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging' | 'converted_ascii' | 'question' | 'flashcards' | 'simulado'
  subtype?: string
  title?: string
  content: string
  startIndex: number
  endIndex: number
  originalAscii?: string  // Guarda o ASCII original para referência
  conversionType?: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'
  questionData?: Question  // Dados estruturados da questão
  flashcardData?: { titulo: string; cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: string }> }
  simuladoData?: SimuladoData  // Dados estruturados do simulado
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

// Rate-limit para logs de hideIncompleteQuestions
let lastHideLogTime = 0
const HIDE_LOG_INTERVAL = 3000 // Log a cada 3 segundos no máximo

// Cache para evitar reprocessamento excessivo
let lastProcessedContentLength = 0
let lastProcessedResult: string | null = null

// Função para detectar e remover blocos de questão incompletos durante streaming
// Isso evita mostrar o JSON bruto enquanto a questão está sendo gerada
// Agora também extrai dados parciais para mostrar no skeleton
function hideIncompleteQuestions(content: string): string {
  // Otimização: se o conteúdo não mudou significativamente, retornar resultado cacheado
  // Considera "significativo" se mudou mais de 50 caracteres ou passou de 5 segundos
  const contentLengthDiff = Math.abs(content.length - lastProcessedContentLength)
  if (contentLengthDiff < 50 && lastProcessedResult !== null) {
    return lastProcessedResult
  }

  // Verifica se há um bloco de questão incompleto (iniciado mas não fechado)
  if (INCOMPLETE_QUESTION_REGEX.test(content)) {
    // Encontrar a ÚLTIMA abertura de bloco que NÃO tem fechamento
    const openMatches = [...content.matchAll(/```quest(?:ao|ion)(?::[^\n]*)?\n/g)]

    for (let i = openMatches.length - 1; i >= 0; i--) {
      const openMatch = openMatches[i]
      const startIndex = openMatch.index! + openMatch[0].length
      const afterOpen = content.substring(startIndex)

      // Verificar se este bloco específico tem fechamento (``` no início de linha)
      const closeMatch = afterOpen.match(/([\s\S]*?)(\n```|\n\s*```)/)

      if (!closeMatch) {
        // Este é o bloco incompleto - extrair dados parciais
        const incompleteJson = afterOpen
        lastPartialQuestionData = extractPartialQuestionData(incompleteJson, content)

        // Rate-limit logs
        const now = Date.now()
        if (now - lastHideLogTime > HIDE_LOG_INTERVAL) {
          lastHideLogTime = now
          console.log('[ArtifactRenderer] Questão incompleta, skeleton ativo', {
            hasEnunciado: !!lastPartialQuestionData.enunciado,
            alternativasCount: lastPartialQuestionData.alternativasCount || 0,
            questionIndex: lastPartialQuestionData.questionIndex,
            jsonLength: incompleteJson.length
          })
        }

        // Remove o bloco incompleto e adiciona um marcador especial
        const beforeBlock = content.substring(0, openMatch.index)
        // Usar marcador especial que será renderizado como skeleton
        const result = beforeBlock + '\n\n[QUESTION_STREAMING_SKELETON]\n'

        // Cachear resultado
        lastProcessedContentLength = content.length
        lastProcessedResult = result

        return result
      }
    }
  }

  // Limpar dados parciais se não há questão incompleta
  lastPartialQuestionData = null

  // Cachear resultado
  lastProcessedContentLength = content.length
  lastProcessedResult = content

  return content
}

// Rate-limit para logs de isCompleteQuestionJson
let lastCompleteCheckLogTime = 0
const COMPLETE_CHECK_LOG_INTERVAL = 5000 // Log a cada 5 segundos no máximo

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
      // Rate-limit log de sucesso
      const now = Date.now()
      if (now - lastCompleteCheckLogTime > COMPLETE_CHECK_LOG_INTERVAL) {
        lastCompleteCheckLogTime = now
        console.log('[ArtifactRenderer] JSON completo:', {
          alternativasCount: parsed.alternativas.length,
          hasGabarito
        })
      }
      return true
    }

    return false
  } catch {
    // Não logar erros de parse - são esperados durante streaming
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

// Rate-limit para logs de reparo
let lastRepairLogTime = 0
const REPAIR_LOG_INTERVAL = 5000 // Log a cada 5 segundos

// Tenta reparar JSON incompleto de questão - versão robusta
function tryRepairQuestionJson(jsonStr: string): string | null {
  let repaired = jsonStr.trim()
  const now = Date.now()
  const shouldLog = now - lastRepairLogTime > REPAIR_LOG_INTERVAL
  if (shouldLog) {
    lastRepairLogTime = now
    console.log('[ArtifactRenderer] Tentando reparo de JSON, tamanho:', repaired.length)
  }

  // =====================================================
  // FASE 1: Detectar e corrigir strings truncadas
  // =====================================================

  // Contar aspas - se ímpar, temos uma string não fechada
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length
  const hasUnclosedString = quoteCount % 2 !== 0

  if (hasUnclosedString && shouldLog) {
    console.log('[ArtifactRenderer] String não fechada detectada')

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
      if (shouldLog) console.log('[ArtifactRenderer] JSON reparado via fechamento de brackets')
      return repaired
    }
  } catch {
    // Continuar para próxima fase
  }

  // =====================================================
  // FASE 5: Extração manual de campos (fallback robusto)
  // =====================================================

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

  // Log apenas se permitido pelo rate-limit
  if (shouldLog) {
    console.log('[ArtifactRenderer] Extração manual:', {
      hasEnunciado: !!enunciado,
      alternativasCount: alternativas.length,
      hasGabarito: !!gabaritoComentado
    })
  }

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
    if (shouldLog) console.log('[ArtifactRenderer] JSON reconstruído, alternativas:', alternativas.length)
    return reconstructedJson
  }

  // =====================================================
  // FASE 6: Último recurso - truncamento progressivo
  // =====================================================

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
        if (shouldLog) console.log('[ArtifactRenderer] JSON recuperado via truncamento')
        return attempt
      }
    } catch {
      // Continuar tentando
    }
  }

  return null
}

function parseArtifacts(content: string): { parts: (string | Artifact)[]; artifacts: Artifact[]; hasIncompleteQuestion: boolean } {
  const artifacts: Artifact[] = []
  let lastIndex = 0
  const parts: (string | Artifact)[] = []

  // Detectar se há questão incompleta para mostrar indicador de carregamento
  const hasIncompleteQuestion = INCOMPLETE_QUESTION_REGEX.test(content)

  // Rate-limit para logs de parseArtifacts
  const parseArtifactsLogAllowed = Date.now() - lastHideLogTime > 5000

  // Contar questões completas no conteúdo (apenas para verificação interna)
  const completedQuestions = content.match(/```quest(?:ao|ion)(?::[^\n]*)?\n[\s\S]*?```/g)
  if ((completedQuestions || hasIncompleteQuestion) && parseArtifactsLogAllowed) {
    console.log('[ArtifactRenderer] parseArtifacts:', {
      contentLength: content.length,
      completedQuestionsCount: completedQuestions?.length || 0,
      hasIncompleteQuestion
    })
  }

  // Processar conteúdo, escondendo blocos incompletos
  const processedContent = hideIncompleteQuestions(content)

  // Combinar todas as regex em uma busca
  const allMatches: Array<{
    match: RegExpMatchArray
    type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging' | 'converted_ascii' | 'question' | 'flashcards' | 'simulado'
    asciiType?: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'
    convertedContent?: string
    originalAscii?: string
    questionData?: Question
    flashcardData?: { titulo: string; cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: string }> }
    simuladoData?: SimuladoData
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

  // Buscar simulados gerados pela IA (formato JSON completo)
  const simuladoRegex = new RegExp(SIMULADO_REGEX.source, 'g')
  while ((match = simuladoRegex.exec(processedContent)) !== null) {
    try {
      const titulo = match[1]?.trim() || 'Simulado'
      const jsonContent = match[2].trim()
      const simuladoData = JSON.parse(jsonContent) as SimuladoData

      // Validar estrutura mínima
      if (simuladoData.questoes && Array.isArray(simuladoData.questoes) && simuladoData.questoes.length >= 2) {
        // Garantir campos obrigatórios
        if (!simuladoData.titulo) simuladoData.titulo = titulo
        if (!simuladoData.total_questoes) simuladoData.total_questoes = simuladoData.questoes.length
        if (!simuladoData.tempo_estimado) simuladoData.tempo_estimado = `${simuladoData.questoes.length * 3} minutos`
        if (!simuladoData.disciplina) simuladoData.disciplina = 'Medicina'
        if (!simuladoData.dificuldade_media) simuladoData.dificuldade_media = 'medio'

        allMatches.push({ match, type: 'simulado', simuladoData })
        console.log('[ArtifactRenderer] Simulado detectado:', simuladoData.titulo, 'com', simuladoData.questoes.length, 'questões')
      }
    } catch (error) {
      console.log('[ArtifactRenderer] Erro ao parsear simulado:', error)
    }
  }

  // Buscar questões geradas pela IA (COMPLETAS ou que podem ser reparadas)
  const questionRegex = new RegExp(QUESTION_REGEX.source, 'g')
  let questionMatchCount = 0
  // Rate-limit para logs de parsing
  const parseLogAllowed = Date.now() - lastRepairLogTime > 3000

  while ((match = questionRegex.exec(processedContent)) !== null) {
    questionMatchCount++

    try {
      let questionJson = match[1].trim()

      // Primeiro tentar como está
      if (!isCompleteQuestionJson(questionJson)) {

        // Tentar reparar JSON incompleto
        const repaired = tryRepairQuestionJson(questionJson)
        if (repaired) {
          questionJson = repaired
        } else {
          // Não foi possível reparar, pular
          continue
        }
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

      // Log apenas se permitido pelo rate-limit
      if (parseLogAllowed) {
        console.log('[ArtifactRenderer] Questão', questionData.numero, 'processada')
      }
    } catch (error) {
      if (parseLogAllowed) {
        console.error('[ArtifactRenderer] Erro ao parsear questão:', error)
      }
    }
  }

  // Buscar flashcards em formato JSON direto (bloco de código ```json com array)
  const flashcardJsonRegex = /```(?:json)?\s*\n(\s*\[[\s\S]*?"frente"[\s\S]*?"verso"[\s\S]*?\])\s*\n```/g
  let flashcardJsonMatch
  while ((flashcardJsonMatch = flashcardJsonRegex.exec(processedContent)) !== null) {
    try {
      const parsed = JSON.parse(flashcardJsonMatch[1])
      if (Array.isArray(parsed) && parsed.length >= 2 && parsed[0].frente && parsed[0].verso) {
        const flashcardData = {
          titulo: 'Flashcards',
          cards: parsed.map((card: { frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: string }, idx: number) => ({
            id: `flashcard-${idx + 1}-${Date.now()}`,
            frente: card.frente,
            verso: card.verso,
            referencia: card.referencia,
            tags: card.tags,
            dificuldade: card.dificuldade
          }))
        }

        allMatches.push({
          match: flashcardJsonMatch,
          type: 'flashcards',
          flashcardData
        })

        console.log('[ArtifactRenderer] Flashcards JSON detectados:', flashcardData.cards.length)
      }
    } catch (e) {
      console.log('[ArtifactRenderer] Erro ao parsear flashcards JSON')
    }
  }

  // Buscar flashcards no texto (formato markdown com FRENTE/VERSO)
  // Só processa se não encontrou questões e não encontrou flashcards JSON
  if (questionMatchCount === 0 && !allMatches.some(m => m.type === 'flashcards')) {
    const flashcardData = extractFlashcardsFromText(processedContent)
    if (flashcardData && flashcardData.cards.length >= 2) {
      // Criar um match sintético que engloba todo o conteúdo de flashcards
      const syntheticMatch = ['', flashcardData.titulo] as RegExpMatchArray
      syntheticMatch.index = 0
      syntheticMatch.input = processedContent

      allMatches.push({
        match: syntheticMatch,
        type: 'flashcards',
        flashcardData
      })

      console.log('[ArtifactRenderer] Flashcards markdown detectados:', flashcardData.cards.length)
    }
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
    } else if (type === 'flashcards' && matchData.flashcardData) {
      // Flashcards interativos
      artifact = {
        type: 'flashcards',
        title: matchData.flashcardData.titulo,
        content: '', // O conteudo fica em flashcardData
        startIndex,
        endIndex,
        flashcardData: matchData.flashcardData
      }
    } else if (type === 'simulado' && matchData.simuladoData) {
      // Simulado completo
      artifact = {
        type: 'simulado',
        title: matchData.simuladoData.titulo,
        content: '', // O conteudo fica em simuladoData
        startIndex,
        endIndex,
        simuladoData: matchData.simuladoData
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

// Cache de hashes calculados pelo servidor
const hashCacheRenderer: Record<string, string> = {}

// Função assíncrona para obter hash via API (MD5 real)
async function getQuestionHashRenderer(enunciado: string): Promise<string> {
  if (hashCacheRenderer[enunciado]) return hashCacheRenderer[enunciado]

  try {
    const response = await fetch('/api/medicina/ia/questoes/hash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enunciado })
    })
    if (response.ok) {
      const data = await response.json()
      hashCacheRenderer[enunciado] = data.hash
      return data.hash
    }
  } catch (error) {
    console.error('Erro ao calcular hash:', error)
  }
  return ''
}

// Versão síncrona que usa o cache
function getQuestionHashSyncRenderer(enunciado: string): string {
  return hashCacheRenderer[enunciado] || ''
}

// ============================================================
// COMPONENTE DE IMAGEM MEMOIZADO PARA EVITAR FLICKERING
// ============================================================
interface MemoizedImageProps {
  src: string
  alt: string
  onClickImage: (src: string, alt: string) => void
}

// Cache global de imagens já carregadas (persistente entre renders)
const loadedImagesCache = new Set<string>()

const MemoizedImage = memo(function MemoizedImage({ src, alt, onClickImage }: MemoizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(() => loadedImagesCache.has(src))
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Verificar se imagem já está no cache do browser
  useEffect(() => {
    if (loadedImagesCache.has(src)) {
      setIsLoaded(true)
      return
    }

    // Verificar se a imagem já está carregada no DOM
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoaded(true)
      loadedImagesCache.add(src)
    }
  }, [src])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    loadedImagesCache.add(src)
  }, [src])

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  const handleClick = useCallback(() => {
    onClickImage(src, alt)
  }, [src, alt, onClickImage])

  if (hasError) {
    return null // Não renderizar se houver erro
  }

  return (
    <div
      className="my-2 max-w-md group"
      style={{ contain: 'layout', minHeight: isLoaded ? 'auto' : '200px', marginLeft: 0, marginRight: 'auto' }}
    >
      <button
        onClick={handleClick}
        className="relative w-full bg-slate-800/50 rounded-lg overflow-hidden border border-white/10 hover:border-blue-500/50 transition-colors cursor-zoom-in"
        title="Clique para ampliar"
      >
        {/* Placeholder skeleton - só aparece se não carregou ainda */}
        {!isLoaded && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 animate-pulse"
            style={{ zIndex: 1, minHeight: '200px' }}
          />
        )}
        {/* Ícone de zoom no hover */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/60 p-1.5 rounded-full">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt || 'Imagem médica'}
          loading="eager"
          decoding="sync"
          className={`relative z-10 w-full h-auto max-h-[280px] object-contain rounded-lg transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ minHeight: isLoaded ? 'auto' : '150px', backgroundColor: 'white' }}
          onLoad={handleLoad}
          onError={handleError}
        />
      </button>
    </div>
  )
}, (prevProps, nextProps) => {
  // Só re-renderiza se src ou alt mudar
  return prevProps.src === nextProps.src && prevProps.alt === nextProps.alt
})

function ArtifactRendererComponent({
  content,
  userId,
  messageId,
  conversaId,
  chatMode,
  planoUsuario = 'gratuito',
  trialAtivo = false,
  onUpgradeClick
}: ArtifactRendererProps) {
  // Debounce do conteúdo para evitar recálculos excessivos durante streaming (150ms)
  const debouncedContent = useDebouncedValue(content, 150)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { parts, artifacts, hasIncompleteQuestion } = useMemo(() => parseArtifacts(debouncedContent), [debouncedContent])
  const { addArtifact, artifacts: storeArtifacts, updateQuestionAnswer } = useArtifactsStore()
  const addedArtifactsRef = useRef<Set<string>>(new Set())

  // Cache de respostas anteriores para este componente
  const [respostasCache, setRespostasCache] = useState<Record<string, {
    resposta_usuario: string
    acertou: boolean
    tentativas: number
  }>>({})
  const loadedRespostasRef = useRef(false)

  // Carregar respostas do banco na montagem do componente
  useEffect(() => {
    const loadRespostas = async () => {
      if (!userId || !conversaId || loadedRespostasRef.current) return
      loadedRespostasRef.current = true

      try {
        const response = await fetch(`/api/medicina/ia/questoes?user_id=${userId}&conversa_id=${conversaId}`)
        if (response.ok) {
          const data = await response.json()
          const respostasMap: Record<string, { resposta_usuario: string; acertou: boolean; tentativas: number }> = {}
          for (const r of data.respostas || []) {
            respostasMap[r.questao_hash] = {
              resposta_usuario: r.resposta_usuario,
              acertou: r.acertou,
              tentativas: r.tentativas || 1
            }
          }
          setRespostasCache(respostasMap)

          // Pré-calcular hashes para questões que temos
          for (const artifact of artifacts) {
            if (artifact.type === 'question' && artifact.questionData?.enunciado) {
              await getQuestionHashRenderer(artifact.questionData.enunciado)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar respostas:', error)
      }
    }
    loadRespostas()
  }, [userId, conversaId, artifacts])

  // Extrair termos de busca de imagens médicas reais
  const imageSearchTerms = useMemo(() => extractImageSearchTerms(content), [content])

  // Extrair referências/fontes do conteúdo para citações interativas
  const references = useMemo(() => extractReferences(content), [content])

  // Função para renderizar texto com citações interativas
  const renderTextWithCitations = useCallback((text: string | React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string') return text
    if (references.length === 0 || !CITATION_REGEX.test(text)) return text
    return processCitations(text, references)
  }, [references])

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
        chatMode,
        metadata: {
          subtype: artifact.subtype,
          question: artifact.questionData
        }
      })

      addedArtifactsRef.current.add(artifactKey)
    })
  }, [artifacts, messageId, conversaId, chatMode, addArtifact, storeArtifacts])

  // Obter dados parciais da questão sendo gerada
  const partialQuestionData = useMemo(() => getPartialQuestionData(), [content])

  // Estado do modal de imagem fullscreen
  const [imageModalState, setImageModalState] = useState<{ src: string; alt: string } | null>(null)

  // Função para abrir modal de imagem
  const openImageModal = useCallback((src: string, alt: string) => {
    setImageModalState({ src, alt })
  }, [])

  // Função para fechar modal de imagem
  const closeImageModal = useCallback(() => {
    setImageModalState(null)
  }, [])

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

                // Paragraphs - texto menor com suporte a citações interativas
                p: ({ children }) => {
                  // Processar citações no texto
                  const processedChildren = Array.isArray(children)
                    ? children.map((child, i) =>
                        typeof child === 'string'
                          ? <span key={i}>{renderTextWithCitations(child)}</span>
                          : child
                      )
                    : typeof children === 'string'
                      ? renderTextWithCitations(children)
                      : children

                  return (
                    <p className="text-white/80 leading-relaxed mb-2 text-sm">
                      {processedChildren}
                    </p>
                  )
                },

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
                li: ({ children }) => {
                  // Processar citações em itens de lista
                  const processedChildren = Array.isArray(children)
                    ? children.map((child, i) =>
                        typeof child === 'string'
                          ? <span key={i}>{renderTextWithCitations(child)}</span>
                          : child
                      )
                    : typeof children === 'string'
                      ? renderTextWithCitations(children)
                      : children

                  return (
                    <li className="text-white/80 text-sm">
                      {processedChildren}
                    </li>
                  )
                },

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

                // Images - usando componente memoizado para evitar flickering
                // Clicáveis para abrir modal fullscreen
                img: ({ src, alt }) => {
                  if (typeof src !== 'string' || !src) return null
                  return (
                    <MemoizedImage
                      src={src}
                      alt={typeof alt === 'string' ? alt : 'Imagem médica'}
                      onClickImage={openImageModal}
                    />
                  )
                }
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

          // Buscar resposta anterior do cache (pelo hash se disponível)
          const questionHash = part.questionData.enunciado ? getQuestionHashSyncRenderer(part.questionData.enunciado) : ''
          const respostaAnterior = questionHash ? respostasCache[questionHash] : undefined

          // Se não temos hash ainda, tentar calcular em background
          if (part.questionData.enunciado && !questionHash) {
            getQuestionHashRenderer(part.questionData.enunciado)
          }

          return (
            <div key={index} className="my-2">
              <QuestionArtifactCard
                question={matchingArtifact?.metadata?.question || part.questionData}
                userId={userId}
                conversaId={conversaId}
                respostaAnterior={respostaAnterior}
                planoUsuario={planoUsuario}
                trialAtivo={trialAtivo}
                onUpgradeClick={onUpgradeClick}
                onAnswerSubmit={async (questionId, answer, correct) => {
                  // Sincronizar com a store de artefatos
                  if (matchingArtifact) {
                    updateQuestionAnswer(matchingArtifact.id, answer, correct)
                  }
                  // Atualizar cache local
                  const hash = await getQuestionHashRenderer(part.questionData?.enunciado || '')
                  if (hash) {
                    setRespostasCache(prev => ({
                      ...prev,
                      [hash]: { resposta_usuario: answer, acertou: correct, tentativas: (prev[hash]?.tentativas || 0) + 1 }
                    }))
                  }
                }}
              />
            </div>
          )
        }

        // Flashcards interativos estilo Anki
        if (part.type === 'flashcards' && part.flashcardData) {
          return (
            <div key={index} className="my-4">
              <FlashcardDeck
                titulo={part.flashcardData.titulo}
                cards={part.flashcardData.cards}
                userId={userId}
                conversaId={conversaId}
              />
            </div>
          )
        }

        // Simulado completo com múltiplas questões
        if (part.type === 'simulado' && part.simuladoData) {
          return (
            <div key={index} className="my-4">
              <SimuladoCard
                simulado={part.simuladoData}
                userId={userId}
                conversaId={conversaId}
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

      {/* Modal de imagem fullscreen */}
      {imageModalState && (
        <ImageModal
          src={imageModalState.src}
          alt={imageModalState.alt}
          isOpen={true}
          onClose={closeImageModal}
        />
      )}
    </div>
  )
}

// Memoizar o componente para evitar re-renders desnecessários durante streaming
// Só re-renderiza quando content ou outras props significativas mudam
const ArtifactRenderer = memo(ArtifactRendererComponent, (prevProps, nextProps) => {
  // Comparação personalizada - só re-renderiza se o conteúdo realmente mudou
  return prevProps.content === nextProps.content &&
         prevProps.userId === nextProps.userId &&
         prevProps.messageId === nextProps.messageId &&
         prevProps.conversaId === nextProps.conversaId &&
         prevProps.chatMode === nextProps.chatMode &&
         prevProps.planoUsuario === nextProps.planoUsuario &&
         prevProps.trialAtivo === nextProps.trialAtivo
})

export default ArtifactRenderer
