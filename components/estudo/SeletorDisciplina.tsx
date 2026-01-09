'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Disciplina {
  id: string
  nome: string
  icon?: string
  cor?: string
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
}

export function SeletorDisciplina({
  onSelecao,
  valorInicial,
  mostrarSubassunto = true,
  required = false,
  className = '',
  disabled = false
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

  // Carregar disciplinas
  useEffect(() => {
    const carregarDisciplinas = async () => {
      setLoadingDisciplinas(true)
      try {
        const { data, error } = await supabase
          .from('disciplinas')
          .select('id, nome, icon, cor')
          .order('nome')

        if (!error && data) {
          setDisciplinas(data)
        }
      } catch (error) {
        console.error('Erro ao carregar disciplinas:', error)
      } finally {
        setLoadingDisciplinas(false)
      }
    }

    carregarDisciplinas()
  }, [])

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

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Disciplina */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Disciplina {required && <span className="text-red-500">*</span>}
        </label>
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
      </div>

      {/* Assunto */}
      {disciplinaSelecionada && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Assunto
          </label>
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
        </div>
      )}

      {/* Subassunto */}
      {mostrarSubassunto && assuntoSelecionado && subassuntos.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Subassunto
          </label>
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
        </div>
      )}
    </div>
  )
}
