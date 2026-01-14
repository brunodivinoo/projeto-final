'use client'

import { useMemo, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { useArtifactsStore, detectArtifactType } from '@/stores/artifactsStore'

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

interface Artifact {
  type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging'
  subtype?: string
  title?: string
  content: string
  startIndex: number
  endIndex: number
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
    type: 'artifact' | 'mermaid' | 'image_request' | 'layers' | 'staging'
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

  // Ordenar por índice
  allMatches.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0))

  // Processar matches
  for (const { match, type } of allMatches) {
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

      // Adicionar à store
      const type = detectArtifactType(artifact.content) || 'diagram'
      addArtifact({
        type,
        title: artifact.title || 'Artefato',
        content: artifact.content,
        messageId,
        metadata: {
          subtype: artifact.subtype
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
                // Headings
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-white mt-6 mb-4 pb-2 border-b border-white/10">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-white mt-5 mb-3">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-emerald-400 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold text-white/90 mt-3 mb-2">
                    {children}
                  </h4>
                ),

                // Paragraphs
                p: ({ children }) => (
                  <p className="text-white/80 leading-relaxed mb-3">
                    {children}
                  </p>
                ),

                // Lists
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 mb-3 text-white/80 ml-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 mb-3 text-white/80 ml-2">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-white/80">
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

                // Code
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  const isInline = !match

                  if (isInline) {
                    return (
                      <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    )
                  }

                  return (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg my-3 text-sm"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  )
                },

                // Pre (for code blocks without language)
                pre: ({ children }) => (
                  <pre className="bg-slate-800/80 rounded-lg p-4 my-3 overflow-x-auto text-sm font-mono text-white/80">
                    {children}
                  </pre>
                ),

                // Tables
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-white/10 rounded-lg overflow-hidden">
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-emerald-400 border-b border-white/10">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-sm text-white/80">
                    {children}
                  </td>
                ),

                // Blockquotes (para boxes de destaque)
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-emerald-500 bg-emerald-500/10 pl-4 py-2 my-3 rounded-r-lg">
                    <div className="text-white/80">
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

                // Horizontal rule
                hr: () => (
                  <hr className="my-6 border-white/10" />
                ),

                // Images
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="max-w-full h-auto rounded-lg my-4"
                  />
                )
              }}
            >
              {cleanedPart}
            </ReactMarkdown>
          )
        }

        // Renderizar artefatos
        if (part.type === 'mermaid' || (part.type === 'artifact' && (part.subtype === 'diagram' || part.subtype === 'flowchart'))) {
          return (
            <MermaidDiagram
              key={index}
              chart={part.content}
              title={part.title}
            />
          )
        }

        // Renderizar diagramas de camadas (layers)
        if (part.type === 'layers') {
          try {
            const layerData = JSON.parse(part.content)
            return (
              <div key={index} className="my-4">
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
              <div key={index} className="my-4 bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <pre className="text-white/80 text-sm whitespace-pre-wrap">{part.content}</pre>
              </div>
            )
          }
        }

        // Renderizar tabelas de estadiamento
        if (part.type === 'staging') {
          try {
            const stagingData = JSON.parse(part.content)
            return (
              <div key={index} className="my-4">
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
              <div key={index} className="my-4 bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <pre className="text-white/80 text-sm whitespace-pre-wrap">{part.content}</pre>
              </div>
            )
          }
        }

        if (part.type === 'image_request') {
          return (
            <ImageGenerator
              key={index}
              prompt={part.content}
            />
          )
        }

        // Outros tipos de artefato (tabela, comparação, mindmap)
        if (part.type === 'artifact') {
          return (
            <div key={index} className="my-4 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border-b border-white/10">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-white/80 text-sm font-medium">
                  {part.title || part.subtype}
                </span>
              </div>
              <div className="p-4">
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
