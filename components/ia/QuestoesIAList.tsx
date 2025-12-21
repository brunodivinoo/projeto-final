'use client'
import { useState } from 'react'
import { QuestaoIA, FiltrosQuestoes } from '@/hooks/useQuestoesIA'
import { QuestaoIACard } from './QuestaoIACard'

interface Props {
  questoes: QuestaoIA[]
  loading: boolean
  onRefresh: () => void
  onAnswer: (questaoId: string, resposta: string) => Promise<{ acertou: boolean; gabarito: string } | null>
  onDelete: (questaoId: string) => Promise<boolean>
  filtrosDisponiveis: {
    disciplinas: string[]
    assuntos: string[]
    subassuntos: string[]
    bancas: string[]
    dificuldades: string[]
    modalidades: string[]
  }
  onFiltrar: (filtros: FiltrosQuestoes) => void
}

export function QuestoesIAList({
  questoes,
  loading,
  onRefresh: _onRefresh,
  onAnswer,
  onDelete,
  filtrosDisponiveis,
  onFiltrar
}: Props) {
  void _onRefresh
  const [filtros, setFiltros] = useState<FiltrosQuestoes>({})

  // Aplicar filtro
  const handleFiltroChange = (key: keyof FiltrosQuestoes, value: string | boolean | null) => {
    const novosFiltros = { ...filtros, [key]: value || undefined }
    if (!value) delete novosFiltros[key]
    setFiltros(novosFiltros)
    onFiltrar(novosFiltros)
  }

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({})
    onFiltrar({})
  }

  const temFiltrosAtivos = Object.keys(filtros).length > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 p-4 bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Filtrar Questões</h3>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="text-xs text-[#137fec] hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {/* Disciplina */}
          <select
            value={filtros.disciplina || ''}
            onChange={(e) => handleFiltroChange('disciplina', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-sm text-gray-900 dark:text-white"
          >
            <option value="">Disciplina</option>
            {filtrosDisponiveis.disciplinas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Assunto */}
          <select
            value={filtros.assunto || ''}
            onChange={(e) => handleFiltroChange('assunto', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-sm text-gray-900 dark:text-white"
          >
            <option value="">Assunto</option>
            {filtrosDisponiveis.assuntos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Banca */}
          <select
            value={filtros.banca || ''}
            onChange={(e) => handleFiltroChange('banca', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-sm text-gray-900 dark:text-white"
          >
            <option value="">Banca</option>
            {filtrosDisponiveis.bancas.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Dificuldade */}
          <select
            value={filtros.dificuldade || ''}
            onChange={(e) => handleFiltroChange('dificuldade', e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-sm text-gray-900 dark:text-white"
          >
            <option value="">Dificuldade</option>
            <option value="facil">Fácil</option>
            <option value="media">Média</option>
            <option value="dificil">Difícil</option>
          </select>

          {/* Status */}
          <select
            value={filtros.respondida === true ? 'true' : filtros.respondida === false ? 'false' : ''}
            onChange={(e) => {
              if (e.target.value === '') {
                handleFiltroChange('respondida', null)
                handleFiltroChange('acertou', null)
              } else {
                handleFiltroChange('respondida', e.target.value === 'true')
              }
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-sm text-gray-900 dark:text-white"
          >
            <option value="">Status</option>
            <option value="false">Não respondidas</option>
            <option value="true">Respondidas</option>
          </select>
        </div>
      </div>

      {/* Lista de questões */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined text-4xl text-[#137fec] animate-spin">progress_activity</span>
        </div>
      ) : questoes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-6xl text-[#9dabb9] mb-4">quiz</span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nenhuma questão encontrada</h3>
          <p className="text-sm text-[#9dabb9]">
            {temFiltrosAtivos
              ? 'Tente ajustar os filtros ou gerar novas questões.'
              : 'Clique em "Gerar Questões" para criar suas primeiras questões com IA.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {questoes.map((questao, index) => (
            <QuestaoIACard
              key={questao.id}
              questao={questao}
              index={index + 1}
              onAnswer={onAnswer}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
