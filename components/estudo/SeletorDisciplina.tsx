'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Disciplina {
  id: string
  nome: string
}

interface Assunto {
  id: string
  nome: string
  disciplina_id: string
}

interface Subassunto {
  id: string
  nome: string
  assunto_id: string
}

interface SeletorDisciplinaProps {
  onSelecao: (selecao: {
    disciplina_id?: string
    disciplina_nome?: string
    assunto_id?: string
    assunto_nome?: string
    subassunto_id?: string
    subassunto_nome?: string
  }) => void
  valorInicial?: {
    disciplina_id?: string
    assunto_id?: string
    subassunto_id?: string
  }
  mostrarSubassunto?: boolean
  required?: boolean
  className?: string
  disabled?: boolean
  permitirAdicionar?: boolean
}

export function SeletorDisciplina({
  onSelecao,
  valorInicial,
  mostrarSubassunto = true,
  required = false,
  className = '',
  disabled = false,
  permitirAdicionar = true
}: SeletorDisciplinaProps) {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [assuntos, setAssuntos] = useState<Assunto[]>([])
  const [subassuntos, setSubassuntos] = useState<Subassunto[]>([])

  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string>(valorInicial?.disciplina_id || '')
  const [assuntoSelecionado, setAssuntoSelecionado] = useState<string>(valorInicial?.assunto_id || '')
  const [subassuntoSelecionado, setSubassuntoSelecionado] = useState<string>(valorInicial?.subassunto_id || '')

  const [loadingDisciplinas, setLoadingDisciplinas] = useState(true)
  const [loadingAssuntos, setLoadingAssuntos] = useState(false)
  const [loadingSubassuntos, setLoadingSubassuntos] = useState(false)

  // Estados para adicionar novo
  const [showAdicionarDisciplina, setShowAdicionarDisciplina] = useState(false)
  const [showAdicionarAssunto, setShowAdicionarAssunto] = useState(false)
  const [showAdicionarSubassunto, setShowAdicionarSubassunto] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Carregar disciplinas
  const carregarDisciplinas = useCallback(async () => {
    setLoadingDisciplinas(true)
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('id, nome')
        .order('nome')

      if (!error && data) {
        setDisciplinas(data)
      }
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error)
    } finally {
      setLoadingDisciplinas(false)
    }
  }, [])

  useEffect(() => {
    carregarDisciplinas()
  }, [carregarDisciplinas])

  // Carregar assuntos quando disciplina mudar
  useEffect(() => {
    if (!disciplinaSelecionada) {
      setAssuntos([])
      setAssuntoSelecionado('')
      setSubassuntos([])
      setSubassuntoSelecionado('')
      return
    }

    const carregarAssuntos = async () => {
      setLoadingAssuntos(true)
      try {
        const { data, error } = await supabase
          .from('assuntos')
          .select('id, nome, disciplina_id')
          .eq('disciplina_id', disciplinaSelecionada)
          .order('nome')

        if (!error && data) {
          setAssuntos(data)
        }
      } catch (error) {
        console.error('Erro ao carregar assuntos:', error)
      } finally {
        setLoadingAssuntos(false)
      }
    }

    carregarAssuntos()
  }, [disciplinaSelecionada])

  // Carregar subassuntos quando assunto mudar
  useEffect(() => {
    if (!assuntoSelecionado || !mostrarSubassunto) {
      setSubassuntos([])
      setSubassuntoSelecionado('')
      return
    }

    const carregarSubassuntos = async () => {
      setLoadingSubassuntos(true)
      try {
        const { data, error } = await supabase
          .from('subassuntos')
          .select('id, nome, assunto_id')
          .eq('assunto_id', assuntoSelecionado)
          .order('nome')

        if (!error && data) {
          setSubassuntos(data)
        }
      } catch (error) {
        console.error('Erro ao carregar subassuntos:', error)
      } finally {
        setLoadingSubassuntos(false)
      }
    }

    carregarSubassuntos()
  }, [assuntoSelecionado, mostrarSubassunto])

  // Notificar seleção
  const notificarSelecao = useCallback(() => {
    const disciplina = disciplinas.find(d => d.id === disciplinaSelecionada)
    const assunto = assuntos.find(a => a.id === assuntoSelecionado)
    const subassunto = subassuntos.find(s => s.id === subassuntoSelecionado)

    onSelecao({
      disciplina_id: disciplinaSelecionada || undefined,
      disciplina_nome: disciplina?.nome,
      assunto_id: assuntoSelecionado || undefined,
      assunto_nome: assunto?.nome,
      subassunto_id: subassuntoSelecionado || undefined,
      subassunto_nome: subassunto?.nome
    })
  }, [disciplinaSelecionada, assuntoSelecionado, subassuntoSelecionado, disciplinas, assuntos, subassuntos, onSelecao])

  useEffect(() => {
    notificarSelecao()
  }, [notificarSelecao])

  const handleDisciplinaChange = (id: string) => {
    setDisciplinaSelecionada(id)
    setAssuntoSelecionado('')
    setSubassuntoSelecionado('')
  }

  const handleAssuntoChange = (id: string) => {
    setAssuntoSelecionado(id)
    setSubassuntoSelecionado('')
  }

  // Adicionar nova disciplina
  const adicionarDisciplina = async () => {
    if (!novoNome.trim()) return
    setSalvando(true)
    setErro('')

    try {
      const response = await fetch('/api/estudos/disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'disciplina', nome: novoNome.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data.existente) {
          // Já existe, selecionar
          setDisciplinaSelecionada(data.existente.id)
        } else {
          setErro(data.error || 'Erro ao criar disciplina')
          return
        }
      } else {
        // Criou nova, adicionar à lista e selecionar
        setDisciplinas(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
        setDisciplinaSelecionada(data.id)
      }

      setNovoNome('')
      setShowAdicionarDisciplina(false)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setSalvando(false)
    }
  }

  // Adicionar novo assunto
  const adicionarAssunto = async () => {
    if (!novoNome.trim() || !disciplinaSelecionada) return
    setSalvando(true)
    setErro('')

    try {
      const response = await fetch('/api/estudos/disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'assunto',
          nome: novoNome.trim(),
          disciplina_id: disciplinaSelecionada
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data.existente) {
          setAssuntoSelecionado(data.existente.id)
        } else {
          setErro(data.error || 'Erro ao criar assunto')
          return
        }
      } else {
        setAssuntos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
        setAssuntoSelecionado(data.id)
      }

      setNovoNome('')
      setShowAdicionarAssunto(false)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setSalvando(false)
    }
  }

  // Adicionar novo subassunto
  const adicionarSubassunto = async () => {
    if (!novoNome.trim() || !assuntoSelecionado) return
    setSalvando(true)
    setErro('')

    try {
      const response = await fetch('/api/estudos/disciplinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'subassunto',
          nome: novoNome.trim(),
          assunto_id: assuntoSelecionado
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409 && data.existente) {
          setSubassuntoSelecionado(data.existente.id)
        } else {
          setErro(data.error || 'Erro ao criar subassunto')
          return
        }
      } else {
        setSubassuntos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
        setSubassuntoSelecionado(data.id)
      }

      setNovoNome('')
      setShowAdicionarSubassunto(false)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setSalvando(false)
    }
  }

  const fecharFormAdicionar = () => {
    setShowAdicionarDisciplina(false)
    setShowAdicionarAssunto(false)
    setShowAdicionarSubassunto(false)
    setNovoNome('')
    setErro('')
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Disciplina */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Disciplina {required && <span className="text-red-500">*</span>}
          </label>
          {permitirAdicionar && !showAdicionarDisciplina && (
            <button
              type="button"
              onClick={() => { fecharFormAdicionar(); setShowAdicionarDisciplina(true) }}
              className="text-xs text-primary hover:text-blue-600 font-medium flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nova
            </button>
          )}
        </div>

        {showAdicionarDisciplina ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome da disciplina"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && adicionarDisciplina()}
            />
            <button
              type="button"
              onClick={adicionarDisciplina}
              disabled={salvando || !novoNome.trim()}
              className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
            >
              {salvando ? '...' : 'OK'}
            </button>
            <button
              type="button"
              onClick={fecharFormAdicionar}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ) : (
          <div className="relative">
            <select
              value={disciplinaSelecionada}
              onChange={(e) => handleDisciplinaChange(e.target.value)}
              disabled={disabled || loadingDisciplinas}
              required={required}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm appearance-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              <option value="">Selecione uma disciplina</option>
              {disciplinas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nome}
                </option>
              ))}
            </select>
            {loadingDisciplinas && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined animate-spin text-primary text-lg">progress_activity</span>
              </div>
            )}
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              expand_more
            </span>
          </div>
        )}
      </div>

      {/* Assunto */}
      {disciplinaSelecionada && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Assunto
            </label>
            {permitirAdicionar && !showAdicionarAssunto && (
              <button
                type="button"
                onClick={() => { fecharFormAdicionar(); setShowAdicionarAssunto(true) }}
                className="text-xs text-primary hover:text-blue-600 font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Novo
              </button>
            )}
          </div>

          {showAdicionarAssunto ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome do assunto"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && adicionarAssunto()}
              />
              <button
                type="button"
                onClick={adicionarAssunto}
                disabled={salvando || !novoNome.trim()}
                className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {salvando ? '...' : 'OK'}
              </button>
              <button
                type="button"
                onClick={fecharFormAdicionar}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <select
                value={assuntoSelecionado}
                onChange={(e) => handleAssuntoChange(e.target.value)}
                disabled={disabled || loadingAssuntos}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm appearance-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Todos os assuntos</option>
                {assuntos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
              {loadingAssuntos && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined animate-spin text-primary text-lg">progress_activity</span>
                </div>
              )}
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                expand_more
              </span>
            </div>
          )}
        </div>
      )}

      {/* Subassunto */}
      {mostrarSubassunto && assuntoSelecionado && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Subassunto
            </label>
            {permitirAdicionar && !showAdicionarSubassunto && (
              <button
                type="button"
                onClick={() => { fecharFormAdicionar(); setShowAdicionarSubassunto(true) }}
                className="text-xs text-primary hover:text-blue-600 font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Novo
              </button>
            )}
          </div>

          {showAdicionarSubassunto ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Nome do subassunto"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1c2127] text-slate-900 dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && adicionarSubassunto()}
              />
              <button
                type="button"
                onClick={adicionarSubassunto}
                disabled={salvando || !novoNome.trim()}
                className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
              >
                {salvando ? '...' : 'OK'}
              </button>
              <button
                type="button"
                onClick={fecharFormAdicionar}
                className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <select
                value={subassuntoSelecionado}
                onChange={(e) => setSubassuntoSelecionado(e.target.value)}
                disabled={disabled || loadingSubassuntos}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#101922] text-slate-900 dark:text-white text-sm appearance-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Todos os subassuntos</option>
                {subassuntos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              {loadingSubassuntos && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <span className="material-symbols-outlined animate-spin text-primary text-lg">progress_activity</span>
                </div>
              )}
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                expand_more
              </span>
            </div>
          )}
        </div>
      )}

      {/* Erro */}
      {erro && (
        <p className="text-xs text-red-500">{erro}</p>
      )}
    </div>
  )
}
