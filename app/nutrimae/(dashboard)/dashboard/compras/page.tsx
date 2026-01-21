'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { ALIMENTOS_DATABASE } from '@/lib/nutrimae/data'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react'

interface ItemCarrinho {
  id: string
  nome: string
  categoria: string
  quantidade: number
  comprado: boolean
}

const CATEGORIAS = Object.keys(ALIMENTOS_DATABASE)

export default function ComprasPage() {
  const { profile } = useNutriAuth()
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    const fetchLista = async () => {
      if (!profile?.id) return

      try {
        const { data } = await supabase
          .from('lista_compras_nutri')
          .select('*')
          .eq('user_id', profile.id)
          .order('comprado', { ascending: true })

        if (data) {
          setItens(data.map(d => ({
            id: d.id,
            nome: d.item_nome,
            categoria: d.categoria || '',
            quantidade: d.quantidade,
            comprado: d.comprado
          })))
        }
      } catch (err) {
        console.error('Erro ao buscar lista:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLista()
  }, [profile?.id])

  const adicionarItem = async (nome: string, categoria: string) => {
    if (!profile?.id) return

    // Verificar se ja existe
    const existente = itens.find(i => i.nome === nome)
    if (existente) {
      await alterarQuantidade(existente.id, 1)
      return
    }

    try {
      const { data, error } = await supabase
        .from('lista_compras_nutri')
        .insert({
          user_id: profile.id,
          item_nome: nome,
          categoria,
          quantidade: 1,
          comprado: false
        })
        .select()
        .single()

      if (!error && data) {
        setItens(prev => [...prev, {
          id: data.id,
          nome: data.item_nome,
          categoria: data.categoria || '',
          quantidade: data.quantidade,
          comprado: data.comprado
        }])
      }
    } catch (err) {
      console.error('Erro ao adicionar item:', err)
    }
  }

  const alterarQuantidade = async (id: string, delta: number) => {
    const item = itens.find(i => i.id === id)
    if (!item) return

    const novaQuantidade = item.quantidade + delta
    if (novaQuantidade < 1) {
      await removerItem(id)
      return
    }

    try {
      await supabase
        .from('lista_compras_nutri')
        .update({ quantidade: novaQuantidade })
        .eq('id', id)

      setItens(prev => prev.map(i =>
        i.id === id ? { ...i, quantidade: novaQuantidade } : i
      ))
    } catch (err) {
      console.error('Erro ao alterar quantidade:', err)
    }
  }

  const toggleComprado = async (id: string) => {
    const item = itens.find(i => i.id === id)
    if (!item) return

    try {
      await supabase
        .from('lista_compras_nutri')
        .update({ comprado: !item.comprado })
        .eq('id', id)

      setItens(prev => prev.map(i =>
        i.id === id ? { ...i, comprado: !i.comprado } : i
      ))
    } catch (err) {
      console.error('Erro ao marcar item:', err)
    }
  }

  const removerItem = async (id: string) => {
    try {
      await supabase
        .from('lista_compras_nutri')
        .delete()
        .eq('id', id)

      setItens(prev => prev.filter(i => i.id !== id))
    } catch (err) {
      console.error('Erro ao remover item:', err)
    }
  }

  const limparComprados = async () => {
    if (!profile?.id) return

    try {
      await supabase
        .from('lista_compras_nutri')
        .delete()
        .eq('user_id', profile.id)
        .eq('comprado', true)

      setItens(prev => prev.filter(i => !i.comprado))
    } catch (err) {
      console.error('Erro ao limpar comprados:', err)
    }
  }

  const sincronizarRefeicoes = async () => {
    if (!profile?.id) return

    // Buscar refeicoes de hoje e adicionar ingredientes
    const hoje = new Date().toISOString().split('T')[0]

    try {
      const { data: refeicoes } = await supabase
        .from('refeicoes_diarias_nutri')
        .select('refeicao_selecionada')
        .eq('user_id', profile.id)
        .eq('data', hoje)

      if (refeicoes) {
        for (const ref of refeicoes) {
          const refeicao = ref.refeicao_selecionada as { ingredientes?: string[] }
          if (refeicao?.ingredientes) {
            for (const ing of refeicao.ingredientes) {
              // Encontrar categoria do ingrediente
              let categoria = 'outros'
              for (const [cat, alimentos] of Object.entries(ALIMENTOS_DATABASE)) {
                if (alimentos.some(a => a.nome === ing)) {
                  categoria = cat
                  break
                }
              }
              await adicionarItem(ing, categoria)
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar:', err)
    }
  }

  const itensPorCategoria = CATEGORIAS.reduce((acc, cat) => {
    acc[cat] = itens.filter(i => i.categoria === cat && !i.comprado)
    return acc
  }, {} as Record<string, ItemCarrinho[]>)

  const itensComprados = itens.filter(i => i.comprado)
  const totalItens = itens.filter(i => !i.comprado).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lista de Compras</h1>
          <p className="text-gray-500">{totalItens} {totalItens === 1 ? 'item' : 'itens'} pendentes</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Sincronizar */}
      <button
        onClick={sincronizarRefeicoes}
        className="w-full p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl flex items-center gap-3 hover:from-pink-100 hover:to-purple-100 transition-colors"
      >
        <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-800">Sincronizar refeicoes</p>
          <p className="text-xs text-gray-500">Adiciona ingredientes das refeicoes de hoje</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Lista por Categoria */}
      {totalItens > 0 ? (
        <div className="space-y-4">
          {CATEGORIAS.map((cat) => {
            const itensCategoria = itensPorCategoria[cat]
            if (itensCategoria.length === 0) return null

            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800 capitalize">{cat}</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {itensCategoria.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                      <button
                        onClick={() => toggleComprado(item.id)}
                        className="w-6 h-6 rounded-full border-2 border-green-400 flex items-center justify-center hover:bg-green-50 transition-colors"
                      >
                        {item.comprado && <Check className="w-4 h-4 text-green-500" />}
                      </button>
                      <span className="flex-1 text-gray-800">{item.nome}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alterarQuantidade(item.id, -1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantidade}</span>
                        <button
                          onClick={() => alterarQuantidade(item.id, 1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Sua lista esta vazia</p>
          <p className="text-sm text-gray-400">Adicione itens ou sincronize suas refeicoes</p>
        </div>
      )}

      {/* Comprados */}
      {itensComprados.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
            <h2 className="font-semibold text-green-800">Comprados ({itensComprados.length})</h2>
            <button
              onClick={limparComprados}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Limpar
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {itensComprados.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4 opacity-50">
                <button
                  onClick={() => toggleComprado(item.id)}
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </button>
                <span className="flex-1 text-gray-500 line-through">{item.nome}</span>
                <button
                  onClick={() => removerItem(item.id)}
                  className="p-2 text-red-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Adicionar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center z-50">
          <div className="bg-white w-full lg:max-w-md lg:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-green-500 text-white flex items-center justify-between">
              <h2 className="text-lg font-semibold">Adicionar Item</h2>
              <button
                onClick={() => {
                  setModalAberto(false)
                  setCategoriaAberta(null)
                  setBusca('')
                }}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Busca */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar alimento..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>

            {/* Categorias */}
            <div className="overflow-y-auto max-h-[60vh]">
              {CATEGORIAS.map((cat) => {
                const alimentos = ALIMENTOS_DATABASE[cat].filter(a =>
                  busca ? a.nome.toLowerCase().includes(busca.toLowerCase()) : true
                )

                if (busca && alimentos.length === 0) return null

                return (
                  <div key={cat}>
                    <button
                      onClick={() => setCategoriaAberta(categoriaAberta === cat ? null : cat)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <span className="font-semibold text-gray-800 capitalize">{cat}</span>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                        categoriaAberta === cat ? 'rotate-90' : ''
                      }`} />
                    </button>
                    {(categoriaAberta === cat || busca) && (
                      <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                        {alimentos.map((alimento) => (
                          <button
                            key={alimento.nome}
                            onClick={() => {
                              adicionarItem(alimento.nome, cat)
                              if (!busca) setModalAberto(false)
                            }}
                            className="p-3 bg-green-50 rounded-xl text-left hover:bg-green-100 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-800">{alimento.nome}</p>
                            <p className="text-xs text-gray-500">{alimento.porcao}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
