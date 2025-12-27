'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useState, useRef } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Cores disponíveis para texto
const TEXT_COLORS = [
  { name: 'Preto', color: '#000000' },
  { name: 'Roxo', color: '#9333ea' },
  { name: 'Azul', color: '#2563eb' },
  { name: 'Verde', color: '#16a34a' },
  { name: 'Vermelho', color: '#dc2626' },
  { name: 'Laranja', color: '#ea580c' },
  { name: 'Rosa', color: '#db2777' },
  { name: 'Ciano', color: '#0891b2' },
]

// Cores disponíveis para marca-texto
const HIGHLIGHT_COLORS = [
  { name: 'Amarelo', color: '#fef08a', darkColor: 'rgba(234, 179, 8, 0.3)' },
  { name: 'Verde', color: '#bbf7d0', darkColor: 'rgba(34, 197, 94, 0.3)' },
  { name: 'Azul', color: '#bfdbfe', darkColor: 'rgba(59, 130, 246, 0.3)' },
  { name: 'Rosa', color: '#fbcfe8', darkColor: 'rgba(236, 72, 153, 0.3)' },
  { name: 'Roxo', color: '#e9d5ff', darkColor: 'rgba(168, 85, 247, 0.3)' },
  { name: 'Laranja', color: '#fed7aa', darkColor: 'rgba(249, 115, 22, 0.3)' },
]

// Emojis mais usados para resumos
const EMOJIS = [
  { emoji: '📌', name: 'Importante' },
  { emoji: '⚠️', name: 'Atenção' },
  { emoji: '💡', name: 'Dica' },
  { emoji: '⚖️', name: 'Jurisprudência' },
  { emoji: '📚', name: 'Conceito' },
  { emoji: '🎯', name: 'Objetivo' },
  { emoji: '✅', name: 'Correto' },
  { emoji: '❌', name: 'Incorreto' },
  { emoji: '📝', name: 'Nota' },
  { emoji: '🔗', name: 'Link' },
  { emoji: '📖', name: 'Referência' },
  { emoji: '🧠', name: 'Memorizar' },
  { emoji: '⚡', name: 'Rápido' },
  { emoji: '🏷️', name: 'Tag' },
  { emoji: '📋', name: 'Lista' },
  { emoji: '❓', name: 'Pergunta' },
  { emoji: '📗', name: 'Livro Verde' },
  { emoji: '📘', name: 'Livro Azul' },
  { emoji: '📙', name: 'Livro Laranja' },
  { emoji: '📕', name: 'Livro Vermelho' },
]

// Botão da toolbar
function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 sm:p-2 rounded-lg transition-all ${
        isActive
          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283039]'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  )
}

// Separador vertical
function Separator() {
  return <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />
}

// Dropdown de cores
function ColorDropdown({
  colors,
  onSelect,
  isHighlight = false,
  activeColor,
  title
}: {
  colors: typeof TEXT_COLORS | typeof HIGHLIGHT_COLORS
  onSelect: (color: string) => void
  isHighlight?: boolean
  activeColor?: string
  title: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={title}
        className={`p-1.5 sm:p-2 rounded-lg transition-all flex items-center gap-0.5 ${
          activeColor
            ? 'bg-purple-100 dark:bg-purple-900/40'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283039]'
        }`}
      >
        {isHighlight ? (
          <span className="material-symbols-outlined text-lg sm:text-xl">ink_highlighter</span>
        ) : (
          <span className="material-symbols-outlined text-lg sm:text-xl">format_color_text</span>
        )}
        <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a2330] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg p-2 z-50 min-w-[140px]">
          <div className="grid grid-cols-4 gap-1">
            {colors.map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => {
                  onSelect(c.color)
                  setIsOpen(false)
                }}
                title={c.name}
                className="w-7 h-7 rounded-md border border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
          {/* Botão para remover */}
          <button
            type="button"
            onClick={() => {
              onSelect('')
              setIsOpen(false)
            }}
            className="w-full mt-2 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-[#283039] rounded"
          >
            Remover {isHighlight ? 'destaque' : 'cor'}
          </button>
        </div>
      )}
    </div>
  )
}

