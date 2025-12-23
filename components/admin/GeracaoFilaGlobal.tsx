'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Email autorizado para ver o componente
const ADMIN_EMAIL = 'brunodivinoa@gmail.com'

interface FilaItem {
  id: string
  status: string
  disciplina: string
  assunto: string | null
  subassunto: string | null
  banca: string
  modalidade: string
  dificuldade: string
  quantidade: number
  geradas: number
  erros: number
}

export default function GeracaoFilaGlobal() {
  const { user } = useAuth()
  const [fila, setFila] = useState<FilaItem[]>([])
  const [processando, setProcessando] = useState(false)
  const [minimizado, setMinimizado] = useState(false)
  const abortRef = useRef(false)
  const processandoRef = useRef(false)

  // Só mostrar para admin
  const isAdmin = user?.email === ADMIN_EMAIL

  // Carregar fila do usuário
  const carregarFila = useCallback(async () => {
    if (!user?.id || !isAdmin) return []

    try {
      const res = await fetch(`/api/admin/geracao-fila?user_id=${user.id}`)
      if (res.ok) {
        const { fila: filaData } = await res.json()
        setFila(filaData || [])
        return filaData || []
      }
    } catch (err) {
      console.error('Erro ao carregar fila:', err)
    }
    return []
  }, [user?.id, isAdmin])

  // Processar próxima questão
  const processarProximaQuestao = useCallback(async () => {
    if (abortRef.current || !user?.id) {
      setProcessando(false)
      processandoRef.current = false
      return
    }

    // Buscar fila atualizada
    const res = await fetch(`/api/admin/geracao-fila?user_id=${user.id}`)
    if (!res.ok) {
      setProcessando(false)
      processandoRef.current = false
      return
    }

    const { fila: filaAtual } = await res.json()
    setFila(filaAtual || [])

    // Encontrar próximo item a processar
    const itemPendente = filaAtual?.find((f: FilaItem) =>
      (f.status === 'pendente' || f.status === 'processando') && f.geradas < f.quantidade
    )

    if (!itemPendente) {
      setProcessando(false)
      processandoRef.current = false
      return
    }

    // Gerar uma questão
    try {
      await fetch('/api/admin/gerar-questao-unica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fila_id: itemPendente.id,
          user_id: user.id
        })
      })
    } catch (err) {
      console.error('Erro ao gerar questão:', err)
    }

    // Continuar processamento após delay
    setTimeout(processarProximaQuestao, 1500)
  }, [user?.id])

  // Iniciar processamento
  const iniciarProcessamento = useCallback(async () => {
    if (processandoRef.current || !user?.id || !isAdmin) return

    const filaAtual = await carregarFila()
    const temPendente = filaAtual?.some((f: FilaItem) =>
      (f.status === 'pendente' || f.status === 'processando') && f.geradas < f.quantidade
    )

    if (temPendente) {
      setProcessando(true)
      processandoRef.current = true
      abortRef.current = false
      processarProximaQuestao()
    }
  }, [user?.id, isAdmin, carregarFila, processarProximaQuestao])

  // Cancelar geração
  const cancelarGeracao = async () => {
    if (!user?.id) return

    abortRef.current = true

    try {
      await fetch(`/api/admin/geracao-fila?user_id=${user.id}`, {
        method: 'DELETE'
      })
      await carregarFila()
    } catch (err) {
      console.error('Erro ao cancelar:', err)
    }
  }

  // Verificar fila ao montar e periodicamente
  useEffect(() => {
    if (!isAdmin) return

    // Verificar imediatamente
    iniciarProcessamento()

    // Verificar periodicamente (caso tenha sido adicionado item novo)
    const interval = setInterval(() => {
      if (!processandoRef.current) {
        iniciarProcessamento()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isAdmin, iniciarProcessamento])

  // Não renderizar se não for admin ou não tiver fila ativa
  if (!isAdmin || fila.length === 0) return null

  // Calcular totais
  const totalGeradas = fila.reduce((acc, f) => acc + f.geradas, 0)
  const totalQuestoes = fila.reduce((acc, f) => acc + f.quantidade, 0)
  const totalErros = fila.reduce((acc, f) => acc + f.erros, 0)
  const progresso = totalQuestoes > 0 ? (totalGeradas / totalQuestoes) * 100 : 0
  const itemAtual = fila.find(f => f.status === 'processando')

  // Versão minimizada
  if (minimizado) {
    return (
      <button
        onClick={() => setMinimizado(false)}
        className="fixed bottom-4 right-4 bg-[#137fec] text-white p-3 rounded-full shadow-xl z-50 flex items-center gap-2"
      >
        <span className="material-symbols-outlined animate-spin text-sm">auto_awesome</span>
        <span className="text-sm font-medium">{totalGeradas}/{totalQuestoes}</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[#1a1f25] border border-[#283039] rounded-lg shadow-xl p-4 min-w-[320px] z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#137fec] animate-spin">auto_awesome</span>
          <span className="text-sm font-medium text-white">Gerando Questões</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimizado(true)}
            className="text-[#9dabb9] hover:text-white p-1 rounded"
            title="Minimizar"
          >
            <span className="material-symbols-outlined text-sm">minimize</span>
          </button>
          <button
            onClick={cancelarGeracao}
            className="text-red-400 hover:text-red-500 text-xs px-2 py-1 rounded hover:bg-red-500/10"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Progresso geral */}
      <div className="w-full bg-[#283039] rounded-full h-2 mb-2">
        <div
          className="bg-[#137fec] h-2 rounded-full transition-all duration-300"
          style={{ width: `${progresso}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-[#9dabb9] mb-2">
        <span>{totalGeradas} / {totalQuestoes} questões</span>
        <span className="flex gap-2">
          <span className="text-green-400">✓ {totalGeradas}</span>
          {totalErros > 0 && <span className="text-red-400">✗ {totalErros}</span>}
        </span>
      </div>

      {/* Item atual */}
      {itemAtual && (
        <div className="text-xs text-[#9dabb9] truncate">
          Atual: {itemAtual.disciplina} {itemAtual.assunto && `/ ${itemAtual.assunto}`}
        </div>
      )}

      {/* Estimativa */}
      <div className="text-xs text-[#9dabb9] mt-1">
        ~{Math.ceil(((totalQuestoes - totalGeradas) * 1.5) / 60)} min restantes
      </div>
    </div>
  )
}
