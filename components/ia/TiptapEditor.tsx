'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
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
  { name: 'Amarelo', color: '#fef08a' },
  { name: 'Verde', color: '#bbf7d0' },
  { name: 'Azul', color: '#bfdbfe' },
  { name: 'Rosa', color: '#fbcfe8' },
  { name: 'Roxo', color: '#e9d5ff' },
  { name: 'Laranja', color: '#fed7aa' },
]

// Emojis mais usados para resumos
const EMOJIS = [
  '📌', '⚠️', '💡', '⚖️', '📚', '🎯', '✅', '❌', '📝', '🔗',
  '📖', '🧠', '⚡', '🏷️', '📋', '❓', '📗', '📘', '📙', '📕'
]

// Toolbar simples e funcional
function EditorToolbar({ editor }: { editor: Editor | null }) {
  const [showTextColor, setShowTextColor] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)

  const textColorRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (textColorRef.current && !textColorRef.current.contains(event.target as Node)) {
        setShowTextColor(false)
      }
      if (highlightRef.current && !highlightRef.current.contains(event.target as Node)) {
        setShowHighlight(false)
      }
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmojis(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!editor) return null

  // Funções individuais para cada ação - evita confusão
  const handleUndo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().undo().run()
  }

  const handleRedo = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().redo().run()
  }

  const handleHeading = (e: React.MouseEvent, level: 1 | 2 | 3) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleHeading({ level }).run()
  }

  const handleBold = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleBold().run()
  }

  const handleItalic = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleItalic().run()
  }

  const handleUnderline = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleUnderline().run()
  }

  const handleStrike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleStrike().run()
  }

  const handleBulletList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleBulletList().run()
  }

  const handleOrderedList = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleOrderedList().run()
  }

  const handleBlockquote = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleBlockquote().run()
  }

  const handleCode = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().toggleCode().run()
  }

  const handleHorizontalRule = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().setHorizontalRule().run()
  }

  const handleClearFormat = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().clearNodes().unsetAllMarks().run()
  }

  // Aplicar cor de texto
  const handleTextColor = (e: React.MouseEvent, color: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (color) {
      editor.chain().focus().setColor(color).run()
    } else {
      editor.chain().focus().unsetColor().run()
    }
    setShowTextColor(false)
  }

  // Aplicar marca-texto
  const handleHighlight = (e: React.MouseEvent, color: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (color) {
      editor.chain().focus().setHighlight({ color }).run()
    } else {
      editor.chain().focus().unsetHighlight().run()
    }
    setShowHighlight(false)
  }

  // Inserir emoji
  const handleEmoji = (e: React.MouseEvent, emoji: string) => {
    e.preventDefault()
    e.stopPropagation()
    editor.chain().focus().insertContent(emoji).run()
    setShowEmojis(false)
  }

  // Toggle dropdowns
  const toggleTextColor = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowTextColor(!showTextColor)
    setShowHighlight(false)
    setShowEmojis(false)
  }

  const toggleHighlight = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowHighlight(!showHighlight)
    setShowTextColor(false)
    setShowEmojis(false)
  }

  const toggleEmojis = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowEmojis(!showEmojis)
    setShowTextColor(false)
    setShowHighlight(false)
  }

  // Classe para botões ativos - tamanhos responsivos
  const btnClass = (isActive: boolean) =>
    `p-1 sm:p-1.5 md:p-2 rounded transition-colors touch-manipulation ${
      isActive
        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`

  // Separador responsivo - escondido em telas muito pequenas
  const Separator = () => (
    <div className="hidden xs:block w-px h-4 sm:h-5 bg-gray-300 dark:bg-gray-600 mx-0.5 sm:mx-1" />
  )

  return (
    <div className="sticky top-0 z-40 bg-gray-50 dark:bg-[#1a2330] border-b border-gray-200 dark:border-gray-700 p-1.5 sm:p-2 rounded-t-xl shadow-sm">
      <div className="flex flex-wrap items-center gap-0.5 sm:gap-1">
        {/* Desfazer/Refazer */}
        <button
          type="button"
          onMouseDown={handleUndo}
          disabled={!editor.can().undo()}
          className={btnClass(false)}
          title="Desfazer"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">undo</span>
        </button>
        <button
          type="button"
          onMouseDown={handleRedo}
          disabled={!editor.can().redo()}
          className={btnClass(false)}
          title="Refazer"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">redo</span>
        </button>

        <Separator />

        {/* Títulos */}
        <button
          type="button"
          onMouseDown={(e) => handleHeading(e, 1)}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Título 1"
        >
          <span className="font-bold text-sm">H1</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleHeading(e, 2)}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Título 2"
        >
          <span className="font-bold text-sm">H2</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => handleHeading(e, 3)}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Título 3"
        >
          <span className="font-bold text-xs">H3</span>
        </button>

        <Separator />

        {/* Formatação básica */}
        <button
          type="button"
          onMouseDown={handleBold}
          className={btnClass(editor.isActive('bold'))}
          title="Negrito"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">format_bold</span>
        </button>
        <button
          type="button"
          onMouseDown={handleItalic}
          className={btnClass(editor.isActive('italic'))}
          title="Itálico"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">format_italic</span>
        </button>
        <button
          type="button"
          onMouseDown={handleUnderline}
          className={btnClass(editor.isActive('underline'))}
          title="Sublinhado"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">format_underlined</span>
        </button>
        <button
          type="button"
          onMouseDown={handleStrike}
          className={btnClass(editor.isActive('strike'))}
          title="Tachado"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">strikethrough_s</span>
        </button>

        <Separator />

        {/* Cor do texto */}
        <div ref={textColorRef} className="relative">
          <button
            type="button"
            onMouseDown={toggleTextColor}
            className={btnClass(false)}
            title="Cor do texto"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">format_color_text</span>
          </button>
          {showTextColor && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50 w-36">
              <div className="grid grid-cols-4 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onMouseDown={(e) => handleTextColor(e, c.color)}
                    className="w-7 h-7 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => handleTextColor(e, '')}
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Remover cor
              </button>
            </div>
          )}
        </div>

        {/* Marca-texto */}
        <div ref={highlightRef} className="relative">
          <button
            type="button"
            onMouseDown={toggleHighlight}
            className={btnClass(editor.isActive('highlight'))}
            title="Marca-texto"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">ink_highlighter</span>
          </button>
          {showHighlight && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50 w-36">
              <div className="grid grid-cols-3 gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onMouseDown={(e) => handleHighlight(e, c.color)}
                    className="w-9 h-7 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => handleHighlight(e, '')}
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Remover destaque
              </button>
            </div>
          )}
        </div>

        <Separator />

        {/* Emojis */}
        <div ref={emojiRef} className="relative">
          <button
            type="button"
            onMouseDown={toggleEmojis}
            className={btnClass(false)}
            title="Emojis"
          >
            <span className="text-base sm:text-lg">😀</span>
          </button>
          {showEmojis && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50 w-52">
              <div className="grid grid-cols-5 gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onMouseDown={(e) => handleEmoji(e, emoji)}
                    className="w-9 h-9 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Listas */}
        <button
          type="button"
          onMouseDown={handleBulletList}
          className={btnClass(editor.isActive('bulletList'))}
          title="Lista"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">format_list_bulleted</span>
        </button>
        <button
          type="button"
          onMouseDown={handleOrderedList}
          className={btnClass(editor.isActive('orderedList'))}
          title="Lista numerada"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">format_list_numbered</span>
        </button>

        <Separator />

        {/* Citação e código */}
        <button
          type="button"
          onMouseDown={handleBlockquote}
          className={btnClass(editor.isActive('blockquote'))}
          title="Citação"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">format_quote</span>
        </button>
        <button
          type="button"
          onMouseDown={handleCode}
          className={btnClass(editor.isActive('code'))}
          title="Código"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">code</span>
        </button>

        <Separator />

        {/* Linha e limpar */}
        <button
          type="button"
          onMouseDown={handleHorizontalRule}
          className={btnClass(false)}
          title="Linha"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">horizontal_rule</span>
        </button>
        <button
          type="button"
          onMouseDown={handleClearFormat}
          className={btnClass(false)}
          title="Limpar formatação"
        >
          <span className="material-symbols-outlined text-base sm:text-lg">format_clear</span>
        </button>
      </div>
    </div>
  )
}

