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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ItemComPeso = ItemComPeso

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

// Item selecionado no dropdown unificado
interface ItemSelecionado {
  tipo: 'disciplina' | 'assunto' | 'subassunto'
  nome: string
  disciplina?: string
  assunto?: string
}

// Dropdown Hierárquico Unificado - Disciplinas → Assuntos → Subassuntos
interface ConteudoHierarquicoProps {
  disciplinas: Disciplina[]
  assuntos: Assunto[]
  subassuntos: Subassunto[]
  selecionados: ItemSelecionado[]
  onToggle: (item: ItemSelecionado) => void
}

function ConteudoHierarquico({
  disciplinas,
  assuntos,
  subassuntos,
  selecionados,
  onToggle
}: ConteudoHierarquicoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedDisciplinas, setExpandedDisciplinas] = useState<string[]>([])
  const [expandedAssuntos, setExpandedAssuntos] = useState<string[]>([])
  const [busca, setBusca] = useState('')
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

  // Agrupar assuntos por disciplina
  const assuntosPorDisciplina = assuntos.reduce((acc, assunto) => {
    const disc = assunto.disciplina_nome || 'Sem disciplina'
    if (!acc[disc]) acc[disc] = []
    acc[disc].push(assunto)
    return acc
  }, {} as Record<string, Assunto[]>)

  // Agrupar subassuntos por disciplina e assunto
  const subassuntosPorAssunto = subassuntos.reduce((acc, sub) => {
    const key = `${sub.disciplina_nome}::${sub.assunto_nome}`
    if (!acc[key]) acc[key] = []
    acc[key].push(sub)
    return acc
  }, {} as Record<string, Subassunto[]>)

  // Filtrar por busca
  const disciplinasFiltradas = disciplinas.filter(d =>
    d.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const assuntosFiltrados = assuntos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.disciplina_nome?.toLowerCase().includes(busca.toLowerCase())
  )

  const subassuntosFiltrados = subassuntos.filter(s =>
    s.nome.toLowerCase().includes(busca.toLowerCase()) ||
    s.assunto_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    s.disciplina_nome?.toLowerCase().includes(busca.toLowerCase())
  )

  // Verificar se item está selecionado
  const isItemSelecionado = (tipo: 'disciplina' | 'assunto' | 'subassunto', nome: string) =>
    selecionados.some(s => s.tipo === tipo && s.nome.toLowerCase() === nome.toLowerCase())

  // Contar itens por tipo
  const contarPorTipo = (tipo: 'disciplina' | 'assunto' | 'subassunto') =>
    selecionados.filter(s => s.tipo === tipo).length

  const toggleDisciplina = (disc: string) => {
    setExpandedDisciplinas(prev =>
      prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]
    )
  }

  const toggleAssunto = (key: string) => {
    setExpandedAssuntos(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    )
  }

  // Contar assuntos de uma disciplina
  const contarAssuntosDisciplina = (discNome: string) => {
    return assuntosPorDisciplina[discNome]?.length || 0
  }

  // Contar subassuntos de um assunto
  const contarSubassuntosAssunto = (discNome: string, assNome: string) => {
    return subassuntosPorAssunto[`${discNome}::${assNome}`]?.length || 0
  }

  // Resumo dos selecionados
  const totalSelecionados = selecionados.length
  const disciplinasSel = contarPorTipo('disciplina')
  const assuntosSel = contarPorTipo('assunto')
  const subassuntosSel = contarPorTipo('subassunto')

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
        Conteúdo <span className="text-red-500">*</span>
        <span className="text-xs text-[#9dabb9] font-normal">(Disciplinas, Assuntos e Subassuntos)</span>
      </label>

      <div className="relative" ref={dropdownRef}>
        {/* Botão do dropdown */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-left flex items-center justify-between hover:border-[#137fec] transition-colors"
        >
          <span className={totalSelecionados > 0 ? 'text-gray-900 dark:text-white' : 'text-[#9dabb9]'}>
            {totalSelecionados > 0
              ? `${totalSelecionados} item(s) selecionado(s)`
              : 'Clique para selecionar disciplinas, assuntos ou subassuntos...'}
          </span>
          <span className={`material-symbols-outlined text-[#9dabb9] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Dropdown aberto */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-xl z-30 max-h-[400px] overflow-hidden flex flex-col">
            {/* Barra de busca */}
            <div className="p-2 border-b border-gray-100 dark:border-[#283039]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9dabb9] text-sm">search</span>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar disciplina, assunto ou subassunto..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-1 focus:ring-[#137fec] focus:border-transparent"
                />
              </div>
            </div>

            {/* Resumo dos selecionados */}
            {totalSelecionados > 0 && (
              <div className="px-3 py-2 bg-gray-50 dark:bg-[#141A21] border-b border-gray-100 dark:border-[#283039] flex items-center gap-2 text-xs flex-wrap">
                <span className="text-[#9dabb9]">Selecionados:</span>
                {disciplinasSel > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#137fec]/20 text-[#137fec]">
                    {disciplinasSel} disciplina(s)
                  </span>
                )}
                {assuntosSel > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                    {assuntosSel} assunto(s)
                  </span>
                )}
                {subassuntosSel > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {subassuntosSel} subassunto(s)
                  </span>
                )}
              </div>
            )}

            {/* Lista hierárquica */}
            <div className="overflow-y-auto flex-1">
              {busca ? (
                // Modo busca - mostrar resultados flat
                <div className="py-1">
                  {/* Disciplinas encontradas */}
                  {disciplinasFiltradas.length > 0 && (
                    <div className="px-3 py-1.5 text-xs text-[#9dabb9] uppercase tracking-wide bg-gray-50 dark:bg-[#141A21]">
                      Disciplinas
                    </div>
                  )}
                  {disciplinasFiltradas.map(d => {
                    const selecionado = isItemSelecionado('disciplina', d.nome)
                    return (
                      <button
                        key={`disc-${d.id}`}
                        type="button"
                        onClick={() => onToggle({ tipo: 'disciplina', nome: d.nome })}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                          selecionado
                            ? 'bg-[#137fec]/10 text-[#137fec]'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-[#137fec]">folder</span>
                          {d.nome}
                        </span>
                        {selecionado && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    )
                  })}

                  {/* Assuntos encontrados */}
                  {assuntosFiltrados.length > 0 && (
                    <div className="px-3 py-1.5 text-xs text-[#9dabb9] uppercase tracking-wide bg-gray-50 dark:bg-[#141A21] mt-1">
                      Assuntos
                    </div>
                  )}
                  {assuntosFiltrados.slice(0, 20).map(a => {
                    const selecionado = isItemSelecionado('assunto', a.nome)
                    return (
                      <button
                        key={`ass-${a.id}`}
                        type="button"
                        onClick={() => onToggle({ tipo: 'assunto', nome: a.nome, disciplina: a.disciplina_nome })}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                          selecionado
                            ? 'bg-purple-500/10 text-purple-400'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-purple-500">topic</span>
                          <span>
                            {a.nome}
                            <span className="text-xs text-[#9dabb9] ml-2">({a.disciplina_nome})</span>
                          </span>
                        </span>
                        {selecionado && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    )
                  })}

                  {/* Subassuntos encontrados */}
                  {subassuntosFiltrados.length > 0 && (
                    <div className="px-3 py-1.5 text-xs text-[#9dabb9] uppercase tracking-wide bg-gray-50 dark:bg-[#141A21] mt-1">
                      Subassuntos
                    </div>
                  )}
                  {subassuntosFiltrados.slice(0, 20).map(s => {
                    const selecionado = isItemSelecionado('subassunto', s.nome)
                    return (
                      <button
                        key={`sub-${s.id}`}
                        type="button"
                        onClick={() => onToggle({ tipo: 'subassunto', nome: s.nome, assunto: s.assunto_nome, disciplina: s.disciplina_nome })}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                          selecionado
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-xs text-emerald-500">subdirectory_arrow_right</span>
                          <span>
                            {s.nome}
                            <span className="text-xs text-[#9dabb9] ml-2">({s.assunto_nome})</span>
                          </span>
                        </span>
                        {selecionado && <span className="material-symbols-outlined text-sm">check</span>}
                      </button>
                    )
                  })}

                  {disciplinasFiltradas.length === 0 && assuntosFiltrados.length === 0 && subassuntosFiltrados.length === 0 && (
                    <div className="p-4 text-center text-[#9dabb9] text-sm">
                      Nenhum resultado encontrado para &quot;{busca}&quot;
                    </div>
                  )}
                </div>
              ) : (
                // Modo hierárquico normal
                disciplinas.sort((a, b) => a.nome.localeCompare(b.nome)).map(disc => {
                  const discSelecionada = isItemSelecionado('disciplina', disc.nome)
                  const assuntosDaDisc = assuntosPorDisciplina[disc.nome] || []

                  return (
                    <div key={disc.id} className="border-b border-gray-100 dark:border-[#283039] last:border-0">
                      {/* Nível 1: Disciplina */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => onToggle({ tipo: 'disciplina', nome: disc.nome })}
                          className={`flex-1 px-4 py-2.5 flex items-center gap-2 transition-colors ${
                            discSelecionada
                              ? 'bg-[#137fec]/10'
                              : 'bg-[#137fec]/5 hover:bg-[#137fec]/10'
                          }`}
                        >
                          <span className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                            discSelecionada
                              ? 'bg-[#137fec] border-[#137fec]'
                              : 'border-gray-300 dark:border-[#283039]'
                          }`}>
                            {discSelecionada && <span className="material-symbols-outlined text-white text-sm">check</span>}
                          </span>
                          <span className={`font-medium text-sm flex items-center gap-2 ${discSelecionada ? 'text-[#137fec]' : 'text-[#137fec]'}`}>
                            <span className="material-symbols-outlined text-base">folder</span>
                            {disc.nome}
                          </span>
                        </button>
                        {assuntosDaDisc.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleDisciplina(disc.nome)}
                            className="px-3 py-2.5 bg-[#137fec]/5 hover:bg-[#137fec]/10 transition-colors"
                          >
                            <span className="text-xs text-[#9dabb9] mr-2">({contarAssuntosDisciplina(disc.nome)})</span>
                            <span className={`material-symbols-outlined text-[#9dabb9] text-sm transition-transform ${expandedDisciplinas.includes(disc.nome) ? 'rotate-180' : ''}`}>
                              expand_more
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Nível 2: Assuntos */}
                      {expandedDisciplinas.includes(disc.nome) && assuntosDaDisc.length > 0 && (
                        <div className="bg-gray-50/50 dark:bg-[#141A21]/50">
                          {assuntosDaDisc.sort((a, b) => a.nome.localeCompare(b.nome)).map(ass => {
                            const assSelecionado = isItemSelecionado('assunto', ass.nome)
                            const assuntoKey = `${disc.nome}::${ass.nome}`
                            const subsDaAss = subassuntosPorAssunto[assuntoKey] || []

                            return (
                              <div key={ass.id}>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => onToggle({ tipo: 'assunto', nome: ass.nome, disciplina: disc.nome })}
                                    className={`flex-1 px-4 pl-8 py-2 flex items-center gap-2 transition-colors ${
                                      assSelecionado
                                        ? 'bg-purple-500/10'
                                        : 'hover:bg-gray-100 dark:hover:bg-[#283039]'
                                    }`}
                                  >
                                    <span className={`size-4 rounded border-2 flex items-center justify-center transition-colors ${
                                      assSelecionado
                                        ? 'bg-purple-500 border-purple-500'
                                        : 'border-gray-300 dark:border-[#283039]'
                                    }`}>
                                      {assSelecionado && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                    </span>
                                    <span className={`text-sm flex items-center gap-2 ${assSelecionado ? 'text-purple-400 font-medium' : 'text-gray-900 dark:text-white'}`}>
                                      <span className="material-symbols-outlined text-base text-purple-500">topic</span>
                                      {ass.nome}
                                    </span>
                                  </button>
                                  {subsDaAss.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleAssunto(assuntoKey)}
                                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#283039] transition-colors"
                                    >
                                      <span className="text-xs text-[#9dabb9] mr-2">({contarSubassuntosAssunto(disc.nome, ass.nome)})</span>
                                      <span className={`material-symbols-outlined text-[#9dabb9] text-sm transition-transform ${expandedAssuntos.includes(assuntoKey) ? 'rotate-180' : ''}`}>
                                        expand_more
                                      </span>
                                    </button>
                                  )}
                                </div>

                                {/* Nível 3: Subassuntos */}
                                {expandedAssuntos.includes(assuntoKey) && subsDaAss.length > 0 && (
                                  <div className="py-1 bg-gray-100/50 dark:bg-[#0D1117]/50">
                                    {subsDaAss.sort((a, b) => a.nome.localeCompare(b.nome)).map(sub => {
                                      const subSelecionado = isItemSelecionado('subassunto', sub.nome)
                                      return (
                                        <button
                                          key={sub.id}
                                          type="button"
                                          onClick={() => onToggle({ tipo: 'subassunto', nome: sub.nome, assunto: ass.nome, disciplina: disc.nome })}
                                          className={`w-full px-4 pl-14 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                                            subSelecionado
                                              ? 'bg-emerald-500/10 text-emerald-400'
                                              : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039]'
                                          }`}
                                        >
                                          <span className={`size-4 rounded border-2 flex items-center justify-center transition-colors ${
                                            subSelecionado
                                              ? 'bg-emerald-500 border-emerald-500'
                                              : 'border-gray-300 dark:border-[#283039]'
                                          }`}>
                                            {subSelecionado && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                          </span>
                                          <span className="material-symbols-outlined text-xs text-emerald-500">subdirectory_arrow_right</span>
                                          {sub.nome}
                                        </button>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tags dos selecionados */}
      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selecionados.map(item => (
            <span
              key={`${item.tipo}-${item.nome}`}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                item.tipo === 'disciplina'
                  ? 'bg-[#137fec]/20 text-[#137fec]'
                  : item.tipo === 'assunto'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <span className="material-symbols-outlined text-xs">
                {item.tipo === 'disciplina' ? 'folder' : item.tipo === 'assunto' ? 'topic' : 'subdirectory_arrow_right'}
              </span>
              {item.nome}
              <button onClick={() => onToggle(item)} className="hover:text-red-500 ml-1">
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

  // Seleção unificada de conteúdo (disciplinas, assuntos, subassuntos)
  const [conteudoSelecionado, setConteudoSelecionado] = useState<ItemSelecionado[]>([])
  const [bancasSelecionadas, setBancasSelecionadas] = useState<string[]>([])

  // Dados do banco
  const [todasDisciplinas, setTodasDisciplinas] = useState<Disciplina[]>([])
  const [todosAssuntos, setTodosAssuntos] = useState<Assunto[]>([])
  const [todosSubassuntos, setTodosSubassuntos] = useState<Subassunto[]>([])
  const [todasBancas, setTodasBancas] = useState<Banca[]>([])

  // Inputs de busca/adição
  const [inputBanca, setInputBanca] = useState('')

  // Limite info
  const [limitInfo, setLimitInfo] = useState<{ usado: number; limite: number; restante: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Extrair disciplinas, assuntos e subassuntos do conteúdo selecionado
  const disciplinasSelecionadas = conteudoSelecionado
    .filter(c => c.tipo === 'disciplina')
    .map(c => ({ nome: c.nome, peso: 1 }))

  const assuntosSelecionados = conteudoSelecionado
    .filter(c => c.tipo === 'assunto')
    .map(c => ({ nome: c.nome, peso: 1, disciplina: c.disciplina }))

  const subassuntosSelecionados = conteudoSelecionado
    .filter(c => c.tipo === 'subassunto')
    .map(c => ({ nome: c.nome, peso: 1, assunto: c.assunto, disciplina: c.disciplina }))

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

  // Filtrar bancas baseado no input
  const bancasFiltradas = todasBancas.filter(b =>
    b.nome.toLowerCase().includes(inputBanca.toLowerCase()) &&
    !bancasSelecionadas.includes(b.nome)
  ).slice(0, 5)

  // Toggle item do conteúdo (adicionar/remover)
  const toggleConteudo = (item: ItemSelecionado) => {
    setConteudoSelecionado(prev => {
      const existe = prev.some(
        c => c.tipo === item.tipo && c.nome.toLowerCase() === item.nome.toLowerCase()
      )
      if (existe) {
        return prev.filter(
          c => !(c.tipo === item.tipo && c.nome.toLowerCase() === item.nome.toLowerCase())
        )
      }
      return [...prev, item]
    })
  }

  // Adicionar banca
  const adicionarBanca = (nome: string) => {
    if (!nome.trim()) return
    const normalizado = nome.trim()
    if (bancasSelecionadas.includes(normalizado)) return
    setBancasSelecionadas(prev => [...prev, normalizado])
    setInputBanca('')
  }

  // Remover banca
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
    if (conteudoSelecionado.length === 0) {
      setError('Selecione pelo menos uma disciplina, assunto ou subassunto')
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

              {/* Conteúdo Hierárquico Unificado */}
              <ConteudoHierarquico
                disciplinas={todasDisciplinas}
                assuntos={todosAssuntos}
                subassuntos={todosSubassuntos}
                selecionados={conteudoSelecionado}
                onToggle={toggleConteudo}
              />

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
                disabled={gerando || conteudoSelecionado.length === 0 || bancasSelecionadas.length === 0 || dificuldades.length === 0}
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
