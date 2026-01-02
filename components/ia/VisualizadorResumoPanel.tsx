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
  const elementos: React.ReactNode[] = []
  let elementKey = 0

  // Processar formatação inline (negrito, itálico, código, tachado, highlight)
  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let keyCounter = 0

    // Regex para todas as formatações inline
    const inlineRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\~\~([^~]+)\~\~)|(==([^=]+)==)/g
    let lastIndex = 0
    let match

    while ((match = inlineRegex.exec(text)) !== null) {
      // Adiciona texto antes do match
      if (match.index > lastIndex) {
        parts.push(<span key={`t-${keyCounter++}`}>{text.substring(lastIndex, match.index)}</span>)
      }

      if (match[1]) {
        // Negrito **texto**
        parts.push(<strong key={`b-${keyCounter++}`} className="font-bold text-gray-900 dark:text-white">{match[2]}</strong>)
      } else if (match[3]) {
        // Itálico *texto*
        parts.push(<em key={`i-${keyCounter++}`} className="italic text-gray-700 dark:text-gray-300">{match[4]}</em>)
      } else if (match[5]) {
        // Código `texto`
        parts.push(<code key={`c-${keyCounter++}`} className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-purple-600 dark:text-purple-400">{match[6]}</code>)
      } else if (match[7]) {
        // Tachado ~~texto~~
        parts.push(<del key={`d-${keyCounter++}`} className="line-through text-gray-500 dark:text-gray-500">{match[8]}</del>)
      } else if (match[9]) {
        // Highlight ==texto==
        parts.push(<mark key={`m-${keyCounter++}`} className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">{match[10]}</mark>)
      }

      lastIndex = match.index + match[0].length
    }

    // Adiciona texto restante
    if (lastIndex < text.length) {
      parts.push(<span key={`t-${keyCounter++}`}>{text.substring(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : [<span key="raw">{text}</span>]
  }

  // Dividir em blocos (código, tabelas, texto normal)
  const blocos: { tipo: 'codigo' | 'tabela' | 'texto'; conteudo: string }[] = []
  const linhas = texto.split('\n')
  let i = 0

  while (i < linhas.length) {
    const linha = linhas[i]

    // Detectar bloco de código ```
    if (linha.trim().startsWith('```')) {
      const blocoLinhas: string[] = []
      i++ // pular a linha de abertura
      while (i < linhas.length && !linhas[i].trim().startsWith('```')) {
        blocoLinhas.push(linhas[i])
        i++
      }
      blocos.push({ tipo: 'codigo', conteudo: blocoLinhas.join('\n') })
      i++ // pular a linha de fechamento
      continue
    }

    // Detectar tabela markdown (linha começa com |)
    if (linha.trim().startsWith('|') && linha.trim().endsWith('|')) {
      const tabelaLinhas: string[] = [linha]
      i++
      while (i < linhas.length && linhas[i].trim().startsWith('|') && linhas[i].trim().endsWith('|')) {
        tabelaLinhas.push(linhas[i])
        i++
      }
      blocos.push({ tipo: 'tabela', conteudo: tabelaLinhas.join('\n') })
      continue
    }

    // Texto normal
    blocos.push({ tipo: 'texto', conteudo: linha })
    i++
  }

  // Renderizar cada bloco
  blocos.forEach((bloco, blocoIdx) => {
    if (bloco.tipo === 'codigo') {
      // Bloco de código - usado para fluxogramas e mapas mentais
      elementos.push(
        <div key={`code-${blocoIdx}`} className="my-4 bg-gray-900 dark:bg-gray-950 rounded-xl p-4 overflow-x-auto">
          <pre className="text-gray-100 font-mono text-sm whitespace-pre leading-relaxed">
            {bloco.conteudo}
          </pre>
        </div>
      )
    } else if (bloco.tipo === 'tabela') {
      // Tabela markdown
      const linhasTabela = bloco.conteudo.split('\n')
      const cabecalho = linhasTabela[0]?.split('|').filter(c => c.trim()).map(c => c.trim()) || []
      const corpo = linhasTabela.slice(2).map(linha =>
        linha.split('|').filter(c => c.trim()).map(c => c.trim())
      )

      elementos.push(
        <div key={`table-${blocoIdx}`} className="my-4 overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-purple-100 dark:bg-purple-900/40">
                {cabecalho.map((col, colIdx) => (
                  <th key={colIdx} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-sm font-semibold text-purple-700 dark:text-purple-300">
                    {renderInline(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corpo.map((linha, linhaIdx) => (
                <tr key={linhaIdx} className={linhaIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}>
                  {linha.map((cel, celIdx) => (
                    <td key={celIdx} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {renderInline(cel)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    } else {
      // Texto normal - processar linha por linha
      const linha = bloco.conteudo
      const trimmed = linha.trim()

      // Detectar tipos de linha
      const isHeader1 = linha.startsWith('# ')
      const isHeader2 = linha.startsWith('## ')
      const isHeader3 = linha.startsWith('### ')
      const isSeparator = /^[─━═_-]{3,}$/.test(trimmed)
      const isEmptyLine = trimmed === ''
      const isAsciiBox = /^[┌┐└┘├┤│─━╔╗╚╝╠╣║═╭╮╰╯]+/.test(trimmed) || /[┌┐└┘├┤│─━╔╗╚╝╠╣║═╭╮╰╯]+$/.test(trimmed)

      let processada = linha
      if (isHeader1) processada = linha.substring(2)
      if (isHeader2) processada = linha.substring(3)
      if (isHeader3) processada = linha.substring(4)

      if (isEmptyLine) {
        elementos.push(<div key={`empty-${elementKey++}`} className="h-3" />)
      } else if (isSeparator) {
        elementos.push(
          <hr key={`sep-${elementKey++}`} className="my-4 border-purple-300 dark:border-purple-700" />
        )
      } else if (isAsciiBox) {
        // Linhas com caracteres ASCII de caixa - renderizar como monospace
        elementos.push(
          <div key={`ascii-${elementKey++}`} className="font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre leading-tight">
            {linha}
          </div>
        )
      } else if (isHeader1) {
        elementos.push(
          <h1 key={`h1-${elementKey++}`} className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-6 mb-3 pb-2 border-b border-purple-200 dark:border-purple-800">
            {renderInline(processada)}
          </h1>
        )
      } else if (isHeader2) {
        elementos.push(
          <h2 key={`h2-${elementKey++}`} className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-5 mb-2">
            {renderInline(processada)}
          </h2>
        )
      } else if (isHeader3) {
        elementos.push(
          <h3 key={`h3-${elementKey++}`} className="text-base font-semibold text-purple-500 dark:text-purple-400 mt-4 mb-2">
            {renderInline(processada)}
          </h3>
        )
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('▸ ')) {
        const conteudoLista = trimmed.replace(/^[-•▸]\s*/, '')
        elementos.push(
          <div key={`list-${elementKey++}`} className="flex items-start gap-2 my-1 ml-4">
            <span className="text-purple-500 mt-0.5">▸</span>
            <span className="text-gray-700 dark:text-gray-300">{renderInline(conteudoLista)}</span>
          </div>
        )
      } else if (trimmed.startsWith('> ')) {
        const conteudoCitacao = trimmed.substring(2)
        elementos.push(
          <blockquote key={`quote-${elementKey++}`} className="border-l-4 border-purple-500 pl-4 py-2 my-3 bg-purple-50 dark:bg-purple-900/20 rounded-r-lg text-gray-700 dark:text-gray-300">
            {renderInline(conteudoCitacao)}
          </blockquote>
        )
      } else if (trimmed.startsWith('→ ') || trimmed.startsWith('➔ ')) {
        const conteudoSeta = trimmed.replace(/^[→➔]\s*/, '')
        elementos.push(
          <div key={`arrow-${elementKey++}`} className="flex items-start gap-2 my-1 ml-6">
            <span className="text-purple-500">→</span>
            <span className="text-gray-700 dark:text-gray-300">{renderInline(conteudoSeta)}</span>
          </div>
        )
      } else if (trimmed.match(/^\d+\.\s/)) {
        // Lista numerada
        const conteudoNum = trimmed.replace(/^\d+\.\s*/, '')
        const numero = trimmed.match(/^(\d+)\./)?.[1]
        elementos.push(
          <div key={`num-${elementKey++}`} className="flex items-start gap-2 my-1 ml-4">
            <span className="text-purple-600 dark:text-purple-400 font-semibold min-w-[1.5rem]">{numero}.</span>
            <span className="text-gray-700 dark:text-gray-300">{renderInline(conteudoNum)}</span>
          </div>
        )
      } else {
        elementos.push(
          <p key={`p-${elementKey++}`} className="text-gray-700 dark:text-gray-300 my-1 leading-relaxed">
            {renderInline(processada)}
          </p>
        )
      }
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

  // Sincronizar conteúdo quando resumo muda (incluindo o conteúdo interno)
  useEffect(() => {
    if (resumo) {
      setConteudoEditado(resumo.resumo)
      setLinkCompartilhamento(null)
    }
  }, [resumo?.id, resumo?.resumo])

  // Reset modo edição quando o resumo muda
  useEffect(() => {
    setModoEdicao(false)
  }, [resumo?.id])

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
