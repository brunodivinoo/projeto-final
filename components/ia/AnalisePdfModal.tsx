'use client'
import { useState, useRef } from 'react'
import { usePdfIA, OpcoesPdf } from '@/hooks/usePdfIA'
import { useLimits } from '@/hooks/useLimits'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AnalisePdfModal({ isOpen, onClose, onSuccess }: Props) {
  const { analisarPdf, enviando, progresso } = usePdfIA()
  const { isPro } = useLimits()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [opcoes, setOpcoes] = useState<OpcoesPdf>({
    resumo: true,
    flashcards: false,
    questoes: false
  })
  const [step, setStep] = useState<'upload' | 'opcoes' | 'processando' | 'sucesso' | 'erro'>('upload')
  const [resultados, setResultados] = useState<{
    resumo?: string
    flashcards?: number
    questoes?: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const maxSizeMB = isPro ? 100 : 50

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    setError(null)

    if (selectedFile.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são aceitos')
      return
    }

    const sizeMB = selectedFile.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      setError(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`)
      return
    }

    setFile(selectedFile)
    setStep('opcoes')
  }

  const toggleOpcao = (key: keyof OpcoesPdf) => {
    setOpcoes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAnalisar = async () => {
    if (!file) return

    if (!opcoes.resumo && !opcoes.flashcards && !opcoes.questoes) {
      setError('Selecione pelo menos uma opção de geração')
      return
    }

    setError(null)
    setStep('processando')

    const result = await analisarPdf(file, opcoes)

    if (result) {
      setResultados({
        resumo: result.resultados.resumo,
        flashcards: result.resultados.flashcards?.length,
        questoes: result.resultados.questoes?.length
      })
      setStep('sucesso')
      onSuccess?.()
    } else {
      setStep('erro')
      setError('Erro ao processar PDF. Tente novamente.')
    }
  }

  const handleReset = () => {
    setFile(null)
    setOpcoes({ resumo: true, flashcards: false, questoes: false })
    setStep('upload')
    setResultados(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1C252E] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1C252E]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-rose-500">picture_as_pdf</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Analisar PDF</h2>
              <p className="text-xs text-[#9dabb9]">Extraia conteúdo e gere materiais de estudo</p>
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
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="material-symbols-outlined text-red-500">error</span>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {step === 'upload' && (
            <div className="flex flex-col gap-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  dragActive
                    ? 'border-rose-500 bg-rose-500/10'
                    : 'border-gray-300 dark:border-[#283039] hover:border-rose-500/50 hover:bg-rose-500/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <div className="size-16 rounded-full bg-gray-200 dark:bg-[#283039] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-4xl text-[#9dabb9]">cloud_upload</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Arraste e solte seu PDF aqui
                </p>
                <p className="text-sm text-[#9dabb9] mb-4">
                  ou clique para selecionar
                </p>
                <p className="text-xs text-[#9dabb9]">
                  Máximo {maxSizeMB}MB • Apenas arquivos PDF
                </p>
              </div>
            </div>
          )}

          {step === 'opcoes' && file && (
            <div className="flex flex-col gap-5">
              {/* Arquivo selecionado */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#141A21] border border-gray-200 dark:border-[#283039]">
                <div className="size-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-rose-500">description</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-[#9dabb9]">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-[#283039] rounded-lg text-[#9dabb9] hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Opções de geração */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  O que você deseja gerar?
                </label>

                <div className="flex flex-col gap-2">
                  {[
                    { key: 'resumo', label: 'Resumo Automático', desc: 'Pontos-chave do documento', icon: 'summarize' },
                    { key: 'flashcards', label: 'Flashcards', desc: 'Para revisão espaçada', icon: 'style' },
                    { key: 'questoes', label: 'Questões de Fixação', desc: 'Quiz múltipla escolha', icon: 'quiz' }
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        opcoes[opt.key as keyof OpcoesPdf]
                          ? 'bg-rose-500/10 border-rose-500'
                          : 'border-gray-200 dark:border-[#283039] hover:bg-gray-50 dark:hover:bg-[#283039]'
                      }`}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={opcoes[opt.key as keyof OpcoesPdf]}
                          onChange={() => toggleOpcao(opt.key as keyof OpcoesPdf)}
                          className="peer size-5 cursor-pointer appearance-none rounded border border-[#9dabb9] checked:border-rose-500 checked:bg-rose-500 transition-all"
                        />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 material-symbols-outlined text-sm">check</span>
                      </div>
                      <div className={`size-10 rounded-lg flex items-center justify-center ${
                        opcoes[opt.key as keyof OpcoesPdf] ? 'bg-rose-500/20 text-rose-500' : 'bg-gray-100 dark:bg-[#283039] text-[#9dabb9]'
                      }`}>
                        <span className="material-symbols-outlined">{opt.icon}</span>
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          opcoes[opt.key as keyof OpcoesPdf] ? 'text-rose-500' : 'text-gray-900 dark:text-white'
                        }`}>{opt.label}</p>
                        <p className="text-xs text-[#9dabb9]">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botão Analisar */}
              <button
                onClick={handleAnalisar}
                disabled={enviando || (!opcoes.resumo && !opcoes.flashcards && !opcoes.questoes)}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                Analisar e Gerar
              </button>
            </div>
          )}

          {step === 'processando' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="size-16 rounded-full bg-rose-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-rose-500 animate-spin">progress_activity</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Processando PDF...</h3>
              <p className="text-sm text-[#9dabb9] text-center max-w-sm">
                A IA está extraindo o conteúdo e gerando os materiais selecionados.
              </p>
              {progresso > 0 && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-gray-200 dark:bg-[#283039] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#9dabb9] text-center mt-2">{progresso}%</p>
                </div>
              )}
            </div>
          )}

          {step === 'sucesso' && resultados && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                <p className="text-sm text-emerald-500">PDF processado com sucesso!</p>
              </div>

              {/* Resultados */}
              <div className="grid grid-cols-3 gap-3">
                {resultados.resumo && (
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                    <span className="material-symbols-outlined text-2xl text-purple-500 mb-2">summarize</span>
                    <p className="text-sm font-medium text-purple-500">Resumo</p>
                    <p className="text-xs text-[#9dabb9]">Gerado</p>
                  </div>
                )}
                {resultados.flashcards && resultados.flashcards > 0 && (
                  <div className="p-4 rounded-lg bg-[#137fec]/10 border border-[#137fec]/20 text-center">
                    <span className="material-symbols-outlined text-2xl text-[#137fec] mb-2">style</span>
                    <p className="text-sm font-medium text-[#137fec]">{resultados.flashcards} Flashcards</p>
                    <p className="text-xs text-[#9dabb9]">Criados</p>
                  </div>
                )}
                {resultados.questoes && resultados.questoes > 0 && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="material-symbols-outlined text-2xl text-emerald-500 mb-2">quiz</span>
                    <p className="text-sm font-medium text-emerald-500">{resultados.questoes} Questões</p>
                    <p className="text-xs text-[#9dabb9]">Geradas</p>
                  </div>
                )}
              </div>

              <p className="text-sm text-[#9dabb9] text-center">
                Os materiais foram salvos e estão disponíveis nas respectivas seções.
              </p>

              {/* Ações */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">upload_file</span>
                  Novo PDF
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                  Concluir
                </button>
              </div>
            </div>
          )}

          {step === 'erro' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="size-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-red-500">error</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Erro ao processar</h3>
              <p className="text-sm text-[#9dabb9] text-center max-w-sm">{error}</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
