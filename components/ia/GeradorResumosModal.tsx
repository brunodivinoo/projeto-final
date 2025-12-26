'use client'
import { useState } from 'react'
import { ConfigResumo } from '@/hooks/useResumosIA'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function GeradorResumosModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const { startResumosGeneration, hasActiveGeneration } = useNotifications()

  const [texto, setTexto] = useState('')
  const [titulo, setTitulo] = useState('')
  const [disciplina, setDisciplina] = useState('')
  const [assunto, setAssunto] = useState('')
  const [formato, setFormato] = useState<ConfigResumo['formato']>('topicos')
  const [error, setError] = useState<string | null>(null)

  const handleGerar = async () => {
    if (!user?.id) {
      setError('Você precisa estar logado para gerar resumos')
      return
    }

    if (!texto.trim()) {
      setError('Digite ou cole o texto para resumir')
      return
    }

    if (texto.length < 100) {
      setError('O texto deve ter pelo menos 100 caracteres')
      return
    }

    if (hasActiveGeneration) {
      setError('Já existe uma geração em andamento. Aguarde finalizar.')
      return
    }

    setError(null)

    // Criar título automático se não fornecido
    const tituloFinal = titulo.trim() || texto.slice(0, 50).trim() + '...'

    // Iniciar geração em segundo plano
    startResumosGeneration({
      user_id: user.id,
      texto,
      titulo: tituloFinal,
      disciplina: disciplina || undefined,
      assunto: assunto || undefined,
      formato: formato as 'topicos' | 'mapa_mental' | 'fichamento' | 'esquema'
    })

    // Fechar modal e notificar sucesso
    onSuccess?.()
    handleClose()
  }

  const handleReset = () => {
    setTexto('')
    setTitulo('')
    setDisciplina('')
    setAssunto('')
    setFormato('topicos')
    setError(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1C252E] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1C252E]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-500">summarize</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerar Resumo</h2>
              <p className="text-xs text-[#9dabb9]">Transforme textos em resumos organizados</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] text-[#9dabb9] hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <span className="material-symbols-outlined text-red-500">error</span>
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {/* Aviso de geração em segundo plano */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="material-symbols-outlined text-purple-500">info</span>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                A geração será feita em segundo plano. Você pode navegar normalmente enquanto o resumo é criado.
              </p>
            </div>

            {/* Texto para resumir */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                Texto para resumir <span className="text-red-500">*</span>
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Cole aqui o texto que deseja resumir..."
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-[#9dabb9]">{texto.length} caracteres (mínimo 100)</p>
            </div>

            {/* Título opcional */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Título <span className="text-xs text-[#9dabb9]">(opcional - será gerado automaticamente)</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Princípios da Administração Pública"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Disciplina e Assunto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Disciplina <span className="text-xs text-[#9dabb9]">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                  placeholder="Ex: Direito Administrativo"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Assunto <span className="text-xs text-[#9dabb9]">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Atos Administrativos"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Formato */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">Formato do Resumo</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: 'topicos', label: 'Tópicos', icon: 'list' },
                  { id: 'mapa_mental', label: 'Mapa Mental', icon: 'account_tree' },
                  { id: 'fichamento', label: 'Fichamento', icon: 'description' },
                  { id: 'esquema', label: 'Esquema', icon: 'schema' }
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setFormato(fmt.id as ConfigResumo['formato'])}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                      formato === fmt.id
                        ? 'bg-purple-500/20 border-purple-500 text-purple-500'
                        : 'border-gray-200 dark:border-[#283039] text-[#9dabb9] hover:border-gray-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">{fmt.icon}</span>
                    <span className="text-sm font-medium">{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Gerar */}
            <button
              onClick={handleGerar}
              disabled={hasActiveGeneration || !texto.trim()}
              className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {hasActiveGeneration ? 'Geração em andamento...' : 'Gerar Resumo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
