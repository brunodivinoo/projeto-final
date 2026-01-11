'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Star,
  CheckCircle2,
  ChevronRight,
  FileText,
  Lightbulb,
  AlertTriangle,
  Link2,
  BookMarked,
  PenTool,
  Share2,
  Brain
} from 'lucide-react'

interface ConteudoBloco {
  tipo: string
  conteudo?: string
  titulo?: string
  texto?: string
  itens?: string[]
  url?: string
  alt?: string
  legenda?: string
}

interface ConteudoTeoria {
  titulo?: string
  secoes?: Array<{ titulo: string; conteudo: string }>
  blocos?: ConteudoBloco[]
}

interface TabelaResumo {
  colunas: string[]
  linhas: Array<Record<string, string>>
}

interface ReferenciaBibliografica {
  titulo: string
  autores: string
  ano: number
  url?: string
}

interface Teoria {
  id: string
  titulo: string
  subtitulo: string | null
  conteudo: ConteudoTeoria | null
  pontos_chave: string[] | null
  macetes: string[] | null
  pegadinhas: string[] | null
  correlacao_clinica: string | null
  tabela_resumo: TabelaResumo | null
  referencias_bibliograficas: ReferenciaBibliografica[] | null
  tempo_leitura_minutos: number
  nivel_dificuldade: number
  disciplina: { id: string, nome: string } | null
  assunto: { id: string, nome: string } | null
  subassunto: { id: string, nome: string } | null
}

interface Progresso {
  lido: boolean
  favorito: boolean
  nivel_lido: string
}

interface QuestaoRelacionada {
  id: string
  enunciado: string
  dificuldade: number
}

interface Artigo {
  id: string
  titulo: string
  autores: string[]
  ano: number
  journal: string
  resumo_ia: string
}

