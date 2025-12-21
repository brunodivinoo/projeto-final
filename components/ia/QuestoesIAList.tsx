'use client'
import { useState } from 'react'
import { QuestaoIA, FiltrosQuestoes } from '@/hooks/useQuestoesIA'

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
  // onRefresh disponível para uso futuro (paginação, etc)
  void _onRefresh
  const [filtros, setFiltros] = useState<FiltrosQuestoes>({})
  const [questaoExpandida, setQuestaoExpandida] = useState<string | null>(null)
  const [respostaSelecionada, setRespostaSelecionada] = useState<Record<string, string>>({})
  const [respondendo, setRespondendo] = useState<string | null>(null)
  const [resultados, setResultados] = useState<Record<string, { acertou: boolean; gabarito: string }>>({})
  const [deletando, setDeletando] = useState<string | null>(null)

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

  // Responder questão
  const handleResponder = async (questaoId: string) => {
    const resposta = respostaSelecionada[questaoId]
    if (!resposta) return

    setRespondendo(questaoId)
    const result = await onAnswer(questaoId, resposta)
    setRespondendo(null)

    if (result) {
      setResultados(prev => ({ ...prev, [questaoId]: result }))
    }
  }

  // Deletar questão
  const handleDeletar = async (questaoId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta questão?')) return

    setDeletando(questaoId)
    await onDelete(questaoId)
    setDeletando(null)
  }

  // Selecionar resposta
  const selecionarResposta = (questaoId: string, letra: string) => {
    if (resultados[questaoId]) return // Já respondeu
    setRespostaSelecionada(prev => ({ ...prev, [questaoId]: letra }))
  }

  // Cores por dificuldade
  const getDificuldadeColor = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-emerald-500/20 text-emerald-400'
      case 'media': return 'bg-amber-500/20 text-amber-400'
      case 'dificil': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
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

          {/* Acertos (só se respondida) */}
          {filtros.respondida === true && (
            <select
              value={filtros.acertou === true ? 'true' : filtros.acertou === false ? 'false' : ''}
              onChange={(e) => handleFiltroChange('acertou', e.target.value === '' ? null : e.target.value === 'true')}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-sm text-gray-900 dark:text-white"
            >
              <option value="">Resultado</option>
              <option value="true">Acertos</option>
              <option value="false">Erros</option>
            </select>
          )}
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
              : 'Clique em "Gerador de Questões" para criar suas primeiras questões.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {questoes.map((questao, index) => {
            const isExpanded = questaoExpandida === questao.id
            const resultado = resultados[questao.id] || (questao.respondida ? { acertou: questao.acertou!, gabarito: questao.gabarito } : null)
            const respostaSel = respostaSelecionada[questao.id]

            return (
              <div
                key={questao.id}
                className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] overflow-hidden"
              >
                {/* Header da questão */}
                <div
                  className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202b36] transition-colors"
                  onClick={() => setQuestaoExpandida(isExpanded ? null : questao.id)}
                >
                  <div className="size-8 rounded-lg bg-[#137fec]/20 flex items-center justify-center text-[#137fec] font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDificuldadeColor(questao.dificuldade)}`}>
                        {questao.dificuldade === 'facil' ? 'Fácil' : questao.dificuldade === 'media' ? 'Média' : 'Difícil'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#137fec]/20 text-[#137fec] text-xs">
                        {questao.disciplina}
                      </span>
                      {questao.assunto && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-xs">
                          {questao.assunto}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-xs">
                        {questao.banca}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-gray-500/20 text-gray-400 text-xs">
                        {questao.modalidade === 'multipla_escolha' ? 'Múltipla Escolha' : 'Certo/Errado'}
                      </span>
                      {resultado && (
                        <span className={`px-2 py-0.5 rounded text-xs ${resultado.acertou ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {resultado.acertou ? 'Acertou' : 'Errou'}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm text-gray-900 dark:text-white ${!isExpanded && 'line-clamp-2'}`}>
                      {questao.enunciado}
                    </p>
                  </div>
                  <span className={`material-symbols-outlined text-[#9dabb9] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </div>

                {/* Conteúdo expandido */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    {/* Alternativas */}
                    <div className="flex flex-col gap-2 mt-4">
                      {questao.modalidade === 'certo_errado' ? (
                        // Certo/Errado
                        <>
                          {['C', 'E'].map(letra => {
                            const isSelected = respostaSel === letra
                            const isCorreta = resultado && letra === resultado.gabarito
                            const isErrada = resultado && isSelected && !resultado.acertou

                            return (
                              <button
                                key={letra}
                                onClick={() => selecionarResposta(questao.id, letra)}
                                disabled={!!resultado}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                  isCorreta
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                    : isErrada
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : isSelected
                                    ? 'bg-[#137fec]/20 border-[#137fec] text-[#137fec]'
                                    : 'border-gray-200 dark:border-[#283039] hover:border-gray-400 text-gray-900 dark:text-white'
                                } ${resultado ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <span className={`size-6 rounded-full border flex items-center justify-center text-sm font-bold ${
                                  isSelected || isCorreta || isErrada
                                    ? 'border-current'
                                    : 'border-gray-400'
                                }`}>
                                  {letra}
                                </span>
                                <span>{letra === 'C' ? 'Certo' : 'Errado'}</span>
                              </button>
                            )
                          })}
                        </>
                      ) : (
                        // Múltipla escolha
                        <>
                          {['A', 'B', 'C', 'D', 'E'].map(letra => {
                            const texto = questao[`alternativa_${letra.toLowerCase()}` as keyof QuestaoIA] as string | null
                            if (!texto) return null

                            const isSelected = respostaSel === letra
                            const isCorreta = resultado && letra === resultado.gabarito
                            const isErrada = resultado && isSelected && !resultado.acertou

                            return (
                              <button
                                key={letra}
                                onClick={() => selecionarResposta(questao.id, letra)}
                                disabled={!!resultado}
                                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                                  isCorreta
                                    ? 'bg-emerald-500/20 border-emerald-500'
                                    : isErrada
                                    ? 'bg-red-500/20 border-red-500'
                                    : isSelected
                                    ? 'bg-[#137fec]/20 border-[#137fec]'
                                    : 'border-gray-200 dark:border-[#283039] hover:border-gray-400'
                                } ${resultado ? 'cursor-default' : 'cursor-pointer'}`}
                              >
                                <span className={`size-6 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 ${
                                  isCorreta
                                    ? 'border-emerald-500 text-emerald-400'
                                    : isErrada
                                    ? 'border-red-500 text-red-400'
                                    : isSelected
                                    ? 'border-[#137fec] text-[#137fec]'
                                    : 'border-gray-400 text-gray-400'
                                }`}>
                                  {letra}
                                </span>
                                <span className={`text-sm ${
                                  isCorreta
                                    ? 'text-emerald-400'
                                    : isErrada
                                    ? 'text-red-400'
                                    : isSelected
                                    ? 'text-[#137fec]'
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {texto}
                                </span>
                              </button>
                            )
                          })}
                        </>
                      )}
                    </div>

                    {/* Botão Responder */}
                    {!resultado && respostaSel && (
                      <button
                        onClick={() => handleResponder(questao.id)}
                        disabled={respondendo === questao.id}
                        className="mt-4 w-full py-2.5 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {respondendo === questao.id ? (
                          <>
                            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                            Verificando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-sm">check</span>
                            Confirmar Resposta
                          </>
                        )}
                      </button>
                    )}

                    {/* Comentário/Explicação */}
                    {resultado && questao.comentario && (
                      <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-[#141A21] border border-gray-200 dark:border-[#283039]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-[#137fec]">lightbulb</span>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Comentário</h4>
                        </div>
                        <p className="text-sm text-[#9dabb9]">{questao.comentario}</p>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-[#283039]">
                      <div className="flex items-center gap-2">
                        <button
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] text-[#9dabb9] hover:text-gray-900 dark:hover:text-white transition-colors"
                          title="Compartilhar"
                        >
                          <span className="material-symbols-outlined text-lg">share</span>
                        </button>
                        <button
                          onClick={() => handleDeletar(questao.id)}
                          disabled={deletando === questao.id}
                          className="size-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[#9dabb9] hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Deletar"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {deletando === questao.id ? 'progress_activity' : 'delete'}
                          </span>
                        </button>
                      </div>
                      <span className="text-xs text-[#9dabb9]">
                        Criada em {new Date(questao.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
