'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  Share2,
  Bookmark,
  Target,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// TIPOS
// ============================================

export interface Alternativa {
  letra: string
  texto: string
}

export interface GabaritoComentado {
  resposta_correta: string
  explicacao: string
  analise_alternativas?: Array<{
    letra: string
    analise: string
  }>
  ponto_chave?: string
  pegadinha?: string
  dica_memorizacao?: string
}

export interface QuestaoData {
  numero: number
  tipo: 'multipla_escolha' | 'certo_errado'
  dificuldade: 'facil' | 'medio' | 'dificil' | 'muito_dificil'
  banca?: string
  tema: string
  subtema?: string
  enunciado: string
  caso_clinico?: string
  alternativas: Alternativa[]
  gabarito_comentado: GabaritoComentado
}

interface QuestaoInterativaProps {
  questao: QuestaoData
  totalQuestoes?: number
  onResponder: (letra: string, acertou: boolean, tempoSegundos: number) => void
  onProxima?: () => void
  onRefazer?: () => void
  showTimer?: boolean
  autoShowGabarito?: boolean
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function QuestaoInterativa({
  questao,
  totalQuestoes,
  onResponder,
  onProxima,
  onRefazer,
  showTimer = true,
  autoShowGabarito = true
}: QuestaoInterativaProps) {
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [mostrarGabarito, setMostrarGabarito] = useState(false)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [respondida, setRespondida] = useState(false)
  const [animatingResult, setAnimatingResult] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  
  const acertou = respostaSelecionada === questao.gabarito_comentado.resposta_correta
  
  // Timer
  useEffect(() => {
    if (!respondida && showTimer) {
      timerRef.current = setInterval(() => {
        setTempoDecorrido(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [respondida, showTimer])
  
  // Reset ao trocar questão
  useEffect(() => {
    setRespostaSelecionada(null)
    setMostrarGabarito(false)
    setRespondida(false)
    setTempoDecorrido(0)
    startTimeRef.current = Date.now()
  }, [questao.numero])
  
  // Formatar tempo
  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const sec = segundos % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }
  
  // Cor da dificuldade
  const getDificuldadeCor = () => {
    switch (questao.dificuldade) {
      case 'facil': return 'text-emerald-400 bg-emerald-500/20'
      case 'medio': return 'text-amber-400 bg-amber-500/20'
      case 'dificil': return 'text-red-400 bg-red-500/20'
      case 'muito_dificil': return 'text-purple-400 bg-purple-500/20'
      default: return 'text-slate-600 bg-slate-100'
    }
  }
  
  // Handler de resposta
  const handleResponder = () => {
    if (!respostaSelecionada || respondida) return
    
    const tempo = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const acertouQuestao = respostaSelecionada === questao.gabarito_comentado.resposta_correta
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    setRespondida(true)
    setAnimatingResult(true)
    
    // Callback
    onResponder(respostaSelecionada, acertouQuestao, tempo)
    
    // Mostrar gabarito após animação
    if (autoShowGabarito) {
      setTimeout(() => {
        setMostrarGabarito(true)
        setAnimatingResult(false)
      }, 1500)
    } else {
      setTimeout(() => {
        setAnimatingResult(false)
      }, 1500)
    }
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Card da Questão */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 border border-slate-200 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-100">
          <div className="flex items-center gap-3">
            {/* Número */}
            <span className="text-lg font-bold text-amber-400">
              #{questao.numero}
              {totalQuestoes && (
                <span className="text-slate-500 text-sm font-normal">
                  /{totalQuestoes}
                </span>
              )}
            </span>
            
            {/* Dificuldade */}
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase",
              getDificuldadeCor()
            )}>
              {questao.dificuldade === 'muito_dificil' ? 'R4' : questao.dificuldade}
            </span>
            
            {/* Banca */}
            {questao.banca && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                {questao.banca}
              </span>
            )}
          </div>
          
          {/* Timer */}
          {showTimer && (
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-lg",
              respondida ? "bg-slate-100 text-slate-500" : "bg-amber-500/20 text-amber-400"
            )}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{formatarTempo(tempoDecorrido)}</span>
            </div>
          )}
        </div>
        
        {/* Tema */}
        <div className="px-4 py-2 border-b border-slate-200 bg-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BookOpen className="w-3 h-3" />
            <span>{questao.tema}</span>
            {questao.subtema && (
              <>
                <span>•</span>
                <span>{questao.subtema}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Enunciado */}
        <div className="p-4 md:p-6">
          {/* Caso clínico (se houver) */}
          {questao.caso_clinico && (
            <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {questao.caso_clinico}
              </p>
            </div>
          )}
          
          {/* Enunciado principal */}
          <p className="text-slate-800 leading-relaxed mb-6 whitespace-pre-wrap">
            {questao.enunciado}
          </p>
          
          {/* Alternativas */}
          <div className="space-y-2">
            {questao.alternativas.map((alt) => {
              const isSelected = respostaSelecionada === alt.letra
              const isCorreta = alt.letra === questao.gabarito_comentado.resposta_correta
              const showResult = respondida && (isSelected || isCorreta)
              
              return (
                <motion.button
                  key={alt.letra}
                  onClick={() => !respondida && setRespostaSelecionada(alt.letra)}
                  disabled={respondida}
                  whileTap={!respondida ? { scale: 0.98 } : undefined}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 md:p-4 rounded-xl text-left transition-all duration-200",
                    "border",
                    // Estados
                    !respondida && !isSelected && "bg-slate-100 border-slate-200 hover:bg-slate-100 hover:border-slate-300",
                    !respondida && isSelected && "bg-amber-500/20 border-amber-500/50",
                    // Resultado
                    showResult && isCorreta && "bg-emerald-500/20 border-emerald-500/50",
                    showResult && isSelected && !isCorreta && "bg-red-500/20 border-red-500/50",
                    respondida && !showResult && "opacity-50"
                  )}
                >
                  {/* Letra */}
                  <span className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm",
                    "transition-all duration-200",
                    !respondida && !isSelected && "bg-slate-100 text-slate-600",
                    !respondida && isSelected && "bg-amber-500 text-white",
                    showResult && isCorreta && "bg-emerald-500 text-white",
                    showResult && isSelected && !isCorreta && "bg-red-500 text-white"
                  )}>
                    {showResult && isCorreta && <CheckCircle className="w-5 h-5" />}
                    {showResult && isSelected && !isCorreta && <XCircle className="w-5 h-5" />}
                    {!showResult && alt.letra}
                  </span>
                  
                  {/* Texto */}
                  <span className={cn(
                    "flex-1 text-sm md:text-base",
                    !respondida && "text-slate-700",
                    showResult && isCorreta && "text-emerald-300",
                    showResult && isSelected && !isCorreta && "text-red-300",
                    respondida && !showResult && "text-slate-500"
                  )}>
                    {alt.texto}
                  </span>
                </motion.button>
              )
            })}
          </div>
          
          {/* Botão Confirmar */}
          {!respondida && (
            <motion.button
              onClick={handleResponder}
              disabled={!respostaSelecionada}
              whileHover={{ scale: respostaSelecionada ? 1.02 : 1 }}
              whileTap={{ scale: respostaSelecionada ? 0.98 : 1 }}
              className={cn(
                "w-full mt-6 py-3 rounded-xl font-medium transition-all duration-200",
                "flex items-center justify-center gap-2",
                respostaSelecionada
                  ? "bg-amber-500 text-white hover:bg-amber-400"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Confirmar Resposta
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          )}
          
          {/* Resultado Animado */}
          <AnimatePresence>
            {animatingResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  "fixed inset-0 z-50 flex items-center justify-center",
                  "bg-black/60 backdrop-blur-sm"
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 100 }}
                  className={cn(
                    "w-32 h-32 rounded-full flex items-center justify-center",
                    acertou ? "bg-emerald-500" : "bg-red-500"
                  )}
                >
                  {acertou ? (
                    <CheckCircle className="w-16 h-16 text-white" />
                  ) : (
                    <XCircle className="w-16 h-16 text-white" />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Gabarito Comentado */}
      <AnimatePresence>
        {mostrarGabarito && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4"
          >
            <GabaritoCard
              gabarito={questao.gabarito_comentado}
              acertou={acertou}
              tempoResposta={tempoDecorrido}
              onProxima={onProxima}
              onRefazer={onRefazer}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Botão Ver Gabarito (se autoShowGabarito = false) */}
      {respondida && !autoShowGabarito && !mostrarGabarito && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setMostrarGabarito(true)}
          className="w-full mt-4 py-3 rounded-xl font-medium bg-slate-100 text-white hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          Ver Gabarito Comentado
        </motion.button>
      )}
    </div>
  )
}

