'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Importar o editor Tiptap de forma dinâmica para evitar problemas de SSR
const TiptapEditor = dynamic(
  () => import('./TiptapEditor'),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 dark:bg-[#141A21] rounded-xl animate-pulse" /> }
)

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

// Função para processar o texto e renderizar visualmente
function processarTextoVisual(texto: string): React.ReactNode[] {
  const linhas = texto.split('\n')
  const elementos: React.ReactNode[] = []

  linhas.forEach((linha, idx) => {
    let processada = linha

    // Detectar tipos de linha
    const isHeader1 = linha.startsWith('# ')
    const isHeader2 = linha.startsWith('## ')
    const isHeader3 = linha.startsWith('### ')
    const isSeparator = /^[─━═_-]{3,}$/.test(linha.trim())
    const isEmptyLine = linha.trim() === ''

    // Remover marcadores de header
    if (isHeader1) processada = linha.substring(2)
    if (isHeader2) processada = linha.substring(3)
    if (isHeader3) processada = linha.substring(4)

    // Processar formatação inline
    const renderInline = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = []
      const remaining = text
      let keyCounter = 0

      // Processar negrito
      const boldRegex = /\*\*([^*]+)\*\*/g
      let lastIndex = 0
      let match

      while ((match = boldRegex.exec(remaining)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<span key={`t-${keyCounter++}`}>{remaining.substring(lastIndex, match.index)}</span>)
        }
        parts.push(<strong key={`b-${keyCounter++}`} className="font-bold text-gray-900 dark:text-white">{match[1]}</strong>)
        lastIndex = match.index + match[0].length
      }

      if (lastIndex < remaining.length) {
        const restante = remaining.substring(lastIndex)
        // Processar highlight ==texto==
        const highlightRegex = /==([^=]+)==/g
        let hlLastIndex = 0
        let hlMatch

        while ((hlMatch = highlightRegex.exec(restante)) !== null) {
          if (hlMatch.index > hlLastIndex) {
            parts.push(<span key={`t-${keyCounter++}`}>{restante.substring(hlLastIndex, hlMatch.index)}</span>)
          }
          parts.push(<mark key={`m-${keyCounter++}`} className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">{hlMatch[1]}</mark>)
          hlLastIndex = hlMatch.index + hlMatch[0].length
        }

        if (hlLastIndex < restante.length) {
          parts.push(<span key={`t-${keyCounter++}`}>{restante.substring(hlLastIndex)}</span>)
        } else if (hlLastIndex === 0 && lastIndex === 0) {
          parts.push(<span key={`t-${keyCounter++}`}>{remaining}</span>)
        }
      }

      return parts.length > 0 ? parts : [<span key="raw">{text}</span>]
    }

    // Renderizar baseado no tipo de linha
    if (isEmptyLine) {
      elementos.push(<div key={idx} className="h-3" />)
    } else if (isSeparator) {
      elementos.push(
        <hr key={idx} className="my-4 border-purple-300 dark:border-purple-700" />
      )
    } else if (isHeader1) {
      elementos.push(
        <h1 key={idx} className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-6 mb-3 pb-2 border-b border-purple-200 dark:border-purple-800">
          {renderInline(processada)}
        </h1>
      )
    } else if (isHeader2) {
      elementos.push(
        <h2 key={idx} className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-5 mb-2">
          {renderInline(processada)}
        </h2>
      )
    } else if (isHeader3) {
      elementos.push(
        <h3 key={idx} className="text-base font-semibold text-purple-500 dark:text-purple-400 mt-4 mb-2">
          {renderInline(processada)}
        </h3>
      )
    } else if (linha.trim().startsWith('- ') || linha.trim().startsWith('• ') || linha.trim().startsWith('▸ ')) {
      const conteudoLista = linha.trim().replace(/^[-•▸]\s*/, '')
      elementos.push(
        <div key={idx} className="flex items-start gap-2 my-1 ml-4">
          <span className="text-purple-500 mt-0.5">▸</span>
          <span className="text-gray-700 dark:text-gray-300">{renderInline(conteudoLista)}</span>
        </div>
      )
    } else if (linha.trim().startsWith('> ')) {
      const conteudoCitacao = linha.trim().substring(2)
      elementos.push(
        <blockquote key={idx} className="border-l-4 border-purple-500 pl-4 py-2 my-3 bg-purple-50 dark:bg-purple-900/20 rounded-r-lg italic text-gray-700 dark:text-gray-300">
          {renderInline(conteudoCitacao)}
        </blockquote>
      )
    } else if (linha.trim().startsWith('→ ') || linha.trim().startsWith('➔ ')) {
      const conteudoSeta = linha.trim().replace(/^[→➔]\s*/, '')
      elementos.push(
        <div key={idx} className="flex items-start gap-2 my-1 ml-2">
          <span className="text-purple-500">→</span>
          <span className="text-gray-700 dark:text-gray-300">{renderInline(conteudoSeta)}</span>
        </div>
      )
    } else {
      elementos.push(
        <p key={idx} className="text-gray-700 dark:text-gray-300 my-1 leading-relaxed">
          {renderInline(processada)}
        </p>
      )
    }
  })

  return elementos
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

  // Sincronizar conteúdo quando resumo muda
  useEffect(() => {
    if (resumo) {
      setConteudoEditado(resumo.resumo)
      setModoEdicao(false)
      setLinkCompartilhamento(null)
    }
  }, [resumo])

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
        {/* Header */}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
          {modoEdicao ? (
            /* Modo Edição com Editor Tiptap */
            <TiptapEditor
              content={conteudoEditado}
              onChange={setConteudoEditado}
              placeholder="Digite o conteúdo do resumo..."
            />
          ) : (
            /* Modo Visualização */
            <div className="bg-gray-50 dark:bg-[#141A21] rounded-xl p-4 md:p-6 border border-gray-200 dark:border-[#283039]">
              <div className="space-y-0">
                {processarTextoVisual(conteudoEditado)}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
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
