'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Plus,
  Shuffle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Sparkles,
  BookOpen,
  Target,
  TrendingUp,
  X
} from 'lucide-react'
import { useFlashcardsMed, FlashcardMed, calcularIntervaloExibicao } from '@/hooks/useFlashcardsMed'
import { useMedAuth } from '@/contexts/MedAuthContext'

interface FlashcardSystemProps {
  disciplinaInicial?: string
}

export function FlashcardSystem({ disciplinaInicial }: FlashcardSystemProps) {
  const { plano, podeUsarFuncionalidade } = useMedAuth()
  const {
    flashcards,
    flashcardsParaRevisar,
    flashcardAtual,
    stats,
    disciplinas,
    loading,
    error,
    criarFlashcard,
    deletarFlashcard,
    responderFlashcard,
    proximoFlashcard,
    embaralharDeck,
    resetarSessao,
    filtrarPorDisciplina,
    filtroDisciplina,
    indiceAtual,
    totalParaRevisar
  } = useFlashcardsMed()

  // Estados locais
  const [virado, setVirado] = useState(false)
  const [tempoInicio, setTempoInicio] = useState<number>(0)
  const [mostrarCriar, setMostrarCriar] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [sessaoCompleta, setSessaoCompleta] = useState(false)

  // Form de criar flashcard
  const [novoFrente, setNovoFrente] = useState('')
  const [novoVerso, setNovoVerso] = useState('')
  const [novoDisciplina, setNovoDisciplina] = useState('')
  const [novoAssunto, setNovoAssunto] = useState('')

  // Verificar se pode usar
  const podeUsar = podeUsarFuncionalidade('flashcards')

  // Iniciar timer quando vira o card
  useEffect(() => {
    if (!virado) {
      setTempoInicio(Date.now())
    }
  }, [virado, flashcardAtual?.id])

  // Verificar se sessão está completa
  useEffect(() => {
    if (totalParaRevisar === 0 && flashcards.length > 0) {
      setSessaoCompleta(true)
    }
  }, [totalParaRevisar, flashcards.length])

  // Virar card
  const virarCard = useCallback(() => {
    setVirado(v => !v)
  }, [])

  // Responder e avançar
  const handleResposta = useCallback(async (qualidade: 1 | 2 | 3 | 4) => {
    if (!flashcardAtual) return

    const tempoMs = Date.now() - tempoInicio
    await responderFlashcard(flashcardAtual.id, qualidade, tempoMs)
    setVirado(false)
  }, [flashcardAtual, tempoInicio, responderFlashcard])

  // Criar novo flashcard
  const handleCriar = useCallback(async () => {
    if (!novoFrente.trim() || !novoVerso.trim()) return

    await criarFlashcard({
      frente: novoFrente.trim(),
      verso: novoVerso.trim(),
      disciplina: novoDisciplina.trim() || undefined,
      assunto: novoAssunto.trim() || undefined
    })

    setNovoFrente('')
    setNovoVerso('')
    setNovoDisciplina('')
    setNovoAssunto('')
    setMostrarCriar(false)
  }, [novoFrente, novoVerso, novoDisciplina, novoAssunto, criarFlashcard])

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Erro
  if (error) {
    return (
      <div className="text-center p-8">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-white/60">{error}</p>
      </div>
    )
  }

  // Sem permissão
  if (!podeUsar && plano === 'gratuito') {
    return (
      <div className="text-center p-8 bg-slate-800/50 rounded-xl border border-white/10">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Flashcards Premium</h3>
        <p className="text-white/60 mb-4">
          Crie flashcards personalizados com repetição espaçada.
        </p>
        <a
          href="/medicina/dashboard/assinatura"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          Fazer Upgrade
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span className="text-white font-medium">{stats.total}</span>
            <span className="text-white/60 text-sm">total</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-lg">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-white font-medium">{stats.paraRevisar}</span>
            <span className="text-white/60 text-sm">para revisar</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-lg">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-medium">{stats.taxaAcerto}%</span>
            <span className="text-white/60 text-sm">acertos</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro */}
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`p-2 rounded-lg transition-colors ${
              filtroDisciplina ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Embaralhar */}
          <button
            onClick={embaralharDeck}
            className="p-2 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Embaralhar"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Criar novo */}
          <button
            onClick={() => setMostrarCriar(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Criar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <AnimatePresence>
        {mostrarFiltros && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-lg">
              <button
                onClick={() => filtrarPorDisciplina(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  !filtroDisciplina ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                Todas
              </button>
              {disciplinas.map(disc => (
                <button
                  key={disc}
                  onClick={() => filtrarPorDisciplina(disc)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filtroDisciplina === disc ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Área do Flashcard */}
      {flashcards.length === 0 ? (
        // Sem flashcards
        <div className="text-center p-12 bg-slate-800/50 rounded-xl border border-dashed border-white/20">
          <Brain className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nenhum flashcard ainda</h3>
          <p className="text-white/60 mb-4">
            Crie seus primeiros flashcards ou peça para a IA gerar.
          </p>
          <button
            onClick={() => setMostrarCriar(true)}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Flashcard
          </button>
        </div>
      ) : sessaoCompleta ? (
        // Sessão completa
        <div className="text-center p-12 bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl border border-emerald-500/30">
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Parabéns!</h3>
          <p className="text-emerald-200 mb-4">
            Você revisou todos os flashcards de hoje!
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                resetarSessao()
                setSessaoCompleta(false)
              }}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Revisar novamente
            </button>
            <button
              onClick={() => setMostrarCriar(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar mais
            </button>
          </div>
        </div>
      ) : totalParaRevisar === 0 ? (
        // Nada para revisar hoje
        <div className="text-center p-12 bg-slate-800/50 rounded-xl border border-white/10">
          <Clock className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Nada para revisar agora</h3>
          <p className="text-white/60 mb-4">
            Seus flashcards estão programados para revisão futura.
          </p>
          <button
            onClick={() => setMostrarCriar(true)}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar mais flashcards
          </button>
        </div>
      ) : flashcardAtual && (
        // Card ativo
        <div className="space-y-4">
          {/* Progresso */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/60">
              {indiceAtual + 1} de {totalParaRevisar}
            </span>
            <div className="flex-1 mx-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${((indiceAtual + 1) / totalParaRevisar) * 100}%` }}
              />
            </div>
            <span className="text-white/60">{totalParaRevisar - indiceAtual - 1} restantes</span>
          </div>

          {/* Flashcard */}
          <div
            className="relative h-64 md:h-80 cursor-pointer perspective-1000"
            onClick={virarCard}
          >
            <motion.div
              className="w-full h-full"
              initial={false}
              animate={{ rotateY: virado ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Frente */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 p-6 flex flex-col items-center justify-center text-center backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {flashcardAtual.disciplina && (
                  <span className="absolute top-4 left-4 text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                    {flashcardAtual.disciplina}
                  </span>
                )}
                <p className="text-white text-lg md:text-xl">{flashcardAtual.frente}</p>
                <p className="absolute bottom-4 text-white/40 text-sm">Clique para virar</p>
              </div>

              {/* Verso */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30 p-6 flex flex-col items-center justify-center text-center backface-hidden"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-white text-lg md:text-xl">{flashcardAtual.verso}</p>
              </div>
            </motion.div>
          </div>

          {/* Botões de resposta */}
          <AnimatePresence>
            {virado && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="grid grid-cols-4 gap-2"
              >
                {[
                  { q: 1 as const, label: 'Errei', cor: 'bg-red-500 hover:bg-red-600', icon: XCircle },
                  { q: 2 as const, label: 'Difícil', cor: 'bg-orange-500 hover:bg-orange-600', icon: Clock },
                  { q: 3 as const, label: 'Bom', cor: 'bg-emerald-500 hover:bg-emerald-600', icon: CheckCircle },
                  { q: 4 as const, label: 'Fácil', cor: 'bg-blue-500 hover:bg-blue-600', icon: Zap }
                ].map(({ q, label, cor, icon: Icon }) => (
                  <button
                    key={q}
                    onClick={() => handleResposta(q)}
                    className={`${cor} text-white py-3 rounded-lg font-medium transition-all flex flex-col items-center gap-1`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{label}</span>
                    <span className="text-xs opacity-70">
                      {calcularIntervaloExibicao(q, flashcardAtual.repeticoes, flashcardAtual.facilidade, flashcardAtual.intervalo)}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Criar Flashcard */}
      <AnimatePresence>
        {mostrarCriar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setMostrarCriar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Criar Flashcard</h3>
                <button
                  onClick={() => setMostrarCriar(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Frente (Pergunta)</label>
                  <textarea
                    value={novoFrente}
                    onChange={e => setNovoFrente(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                    rows={3}
                    placeholder="Digite a pergunta ou termo..."
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Verso (Resposta)</label>
                  <textarea
                    value={novoVerso}
                    onChange={e => setNovoVerso(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                    rows={3}
                    placeholder="Digite a resposta ou definição..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/60 text-sm mb-1">Disciplina</label>
                    <input
                      type="text"
                      value={novoDisciplina}
                      onChange={e => setNovoDisciplina(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                      placeholder="Ex: Cardiologia"
                      list="disciplinas-list"
                    />
                    <datalist id="disciplinas-list">
                      {disciplinas.map(d => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-white/60 text-sm mb-1">Assunto</label>
                    <input
                      type="text"
                      value={novoAssunto}
                      onChange={e => setNovoAssunto(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                      placeholder="Ex: ICC"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCriar}
                  disabled={!novoFrente.trim() || !novoVerso.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Criar Flashcard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Componente mini para exibir em outras páginas
export function FlashcardMiniWidget() {
  const { stats, loading } = useFlashcardsMed()

  if (loading) return null

  return (
    <a
      href="/medicina/dashboard/flashcards"
      className="block p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="text-white font-medium">Flashcards</p>
          <p className="text-white/60 text-sm">
            {stats.paraRevisar > 0 ? (
              <span className="text-amber-400">{stats.paraRevisar} para revisar</span>
            ) : (
              'Em dia!'
            )}
          </p>
        </div>
        {stats.paraRevisar > 0 && (
          <div className="ml-auto">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-500 text-white text-xs font-bold rounded-full">
              {stats.paraRevisar}
            </span>
          </div>
        )}
      </div>
    </a>
  )
}
