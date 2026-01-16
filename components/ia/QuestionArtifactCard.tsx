'use client'

import { useState, useCallback } from 'react'
import { Question, DIFFICULTY_COLORS } from '@/stores/artifactsStore'
import { Scissors, CheckCircle, XCircle } from 'lucide-react'

interface QuestionArtifactCardProps {
  question: Question
  onAnswerSubmit?: (questionId: string, answer: string, correct: boolean) => void
  userId?: string
  conversaId?: string
  respostaAnterior?: {
    resposta_usuario: string
    acertou: boolean
    tentativas: number
  } | null
}

export default function QuestionArtifactCard({
  question,
  onAnswerSubmit,
  userId,
  conversaId,
  respostaAnterior
}: QuestionArtifactCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(question.resposta_usuario || respostaAnterior?.resposta_usuario || null)
  const [showFeedback, setShowFeedback] = useState(question.mostrar_gabarito || !!respostaAnterior)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(question.acertou ?? respostaAnterior?.acertou ?? null)
  const [expandedSection, setExpandedSection] = useState<'gabarito' | null>(null)
  const [showAlternativasAnalise, setShowAlternativasAnalise] = useState(true) // Aberto por padrão
  const [savedAnswer, setSavedAnswer] = useState(respostaAnterior)
  const [startTime] = useState(Date.now())
  const [isSaving, setIsSaving] = useState(false)
  // Estado para alternativas eliminadas (cortadas)
  const [eliminatedAlternatives, setEliminatedAlternatives] = useState<Set<string>>(new Set())

  const isCertoErrado = question.tipo === 'certo_errado'
  const difficultyConfig = DIFFICULTY_COLORS[question.dificuldade] || DIFFICULTY_COLORS.medio

  const handleSelectAnswer = useCallback((letra: string) => {
    if (showFeedback) return
    // Não permitir selecionar alternativa eliminada
    if (eliminatedAlternatives.has(letra)) return
    setSelectedAnswer(letra)
  }, [showFeedback, eliminatedAlternatives])

  // Função para eliminar/restaurar alternativa (tesoura)
  const handleEliminateAlternative = useCallback((letra: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (showFeedback) return

    setEliminatedAlternatives(prev => {
      const newSet = new Set(prev)
      if (newSet.has(letra)) {
        newSet.delete(letra)
      } else {
        newSet.add(letra)
        // Se a alternativa selecionada foi eliminada, desmarcar
        if (selectedAnswer === letra) {
          setSelectedAnswer(null)
        }
      }
      return newSet
    })
  }, [showFeedback, selectedAnswer])

  const handleSubmitAnswer = useCallback(async () => {
    if (!selectedAnswer || showFeedback) return

    // Buscar resposta correta do gabarito (não das alternativas para não vazar)
    const correctAnswerLetter = question.gabarito_comentado?.resposta_correta ||
      question.alternativas.find(a => a.correta)?.letra
    const correct = selectedAnswer === correctAnswerLetter
    const tempoResposta = Math.round((Date.now() - startTime) / 1000)

    setIsCorrect(correct)
    setShowFeedback(true)

    // Salvar no banco de dados
    if (userId && conversaId) {
      setIsSaving(true)
      try {
        await fetch('/api/medicina/ia/questoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            conversa_id: conversaId,
            enunciado: question.enunciado,
            questao_numero: question.numero,
            disciplina: question.disciplina,
            assunto: question.assunto,
            resposta_usuario: selectedAnswer,
            resposta_correta: correctAnswerLetter,
            acertou: correct,
            tempo_resposta_segundos: tempoResposta
          })
        })

        setSavedAnswer({
          resposta_usuario: selectedAnswer,
          acertou: correct,
          tentativas: (savedAnswer?.tentativas || 0) + 1
        })
      } catch (error) {
        console.error('Erro ao salvar resposta:', error)
      } finally {
        setIsSaving(false)
      }
    }

    if (onAnswerSubmit && question.id) {
      onAnswerSubmit(question.id, selectedAnswer, correct)
    }
  }, [selectedAnswer, showFeedback, question, onAnswerSubmit, userId, conversaId, startTime, savedAnswer])

  const toggleSection = useCallback((section: 'gabarito') => {
    setExpandedSection(prev => prev === section ? null : section)
  }, [])

  // Resposta correta vem do gabarito_comentado (não das alternativas)
  const correctAnswerLetter = question.gabarito_comentado?.resposta_correta ||
    question.alternativas.find(a => a.correta)?.letra

  return (
    <div className="bg-[#1A2332] border border-white/10 rounded-lg overflow-hidden">
      {/* Header - mais compacto */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#151D2B] border-b border-white/10">
        {/* Número da questão */}
        <span className="bg-emerald-500/20 text-emerald-400 font-bold text-xs px-2 py-0.5 rounded">
          Q{question.numero}
        </span>

        {/* Disciplina e Assunto */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-white/80 font-medium">{question.disciplina}</span>
          {question.assunto && (
            <>
              <span className="text-white/30">›</span>
              <span className="text-white/50">{question.assunto}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Badges - mais compactos */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Banca */}
          {question.banca_estilo && (
            <span className="text-white/40 text-[10px] font-medium uppercase">
              {question.banca_estilo}
            </span>
          )}

          {/* Tipo */}
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-white/50 text-[10px]">
            {isCertoErrado ? 'C/E' : 'Múltipla'}
          </span>

          {/* Dificuldade */}
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${difficultyConfig.bg} ${difficultyConfig.text}`}>
            {difficultyConfig.label}
          </span>

          {/* Badge IA */}
          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-medium flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
            IA
          </span>
        </div>
      </div>

      {/* Corpo da questão - mais compacto */}
      <div className="p-3">
        {/* Caso clínico se houver */}
        {question.caso_clinico && (
          <div className="mb-3 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-blue-400 text-[10px] font-semibold uppercase tracking-wider">Caso Clínico</span>
            </div>
            <p className="text-white/70 text-xs leading-relaxed whitespace-pre-wrap">
              {question.caso_clinico}
            </p>
          </div>
        )}

        {/* Instrução para C/E */}
        {isCertoErrado && (
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">
            JULGUE O ITEM A SEGUIR
          </p>
        )}

        {/* Enunciado */}
        <p className="text-white/85 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
          {question.enunciado}
        </p>

        {/* Imagem se houver */}
        {question.imagem_url && (
          <div className="mb-3">
            <img
              src={question.imagem_url}
              alt="Imagem da questão"
              className="max-w-full h-auto rounded border border-white/10"
            />
          </div>
        )}

        {/* Alternativas - mais compactas */}
        <div className="space-y-1.5">
          {question.alternativas.map((alt) => {
            const isSelected = selectedAnswer === alt.letra
            // Usar correctAnswerLetter do gabarito (não alt.correta que pode não existir)
            const isCorrectAlt = alt.letra === correctAnswerLetter
            const showResultStyles = showFeedback
            const isEliminated = eliminatedAlternatives.has(alt.letra)

            let containerClasses = 'border-white/10 hover:border-white/20 hover:bg-white/5'
            let circleClasses = 'border-white/30 text-white/50'

            if (showResultStyles) {
              if (isCorrectAlt) {
                containerClasses = 'border-green-500/50 bg-green-500/10'
                circleClasses = 'bg-green-500 text-white border-green-500'
              } else if (isSelected && !isCorrectAlt) {
                containerClasses = 'border-red-500/50 bg-red-500/10'
                circleClasses = 'bg-red-500 text-white border-red-500'
              }
            } else if (isEliminated) {
              // Estilo para alternativa eliminada (cortada)
              containerClasses = 'border-white/5 bg-white/5 opacity-50'
              circleClasses = 'border-white/20 text-white/30 line-through'
            } else if (isSelected) {
              containerClasses = 'border-emerald-500/50 bg-emerald-500/10'
              circleClasses = 'bg-emerald-500 text-white border-emerald-500'
            }

            return (
              <div key={alt.letra} className="relative group">
                <button
                  onClick={() => handleSelectAnswer(alt.letra)}
                  disabled={showFeedback || isEliminated}
                  className={`w-full flex items-start gap-2 p-2.5 rounded-lg border transition-all duration-150 text-left ${containerClasses} ${showFeedback ? 'cursor-default' : isEliminated ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs border-2 transition-all ${circleClasses}`}>
                    {showResultStyles && isCorrectAlt ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : showResultStyles && isSelected && !isCorrectAlt ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      alt.letra
                    )}
                  </div>
                  <span className={`flex-1 text-xs pt-0.5 ${isEliminated ? 'line-through text-white/40' : isSelected || (showResultStyles && isCorrectAlt) ? 'text-white font-medium' : 'text-white/70'}`}>
                    {alt.texto}
                  </span>
                </button>

                {/* Botão de tesoura para eliminar alternativa */}
                {!showFeedback && (
                  <button
                    onClick={(e) => handleEliminateAlternative(alt.letra, e)}
                    className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded transition-all ${
                      isEliminated
                        ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                        : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 opacity-0 group-hover:opacity-100'
                    }`}
                    title={isEliminated ? 'Restaurar alternativa' : 'Eliminar alternativa'}
                  >
                    <Scissors className={`w-3.5 h-3.5 ${isEliminated ? 'rotate-45' : ''} transition-transform`} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Ações e Resultado - mais compacto */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/10">
        {!showFeedback ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedAnswer
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Responder
          </button>
        ) : (
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
            isCorrect
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isCorrect ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Acertou!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Errou! Resposta: {correctAnswerLetter}
              </>
            )}
          </div>
        )}
      </div>

      {/* Seções expansíveis - Gabarito Comentado */}
      <div className="border-t border-white/10">
        {/* Tab de Gabarito */}
        <button
          onClick={() => toggleSection('gabarito')}
          className={`w-full flex items-center justify-between px-3 py-2 transition-colors ${
            expandedSection === 'gabarito'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium">Gabarito Comentado</span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${expandedSection === 'gabarito' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Conteúdo do Gabarito - VERSÃO COMPLETA - com verificações null */}
        {expandedSection === 'gabarito' && question.gabarito_comentado && (
          <div className="p-4 bg-emerald-500/5 border-t border-white/5 space-y-4">
            {/* Resposta correta em destaque */}
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-bold">
                Gabarito: {question.gabarito_comentado.resposta_correta || '?'}
              </span>
            </div>

            {/* Explicação geral */}
            {(question.gabarito_comentado.explicacao_geral || question.gabarito_comentado.explicacao) && (
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm leading-relaxed">
                  {question.gabarito_comentado.explicacao_geral || question.gabarito_comentado.explicacao}
                </p>
              </div>
            )}

            {/* Análise de cada alternativa - SEMPRE VISÍVEL COM DESTAQUE */}
            {question.gabarito_comentado.analise_alternativas &&
             question.gabarito_comentado.analise_alternativas.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAlternativasAnalise(prev => !prev)}
                  className="w-full flex items-center justify-between text-white/60 hover:text-white/80 text-xs"
                >
                  <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Análise de Cada Alternativa
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showAlternativasAnalise ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAlternativasAnalise && (
                  <div className="space-y-2">
                    {question.gabarito_comentado.analise_alternativas.map((analise) => {
                      const isCorreta = analise.correta || analise.letra === question.gabarito_comentado?.resposta_correta
                      return (
                        <div
                          key={analise.letra}
                          className={`p-3 rounded-lg border ${
                            isCorreta
                              ? 'bg-green-500/10 border-green-500/30'
                              : 'bg-red-500/5 border-red-500/20'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCorreta
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500/30 text-red-300'
                            }`}>
                              {analise.letra}
                            </span>
                            <div className="flex-1">
                              <p className={`text-xs font-medium mb-1 ${
                                isCorreta ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {isCorreta ? '✓ CORRETA' : '✗ INCORRETA'}
                              </p>
                              <p className="text-white/70 text-sm leading-relaxed">
                                {analise.analise}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Ponto chave - só mostrar se existir */}
            {question.gabarito_comentado.ponto_chave && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 text-lg">🎯</span>
                  <span className="text-yellow-400 text-xs font-semibold uppercase">Ponto-Chave</span>
                </div>
                <p className="text-white/80 text-sm">{question.gabarito_comentado.ponto_chave}</p>
              </div>
            )}

            {/* Dica de memorização se houver */}
            {question.gabarito_comentado.dica_memorizacao && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-400 text-lg">💡</span>
                  <span className="text-purple-400 text-xs font-semibold uppercase">Dica de Memorização</span>
                </div>
                <p className="text-white/80 text-sm">{question.gabarito_comentado.dica_memorizacao}</p>
              </div>
            )}

            {/* Pegadinha se houver */}
            {question.gabarito_comentado.pegadinha && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-400 text-lg">⚠️</span>
                  <span className="text-red-400 text-xs font-semibold uppercase">Pegadinha</span>
                </div>
                <p className="text-white/80 text-sm">{question.gabarito_comentado.pegadinha}</p>
              </div>
            )}

            {/* Referências - só mostrar se existir e tiver itens */}
            {question.gabarito_comentado.referencias &&
             question.gabarito_comentado.referencias.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/40 text-lg">📚</span>
                  <span className="text-white/40 text-xs font-semibold uppercase">Referências</span>
                </div>
                <ul className="space-y-1">
                  {question.gabarito_comentado.referencias.map((ref, i) => (
                    <li key={i} className="text-white/50 text-xs pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-white/30">
                      {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {question.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
