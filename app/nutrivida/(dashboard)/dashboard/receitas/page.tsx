'use client'

import { useState, useEffect, useCallback } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { TIPOS_RECEITAS } from '@/lib/nutrivida/data'
import {
  ChefHat,
  Sparkles,
  Clock,
  Flame,
  Loader2,
  RefreshCw,
  Heart,
  HeartOff,
  Filter,
  X,
  Search,
  Utensils,
  Leaf,
  Dumbbell
} from 'lucide-react'

interface ReceitaSalva {
  id: string
  nome: string
  tipo: string
  conteudo: string
  calorias?: number
  proteinas?: number
  created_at: string
}

export default function ReceitasPage() {
  const { profile } = useNutriAuth()
  const [tipoSelecionado, setTipoSelecionado] = useState<string | null>(null)
  const [receita, setReceita] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [favoritas, setFavoritas] = useState<ReceitaSalva[]>([])
  const [showFavoritas, setShowFavoritas] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [receitaAtualSalva, setReceitaAtualSalva] = useState(false)

  // Carregar receitas favoritas
  const carregarFavoritas = useCallback(async () => {
    if (!profile?.id) return

    try {
      const { data } = await supabase
        .from('receitas_favoritas_nutri')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (data) {
        setFavoritas(data.map(r => ({
          id: r.id,
          nome: r.nome || 'Receita',
          tipo: r.tipo,
          conteudo: r.conteudo,
          calorias: r.calorias,
          proteinas: r.proteinas,
          created_at: r.created_at
        })))
      }
    } catch (err) {
      console.error('Erro ao carregar favoritas:', err)
    }
  }, [profile?.id])

  useEffect(() => {
    carregarFavoritas()
  }, [carregarFavoritas])

  const gerarReceita = async (tipo: string, forcarNova: boolean = false) => {
    setTipoSelecionado(tipo)
    setLoading(true)
    setReceita(null)
    setReceitaAtualSalva(false)

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          userId: profile?.id,
          observacao: observacao || undefined,
          novaReceita: forcarNova, // Forca nova receita quando clica em refresh
          perfil: profile ? {
            plano: profile.plano,
            amamentando: profile.amamentando,
            peso_meta: profile.peso_meta
          } : undefined
        })
      })

      const data = await response.json()
      if (data.receita) {
        setReceita(data.receita)
      }
    } catch (err) {
      console.error('Erro ao gerar receita:', err)
      setReceita('Erro ao gerar receita. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const salvarReceita = async () => {
    if (!profile?.id || !receita || !tipoSelecionado) return

    setSalvando(true)
    try {
      // Extrair nome da receita (primeira linha que comeca com NOME:)
      const nomeMatch = receita.match(/NOME:\s*(.+)/i)
      let nome = nomeMatch ? nomeMatch[1].trim() : `Receita de ${tipoSelecionado}`
      // Remover timestamps ou numeros indesejados que podem aparecer no nome
      nome = nome.replace(/#\d+/g, '').replace(/\(\d+\)/g, '').trim()

      // Extrair calorias e proteinas se disponiveis
      const caloriasMatch = receita.match(/CALORIAS?:\s*(\d+)/i)
      const proteinasMatch = receita.match(/PROTE[IÍ]NAS?:\s*(\d+)/i)

      const { error } = await supabase
        .from('receitas_favoritas_nutri')
        .insert({
          user_id: profile.id,
          nome,
          tipo: tipoSelecionado,
          conteudo: receita,
          calorias: caloriasMatch ? parseInt(caloriasMatch[1]) : null,
          proteinas: proteinasMatch ? parseInt(proteinasMatch[1]) : null
        })

      if (!error) {
        setReceitaAtualSalva(true)
        carregarFavoritas()
      }
    } catch (err) {
      console.error('Erro ao salvar receita:', err)
    } finally {
      setSalvando(false)
    }
  }

  const removerFavorita = async (id: string) => {
    try {
      await supabase
        .from('receitas_favoritas_nutri')
        .delete()
        .eq('id', id)

      setFavoritas(prev => prev.filter(r => r.id !== id))
    } catch (err) {
      console.error('Erro ao remover receita:', err)
    }
  }

  const visualizarFavorita = (rec: ReceitaSalva) => {
    setTipoSelecionado(rec.tipo)
    setReceita(rec.conteudo)
    setReceitaAtualSalva(true)
    setShowFavoritas(false)
  }

  const favoritasFiltradas = filtroTipo
    ? favoritas.filter(r => r.tipo === filtroTipo)
    : favoritas

  // Formatar receita com estilo bonito - suporta multiplos formatos de IA
  const formatarReceita = (texto: string) => {
    // Pre-processar o texto para normalizar formato
    const textoNormalizado = texto
      // Normalizar asteriscos de markdown para quebras de secao
      .replace(/\*\*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+?):\*\*/gi, '\n$1:')
      // Remover asteriscos soltos
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      // Normalizar bullets
      .replace(/•/g, '-')
      // Adicionar quebra antes de secoes conhecidas que nao tem
      .replace(/(INGREDIENTES|MODO DE PREPARO|PREPARO|DICA|VARIAÇÃO|VARIACAO|CALORIAS|PROTEÍNAS|PROTEINAS|TEMPO|RENDIMENTO):/gi, '\n$1:')

    // Dividir em secoes
    const linhas = textoNormalizado.split('\n')
    const secoes: { titulo: string; conteudo: string[] }[] = []
    let secaoAtual: { titulo: string; conteudo: string[] } | null = null
    let nomeReceita = ''

    for (const linha of linhas) {
      const linhaLimpa = linha.trim()
      if (!linhaLimpa) continue

      // Padroes de titulos de secao (mais abrangente)
      const matchSecao = linhaLimpa.match(/^(NOME|TEMPO|RENDIMENTO|CALORIAS|PROTE[IÍ]NAS?|INGREDIENTES|MODO DE PREPARO|PREPARO|DICA|VARIA[ÇC][AÃ]O|SEGURA?|INFO(?:RMAÇÕES)?(?:\s+NUTRICIONAIS)?)\s*:/i)

      if (matchSecao) {
        if (secaoAtual) {
          secoes.push(secaoAtual)
        }
        const tituloMatch = matchSecao[1].toUpperCase()
        const conteudoRestante = linhaLimpa.slice(matchSecao[0].length).trim()

        // Guardar nome da receita separadamente
        if (tituloMatch === 'NOME' && conteudoRestante) {
          nomeReceita = conteudoRestante
        }

        secaoAtual = {
          titulo: tituloMatch,
          conteudo: conteudoRestante ? [conteudoRestante] : []
        }
      } else if (secaoAtual) {
        // Limpar item de lista
        const itemLimpo = linhaLimpa
          .replace(/^[-•]\s*/, '')
          .replace(/^\d+[\.\)]\s*/, '')
          .trim()
        if (itemLimpo) {
          secaoAtual.conteudo.push(itemLimpo)
        }
      } else {
        // Texto antes de qualquer secao - pode ser o nome
        if (!nomeReceita && linhaLimpa.length > 3 && linhaLimpa.length < 100) {
          nomeReceita = linhaLimpa
        }
      }
    }
    if (secaoAtual) {
      secoes.push(secaoAtual)
    }

    // Se nao encontrou secoes estruturadas, tenta parse mais agressivo
    if (secoes.length === 0) {
      return (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-gray-700 whitespace-pre-wrap">{texto}</p>
        </div>
      )
    }

    // Extrair info nutricional do header
    const headerInfos: { label: string; valor: string }[] = []
    const secoesPrincipais: typeof secoes = []

    for (const secao of secoes) {
      if (['NOME', 'TEMPO', 'RENDIMENTO', 'CALORIAS', 'PROTEINAS', 'PROTEÍNAS'].includes(secao.titulo)) {
        if (secao.titulo !== 'NOME' && secao.conteudo.length > 0) {
          headerInfos.push({
            label: secao.titulo,
            valor: secao.conteudo.join(' ')
          })
        }
      } else {
        secoesPrincipais.push(secao)
      }
    }

    return (
      <div className="space-y-4">
        {/* Nome da receita */}
        {nomeReceita && (
          <div className="pb-3 border-b border-pink-100">
            <h3 className="text-xl font-bold text-gray-800">{nomeReceita}</h3>
          </div>
        )}

        {/* Info cards (tempo, calorias, etc) */}
        {headerInfos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {headerInfos.map((info, i) => (
              <div key={i} className="px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full flex items-center gap-1.5 border border-pink-100">
                {info.label === 'TEMPO' && <Clock className="w-3.5 h-3.5 text-pink-500" />}
                {(info.label === 'CALORIAS') && <Flame className="w-3.5 h-3.5 text-orange-500" />}
                {(info.label === 'PROTEINAS' || info.label === 'PROTEÍNAS') && <Dumbbell className="w-3.5 h-3.5 text-purple-500" />}
                {info.label === 'RENDIMENTO' && <Utensils className="w-3.5 h-3.5 text-green-500" />}
                <span className="text-xs font-medium text-gray-700">{info.valor}</span>
              </div>
            ))}
          </div>
        )}

        {/* Secoes principais */}
        {secoesPrincipais.map((secao, i) => {
          const isIngredientes = secao.titulo === 'INGREDIENTES'
          const isModo = secao.titulo.includes('MODO') || secao.titulo === 'PREPARO'
          const isDica = secao.titulo.includes('DICA') || secao.titulo.includes('VARIA')
          const isInfo = secao.titulo.includes('INFO')

          if (isIngredientes) {
            return (
              <div key={i} className="bg-pink-50 rounded-xl p-4">
                <h4 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Ingredientes
                </h4>
                <ul className="space-y-2">
                  {secao.conteudo.map((item, j) => (
                    <li key={j} className="text-gray-700 text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          }

          if (isModo) {
            return (
              <div key={i} className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <ChefHat className="w-4 h-4" />
                  Modo de Preparo
                </h4>
                <ol className="space-y-3">
                  {secao.conteudo.map((item, j) => (
                    <li key={j} className="text-gray-700 text-sm flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-200 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold">
                        {j + 1}
                      </span>
                      <span className="pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )
          }

          if (isDica) {
            return (
              <div key={i} className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <Leaf className="w-4 h-4" />
                  {secao.titulo.includes('VARIA') ? 'Variação' : 'Dica Nutri'}
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">{secao.conteudo.join(' ')}</p>
              </div>
            )
          }

          if (isInfo) {
            return (
              <div key={i} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Informações Nutricionais
                </h4>
                <p className="text-gray-700 text-sm">{secao.conteudo.join(' ')}</p>
              </div>
            )
          }

          return (
            <div key={i} className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-2">{secao.titulo}</h4>
              <p className="text-gray-600 text-sm">{secao.conteudo.join(' ')}</p>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Receitas IA</h1>
            <p className="text-gray-500">Receitas personalizadas para voce</p>
          </div>
        </div>
        <button
          onClick={() => setShowFavoritas(!showFavoritas)}
          className={`p-3 rounded-xl transition-all ${
            showFavoritas
              ? 'bg-pink-500 text-white'
              : 'bg-pink-50 text-pink-500 hover:bg-pink-100'
          }`}
        >
          <Heart className="w-5 h-5" fill={showFavoritas ? 'white' : 'none'} />
        </button>
      </div>

      {/* Favoritas View */}
      {showFavoritas ? (
        <div className="space-y-4">
          {/* Filtro */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFiltroTipo(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                !filtroTipo ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas ({favoritas.length})
            </button>
            {TIPOS_RECEITAS.map(tipo => {
              const count = favoritas.filter(r => r.tipo === tipo.id).length
              if (count === 0) return null
              return (
                <button
                  key={tipo.id}
                  onClick={() => setFiltroTipo(tipo.id)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all flex items-center gap-1 ${
                    filtroTipo === tipo.id ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{tipo.icon}</span>
                  <span>{tipo.nome}</span>
                  <span className="bg-white/20 px-1.5 rounded-full text-xs">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Lista de favoritas */}
          {favoritasFiltradas.length > 0 ? (
            <div className="grid gap-3">
              {favoritasFiltradas.map((rec) => {
                const tipoInfo = TIPOS_RECEITAS.find(t => t.id === rec.tipo)
                return (
                  <div
                    key={rec.id}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => visualizarFavorita(rec)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{tipoInfo?.icon || '🍽️'}</span>
                          <span className="font-semibold text-gray-800">{rec.nome}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {rec.calorias && (
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-400" />
                              {rec.calorias} kcal
                            </span>
                          )}
                          {rec.proteinas && (
                            <span className="flex items-center gap-1">
                              <Dumbbell className="w-3 h-3 text-purple-400" />
                              {rec.proteinas}g prot
                            </span>
                          )}
                          <span>
                            {new Date(rec.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removerFavorita(rec.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                      >
                        <HeartOff className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma receita salva</p>
              <p className="text-sm text-gray-400">Gere receitas e salve suas favoritas!</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Campo de observacao */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alguma preferencia? (opcional)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: mais proteina, sem lactose, rapida..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              {observacao && (
                <button
                  onClick={() => setObservacao('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tipos de Receita */}
          <div>
            <h2 className="font-semibold text-gray-800 mb-3">O que voce quer fazer?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TIPOS_RECEITAS.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => gerarReceita(tipo.id)}
                  disabled={loading}
                  className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md disabled:opacity-50 ${
                    tipoSelecionado === tipo.id
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-100 bg-white hover:border-orange-200'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{tipo.icon}</span>
                  <p className="font-medium text-gray-800 text-sm">{tipo.nome}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Criando sua receita...</p>
              <p className="text-sm text-gray-400 mt-1">A IA esta preparando algo especial</p>
            </div>
          )}

          {/* Receita Gerada */}
          {receita && !loading && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Sua Receita
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={salvarReceita}
                    disabled={salvando || receitaAtualSalva}
                    className={`p-2 rounded-lg transition-all ${
                      receitaAtualSalva
                        ? 'bg-pink-100 text-pink-500'
                        : 'hover:bg-pink-50 text-gray-400 hover:text-pink-500'
                    }`}
                    title={receitaAtualSalva ? 'Receita salva!' : 'Salvar nos favoritos'}
                  >
                    {salvando ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Heart className="w-5 h-5" fill={receitaAtualSalva ? 'currentColor' : 'none'} />
                    )}
                  </button>
                  <button
                    onClick={() => tipoSelecionado && gerarReceita(tipoSelecionado, true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                    title="Gerar outra receita (variação)"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {formatarReceita(receita)}
            </div>
          )}

          {/* Info quando nao tem receita */}
          {!receita && !loading && (
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-4 border border-orange-100">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-700 font-medium">Receitas feitas pela IA</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Escolha um tipo de refeicao e a IA vai criar uma receita nutritiva,
                    rapida e deliciosa baseada no seu perfil!
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
