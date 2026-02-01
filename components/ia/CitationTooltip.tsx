'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ExternalLink, BookOpen, X } from 'lucide-react'

// Regex para detectar citações inline [1], [2], etc.
export const CITATION_REGEX = /\[(\d+)\]/g

// Regex para detectar seção de fontes/referências
export const SOURCES_SECTION_REGEX = /(?:📚\s*\*\*(?:Fontes|Referências|Referencias)(?:\s*Bibliográficas)?:?\*\*|##\s*(?:Fontes|Referências|Referencias))/i

// Interface para uma referência
export interface Reference {
  number: number
  text: string
  url?: string
}

/**
 * Extrai referências do texto da resposta
 * Formato esperado:
 * [1] AUTOR. Título. Editora, Ano.
 * [2] Outro autor...
 */
export function extractReferences(content: string): Reference[] {
  const references: Reference[] = []

  // Encontrar seção de fontes
  const sourcesMatch = content.match(SOURCES_SECTION_REGEX)
  if (!sourcesMatch) return references

  // Pegar texto após a seção de fontes
  const afterSources = content.substring(content.indexOf(sourcesMatch[0]) + sourcesMatch[0].length)

  // Extrair cada referência numerada (usando [\s\S] em vez de . com flag s)
  const refPattern = /\[(\d+)\]\s*([\s\S]+?)(?=\n\[|\n\n|$)/g
  let match
  while ((match = refPattern.exec(afterSources)) !== null) {
    const number = parseInt(match[1])
    let text = match[2].trim()

    // Tentar extrair URL se presente
    const urlMatch = text.match(/https?:\/\/[^\s]+/)
    const url = urlMatch ? urlMatch[0] : undefined

    // Limpar o texto
    text = text.replace(/https?:\/\/[^\s]+/g, '').trim()
    text = text.replace(/^[-•]\s*/, '') // Remover bullet point

    if (text) {
      references.push({ number, text, url })
    }
  }

  return references
}

interface CitationTooltipProps {
  number: number
  references: Reference[]
}

/**
 * Componente de tooltip para citação
 * Mostra a referência completa ao passar o mouse ou clicar
 */
export function CitationTooltip({ number, references }: CitationTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<'top' | 'bottom'>('top')
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Encontrar a referência correspondente
  const reference = references.find(r => r.number === number)

  // Calcular posição do tooltip
  const calculatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceAbove = rect.top
      const spaceBelow = window.innerHeight - rect.bottom

      // Mostrar abaixo se não houver espaço suficiente acima
      setPosition(spaceAbove < 150 ? 'bottom' : 'top')
    }
  }, [])

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      calculatePosition()
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, calculatePosition])

  // Se não encontrou a referência, mostrar apenas o número
  if (!reference) {
    return (
      <span className="text-emerald-400/60 cursor-default text-xs align-super">
        [{number}]
      </span>
    )
  }

  return (
    <span className="relative inline-block">
      {/* Trigger - número da citação */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => { setIsOpen(true); calculatePosition() }}
        onMouseLeave={() => setIsOpen(false)}
        className="text-emerald-400 hover:text-emerald-300 cursor-pointer text-xs align-super font-medium hover:bg-emerald-400/10 rounded px-0.5 transition-colors"
        aria-label={`Ver referência ${number}`}
      >
        [{number}]
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 w-72 md:w-80 p-3 bg-slate-800 border border-slate-300 rounded-lg shadow-xl
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 -translate-x-1/2
            animate-in fade-in-0 zoom-in-95 duration-150
          `}
          style={{ maxWidth: 'calc(100vw - 2rem)' }}
        >
          {/* Seta do tooltip */}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-slate-300 rotate-45
              ${position === 'top' ? 'bottom-0 translate-y-1/2 border-r border-b' : 'top-0 -translate-y-1/2 border-l border-t'}
            `}
          />

          {/* Conteúdo */}
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-semibold">
                  Referência [{number}]
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Texto da referência */}
            <p className="text-slate-800 text-xs leading-relaxed">
              {reference.text}
            </p>

            {/* Link se disponível */}
            {reference.url && (
              <a
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Acessar fonte
              </a>
            )}
          </div>
        </div>
      )}
    </span>
  )
}

/**
 * Processa texto para substituir citações [N] por componentes interativos
 */
export function processCitations(text: string, references: Reference[]): React.ReactNode[] {
  if (references.length === 0) return [text]

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const regex = new RegExp(CITATION_REGEX.source, 'g')
  let match

  while ((match = regex.exec(text)) !== null) {
    // Adicionar texto antes da citação
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    // Adicionar componente de citação
    const number = parseInt(match[1])
    parts.push(
      <CitationTooltip
        key={`citation-${match.index}-${number}`}
        number={number}
        references={references}
      />
    )

    lastIndex = match.index + match[0].length
  }

  // Adicionar texto restante
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts
}

/**
 * Hook para extrair e usar referências
 */
export function useReferences(content: string) {
  const [references, setReferences] = useState<Reference[]>([])

  useEffect(() => {
    const refs = extractReferences(content)
    setReferences(refs)
  }, [content])

  return references
}

export default CitationTooltip
