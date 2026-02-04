'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Save,
  X,
  Layers,
  FileText
} from 'lucide-react'

interface Disciplina {
  id: string
  nome: string
  descricao?: string
  ativo?: boolean
  assuntos_count?: number
}

interface Assunto {
  id: string
  nome: string
  disciplina_id: string
  ativo?: boolean
  subassuntos_count?: number
}

interface SubAssunto {
  id: string
  nome: string
  assunto_id: string
  ordem?: number
  ativo?: boolean
}

export default function AdminDisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [assuntos, setAssuntos] = useState<Record<string, Assunto[]>>({})
  const [subAssuntos, setSubAssuntos] = useState<Record<string, SubAssunto[]>>({})
  const [loading, setLoading] = useState(true)
  const [expandedDisciplinas, setExpandedDisciplinas] = useState<Set<string>>(new Set())
  const [expandedAssuntos, setExpandedAssuntos] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState('')

  // Estados de edição
  const [editando, setEditando] = useState<{ tipo: 'disciplina' | 'assunto' | 'subassunto', id: string } | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [adicionando, setAdicionando] = useState<{ tipo: 'disciplina' | 'assunto' | 'subassunto', parentId?: string } | null>(null)

  useEffect(() => {
    loadDisciplinas()
  }, [])

  async function loadDisciplinas() {
    try {
      const { data: disciplinasData, error } = await supabase
        .from('disciplinas_med')
        .select('*')
        .order('nome')

      if (error) {
        console.error('Erro ao carregar disciplinas:', error)
        setDisciplinas([])
      } else {
        // Contar assuntos por disciplina
        const disciplinasComContagem = await Promise.all(
          (disciplinasData || []).map(async (d) => {
            try {
              const { count } = await supabase
                .from('assuntos_med')
                .select('*', { count: 'exact', head: true })
                .eq('disciplina_id', d.id)

              return { ...d, assuntos_count: count || 0 }
            } catch {
              return { ...d, assuntos_count: 0 }
            }
          })
        )

        setDisciplinas(disciplinasComContagem)
      }
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error)
      setDisciplinas([])
    } finally {
      setLoading(false)
    }
  }

  async function loadAssuntos(disciplinaId: string) {
    if (assuntos[disciplinaId]) return

        const { data } = await supabase
      .from('assuntos_med')
      .select('*')
      .eq('disciplina_id', disciplinaId)
      .order('nome')

    if (data) {
      // Contar subassuntos
      const assuntosComContagem = await Promise.all(
        data.map(async (a: { id: string; nome: string; disciplina_id: string; ativo?: boolean }) => {
          const { count } = await supabase
            .from('subassuntos_med')
            .select('*', { count: 'exact', head: true })
            .eq('assunto_id', a.id)

          return { ...a, subassuntos_count: count || 0 }
        })
      )

      setAssuntos(prev => ({ ...prev, [disciplinaId]: assuntosComContagem }))
    }
  }

  async function loadSubAssuntos(assuntoId: string) {
    if (subAssuntos[assuntoId]) return

        const { data } = await supabase
      .from('subassuntos_med')
      .select('*')
      .eq('assunto_id', assuntoId)
      .order('ordem', { ascending: true })

    if (data) {
      setSubAssuntos(prev => ({ ...prev, [assuntoId]: data }))
    }
  }

  async function toggleDisciplina(id: string) {
    const newSet = new Set(expandedDisciplinas)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
      await loadAssuntos(id)
    }
    setExpandedDisciplinas(newSet)
  }

  async function toggleAssunto(id: string) {
    const newSet = new Set(expandedAssuntos)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
      await loadSubAssuntos(id)
    }
    setExpandedAssuntos(newSet)
  }

  async function salvarEdicao() {
    if (!editando || !novoNome.trim()) return

        const tabela = editando.tipo === 'disciplina' ? 'disciplinas_med' :
      editando.tipo === 'assunto' ? 'assuntos_med' : 'subassuntos_med'

    const { error } = await supabase
      .from(tabela)
      .update({ nome: novoNome.trim() })
      .eq('id', editando.id)

    if (!error) {
      if (editando.tipo === 'disciplina') {
        setDisciplinas(prev => prev.map(d =>
          d.id === editando.id ? { ...d, nome: novoNome.trim() } : d
        ))
      } else if (editando.tipo === 'assunto') {
        const disciplinaId = Object.keys(assuntos).find(dId =>
          assuntos[dId]?.some(a => a.id === editando.id)
        )
        if (disciplinaId) {
          setAssuntos(prev => ({
            ...prev,
            [disciplinaId]: prev[disciplinaId].map(a =>
              a.id === editando.id ? { ...a, nome: novoNome.trim() } : a
            )
          }))
        }
      } else {
        const assuntoId = Object.keys(subAssuntos).find(aId =>
          subAssuntos[aId]?.some(s => s.id === editando.id)
        )
        if (assuntoId) {
          setSubAssuntos(prev => ({
            ...prev,
            [assuntoId]: prev[assuntoId].map(s =>
              s.id === editando.id ? { ...s, nome: novoNome.trim() } : s
            )
          }))
        }
      }
    }

    setEditando(null)
    setNovoNome('')
  }

  async function adicionar() {
    if (!adicionando || !novoNome.trim()) return

    
    if (adicionando.tipo === 'disciplina') {
      const { data, error } = await supabase
        .from('disciplinas_med')
        .insert({ nome: novoNome.trim() })
        .select()
        .single()

      if (!error && data) {
        setDisciplinas(prev => [...prev, { ...data, assuntos_count: 0 }].sort((a, b) => a.nome.localeCompare(b.nome)))
      }
    } else if (adicionando.tipo === 'assunto' && adicionando.parentId) {
      const { data, error } = await supabase
        .from('assuntos_med')
        .insert({ nome: novoNome.trim(), disciplina_id: adicionando.parentId })
        .select()
        .single()

      if (!error && data) {
        setAssuntos(prev => ({
          ...prev,
          [adicionando.parentId!]: [...(prev[adicionando.parentId!] || []), { ...data, subassuntos_count: 0 }]
            .sort((a, b) => a.nome.localeCompare(b.nome))
        }))
        setDisciplinas(prev => prev.map(d =>
          d.id === adicionando.parentId ? { ...d, assuntos_count: (d.assuntos_count || 0) + 1 } : d
        ))
      }
    } else if (adicionando.tipo === 'subassunto' && adicionando.parentId) {
      const { data, error } = await supabase
        .from('subassuntos_med')
        .insert({ nome: novoNome.trim(), assunto_id: adicionando.parentId })
        .select()
        .single()

      if (!error && data) {
        setSubAssuntos(prev => ({
          ...prev,
          [adicionando.parentId!]: [...(prev[adicionando.parentId!] || []), data]
        }))
      }
    }

    setAdicionando(null)
    setNovoNome('')
  }

  async function deletar(tipo: 'disciplina' | 'assunto' | 'subassunto', id: string) {
    const mensagem = tipo === 'disciplina'
      ? 'Tem certeza que deseja excluir esta disciplina? Todos os assuntos e subassuntos relacionados serão perdidos.'
      : tipo === 'assunto'
        ? 'Tem certeza que deseja excluir este assunto? Todos os subassuntos relacionados serão perdidos.'
        : 'Tem certeza que deseja excluir este subassunto?'

    if (!confirm(mensagem)) return

        const tabela = tipo === 'disciplina' ? 'disciplinas_med' :
      tipo === 'assunto' ? 'assuntos_med' : 'subassuntos_med'

    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq('id', id)

    if (!error) {
      if (tipo === 'disciplina') {
        setDisciplinas(prev => prev.filter(d => d.id !== id))
        const newAssuntos = { ...assuntos }
        delete newAssuntos[id]
        setAssuntos(newAssuntos)
      } else if (tipo === 'assunto') {
        const disciplinaId = Object.keys(assuntos).find(dId =>
          assuntos[dId]?.some(a => a.id === id)
        )
        if (disciplinaId) {
          setAssuntos(prev => ({
            ...prev,
            [disciplinaId]: prev[disciplinaId].filter(a => a.id !== id)
          }))
          setDisciplinas(prev => prev.map(d =>
            d.id === disciplinaId ? { ...d, assuntos_count: (d.assuntos_count || 1) - 1 } : d
          ))
        }
        const newSubAssuntos = { ...subAssuntos }
        delete newSubAssuntos[id]
        setSubAssuntos(newSubAssuntos)
      } else {
        const assuntoId = Object.keys(subAssuntos).find(aId =>
          subAssuntos[aId]?.some(s => s.id === id)
        )
        if (assuntoId) {
          setSubAssuntos(prev => ({
            ...prev,
            [assuntoId]: prev[assuntoId].filter(s => s.id !== id)
          }))
        }
      }
    }
  }

  const disciplinasFiltradas = busca
    ? disciplinas.filter(d => d.nome.toLowerCase().includes(busca.toLowerCase()))
    : disciplinas

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-400" />
            Gerenciar Disciplinas
          </h1>
          <p className="text-slate-600 mt-1">
            {disciplinas.length} disciplinas cadastradas
          </p>
        </div>
        <button
          onClick={() => {
            setAdicionando({ tipo: 'disciplina' })
            setNovoNome('')
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium rounded-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Disciplina
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar disciplinas..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Modal de adição */}
      {adicionando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {adicionando.tipo === 'disciplina' ? 'Nova Disciplina' :
                adicionando.tipo === 'assunto' ? 'Novo Assunto' : 'Novo Subassunto'}
            </h3>
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome..."
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') adicionar()
                if (e.key === 'Escape') setAdicionando(null)
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setAdicionando(null)}
                className="flex-1 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={adicionar}
                disabled={!novoNome.trim()}
                className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Disciplinas */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {disciplinasFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-slate-600">Nenhuma disciplina encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {disciplinasFiltradas.map((disciplina) => (
              <div key={disciplina.id}>
                {/* Disciplina */}
                <div
                  className="flex items-center gap-3 p-4 hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => toggleDisciplina(disciplina.id)}
                >
                  <button className="text-slate-600 hover:text-white">
                    {expandedDisciplinas.has(disciplina.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>

                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-400" />
                  </div>

                  <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                    {editando?.tipo === 'disciplina' && editando.id === disciplina.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          className="flex-1 px-2 py-1 bg-slate-100 border border-slate-300 rounded text-white focus:outline-none focus:border-purple-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao()
                            if (e.key === 'Escape') setEditando(null)
                          }}
                        />
                        <button onClick={salvarEdicao} className="text-green-400 hover:text-green-300">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditando(null)} className="text-slate-600 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-white font-medium">{disciplina.nome}</span>
                    )}
                  </div>

                  <span className="text-slate-500 text-sm">
                    {disciplina.assuntos_count} assuntos
                  </span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setAdicionando({ tipo: 'assunto', parentId: disciplina.id })
                        setNovoNome('')
                        if (!expandedDisciplinas.has(disciplina.id)) {
                          toggleDisciplina(disciplina.id)
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-green-400 transition-colors"
                      title="Adicionar assunto"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditando({ tipo: 'disciplina', id: disciplina.id })
                        setNovoNome(disciplina.nome)
                      }}
                      className="p-2 text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletar('disciplina', disciplina.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assuntos */}
                {expandedDisciplinas.has(disciplina.id) && assuntos[disciplina.id] && (
                  <div className="bg-white/[0.02] border-l-2 border-purple-500/30 ml-6">
                    {assuntos[disciplina.id].map((assunto) => (
                      <div key={assunto.id}>
                        <div
                          className="flex items-center gap-3 p-3 pl-6 hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => toggleAssunto(assunto.id)}
                        >
                          <button className="text-slate-600 hover:text-white">
                            {(assunto.subassuntos_count || 0) > 0 && (
                              expandedAssuntos.has(assunto.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )
                            )}
                            {(assunto.subassuntos_count || 0) === 0 && (
                              <div className="w-4" />
                            )}
                          </button>

                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-blue-400" />
                          </div>

                          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                            {editando?.tipo === 'assunto' && editando.id === assunto.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={novoNome}
                                  onChange={(e) => setNovoNome(e.target.value)}
                                  className="flex-1 px-2 py-1 bg-slate-100 border border-slate-300 rounded text-white focus:outline-none focus:border-blue-500 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') salvarEdicao()
                                    if (e.key === 'Escape') setEditando(null)
                                  }}
                                />
                                <button onClick={salvarEdicao} className="text-green-400 hover:text-green-300">
                                  <Save className="w-4 h-4" />
                                </button>
                                <button onClick={() => setEditando(null)} className="text-slate-600 hover:text-white">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-700 text-sm">{assunto.nome}</span>
                            )}
                          </div>

                          {(assunto.subassuntos_count || 0) > 0 && (
                            <span className="text-slate-400 text-xs">
                              {assunto.subassuntos_count} sub
                            </span>
                          )}

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setAdicionando({ tipo: 'subassunto', parentId: assunto.id })
                                setNovoNome('')
                                if (!expandedAssuntos.has(assunto.id)) {
                                  toggleAssunto(assunto.id)
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-green-400 transition-colors"
                              title="Adicionar subassunto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditando({ tipo: 'assunto', id: assunto.id })
                                setNovoNome(assunto.nome)
                              }}
                              className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deletar('assunto', assunto.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Subassuntos */}
                        {expandedAssuntos.has(assunto.id) && subAssuntos[assunto.id] && (
                          <div className="bg-white/[0.02] border-l-2 border-blue-500/30 ml-12">
                            {subAssuntos[assunto.id].map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center gap-3 p-2.5 pl-6 hover:bg-slate-100 transition-colors"
                              >
                                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                                  <FileText className="w-3 h-3 text-emerald-400" />
                                </div>

                                <div className="flex-1">
                                  {editando?.tipo === 'subassunto' && editando.id === sub.id ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={novoNome}
                                        onChange={(e) => setNovoNome(e.target.value)}
                                        className="flex-1 px-2 py-1 bg-slate-100 border border-slate-300 rounded text-white focus:outline-none focus:border-emerald-500 text-xs"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') salvarEdicao()
                                          if (e.key === 'Escape') setEditando(null)
                                        }}
                                      />
                                      <button onClick={salvarEdicao} className="text-green-400 hover:text-green-300">
                                        <Save className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={() => setEditando(null)} className="text-slate-600 hover:text-white">
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600 text-xs">{sub.nome}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditando({ tipo: 'subassunto', id: sub.id })
                                      setNovoNome(sub.nome)
                                    }}
                                    className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
                                    title="Editar"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deletar('subassunto', sub.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