// Converter Markdown para HTML
function markdownToHtml(markdown: string): string {
  let html = markdown
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/==([^=]+)==/g, '<mark>$1</mark>')
  html = html.replace(/~~([^~]+)~~/g, '<s>$1</s>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/^> (.*$)/gm, '<blockquote><p>$1</p></blockquote>')
  html = html.replace(/^[-_─━═]{3,}$/gm, '<hr>')
  html = html.replace(/^[•▸-] (.*$)/gm, '<li>$1</li>')
  html = html.replace(/^→ (.*$)/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  const lines = html.split('\n')
  const processed = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return '<p><br></p>'
    if (trimmed.startsWith('<')) return line
    return `<p>${line}</p>`
  })
  return processed.join('')
}

// Converter HTML para Markdown
function htmlToMarkdown(html: string): string {
  let md = html
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*')
  md = md.replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')
  md = md.replace(/<mark[^>]*>(.*?)<\/mark>/gi, '==$1==')
  md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
  md = md.replace(/<del>(.*?)<\/del>/gi, '~~$1~~')
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`')
  md = md.replace(/<blockquote[^>]*><p>(.*?)<\/p><\/blockquote>/gi, '> $1\n')
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n')
  md = md.replace(/<ul[^>]*>/gi, '')
  md = md.replace(/<\/ul>/gi, '')
  md = md.replace(/<ol[^>]*>/gi, '')
  md = md.replace(/<\/ol>/gi, '')
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  md = md.replace(/<p[^>]*><br\s*\/?><\/p>/gi, '\n')
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
  md = md.replace(/<br\s*\/?>/gi, '\n')
  md = md.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1')
  md = md.replace(/<[^>]+>/g, '')
  md = md.replace(/&nbsp;/g, ' ')
  md = md.replace(/&amp;/g, '&')
  md = md.replace(/&lt;/g, '<')
  md = md.replace(/&gt;/g, '>')
  md = md.replace(/\n{3,}/g, '\n\n')
  return md.trim()
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: placeholder || 'Digite o conteúdo...',
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

  useEffect(() => {
    if (editor && content) {
      const currentMd = htmlToMarkdown(editor.getHTML())
      if (currentMd !== content) {
        editor.commands.setContent(markdownToHtml(content))
      }
    }
  }, [content, editor])

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#141A21] relative">
      {/* Toolbar sticky - fica fixa no topo ao rolar */}
      <EditorToolbar editor={editor} />
      {/* Conteúdo do editor */}
      <EditorContent editor={editor} className="tiptap-editor" />

      <style jsx global>{`
        .tiptap-editor .ProseMirror {
          min-height: 300px;
          padding: 1rem;
          outline: none;
        }
        .tiptap-editor .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #9333ea;
          margin: 1.5rem 0 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e9d5ff;
        }
        .tiptap-editor .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #9333ea;
          margin: 1rem 0 0.5rem;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #a855f7;
          margin: 0.75rem 0 0.5rem;
        }
        .tiptap-editor .ProseMirror p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .tiptap-editor .ProseMirror strong { font-weight: 700; }
        .tiptap-editor .ProseMirror em { font-style: italic; }
        .tiptap-editor .ProseMirror u { text-decoration: underline; }
        .tiptap-editor .ProseMirror s { text-decoration: line-through; color: #9ca3af; }
        .tiptap-editor .ProseMirror mark { padding: 0 0.25rem; border-radius: 0.25rem; }
        .tiptap-editor .ProseMirror code {
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        .tiptap-editor .ProseMirror blockquote {
          border-left: 4px solid #9333ea;
          margin: 1rem 0;
          padding: 0.75rem 1rem;
          background: #faf5ff;
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
        }
        .tiptap-editor .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .tiptap-editor .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .tiptap-editor .ProseMirror li { margin: 0.25rem 0; }
        .tiptap-editor .ProseMirror li::marker { color: #9333ea; }
        .tiptap-editor .ProseMirror hr { border: none; border-top: 2px solid #e5e7eb; margin: 1.5rem 0; }
        .tiptap-editor .ProseMirror.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .dark .tiptap-editor .ProseMirror code { background: #374151; color: #f3f4f6; }
        .dark .tiptap-editor .ProseMirror blockquote { background: rgba(147, 51, 234, 0.1); }
        .dark .tiptap-editor .ProseMirror hr { border-top-color: #374151; }
      `}</style>
    </div>
  )
}
