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
    <div className="bg-white border border-slate-200 rounded-xl p-6 my-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
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
    <div className="bg-white border border-slate-200 rounded-xl p-6 my-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
        <span>Carregando diagrama de camadas...</span>
      </div>
    </div>
  )
})

// Importar ModernFlowchart dinamicamente
const ModernFlowchart = dynamic(() => import('./ModernFlowchart'), {
  ssr: false,
  loading: () => (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span>Carregando fluxograma...</span>
      </div>
    </div>
  )
})

// Importar TreeDiagram dinamicamente
const TreeDiagram = dynamic(() => import('./TreeDiagram'), {
  ssr: false,
  loading: () => (
    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
        <span>Carregando organograma...</span>
      </div>
    </div>
  )
})

// Importar StagingTable dinamicamente
const StagingTable = dynamic(() => import('./StagingTable'), {
  ssr: false,
  loading: () => (
    <div className="bg-white border border-slate-200 rounded-xl p-6 my-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
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
      <div className="flex items-center gap-2 text-slate-500">
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 my-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
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
    <div className="bg-[#1A2332] border border-slate-200 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-slate-500">
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
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-200 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-slate-500">
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
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-200 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-slate-500">
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
    <div className="bg-[#1A2332] border border-slate-200 rounded-xl p-6 my-4">
      <div className="flex items-center gap-2 text-slate-500">
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

// Regex para detectar fluxogramas modernos
const MODERN_FLOWCHART_REGEX = /```flowchart:([^\n]*)\n([\s\S]*?)```/g

// Regex para detectar organogramas em árvore
const TREE_DIAGRAM_REGEX = /```(?:tree|organograma):([^\n]*)\n([\s\S]*?)```/g

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

// NOTA: As regex FLOWCHART_JSON_REGEX e TREE_JSON_REGEX foram substituídas
// pela função extractDiagramJsons que é mais robusta e detecta JSON tanto em
// blocos de código quanto JSON solto no texto

// ============================================================
// FUNÇÕES ROBUSTAS PARA EXTRAIR JSON DE DIAGRAMAS
// ============================================================

/**
 * Extrai um objeto JSON balanceado a partir de uma posição no texto
 * Usa contagem de chaves para encontrar o fim correto do JSON
 */
function extractBalancedJson(text: string, startIndex: number): { json: string; endIndex: number } | null {
  if (text[startIndex] !== '{') return null

  let depth = 0
  let inString = false
  let escapeNext = false

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\' && inString) {
      escapeNext = true
      continue
    }

    if (char === '"' && !escapeNext) {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{') depth++
      if (char === '}') {
        depth--
        if (depth === 0) {
          return {
            json: text.substring(startIndex, i + 1),
            endIndex: i + 1
          }
        }
      }
    }
  }

  return null
}

/**
 * Interface para resultado de detecção de diagrama
 */
interface DiagramDetection {
  type: 'flowchart' | 'tree'
  json: string
  data: unknown
  startIndex: number
  endIndex: number
  title: string
}

/**
 * Detecta e extrai todos os JSONs de diagramas (fluxograma/organograma) do texto
 * Funciona tanto para JSON em blocos de código quanto JSON solto
 */
function extractDiagramJsons(content: string): DiagramDetection[] {
  const diagrams: DiagramDetection[] = []
  const processedRanges: Array<{ start: number; end: number }> = []

  // Função para verificar se uma posição está dentro de um bloco de código já processado
  const isInProcessedRange = (index: number): boolean => {
    return processedRanges.some(r => index >= r.start && index < r.end)
  }

  // Função para verificar se uma posição está dentro de um bloco de código ```
  const isInsideCodeBlock = (index: number): boolean => {
    const beforeText = content.substring(0, index)
    const codeBlockCount = (beforeText.match(/```/g) || []).length
    return codeBlockCount % 2 !== 0
  }

  // 1. Primeiro, processar blocos de código ```json
  const codeBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g
  let codeMatch
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    const blockContent = codeMatch[1].trim()
    const blockStart = codeMatch.index
    const blockEnd = blockStart + codeMatch[0].length

    // Tentar parsear como JSON
    try {
      const data = JSON.parse(blockContent)

      // Verificar se é fluxograma (tem nodes e edges)
      if (data.nodes && Array.isArray(data.nodes) && data.edges && Array.isArray(data.edges)) {
        diagrams.push({
          type: 'flowchart',
          json: blockContent,
          data,
          startIndex: blockStart,
          endIndex: blockEnd,
          title: data.title || 'Fluxograma'
        })
        processedRanges.push({ start: blockStart, end: blockEnd })
        continue
      }

      // Verificar se é organograma (tem data.children)
      if (data.data && data.data.children && Array.isArray(data.data.children)) {
        diagrams.push({
          type: 'tree',
          json: blockContent,
          data,
          startIndex: blockStart,
          endIndex: blockEnd,
          title: data.title || 'Organograma'
        })
        processedRanges.push({ start: blockStart, end: blockEnd })
        continue
      }
    } catch {
      // Não é JSON válido, ignorar
    }
  }

  // 2. Depois, procurar JSON solto no texto (fora de blocos de código)
  // Procurar por padrões que indicam início de JSON de diagrama
  const potentialStarts = [
    ...content.matchAll(/\{\s*"title"\s*:/g),
    ...content.matchAll(/\{\s*"nodes"\s*:/g),
    ...content.matchAll(/\{\s*"data"\s*:\s*\{/g)
  ]

  for (const match of potentialStarts) {
    const startIndex = match.index!

    // Pular se já foi processado ou está dentro de bloco de código
    if (isInProcessedRange(startIndex)) continue
    if (isInsideCodeBlock(startIndex)) continue

    // Extrair JSON balanceado
    const extracted = extractBalancedJson(content, startIndex)
    if (!extracted) continue

    // Tentar parsear
    try {
      const data = JSON.parse(extracted.json)

      // Verificar se é fluxograma
      if (data.nodes && Array.isArray(data.nodes) && data.edges && Array.isArray(data.edges)) {
        // Verificar se não é duplicata
        const isDuplicate = diagrams.some(d =>
          d.startIndex === startIndex ||
          (d.type === 'flowchart' && d.title === (data.title || 'Fluxograma'))
        )
        if (!isDuplicate) {
          diagrams.push({
            type: 'flowchart',
            json: extracted.json,
            data,
            startIndex,
            endIndex: extracted.endIndex,
            title: data.title || 'Fluxograma'
          })
          processedRanges.push({ start: startIndex, end: extracted.endIndex })
        }
        continue
      }

      // Verificar se é organograma
      if (data.data && data.data.children && Array.isArray(data.data.children)) {
        const isDuplicate = diagrams.some(d =>
          d.startIndex === startIndex ||
          (d.type === 'tree' && d.title === (data.title || 'Organograma'))
        )
        if (!isDuplicate) {
          diagrams.push({
            type: 'tree',
            json: extracted.json,
            data,
            startIndex,
            endIndex: extracted.endIndex,
            title: data.title || 'Organograma'
          })
          processedRanges.push({ start: startIndex, end: extracted.endIndex })
        }
      }
    } catch {
      // JSON inválido, ignorar
    }
  }

  // Ordenar por posição no texto
  return diagrams.sort((a, b) => a.startIndex - b.startIndex)
}

// ============================================================
// VALIDAÇÃO E CORREÇÃO DE CÓDIGO MERMAID
// ============================================================

/**
 * Corrige erros comuns em código Mermaid
 */
function fixMermaidCode(code: string): string {
  let fixed = code.trim()

  // 1. Garantir que começa com declaração de tipo válida
  const validStarts = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline', 'gitGraph']
  const firstLine = fixed.split('\n')[0].trim().toLowerCase()
  const hasValidStart = validStarts.some(s => firstLine.startsWith(s.toLowerCase()))

  if (!hasValidStart) {
    // Se não tem início válido, assume flowchart TB
    fixed = 'flowchart TB\n' + fixed
  }

  // 2. Normalizar direções (TD/TB, LR, RL, BT)
  fixed = fixed.replace(/^(graph|flowchart)\s+(?!TB|TD|LR|RL|BT)/im, '$1 TB ')

  // 3. Corrigir setas mal formatadas
  fixed = fixed.replace(/--+>/g, '-->')  // --- → -->
  fixed = fixed.replace(/-+>/g, '-->')   // -> ou ---> → -->
  fixed = fixed.replace(/<--+/g, '<--')  // <--- → <--
  fixed = fixed.replace(/=+>/g, '==>')   // => ou ===> → ==>
  fixed = fixed.replace(/\.+>/g, '-.->')  // .> ou ..> → -.->

  // 4. Corrigir IDs com caracteres especiais (substituir por underscore)
  // IDs válidos em Mermaid: letras, números, underscore, hífen
  const lines = fixed.split('\n')
  const fixedLines = lines.map(line => {
    // Não modificar linhas de declaração de tipo ou subgraph
    if (/^\s*(graph|flowchart|subgraph|end|style|classDef|class|linkStyle)/i.test(line)) {
      return line
    }

    // Substituir caracteres problemáticos em IDs (exceto dentro de strings entre aspas ou colchetes)
    // Padrão: ID[texto] ou ID{texto} ou ID(texto) ou ID((texto)) etc.
    return line.replace(/^(\s*)([^\[\]{}()"\s]+)(\s*[\[\]{}(])/gm, (match, indent, id, rest) => {
      // Limpar ID: manter apenas letras, números, underscore, hífen
      const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '_')
      return indent + cleanId + rest
    })
  })
  fixed = fixedLines.join('\n')

  // 5. Corrigir labels com caracteres especiais não escapados
  // Labels entre aspas devem ter aspas internas escapadas
  fixed = fixed.replace(/\["([^"]*[áàâãéèêíìîóòôõúùûçñ][^"]*)"\]/g, (match, content) => {
    // Manter acentos, são suportados
    return match
  })

  // 6. Remover linhas vazias múltiplas
  fixed = fixed.replace(/\n{3,}/g, '\n\n')

  // 7. Corrigir subgraphs mal formatados
  fixed = fixed.replace(/subgraph\s+([^\["\n]+)\s*$/gm, 'subgraph $1')

  // 8. Garantir que subgraphs têm 'end'
  const subgraphCount = (fixed.match(/\bsubgraph\b/gi) || []).length
  const endCount = (fixed.match(/^\s*end\s*$/gm) || []).length
  if (subgraphCount > endCount) {
    for (let i = 0; i < subgraphCount - endCount; i++) {
      fixed += '\n    end'
    }
  }

  // 9. Corrigir comentários (devem começar com %%)
  fixed = fixed.replace(/^\s*\/\/(.*)$/gm, '%% $1')
  fixed = fixed.replace(/^\s*#([^#\[].*)?$/gm, '%% $1')

  // 10. Remover linhas que são apenas pontuação ou caracteres especiais
  fixed = fixed.replace(/^\s*[.,;:!?]+\s*$/gm, '')

  // 11. Corrigir definições de estilo mal formatadas
  fixed = fixed.replace(/style\s+(\w+)\s+fill\s*[:=]\s*/gi, 'style $1 fill:')
  fixed = fixed.replace(/style\s+(\w+)\s+stroke\s*[:=]\s*/gi, 'style $1 stroke:')

  // 12. Remover BOM e caracteres invisíveis
  fixed = fixed.replace(/^\uFEFF/, '')
  fixed = fixed.replace(/[\u200B-\u200D\uFEFF]/g, '')

  return fixed.trim()
}

/**
 * Valida se o código Mermaid é sintaticamente correto
 * Retorna null se válido, ou mensagem de erro se inválido
 */
function validateMermaidSyntax(code: string): string | null {
  const lines = code.trim().split('\n')

  if (lines.length === 0) {
    return 'Código vazio'
  }

  // Verificar primeira linha
  const firstLine = lines[0].trim().toLowerCase()
  const validTypes = ['graph', 'flowchart', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline', 'gitgraph']

  if (!validTypes.some(t => firstLine.startsWith(t))) {
    return `Tipo de diagrama inválido. Deve começar com: ${validTypes.join(', ')}`
  }

  // Verificar balanceamento de colchetes e chaves
  let brackets = 0
  let braces = 0
  let parens = 0
  let inString = false

  for (const char of code) {
    if (char === '"' && !inString) inString = true
    else if (char === '"' && inString) inString = false

    if (!inString) {
      if (char === '[') brackets++
      if (char === ']') brackets--
      if (char === '{') braces++
      if (char === '}') braces--
      if (char === '(') parens++
      if (char === ')') parens--
    }
  }

  if (brackets !== 0) return 'Colchetes não balanceados'
  if (braces !== 0) return 'Chaves não balanceadas'
  if (parens !== 0) return 'Parênteses não balanceados'

  // Verificar subgraphs
  const subgraphCount = (code.match(/\bsubgraph\b/gi) || []).length
  const endCount = (code.match(/^\s*end\s*$/gm) || []).length
  if (subgraphCount !== endCount) {
    return `Subgraphs não fechados: ${subgraphCount} subgraph(s), ${endCount} end(s)`
  }

  return null
}

// Tipo de dificuldade para flashcards
type FlashcardDificuldade = 'facil' | 'medio' | 'dificil'

// Função auxiliar para validar dificuldade
function parseDificuldade(value: unknown): FlashcardDificuldade | undefined {
  if (value === 'facil' || value === 'medio' || value === 'dificil') {
    return value
  }
  return undefined
}

// Funcao para extrair flashcards do texto formatado - VERSÃO MELHORADA
function extractFlashcardsFromText(text: string): { titulo: string; cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: FlashcardDificuldade }> } | null {
  // Detectar titulo dos flashcards
  const tituloMatch = text.match(/#+\s*(?:🃏|📝|🧠)?\s*(?:FLASHCARDS?|Flashcards?):?\s*([^\n]+)/i) ||
                      text.match(/\*\*(?:FLASHCARDS?|Flashcards?):?\s*([^*\n]+)\*\*/i) ||
                      text.match(/Flashcards?:?\s+([^\n]+)/i)
  const titulo = tituloMatch ? tituloMatch[1].trim() : 'Flashcards'

  const cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: FlashcardDificuldade }> = []

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
                dificuldade: parseDificuldade(card.dificuldade)
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
          cardsArray.forEach((card: { frente?: string; verso?: string; referencia?: string; tags?: string[]; dificuldade?: unknown }, idx: number) => {
            if (card.frente && card.verso) {
              cards.push({
                id: `flashcard-${idx + 1}-${Date.now()}`,
                frente: card.frente,
                verso: card.verso,
                referencia: card.referencia,
                tags: card.tags,
                dificuldade: parseDificuldade(card.dificuldade)
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
  type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging' | 'converted_ascii' | 'question' | 'flashcards' | 'simulado' | 'modern_flowchart' | 'tree_diagram'
  subtype?: string
  title?: string
  content: string
  startIndex: number
  endIndex: number
  originalAscii?: string  // Guarda o ASCII original para referência
  conversionType?: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'
  questionData?: Question  // Dados estruturados da questão
  flashcardData?: { titulo: string; cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: 'facil' | 'medio' | 'dificil' }> }
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

// Função para limpar texto renderizado no chat
// Remove gabarito, explicações e conteúdo que deveria ficar apenas na sidebar
function cleanRenderedTextForChat(content: string): string {
  if (!content) return content
  let cleaned = content

  // =====================================
  // 0. REMOVER BLOCOS COMPLETOS DE GABARITO COMENTADO (MAIS IMPORTANTE)
  // =====================================
  // CRÍTICO: Remover "GABARITO COMENTADO - Questão X" e TODO conteúdo até próxima questão/fim
  // Este padrão pega o bloco inteiro incluindo explicação e análise
  cleaned = cleaned.replace(/(?:^|\n)\s*(?:#{1,4}\s*)?\*{0,2}GABARITO\s+COMENTADO[^]*?(?=(?:\n\s*#{1,4}|\n\s*```questao|\n\s*\*{2}Questão|\n\s*\[Q\d+\]|$))/gi, '\n')

  // Remover variações: "## GABARITO COMENTADO", "**GABARITO COMENTADO**"
  cleaned = cleaned.replace(/(?:^|\n)\s*#{1,4}\s*GABARITO\s+COMENTADO[^\n]*[\s\S]*?(?=\n#{1,4}[^G]|\n```|$)/gi, '\n')

  // =====================================
  // 1. REMOVER GABARITO/RESPOSTA CORRETA
  // =====================================
  // Padrão: "✅ Resposta correta: Alternativa X" ou variações
  cleaned = cleaned.replace(/[✅✓☑]\s*(?:Resposta\s+)?[Cc]orreta:?\s*(?:Alternativa\s*)?[A-Ea-e][^\n]*/gi, '')
  cleaned = cleaned.replace(/(?:^|\n)\s*\*{0,2}[✅✓]\s*(?:Resposta\s+correta|Gabarito)[:\s]*\*{0,2}[^\n]*/gi, '\n')
  cleaned = cleaned.replace(/(?:^|\n)\s*Gabarito:?\s*(?:Alternativa\s*)?[A-E][^\n]*/gi, '\n')

  // =====================================
  // 2. REMOVER EXPLICAÇÃO DETALHADA (MAIS AGRESSIVO)
  // =====================================
  // Padrão: "📖 EXPLICAÇÃO DETALHADA:" e todo texto até próxima seção
  cleaned = cleaned.replace(/[📖📚🔍💡]\s*(?:EXPLICAÇÃO\s+DETALHADA|Explicação\s+Detalhada|EXPLICAÇÃO)[:\s]*[^]*?(?=\n\n(?:#{1,4}|```|\*{2}Questão|\[Q\d+\])|$)/gi, '')
  cleaned = cleaned.replace(/(?:^|\n)\s*\*{0,2}(?:EXPLICAÇÃO\s+DETALHADA|Explicação\s+Detalhada|EXPLICAÇÃO)[:\*\s]*\*{0,2}[^]*?(?=\n\n(?:#{1,4}|```|\*{2})|$)/gi, '\n')

  // =====================================
  // 3. REMOVER ANÁLISE DE ALTERNATIVAS
  // =====================================
  // Padrão: "**Alternativa A:** Texto..." ou "❌ Alternativa A: Texto..."
  cleaned = cleaned.replace(/(?:^|\n)\s*[❌✅⚠️•●]\s*\*{0,2}Alternativa\s+[A-Ea-e][:\*\s]*\*{0,2}[^\n]*(?:\n(?![❌✅⚠️•●\n#\*```])[^\n]*)*/gi, '\n')
  cleaned = cleaned.replace(/(?:^|\n)\s*\*{0,2}Alternativa\s+[A-Ea-e][:\*\s]+[^\n]*(?:\n(?![A-Z📊🎯❌✅⚠️•●\n#\*```])[^\n]*)*/gi, '\n')

  // =====================================
  // 4. REMOVER TÍTULOS REDUNDANTES DE DECKS
  // =====================================
  // Padrão: "- Ciclo Cardíaco e Circulação Sanguínea" ou similar em lista
  cleaned = cleaned.replace(/(?:^|\n)\s*[-•●]\s*[A-Za-zÀ-ÿ]+\s+[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)*\s*(?:\n|$)(?=\s*(?:#{1,4}|$|\n\n))/gi, '\n')

  // =====================================
  // 5. REMOVER SEÇÕES DE REFERÊNCIAS DE QUESTÕES
  // =====================================
  cleaned = cleaned.replace(/(?:^|\n)\s*\*{0,2}(?:Ponto[s]?\s+(?:-\s+)?[Cc]have|Referência[s]?|Dica[s]?\s+de\s+Estudo)[:\*\s]*\*{0,2}[^\n]*(?:\n(?![#\n```])[^\n]*)*/gi, '\n')

  // =====================================
  // 6. REMOVER BLOCOS DE "POR QUE ERROU"
  // =====================================
  cleaned = cleaned.replace(/(?:^|\n)\s*\*{0,2}(?:Por\s+que\s+(?:está\s+)?(?:errad[oa]|incorret[oa])|Por\s+que\s+a\s+alternativa)[:\*\s]*\*{0,2}[^]*?(?=\n\n|$)/gi, '\n')

  // =====================================
  // 7. REMOVER CITAÇÕES ÓRFÃS [1] [2] etc
  // =====================================
  // Remove citações que ficaram sozinhas após limpeza
  cleaned = cleaned.replace(/\s*\[\d+\]\s*/g, ' ')

  // =====================================
  // 8. LIMPEZA GERAL
  // =====================================
  // Remover múltiplas quebras de linha consecutivas
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  // Remover linhas que são apenas espaços
  cleaned = cleaned.replace(/^\s+$/gm, '')

  return cleaned.trim()
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
    type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging' | 'converted_ascii' | 'question' | 'flashcards' | 'simulado' | 'modern_flowchart' | 'tree_diagram'
    asciiType?: 'flowchart' | 'layers' | 'tree' | 'table' | 'generic'
    convertedContent?: string
    originalAscii?: string
    questionData?: Question
    flashcardData?: { titulo: string; cards: Array<{ id: string; frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: 'facil' | 'medio' | 'dificil' }> }
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

  // Buscar fluxogramas modernos (formato ```flowchart:Titulo)
  const modernFlowchartRegex = new RegExp(MODERN_FLOWCHART_REGEX.source, 'g')
  while ((match = modernFlowchartRegex.exec(processedContent)) !== null) {
    allMatches.push({ match, type: 'modern_flowchart' })
  }

  // Buscar organogramas em árvore (formato ```tree:Titulo)
  const treeDiagramRegex = new RegExp(TREE_DIAGRAM_REGEX.source, 'g')
  while ((match = treeDiagramRegex.exec(processedContent)) !== null) {
    allMatches.push({ match, type: 'tree_diagram' })
  }

  // ============================================================
  // NOVA ABORDAGEM ROBUSTA: Usar função extractDiagramJsons
  // Detecta JSON de diagramas tanto em blocos de código quanto soltos
  // ============================================================
  const detectedDiagrams = extractDiagramJsons(processedContent)

  for (const diagram of detectedDiagrams) {
    // Verificar se não foi já detectado pelos regex anteriores
    const alreadyDetected = allMatches.some(m =>
      m.match.index !== undefined &&
      Math.abs(m.match.index - diagram.startIndex) < 10
    )

    if (!alreadyDetected) {
      // Criar match sintético
      const originalText = processedContent.substring(diagram.startIndex, diagram.endIndex)
      const syntheticMatch = [originalText, diagram.title, diagram.json] as RegExpMatchArray
      syntheticMatch.index = diagram.startIndex
      syntheticMatch.input = processedContent

      if (diagram.type === 'flowchart') {
        allMatches.push({ match: syntheticMatch, type: 'modern_flowchart' })
        console.log('[ArtifactRenderer] Fluxograma detectado (função robusta):', diagram.title)
      } else if (diagram.type === 'tree') {
        allMatches.push({ match: syntheticMatch, type: 'tree_diagram' })
        console.log('[ArtifactRenderer] Organograma detectado (função robusta):', diagram.title)
      }
    }
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
          cards: parsed.map((card: { frente: string; verso: string; referencia?: string; tags?: string[]; dificuldade?: unknown }, idx: number) => ({
            id: `flashcard-${idx + 1}-${Date.now()}`,
            frente: card.frente,
            verso: card.verso,
            referencia: card.referencia,
            tags: card.tags,
            dificuldade: parseDificuldade(card.dificuldade)
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

  // Buscar flashcards no texto (formato markdown com FRENTE/VERSO ou JSON direto)
  // IMPORTANTE: Processa mesmo quando há questões na resposta!
  if (!allMatches.some(m => m.type === 'flashcards')) {
    const flashcardData = extractFlashcardsFromText(processedContent)
    if (flashcardData && flashcardData.cards.length >= 2) {
      // Encontrar a posição do JSON array no texto para removê-lo
      // Usar regex mais precisa para encontrar apenas o array JSON
      const jsonArrayPattern = /\[\s*\n?\s*\{[\s\S]*?"frente"[\s\S]*?"verso"[\s\S]*?\}\s*\n?\s*\]/
      const jsonMatch = processedContent.match(jsonArrayPattern)

      let matchIndex = 0
      let matchLength = 0

      if (jsonMatch && jsonMatch.index !== undefined) {
        matchIndex = jsonMatch.index
        matchLength = jsonMatch[0].length

        // Também remover o título "## 🃏 FLASHCARDS" se estiver logo antes do JSON
        const textBefore = processedContent.substring(Math.max(0, matchIndex - 200), matchIndex)
        const titleMatch = textBefore.match(/(?:#{1,3}\s*)?(?:🃏\s*)?(?:FLASHCARDS?[:\s-]*[^\n]*\n+)/i)
        if (titleMatch) {
          const titleStart = matchIndex - (textBefore.length - (titleMatch.index || 0))
          matchIndex = titleStart
          matchLength = jsonMatch.index! + jsonMatch[0].length - titleStart
        }
      }

      // Se não encontrou JSON mas encontrou flashcards via outro método, usar posição no final
      // Isso fará o FlashcardDeck ser adicionado ao final sem remover texto
      if (matchLength === 0) {
        matchIndex = processedContent.length
      }

      // Criar um match que engloba o JSON (e título) para removê-lo do texto
      const syntheticMatch = [processedContent.substring(matchIndex, matchIndex + matchLength), flashcardData.titulo] as RegExpMatchArray
      syntheticMatch.index = matchIndex
      syntheticMatch.input = processedContent

      allMatches.push({
        match: syntheticMatch,
        type: 'flashcards',
        flashcardData
      })

      console.log('[ArtifactRenderer] Flashcards detectados:', flashcardData.cards.length, 'posição:', matchIndex, 'length:', matchLength)
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
    // IMPORTANTE: Não incluir | simples para não confundir com tabelas markdown
    const asciiBlockPattern = /(?:^|\n)((?:[\s]*[┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬+].*\n?){3,})/gm
    let asciiMatch
    while ((asciiMatch = asciiBlockPattern.exec(processedContent)) !== null) {
      // Verificar se não está dentro de um bloco de código
      const beforeMatch = processedContent.substring(0, asciiMatch.index)
      const codeBlocksBeforeCount = (beforeMatch.match(/```/g) || []).length
      if (codeBlocksBeforeCount % 2 === 0) {
        // Não está dentro de um bloco de código
        const asciiContent = asciiMatch[1]
        
        // Verificar se é uma tabela markdown (tem linha de separação |---|)
        const isMarkdownTable = /\|[\s-:]+\|/.test(asciiContent) || /^\s*\|[^┌┐└┘├┤┬┴┼─│═║╔╗╚╝╠╣╦╩╬]+\|/m.test(asciiContent)
        if (isMarkdownTable) {
          // É uma tabela markdown, ignorar e deixar o ReactMarkdown renderizar
          continue
        }
        
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

  // Função auxiliar para remover headers/títulos/tabelas redundantes antes de artefatos
  // Remove conteúdo markdown que é redundante com o artefato visual
  const cleanTextBeforeArtifact = (text: string, artifactType: string): string => {
    if (!text) return text
    let cleaned = text

    // Para flashcards, remover TUDO relacionado a resumos/instruções de flashcards
    if (artifactType === 'flashcards') {
      // Remover seções de "Resumo do Deck" com tabelas markdown
      cleaned = cleaned.replace(/#{1,4}\s*[🎴📝🃏]?\s*Resumo\s+d[oe]\s+Deck[\s\S]*?(?=\n#{1,4}\s|$)/gi, '')
      // Remover seções "Como Usar os Flashcards"
      cleaned = cleaned.replace(/#{1,4}\s*[🎯📚]?\s*Como\s+Usar[\s\S]*?(?=\n#{1,4}\s|$)/gi, '')
      // Remover tabelas markdown inteiras (| ... | ... |)
      cleaned = cleaned.replace(/\|[^\n]+\|[\s\S]*?\|[^\n]+\|\n?/g, '')
      // Remover instruções sobre flashcards
      cleaned = cleaned.replace(/.*(?:toque|clique|deslize|navegue|responda).*flashcard.*\n?/gi, '')
      cleaned = cleaned.replace(/.*(?:cards?|cartões?).*(?:estudar|revisar|memorizar).*\n?/gi, '')
      // Remover listas de categorias/tópicos cobertos
      cleaned = cleaned.replace(/\*\*(?:Categoria|Tópico|Conceito)[^\n]*\*\*[^\n]*\n?/gi, '')
      // Remover linhas com contagem de cards
      cleaned = cleaned.replace(/.*\d+\s*cards?.*\n?/gi, '')
      // NOVO: Remover títulos de deck que vazam como lista (- Título do Deck)
      cleaned = cleaned.replace(/(?:^|\n)\s*[-•●]\s*[A-Za-zÀ-ÿ][\w\sÀ-ÿ\-]+(?:\n|$)/gi, '\n')
      // NOVO: Remover títulos simples antes do deck
      cleaned = cleaned.replace(/(?:^|\n)\s*[A-Za-zÀ-ÿ][\w\sÀ-ÿ\-]{5,50}\s*(?:\n|$)(?=\s*$)/gi, '\n')
    }

    // Para simulados, remover instruções redundantes
    if (artifactType === 'simulado') {
      cleaned = cleaned.replace(/#{1,4}\s*[📋📝]?\s*(?:Instruções|Como\s+Fazer)[\s\S]*?(?=\n#{1,4}\s|$)/gi, '')
      cleaned = cleaned.replace(/.*(?:tempo|cronômetro|minutos).*simulado.*\n?/gi, '')
    }

    // Para questões, remover instruções e títulos
    if (artifactType === 'question') {
      cleaned = cleaned.replace(/#{1,4}\s*[❓🎯]?\s*(?:Questão|Question)[\s\S]*?(?=```quest)/gi, '')
      // Remover títulos de questões
      cleaned = cleaned.replace(/\n?#{1,4}\s*[🎯❓📋]?\s*(?:QUESTÃO|QUESTÕES|QUESTION).*?\n/gi, '\n')
    }

    // Para fluxogramas, remover títulos redundantes
    if (artifactType === 'modern_flowchart' || artifactType === 'mermaid') {
      // Remover títulos de fluxograma com emojis
      cleaned = cleaned.replace(/\n?#{1,4}\s*[🔀📊🔄⚡💡🫀❤️]?\s*(?:FLUXOGRAMA|FLOWCHART|DIAGRAMA|FLUXO).*?\n/gi, '\n')
      cleaned = cleaned.replace(/\n?\*{2}[🔀📊🔄⚡💡🫀❤️]?\s*(?:FLUXOGRAMA|FLOWCHART|DIAGRAMA|FLUXO).*?\*{2}\n?/gi, '\n')
      // NOVO: Remover títulos descritivos como "Fluxo Sanguíneo através do Coração"
      cleaned = cleaned.replace(/(?:^|\n)\s*(?:Fluxo|Trajeto|Circulação|Caminho)[^\n]{5,60}(?:\n|$)/gi, '\n')
      // NOVO: Remover linhas com apenas o título do diagrama
      cleaned = cleaned.replace(/(?:^|\n)\s*[A-Za-zÀ-ÿ][\w\sÀ-ÿ\-]{10,60}\s*(?:\n|$)(?=\s*$)/gi, '\n')
    }

    // Para organogramas, remover títulos redundantes
    if (artifactType === 'tree_diagram') {
      // Remover títulos de organograma com emojis
      cleaned = cleaned.replace(/\n?#{1,4}\s*[🌳👥📊🏢🫀❤️]?\s*(?:ORGANOGRAMA|ORGANIZAÇÃO|HIERARQUIA|ESTRUTURA|SISTEMA).*?\n/gi, '\n')
      cleaned = cleaned.replace(/\n?\*{2}[🌳👥📊🏢🫀❤️]?\s*(?:ORGANOGRAMA|ORGANIZAÇÃO|HIERARQUIA|ESTRUTURA|SISTEMA).*?\*{2}\n?/gi, '\n')
      // NOVO: Remover títulos descritivos
      cleaned = cleaned.replace(/(?:^|\n)\s*(?:Organização|Estrutura|Sistema|Componentes)[^\n]{5,60}(?:\n|$)/gi, '\n')
      // NOVO: Remover linhas com apenas o título
      cleaned = cleaned.replace(/(?:^|\n)\s*[A-Za-zÀ-ÿ][\w\sÀ-ÿ\-]{10,60}\s*(?:\n|$)(?=\s*$)/gi, '\n')
    }

    // Para layers/diagramas de camadas
    if (artifactType === 'layers') {
      cleaned = cleaned.replace(/\n?#{1,4}\s*[📊🔀🔬]?\s*(?:CAMADAS|LAYERS|DIAGRAMA|ESTRUTURA).*?\n/gi, '\n')
      // NOVO: Remover títulos descritivos
      cleaned = cleaned.replace(/(?:^|\n)\s*(?:Camadas|Estrutura|Diagrama)[^\n]{5,60}(?:\n|$)/gi, '\n')
    }

    // Padrões gerais de títulos a remover (aparecem logo antes do artefato)
    const headerPatterns = [
      /\n?#{1,4}\s*.*?(SIMULADO|FLASHCARD|QUESTÕES?|QUIZ|TESTE|FIXAÇÃO|QUESTÃO|DECK|FLUXOGRAMA|ORGANOGRAMA).*?\n?/gi,
      /\n?#{1,4}\s*[📋🧠🎯❓🃏📝🎴🔀📊🌳👥]\s*[^\n]*\n?/gi,
      /\n?\*{2}.*?(SIMULADO|FLASHCARD|QUESTÕES?|QUESTÃO|FIXAÇÃO|DECK|FLUXOGRAMA|ORGANOGRAMA).*?\*{2}\n?/gi,
      /\n---+\n?/g,
      // Remover blocos de código vazios ou com apenas markdown headers
      /```[a-z]*\n?#{1,4}[^\n]*\n?```/gi,
    ]

    for (const pattern of headerPatterns) {
      cleaned = cleaned.replace(pattern, '\n')
    }

    // Remover múltiplas quebras de linha consecutivas
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
    // Remover espaços/quebras extras no final
    return cleaned.trim()
  }

  // Processar matches
  for (const matchData of allMatches) {
    const { match, type, asciiType, convertedContent, originalAscii, questionData } = matchData
    const startIndex = match.index ?? 0
    const endIndex = startIndex + match[0].length

    // Adicionar texto antes do artefato
    if (startIndex > lastIndex) {
      let textBefore = processedContent.substring(lastIndex, startIndex)
      // Limpar headers redundantes antes de todos os tipos de artefatos
      const typesToClean = ['simulado', 'flashcards', 'question', 'modern_flowchart', 'tree_diagram', 'mermaid', 'layers']
      if (typesToClean.includes(type)) {
        textBefore = cleanTextBeforeArtifact(textBefore, type)
      }
      if (textBefore.trim()) {
        parts.push(textBefore)
      }
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
    } else if (type === 'modern_flowchart') {
      artifact = {
        type: 'modern_flowchart',
        title: match[1].trim() || 'Fluxograma',
        content: match[2].trim(),
        startIndex,
        endIndex
      }
    } else if (type === 'tree_diagram') {
      artifact = {
        type: 'tree_diagram',
        title: match[1].trim() || 'Organograma',
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
      // Flashcards interativos - serializar dados no content para persistência
      artifact = {
        type: 'flashcards',
        title: matchData.flashcardData.titulo,
        content: JSON.stringify(matchData.flashcardData),
        startIndex,
        endIndex,
        flashcardData: matchData.flashcardData
      }
    } else if (type === 'simulado' && matchData.simuladoData) {
      // Simulado completo - serializar dados no content para persistência
      artifact = {
        type: 'simulado',
        title: matchData.simuladoData.titulo,
        content: JSON.stringify(matchData.simuladoData),
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
      className="my-1.5 max-w-xs lg:max-w-sm group"
      style={{ contain: 'layout', minHeight: isLoaded ? 'auto' : '150px', marginLeft: 0, marginRight: 'auto' }}
    >
      <button
        onClick={handleClick}
        className="relative w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 hover:border-blue-500/50 transition-colors cursor-zoom-in"
        title="Clique para ampliar"
      >
        {/* Placeholder skeleton - só aparece se não carregou ainda */}
        {!isLoaded && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse"
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
          className={`relative z-10 w-full h-auto max-h-[180px] lg:max-h-[200px] object-contain rounded-lg transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
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
  const { addArtifact, artifacts: storeArtifacts, updateQuestionAnswer, setSidebarOpen, selectArtifact, setMobileDrawerOpen } = useArtifactsStore()
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
  // Usar ref para estabilizar e evitar pisca-pisca durante streaming
  const imageSearchTermsRef = useRef<string[]>([])
  const imageSearchTerms = useMemo(() => {
    const newTerms = extractImageSearchTerms(content)
    // Só atualiza se realmente mudou (comparação por valor)
    const currentTerms = imageSearchTermsRef.current
    const changed = newTerms.length !== currentTerms.length ||
      newTerms.some((term, i) => term !== currentTerms[i])
    if (changed) {
      imageSearchTermsRef.current = newTerms
      return newTerms
    }
    return currentTerms // Retorna a referência antiga se não mudou
  }, [content])

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
      // Criar uma chave única para evitar duplicatas (inclui conversaId para evitar conflitos entre conversas)
      const artifactKey = `${conversaId}-${messageId}-${artifact.startIndex}-${artifact.type}`

      // Verificar se já foi adicionado nesta sessão
      if (addedArtifactsRef.current.has(artifactKey)) return

      // Verificar se já existe na store (buscar estado mais recente para evitar race conditions)
      const currentStoreArtifacts = useArtifactsStore.getState().artifacts
      const exists = currentStoreArtifacts.some(
        (a) => a.messageId === messageId &&
               a.content === artifact.content &&
               a.conversaId === conversaId
      )
      if (exists) {
        // Marcar como já adicionado para evitar verificações futuras
        addedArtifactsRef.current.add(artifactKey)
        return
      }

      // Adicionar à store - usar tipo do artefato se já definido
      // Mapear tipos internos para tipos da store
      let storeType: string
      if (artifact.type === 'layers' || artifact.type === 'converted_ascii' && artifact.conversionType === 'layers') {
        storeType = 'layers'
      } else if (artifact.type === 'staging') {
        storeType = 'staging'
      } else if (artifact.type === 'modern_flowchart') {
        // IMPORTANTE: Manter como modern_flowchart para usar ModernFlowchart
        storeType = 'modern_flowchart'
      } else if (artifact.type === 'tree_diagram') {
        // IMPORTANTE: Manter como tree_diagram para usar TreeDiagram
        storeType = 'tree_diagram'
      } else if (artifact.type === 'mermaid') {
        // Verificar se o conteúdo é JSON de flowchart ou tree
        try {
          const parsed = JSON.parse(artifact.content)
          if (parsed.nodes && Array.isArray(parsed.nodes)) {
            storeType = 'modern_flowchart'
          } else if (parsed.data || parsed.root || parsed.tree || parsed.children) {
            storeType = 'tree_diagram'
          } else {
            storeType = 'flowchart'
          }
        } catch {
          // É código Mermaid real, usar flowchart
          storeType = 'flowchart'
        }
      } else if (artifact.type === 'question') {
        storeType = 'question'
      } else if (artifact.type === 'flashcards') {
        storeType = 'flashcards'
      } else if (artifact.type === 'simulado') {
        storeType = 'simulado'
      } else {
        // Detectar tipo pelo conteúdo
        const detectedType = detectArtifactType(artifact.content)
        // Verificar se é JSON de diagram
        try {
          const parsed = JSON.parse(artifact.content)
          if (parsed.nodes && Array.isArray(parsed.nodes)) {
            storeType = 'modern_flowchart'
          } else if (parsed.data || parsed.root || parsed.tree || parsed.children) {
            storeType = 'tree_diagram'
          } else if (parsed.layers && Array.isArray(parsed.layers)) {
            storeType = 'layers'
          } else {
            storeType = detectedType || 'diagram'
          }
        } catch {
          storeType = detectedType || 'diagram'
        }
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
          question: artifact.questionData,
          flashcards: artifact.flashcardData,
          simulado: artifact.simuladoData
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

  // Função para abrir artefato na sidebar
  const openArtifactInSidebar = useCallback((artifactType: string, artifactTitle?: string) => {
    // Buscar artefatos diretamente da store para evitar problemas de closure
    const currentArtifacts = useArtifactsStore.getState().artifacts

    // Encontrar o artefato na store pelo tipo e messageId
    const matchingArtifact = currentArtifacts.find(
      a => a.type === artifactType &&
           a.messageId === messageId &&
           (artifactTitle ? a.title === artifactTitle : true)
    )

    if (matchingArtifact) {
      selectArtifact(matchingArtifact.id)
    }

    // Abrir sidebar (desktop) ou drawer (mobile)
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
    if (isMobile) {
      setMobileDrawerOpen(true)
    } else {
      setSidebarOpen(true)
    }
  }, [messageId, selectArtifact, setSidebarOpen, setMobileDrawerOpen])

  return (
    <div className="artifact-renderer lg:text-[0.9em] xl:text-[0.85em]">
      {parts.map((part, index) => {
        // Ignorar partes undefined ou vazias
        if (part === undefined || part === null) return null

        if (typeof part === 'string') {
          // Ignorar strings vazias ou que são apenas "undefined"
          if (!part.trim() || part.trim() === 'undefined') return null
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

          // Remover marcadores IMAGE_SEARCH e limpar gabarito/explicações do texto antes de renderizar
          let cleanedPart = removeImageSearchMarkers(part)
          // Aplicar limpeza de gabarito e conteúdo que não deve aparecer no chat
          cleanedPart = cleanRenderedTextForChat(cleanedPart)

          // Se após limpeza não sobrou nada, não renderizar
          if (!cleanedPart.trim()) return null

          // Renderizar Markdown normal
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                // Headings - menores e mais compactos
                h1: ({ children }) => (
                  <h1 className="text-base lg:text-base font-bold text-slate-800 mt-3 mb-1.5 pb-1 border-b border-slate-200">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm lg:text-sm font-semibold text-slate-800 mt-2.5 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-emerald-700 mt-2 mb-1">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-xs font-semibold text-slate-800 mt-1.5 mb-1">
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
                    <p className="text-slate-700 leading-relaxed mb-1.5 text-xs lg:text-xs">
                      {processedChildren}
                    </p>
                  )
                },

                // Lists - espaçamento reduzido
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-0.5 mb-1.5 text-slate-700 ml-2 text-xs lg:text-xs">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-0.5 mb-1.5 text-slate-700 ml-2 text-xs lg:text-xs">
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
                    <li className="text-slate-700 text-xs lg:text-xs">
                      {processedChildren}
                    </li>
                  )
                },

                // Strong and emphasis
                strong: ({ children }) => (
                  <strong className="font-semibold text-emerald-700">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-slate-600">
                    {children}
                  </em>
                ),

                // Code - tamanho reduzido
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code className="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-xs font-mono">
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
                  <pre className="bg-slate-100 border border-slate-200 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-slate-700">
                    {children}
                  </pre>
                ),

                // Tables - células mais compactas
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="min-w-full border-collapse border border-slate-200 rounded-lg overflow-hidden text-sm">
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
                  <tr className="hover:bg-slate-100 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold text-emerald-700 border-b border-slate-200">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-2 md:px-3 py-2 text-xs text-slate-700">
                    {children}
                  </td>
                ),

                // Blockquotes (para boxes de destaque) - mais compacto
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-emerald-500 bg-emerald-500/10 pl-3 py-1.5 my-2 rounded-r-lg">
                    <div className="text-slate-700 text-sm">
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
                    className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),

                // Horizontal rule - espaçamento reduzido
                hr: () => (
                  <hr className="my-4 border-slate-200" />
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

        // Renderizar artefatos Mermaid - Card de Preview Compacto (abre na sidebar)
        if (part.type === 'mermaid' || (part.type === 'artifact' && (part.subtype === 'diagram' || part.subtype === 'flowchart'))) {
          const diagramTitle = part.title || 'Diagrama'

          return (
            <button
              key={index}
              onClick={() => openArtifactInSidebar('mermaid', diagramTitle)}
              className="my-3 w-full flex items-center gap-3 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border border-cyan-200 rounded-xl text-left transition-all shadow-sm hover:shadow-md group"
            >
              {/* Ícone */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-xl">🔀</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate text-sm">{diagramTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diagrama • Toque para visualizar
                </p>
              </div>
              {/* Seta */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-100 group-hover:bg-cyan-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        }

        // Renderizar diagramas de camadas (layers) - Card de Preview Compacto (abre na sidebar)
        if (part.type === 'layers') {
          let layerTitle = part.title || 'Diagrama de Camadas'
          let layerCount = 0
          try {
            const layerData = JSON.parse(part.content)
            layerTitle = part.title || layerData.title || 'Diagrama de Camadas'
            layerCount = layerData.layers?.length || 0
          } catch { /* ignore */ }

          return (
            <button
              key={index}
              onClick={() => openArtifactInSidebar('layers', layerTitle)}
              className="my-3 w-full flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 border border-pink-200 rounded-xl text-left transition-all shadow-sm hover:shadow-md group"
            >
              {/* Ícone */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate text-sm">{layerTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {layerCount > 0 ? `${layerCount} camadas` : 'Diagrama de camadas'} • Toque para explorar
                </p>
              </div>
              {/* Seta */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-100 group-hover:bg-pink-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        }

        // Fluxograma Moderno - Card de Preview Rico (abre na sidebar)
        if (part.type === 'modern_flowchart') {
          let flowTitle = part.title || 'Fluxograma'
          let nodeLabels: string[] = []
          try {
            const flowchartData = JSON.parse(part.content)
            flowTitle = part.title || flowchartData.title || 'Fluxograma'
            // Extrair labels dos nós para as tags
            if (flowchartData.nodes && Array.isArray(flowchartData.nodes)) {
              nodeLabels = flowchartData.nodes
                .slice(0, 4)
                .map((n: { label?: string; name?: string }) => n.label || n.name || '')
                .filter((l: string) => l.length > 0)
            }
          } catch { /* ignore */ }

          const extraCount = nodeLabels.length > 4 ? nodeLabels.length - 4 : 0

          return (
            <div
              key={index}
              onClick={() => openArtifactInSidebar('modern_flowchart', flowTitle)}
              className="my-3 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm text-slate-600 font-medium">Fluxograma</span>
                </div>
                <span className="text-xs text-blue-500 group-hover:text-blue-600 font-medium flex items-center gap-1">
                  Abrir
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </div>
              {/* Body */}
              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-base mb-3">{flowTitle}</h3>
                {/* Tags dos nós */}
                {nodeLabels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {nodeLabels.map((label, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 truncate max-w-[120px]"
                      >
                        {label}
                      </span>
                    ))}
                    {extraCount > 0 && (
                      <span className="px-2.5 py-1 text-slate-500 text-xs">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        }

        // Organograma/Árvore - Card de Preview Rico (abre na sidebar)
        if (part.type === 'tree_diagram') {
          let treeTitle = part.title || 'Organograma'
          let treeItems: Array<{ name: string; description?: string }> = []
          let totalCount = 0
          try {
            const treeData = JSON.parse(part.content)
            treeTitle = part.title || treeData.title || 'Organograma'
            // Extrair primeiros itens da árvore
            const rootData = treeData.data || treeData
            if (rootData.children && Array.isArray(rootData.children)) {
              // Função para contar total de nós
              const countNodes = (node: { children?: unknown[] }): number => {
                let count = 1
                if (node.children && Array.isArray(node.children)) {
                  node.children.forEach((child) => {
                    count += countNodes(child as { children?: unknown[] })
                  })
                }
                return count
              }
              totalCount = countNodes(rootData)

              // Extrair primeiros 3 itens do primeiro nível
              treeItems = rootData.children.slice(0, 3).map((child: { name?: string; label?: string; description?: string }) => ({
                name: child.name || child.label || 'Item',
                description: child.description
              }))
            }
          } catch { /* ignore */ }

          const extraCount = totalCount > 3 ? totalCount - 3 : 0

          return (
            <div
              key={index}
              onClick={() => openArtifactInSidebar('tree_diagram', treeTitle)}
              className="my-3 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-slate-600 font-medium">Organograma</span>
                </div>
                <span className="text-xs text-purple-500 group-hover:text-purple-600 font-medium flex items-center gap-1">
                  Abrir
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </div>
              {/* Body */}
              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-base mb-3">{treeTitle}</h3>
                {/* Lista hierárquica */}
                {treeItems.length > 0 && (
                  <div className="space-y-1.5">
                    {treeItems.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">•</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-purple-700 font-medium">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-slate-500 ml-1">- {item.description}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <p className="text-xs text-slate-400 ml-4">+{extraCount} itens</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
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
              <div key={index} className="my-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <pre className="text-slate-700 text-xs whitespace-pre-wrap">{part.content}</pre>
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

        // Questões - Card de Preview Compacto (abre na sidebar)
        if (part.type === 'question' && part.questionData) {
          const questionNum = part.questionData.numero || 1
          const disciplina = part.questionData.disciplina || 'Questão'
          const assunto = part.questionData.assunto || ''

          return (
            <button
              key={index}
              onClick={() => openArtifactInSidebar('question')}
              className="my-3 w-full flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 rounded-xl text-left transition-all shadow-sm hover:shadow-md group"
            >
              {/* Ícone */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold text-lg">Q{questionNum}</span>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate text-sm">
                  {disciplina}{assunto ? ` • ${assunto}` : ''}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Questão de múltipla escolha • Toque para responder
                </p>
              </div>
              {/* Seta */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        }

        // Flashcards - Card de Preview Compacto (abre na sidebar)
        if (part.type === 'flashcards' && part.flashcardData) {
          const cardCount = part.flashcardData.cards.length
          return (
            <button
              key={index}
              onClick={() => openArtifactInSidebar('flashcards', part.flashcardData?.titulo)}
              className="my-3 w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-xl text-left transition-all shadow-sm hover:shadow-md group"
            >
              {/* Ícone */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate text-sm">
                  {part.flashcardData.titulo || 'Flashcards'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {cardCount} {cardCount === 1 ? 'card' : 'cards'} • Toque para estudar
                </p>
              </div>
              {/* Seta */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        }

        // Simulado - Card de Preview Rico (abre na sidebar)
        if (part.type === 'simulado' && part.simuladoData) {
          const questionCount = part.simuladoData.questoes?.length || 0
          // Extrair preview da primeira questão
          const firstQuestion = part.simuladoData.questoes?.[0]
          const firstQuestionPreview = firstQuestion?.enunciado?.substring(0, 80) || ''

          return (
            <div
              key={index}
              onClick={() => openArtifactInSidebar('simulado', part.simuladoData?.titulo)}
              className="my-3 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span className="text-sm text-slate-600 font-medium">Simulado</span>
                </div>
                <span className="text-xs text-blue-500 group-hover:text-blue-600 font-medium flex items-center gap-1">
                  Abrir
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </span>
              </div>
              {/* Body */}
              <div className="p-4">
                <h3 className="font-bold text-slate-800 text-base">{part.simuladoData.titulo || 'Simulado'}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {questionCount} {questionCount === 1 ? 'questão' : 'questões'}
                </p>
                {/* Preview da primeira questão */}
                {firstQuestionPreview && (
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">
                    {firstQuestionPreview}...
                  </p>
                )}
              </div>
            </div>
          )
        }

        // Outros tipos de artefato (tabela, comparação, mindmap) - responsivo
        if (part.type === 'artifact') {
          return (
            <div key={index} className="my-3 bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[300px] md:max-h-[400px] overflow-auto shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200 sticky top-0">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-slate-700 text-xs font-medium">
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