export default function TeoriaPage() {
  const params = useParams()
  const router = useRouter()
  const { user, limitesPlano } = useMedAuth()

  const [teoria, setTeoria] = useState<Teoria | null>(null)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [questoes, setQuestoes] = useState<QuestaoRelacionada[]>([])
  const [artigos, setArtigos] = useState<Artigo[]>([])
  const [loading, setLoading] = useState(true)
  const [nivelAtivo, setNivelAtivo] = useState<'basico' | 'avancado' | 'expert'>('basico')
  const [showMacetes, setShowMacetes] = useState(false)
  const [showPegadinhas, setShowPegadinhas] = useState(false)

  const nivelAcesso = limitesPlano.teoria_nivel

  const fetchTeoria = useCallback(async () => {
    if (!params.id || !user) return

    try {
      setLoading(true)

      const response = await fetch(
        `/api/medicina/teorias/${params.id}?userId=${user.id}&nivel=${nivelAtivo}`
      )
      const data = await response.json()

      if (data.teoria) {
        setTeoria(data.teoria)
      }
      if (data.progresso) {
        setProgresso(data.progresso)
      }
      if (data.questoesRelacionadas) {
        setQuestoes(data.questoesRelacionadas)
      }
      if (data.artigos) {
        setArtigos(data.artigos)
      }

    } catch (error) {
      console.error('Erro ao buscar teoria:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, user, nivelAtivo])

  useEffect(() => {
    fetchTeoria()
  }, [fetchTeoria])

  const atualizarProgresso = async (dados: Partial<Progresso>) => {
    if (!user || !teoria) return

    try {
      await fetch('/api/medicina/teorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          teoriaId: teoria.id,
          ...dados
        })
      })

      setProgresso(prev => prev ? { ...prev, ...dados } : dados as Progresso)

    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
    }
  }

  const marcarComoLido = () => {
    atualizarProgresso({ lido: true, nivel_lido: nivelAtivo })
  }

  const toggleFavorito = () => {
    atualizarProgresso({ favorito: !progresso?.favorito })
  }

  const podeAcessarNivel = (nivel: string) => {
    if (nivelAcesso === 'expert') return true
    if (nivelAcesso === 'avancado') return nivel !== 'expert'
    return nivel === 'basico'
  }

  // Renderizar conteúdo JSON
  const renderConteudo = (conteudo: ConteudoTeoria | string | ConteudoBloco[] | null) => {
    if (!conteudo) return null

    // String simples
    if (typeof conteudo === 'string') {
      return <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{conteudo}</p>
    }

    // Array de blocos
    if (Array.isArray(conteudo)) {
      return conteudo.map((bloco, index) => renderBloco(bloco, index))
    }

    // Objeto com estrutura
    if (typeof conteudo === 'object') {
      // Formato com blocos
      if ('blocos' in conteudo && conteudo.blocos) {
        return conteudo.blocos.map((bloco: ConteudoBloco, index: number) => renderBloco(bloco, index))
      }

      // Formato com seções (o formato do print!)
      if ('secoes' in conteudo && Array.isArray(conteudo.secoes)) {
        return (
          <div className="space-y-8">
            {conteudo.titulo && (
              <h2 className="text-2xl font-bold text-white border-b border-white/10 pb-4">{conteudo.titulo}</h2>
            )}
            {conteudo.secoes.map((secao: { titulo: string; conteudo: string }, index: number) => (
              <div key={index} className="space-y-3">
                <h3 className="text-xl font-semibold text-emerald-400 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  {secao.titulo}
                </h3>
                <div className="pl-10">
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{secao.conteudo}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }

      // Formato com título e conteúdo direto
      if ('titulo' in conteudo && 'conteudo' in conteudo) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">{conteudo.titulo}</h2>
            <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
              {typeof conteudo.conteudo === 'string' ? conteudo.conteudo : JSON.stringify(conteudo.conteudo, null, 2)}
            </p>
          </div>
        )
      }

      // Fallback: renderizar objeto de forma legível
      return renderObjectAsContent(conteudo as unknown as Record<string, unknown>)
    }

    return <p className="text-white/80">{String(conteudo)}</p>
  }

  // Renderizar objeto genérico de forma legível
  const renderObjectAsContent = (obj: Record<string, unknown>) => {
    return (
      <div className="space-y-6">
        {Object.entries(obj).map(([key, value], index) => {
          // Ignorar chaves internas
          if (key.startsWith('_')) return null

          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

          return (
            <div key={index} className="space-y-2">
              <h3 className="text-lg font-semibold text-emerald-400">{formattedKey}</h3>
              <div className="pl-4 border-l-2 border-emerald-500/30">
                {typeof value === 'string' ? (
                  <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{value}</p>
                ) : Array.isArray(value) ? (
                  <ul className="space-y-2">
                    {value.map((item, i) => (
                      <li key={i} className="text-white/80 flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        {typeof item === 'string' ? item : JSON.stringify(item)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/80">{JSON.stringify(value, null, 2)}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderBloco = (bloco: ConteudoBloco | string, index: number) => {
    if (typeof bloco === 'string') {
      return <p key={index} className="text-white/80 mb-4">{bloco}</p>
    }

    switch (bloco.tipo) {
      case 'titulo':
        return <h2 key={index} className="text-xl font-bold text-white mt-8 mb-4">{bloco.texto}</h2>
      case 'subtitulo':
        return <h3 key={index} className="text-lg font-semibold text-white mt-6 mb-3">{bloco.texto}</h3>
      case 'paragrafo':
        return <p key={index} className="text-white/80 mb-4 leading-relaxed">{bloco.texto}</p>
      case 'lista':
        return (
          <ul key={index} className="list-disc list-inside text-white/80 mb-4 space-y-2">
            {bloco.itens?.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )
      case 'destaque':
        return (
          <div key={index} className="bg-emerald-500/10 border-l-4 border-emerald-500 p-4 mb-4 rounded-r-lg">
            <p className="text-emerald-200">{bloco.texto}</p>
          </div>
        )
      case 'alerta':
        return (
          <div key={index} className="bg-amber-500/10 border-l-4 border-amber-500 p-4 mb-4 rounded-r-lg">
            <p className="text-amber-200">{bloco.texto}</p>
          </div>
        )
      case 'imagem':
        return (
          <figure key={index} className="mb-6">
            <img src={bloco.url} alt={bloco.legenda || ''} className="rounded-lg max-w-full" />
            {bloco.legenda && (
              <figcaption className="text-white/40 text-sm mt-2 text-center">{bloco.legenda}</figcaption>
            )}
          </figure>
        )
      default:
        return <p key={index} className="text-white/80 mb-4">{bloco.texto || JSON.stringify(bloco)}</p>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!teoria) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-white mb-2">Teoria não encontrada</h2>
        <Link href="/medicina/dashboard/biblioteca" className="text-emerald-400 hover:underline">
          Voltar para a biblioteca
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/medicina/dashboard/biblioteca"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorito}
            className={`p-2 rounded-lg transition-colors ${
              progresso?.favorito
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className={`w-5 h-5 ${progresso?.favorito ? 'fill-amber-400' : ''}`} />
          </button>
          <button className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Título e Meta */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {teoria.disciplina && (
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
              {teoria.disciplina.nome}
            </span>
          )}
          {teoria.assunto && (
            <span className="px-3 py-1 bg-teal-500/20 text-teal-400 text-sm rounded-full">
              {teoria.assunto.nome}
            </span>
          )}
          {teoria.subassunto && (
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded-full">
              {teoria.subassunto.nome}
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{teoria.titulo}</h1>
        {teoria.subtitulo && (
          <p className="text-white/60 text-lg">{teoria.subtitulo}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/60">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {teoria.tempo_leitura_minutos} min de leitura
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            Nível {teoria.nivel_dificuldade}/5
          </span>
          {progresso?.lido && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Lido ({progresso.nivel_lido})
            </span>
          )}
        </div>
      </div>

      {/* Seletor de Nível */}
      <div className="flex gap-2">
        {['basico', 'avancado', 'expert'].map((nivel) => {
          const acessivel = podeAcessarNivel(nivel)
          const labels: Record<string, string> = {
            basico: 'Básico',
            avancado: 'Avançado',
            expert: 'Expert'
          }

          return (
            <button
              key={nivel}
              onClick={() => acessivel && setNivelAtivo(nivel as 'basico' | 'avancado' | 'expert')}
              disabled={!acessivel}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                nivelAtivo === nivel
                  ? 'bg-emerald-500 text-white'
                  : acessivel
                  ? 'bg-white/5 text-white/60 hover:bg-white/10'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              {labels[nivel]}
              {!acessivel && ' 🔒'}
            </button>
          )
        })}
      </div>

      {/* Pontos Chave */}
      {teoria.pontos_chave && teoria.pontos_chave.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-6 border border-emerald-500/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            Pontos Chave
          </h3>
          <ul className="space-y-2">
            {teoria.pontos_chave.map((ponto, i) => (
              <li key={i} className="flex items-start gap-3 text-white/80">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                {ponto}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="bg-white/5 rounded-xl p-6 md:p-8 border border-white/10">
        <div className="prose prose-invert max-w-none">
          {renderConteudo(teoria.conteudo)}
        </div>
      </div>

      {/* Macetes */}
      {teoria.macetes && teoria.macetes.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowMacetes(!showMacetes)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">Macetes para Memorização</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${showMacetes ? 'rotate-90' : ''}`} />
          </button>
          {showMacetes && (
            <div className="px-6 pb-6 border-t border-white/10 pt-4 space-y-3">
              {teoria.macetes.map((macete, i) => (
                <div key={i} className="p-3 bg-purple-500/10 rounded-lg text-purple-200">
                  {macete}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pegadinhas */}
      {teoria.pegadinhas && teoria.pegadinhas.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowPegadinhas(!showPegadinhas)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-white">Pegadinhas Comuns em Provas</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-white/40 transition-transform ${showPegadinhas ? 'rotate-90' : ''}`} />
          </button>
          {showPegadinhas && (
            <div className="px-6 pb-6 border-t border-white/10 pt-4 space-y-3">
              {teoria.pegadinhas.map((pegadinha, i) => (
                <div key={i} className="p-3 bg-amber-500/10 rounded-lg text-amber-200">
                  {pegadinha}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Correlação Clínica */}
      {teoria.correlacao_clinica && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Correlação Clínica
          </h3>
          <p className="text-white/80 whitespace-pre-wrap">{teoria.correlacao_clinica}</p>
        </div>
      )}

      {/* Questões Relacionadas */}
      {questoes.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <FileText className="w-5 h-5 text-emerald-400" />
            Questões Relacionadas
          </h3>
          <div className="space-y-3">
            {questoes.map((q) => (
              <Link
                key={q.id}
                href={`/medicina/dashboard/questoes/${q.id}`}
                className="block p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <p className="text-white/80 line-clamp-2">{q.enunciado}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-white/40 text-sm">Dificuldade: {q.dificuldade}/5</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        {!progresso?.lido && (
          <button
            onClick={marcarComoLido}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-colors"
          >
            <CheckCircle2 className="w-5 h-5" />
            Marcar como Lido
          </button>
        )}
        <Link
          href="/medicina/dashboard/anotacoes/nova"
          className="flex items-center gap-2 px-4 py-3 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        >
          <PenTool className="w-5 h-5" />
          Fazer Anotação
        </Link>
        <Link
          href="/medicina/dashboard/ia"
          className="flex items-center gap-2 px-4 py-3 bg-white/5 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Brain className="w-5 h-5" />
          Perguntar à IA
        </Link>
      </div>
    </div>
  )
}
