'use client'
import { useState, useEffect, useCallback } from 'react'
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

  // Estados de filtros selecionados (arrays para múltipla seleção)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([])
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])
  const [dificuldadesSelecionadas, setDificuldadesSelecionadas] = useState<string[]>([])
  const [statusSelecionado, setStatusSelecionado] = useState<string | null>(null)

  // Estado do dropdown aberto
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null)

  // Estado de pesquisa nos dropdowns
  const [pesquisaDisciplina, setPesquisaDisciplina] = useState('')
  const [pesquisaAssunto, setPesquisaAssunto] = useState('')
  const [pesquisaBanca, setPesquisaBanca] = useState('')

  // Toggle dropdown
  const toggleDropdown = (nome: string) => {
    setDropdownAberto(dropdownAberto === nome ? null : nome)
  }

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setDropdownAberto(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Aplicar filtros quando mudar seleção - memoizado
  const aplicarFiltros = useCallback(() => {
    const filtros: FiltrosQuestoes = {}

    // Para múltiplos filtros, usar o primeiro selecionado (API aceita string única)
    if (disciplinasSelecionadas.length > 0) filtros.disciplina = disciplinasSelecionadas[0]
    if (assuntosSelecionados.length > 0) filtros.assunto = assuntosSelecionados[0]
    if (bancasSelecionadas.length > 0) filtros.banca = bancasSelecionadas[0]
    if (dificuldadesSelecionadas.length > 0) filtros.dificuldade = dificuldadesSelecionadas[0]

    if (statusSelecionado === 'respondida') filtros.respondida = true
    else if (statusSelecionado === 'nao_respondida') filtros.respondida = false

    onFiltrar(filtros)
  }, [disciplinasSelecionadas, assuntosSelecionados, bancasSelecionadas, dificuldadesSelecionadas, statusSelecionado, onFiltrar])

  useEffect(() => {
    aplicarFiltros()
  }, [aplicarFiltros])

  // Toggle disciplina
  const toggleDisciplina = (nome: string) => {
    setDisciplinasSelecionadas(prev =>
      prev.includes(nome) ? prev.filter(d => d !== nome) : [...prev, nome]
    )
  }

  // Toggle assunto
  const toggleAssunto = (nome: string) => {
    setAssuntosSelecionados(prev =>
      prev.includes(nome) ? prev.filter(a => a !== nome) : [...prev, nome]
    )
  }

  // Toggle banca
  const toggleBanca = (nome: string) => {
    setBancasSelecionadas(prev =>
      prev.includes(nome) ? prev.filter(b => b !== nome) : [...prev, nome]
    )
  }

  // Toggle dificuldade
  const toggleDificuldade = (dif: string) => {
    setDificuldadesSelecionadas(prev =>
      prev.includes(dif) ? prev.filter(d => d !== dif) : [...prev, dif]
    )
  }

  // Toggle status
  const toggleStatus = (status: string) => {
    setStatusSelecionado(prev => prev === status ? null : status)
  }

  // Limpar filtros
  const limparFiltros = () => {
    setDisciplinasSelecionadas([])
    setAssuntosSelecionados([])
    setBancasSelecionadas([])
    setDificuldadesSelecionadas([])
    setStatusSelecionado(null)
  }

  // Verificar se tem filtros aplicados
  const temFiltrosAplicados = () => {
    return disciplinasSelecionadas.length > 0 ||
      assuntosSelecionados.length > 0 ||
      bancasSelecionadas.length > 0 ||
      dificuldadesSelecionadas.length > 0 ||
      statusSelecionado !== null
  }

  // Obter nome da dificuldade
  const getDificuldadeNome = (dificuldade: string) => {
    switch (dificuldade) {
      case 'facil': return 'Fácil'
      case 'media': return 'Médio'
      case 'dificil': return 'Difícil'
      default: return dificuldade
    }
  }

  // Componente Dropdown de Filtro
  const DropdownFiltro = ({
    nome,
    titulo,
    children,
    disabled = false,
    badge = 0
  }: {
    nome: string
    titulo: string
    children: React.ReactNode
    disabled?: boolean
    badge?: number
  }) => (
    <div className="dropdown-container relative">
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) toggleDropdown(nome)
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
          disabled
            ? 'bg-gray-100 dark:bg-[#1a2129] border-gray-200 dark:border-[#283039] cursor-not-allowed opacity-50'
            : dropdownAberto === nome
            ? 'bg-[#137fec] text-white border-[#137fec]'
            : badge > 0
            ? 'bg-[#137fec]/10 border-[#137fec]/50 dark:bg-[#137fec]/20'
            : 'bg-white dark:bg-[#1C252E] border-gray-200 dark:border-[#283039] hover:border-[#137fec]'
        }`}
      >
        <span className={`font-medium text-sm ${
          dropdownAberto === nome ? 'text-white' :
          badge > 0 ? 'text-[#137fec]' :
          'text-gray-700 dark:text-gray-300'
        }`}>
          {titulo}
          {badge > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
              dropdownAberto === nome
                ? 'bg-white/20 text-white'
                : 'bg-[#137fec] text-white'
            }`}>
              {badge}
            </span>
          )}
        </span>
        <span className={`material-symbols-outlined transition-transform ${
          dropdownAberto === nome ? 'rotate-180 text-white' : 'text-gray-400'
        }`}>
          expand_more
        </span>
      </button>
      {dropdownAberto === nome && (
        <div className="absolute z-50 mt-2 w-full min-w-[280px] bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] shadow-xl max-h-[400px] overflow-hidden">
          {children}
        </div>
      )}
    </div>
  )

  // Renderizar filtros aplicados (tags)
  const renderFiltrosAplicados = () => {
    if (!temFiltrosAplicados()) return null

    return (
      <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-4 mb-4">
        {/* Disciplinas */}
        {disciplinasSelecionadas.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Disciplinas</span>
            <div className="flex flex-wrap gap-2">
              {disciplinasSelecionadas.map(nome => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                >
                  {nome}
                  <button onClick={() => toggleDisciplina(nome)} className="hover:text-blue-900 dark:hover:text-blue-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assuntos */}
        {assuntosSelecionados.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Assuntos</span>
            <div className="flex flex-wrap gap-2">
              {assuntosSelecionados.map(nome => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {nome}
                  <button onClick={() => toggleAssunto(nome)} className="hover:text-purple-900 dark:hover:text-purple-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bancas */}
        {bancasSelecionadas.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Bancas</span>
            <div className="flex flex-wrap gap-2">
              {bancasSelecionadas.map(nome => (
                <span
                  key={nome}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                >
                  {nome.toUpperCase()}
                  <button onClick={() => toggleBanca(nome)} className="hover:text-orange-900 dark:hover:text-orange-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dificuldades */}
        {dificuldadesSelecionadas.length > 0 && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Dificuldades</span>
            <div className="flex flex-wrap gap-2">
              {dificuldadesSelecionadas.map(dif => (
                <span
                  key={dif}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm"
                >
                  {getDificuldadeNome(dif)}
                  <button onClick={() => toggleDificuldade(dif)} className="hover:text-amber-900 dark:hover:text-amber-100">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        {statusSelecionado && (
          <div className="flex flex-wrap items-start gap-2 mb-3">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 py-1 min-w-[80px]">Status</span>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm">
                {statusSelecionado === 'respondida' ? 'Respondidas' : 'Não respondidas'}
                <button onClick={() => setStatusSelecionado(null)} className="hover:text-emerald-900 dark:hover:text-emerald-100">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </span>
            </div>
          </div>
        )}

        {/* Botão limpar tudo */}
        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-[#283039] mt-2">
          <button
            onClick={limparFiltros}
            className="text-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Limpar todos os filtros
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="bg-white dark:bg-[#1C252E] rounded-xl border border-gray-200 dark:border-[#283039] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#137fec]">filter_list</span>
            Filtrar Questões
          </h3>
          {temFiltrosAplicados() && (
            <button
              onClick={limparFiltros}
              className="text-xs text-[#137fec] hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Disciplina */}
          <DropdownFiltro
            nome="disciplina"
            titulo="Disciplina"
            badge={disciplinasSelecionadas.length}
          >
            <div className="p-3 border-b border-gray-200 dark:border-[#283039]">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={pesquisaDisciplina}
                onChange={(e) => setPesquisaDisciplina(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#283039] rounded-lg bg-gray-50 dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-[300px] p-2">
              {filtrosDisponiveis.disciplinas
                .filter(d => d.toLowerCase().includes(pesquisaDisciplina.toLowerCase()))
                .map((disc) => (
                  <label
                    key={disc}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={disciplinasSelecionadas.includes(disc)}
                      onChange={() => toggleDisciplina(disc)}
                      className="w-4 h-4 rounded border-gray-300 text-[#137fec] focus:ring-[#137fec]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{disc}</span>
                  </label>
                ))}
              {filtrosDisponiveis.disciplinas.length === 0 && (
                <p className="text-sm text-gray-400 p-2 text-center">Nenhuma disciplina disponível</p>
              )}
            </div>
          </DropdownFiltro>

          {/* Assunto */}
          <DropdownFiltro
            nome="assunto"
            titulo="Assunto"
            badge={assuntosSelecionados.length}
          >
            <div className="p-3 border-b border-gray-200 dark:border-[#283039]">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={pesquisaAssunto}
                onChange={(e) => setPesquisaAssunto(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#283039] rounded-lg bg-gray-50 dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-[300px] p-2">
              {filtrosDisponiveis.assuntos
                .filter(a => a.toLowerCase().includes(pesquisaAssunto.toLowerCase()))
                .map((assunto) => (
                  <label
                    key={assunto}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={assuntosSelecionados.includes(assunto)}
                      onChange={() => toggleAssunto(assunto)}
                      className="w-4 h-4 rounded border-gray-300 text-[#137fec] focus:ring-[#137fec]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{assunto}</span>
                  </label>
                ))}
              {filtrosDisponiveis.assuntos.length === 0 && (
                <p className="text-sm text-gray-400 p-2 text-center">Nenhum assunto disponível</p>
              )}
            </div>
          </DropdownFiltro>

          {/* Banca */}
          <DropdownFiltro
            nome="banca"
            titulo="Banca"
            badge={bancasSelecionadas.length}
          >
            <div className="p-3 border-b border-gray-200 dark:border-[#283039]">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={pesquisaBanca}
                onChange={(e) => setPesquisaBanca(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#283039] rounded-lg bg-gray-50 dark:bg-[#161f28] text-gray-900 dark:text-white focus:outline-none focus:border-[#137fec]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto max-h-[300px] p-2">
              {filtrosDisponiveis.bancas
                .filter(b => b.toLowerCase().includes(pesquisaBanca.toLowerCase()))
                .map((banca) => (
                  <label
                    key={banca}
                    className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={bancasSelecionadas.includes(banca)}
                      onChange={() => toggleBanca(banca)}
                      className="w-4 h-4 rounded border-gray-300 text-[#137fec] focus:ring-[#137fec]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{banca.toUpperCase()}</span>
                  </label>
                ))}
              {filtrosDisponiveis.bancas.length === 0 && (
                <p className="text-sm text-gray-400 p-2 text-center">Nenhuma banca disponível</p>
              )}
            </div>
          </DropdownFiltro>

          {/* Dificuldade */}
          <DropdownFiltro
            nome="dificuldade"
            titulo="Dificuldade"
            badge={dificuldadesSelecionadas.length}
          >
            <div className="p-2">
              {['facil', 'media', 'dificil'].map((dif) => (
                <label
                  key={dif}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={dificuldadesSelecionadas.includes(dif)}
                    onChange={() => toggleDificuldade(dif)}
                    className="w-4 h-4 rounded border-gray-300 text-[#137fec] focus:ring-[#137fec]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{getDificuldadeNome(dif)}</span>
                </label>
              ))}
            </div>
          </DropdownFiltro>

          {/* Status */}
          <DropdownFiltro
            nome="status"
            titulo="Status"
            badge={statusSelecionado ? 1 : 0}
          >
            <div className="p-2">
              <label
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="radio"
                  name="status"
                  checked={statusSelecionado === 'nao_respondida'}
                  onChange={() => toggleStatus('nao_respondida')}
                  className="w-4 h-4 border-gray-300 text-[#137fec] focus:ring-[#137fec]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Não respondidas</span>
              </label>
              <label
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#283039] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="radio"
                  name="status"
                  checked={statusSelecionado === 'respondida'}
                  onChange={() => toggleStatus('respondida')}
                  className="w-4 h-4 border-gray-300 text-[#137fec] focus:ring-[#137fec]"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Respondidas</span>
              </label>
              {statusSelecionado && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setStatusSelecionado(null)
                  }}
                  className="w-full mt-2 p-2 text-sm text-gray-500 hover:text-red-500 text-center"
                >
                  Limpar seleção
                </button>
              )}
            </div>
          </DropdownFiltro>
        </div>
      </div>

      {/* Filtros aplicados (tags) */}
      {renderFiltrosAplicados()}

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
            {temFiltrosAplicados()
              ? 'Tente ajustar os filtros ou gerar novas questões.'
              : 'Clique em "Gerar Questões" para criar suas primeiras questões com IA.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {questoes.length} questão(ões) encontrada(s)
          </p>
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
