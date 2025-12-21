'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useQuestoesIA, ConfigGeracaoQuestoes } from '@/hooks/useQuestoesIA'
import { useCheckLimit } from '@/hooks/useCheckLimit'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (quantidade: number) => void
}

interface ItemComPeso {
  nome: string
  peso: number
  disciplina?: string
  assunto?: string
}

interface Disciplina {
  id: string
  nome: string
}

interface Assunto {
  id: string
  nome: string
  disciplina_id: string
  disciplina_nome?: string
}

interface Subassunto {
  id: string
  nome: string
  assunto_id: string
  assunto_nome?: string
  disciplina_nome?: string
}

interface Banca {
  id: string
  nome: string
}

export function GeradorQuestoesModal({ isOpen, onClose, onSuccess }: Props) {
  const { gerarQuestoes, gerando } = useQuestoesIA()
  const { checkLimit } = useCheckLimit()

  // Estados do formulário
  const [step, setStep] = useState<'config' | 'gerando' | 'sucesso'>('config')
  const [quantidade, setQuantidade] = useState(10)
  const [modalidade, setModalidade] = useState<'multipla_escolha' | 'certo_errado' | 'mista'>('multipla_escolha')
  const [dificuldades, setDificuldades] = useState<string[]>(['media'])

  // Seleções hierárquicas
  const [disciplinasSelecionadas, setDisciplinasSelecionadas] = useState<ItemComPeso[]>([])
  const [assuntosSelecionados, setAssuntosSelecionados] = useState<ItemComPeso[]>([])
  const [subassuntosSelecionados, setSubassuntosSelecionados] = useState<ItemComPeso[]>([])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])

  // Dados do banco
  const [todasDisciplinas, setTodasDisciplinas] = useState<Disciplina[]>([])
  const [todosAssuntos, setTodosAssuntos] = useState<Assunto[]>([])
  const [todosSubassuntos, setTodosSubassuntos] = useState<Subassunto[]>([])
  const [todasBancas, setTodasBancas] = useState<Banca[]>([])

  // Inputs de busca/adição
  const [inputDisciplina, setInputDisciplina] = useState('')
  const [inputAssunto, setInputAssunto] = useState('')
  const [inputSubassunto, setInputSubassunto] = useState('')
  const [inputBanca, setInputBanca] = useState('')

  // Limite info
  const [limitInfo, setLimitInfo] = useState<{ usado: number; limite: number; restante: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados do banco
  useEffect(() => {
    if (!isOpen) return

    const carregarDados = async () => {
      try {
        const [discRes, assRes, subRes, bancRes] = await Promise.all([
          supabase.from('disciplinas').select('id, nome').order('nome'),
          supabase.from('assuntos').select('id, nome, disciplina_id, disciplinas(nome)').order('nome'),
          supabase.from('subassuntos').select('id, nome, assunto_id, assuntos(nome, disciplinas(nome))').order('nome'),
          supabase.from('bancas').select('id, nome').order('nome')
        ])

        setTodasDisciplinas(discRes.data || [])
        setTodosAssuntos((assRes.data || []).map(a => ({
          ...a,
          disciplina_nome: (a.disciplinas as { nome?: string } | null)?.nome
        })))
        setTodosSubassuntos((subRes.data || []).map(s => ({
          ...s,
          assunto_nome: (s.assuntos as { nome?: string; disciplinas?: { nome?: string } } | null)?.nome,
          disciplina_nome: (s.assuntos as { nome?: string; disciplinas?: { nome?: string } } | null)?.disciplinas?.nome
        })))
        setTodasBancas(bancRes.data || [])
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      }
    }

    carregarDados()
  }, [isOpen])

  // Verificar limite ao abrir
  useEffect(() => {
    if (!isOpen) return

    const verificarLimite = async () => {
      const result = await checkLimit('questoes_ia', 1)
      if (!result.isIlimitado) {
        setLimitInfo({
          usado: result.usado,
          limite: result.limite,
          restante: result.restante
        })
      } else {
        setLimitInfo(null)
      }
    }

    verificarLimite()
  }, [isOpen, checkLimit])

  // Resetar ao abrir
  useEffect(() => {
    if (isOpen) {
      setStep('config')
      setError(null)
    }
  }, [isOpen])

  // Filtrar disciplinas baseado no input
  const disciplinasFiltradas = todasDisciplinas.filter(d =>
    d.nome.toLowerCase().includes(inputDisciplina.toLowerCase()) &&
    !disciplinasSelecionadas.some(sel => sel.nome.toLowerCase() === d.nome.toLowerCase())
  ).slice(0, 5)

  // Filtrar assuntos baseado nas disciplinas selecionadas e input
  const assuntosFiltrados = todosAssuntos.filter(a => {
    const matchInput = a.nome.toLowerCase().includes(inputAssunto.toLowerCase())
    const matchDisciplina = disciplinasSelecionadas.length === 0 ||
      disciplinasSelecionadas.some(d => d.nome.toLowerCase() === a.disciplina_nome?.toLowerCase())
    const naoSelecionado = !assuntosSelecionados.some(sel => sel.nome.toLowerCase() === a.nome.toLowerCase())
    return matchInput && matchDisciplina && naoSelecionado
  }).slice(0, 5)

  // Filtrar subassuntos baseado nos assuntos selecionados e input
  const subassuntosFiltrados = todosSubassuntos.filter(s => {
    const matchInput = s.nome.toLowerCase().includes(inputSubassunto.toLowerCase())
    const matchAssunto = assuntosSelecionados.length === 0 ||
      assuntosSelecionados.some(a => a.nome.toLowerCase() === s.assunto_nome?.toLowerCase())
    const naoSelecionado = !subassuntosSelecionados.some(sel => sel.nome.toLowerCase() === s.nome.toLowerCase())
    return matchInput && matchAssunto && naoSelecionado
  }).slice(0, 5)

  // Filtrar bancas baseado no input
  const bancasFiltradas = todasBancas.filter(b =>
    b.nome.toLowerCase().includes(inputBanca.toLowerCase()) &&
    !bancasSelecionadas.includes(b.nome)
  ).slice(0, 5)

  // Adicionar disciplina
  const adicionarDisciplina = (nome: string) => {
    if (!nome.trim()) return
    const normalizado = nome.trim()
    if (disciplinasSelecionadas.some(d => d.nome.toLowerCase() === normalizado.toLowerCase())) return
    setDisciplinasSelecionadas(prev => [...prev, { nome: normalizado, peso: 1 }])
    setInputDisciplina('')
  }

  // Adicionar assunto
  const adicionarAssunto = (nome: string, disciplina?: string) => {
    if (!nome.trim()) return
    const normalizado = nome.trim()
    if (assuntosSelecionados.some(a => a.nome.toLowerCase() === normalizado.toLowerCase())) return

    // Se não tem disciplina, usar a primeira selecionada ou deixar vazio
    const disc = disciplina || (disciplinasSelecionadas.length > 0 ? disciplinasSelecionadas[0].nome : '')
    setAssuntosSelecionados(prev => [...prev, { nome: normalizado, peso: 1, disciplina: disc }])
    setInputAssunto('')
  }

  // Adicionar subassunto
  const adicionarSubassunto = (nome: string, assunto?: string, disciplina?: string) => {
    if (!nome.trim()) return
    const normalizado = nome.trim()
    if (subassuntosSelecionados.some(s => s.nome.toLowerCase() === normalizado.toLowerCase())) return

    const ass = assunto || (assuntosSelecionados.length > 0 ? assuntosSelecionados[0].nome : '')
    const disc = disciplina || (disciplinasSelecionadas.length > 0 ? disciplinasSelecionadas[0].nome : '')
    setSubassuntosSelecionados(prev => [...prev, { nome: normalizado, peso: 1, assunto: ass, disciplina: disc }])
    setInputSubassunto('')
  }

  // Adicionar banca
  const adicionarBanca = (nome: string) => {
    if (!nome.trim()) return
    const normalizado = nome.trim()
    if (bancasSelecionadas.includes(normalizado)) return
    setBancasSelecionadas(prev => [...prev, normalizado])
    setInputBanca('')
  }

  // Remover itens
  const removerDisciplina = (nome: string) => {
    setDisciplinasSelecionadas(prev => prev.filter(d => d.nome !== nome))
  }

  const removerAssunto = (nome: string) => {
    setAssuntosSelecionados(prev => prev.filter(a => a.nome !== nome))
  }

  const removerSubassunto = (nome: string) => {
    setSubassuntosSelecionados(prev => prev.filter(s => s.nome !== nome))
  }

  const removerBanca = (nome: string) => {
    setBancasSelecionadas(prev => prev.filter(b => b !== nome))
  }

  // Toggle dificuldade
  const toggleDificuldade = (dif: string) => {
    setDificuldades(prev =>
      prev.includes(dif) ? prev.filter(d => d !== dif) : [...prev, dif]
    )
  }

  // Gerar questões
  const handleGerar = async () => {
    if (disciplinasSelecionadas.length === 0) {
      setError('Selecione pelo menos uma disciplina')
      return
    }

    if (dificuldades.length === 0) {
      setError('Selecione pelo menos uma dificuldade')
      return
    }

    if (bancasSelecionadas.length === 0) {
      setError('Selecione pelo menos uma banca')
      return
    }

    // Verificar limite
    const limitResult = await checkLimit('questoes_ia', 1)
    if (!limitResult.canUse && !limitResult.isIlimitado) {
      setError(limitResult.mensagem)
      return
    }

    setError(null)
    setStep('gerando')

    const config: ConfigGeracaoQuestoes = {
      disciplinas: disciplinasSelecionadas,
      assuntos: assuntosSelecionados.map(a => ({
        nome: a.nome,
        disciplina: a.disciplina || disciplinasSelecionadas[0]?.nome || '',
        peso: a.peso
      })),
      subassuntos: subassuntosSelecionados.map(s => ({
        nome: s.nome,
        assunto: s.assunto || assuntosSelecionados[0]?.nome || '',
        disciplina: s.disciplina || disciplinasSelecionadas[0]?.nome || '',
        peso: s.peso
      })),
      bancas: bancasSelecionadas,
      dificuldades,
      modalidade,
      quantidade
    }

    const result = await gerarQuestoes(config)

    if (result) {
      setStep('sucesso')
      onSuccess?.(result.length)
    } else {
      setStep('config')
      setError('Erro ao gerar questões. Tente novamente.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1C252E] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1C252E]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#137fec]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#137fec]">quiz</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerador de Questões</h2>
              <p className="text-xs text-[#9dabb9]">Configure e gere questões personalizadas com IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] text-[#9dabb9] hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {step === 'config' && (
            <div className="flex flex-col gap-6">
              {/* Limite info */}
              {limitInfo && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="material-symbols-outlined text-amber-500">info</span>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Você usou {limitInfo.usado} de {limitInfo.limite} gerações hoje. Restam {limitInfo.restante}.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <span className="material-symbols-outlined text-red-500">error</span>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Disciplinas */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  Disciplinas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputDisciplina}
                    onChange={(e) => setInputDisciplina(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputDisciplina.trim()) {
                        e.preventDefault()
                        adicionarDisciplina(inputDisciplina)
                      }
                    }}
                    placeholder="Digite ou selecione uma disciplina..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                  />
                  {inputDisciplina && disciplinasFiltradas.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {disciplinasFiltradas.map(d => (
                        <button
                          key={d.id}
                          onClick={() => adicionarDisciplina(d.nome)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]"
                        >
                          {d.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {disciplinasSelecionadas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {disciplinasSelecionadas.map(d => (
                      <span
                        key={d.nome}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#137fec]/20 text-[#137fec] text-sm"
                      >
                        {d.nome}
                        <button onClick={() => removerDisciplina(d.nome)} className="hover:text-red-500">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Assuntos */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Assuntos <span className="text-xs text-[#9dabb9]">(opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputAssunto}
                    onChange={(e) => setInputAssunto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputAssunto.trim()) {
                        e.preventDefault()
                        adicionarAssunto(inputAssunto)
                      }
                    }}
                    placeholder="Digite ou selecione um assunto..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                  />
                  {inputAssunto && assuntosFiltrados.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {assuntosFiltrados.map(a => (
                        <button
                          key={a.id}
                          onClick={() => adicionarAssunto(a.nome, a.disciplina_nome)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]"
                        >
                          {a.nome} <span className="text-xs text-[#9dabb9]">({a.disciplina_nome})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {assuntosSelecionados.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {assuntosSelecionados.map(a => (
                      <span
                        key={a.nome}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm"
                      >
                        {a.nome}
                        <button onClick={() => removerAssunto(a.nome)} className="hover:text-red-500">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Subassuntos */}
              {assuntosSelecionados.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Subassuntos <span className="text-xs text-[#9dabb9]">(opcional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputSubassunto}
                      onChange={(e) => setInputSubassunto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inputSubassunto.trim()) {
                          e.preventDefault()
                          adicionarSubassunto(inputSubassunto)
                        }
                      }}
                      placeholder="Digite ou selecione um subassunto..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                    />
                    {inputSubassunto && subassuntosFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                        {subassuntosFiltrados.map(s => (
                          <button
                            key={s.id}
                            onClick={() => adicionarSubassunto(s.nome, s.assunto_nome, s.disciplina_nome)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]"
                          >
                            {s.nome} <span className="text-xs text-[#9dabb9]">({s.assunto_nome})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {subassuntosSelecionados.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {subassuntosSelecionados.map(s => (
                        <span
                          key={s.nome}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm"
                        >
                          {s.nome}
                          <button onClick={() => removerSubassunto(s.nome)} className="hover:text-red-500">
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bancas */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  Bancas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inputBanca}
                    onChange={(e) => setInputBanca(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputBanca.trim()) {
                        e.preventDefault()
                        adicionarBanca(inputBanca)
                      }
                    }}
                    placeholder="Digite ou selecione uma banca..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                  />
                  {inputBanca && bancasFiltradas.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {bancasFiltradas.map(b => (
                        <button
                          key={b.id}
                          onClick={() => adicionarBanca(b.nome)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]"
                        >
                          {b.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {bancasSelecionadas.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {bancasSelecionadas.map(b => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm"
                      >
                        {b}
                        <button onClick={() => removerBanca(b)} className="hover:text-red-500">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Dificuldade */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  Dificuldade <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'facil', label: 'Fácil', color: 'emerald' },
                    { id: 'media', label: 'Média', color: 'amber' },
                    { id: 'dificil', label: 'Difícil', color: 'red' }
                  ].map(dif => (
                    <button
                      key={dif.id}
                      onClick={() => toggleDificuldade(dif.id)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        dificuldades.includes(dif.id)
                          ? dif.color === 'emerald'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                            : dif.color === 'amber'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'border-gray-200 dark:border-[#283039] text-[#9dabb9] hover:border-gray-400'
                      }`}
                    >
                      {dif.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modalidade */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Modalidade</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'multipla_escolha', label: 'Múltipla Escolha' },
                    { id: 'certo_errado', label: 'Certo/Errado' },
                    { id: 'mista', label: 'Mista' }
                  ].map(mod => (
                    <button
                      key={mod.id}
                      onClick={() => setModalidade(mod.id as typeof modalidade)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        modalidade === mod.id
                          ? 'bg-[#137fec]/20 border-[#137fec] text-[#137fec]'
                          : 'border-gray-200 dark:border-[#283039] text-[#9dabb9] hover:border-gray-400'
                      }`}
                    >
                      {mod.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantidade */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Quantidade de Questões: <span className="text-[#137fec]">{quantidade}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-[#283039] rounded-lg appearance-none cursor-pointer accent-[#137fec]"
                />
                <div className="flex justify-between text-xs text-[#9dabb9]">
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              {/* Botão Gerar */}
              <button
                onClick={handleGerar}
                disabled={gerando || disciplinasSelecionadas.length === 0 || bancasSelecionadas.length === 0 || dificuldades.length === 0}
                className="w-full py-3 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg shadow-lg shadow-[#137fec]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                Gerar {quantidade} Questões
              </button>
            </div>
          )}

          {step === 'gerando' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="size-16 rounded-full bg-[#137fec]/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-[#137fec] animate-spin">progress_activity</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Gerando questões...</h3>
              <p className="text-sm text-[#9dabb9] text-center max-w-sm">
                A IA está criando {quantidade} questões personalizadas. Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {step === 'sucesso' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="size-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-emerald-400">check_circle</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Questões geradas!</h3>
              <p className="text-sm text-[#9dabb9] text-center max-w-sm">
                {quantidade} questões foram criadas com sucesso e adicionadas ao seu banco de questões.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setStep('config')}
                  className="px-4 py-2 border border-gray-200 dark:border-[#283039] text-gray-900 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] transition-colors"
                >
                  Gerar mais
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-[#137fec] text-white font-bold rounded-lg hover:bg-[#137fec]/90 transition-colors"
                >
                  Ver questões
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
