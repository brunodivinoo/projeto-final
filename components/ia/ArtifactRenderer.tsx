'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

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

interface ArtifactRendererProps {
  content: string
}

// Regex para detectar artefatos no formato ```artifact:tipo:titulo
const ARTIFACT_REGEX = /```artifact:(diagram|flowchart|table|comparison|mindmap):([^\n]*)\n([\s\S]*?)```/g

// Regex para detectar blocos de código Mermaid padrão
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/g

// Regex para detectar solicitações de geração de imagem
const IMAGE_GEN_REGEX = /```generate_image\n([\s\S]*?)```/g

interface Artifact {
  type: 'artifact' | 'mermaid' | 'image_request'
  subtype?: string
  title?: string
  content: string
  startIndex: number
  endIndex: number
}

function parseArtifacts(content: string): { parts: (string | Artifact)[]; artifacts: Artifact[] } {
  const artifacts: Artifact[] = []
  let lastIndex = 0
  const parts: (string | Artifact)[] = []

  // Combinar todas as regex em uma busca
  const allMatches: Array<{
    match: RegExpMatchArray
    type: 'artifact' | 'mermaid' | 'image_request'
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

export default function ArtifactRenderer({ content }: ArtifactRendererProps) {
  const { parts } = useMemo(() => parseArtifacts(content), [content])

  return (
    <div className="artifact-renderer">
      {parts.map((part, index) => {
        if (typeof part === 'string') {
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
              {part}
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
    </div>
  )
}
