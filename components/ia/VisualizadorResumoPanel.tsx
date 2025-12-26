'use client'

import { useState } from 'react'

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
}

export default function VisualizadorResumoPanel({
  resumo,
  isOpen,
  onClose,
  onCompartilhar
}: VisualizadorResumoPanelProps) {
  const [copiado, setCopiado] = useState(false)
  const [compartilhando, setCompartilhando] = useState(false)
  const [linkCompartilhamento, setLinkCompartilhamento] = useState<string | null>(null)

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
      await navigator.clipboard.writeText(resumo.resumo)
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
        className={`fixed top-0 right-0 h-full w-full md:w-[60%] lg:w-[50%] bg-white dark:bg-[#1C252E] shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1C252E] border-b border-gray-200 dark:border-[#283039] px-6 py-4 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {resumo.titulo}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-[#9dabb9]">
                {resumo.disciplina && (
                  <>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-medium">
                      {resumo.disciplina}
                    </span>
                  </>
                )}
                {resumo.assunto && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span>{resumo.assunto}</span>
                  </>
                )}
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <span>{formatarData(resumo.created_at)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#283039] rounded-full transition-colors"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-gray-500 dark:text-[#9dabb9]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-140px)] px-6 py-6">
          <div className="bg-gray-50 dark:bg-[#141A21] rounded-xl p-6 border border-gray-200 dark:border-[#283039]">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200 leading-relaxed overflow-x-auto">
              {resumo.resumo}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1C252E] border-t border-gray-200 dark:border-[#283039] px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopiar}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                copiado
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#283039] dark:hover:bg-[#333d4a] dark:text-gray-300'
              }`}
            >
              {copiado ? (
                <>
                  <span className="material-symbols-outlined text-lg">check</span>
                  Copiado!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                  Copiar
                </>
              )}
            </button>

            <button
              onClick={handleCompartilhar}
              disabled={compartilhando}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {compartilhando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gerando link...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">share</span>
                  Compartilhar
                </>
              )}
            </button>

            {linkCompartilhamento && (
              <div className="flex items-center gap-2 ml-auto text-sm text-green-600 dark:text-green-400">
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
        </div>
      </div>
    </>
  )
}
