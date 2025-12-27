'use client'
import { useState, useEffect } from 'react'
import { useSimulados, FiltrosDisponiveis, FiltrosSimulado } from '@/hooks/useSimulados'
import { useCheckLimit } from '@/hooks/useCheckLimit'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (simuladoId: string) => void
}

export function CriarSimuladoModal({ isOpen, onClose, onSuccess }: Props) {
  const { criarSimulado, buscarFiltros, loading } = useSimulados()
  const { checkLimit } = useCheckLimit()

  // Estados do formulário
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [modalidade, setModalidade] = useState<'certo_errado' | 'multipla_escolha'>('multipla_escolha')
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(10)
  const [tempoLimite, setTempoLimite] = useState<number | undefined>(undefined)
  const [usarTempo, setUsarTempo] = useState(false)
  const [dificuldadesSelecionadas, setDificuldadesSelecionadas] = useState<string[]>([])
  const [bancaSelecionada, setBancaSelecionada] = useState('')
  const [anoSelecionado, setAnoSelecionado] = useState<number | undefined>(undefined)
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<string[]>([])
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<string[]>([])

  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosDisponiveis | null>(null)
  const [loadingFiltros, setLoadingFiltros] = useState(false)

  // Estado de limite
  const [limiteInfo, setLimiteInfo] = useState<{ canUse: boolean; restante: number; limite: number } | null>(null)

  // Erro
  const [erro, setErro] = useState<string | null>(null)

  // Carregar filtros quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      carregarFiltros()
      verificarLimite()
    }
  }, [isOpen])

  // Recarregar filtros quando modalidade ou disciplina mudar
  useEffect(() => {
    if (isOpen) {
      carregarFiltros()
    }
  }, [modalidade, disciplinasSelecionadas])

  const verificarLimite = async () => {
    const info = await checkLimit('simulados')
    setLimiteInfo({
      canUse: info.canUse,
      restante: info.restante,
      limite: info.limite
    })
  }

  const carregarFiltros = async () => {
    setLoadingFiltros(true)
    const disciplina = disciplinasSelecionadas.length === 1 ? disciplinasSelecionadas[0] : undefined
    const data = await buscarFiltros(modalidade, disciplina)
    setFiltros(data)
    setLoadingFiltros(false)
  }

  const toggleDificuldade = (dif: string) => {
    setDificuldadesSelecionadas(prev =>
      prev.includes(dif) ? prev.filter(d => d !== dif) : [...prev, dif]
    )
  }

  const toggleDisciplina = (disc: string) => {
    setDisciplinasSelecionadas(prev => {
      if (prev.includes(disc)) {
        return prev.filter(d => d !== disc)
      }
      return [...prev, disc]
    })
    // Limpar assuntos ao mudar disciplinas
    setAssuntosSelecionados([])
  }

  const toggleAssunto = (assunto: string) => {
    setAssuntosSelecionados(prev =>
      prev.includes(assunto) ? prev.filter(a => a !== assunto) : [...prev, assunto]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    if (!titulo.trim()) {
      setErro('O título é obrigatório')
      return
    }

    if (quantidadeQuestoes < 1 || quantidadeQuestoes > 100) {
      setErro('A quantidade de questões deve ser entre 1 e 100')
      return
    }

    if (!limiteInfo?.canUse) {
      setErro('Você atingiu o limite mensal de simulados')
      return
    }

    const filtrosSimulado: FiltrosSimulado = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      fonte: 'banco',
      modalidade,
      quantidade_questoes: quantidadeQuestoes,
      tempo_limite_minutos: usarTempo ? tempoLimite : undefined,
      dificuldades: dificuldadesSelecionadas.length > 0 ? dificuldadesSelecionadas : undefined,
      banca: bancaSelecionada || undefined,
      ano: anoSelecionado,
      disciplinas: disciplinasSelecionadas.map(d => ({ id: '', nome: d })),
      assuntos: assuntosSelecionados.map(a => ({ id: '', nome: a }))
    }

    const simulado = await criarSimulado(filtrosSimulado)

    if (simulado) {
      resetForm()
      onClose()
      onSuccess?.(simulado.id)
    } else {
      setErro('Erro ao criar simulado. Verifique se há questões suficientes com os filtros selecionados.')
    }
  }

  const resetForm = () => {
    setTitulo('')
    setDescricao('')
    setModalidade('multipla_escolha')
    setQuantidadeQuestoes(10)
    setTempoLimite(undefined)
    setUsarTempo(false)
    setDificuldadesSelecionadas([])
    setBancaSelecionada('')
    setAnoSelecionado(undefined)
    setDisciplinasSelecionadas([])
    setAssuntosSelecionados([])
    setErro(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Criar Novo Simulado
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Limite Info */}
        {limiteInfo && (
          <div className={`px-4 py-2 text-sm ${limiteInfo.canUse ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
            {limiteInfo.canUse
              ? `Você pode criar mais ${limiteInfo.restante} simulado(s) este mês`
              : 'Limite mensal de simulados atingido'
            }
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título do Simulado *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Simulado de Português - CESPE"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o objetivo do simulado..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Modalidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modalidade das Questões
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalidade('multipla_escolha')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  modalidade === 'multipla_escolha'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Múltipla Escolha</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {filtros?.modalidades.find(m => m.nome === 'multipla_escolha')?.questoes || 0} questões
                </div>
              </button>
              <button
                type="button"
                onClick={() => setModalidade('certo_errado')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                  modalidade === 'certo_errado'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">Certo ou Errado</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {filtros?.modalidades.find(m => m.nome === 'certo_errado')?.questoes || 0} questões
                </div>
              </button>
            </div>
          </div>

          {/* Quantidade e Tempo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantidade de Questões
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={quantidadeQuestoes}
                onChange={(e) => setQuantidadeQuestoes(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Disponíveis: {filtros?.total_questoes_disponiveis || 0}
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <input
                  type="checkbox"
                  checked={usarTempo}
                  onChange={(e) => setUsarTempo(e.target.checked)}
                  className="rounded"
                />
                Tempo Limite (minutos)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={tempoLimite || ''}
                onChange={(e) => setTempoLimite(parseInt(e.target.value) || undefined)}
                disabled={!usarTempo}
                placeholder="Ex: 60"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Dificuldades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dificuldade (selecione uma ou mais)
            </label>
            <div className="flex gap-2 flex-wrap">
              {filtros?.dificuldades.map(dif => (
                <button
                  key={dif.nome}
                  type="button"
                  onClick={() => toggleDificuldade(dif.nome)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    dificuldadesSelecionadas.includes(dif.nome)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {dif.label} ({dif.questoes})
                </button>
              ))}
            </div>
          </div>

          {/* Disciplinas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Disciplinas (selecione uma ou mais)
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-1">
              {loadingFiltros ? (
                <div className="text-center py-2 text-gray-500">Carregando...</div>
              ) : (
                filtros?.disciplinas.slice(0, 20).map(disc => (
                  <label
                    key={disc.nome}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={disciplinasSelecionadas.includes(disc.nome)}
                      onChange={() => toggleDisciplina(disc.nome)}
                      className="rounded"
                    />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{disc.nome}</span>
                    <span className="text-xs text-gray-500">({disc.questoes})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Assuntos (só aparece se tiver disciplina selecionada) */}
          {disciplinasSelecionadas.length > 0 && filtros?.assuntos && filtros.assuntos.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assuntos (opcional)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-1">
                {filtros.assuntos.slice(0, 20).map(assunto => (
                  <label
                    key={assunto.nome}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assuntosSelecionados.includes(assunto.nome)}
                      onChange={() => toggleAssunto(assunto.nome)}
                      className="rounded"
                    />
                    <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{assunto.nome}</span>
                    <span className="text-xs text-gray-500">({assunto.questoes})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Banca e Ano */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banca (opcional)
              </label>
              <select
                value={bancaSelecionada}
                onChange={(e) => setBancaSelecionada(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todas as bancas</option>
                {filtros?.bancas.slice(0, 30).map(banca => (
                  <option key={banca.nome} value={banca.nome}>
                    {banca.nome} ({banca.questoes})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ano (opcional)
              </label>
              <select
                value={anoSelecionado || ''}
                onChange={(e) => setAnoSelecionado(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Todos os anos</option>
                {filtros?.anos.map(ano => (
                  <option key={ano.ano} value={ano.ano}>
                    {ano.ano} ({ano.questoes})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {erro}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !limiteInfo?.canUse}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Criando...
              </>
            ) : (
              'Criar Simulado'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
