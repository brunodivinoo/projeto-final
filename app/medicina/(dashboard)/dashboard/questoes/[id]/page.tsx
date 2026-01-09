'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BookOpen,
  Lightbulb,
  PenTool,
  MessageSquare,
  Share2,
  Flag,
  Bookmark
} from 'lucide-react'

interface Questao {
  id: string
  enunciado: string
  alternativas: { letra: string, texto: string }[]
  gabarito: string
  banca: string | null
  ano: number | null
  instituicao: string | null
  prova: string | null
  dificuldade: number
  total_respostas: number
  total_acertos: number
  comentario_ia: string | null
  explicacao: string | null
  tags: string[] | null
  disciplina: { id: string, nome: string } | null
  assunto: { id: string, nome: string } | null
  subassunto: { id: string, nome: string } | null
  teoria: { id: string, titulo: string } | null
}

interface RespostaUsuario {
  resposta_selecionada: string
  acertou: boolean
  tempo_segundos: number | null
}

export default function QuestaoPage() {
  const params = useParams()
  const router = useRouter()
  const { user, limitesPlano, limites } = useMedAuth()

  const [questao, setQuestao] = useState<Questao | null>(null)
  const [respostaAnterior, setRespostaAnterior] = useState<RespostaUsuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [acertou, setAcertou] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tempoInicio] = useState(Date.now())
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [showExplicacao, setShowExplicacao] = useState(false)

  // Timer
  useEffect(() => {
    if (showResult) return

    const interval = setInterval(() => {
      setTempoDecorrido(Math.floor((Date.now() - tempoInicio) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [tempoInicio, showResult])

  const fetchQuestao = useCallback(async () => {
    if (!params.id || !user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/medicina/questoes/${params.id}?userId=${user.id}`)
      const data = await response.json()

      if (data.questao) {
        setQuestao(data.questao)
      }

      if (data.respostaUsuario) {
        setRespostaAnterior(data.respostaUsuario)
        setSelectedOption(data.respostaUsuario.resposta_selecionada)
        setShowResult(true)
        setAcertou(data.respostaUsuario.acertou)
      }

    } catch (error) {
      console.error('Erro ao buscar questão:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, user])

  useEffect(() => {
    fetchQuestao()
  }, [fetchQuestao])

  const handleSubmit = async () => {
    if (!selectedOption || !questao || !user || submitting) return

    // Verificar limite
    const questoesUsadas = limites?.questoes_dia || 0
    const questoesLimite = limitesPlano.questoes_dia
    if (questoesLimite !== -1 && questoesUsadas >= questoesLimite) {
      alert('Você atingiu o limite de questões diárias. Faça upgrade para continuar.')
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch('/api/medicina/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          questaoId: questao.id,
          respostaSelecionada: selectedOption,
          tempoSegundos: tempoDecorrido
        })
      })

      const data = await response.json()

      setAcertou(data.acertou)
      setShowResult(true)

    } catch (error) {
      console.error('Erro ao enviar resposta:', error)
      alert('Erro ao enviar resposta. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const sec = segundos % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const getLetraClass = (letra: string) => {
    if (!showResult) {
      return selectedOption === letra
        ? 'bg-emerald-500/20 border-emerald-500 text-white'
        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
    }

    if (letra === questao?.gabarito) {
      return 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
    }

    if (selectedOption === letra && letra !== questao?.gabarito) {
      return 'bg-red-500/20 border-red-500 text-red-400'
    }

    return 'bg-white/5 border-white/10 text-white/40'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!questao) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-2">Questão não encontrada</h2>
        <Link href="/medicina/dashboard/questoes" className="text-emerald-400 hover:underline">
          Voltar para o banco de questões
        </Link>
      </div>
    )
  }

  const taxaAcertoQuestao = questao.total_respostas > 0
    ? Math.round((questao.total_acertos / questao.total_respostas) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/medicina/dashboard/questoes"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex items-center gap-4">
          {!showResult && (
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-mono">{formatTempo(tempoDecorrido)}</span>
            </div>
          )}
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Flag className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Questão Card */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {/* Meta */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center gap-3">
          {questao.disciplina && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
              {questao.disciplina.nome}
            </span>
          )}
          {questao.assunto && (
            <span className="px-3 py-1 bg-teal-500/20 text-teal-400 text-sm rounded-full">
              {questao.assunto.nome}
            </span>
          )}
          {questao.banca && (
            <span className="px-3 py-1 bg-white/10 text-white/60 text-sm rounded-full">
              {questao.banca} {questao.ano && `• ${questao.ano}`}
            </span>
          )}
          {questao.instituicao && (
            <span className="text-white/40 text-sm">
              {questao.instituicao}
            </span>
          )}
        </div>

        {/* Enunciado */}
        <div className="p-6">
          <p className="text-white whitespace-pre-wrap leading-relaxed text-lg">
            {questao.enunciado}
          </p>
        </div>

        {/* Alternativas */}
        <div className="px-6 pb-6 space-y-3">
          {questao.alternativas.map((alt) => (
            <button
              key={alt.letra}
              onClick={() => !showResult && !respostaAnterior && setSelectedOption(alt.letra)}
              disabled={showResult || !!respostaAnterior}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${getLetraClass(alt.letra)}`}
            >
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold flex-shrink-0">
                {alt.letra}
              </span>
              <span className="flex-1 pt-1">{alt.texto}</span>
              {showResult && alt.letra === questao.gabarito && (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              )}
              {showResult && selectedOption === alt.letra && alt.letra !== questao.gabarito && (
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Ação de Responder */}
        {!showResult && !respostaAnterior && (
          <div className="px-6 pb-6">
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || submitting}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                  Enviando...
                </>
              ) : (
                'Confirmar Resposta'
              )}
            </button>
          </div>
        )}

        {/* Resultado */}
        {showResult && (
          <div className={`px-6 py-4 ${acertou ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <div className="flex items-center gap-3">
              {acertou ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-400">Você acertou!</h3>
                    <p className="text-emerald-200/70 text-sm">
                      Tempo: {formatTempo(respostaAnterior?.tempo_segundos || tempoDecorrido)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-400" />
                  <div>
                    <h3 className="text-lg font-bold text-red-400">Você errou</h3>
                    <p className="text-red-200/70 text-sm">
                      A resposta correta é a letra {questao.gabarito}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas da Questão */}
      {showResult && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">{questao.total_respostas}</div>
            <div className="text-white/60 text-sm">Respostas</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-emerald-400">{taxaAcertoQuestao}%</div>
            <div className="text-white/60 text-sm">Taxa de Acerto</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <div className="text-2xl font-bold text-white">{questao.dificuldade}/5</div>
            <div className="text-white/60 text-sm">Dificuldade</div>
          </div>
        </div>
      )}

      {/* Explicação */}
      {showResult && (questao.explicacao || questao.comentario_ia) && (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowExplicacao(!showExplicacao)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-white">Ver Explicação</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${showExplicacao ? 'rotate-90' : ''}`} />
          </button>

          {showExplicacao && (
            <div className="px-6 pb-6 border-t border-white/10 pt-4">
              <div className="prose prose-invert max-w-none">
                {questao.explicacao && (
                  <div className="mb-4">
                    <h4 className="text-white font-semibold mb-2">Explicação</h4>
                    <p className="text-white/80 whitespace-pre-wrap">{questao.explicacao}</p>
                  </div>
                )}
                {questao.comentario_ia && (
                  <div>
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs">IA</span>
                      Comentário da IA
                    </h4>
                    <p className="text-white/80 whitespace-pre-wrap">{questao.comentario_ia}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações Adicionais */}
      {showResult && (
        <div className="flex flex-wrap gap-3">
          {questao.teoria && (
            <Link
              href={`/medicina/dashboard/biblioteca/${questao.teoria.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Estudar Teoria
            </Link>
          )}
          <Link
            href="/medicina/dashboard/anotacoes/nova"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
          >
            <PenTool className="w-5 h-5" />
            Fazer Anotação
          </Link>
          <Link
            href={`/medicina/dashboard/forum?questaoId=${questao.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Discutir no Fórum
          </Link>
          <Link
            href="/medicina/dashboard/questoes"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors ml-auto"
          >
            Próxima Questão
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      )}
    </div>
  )
}
