'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Componente da Barra de Ferramentas de Edição
interface ToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  conteudo: string
  setConteudo: (value: string) => void
  historico: string[]
  setHistorico: (value: string[]) => void
  historicoIndex: number
  setHistoricoIndex: (value: number) => void
}

function EditorToolbar({
  textareaRef,
  conteudo,
  setConteudo,
  historico,
  setHistorico,
  historicoIndex,
  setHistoricoIndex
}: ToolbarProps) {
  // Função para inserir formatação no texto
  const insertFormat = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = conteudo.substring(start, end)

    const newText = conteudo.substring(0, start) + prefix + selectedText + suffix + conteudo.substring(end)

    // Salvar no histórico
    const novoHistorico = historico.slice(0, historicoIndex + 1)
    novoHistorico.push(newText)
    setHistorico(novoHistorico)
    setHistoricoIndex(novoHistorico.length - 1)

    setConteudo(newText)

    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length)
      }
    }, 0)
  }

  // Função para inserir heading
  const insertHeading = (level: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = conteudo.substring(start, end)

    // Encontrar início da linha
    let lineStart = start
    while (lineStart > 0 && conteudo[lineStart - 1] !== '\n') {
      lineStart--
    }

    const prefix = '#'.repeat(level) + ' '
    const lineContent = selectedText || 'Título'
    const newText = conteudo.substring(0, lineStart) + prefix + lineContent + conteudo.substring(end)

    // Salvar no histórico
    const novoHistorico = historico.slice(0, historicoIndex + 1)
    novoHistorico.push(newText)
    setHistorico(novoHistorico)
    setHistoricoIndex(novoHistorico.length - 1)

    setConteudo(newText)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = lineStart + prefix.length + lineContent.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Desfazer
  const handleUndo = () => {
    if (historicoIndex > 0) {
      setHistoricoIndex(historicoIndex - 1)
      setConteudo(historico[historicoIndex - 1])
    }
  }

  // Refazer
  const handleRedo = () => {
    if (historicoIndex < historico.length - 1) {
      setHistoricoIndex(historicoIndex + 1)
      setConteudo(historico[historicoIndex + 1])
    }
  }

  // Botão da toolbar
  const ToolbarButton = ({
    icon,
    label,
    onClick,
    disabled = false,
    active = false
  }: {
    icon: string
    label: string
    onClick: () => void
    disabled?: boolean
    active?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-[#333d4a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : 'text-gray-600 dark:text-gray-400'
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  )

  // Separador
  const Separator = () => (
    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
  )

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 bg-gray-100 dark:bg-[#1a2330] border border-gray-200 dark:border-[#283039] rounded-t-xl">
      {/* Desfazer / Refazer */}
      <ToolbarButton
        icon="undo"
        label="Desfazer (Ctrl+Z)"
        onClick={handleUndo}
        disabled={historicoIndex <= 0}
      />
      <ToolbarButton
        icon="redo"
        label="Refazer (Ctrl+Y)"
        onClick={handleRedo}
        disabled={historicoIndex >= historico.length - 1}
      />

      <Separator />

      {/* Headings */}
      <div className="relative group">
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-[#333d4a] text-gray-600 dark:text-gray-400 text-sm font-medium"
        >
          <span className="material-symbols-outlined text-lg">title</span>
          <span className="hidden sm:inline text-xs">Título</span>
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </button>
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
          <button onClick={() => insertHeading(1)} className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#283039] text-lg font-bold">Título 1</button>
          <button onClick={() => insertHeading(2)} className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#283039] text-base font-bold">Título 2</button>
          <button onClick={() => insertHeading(3)} className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#283039] text-sm font-semibold">Título 3</button>
          <button onClick={() => insertHeading(4)} className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-[#283039] text-sm">Subtítulo</button>
        </div>
      </div>

      <Separator />

      {/* Formatação de texto */}
      <ToolbarButton
        icon="format_bold"
        label="Negrito (Ctrl+B)"
        onClick={() => insertFormat('**')}
      />
      <ToolbarButton
        icon="format_italic"
        label="Itálico (Ctrl+I)"
        onClick={() => insertFormat('*')}
      />
      <ToolbarButton
        icon="strikethrough_s"
        label="Tachado"
        onClick={() => insertFormat('~~')}
      />
      <ToolbarButton
        icon="code"
        label="Código"
        onClick={() => insertFormat('`')}
      />

      <Separator />

      {/* Marca texto (highlight) */}
      <ToolbarButton
        icon="ink_highlighter"
        label="Marca-texto"
        onClick={() => insertFormat('==', '==')}
      />

      <Separator />

      {/* Listas e citações */}
      <ToolbarButton
        icon="format_list_bulleted"
        label="Lista"
        onClick={() => insertFormat('\n- ', '')}
      />
      <ToolbarButton
        icon="format_quote"
        label="Citação"
        onClick={() => insertFormat('\n> ', '')}
      />

      <Separator />

      {/* Links e mais */}
      <ToolbarButton
        icon="link"
        label="Link"
        onClick={() => insertFormat('[', '](url)')}
      />
      <ToolbarButton
        icon="horizontal_rule"
        label="Linha horizontal"
        onClick={() => insertFormat('\n\n---\n\n', '')}
      />
    </div>
  )
}

interface ResumoIA {
  id: string
  user_id: string
  titulo: string
  resumo: string
  disciplina: string | null
  assunto: string | null
  created_at: string
  compartilhado?: boolean
}

interface VisualizadorResumoPanelProps {
  resumo: ResumoIA | null
  isOpen: boolean
  onClose: () => void
  onCompartilhar?: (resumoId: string) => Promise<string | null>
  onSalvar?: (resumoId: string, novoConteudo: string) => Promise<boolean>
  onExcluir?: (resumoId: string) => Promise<boolean>
}

export default function VisualizadorResumoPanel({
  resumo,
  isOpen,
  onClose,
  onCompartilhar,
  onSalvar,
  onExcluir
}: VisualizadorResumoPanelProps) {
  const [copiado, setCopiado] = useState(false)
  const [compartilhando, setCompartilhando] = useState(false)
  const [linkCompartilhamento, setLinkCompartilhamento] = useState<string | null>(null)
  const [modoEdicao, setModoEdicao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [conteudoEditado, setConteudoEditado] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvou, setSalvou] = useState(false)

  // Estados para histórico de edição (undo/redo)
  const [historico, setHistorico] = useState<string[]>([])
  const [historicoIndex, setHistoricoIndex] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sincronizar conteúdo quando resumo muda
  useEffect(() => {
    if (resumo) {
      setConteudoEditado(resumo.resumo)
      setModoEdicao(false)
      setLinkCompartilhamento(null)
      // Inicializar histórico
      setHistorico([resumo.resumo])
      setHistoricoIndex(0)
    }
  }, [resumo])

  // Handler para mudanças no textarea (salvar no histórico)
  const handleConteudoChange = useCallback((novoConteudo: string) => {
    setConteudoEditado(novoConteudo)

    // Debounce para salvar no histórico
    const novoHistorico = historico.slice(0, historicoIndex + 1)
    novoHistorico.push(novoConteudo)
    // Limitar histórico a 50 itens
    if (novoHistorico.length > 50) {
      novoHistorico.shift()
    }
    setHistorico(novoHistorico)
    setHistoricoIndex(novoHistorico.length - 1)
  }, [historico, historicoIndex])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modoEdicao) return

      // Ctrl+Z - Desfazer
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (historicoIndex > 0) {
          setHistoricoIndex(historicoIndex - 1)
          setConteudoEditado(historico[historicoIndex - 1])
        }
      }

      // Ctrl+Y ou Ctrl+Shift+Z - Refazer
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        if (historicoIndex < historico.length - 1) {
          setHistoricoIndex(historicoIndex + 1)
          setConteudoEditado(historico[historicoIndex + 1])
        }
      }

      // Ctrl+B - Negrito
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const selectedText = conteudoEditado.substring(start, end)
          const newText = conteudoEditado.substring(0, start) + '**' + selectedText + '**' + conteudoEditado.substring(end)
          handleConteudoChange(newText)
        }
      }

      // Ctrl+I - Itálico
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault()
        const textarea = textareaRef.current
        if (textarea) {
          const start = textarea.selectionStart
          const end = textarea.selectionEnd
          const selectedText = conteudoEditado.substring(start, end)
          const newText = conteudoEditado.substring(0, start) + '*' + selectedText + '*' + conteudoEditado.substring(end)
          handleConteudoChange(newText)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modoEdicao, historicoIndex, historico, conteudoEditado, handleConteudoChange])

  if (!resumo) return null

  const formatarData = (dataString: string) => {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(conteudoEditado)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const handleCompartilhar = async () => {
    if (!onCompartilhar) return

    setCompartilhando(true)
    try {
      const link = await onCompartilhar(resumo.id)
      if (link) {
        setLinkCompartilhamento(link)
        await navigator.clipboard.writeText(link)
      }
    } catch (err) {
      console.error('Erro ao compartilhar:', err)
    } finally {
      setCompartilhando(false)
    }
  }

  const handleSalvar = async () => {
    if (!onSalvar) return

    setSalvando(true)
    try {
      const sucesso = await onSalvar(resumo.id, conteudoEditado)
      if (sucesso) {
        setSalvou(true)
        setModoEdicao(false)
        setTimeout(() => setSalvou(false), 2000)
      }
    } catch (err) {
      console.error('Erro ao salvar:', err)
    } finally {
      setSalvando(false)
    }
  }

  const handleCancelarEdicao = () => {
    setConteudoEditado(resumo.resumo)
    setModoEdicao(false)
  }

  const handleExcluir = async () => {
    if (!onExcluir) return

    if (!confirm('Tem certeza que deseja excluir este resumo? Esta ação não pode ser desfeita.')) {
      return
    }

    setExcluindo(true)
    try {
      const sucesso = await onExcluir(resumo.id)
      if (sucesso) {
        onClose()
      }
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir resumo. Tente novamente.')
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[70%] lg:w-[55%] xl:w-[50%] bg-white dark:bg-[#1C252E] shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header - compacto em mobile */}
        <div className="shrink-0 bg-white dark:bg-[#1C252E] border-b border-gray-200 dark:border-[#283039] px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                {resumo.titulo}
              </h2>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 text-xs md:text-sm text-gray-500 dark:text-[#9dabb9]">
                {resumo.disciplina && (
                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">
                    {resumo.disciplina}
                  </span>
                )}
                {resumo.assunto && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
                    <span className="hidden sm:inline">{resumo.assunto}</span>
                  </>
                )}
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{formatarData(resumo.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              {/* Botão de Edição */}
              {!modoEdicao ? (
                <button
                  onClick={() => setModoEdicao(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#283039] rounded-full transition-colors"
                  title="Editar resumo"
                >
                  <span className="material-symbols-outlined text-gray-500 dark:text-[#9dabb9]">edit</span>
                </button>
              ) : (
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-full">
                  Editando
                </span>
              )}
              {/* Botão de Excluir */}
              {onExcluir && (
                <button
                  onClick={handleExcluir}
                  disabled={excluindo}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group"
                  title="Excluir resumo"
                >
                  {excluindo ? (
                    <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-gray-500 dark:text-[#9dabb9] group-hover:text-red-500 transition-colors">delete</span>
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-[#283039] rounded-full transition-colors"
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined text-gray-500 dark:text-[#9dabb9]">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content - padding responsivo */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {modoEdicao ? (
            /* Modo Edição com Toolbar */
            <div className="h-full flex flex-col">
              {/* Barra de Ferramentas */}
              <EditorToolbar
                textareaRef={textareaRef}
                conteudo={conteudoEditado}
                setConteudo={handleConteudoChange}
                historico={historico}
                setHistorico={setHistorico}
                historicoIndex={historicoIndex}
                setHistoricoIndex={setHistoricoIndex}
              />
              {/* Textarea de edição */}
              <textarea
                ref={textareaRef}
                value={conteudoEditado}
                onChange={(e) => handleConteudoChange(e.target.value)}
                className="flex-1 w-full p-4 bg-gray-50 dark:bg-[#141A21] border border-gray-200 dark:border-[#283039] border-t-0 rounded-b-xl font-mono text-sm text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Digite o conteúdo do resumo..."
              />
            </div>
          ) : (
            /* Modo Visualização com Markdown e ASCII Art */
            <div className="bg-gray-50 dark:bg-[#141A21] rounded-xl p-4 md:p-6 border border-gray-200 dark:border-[#283039]">
              {/* Verificar se tem caracteres ASCII art */}
              {/[═─┌┐└┘├┤┬┴┼│]/u.test(conteudoEditado) ? (
                /* Renderização especial para resumos com ASCII art */
                <div
                  className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200 overflow-x-auto"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', monospace",
                    tabSize: 2
                  }}
                >
                  {conteudoEditado.split('\n').map((linha, idx) => {
                    // Detectar tipo de linha para estilização
                    const isHeader = /^[═━]+$/.test(linha) || linha.includes('═══')
                    const isSeparator = /^[─┄]+$/.test(linha) || linha.includes('───') || linha.includes('━━━')
                    const isBoxTop = linha.includes('┌─') || linha.includes('╔═')
                    const isBoxBottom = linha.includes('└─') || linha.includes('╚═')
                    const isBoxMiddle = linha.includes('├─') || linha.includes('╠═')
                    const isBoxSide = linha.startsWith('│') || linha.startsWith('║')
                    const isTitleLine = /^#+\s/.test(linha.trim())
                    const isEmoji = /^[📌💡🎯⚠️✅❌⚖️📋🧠📝📚📖🔗✨🏷️❓💾🔄⚡]/.test(linha.trim())
                    const hasBold = /\*\*[^*]+\*\*/.test(linha)

                    let className = 'block'
                    let content = linha

                    // Aplicar estilos baseado no tipo de linha
                    if (isHeader || (linha.trim().toUpperCase() === linha.trim() && linha.trim().length > 10 && !linha.includes('│'))) {
                      className += ' text-purple-600 dark:text-purple-400 font-bold'
                    } else if (isSeparator) {
                      className += ' text-purple-400 dark:text-purple-600 opacity-60'
                    } else if (isBoxTop || isBoxBottom || isBoxMiddle) {
                      className += ' text-purple-500 dark:text-purple-400'
                    } else if (isBoxSide) {
                      className += ' text-purple-500 dark:text-purple-400'
                    } else if (isTitleLine) {
                      className += ' text-lg font-bold text-purple-600 dark:text-purple-400 mt-4 mb-2'
                      content = linha.replace(/^#+\s/, '')
                    } else if (isEmoji) {
                      className += ' mt-4 font-semibold text-gray-900 dark:text-white'
                    }

                    // Renderizar negrito inline
                    if (hasBold) {
                      const parts = content.split(/(\*\*[^*]+\*\*)/)
                      return (
                        <span key={idx} className={className}>
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={pIdx} className="font-bold text-gray-900 dark:text-white bg-yellow-100/50 dark:bg-yellow-900/30 px-0.5 rounded">
                                  {part.slice(2, -2)}
                                </strong>
                              )
                            }
                            return <span key={pIdx}>{part}</span>
                          })}
                          {'\n'}
                        </span>
                      )
                    }

                    return <span key={idx} className={className}>{content}{'\n'}</span>
                  })}
                </div>
              ) : (
                /* Renderização Markdown padrão */
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-purple-600 dark:prose-headings:text-purple-400 prose-strong:text-gray-900 dark:prose-strong:text-white">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => (
                        <h1 className="text-2xl font-bold text-purple-600 dark:text-purple-400 border-b border-purple-200 dark:border-purple-800 pb-2 mb-4">{children}</h1>
                      ),
                      h2: ({children}) => (
                        <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-6 mb-3">{children}</h2>
                      ),
                      h3: ({children}) => (
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">{children}</h3>
                      ),
                      strong: ({children}) => (
                        <strong className="font-bold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">{children}</strong>
                      ),
                      em: ({children}) => (
                        <em className="italic text-purple-600 dark:text-purple-400">{children}</em>
                      ),
                      ul: ({children}) => (
                        <ul className="list-none space-y-1 my-2">{children}</ul>
                      ),
                      li: ({children}) => (
                        <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                          <span className="text-purple-500 mt-1">▸</span>
                          <span>{children}</span>
                        </li>
                      ),
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 bg-purple-50 dark:bg-purple-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300">
                          {children}
                        </blockquote>
                      ),
                      code: ({children, className}) => {
                        const isBlock = className?.includes('language-')
                        if (isBlock) {
                          return (
                            <code className="block bg-gray-800 dark:bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre">
                              {children}
                            </code>
                          )
                        }
                        return (
                          <code className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        )
                      },
                      pre: ({children}) => (
                        <pre className="bg-gray-800 dark:bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono whitespace-pre">
                          {children}
                        </pre>
                      ),
                      hr: () => (
                        <hr className="my-6 border-gray-300 dark:border-gray-600" />
                      ),
                      p: ({children}) => (
                        <p className="text-gray-700 dark:text-gray-300 my-2 leading-relaxed">
                          {children}
                        </p>
                      ),
                      table: ({children}) => (
                        <div className="overflow-x-auto my-4 rounded-lg border border-gray-300 dark:border-gray-600">
                          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({children}) => (
                        <thead className="bg-purple-100 dark:bg-purple-900/30">
                          {children}
                        </thead>
                      ),
                      tbody: ({children}) => (
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#1C252E]">
                          {children}
                        </tbody>
                      ),
                      tr: ({children}) => (
                        <tr className="hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors">
                          {children}
                        </tr>
                      ),
                      th: ({children}) => (
                        <th className="text-purple-700 dark:text-purple-300 px-4 py-3 text-left font-semibold text-sm">
                          {children}
                        </th>
                      ),
                      td: ({children}) => (
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {conteudoEditado}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions - responsivo */}
        <div className="shrink-0 bg-white dark:bg-[#1C252E] border-t border-gray-200 dark:border-[#283039] px-4 py-3 md:px-6 md:py-4">
          {modoEdicao ? (
            /* Botões de Edição */
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={handleCancelarEdicao}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#283039] dark:hover:bg-[#333d4a] dark:text-gray-300 rounded-lg font-medium text-sm md:text-base transition-all"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                <span className="hidden sm:inline">Cancelar</span>
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando || conteudoEditado === resumo.resumo}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm md:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Salvando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">save</span>
                    Salvar
                  </>
                )}
              </button>
              {salvou && (
                <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span className="hidden sm:inline">Salvo!</span>
                </span>
              )}
            </div>
          ) : (
            /* Botões normais */
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={handleCopiar}
                className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-medium text-sm md:text-base transition-all ${
                  copiado
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#283039] dark:hover:bg-[#333d4a] dark:text-gray-300'
                }`}
              >
                {copiado ? (
                  <>
                    <span className="material-symbols-outlined text-lg">check</span>
                    <span className="hidden sm:inline">Copiado!</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">content_copy</span>
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCompartilhar}
                disabled={compartilhando}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm md:text-base transition-colors disabled:opacity-50"
              >
                {compartilhando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Gerando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">share</span>
                    Compartilhar
                  </>
                )}
              </button>

              {linkCompartilhamento && (
                <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto text-sm text-green-600 dark:text-green-400 mt-2 sm:mt-0">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span>Link copiado!</span>
                  <a
                    href={linkCompartilhamento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    Abrir <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
