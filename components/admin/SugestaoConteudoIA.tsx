'use client'

import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  Plus,
  Check,
  X,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Wand2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface Subassunto {
  nome: string
}

interface AssuntoSugerido {
  nome: string
  descricao: string
  subassuntos: string[]
  selecionado?: boolean
}

interface DisciplinaSugerida {
  nome: string
  descricao: string
  assuntos: AssuntoSugerido[]
  selecionado?: boolean
  expandido?: boolean
}

interface Props {
  disciplinas: { id: string; nome: string }[]
  disciplinaSelecionada?: string
  onConteudoCriado: () => void
}

export function SugestaoConteudoIA({ disciplinas, disciplinaSelecionada, onConteudoCriado }: Props) {
  const [modo, setModo] = useState<'disciplinas' | 'assuntos'>('disciplinas')
  const [carregando, setCarregando] = useState(false)
  const [criando, setCriando] = useState(false)
  const [contexto, setContexto] = useState('')
  const [sugestoesDisciplinas, setSugestoesDisciplinas] = useState<DisciplinaSugerida[]>([])
  const [sugestoesAssuntos, setSugestoesAssuntos] = useState<AssuntoSugerido[]>([])
  const [erro, setErro] = useState('')
  const [tokensUsados, setTokensUsados] = useState(0)
  const [aberto, setAberto] = useState(false)

  const gerarSugestoes = async () => {
    setCarregando(true)
    setErro('')
    setSugestoesDisciplinas([])
    setSugestoesAssuntos([])

    try {
      const response = await fetch('/api/medicina/admin/sugerir-conteudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: modo,
          disciplina_id: modo === 'assuntos' ? disciplinaSelecionada : undefined,
          contexto: contexto || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar sugestões')
      }

      if (modo === 'disciplinas') {
        setSugestoesDisciplinas(
          data.sugestoes.map((d: DisciplinaSugerida) => ({
            ...d,
            selecionado: true,
            expandido: false,
            assuntos: d.assuntos.map(a => ({ ...a, selecionado: true }))
          }))
        )
      } else {
        setSugestoesAssuntos(
          data.sugestoes.map((a: AssuntoSugerido) => ({ ...a, selecionado: true }))
        )
      }

      setTokensUsados(data.tokens_usados || 0)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setCarregando(false)
    }
  }

  const criarSelecionados = async () => {
    setCriando(true)
    setErro('')

    try {
      let itens: DisciplinaSugerida[] | AssuntoSugerido[] = []

      if (modo === 'disciplinas') {
        itens = sugestoesDisciplinas
          .filter(d => d.selecionado)
          .map(d => ({
            ...d,
            assuntos: d.assuntos.filter(a => a.selecionado)
          }))
      } else {
        itens = sugestoesAssuntos.filter(a => a.selecionado)
      }

      if (itens.length === 0) {
        setErro('Selecione pelo menos um item para criar')
        setCriando(false)
        return
      }

      const response = await fetch('/api/medicina/admin/sugerir-conteudo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: modo,
          disciplina_id: modo === 'assuntos' ? disciplinaSelecionada : undefined,
          itens
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conteúdo')
      }

      // Limpar sugestões após criar
      setSugestoesDisciplinas([])
      setSugestoesAssuntos([])

      // Notificar o componente pai
      onConteudoCriado()

      // Mostrar resultado
      alert(`✅ Criados: ${data.resultados.criados}\n⏭️ Ignorados (já existem): ${data.resultados.ignorados}${data.resultados.erros.length > 0 ? `\n❌ Erros: ${data.resultados.erros.join(', ')}` : ''}`)

    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setCriando(false)
    }
  }

  const toggleDisciplina = (index: number) => {
    setSugestoesDisciplinas(prev =>
      prev.map((d, i) => i === index ? { ...d, selecionado: !d.selecionado } : d)
    )
  }

  const toggleExpandirDisciplina = (index: number) => {
    setSugestoesDisciplinas(prev =>
      prev.map((d, i) => i === index ? { ...d, expandido: !d.expandido } : d)
    )
  }

  const toggleAssunto = (disciplinaIndex: number, assuntoIndex: number) => {
    setSugestoesDisciplinas(prev =>
      prev.map((d, di) =>
        di === disciplinaIndex
          ? {
            ...d,
            assuntos: d.assuntos.map((a, ai) =>
              ai === assuntoIndex ? { ...a, selecionado: !a.selecionado } : a
            )
          }
          : d
      )
    )
  }

  const toggleAssuntoSimples = (index: number) => {
    setSugestoesAssuntos(prev =>
      prev.map((a, i) => i === index ? { ...a, selecionado: !a.selecionado } : a)
    )
  }

  const disciplinaNome = disciplinas.find(d => d.id === disciplinaSelecionada)?.nome

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl overflow-hidden">
      {/* Header colapsável */}
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-semibold">Sugestões com IA (Opus 4.5)</h3>
            <p className="text-slate-600 text-sm">Gere disciplinas e assuntos automaticamente</p>
          </div>
        </div>
        {aberto ? (
          <ChevronUp className="w-5 h-5 text-slate-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Conteúdo */}
      {aberto && (
        <div className="p-4 pt-0 space-y-4">
          {/* Seletor de modo */}
          <div className="flex gap-2">
            <button
              onClick={() => setModo('disciplinas')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${modo === 'disciplinas'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
                }`}
            >
              Novas Disciplinas
            </button>
            <button
              onClick={() => setModo('assuntos')}
              disabled={!disciplinaSelecionada}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${modo === 'assuntos'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Novos Assuntos
              {disciplinaSelecionada && <span className="text-xs ml-1">({disciplinaNome})</span>}
            </button>
          </div>

          {/* Input de contexto */}
          <div>
            <label className="block text-slate-600 text-sm mb-2">
              Contexto adicional (opcional)
            </label>
            <input
              type="text"
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder={modo === 'disciplinas'
                ? "Ex: Foque em disciplinas do ciclo clínico..."
                : "Ex: Assuntos mais cobrados em residência..."
              }
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-white placeholder-white/40 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          {/* Botão de gerar */}
          <button
            onClick={gerarSugestoes}
            disabled={carregando || (modo === 'assuntos' && !disciplinaSelecionada)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {carregando ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando sugestões...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Gerar Sugestões com IA
              </>
            )}
          </button>

          {/* Erro */}
          {erro && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {erro}
            </div>
          )}

          {/* Sugestões de Disciplinas */}
          {sugestoesDisciplinas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">
                  {sugestoesDisciplinas.filter(d => d.selecionado).length} disciplinas selecionadas
                </h4>
                <span className="text-slate-500 text-xs">{tokensUsados} tokens</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sugestoesDisciplinas.map((disciplina, di) => (
                  <div
                    key={di}
                    className={`border rounded-lg overflow-hidden transition-all ${disciplina.selecionado
                        ? 'bg-slate-100 border-purple-500/30'
                        : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <button
                        onClick={() => toggleDisciplina(di)}
                        className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${disciplina.selecionado
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {disciplina.selecionado && <Check className="w-4 h-4" />}
                      </button>

                      <div className="flex-1">
                        <p className="text-white font-medium">{disciplina.nome}</p>
                        <p className="text-slate-500 text-xs">{disciplina.descricao}</p>
                      </div>

                      <button
                        onClick={() => toggleExpandirDisciplina(di)}
                        className="p-2 text-slate-500 hover:text-slate-600"
                      >
                        {disciplina.expandido ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {disciplina.expandido && disciplina.selecionado && (
                      <div className="px-3 pb-3 pl-12 space-y-2">
                        <p className="text-slate-500 text-xs uppercase tracking-wide">Assuntos:</p>
                        {disciplina.assuntos.map((assunto, ai) => (
                          <div
                            key={ai}
                            className={`flex items-start gap-2 p-2 rounded ${assunto.selecionado ? 'bg-slate-100' : 'opacity-50'
                              }`}
                          >
                            <button
                              onClick={() => toggleAssunto(di, ai)}
                              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${assunto.selecionado
                                  ? 'bg-cyan-500 text-white'
                                  : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                              {assunto.selecionado && <Check className="w-3 h-3" />}
                            </button>
                            <div>
                              <p className="text-slate-700 text-sm">{assunto.nome}</p>
                              {assunto.subassuntos.length > 0 && (
                                <p className="text-slate-500 text-xs mt-1">
                                  Subassuntos: {assunto.subassuntos.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={criarSelecionados}
                disabled={criando || sugestoesDisciplinas.filter(d => d.selecionado).length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {criando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Criar Disciplinas Selecionadas
                  </>
                )}
              </button>
            </div>
          )}

          {/* Sugestões de Assuntos */}
          {sugestoesAssuntos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">
                  {sugestoesAssuntos.filter(a => a.selecionado).length} assuntos selecionados
                </h4>
                <span className="text-slate-500 text-xs">{tokensUsados} tokens</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sugestoesAssuntos.map((assunto, ai) => (
                  <div
                    key={ai}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${assunto.selecionado
                        ? 'bg-slate-100 border-cyan-500/30'
                        : 'bg-slate-100 border-slate-200 opacity-60'
                      }`}
                  >
                    <button
                      onClick={() => toggleAssuntoSimples(ai)}
                      className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${assunto.selecionado
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {assunto.selecionado && <Check className="w-4 h-4" />}
                    </button>

                    <div>
                      <p className="text-white font-medium">{assunto.nome}</p>
                      <p className="text-slate-500 text-xs">{assunto.descricao}</p>
                      {assunto.subassuntos.length > 0 && (
                        <p className="text-slate-500 text-xs mt-1">
                          Subassuntos: {assunto.subassuntos.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={criarSelecionados}
                disabled={criando || sugestoesAssuntos.filter(a => a.selecionado).length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {criando ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Criar Assuntos Selecionados
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