// Dropdown de emojis
function EmojiDropdown({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Inserir emoji"
        className="p-1.5 sm:p-2 rounded-lg transition-all text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283039] flex items-center gap-0.5"
      >
        <span className="text-lg sm:text-xl">😀</span>
        <span className="material-symbols-outlined text-xs">arrow_drop_down</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1a2330] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg p-2 z-50 w-[220px]">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">Emojis para resumos</p>
          <div className="grid grid-cols-5 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e.emoji}
                type="button"
                onClick={() => {
                  onSelect(e.emoji)
                  setIsOpen(false)
                }}
                title={e.name}
                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-[#283039] rounded-lg transition-colors"
              >
                {e.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Toolbar do editor
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const handleHighlight = (color: string) => {
    if (color) {
      editor.chain().focus().setHighlight({ color }).run()
    } else {
      editor.chain().focus().unsetHighlight().run()
    }
  }

  const handleTextColor = (color: string) => {
    if (color) {
      editor.chain().focus().setColor(color).run()
    } else {
      editor.chain().focus().unsetColor().run()
    }
  }

  const handleEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-50 dark:bg-[#1a2330] border border-gray-200 dark:border-[#283039] rounded-t-xl overflow-x-auto">
      {/* Linha 1: Desfazer, Títulos, Formatação básica */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* Desfazer / Refazer */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer (Ctrl+Z)"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">undo</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer (Ctrl+Y)"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">redo</span>
        </ToolbarButton>

        <Separator />

        {/* Títulos */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Título Grande"
        >
          <span className="font-bold text-sm sm:text-base">H1</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Título Médio"
        >
          <span className="font-bold text-sm">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Subtítulo"
        >
          <span className="font-bold text-xs">H3</span>
        </ToolbarButton>

        <Separator />

        {/* Formatação de texto */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Negrito (Ctrl+B)"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">format_bold</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Itálico (Ctrl+I)"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">format_italic</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Sublinhado (Ctrl+U)"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">format_underlined</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Tachado"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">strikethrough_s</span>
        </ToolbarButton>

        <Separator />

        {/* Cores de texto */}
        <ColorDropdown
          colors={TEXT_COLORS}
          onSelect={handleTextColor}
          title="Cor do texto"
        />

        {/* Marca-texto com cores */}
        <ColorDropdown
          colors={HIGHLIGHT_COLORS}
          onSelect={handleHighlight}
          isHighlight
          title="Marca-texto"
        />

        <Separator />

        {/* Emojis */}
        <EmojiDropdown onSelect={handleEmoji} />

        <Separator />

        {/* Listas */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Lista com marcadores"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">format_list_bulleted</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Lista numerada"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">format_list_numbered</span>
        </ToolbarButton>

        <Separator />

        {/* Citação e Código */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Citação"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">format_quote</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Código"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">code</span>
        </ToolbarButton>

        <Separator />

        {/* Linha horizontal */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha horizontal"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">horizontal_rule</span>
        </ToolbarButton>

        {/* Limpar formatação */}
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Limpar formatação"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">format_clear</span>
        </ToolbarButton>
      </div>
    </div>
  )
}

// Converter Markdown para HTML simples
function markdownToHtml(markdown: string): string {
  let html = markdown

  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')

  // Bold e Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Highlight
  html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>')

  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>')

  // Code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Blockquote
  html = html.replace(/^> (.*$)/gm, '<blockquote><p>$1</p></blockquote>')

  // Horizontal rule
  html = html.replace(/^[-_]{3,}$/gm, '<hr>')
  html = html.replace(/^[─━═]{3,}$/gm, '<hr>')

  // Lists - bullets
  html = html.replace(/^[•▸-] (.*$)/gm, '<li>$1</li>')

  // Arrows como itens
  html = html.replace(/^→ (.*$)/gm, '<li>$1</li>')

  // Wrap consecutive li in ul
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  // Parágrafos - linhas que não são tags
  const lines = html.split('\n')
  const processed = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return '<p><br></p>'
    if (trimmed.startsWith('<')) return line
    return `<p>${line}</p>`
  })

  return processed.join('')
}

// Converter HTML para Markdown - VERSÃO MELHORADA
function htmlToMarkdown(html: string): string {
  let markdown = html

  // Headers
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')

  // Bold e Italic
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*')

  // Underline (não tem em markdown padrão, usar HTML)
  markdown = markdown.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')

  // Highlight - preservar com cores
  markdown = markdown.replace(/<mark[^>]*style="[^"]*background-color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/mark>/gi, '==$2==')
  markdown = markdown.replace(/<mark[^>]*data-color="([^"]+)"[^>]*>(.*?)<\/mark>/gi, '==$2==')
  markdown = markdown.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '==$1==')

  // Text color - preservar
  markdown = markdown.replace(/<span[^>]*style="[^"]*color:\s*([^;"]+)[^"]*"[^>]*>(.*?)<\/span>/gi, '$2')

  // Strikethrough
  markdown = markdown.replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
  markdown = markdown.replace(/<del>(.*?)<\/del>/gi, '~~$1~~')

  // Code
  markdown = markdown.replace(/<code>(.*?)<\/code>/gi, '`$1`')

  // Blockquote
  markdown = markdown.replace(/<blockquote[^>]*><p>(.*?)<\/p><\/blockquote>/gi, '> $1\n')
  markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')

  // Horizontal rule
  markdown = markdown.replace(/<hr\s*\/?>/gi, '\n---\n')

  // Lists
  markdown = markdown.replace(/<ul[^>]*>/gi, '')
  markdown = markdown.replace(/<\/ul>/gi, '')
  markdown = markdown.replace(/<ol[^>]*>/gi, '')
  markdown = markdown.replace(/<\/ol>/gi, '')
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')

  // Parágrafos
  markdown = markdown.replace(/<p[^>]*><br\s*\/?><\/p>/gi, '\n')
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')

  // Quebras de linha
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')

  // Remover spans vazios
  markdown = markdown.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')

  // Remover tags restantes
  markdown = markdown.replace(/<[^>]+>/g, '')

  // Limpar entidades HTML
  markdown = markdown.replace(/&nbsp;/g, ' ')
  markdown = markdown.replace(/&amp;/g, '&')
  markdown = markdown.replace(/&lt;/g, '<')
  markdown = markdown.replace(/&gt;/g, '>')

  // Limpar múltiplas linhas em branco
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  return markdown.trim()
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'tiptap-highlight'
        }
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Digite o conteúdo do resumo...',
        emptyEditorClass: 'is-editor-empty'
      })
    ],
    content: markdownToHtml(content),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4'
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const markdown = htmlToMarkdown(html)
      onChange(markdown)
    }
  })

  // Atualizar conteúdo quando mudar externamente
  useEffect(() => {
    if (editor && content) {
      const currentMarkdown = htmlToMarkdown(editor.getHTML())
      if (currentMarkdown !== content) {
        editor.commands.setContent(markdownToHtml(content))
      }
    }
  }, [content, editor])

  return (
    <div className="border border-gray-200 dark:border-[#283039] rounded-xl overflow-hidden bg-white dark:bg-[#141A21]">
      <EditorToolbar editor={editor} />
      <div className="border-t border-gray-200 dark:border-[#283039]">
        <EditorContent
          editor={editor}
          className="tiptap-editor"
        />
      </div>

      {/* Estilos do editor */}
      <style jsx global>{`
        .tiptap-editor .ProseMirror {
          min-height: 300px;
          padding: 1rem;
        }

        .tiptap-editor .ProseMirror:focus {
          outline: none;
        }

        .tiptap-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #9333ea;
          margin: 1.5rem 0 0.75rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e9d5ff;
        }

        .tiptap-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #9333ea;
          margin: 1.25rem 0 0.5rem 0;
        }

        .tiptap-editor .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #a855f7;
          margin: 1rem 0 0.5rem 0;
        }

        .tiptap-editor .ProseMirror p {
          margin: 0.5rem 0;
          line-height: 1.6;
          color: #374151;
        }

        .tiptap-editor .ProseMirror strong {
          font-weight: 700;
          color: #111827;
        }

        .tiptap-editor .ProseMirror em {
          font-style: italic;
          color: #9333ea;
        }

        .tiptap-editor .ProseMirror u {
          text-decoration: underline;
        }

        .tiptap-editor .ProseMirror s {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .tiptap-editor .ProseMirror mark,
        .tiptap-editor .ProseMirror .tiptap-highlight {
          padding: 0 0.25rem;
          border-radius: 0.25rem;
        }

        .tiptap-editor .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }

        .tiptap-editor .ProseMirror blockquote {
          border-left: 4px solid #9333ea;
          padding-left: 1rem;
          margin: 1rem 0;
          background-color: #faf5ff;
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
          color: #6b7280;
        }

        .tiptap-editor .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .tiptap-editor .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .tiptap-editor .ProseMirror li {
          margin: 0.25rem 0;
        }

        .tiptap-editor .ProseMirror li::marker {
          color: #9333ea;
        }

        .tiptap-editor .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1.5rem 0;
        }

        .tiptap-editor .ProseMirror.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        /* Dark mode */
        .dark .tiptap-editor .ProseMirror h1 {
          border-bottom-color: #581c87;
        }

        .dark .tiptap-editor .ProseMirror p {
          color: #d1d5db;
        }

        .dark .tiptap-editor .ProseMirror strong {
          color: #f9fafb;
        }

        .dark .tiptap-editor .ProseMirror code {
          background-color: #374151;
          color: #f3f4f6;
        }

        .dark .tiptap-editor .ProseMirror blockquote {
          background-color: rgba(147, 51, 234, 0.1);
          color: #9ca3af;
        }

        .dark .tiptap-editor .ProseMirror hr {
          border-top-color: #374151;
        }
      `}</style>
    </div>
  )
}
