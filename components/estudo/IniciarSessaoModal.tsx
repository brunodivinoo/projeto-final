'use client'
import { useState } from 'react'
import { useEstudo } from '@/contexts/EstudoContext'
import { SeletorDisciplina } from './SeletorDisciplina'

interface IniciarSessaoModalProps {
  isOpen: boolean
  onClose: () => void
  cicloId?: string
  cicloItemId?: string
  disciplinaInicial?: string
  assuntoInicial?: string
  subassuntoInicial?: string
}

const METODOS = [
  { id: 'questoes', label: 'Questões', icon: 'quiz', cor: 'blue' },
  { id: 'leitura', label: 'Leitura', icon: 'auto_stories', cor: 'green' },
  { id: 'video', label: 'Vídeo', icon: 'play_circle', cor: 'red' },
  { id: 'resumo', label: 'Resumo', icon: 'edit_note', cor: 'purple' },
  { id: 'flashcard', label: 'Flashcards', icon: 'style', cor: 'orange' },
  { id: 'aula', label: 'Aula', icon: 'school', cor: 'teal' },
  { id: 'pdf', label: 'PDF', icon: 'picture_as_pdf', cor: 'pink' },
  { id: 'outro', label: 'Outro', icon: 'more_horiz', cor: 'slate' },
]

export function IniciarSessaoModal({
  isOpen,
  onClose,
  cicloId,
  cicloItemId,
  disciplinaInicial,
  assuntoInicial,
  subassuntoInicial
}: IniciarSessaoModalProps) {
  const { iniciarSessao, loading } = useEstudo()

  const [selecao, setSelecao] = useState<{
    disciplina_id?: string
    disciplina_nome?: string
    assunto_id?: string
    assunto_nome?: string
    subassunto_id?: string
    subassunto_nome?: string
  }>({
    disciplina_id: disciplinaInicial,
    assunto_id: assuntoInicial,
    subassunto_id: subassuntoInicial
  })

  const [metodo, setMetodo] = useState('leitura')
  const [criarRevisao, setCriarRevisao] = useState(true)
  const [prioridade, setPrioridade] = useState(3)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleIniciar = async () => {
    if (!selecao.disciplina_id) {
      setError('Selecione uma disciplina')
      return
    }

    setError('')

    const sessao = await iniciarSessao({
      disciplina_id: selecao.disciplina_id,
      assunto_id: selecao.assunto_id,
      subassunto_id: selecao.subassunto_id,
      ciclo_id: cicloId,
      ciclo_item_id: cicloItemId,
      metodo,
      criar_revisao: criarRevisao,
      prioridade_revisao: prioridade
    })

    if (sessao) {
      onClose()
    } else {
      setError('Erro ao iniciar sessão. Tente novamente.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1c242d] rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">play_circle</span>
            Iniciar Sessão de Estudo
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Seletor de disciplina */}
          <SeletorDisciplina
            onSelecao={setSelecao}
            valorInicial={{
              disciplina_id: disciplinaInicial,
              assunto_id: assuntoInicial,
              subassunto_id: subassuntoInicial
            }}
            required
          />

          {/* Método de estudo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Método de Estudo <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {METODOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodo(m.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    metodo === m.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{m.icon}</span>
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opções de revisão */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Criar revisão automática
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Agendar revisão com repetição espaçada
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={criarRevisao}
                  onChange={(e) => setCriarRevisao(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {criarRevisao && (
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Prioridade da revisão
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrioridade(p)}
                      className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                        prioridade === p
                          ? p <= 2
                            ? 'bg-green-500 text-white'
                            : p === 3
                            ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Baixa</span>
                  <span>Alta</span>
                </div>
              </div>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleIniciar}
            disabled={loading || !selecao.disciplina_id}
            className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Iniciando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">play_arrow</span>
                Iniciar Sessão
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
