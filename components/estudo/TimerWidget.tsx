'use client'
import { useState } from 'react'
import { useEstudo } from '@/contexts/EstudoContext'

export function TimerWidget() {
  const {
    sessaoAtiva,
    tempoDecorrido,
    isPausado,
    loading,
    pausarSessao,
    retomarSessao,
    finalizarSessao,
    formatarTempo,
    temSessaoAtiva
  } = useEstudo()

  const [showFinalizarModal, setShowFinalizarModal] = useState(false)
  const [questoesFeitas, setQuestoesFeitas] = useState('')
  const [questoesCorretas, setQuestoesCorretas] = useState('')
  const [anotacoes, setAnotacoes] = useState('')
  const [avaliacao, setAvaliacao] = useState(3)

  if (!temSessaoAtiva || !sessaoAtiva) return null

  const handleTogglePause = async () => {
    if (isPausado) {
      await retomarSessao()
    } else {
      await pausarSessao()
    }
  }

  const handleFinalizar = async () => {
    const success = await finalizarSessao({
      questoes_feitas: questoesFeitas ? parseInt(questoesFeitas) : undefined,
      questoes_corretas: questoesCorretas ? parseInt(questoesCorretas) : undefined,
      anotacoes: anotacoes || undefined,
      avaliacao
    })

    if (success) {
      setShowFinalizarModal(false)
      setQuestoesFeitas('')
      setQuestoesCorretas('')
      setAnotacoes('')
      setAvaliacao(3)
    }
  }

  const metodoLabel: Record<string, string> = {
    questoes: 'Questões',
    leitura: 'Leitura',
    video: 'Vídeo',
    resumo: 'Resumo',
    flashcard: 'Flashcards',
    aula: 'Aula',
    revisao: 'Revisão',
    pdf: 'PDF',
    outro: 'Estudo'
  }

  return (
    <>
      {/* Widget flutuante */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white dark:bg-[#1c242d] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {/* Header com matéria */}
          <div className="px-4 py-2 bg-primary/10 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">auto_stories</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
                {sessaoAtiva.disciplina?.nome || 'Estudando...'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {metodoLabel[sessaoAtiva.metodo] || sessaoAtiva.metodo}
              </span>
            </div>
          </div>

          {/* Timer e controles */}
          <div className="p-4 flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className={`text-2xl font-mono font-bold ${isPausado ? 'text-yellow-500' : 'text-primary'}`}>
                {formatarTempo(tempoDecorrido)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isPausado ? 'Em Pausa' : 'Estudando'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão pausar/retomar */}
              <button
                onClick={handleTogglePause}
                disabled={loading}
                className={`p-2 rounded-lg transition-colors ${
                  isPausado
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
                }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {isPausado ? 'play_arrow' : 'pause'}
                </span>
              </button>

              {/* Botão finalizar */}
              <button
                onClick={() => setShowFinalizarModal(true)}
                disabled={loading}
                className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">stop</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de finalização */}
      {showFinalizarModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-[#1c242d] rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Finalizar Sessão
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {sessaoAtiva.disciplina?.nome} - {formatarTempo(tempoDecorrido)}
              </p>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              {/* Questões (se método for questões) */}
              {sessaoAtiva.metodo === 'questoes' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Questões Feitas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={questoesFeitas}
                      onChange={(e) => setQuestoesFeitas(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Corretas
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={questoesFeitas || undefined}
                      value={questoesCorretas}
                      onChange={(e) => setQuestoesCorretas(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              )}

              {/* Avaliação */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Como foi a sessão?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <button
                      key={nota}
                      onClick={() => setAvaliacao(nota)}
                      className={`flex-1 py-2 rounded-lg border transition-colors ${
                        avaliacao === nota
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {nota <= 2 ? 'sentiment_dissatisfied' : nota <= 3 ? 'sentiment_neutral' : 'sentiment_satisfied'}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Ruim</span>
                  <span>Excelente</span>
                </div>
              </div>

              {/* Anotações */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Anotações (opcional)
                </label>
                <textarea
                  value={anotacoes}
                  onChange={(e) => setAnotacoes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm resize-none"
                  placeholder="O que você estudou? Alguma dificuldade?"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setShowFinalizarModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleFinalizar}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check</span>
                    Finalizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