// ============================================
// COMPONENTE DO GABARITO
// ============================================

interface GabaritoCardProps {
  gabarito: GabaritoComentado
  acertou: boolean
  tempoResposta: number
  onProxima?: () => void
  onRefazer?: () => void
}

function GabaritoCard({ gabarito, acertou, tempoResposta, onProxima, onRefazer }: GabaritoCardProps) {
  const [showAnalise, setShowAnalise] = useState(false)
  
  return (
    <div className="bg-slate-800/50 border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header do Gabarito */}
      <div className={cn(
        "px-4 py-3 border-b border-slate-200",
        acertou ? "bg-emerald-500/20" : "bg-red-500/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {acertou ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={cn(
              "font-medium",
              acertou ? "text-emerald-400" : "text-red-400"
            )}>
              {acertou ? 'Você acertou!' : 'Você errou'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>Resposta: <strong className="text-emerald-400">{gabarito.resposta_correta}</strong></span>
            <span>•</span>
            <span>Tempo: {Math.floor(tempoResposta / 60)}:{(tempoResposta % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>
      
      {/* Explicação */}
      <div className="p-4 md:p-6">
        <h3 className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-3">
          <BookOpen className="w-4 h-4" />
          Explicação
        </h3>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {gabarito.explicacao}
        </p>
        
        {/* Análise das Alternativas */}
        {gabarito.analise_alternativas && gabarito.analise_alternativas.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowAnalise(!showAnalise)}
              className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Target className="w-4 h-4" />
              {showAnalise ? 'Ocultar' : 'Ver'} análise das alternativas
              <motion.div animate={{ rotate: showAnalise ? 180 : 0 }}>
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {showAnalise && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2 overflow-hidden"
                >
                  {gabarito.analise_alternativas.map((alt) => (
                    <div
                      key={alt.letra}
                      className={cn(
                        "p-3 rounded-lg border",
                        alt.letra === gabarito.resposta_correta
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-slate-100 border-slate-200"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className={cn(
                          "font-bold",
                          alt.letra === gabarito.resposta_correta ? "text-emerald-400" : "text-slate-600"
                        )}>
                          {alt.letra})
                        </span>
                        <p className="text-sm text-slate-600">{alt.analise}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Cards de Dicas */}
        <div className="mt-6 grid gap-3">
          {/* Ponto Chave */}
          {gabarito.ponto_chave && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-amber-400">Ponto-Chave</span>
                  <p className="text-sm text-slate-700 mt-1">{gabarito.ponto_chave}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Pegadinha */}
          {gabarito.pegadinha && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-red-400">Atenção (Pegadinha)</span>
                  <p className="text-sm text-slate-700 mt-1">{gabarito.pegadinha}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Dica de Memorização */}
          {gabarito.dica_memorizacao && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-purple-400">Dica de Memorização</span>
                  <p className="text-sm text-slate-700 mt-1">{gabarito.dica_memorizacao}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Ações */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {onProxima && (
            <button
              onClick={onProxima}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-amber-500 text-white hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
            >
              Próxima Questão
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          
          {onRefazer && (
            <button
              onClick={onRefazer}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-slate-100 text-white hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Refazer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE DE ESTATÍSTICAS DA SESSÃO
// ============================================

interface EstatisticasQuestoesProps {
  total: number
  acertos: number
  erros: number
  tempoTotal: number
  questoesPorTema?: Record<string, { total: number; acertos: number }>
  onNovasSessao?: () => void
  onRevisarErros?: () => void
}

export function EstatisticasQuestoes({
  total,
  acertos,
  erros,
  tempoTotal,
  questoesPorTema,
  onNovasSessao,
  onRevisarErros
}: EstatisticasQuestoesProps) {
  const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0
  const tempoMedio = total > 0 ? Math.round(tempoTotal / total) : 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-200 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-amber-500/20 to-amber-600/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-400" />
          Sessão Finalizada
        </h2>
      </div>
      
      {/* Stats Grid */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 rounded-xl bg-slate-100">
            <p className="text-3xl font-bold text-amber-400">{taxa}%</p>
            <p className="text-xs text-slate-500 mt-1">Taxa de Acerto</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-100">
            <p className="text-3xl font-bold text-emerald-400">{acertos}</p>
            <p className="text-xs text-slate-500 mt-1">Acertos</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-100">
            <p className="text-3xl font-bold text-red-400">{erros}</p>
            <p className="text-xs text-slate-500 mt-1">Erros</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-100">
            <p className="text-3xl font-bold text-blue-400">{tempoMedio}s</p>
            <p className="text-xs text-slate-500 mt-1">Tempo Médio</p>
          </div>
        </div>
        
        {/* Barra de Progresso */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progresso</span>
            <span>{acertos}/{total}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taxa}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - taxa}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              className="h-full bg-gradient-to-r from-red-500 to-red-400"
            />
          </div>
        </div>
        
        {/* Por Tema */}
        {questoesPorTema && Object.keys(questoesPorTema).length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-600 mb-3">Desempenho por Tema</h3>
            <div className="space-y-2">
              {Object.entries(questoesPorTema).map(([tema, stats]) => {
                const taxaTema = Math.round((stats.acertos / stats.total) * 100)
                return (
                  <div key={tema} className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 w-32 truncate">{tema}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${taxaTema}%` }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "h-full rounded-full",
                          taxaTema >= 70 ? "bg-emerald-500" : taxaTema >= 50 ? "bg-amber-500" : "bg-red-500"
                        )}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-16 text-right">
                      {stats.acertos}/{stats.total}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onNovasSessao && (
            <button
              onClick={onNovasSessao}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-amber-500 text-white hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Nova Sessão
            </button>
          )}
          {onRevisarErros && erros > 0 && (
            <button
              onClick={onRevisarErros}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-slate-100 text-white hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Revisar Erros ({erros})
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default QuestaoInterativa
