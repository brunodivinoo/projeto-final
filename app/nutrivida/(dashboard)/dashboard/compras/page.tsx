'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { ALIMENTOS_DATABASE } from '@/lib/nutrivida/data'
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  X,
  ChevronRight,
  Sparkles,
  Bot,
  Loader2,
  Package,
  Share2,
  CheckCircle2
} from 'lucide-react'

interface ItemCarrinho {
  id: string
  nome: string
  categoria: string
  quantidade: number
  unidade: string
  quantidade_compra: string
  comprado: boolean
}

interface AlimentoSugerido {
  nome: string
  categoria: string
  unidade: string
  quantidade_compra: string
  calorias: number
  proteinas: number
}

// Toast notification para feedback visual
interface Toast {
  id: number
  mensagem: string
  tipo: 'sucesso' | 'erro' | 'info'
}

const CATEGORIAS = Object.keys(ALIMENTOS_DATABASE)

// Icones por categoria
const CATEGORIA_ICONS: Record<string, string> = {
  frutas: '🍎',
  vegetais: '🥬',
  proteinas: '🥩',
  laticinios: '🥛',
  carboidratos: '🍞',
  gorduras: '🥑',
  bebidas: '🥤',
  temperos: '🧂',
  congelados: '🧊'
}

export default function ComprasPage() {
  const { profile } = useNutriAuth()
  const [itens, setItens] = useState<ItemCarrinho[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [buscaIA, setBuscaIA] = useState('')
  const [buscandoIA, setBuscandoIA] = useState(false)
  const [sugestoesIA, setSugestoesIA] = useState<AlimentoSugerido[]>([])
  const [modoIA, setModoIA] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [adicionandoItem, setAdicionandoItem] = useState<string | null>(null)

  // Funcao para mostrar toast
  const mostrarToast = useCallback((mensagem: string, tipo: Toast['tipo'] = 'sucesso') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensagem, tipo }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }, [])

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
            unidade: d.unidade || 'un',
            quantidade_compra: d.quantidade_compra || '1 unidade',
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

  // Buscar sugestoes com IA
  const buscarComIA = async () => {
    if (!buscaIA.trim()) return

    setBuscandoIA(true)
    setSugestoesIA([])

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: `Liste 5 alimentos relacionados a "${buscaIA}" com informacoes nutricionais basicas.
          Responda APENAS no formato JSON assim:
          [{"nome": "nome do alimento", "categoria": "categoria (frutas/vegetais/proteinas/laticinios/carboidratos/gorduras/bebidas/temperos/congelados)", "unidade": "unidade de medida", "quantidade_compra": "quantidade sugerida para compra semanal", "calorias": numero, "proteinas": numero}]
          Nao inclua texto adicional, apenas o JSON.`,
          modo: 'nutricao'
        })
      })

      const data = await response.json()

      if (data.resposta) {
        try {
          // Extrair JSON da resposta
          const jsonMatch = data.resposta.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const sugestoes = JSON.parse(jsonMatch[0])
            setSugestoesIA(sugestoes)
          }
        } catch {
          console.error('Erro ao parsear sugestoes')
        }
      }
    } catch (err) {
      console.error('Erro na busca IA:', err)
    } finally {
      setBuscandoIA(false)
    }
  }

  const adicionarItem = async (
    nome: string,
    categoria: string,
    unidade: string = 'un',
    quantidade_compra: string = '1 unidade'
  ): Promise<boolean> => {
    if (!profile?.id) return false

    setAdicionandoItem(nome)

    // Verificar se ja existe
    const existente = itens.find(i => i.nome.toLowerCase() === nome.toLowerCase())
    if (existente) {
      await alterarQuantidade(existente.id, 1)
      mostrarToast(`${nome} - quantidade aumentada!`, 'info')
      setAdicionandoItem(null)
      return true
    }

    try {
      const { data, error } = await supabase
        .from('lista_compras_nutri')
        .insert({
          user_id: profile.id,
          item_nome: nome,
          categoria,
          quantidade: 1,
          unidade,
          quantidade_compra,
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
          unidade: data.unidade || 'un',
          quantidade_compra: data.quantidade_compra || '1 unidade',
          comprado: data.comprado
        }])
        mostrarToast(`✓ ${nome} adicionado à lista!`, 'sucesso')
        setAdicionandoItem(null)
        return true
      } else {
        mostrarToast(`Erro ao adicionar ${nome}`, 'erro')
        setAdicionandoItem(null)
        return false
      }
    } catch (err) {
      console.error('Erro ao adicionar item:', err)
      mostrarToast(`Erro ao adicionar ${nome}`, 'erro')
      setAdicionandoItem(null)
      return false
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
              // Encontrar categoria e info do ingrediente
              let categoria = 'outros'
              let unidade = 'un'
              let quantidade_compra = '1 unidade'

              for (const [cat, alimentos] of Object.entries(ALIMENTOS_DATABASE)) {
                const alimento = alimentos.find(a => a.nome === ing)
                if (alimento) {
                  categoria = cat
                  unidade = alimento.unidade || 'un'
                  quantidade_compra = alimento.quantidade_compra || '1 unidade'
                  break
                }
              }
              await adicionarItem(ing, categoria, unidade, quantidade_compra)
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar:', err)
    }
  }

  // Compartilhar lista
  const compartilharLista = () => {
    const listaTexto = itens
      .filter(i => !i.comprado)
      .map(i => `- ${i.nome} (${i.quantidade}x ${i.quantidade_compra})`)
      .join('\n')

    const texto = `🛒 Lista de Compras NutriVida\n\n${listaTexto}`

    if (navigator.share) {
      navigator.share({
        title: 'Lista de Compras',
        text: texto
      })
    } else {
      navigator.clipboard.writeText(texto)
      alert('Lista copiada para a area de transferencia!')
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
      {/* Toast Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top fade-in duration-300 ${
              toast.tipo === 'sucesso' ? 'bg-green-500 text-white' :
              toast.tipo === 'erro' ? 'bg-red-500 text-white' :
              'bg-purple-500 text-white'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium text-sm">{toast.mensagem}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Lista de Compras</h1>
          <p className="text-gray-500">{totalItens} {totalItens === 1 ? 'item' : 'itens'} pendentes</p>
        </div>
        <div className="flex items-center gap-2">
          {totalItens > 0 && (
            <button
              onClick={compartilharLista}
              className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all"
              title="Compartilhar lista"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setModalAberto(true)}
            className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
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
            if (!itensCategoria || itensCategoria.length === 0) return null

            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center gap-2">
                  <span className="text-xl">{CATEGORIA_ICONS[cat] || '📦'}</span>
                  <h2 className="font-semibold text-gray-800 capitalize">{cat}</h2>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {itensCategoria.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {itensCategoria.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-3">
                      <button
                        onClick={() => toggleComprado(item.id)}
                        className="w-6 h-6 rounded-full border-2 border-green-400 flex items-center justify-center hover:bg-green-50 transition-colors flex-shrink-0"
                      >
                        {item.comprado && <Check className="w-4 h-4 text-green-500" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{item.nome}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {item.quantidade_compra}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alterarQuantidade(item.id, -1)}
                          className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4 text-gray-600" />
                        </button>
                        <span className="w-8 text-center font-medium text-gray-800">{item.quantidade}</span>
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
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-green-800">Comprados ({itensComprados.length})</h2>
            </div>
            <button
              onClick={limparComprados}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {itensComprados.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-3 opacity-60">
                <button
                  onClick={() => toggleComprado(item.id)}
                  className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
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
          <div className="bg-white w-full lg:max-w-lg lg:rounded-2xl rounded-t-3xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center justify-between">
              <h2 className="text-lg font-semibold">Adicionar Item</h2>
              <button
                onClick={() => {
                  setModalAberto(false)
                  setCategoriaAberta(null)
                  setBusca('')
                  setModoIA(false)
                  setSugestoesIA([])
                }}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => {
                  setModoIA(false)
                  setSugestoesIA([])
                }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  !modoIA
                    ? 'text-green-600 border-b-2 border-green-500'
                    : 'text-gray-500'
                }`}
              >
                📋 Catalogo
              </button>
              <button
                onClick={() => setModoIA(true)}
                className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  modoIA
                    ? 'text-purple-600 border-b-2 border-purple-500'
                    : 'text-gray-500'
                }`}
              >
                <Bot className="w-4 h-4" />
                Buscar com IA
              </button>
            </div>

            {modoIA ? (
              /* Busca IA */
              <div className="p-4">
                <div className="relative mb-4">
                  <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    value={buscaIA}
                    onChange={(e) => setBuscaIA(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarComIA()}
                    placeholder="Ex: alimentos ricos em proteina..."
                    className="w-full pl-10 pr-4 py-3 bg-purple-50 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <button
                  onClick={buscarComIA}
                  disabled={buscandoIA || !buscaIA.trim()}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {buscandoIA ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Buscar Sugestoes
                    </>
                  )}
                </button>

                {/* Resultados IA */}
                {sugestoesIA.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-500 mb-2">Sugestoes da IA: <span className="text-purple-600 font-medium">clique para adicionar</span></p>
                    {sugestoesIA.map((sug, i) => {
                      const isAdicionando = adicionandoItem === sug.nome
                      return (
                        <button
                          key={i}
                          onClick={async () => {
                            const sucesso = await adicionarItem(sug.nome, sug.categoria, sug.unidade, sug.quantidade_compra)
                            if (sucesso) {
                              setSugestoesIA(prev => prev.filter((_, idx) => idx !== i))
                            }
                          }}
                          disabled={isAdicionando}
                          className={`w-full p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl text-left transition-all ${
                            isAdicionando ? 'opacity-70 scale-95' : 'hover:from-purple-100 hover:to-pink-100 hover:scale-[1.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-800 flex items-center gap-2">
                              {isAdicionando && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
                              {sug.nome}
                            </p>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                              {sug.categoria}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{sug.calorias} kcal</span>
                            <span>{sug.proteinas}g proteina</span>
                            <span className="ml-auto flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              {sug.quantidade_compra}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {!buscandoIA && sugestoesIA.length === 0 && buscaIA && (
                  <p className="text-center text-gray-400 text-sm mt-4">
                    Digite sua busca e clique em &quot;Buscar Sugestoes&quot;
                  </p>
                )}
              </div>
            ) : (
              /* Catalogo normal */
              <>
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
                <div className="overflow-y-auto max-h-[50vh]">
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
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{CATEGORIA_ICONS[cat] || '📦'}</span>
                            <span className="font-semibold text-gray-800 capitalize">{cat}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{alimentos.length}</span>
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                              categoriaAberta === cat ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </button>
                        {(categoriaAberta === cat || busca) && (
                          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                            {alimentos.map((alimento) => {
                              const isAdicionando = adicionandoItem === alimento.nome
                              const jaAdicionado = itens.some(i => i.nome.toLowerCase() === alimento.nome.toLowerCase())
                              return (
                                <button
                                  key={alimento.nome}
                                  onClick={async () => {
                                    await adicionarItem(
                                      alimento.nome,
                                      cat,
                                      alimento.unidade || 'un',
                                      alimento.quantidade_compra || '1 unidade'
                                    )
                                  }}
                                  disabled={isAdicionando}
                                  className={`p-3 rounded-xl text-left transition-all relative ${
                                    jaAdicionado
                                      ? 'bg-green-100 border-2 border-green-300'
                                      : 'bg-green-50 hover:bg-green-100'
                                  } ${isAdicionando ? 'opacity-70 scale-95' : 'hover:scale-[1.02]'}`}
                                >
                                  {jaAdicionado && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                    {isAdicionando && <Loader2 className="w-3 h-3 animate-spin text-green-600" />}
                                    {alimento.nome}
                                  </p>
                                  <p className="text-xs text-gray-500">{alimento.porcao}</p>
                                  {alimento.quantidade_compra && (
                                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                      <Package className="w-3 h-3" />
                                      {alimento.quantidade_compra}
                                    </p>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
