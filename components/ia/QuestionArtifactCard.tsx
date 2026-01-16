'use client'

import { useState, useCallback } from 'react'
import { Question, DIFFICULTY_COLORS } from '@/stores/artifactsStore'
import { Scissors } from 'lucide-react'

interface QuestionArtifactCardProps {
  question: Question
  onAnswerSubmit?: (questionId: string, answer: string, correct: boolean) => void
}

export default function QuestionArtifactCard({ question, onAnswerSubmit }: QuestionArtifactCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(question.resposta_usuario || null)
  const [showFeedback, setShowFeedback] = useState(question.mostrar_gabarito || false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(question.acertou ?? null)
  const [expandedSection, setExpandedSection] = useState<'gabarito' | null>(null)
  const [showAlternativasAnalise, setShowAlternativasAnalise] = useState(false)
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

  const handleSubmitAnswer = useCallback(() => {
    if (!selectedAnswer || showFeedback) return

    // Buscar resposta correta do gabarito (não das alternativas para não vazar)
    const correctAnswerLetter = question.gabarito_comentado?.resposta_correta ||
      question.alternativas.find(a => a.correta)?.letra
    const correct = selectedAnswer === correctAnswerLetter

    setIsCorrect(correct)
    setShowFeedback(true)

    if (onAnswerSubmit && question.id) {
      onAnswerSubmit(question.id, selectedAnswer, correct)
    }
  }, [selectedAnswer, showFeedback, question, onAnswerSubmit])

  const toggleSection = useCallback((section: 'gabarito') => {
    setExpandedSection(prev => prev === section ? null : section)
  }, [])

  // Resposta correta vem do gabarito_comentado (não das alternativas)
  const correctAnswerLetter = question.gabarito_comentado?.resposta_correta ||
    question.alternativas.find(a => a.correta)?.letra

  return (
    <div className="bg-[#1A2332] border border-white/10 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#151D2B] border-b border-white/10">
        {/* Número da questão */}
        <span className="bg-emerald-500/20 text-emerald-400 font-bold text-sm px-2.5 py-1 rounded-lg">
          Q{question.numero}
        </span>

        {/* Disciplina e Assunto */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-white/90 font-medium">{question.disciplina}</span>
          {question.assunto && (
            <>
              <span className="text-white/40">›</span>
              <span className="text-white/60">{question.assunto}</span>
            </>
          )}
          {question.subassunto && (
            <>
              <span className="text-white/40">›</span>
              <span className="text-white/50 text-xs">{question.subassunto}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Banca */}
          {question.banca_estilo && (
            <span className="text-white/50 text-xs font-medium uppercase tracking-wider">
              {question.banca_estilo}
            </span>
          )}

          {/* Tipo */}
          <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/60 text-xs">
            {isCertoErrado ? 'C/E' : 'Múltipla'}
          </span>

          {/* Dificuldade */}
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${difficultyConfig.bg} ${difficultyConfig.text}`}>
            {difficultyConfig.label}
          </span>

          {/* Badge IA */}
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-xs font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
            </svg>
            IA
          </span>
        </div>
      </div>

      {/* Corpo da questão */}
      <div className="p-4 lg:p-5">
        {/* Caso clínico se houver */}
        {question.caso_clinico && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Caso Clínico</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {question.caso_clinico}
            </p>
          </div>
        )}

        {/* Instrução para C/E */}
        {isCertoErrado && (
          <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">
            JULGUE O ITEM A SEGUIR
          </p>
        )}

        {/* Enunciado */}
        <p className="text-white/90 text-[15px] leading-relaxed mb-5 whitespace-pre-wrap">
          {question.enunciado}
        </p>

        {/* Imagem se houver */}
        {question.imagem_url && (
          <div className="mb-5">
            <img
              src={question.imagem_url}
              alt="Imagem da questão"
              className="max-w-full h-auto rounded-lg border border-white/10"
            />
          </div>
        )}

        {/* Alternativas */}
        <div className="space-y-2.5">
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
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${containerClasses} ${showFeedback ? 'cursor-default' : isEliminated ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border-2 transition-all ${circleClasses}`}>
                    {showResultStyles && isCorrectAlt ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : showResultStyles && isSelected && !isCorrectAlt ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      alt.letra
                    )}
                  </div>
                  <span className={`flex-1 text-sm pt-1 ${isEliminated ? 'line-through text-white/40' : isSelected || (showResultStyles && isCorrectAlt) ? 'text-white font-medium' : 'text-white/70'}`}>
                    {alt.texto}
                  </span>
                </button>

                {/* Botão de tesoura para eliminar alternativa */}
                {!showFeedback && (
                  <button
                    onClick={(e) => handleEliminateAlternative(alt.letra, e)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                      isEliminated
                        ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                        : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white/60 opacity-0 group-hover:opacity-100'
                    }`}
                    title={isEliminated ? 'Restaurar alternativa' : 'Eliminar alternativa'}
                  >
                    <Scissors className={`w-4 h-4 ${isEliminated ? 'rotate-45' : ''} transition-transform`} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Ações e Resultado */}
      <div className="flex items-center gap-3 px-4 lg:px-5 py-4 border-t border-white/10">
        {!showFeedback ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              selectedAnswer
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Responder
          </button>
        ) : (
          <div className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${
            isCorrect
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isCorrect ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Acertou!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
            expandedSection === 'gabarito'
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'text-white/60 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-sm font-medium">Gabarito Comentado</span>
          </div>
          <svg
            className={`w-5 h-5 transition-transform ${expandedSection === 'gabarito' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Conteúdo do Gabarito */}
        {expandedSection === 'gabarito' && (
          <div className="p-4 bg-emerald-500/5 border-t border-white/5 space-y-4">
            {/* Resposta correta e explicação */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  Gabarito: {question.gabarito_comentado.resposta_correta}
                </span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {question.gabarito_comentado.explicacao}
              </p>
            </div>

            {/* Análise das alternativas */}
            {question.gabarito_comentado.analise_alternativas.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAlternativasAnalise(prev => !prev)}
                  className="flex items-center gap-2 text-white/60 hover:text-white/80 text-sm mb-2"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showAlternativasAnalise ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium">Análise das Alternativas</span>
                </button>

                {showAlternativasAnalise && (
                  <div className="space-y-2 pl-4">
                    {question.gabarito_comentado.analise_alternativas.map((analise) => (
                      <div key={analise.letra} className="text-sm">
                        <span className="font-bold text-white/70">{analise.letra})</span>
                        <span className="text-white/60 ml-2">{analise.analise}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ponto chave */}
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-yellow-400 text-xs font-semibold uppercase">Ponto-Chave</span>
              </div>
              <p className="text-white/80 text-sm">{question.gabarito_comentado.ponto_chave}</p>
            </div>

            {/* Pegadinha se houver */}
            {question.gabarito_comentado.pegadinha && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-red-400 text-xs font-semibold uppercase">Pegadinha</span>
                </div>
                <p className="text-white/80 text-sm">{question.gabarito_comentado.pegadinha}</p>
              </div>
            )}

            {/* Dica de memorização se houver */}
            {question.gabarito_comentado.dica_memorizacao && (
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-purple-400 text-xs font-semibold uppercase">Dica de Memorização</span>
                </div>
                <p className="text-white/80 text-sm">{question.gabarito_comentado.dica_memorizacao}</p>
              </div>
            )}

            {/* Referências */}
            {question.gabarito_comentado.referencias.length > 0 && (
              <div className="pt-2 border-t border-white/10">
                <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Referências:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {question.gabarito_comentado.referencias.map((ref, i) => (
                    <span key={i} className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded">
                      {ref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {question.tags.map((tag, i) => (
                  <span key={i} className="text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5 rounded-full">
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
