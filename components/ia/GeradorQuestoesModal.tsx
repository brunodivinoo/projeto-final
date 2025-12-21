'use client'
import { useState, useEffect, useRef } from 'react'
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

// Componente de dropdown hierárquico para assuntos
interface AssuntosHierarquicosProps {
  assuntos: Assunto[]
  disciplinasSelecionadas: ItemComPeso[]
  assuntosSelecionados: ItemComPeso[]
  onSelect: (nome: string, disciplina?: string) => void
  onRemove: (nome: string) => void
}

function AssuntosHierarquicos({
  assuntos,
  disciplinasSelecionadas,
  assuntosSelecionados,
  onSelect,
  onRemove
}: AssuntosHierarquicosProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedDisciplinas, setExpandedDisciplinas] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar assuntos baseado nas disciplinas selecionadas
  const assuntosFiltrados = disciplinasSelecionadas.length > 0
    ? assuntos.filter(a =>
        disciplinasSelecionadas.some(d => d.nome.toLowerCase() === a.disciplina_nome?.toLowerCase())
      )
    : assuntos

  // Agrupar por disciplina
  const assuntosPorDisciplina = assuntosFiltrados.reduce((acc, assunto) => {
    const disc = assunto.disciplina_nome || 'Sem disciplina'
    if (!acc[disc]) acc[disc] = []
    acc[disc].push(assunto)
    return acc
  }, {} as Record<string, Assunto[]>)

  // Ordenar disciplinas alfabeticamente
  const disciplinasOrdenadas = Object.keys(assuntosPorDisciplina).sort()

  const toggleDisciplina = (disc: string) => {
    setExpandedDisciplinas(prev =>
      prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
    )
  }

  const isAssuntoSelecionado = (nome: string) =>
    assuntosSelecionados.some(a => a.nome.toLowerCase() === nome.toLowerCase())

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-900 dark:text-white">
        Assuntos <span className="text-xs text-[#9dabb9]">(opcional)</span>
      </label>

      <div className="relative" ref={dropdownRef}>
        {/* Botão do dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-left flex items-center justify-between hover:border-[#137fec] transition-colors"
        >
          <span className={assuntosSelecionados.length > 0 ? 'text-gray-900 dark:text-white' : 'text-[#9dabb9]'}>
            {assuntosSelecionados.length > 0
              ? `${assuntosSelecionados.length} assunto(s) selecionado(s)`
              : 'Clique para selecionar assuntos...'}
          </span>
          <span className={`material-symbols-outlined text-[#9dabb9] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Dropdown aberto */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-xl z-30 max-h-80 overflow-y-auto">
            {disciplinasOrdenadas.length === 0 ? (
              <div className="p-4 text-center text-[#9dabb9] text-sm">
                {disciplinasSelecionadas.length > 0
                  ? 'Nenhum assunto encontrado para as disciplinas selecionadas'
                  : 'Selecione uma disciplina primeiro'}
              </div>
            ) : (
              disciplinasOrdenadas.map(disc => (
                <div key={disc} className="border-b border-gray-100 dark:border-[#283039] last:border-0">
                  {/* Cabeçalho da disciplina */}
                  <button
                    type="button"
                    onClick={() => toggleDisciplina(disc)}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-gray-50 dark:bg-[#141A21] hover:bg-gray-100 dark:hover:bg-[#283039] transition-colors"
                  >
                    <span className="font-medium text-sm text-[#137fec] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">folder</span>
                      {disc}
                      <span className="text-xs text-[#9dabb9] font-normal">
                        ({assuntosPorDisciplina[disc].length})
                      </span>
                    </span>
                    <span className={`material-symbols-outlined text-[#9dabb9] text-sm transition-transform ${expandedDisciplinas.includes(disc) ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Lista de assuntos */}
                  {expandedDisciplinas.includes(disc) && (
                    <div className="py-1">
                      {assuntosPorDisciplina[disc].sort((a, b) => a.nome.localeCompare(b.nome)).map(assunto => {
                        const selecionado = isAssuntoSelecionado(assunto.nome)
                        return (
                          <button
                            key={assunto.id}
                            type="button"
                            onClick={() => {
                              if (selecionado) {
                                onRemove(assunto.nome)
                              } else {
                                onSelect(assunto.nome, assunto.disciplina_nome)
                              }
                            }}
                            className={`w-full px-4 pl-10 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                              selecionado
                                ? 'bg-purple-500/10 text-purple-400'
                                : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]'
                            }`}
                          >
                            <span>{assunto.nome}</span>
                            {selecionado && (
                              <span className="material-symbols-outlined text-sm text-purple-400">check</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tags dos assuntos selecionados */}
      {assuntosSelecionados.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {assuntosSelecionados.map(a => (
            <span
              key={a.nome}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm"
            >
              {a.nome}
              <button onClick={() => onRemove(a.nome)} className="hover:text-red-500">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de dropdown hierárquico para subassuntos
interface SubassuntosHierarquicosProps {
  subassuntos: Subassunto[]
  assuntosSelecionados: ItemComPeso[]
  subassuntosSelecionados: ItemComPeso[]
  onSelect: (nome: string, assunto?: string, disciplina?: string) => void
  onRemove: (nome: string) => void
}

function SubassuntosHierarquicos({
  subassuntos,
  assuntosSelecionados,
  subassuntosSelecionados,
  onSelect,
  onRemove
}: SubassuntosHierarquicosProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedAssuntos, setExpandedAssuntos] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar subassuntos baseado nos assuntos selecionados
  const subassuntosFiltrados = assuntosSelecionados.length > 0
    ? subassuntos.filter(s =>
        assuntosSelecionados.some(a => a.nome.toLowerCase() === s.assunto_nome?.toLowerCase())
      )
    : subassuntos

  // Agrupar por assunto
  const subassuntosPorAssunto = subassuntosFiltrados.reduce((acc, sub) => {
    const ass = sub.assunto_nome || 'Sem assunto'
    if (!acc[ass]) acc[ass] = []
    acc[ass].push(sub)
    return acc
  }, {} as Record<string, Subassunto[]>)

  // Ordenar assuntos alfabeticamente
  const assuntosOrdenados = Object.keys(subassuntosPorAssunto).sort()

  const toggleAssunto = (ass: string) => {
    setExpandedAssuntos(prev =>
      prev.includes(ass) ? prev.filter(a => a !== ass) : [...prev, ass]
    )
  }

  const isSubassuntoSelecionado = (nome: string) =>
    subassuntosSelecionados.some(s => s.nome.toLowerCase() === nome.toLowerCase())

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-900 dark:text-white">
        Subassuntos <span className="text-xs text-[#9dabb9]">(opcional)</span>
      </label>

      <div className="relative" ref={dropdownRef}>
        {/* Botão do dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-left flex items-center justify-between hover:border-[#137fec] transition-colors"
        >
          <span className={subassuntosSelecionados.length > 0 ? 'text-gray-900 dark:text-white' : 'text-[#9dabb9]'}>
            {subassuntosSelecionados.length > 0
              ? `${subassuntosSelecionados.length} subassunto(s) selecionado(s)`
              : 'Clique para selecionar subassuntos...'}
          </span>
          <span className={`material-symbols-outlined text-[#9dabb9] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Dropdown aberto */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-xl z-30 max-h-80 overflow-y-auto">
            {assuntosOrdenados.length === 0 ? (
              <div className="p-4 text-center text-[#9dabb9] text-sm">
                Nenhum subassunto encontrado para os assuntos selecionados
              </div>
            ) : (
              assuntosOrdenados.map(ass => (
                <div key={ass} className="border-b border-gray-100 dark:border-[#283039] last:border-0">
                  {/* Cabeçalho do assunto */}
                  <button
                    type="button"
                    onClick={() => toggleAssunto(ass)}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-gray-50 dark:bg-[#141A21] hover:bg-gray-100 dark:hover:bg-[#283039] transition-colors"
                  >
                    <span className="font-medium text-sm text-emerald-500 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">topic</span>
                      {ass}
                      <span className="text-xs text-[#9dabb9] font-normal">
                        ({subassuntosPorAssunto[ass].length})
                      </span>
                    </span>
                    <span className={`material-symbols-outlined text-[#9dabb9] text-sm transition-transform ${expandedAssuntos.includes(ass) ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Lista de subassuntos */}
                  {expandedAssuntos.includes(ass) && (
                    <div className="py-1">
                      {subassuntosPorAssunto[ass].sort((a, b) => a.nome.localeCompare(b.nome)).map(sub => {
                        const selecionado = isSubassuntoSelecionado(sub.nome)
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              if (selecionado) {
                                onRemove(sub.nome)
                              } else {
                                onSelect(sub.nome, sub.assunto_nome, sub.disciplina_nome)
                              }
                            }}
                            className={`w-full px-4 pl-10 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                              selecionado
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]'
                            }`}
                          >
                            <span>{sub.nome}</span>
                            {selecionado && (
                              <span className="material-symbols-outlined text-sm text-emerald-400">check</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tags dos subassuntos selecionados */}
      {subassuntosSelecionados.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {subassuntosSelecionados.map(s => (
            <span
              key={s.nome}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm"
            >
              {s.nome}
              <button onClick={() => onRemove(s.nome)} className="hover:text-red-500">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
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
  }

  // Adicionar subassunto
  const adicionarSubassunto = (nome: string, assunto?: string, disciplina?: string) => {
    if (!nome.trim()) return
    const normalizado = nome.trim()
    if (subassuntosSelecionados.some(s => s.nome.toLowerCase() === normalizado.toLowerCase())) return

    const ass = assunto || (assuntosSelecionados.length > 0 ? assuntosSelecionados[0].nome : '')
    const disc = disciplina || (disciplinasSelecionadas.length > 0 ? disciplinasSelecionadas[0].nome : '')
    setSubassuntosSelecionados(prev => [...prev, { nome: normalizado, peso: 1, assunto: ass, disciplina: disc }])
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

              {/* Assuntos - Dropdown Hierárquico */}
              <AssuntosHierarquicos
                assuntos={todosAssuntos}
                disciplinasSelecionadas={disciplinasSelecionadas}
                assuntosSelecionados={assuntosSelecionados}
                onSelect={adicionarAssunto}
                onRemove={removerAssunto}
              />

              {/* Subassuntos - Dropdown Hierárquico */}
              {assuntosSelecionados.length > 0 && (
                <SubassuntosHierarquicos
                  subassuntos={todosSubassuntos}
                  assuntosSelecionados={assuntosSelecionados}
                  subassuntosSelecionados={subassuntosSelecionados}
                  onSelect={adicionarSubassunto}
                  onRemove={removerSubassunto}
                />
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
