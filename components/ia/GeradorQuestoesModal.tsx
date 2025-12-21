'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { ConfigGeracaoQuestoes } from '@/hooks/useQuestoesIA'
import { useCheckLimit } from '@/hooks/useCheckLimit'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { GerenciarConteudoModal } from './GerenciarConteudoModal'

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
  isCustom?: boolean
}

interface Assunto {
  id: string
  nome: string
  disciplina_id: string
  disciplina_nome?: string
  isCustom?: boolean
}

interface Subassunto {
  id: string
  nome: string
  assunto_id: string
  assunto_nome?: string
  disciplina_nome?: string
  isCustom?: boolean
}

interface Banca {
  id: string
  nome: string
  nome_normalizado?: string
}

// Função para normalizar texto (remove acentos e lowercase)
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
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
  onCreateCustom: (tipo: 'disciplina' | 'assunto' | 'subassunto', nome: string, disciplina?: string, assunto?: string) => void
  onOpenGerenciamento: () => void
}

function ConteudoHierarquico({
  disciplinas,
  assuntos,
  subassuntos,
  selecionados,
  onToggle,
  onCreateCustom,
  onOpenGerenciamento
}: ConteudoHierarquicoProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedDisciplinas, setExpandedDisciplinas] = useState<string[]>([])
  const [expandedAssuntos, setExpandedAssuntos] = useState<string[]>([])
  const [busca, setBusca] = useState('')
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [createType, setCreateType] = useState<'disciplina' | 'assunto' | 'subassunto' | null>(null)
  const [createDisciplina, setCreateDisciplina] = useState('')
  const [createAssunto, setCreateAssunto] = useState('')
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

            {/* Barra de criação de item customizado */}
            {showCreateMenu && (
              <div className="p-3 border-b border-gray-100 dark:border-[#283039] bg-[#137fec]/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#137fec] text-sm">add_circle</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Criar novo item</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateMenu(false)
                      setCreateType(null)
                      setCreateDisciplina('')
                      setCreateAssunto('')
                    }}
                    className="ml-auto text-[#9dabb9] hover:text-red-500"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                {/* Seleção de tipo */}
                <div className="flex gap-2 mb-2">
                  {(['disciplina', 'assunto', 'subassunto'] as const).map(tipo => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setCreateType(tipo)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        createType === tipo
                          ? tipo === 'disciplina'
                            ? 'bg-[#137fec] text-white'
                            : tipo === 'assunto'
                            ? 'bg-purple-500 text-white'
                            : 'bg-emerald-500 text-white'
                          : 'bg-gray-200 dark:bg-[#283039] text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Campos baseados no tipo */}
                {createType === 'assunto' && (
                  <select
                    value={createDisciplina}
                    onChange={(e) => setCreateDisciplina(e.target.value)}
                    className="w-full mb-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#141A21] text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione a disciplina...</option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.nome}>{d.nome}</option>
                    ))}
                  </select>
                )}

                {createType === 'subassunto' && (
                  <>
                    <select
                      value={createDisciplina}
                      onChange={(e) => {
                        setCreateDisciplina(e.target.value)
                        setCreateAssunto('')
                      }}
                      className="w-full mb-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#141A21] text-gray-900 dark:text-white"
                    >
                      <option value="">Selecione a disciplina...</option>
                      {disciplinas.map(d => (
                        <option key={d.id} value={d.nome}>{d.nome}</option>
                      ))}
                    </select>
                    {createDisciplina && (
                      <select
                        value={createAssunto}
                        onChange={(e) => setCreateAssunto(e.target.value)}
                        className="w-full mb-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#141A21] text-gray-900 dark:text-white"
                      >
                        <option value="">Selecione o assunto...</option>
                        {assuntos.filter(a => a.disciplina_nome === createDisciplina).map(a => (
                          <option key={a.id} value={a.nome}>{a.nome}</option>
                        ))}
                      </select>
                    )}
                  </>
                )}

                {/* Botão criar */}
                {createType && busca.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      if (createType === 'disciplina') {
                        onCreateCustom('disciplina', busca.trim())
                      } else if (createType === 'assunto' && createDisciplina) {
                        onCreateCustom('assunto', busca.trim(), createDisciplina)
                      } else if (createType === 'subassunto' && createDisciplina && createAssunto) {
                        onCreateCustom('subassunto', busca.trim(), createDisciplina, createAssunto)
                      }
                      setShowCreateMenu(false)
                      setCreateType(null)
                      setCreateDisciplina('')
                      setCreateAssunto('')
                      setBusca('')
                    }}
                    disabled={
                      (createType === 'assunto' && !createDisciplina) ||
                      (createType === 'subassunto' && (!createDisciplina || !createAssunto))
                    }
                    className="w-full px-3 py-2 text-sm bg-[#137fec] text-white rounded-lg hover:bg-[#137fec]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Criar &quot;{busca.trim()}&quot;
                  </button>
                )}
              </div>
            )}

            {/* Botão para abrir menu de criação */}
            {!showCreateMenu && (
              <div className="px-3 py-2 border-b border-gray-100 dark:border-[#283039] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCreateMenu(true)}
                  className="flex items-center gap-2 text-xs text-[#137fec] hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  Criar item personalizado
                </button>
                <button
                  type="button"
                  onClick={onOpenGerenciamento}
                  className="flex items-center gap-2 text-xs text-[#9dabb9] hover:text-[#137fec] transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">settings</span>
                  Gerenciar
                </button>
              </div>
            )}

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
                    <div className="p-4 text-center">
                      <p className="text-[#9dabb9] text-sm mb-3">
                        Nenhum resultado encontrado para &quot;{busca}&quot;
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateType('disciplina')
                          setShowCreateMenu(true)
                        }}
                        className="px-3 py-1.5 text-xs bg-[#137fec]/20 text-[#137fec] rounded-lg hover:bg-[#137fec]/30 transition-colors"
                      >
                        + Criar &quot;{busca}&quot; como disciplina
                      </button>
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
  const { checkLimit } = useCheckLimit()
  const { user } = useAuth()
  const { startQuestoesGeneration, hasActiveGeneration } = useNotifications()

  // Estados do formulário
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

  // Bancas customizadas do usuário
  const [bancasCustomizadas, setBancasCustomizadas] = useState<string[]>([])

  // Inputs de busca/adição
  const [inputBanca, setInputBanca] = useState('')
  const [showBancaDropdown, setShowBancaDropdown] = useState(false)
  const bancaInputRef = useRef<HTMLDivElement>(null)

  // Limite info
  const [limitInfo, setLimitInfo] = useState<{ usado: number; limite: number; restante: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Modal de gerenciamento
  const [showGerenciamento, setShowGerenciamento] = useState(false)

  // Fechar dropdown de banca ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (bancaInputRef.current && !bancaInputRef.current.contains(event.target as Node)) {
        setShowBancaDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        // Carregar dados das tabelas principais
        const [discRes, assRes, subRes, bancRes] = await Promise.all([
          supabase.from('disciplinas').select('id, nome').order('nome'),
          supabase.from('assuntos').select('id, nome, disciplina_id, disciplinas(nome)').order('nome'),
          supabase.from('subassuntos').select('id, nome, assunto_id, assuntos(nome, disciplinas(nome))').order('nome'),
          supabase.from('bancas').select('id, nome, nome_normalizado').order('nome')
        ])

        let disciplinasCombinadas: Disciplina[] = (discRes.data || [])
        let assuntosCombinados: Assunto[] = (assRes.data || []).map(a => ({
          ...a,
          disciplina_nome: (a.disciplinas as { nome?: string } | null)?.nome
        }))
        let subassuntosCombinados: Subassunto[] = (subRes.data || []).map(s => ({
          ...s,
          assunto_nome: (s.assuntos as { nome?: string; disciplinas?: { nome?: string } } | null)?.nome,
          disciplina_nome: (s.assuntos as { nome?: string; disciplinas?: { nome?: string } } | null)?.disciplinas?.nome
        }))

        // Carregar itens customizados do usuário
        if (user) {
          const { data: customData } = await supabase
            .from('conteudo_customizado')
            .select('*')
            .eq('user_id', user.id)

          if (customData) {
            // Adicionar disciplinas customizadas
            const discsCustom = customData
              .filter(c => c.tipo === 'disciplina')
              .map(c => ({ id: `custom-${c.id}`, nome: c.nome, isCustom: true }))
            disciplinasCombinadas = [...disciplinasCombinadas, ...discsCustom]

            // Adicionar assuntos customizados
            const assuntosCustom = customData
              .filter(c => c.tipo === 'assunto')
              .map(c => ({
                id: `custom-${c.id}`,
                nome: c.nome,
                disciplina_id: '',
                disciplina_nome: c.disciplina || undefined,
                isCustom: true
              }))
            assuntosCombinados = [...assuntosCombinados, ...assuntosCustom]

            // Adicionar subassuntos customizados
            const subassuntosCustom = customData
              .filter(c => c.tipo === 'subassunto')
              .map(c => ({
                id: `custom-${c.id}`,
                nome: c.nome,
                assunto_id: '',
                assunto_nome: c.assunto || undefined,
                disciplina_nome: c.disciplina || undefined,
                isCustom: true
              }))
            subassuntosCombinados = [...subassuntosCombinados, ...subassuntosCustom]

            // Carregar bancas customizadas
            const bancasCustom = customData
              .filter(c => c.tipo === 'banca')
              .map(c => c.nome)
            setBancasCustomizadas(bancasCustom)
          }
        }

        setTodasDisciplinas(disciplinasCombinadas)
        setTodosAssuntos(assuntosCombinados)
        setTodosSubassuntos(subassuntosCombinados)
        setTodasBancas(bancRes.data || [])
      } catch (err) {
        console.error('Erro ao carregar dados:', err)
      }
    }

    carregarDados()
  }, [isOpen, user])

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

  // Resetar erro ao abrir
  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  // Filtrar bancas baseado no input (incluindo customizadas)
  const inputNormalizado = normalizar(inputBanca)
  const bancasFiltradas = [
    // Bancas do sistema
    ...todasBancas.filter(b =>
      normalizar(b.nome).includes(inputNormalizado) &&
      !bancasSelecionadas.some(sel => normalizar(sel) === normalizar(b.nome))
    ),
    // Bancas customizadas do usuário
    ...bancasCustomizadas
      .filter(b =>
        normalizar(b).includes(inputNormalizado) &&
        !bancasSelecionadas.some(sel => normalizar(sel) === normalizar(b)) &&
        !todasBancas.some(tb => normalizar(tb.nome) === normalizar(b))
      )
      .map(nome => ({ id: `custom-${nome}`, nome, nome_normalizado: normalizar(nome) }))
  ].slice(0, 8)

  // Verificar se a banca digitada já existe (case-insensitive)
  const bancaExistente = [...todasBancas, ...bancasCustomizadas.map(b => ({ nome: b }))]
    .find(b => normalizar(b.nome) === inputNormalizado)

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

  // Criar item customizado
  const criarItemCustomizado = async (
    tipo: 'disciplina' | 'assunto' | 'subassunto',
    nome: string,
    disciplina?: string,
    assunto?: string
  ) => {
    if (!user || !nome.trim()) return

    const nomeNorm = normalizar(nome)

    try {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('conteudo_customizado')
        .select('id')
        .eq('user_id', user.id)
        .eq('tipo', tipo)
        .eq('nome_normalizado', nomeNorm)
        .eq('disciplina_normalizada', disciplina ? normalizar(disciplina) : '')
        .eq('assunto_normalizado', assunto ? normalizar(assunto) : '')
        .single()

      if (existente) {
        // Já existe, apenas selecionar
        toggleConteudo({
          tipo,
          nome: nome.trim(),
          disciplina,
          assunto
        })
        return
      }

      // Criar novo
      await supabase.from('conteudo_customizado').insert({
        user_id: user.id,
        tipo,
        nome: nome.trim(),
        nome_normalizado: nomeNorm,
        disciplina: disciplina || null,
        disciplina_normalizada: disciplina ? normalizar(disciplina) : null,
        assunto: assunto || null,
        assunto_normalizado: assunto ? normalizar(assunto) : null
      })

      // Adicionar localmente e selecionar
      if (tipo === 'disciplina') {
        const newDisc = { id: `temp-${Date.now()}`, nome: nome.trim(), isCustom: true }
        setTodasDisciplinas(prev => [...prev, newDisc])
      } else if (tipo === 'assunto') {
        const newAss = {
          id: `temp-${Date.now()}`,
          nome: nome.trim(),
          disciplina_id: '',
          disciplina_nome: disciplina,
          isCustom: true
        }
        setTodosAssuntos(prev => [...prev, newAss])
      } else if (tipo === 'subassunto') {
        const newSub = {
          id: `temp-${Date.now()}`,
          nome: nome.trim(),
          assunto_id: '',
          assunto_nome: assunto,
          disciplina_nome: disciplina,
          isCustom: true
        }
        setTodosSubassuntos(prev => [...prev, newSub])
      }

      // Selecionar automaticamente
      toggleConteudo({
        tipo,
        nome: nome.trim(),
        disciplina,
        assunto
      })
    } catch (err) {
      console.error('Erro ao criar item customizado:', err)
    }
  }

  // Adicionar banca (com padronização)
  const adicionarBanca = async (nome: string) => {
    if (!nome.trim()) return
    const nomeInput = nome.trim()
    const nomeNorm = normalizar(nomeInput)

    // Verificar se já está selecionada (case-insensitive)
    if (bancasSelecionadas.some(b => normalizar(b) === nomeNorm)) return

    // Verificar se existe no sistema
    const bancaSistema = todasBancas.find(b => normalizar(b.nome) === nomeNorm)
    if (bancaSistema) {
      // Usar o nome padronizado do sistema
      setBancasSelecionadas(prev => [...prev, bancaSistema.nome])
      setInputBanca('')
      setShowBancaDropdown(false)
      return
    }

    // Verificar se existe nas customizadas
    const bancaCustom = bancasCustomizadas.find(b => normalizar(b) === nomeNorm)
    if (bancaCustom) {
      setBancasSelecionadas(prev => [...prev, bancaCustom])
      setInputBanca('')
      setShowBancaDropdown(false)
      return
    }

    // Nova banca customizada - salvar no banco
    if (user) {
      try {
        await supabase.from('conteudo_customizado').insert({
          user_id: user.id,
          tipo: 'banca',
          nome: nomeInput,
          nome_normalizado: nomeNorm,
          disciplina: null,
          disciplina_normalizada: null,
          assunto: null,
          assunto_normalizado: null
        })
        setBancasCustomizadas(prev => [...prev, nomeInput])
      } catch (err) {
        console.error('Erro ao salvar banca customizada:', err)
      }
    }

    setBancasSelecionadas(prev => [...prev, nomeInput])
    setInputBanca('')
    setShowBancaDropdown(false)
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

    // LÓGICA DE CASCATA: Expandir seleções para incluir todos os filhos
    // Se selecionou disciplina → incluir todos os assuntos e subassuntos dessa disciplina
    // Se selecionou assunto → incluir todos os subassuntos desse assunto

    // 1. Coletar disciplinas selecionadas
    const discsSelecionadas = disciplinasSelecionadas.map(d => d.nome)

    // 2. Expandir assuntos: incluir os selecionados manualmente + todos das disciplinas selecionadas
    const assuntosExpandidos = new Map<string, { nome: string; disciplina: string; peso: number }>()

    // Adicionar assuntos selecionados manualmente
    assuntosSelecionados.forEach(a => {
      assuntosExpandidos.set(`${a.disciplina}::${a.nome}`, {
        nome: a.nome,
        disciplina: a.disciplina || '',
        peso: a.peso
      })
    })

    // Se uma disciplina foi selecionada, adicionar TODOS os seus assuntos
    discsSelecionadas.forEach(discNome => {
      todosAssuntos
        .filter(a => a.disciplina_nome === discNome)
        .forEach(a => {
          const key = `${a.disciplina_nome}::${a.nome}`
          if (!assuntosExpandidos.has(key)) {
            assuntosExpandidos.set(key, {
              nome: a.nome,
              disciplina: a.disciplina_nome || '',
              peso: 1
            })
          }
        })
    })

    // 3. Expandir subassuntos: incluir os selecionados manualmente + todos das disciplinas e assuntos selecionados
    const subassuntosExpandidos = new Map<string, { nome: string; assunto: string; disciplina: string; peso: number }>()

    // Adicionar subassuntos selecionados manualmente
    subassuntosSelecionados.forEach(s => {
      subassuntosExpandidos.set(`${s.disciplina}::${s.assunto}::${s.nome}`, {
        nome: s.nome,
        assunto: s.assunto || '',
        disciplina: s.disciplina || '',
        peso: s.peso
      })
    })

    // Se uma disciplina foi selecionada, adicionar TODOS os subassuntos dessa disciplina
    discsSelecionadas.forEach(discNome => {
      todosSubassuntos
        .filter(s => s.disciplina_nome === discNome)
        .forEach(s => {
          const key = `${s.disciplina_nome}::${s.assunto_nome}::${s.nome}`
          if (!subassuntosExpandidos.has(key)) {
            subassuntosExpandidos.set(key, {
              nome: s.nome,
              assunto: s.assunto_nome || '',
              disciplina: s.disciplina_nome || '',
              peso: 1
            })
          }
        })
    })

    // Se um assunto foi selecionado (sem a disciplina pai), adicionar TODOS os subassuntos desse assunto
    assuntosSelecionados.forEach(a => {
      // Verificar se a disciplina do assunto NÃO está selecionada (para não duplicar)
      if (!discsSelecionadas.includes(a.disciplina || '')) {
        todosSubassuntos
          .filter(s => s.assunto_nome === a.nome && s.disciplina_nome === a.disciplina)
          .forEach(s => {
            const key = `${s.disciplina_nome}::${s.assunto_nome}::${s.nome}`
            if (!subassuntosExpandidos.has(key)) {
              subassuntosExpandidos.set(key, {
                nome: s.nome,
                assunto: s.assunto_nome || '',
                disciplina: s.disciplina_nome || '',
                peso: 1
              })
            }
          })
      }
    })

    const config: ConfigGeracaoQuestoes = {
      disciplinas: disciplinasSelecionadas,
      assuntos: Array.from(assuntosExpandidos.values()),
      subassuntos: Array.from(subassuntosExpandidos.values()),
      bancas: bancasSelecionadas,
      dificuldades,
      modalidade,
      quantidade
    }

    // Fechar modal e iniciar geração em background
    onClose()

    // Iniciar geração em background (não bloqueante)
    startQuestoesGeneration({
      user_id: user!.id,
      ...config
    }).then((result) => {
      if (result.status === 'completed') {
        onSuccess?.(result.result?.questoes || quantidade)
      }
    })
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
                onCreateCustom={criarItemCustomizado}
                onOpenGerenciamento={() => setShowGerenciamento(true)}
              />

              {/* Bancas */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                  Bancas <span className="text-red-500">*</span>
                  <span className="text-xs text-[#9dabb9] font-normal ml-1">(Digite para buscar ou criar)</span>
                </label>
                <div className="relative" ref={bancaInputRef}>
                  <input
                    type="text"
                    value={inputBanca}
                    onChange={(e) => {
                      setInputBanca(e.target.value)
                      setShowBancaDropdown(true)
                    }}
                    onFocus={() => setShowBancaDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && inputBanca.trim()) {
                        e.preventDefault()
                        adicionarBanca(inputBanca)
                      }
                    }}
                    placeholder="Digite ou selecione uma banca..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21] text-gray-900 dark:text-white placeholder:text-[#9dabb9] focus:ring-2 focus:ring-[#137fec] focus:border-transparent"
                  />
                  {showBancaDropdown && (inputBanca || bancasFiltradas.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C252E] border border-gray-200 dark:border-[#283039] rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {/* Bancas encontradas */}
                      {bancasFiltradas.map(b => (
                        <button
                          key={b.id}
                          onClick={() => adicionarBanca(b.nome)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#283039] flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-amber-500 text-sm">gavel</span>
                          {b.nome}
                          {bancasCustomizadas.includes(b.nome) && (
                            <span className="ml-auto text-xs text-[#9dabb9]">(sua)</span>
                          )}
                        </button>
                      ))}

                      {/* Opção de criar nova banca */}
                      {inputBanca.trim() && !bancaExistente && (
                        <button
                          onClick={() => adicionarBanca(inputBanca)}
                          className="w-full px-4 py-2 text-left text-sm text-[#137fec] hover:bg-[#137fec]/10 flex items-center gap-2 border-t border-gray-100 dark:border-[#283039]"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Criar &quot;{inputBanca.trim()}&quot;
                        </button>
                      )}

                      {/* Indicação de banca existente com nome diferente */}
                      {inputBanca.trim() && bancaExistente && normalizar(bancaExistente.nome) === inputNormalizado && bancaExistente.nome !== inputBanca.trim() && (
                        <div className="px-4 py-2 text-xs text-[#9dabb9] border-t border-gray-100 dark:border-[#283039]">
                          Será adicionada como &quot;{bancaExistente.nome}&quot; (padronizado)
                        </div>
                      )}
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
                        <span className="material-symbols-outlined text-xs">gavel</span>
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
                disabled={hasActiveGeneration || conteudoSelecionado.length === 0 || bancasSelecionadas.length === 0 || dificuldades.length === 0}
                className="w-full py-3 bg-[#137fec] hover:bg-[#137fec]/90 text-white font-bold rounded-lg shadow-lg shadow-[#137fec]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                {hasActiveGeneration ? 'Geração em andamento...' : `Gerar ${quantidade} Questões`}
              </button>
          </div>
        </div>
      </div>

      {/* Modal de Gerenciamento */}
      <GerenciarConteudoModal
        isOpen={showGerenciamento}
        onClose={() => setShowGerenciamento(false)}
        onUpdate={async () => {
          // Recarregar dados após edição/exclusão
          if (!user) return
          try {
            const { data: customData } = await supabase
              .from('conteudo_customizado')
              .select('*')
              .eq('user_id', user.id)

            if (customData) {
              // Reconstruir disciplinas customizadas
              const discsCustom = customData
                .filter(c => c.tipo === 'disciplina')
                .map(c => ({ id: `custom-${c.id}`, nome: c.nome, isCustom: true }))

              // Reconstruir assuntos customizados
              const assuntosCustom = customData
                .filter(c => c.tipo === 'assunto')
                .map(c => ({
                  id: `custom-${c.id}`,
                  nome: c.nome,
                  disciplina_id: '',
                  disciplina_nome: c.disciplina || undefined,
                  isCustom: true
                }))

              // Reconstruir subassuntos customizados
              const subassuntosCustom = customData
                .filter(c => c.tipo === 'subassunto')
                .map(c => ({
                  id: `custom-${c.id}`,
                  nome: c.nome,
                  assunto_id: '',
                  assunto_nome: c.assunto || undefined,
                  disciplina_nome: c.disciplina || undefined,
                  isCustom: true
                }))

              // Atualizar bancas customizadas
              const bancasCustom = customData
                .filter(c => c.tipo === 'banca')
                .map(c => c.nome)
              setBancasCustomizadas(bancasCustom)

              // Recarregar do banco para manter items do sistema
              const [discRes, assRes, subRes] = await Promise.all([
                supabase.from('disciplinas').select('id, nome').order('nome'),
                supabase.from('assuntos').select('id, nome, disciplina_id, disciplinas(nome)').order('nome'),
                supabase.from('subassuntos').select('id, nome, assunto_id, assuntos(nome, disciplinas(nome))').order('nome')
              ])

              setTodasDisciplinas([...(discRes.data || []), ...discsCustom])
              setTodosAssuntos([
                ...(assRes.data || []).map(a => ({
                  ...a,
                  disciplina_nome: (a.disciplinas as { nome?: string } | null)?.nome
                })),
                ...assuntosCustom
              ])
              setTodosSubassuntos([
                ...(subRes.data || []).map(s => ({
                  ...s,
                  assunto_nome: (s.assuntos as { nome?: string; disciplinas?: { nome?: string } } | null)?.nome,
                  disciplina_nome: (s.assuntos as { nome?: string; disciplinas?: { nome?: string } } | null)?.disciplinas?.nome
                })),
                ...subassuntosCustom
              ])
            }
          } catch (err) {
            console.error('Erro ao recarregar dados:', err)
          }
        }}
      />
    </div>
  )
}
