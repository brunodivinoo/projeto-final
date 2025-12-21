'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ItemCustomizado {
  id: string
  tipo: 'disciplina' | 'assunto' | 'subassunto' | 'banca'
  nome: string
  nome_normalizado: string
  disciplina: string | null
  assunto: string | null
  created_at: string
  questoes_count: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function GerenciarConteudoModal({ isOpen, onClose, onUpdate }: Props) {
  const { user } = useAuth()
  const [itens, setItens] = useState<ItemCustomizado[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)

  // Estados de edição
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [novoNome, setNovoNome] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Estados de exclusão
  const [confirmandoDelete, setConfirmandoDelete] = useState<string | null>(null)
  const [deletando, setDeletando] = useState(false)

  // Carregar itens
  useEffect(() => {
    if (!isOpen || !user) return

    const carregarItens = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ user_id: user.id })
        if (filtroTipo) params.append('tipo', filtroTipo)

        const response = await fetch(`/api/ia/conteudo-customizado?${params}`)
        if (response.ok) {
          const data = await response.json()
          setItens(data.itens || [])
        }
      } catch (err) {
        console.error('Erro ao carregar itens:', err)
      } finally {
        setLoading(false)
      }
    }

    carregarItens()
  }, [isOpen, user, filtroTipo])

  // Iniciar edição
  const iniciarEdicao = (item: ItemCustomizado) => {
    setEditandoId(item.id)
    setNovoNome(item.nome)
  }

  // Cancelar edição
  const cancelarEdicao = () => {
    setEditandoId(null)
    setNovoNome('')
  }

  // Salvar edição
  const salvarEdicao = async (item: ItemCustomizado) => {
    if (!user || !novoNome.trim()) return

    setSalvando(true)
    try {
      const response = await fetch('/api/ia/conteudo-customizado', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          user_id: user.id,
          novo_nome: novoNome.trim(),
          propagar_questoes: true // Sempre propagar para questões
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Atualizar localmente
        setItens(prev => prev.map(i =>
          i.id === item.id ? { ...i, nome: novoNome.trim() } : i
        ))
        setEditandoId(null)
        setNovoNome('')
        onUpdate?.()

        if (data.questoes_atualizadas > 0) {
          alert(`Nome atualizado! ${data.questoes_atualizadas} questão(ões) foram atualizadas.`)
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao atualizar')
      }
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Erro ao salvar alteração')
    } finally {
      setSalvando(false)
    }
  }

  // Confirmar exclusão
  const confirmarExclusao = async (item: ItemCustomizado, deletarQuestoes: boolean) => {
    if (!user) return

    setDeletando(true)
    try {
      const params = new URLSearchParams({
        item_id: item.id,
        user_id: user.id,
        deletar_questoes: String(deletarQuestoes)
      })

      const response = await fetch(`/api/ia/conteudo-customizado?${params}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        // Remover localmente
        setItens(prev => prev.filter(i => i.id !== item.id))
        setConfirmandoDelete(null)
        onUpdate?.()

        if (data.questoes_deletadas > 0) {
          alert(`Item excluído! ${data.questoes_deletadas} questão(ões) foram excluídas.`)
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir item')
    } finally {
      setDeletando(false)
    }
  }

  // Agrupar itens por tipo
  const itensPorTipo = itens.reduce((acc, item) => {
    if (!acc[item.tipo]) acc[item.tipo] = []
    acc[item.tipo].push(item)
    return acc
  }, {} as Record<string, ItemCustomizado[]>)

  // Cores e labels por tipo
  const tipoConfig = {
    disciplina: { color: 'blue', icon: 'folder', label: 'Disciplinas' },
    assunto: { color: 'purple', icon: 'topic', label: 'Assuntos' },
    subassunto: { color: 'emerald', icon: 'subdirectory_arrow_right', label: 'Subassuntos' },
    banca: { color: 'amber', icon: 'gavel', label: 'Bancas' }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-[#1C252E] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#283039]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-[#137fec]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#137fec]">settings</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerenciar Conteudo</h2>
              <p className="text-xs text-[#9dabb9]">Edite ou exclua seus itens personalizados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#283039] text-[#9dabb9] hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-gray-100 dark:border-[#283039]">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroTipo(null)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                !filtroTipo
                  ? 'bg-[#137fec] text-white'
                  : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-gray-300'
              }`}
            >
              Todos
            </button>
            {Object.entries(tipoConfig).map(([tipo, config]) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                  filtroTipo === tipo
                    ? tipo === 'disciplina' ? 'bg-blue-500 text-white'
                    : tipo === 'assunto' ? 'bg-purple-500 text-white'
                    : tipo === 'subassunto' ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
                    : 'bg-gray-100 dark:bg-[#283039] text-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{config.icon}</span>
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-4xl text-[#137fec] animate-spin">progress_activity</span>
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[#9dabb9] mb-2">folder_off</span>
              <p className="text-[#9dabb9]">Nenhum item personalizado encontrado</p>
              <p className="text-xs text-[#9dabb9] mt-1">
                Crie disciplinas, assuntos ou subassuntos no gerador de questoes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(itensPorTipo).map(([tipo, items]) => {
                const config = tipoConfig[tipo as keyof typeof tipoConfig]
                if (!items.length) return null

                return (
                  <div key={tipo}>
                    <h3 className={`text-sm font-medium mb-2 flex items-center gap-2 ${
                      tipo === 'disciplina' ? 'text-blue-500'
                      : tipo === 'assunto' ? 'text-purple-500'
                      : tipo === 'subassunto' ? 'text-emerald-500'
                      : 'text-amber-500'
                    }`}>
                      <span className="material-symbols-outlined text-base">{config.icon}</span>
                      {config.label} ({items.length})
                    </h3>
                    <div className="space-y-2">
                      {items.map(item => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21]"
                        >
                          {/* Modal de confirmação de exclusão */}
                          {confirmandoDelete === item.id && (
                            <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-sm text-red-400 mb-3">
                                {item.questoes_count > 0 ? (
                                  <>
                                    <strong>Atenção!</strong> Este item tem <strong>{item.questoes_count} questao(oes)</strong> geradas.
                                    O que deseja fazer?
                                  </>
                                ) : (
                                  'Tem certeza que deseja excluir este item?'
                                )}
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {item.questoes_count > 0 && (
                                  <button
                                    onClick={() => confirmarExclusao(item, true)}
                                    disabled={deletando}
                                    className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {deletando && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                                    Excluir item e questoes
                                  </button>
                                )}
                                <button
                                  onClick={() => confirmarExclusao(item, false)}
                                  disabled={deletando}
                                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 ${
                                    item.questoes_count > 0
                                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                                      : 'bg-red-500 text-white hover:bg-red-600'
                                  }`}
                                >
                                  {deletando && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                                  {item.questoes_count > 0 ? 'Apenas excluir item' : 'Confirmar'}
                                </button>
                                <button
                                  onClick={() => setConfirmandoDelete(null)}
                                  disabled={deletando}
                                  className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-[#283039] text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-[#3a4654] transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {/* Icone do tipo */}
                            <span className={`material-symbols-outlined text-base ${
                              tipo === 'disciplina' ? 'text-blue-500'
                              : tipo === 'assunto' ? 'text-purple-500'
                              : tipo === 'subassunto' ? 'text-emerald-500'
                              : 'text-amber-500'
                            }`}>
                              {config.icon}
                            </span>

                            {/* Nome (editável ou não) */}
                            <div className="flex-1">
                              {editandoId === item.id ? (
                                <input
                                  type="text"
                                  value={novoNome}
                                  onChange={(e) => setNovoNome(e.target.value)}
                                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-[#283039] bg-white dark:bg-[#1C252E] text-gray-900 dark:text-white focus:ring-1 focus:ring-[#137fec] focus:border-transparent"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') salvarEdicao(item)
                                    if (e.key === 'Escape') cancelarEdicao()
                                  }}
                                />
                              ) : (
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.nome}</p>
                                  {(item.disciplina || item.assunto) && (
                                    <p className="text-xs text-[#9dabb9]">
                                      {item.disciplina}
                                      {item.assunto && ` > ${item.assunto}`}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Contagem de questões */}
                            {item.questoes_count > 0 && !editandoId && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-[#137fec]/20 text-[#137fec]">
                                {item.questoes_count} questao(oes)
                              </span>
                            )}

                            {/* Botões de ação */}
                            {editandoId === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => salvarEdicao(item)}
                                  disabled={salvando || !novoNome.trim()}
                                  className="size-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                >
                                  {salvando ? (
                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                  ) : (
                                    <span className="material-symbols-outlined text-sm">check</span>
                                  )}
                                </button>
                                <button
                                  onClick={cancelarEdicao}
                                  disabled={salvando}
                                  className="size-8 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-[#283039] text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#3a4654] transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => iniciarEdicao(item)}
                                  className="size-8 flex items-center justify-center rounded-lg text-[#9dabb9] hover:bg-gray-200 dark:hover:bg-[#283039] hover:text-[#137fec] transition-colors"
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                  onClick={() => setConfirmandoDelete(item.id)}
                                  className="size-8 flex items-center justify-center rounded-lg text-[#9dabb9] hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                  title="Excluir"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-[#283039]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-[#3a4654] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
