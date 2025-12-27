'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

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
      className={`p-2 rounded-lg transition-all ${
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
  return <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
}

// Toolbar do editor
function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-[#1a2330] border border-gray-200 dark:border-[#283039] rounded-t-xl">
      {/* Desfazer / Refazer */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Desfazer (Ctrl+Z)"
      >
        <span className="material-symbols-outlined text-xl">undo</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Refazer (Ctrl+Y)"
      >
        <span className="material-symbols-outlined text-xl">redo</span>
      </ToolbarButton>

      <Separator />

      {/* Títulos */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Título Grande"
      >
        <span className="font-bold text-lg">H1</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Título Médio"
      >
        <span className="font-bold text-base">H2</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Subtítulo"
      >
        <span className="font-bold text-sm">H3</span>
      </ToolbarButton>

      <Separator />

      {/* Formatação de texto */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Negrito (Ctrl+B)"
      >
        <span className="material-symbols-outlined text-xl">format_bold</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Itálico (Ctrl+I)"
      >
        <span className="material-symbols-outlined text-xl">format_italic</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Sublinhado (Ctrl+U)"
      >
        <span className="material-symbols-outlined text-xl">format_underlined</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Tachado"
      >
        <span className="material-symbols-outlined text-xl">strikethrough_s</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Marca-texto"
      >
        <span className="material-symbols-outlined text-xl">ink_highlighter</span>
      </ToolbarButton>

      <Separator />

      {/* Listas */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Lista com marcadores"
      >
        <span className="material-symbols-outlined text-xl">format_list_bulleted</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Lista numerada"
      >
        <span className="material-symbols-outlined text-xl">format_list_numbered</span>
      </ToolbarButton>

      <Separator />

      {/* Citação e Código */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Citação"
      >
        <span className="material-symbols-outlined text-xl">format_quote</span>
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Código"
      >
        <span className="material-symbols-outlined text-xl">code</span>
      </ToolbarButton>

      <Separator />

      {/* Linha horizontal */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Linha horizontal"
      >
        <span className="material-symbols-outlined text-xl">horizontal_rule</span>
      </ToolbarButton>

      {/* Alinhamento - visível apenas em telas maiores */}
      <div className="hidden md:flex items-center">
        <Separator />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Alinhar à esquerda"
        >
          <span className="material-symbols-outlined text-xl">format_align_left</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Centralizar"
        >
          <span className="material-symbols-outlined text-xl">format_align_center</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Alinhar à direita"
        >
          <span className="material-symbols-outlined text-xl">format_align_right</span>
        </ToolbarButton>
      </div>

      {/* Limpar formatação */}
      <div className="ml-auto">
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Limpar formatação"
        >
          <span className="material-symbols-outlined text-xl">format_clear</span>
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

// Converter HTML para Markdown
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

  // Highlight
  markdown = markdown.replace(/<mark>(.*?)<\/mark>/gi, '==$1==')

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
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded'
        }
      }),
      Underline,
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

        .tiptap-editor .ProseMirror mark {
          background-color: #fef08a;
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

        .dark .tiptap-editor .ProseMirror mark {
          background-color: rgba(234, 179, 8, 0.3);
        }

        .dark .tiptap-editor .ProseMirror hr {
          border-top-color: #374151;
        }
      `}</style>
    </div>
  )
}
