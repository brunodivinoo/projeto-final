'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Coins,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
  FileText,
  Zap,
  BarChart3,
  BookOpen,
  Search
} from 'lucide-react'

interface UsuarioTokens {
  user_id: string
  nome: string
  email: string
  plano: string
  chats: number
  resumos: number
  flashcards: number
  web_searches: number
  tokens_input: number
  tokens_output: number
  tokens_total: number
  media_tokens_por_chat: number
  custo_usd: number
  custo_brl: number
  custo_por_chat_brl: number
}

interface ResumoTokens {
  total_chats: number
  total_tokens_input: number
  total_tokens_output: number
  total_tokens: number
  custo_total_usd: number
  custo_total_brl: number
  media_tokens_por_chat: number
  media_custo_por_chat_brl: number
  media_custo_por_usuario_brl: number
}

interface DadosMonitoramento {
  mes: string
  total_usuarios: number
  usuarios: UsuarioTokens[]
  resumo: ResumoTokens
}

function formatarNumero(n: number | undefined | null): string {
  const val = n || 0
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`
  return val.toString()
}

function safeFixed(n: number | undefined | null, decimals: number): string {
  return (n || 0).toFixed(decimals)
}

export default function TokensAdminPage() {
  const [dados, setDados] = useState<DadosMonitoramento | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mesAtual, setMesAtual] = useState(() => new Date().toISOString().slice(0, 7))
  const [adminKey, setAdminKey] = useState('')
  const [keySubmitted, setKeySubmitted] = useState(false)
  const [usuarioDetalhe, setUsuarioDetalhe] = useState<UsuarioTokens | null>(null)
  const [filtro, setFiltro] = useState('')
  const [ordenacao, setOrdenacao] = useState<'custo' | 'chats' | 'tokens'>('custo')

  const carregarDados = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/monitoramento-tokens?key=${encodeURIComponent(adminKey)}&mes=${mesAtual}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao carregar dados')
        return
      }

      setDados(data)
    } catch {
      setError('Erro de conexao com o servidor')
    } finally {
      setLoading(false)
    }
  }, [adminKey, mesAtual])

  useEffect(() => {
    if (keySubmitted) {
      carregarDados()
    }
  }, [keySubmitted, carregarDados])

  const navegarMes = (direcao: number) => {
    const [ano, mes] = mesAtual.split('-').map(Number)
    const novaData = new Date(ano, mes - 1 + direcao, 1)
    setMesAtual(novaData.toISOString().slice(0, 7))
  }

  const nomeMes = (mesStr: string) => {
    const [ano, mes] = mesStr.split('-').map(Number)
    const data = new Date(ano, mes - 1, 1)
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  // Tela de login admin
  if (!keySubmitted) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-[#111827] rounded-2xl border border-slate-700 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Coins className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Monitoramento de Tokens</h1>
              <p className="text-slate-400 text-sm">Insira a chave admin para acessar</p>
            </div>
          </div>
          <input
            type="password"
            placeholder="ADMIN_SECRET_KEY"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adminKey && setKeySubmitted(true)}
            className="w-full px-4 py-3 bg-[#0A0F1C] border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-4"
          />
          <button
            onClick={() => adminKey && setKeySubmitted(true)}
            disabled={!adminKey}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            Acessar
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-slate-400 ml-3">Carregando dados...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium">{error}</p>
          <button
            onClick={() => { setKeySubmitted(false); setAdminKey('') }}
            className="mt-4 px-4 py-2 text-sm text-slate-400 hover:text-white"
          >
            Tentar outra chave
          </button>
        </div>
      </div>
    )
  }

  if (!dados) return null

  const { resumo, usuarios } = dados

  // Filtrar e ordenar usuarios
  const usuariosFiltrados = usuarios
    .filter(u => {
      if (!filtro) return true
      const termo = filtro.toLowerCase()
      return u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
    })
    .sort((a, b) => {
      if (ordenacao === 'custo') return b.custo_brl - a.custo_brl
      if (ordenacao === 'chats') return b.chats - a.chats
      return b.tokens_total - a.tokens_total
    })

  // Calcular estatisticas extras
  const usuarioMaisCaro = usuarios.length > 0 ? usuarios.reduce((a, b) => a.custo_brl > b.custo_brl ? a : b) : null
  const usuarioMaisAtivo = usuarios.length > 0 ? usuarios.reduce((a, b) => a.chats > b.chats ? a : b) : null
  const totalResumos = usuarios.reduce((s, u) => s + (u.resumos || 0), 0)
  const totalFlashcards = usuarios.reduce((s, u) => s + (u.flashcards || 0), 0)
  const totalWebSearches = usuarios.reduce((s, u) => s + (u.web_searches || 0), 0)

  // % input vs output
  const pctInput = resumo.total_tokens > 0 ? Math.round((resumo.total_tokens_input / resumo.total_tokens) * 100) : 0
  const pctOutput = 100 - pctInput

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Coins className="w-7 h-7 text-amber-400" />
            Monitoramento de Tokens
          </h1>
          <p className="text-slate-400 mt-1">Custos e uso por usuario em tempo real</p>
        </div>
        <button
          onClick={carregarDados}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-cyan-500 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Navegacao de mes */}
      <div className="flex items-center justify-center gap-4 bg-[#111827] rounded-xl border border-slate-700 py-3 px-6">
        <button onClick={() => navegarMes(-1)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white font-semibold text-lg capitalize min-w-[200px] text-center">
          {nomeMes(mesAtual)}
        </span>
        <button onClick={() => navegarMes(1)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Cards de resumo principal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Users className="w-4 h-4" />
            Usuarios Ativos
          </div>
          <p className="text-3xl font-bold text-white">{dados.total_usuarios}</p>
        </div>

        <div className="bg-[#111827] rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <MessageSquare className="w-4 h-4" />
            Total Chats
          </div>
          <p className="text-3xl font-bold text-white">{formatarNumero(resumo.total_chats)}</p>
        </div>

        <div className="bg-[#111827] rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <Coins className="w-4 h-4" />
            Total Tokens
          </div>
          <p className="text-3xl font-bold text-white">{formatarNumero(resumo.total_tokens)}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${pctInput}%` }} />
            </div>
            <span className="text-[10px] text-slate-500">In {pctInput}% / Out {pctOutput}%</span>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-amber-500/30 p-5">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            Custo Total
          </div>
          <p className="text-3xl font-bold text-amber-400">R$ {safeFixed(resumo.custo_total_brl, 2)}</p>
          <p className="text-xs text-slate-500 mt-1">
            US$ {safeFixed(resumo.custo_total_usd, 4)}
          </p>
        </div>
      </div>

      {/* Cards de uso de funcionalidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <FileText className="w-3.5 h-3.5" />
            Resumos Gerados
          </div>
          <p className="text-xl font-bold text-white">{totalResumos}</p>
        </div>
        <div className="bg-[#111827] rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            Flashcards
          </div>
          <p className="text-xl font-bold text-white">{totalFlashcards}</p>
        </div>
        <div className="bg-[#111827] rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Search className="w-3.5 h-3.5" />
            Buscas Web
          </div>
          <p className="text-xl font-bold text-white">{totalWebSearches}</p>
        </div>
        <div className="bg-[#111827] rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Zap className="w-3.5 h-3.5" />
            Modelo
          </div>
          <p className="text-sm font-bold text-cyan-400">Claude Haiku 4.5</p>
          <p className="text-[10px] text-slate-500">$0.80/$4.00 por 1M tokens</p>
        </div>
      </div>

      {/* Medias importantes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl border border-cyan-500/30 p-5">
          <div className="flex items-center gap-2 text-cyan-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            Media tokens/chat
          </div>
          <p className="text-2xl font-bold text-white">{formatarNumero(resumo.media_tokens_por_chat)}</p>
          <p className="text-xs text-slate-400 mt-1">tokens por mensagem (input + output)</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-xl border border-emerald-500/30 p-5">
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            Custo medio/chat
          </div>
          <p className="text-2xl font-bold text-white">R$ {safeFixed(resumo.media_custo_por_chat_brl, 4)}</p>
          <p className="text-xs text-slate-400 mt-1">custo por mensagem em reais</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl border border-amber-500/30 p-5">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <Users className="w-4 h-4" />
            Custo medio/usuario
          </div>
          <p className="text-2xl font-bold text-white">R$ {safeFixed(resumo.media_custo_por_usuario_brl, 2)}</p>
          <p className="text-xs text-slate-400 mt-1">custo mensal por usuario ativo</p>
        </div>
      </div>

      {/* Destaques - usuario mais caro e mais ativo */}
      {(usuarioMaisCaro || usuarioMaisAtivo) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usuarioMaisCaro && (
            <div className="bg-[#111827] rounded-xl border border-red-500/20 p-5">
              <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                <ArrowUpRight className="w-4 h-4" />
                Maior custo no mes
              </div>
              <p className="text-white font-semibold">{usuarioMaisCaro.nome}</p>
              <p className="text-slate-500 text-xs mb-2">{usuarioMaisCaro.email}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-red-400 font-bold">R$ {safeFixed(usuarioMaisCaro.custo_brl, 2)}</span>
                <span className="text-slate-400">{usuarioMaisCaro.chats} chats</span>
                <span className="text-slate-400">{formatarNumero(usuarioMaisCaro.tokens_total)} tokens</span>
              </div>
            </div>
          )}
          {usuarioMaisAtivo && (
            <div className="bg-[#111827] rounded-xl border border-cyan-500/20 p-5">
              <div className="flex items-center gap-2 text-cyan-400 text-sm mb-3">
                <MessageSquare className="w-4 h-4" />
                Mais ativo no mes
              </div>
              <p className="text-white font-semibold">{usuarioMaisAtivo.nome}</p>
              <p className="text-slate-500 text-xs mb-2">{usuarioMaisAtivo.email}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-cyan-400 font-bold">{usuarioMaisAtivo.chats} chats</span>
                <span className="text-slate-400">R$ {safeFixed(usuarioMaisAtivo.custo_brl, 2)}</span>
                <span className="text-slate-400">{formatarNumero(usuarioMaisAtivo.tokens_total)} tokens</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulacao financeira rapida */}
      {resumo.total_chats > 0 && dados.total_usuarios > 0 && (
        <div className="bg-gradient-to-r from-[#111827] to-[#0D1424] rounded-xl border border-slate-700 p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Simulacao Financeira (com base nos dados reais)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400 mb-1">Custo real por usuario</p>
              <p className="text-white font-bold text-lg">R$ {safeFixed(resumo.media_custo_por_usuario_brl, 2)}/mes</p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Se cobrar R$ 149,90</p>
              <p className={`font-bold text-lg ${(resumo.media_custo_por_usuario_brl || 0) < 149.90 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(resumo.media_custo_por_usuario_brl || 0) < 149.90 ? 'LUCRATIVO' : 'PREJUIZO'}
              </p>
              <p className="text-slate-500 text-xs">
                Margem: R$ {(149.90 - (resumo.media_custo_por_usuario_brl || 0)).toFixed(2)}/usuario
              </p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Se cobrar R$ 199,90</p>
              <p className={`font-bold text-lg ${(resumo.media_custo_por_usuario_brl || 0) < 199.90 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(resumo.media_custo_por_usuario_brl || 0) < 199.90 ? 'LUCRATIVO' : 'PREJUIZO'}
              </p>
              <p className="text-slate-500 text-xs">
                Margem: R$ {(199.90 - (resumo.media_custo_por_usuario_brl || 0)).toFixed(2)}/usuario
              </p>
            </div>
            <div>
              <p className="text-slate-400 mb-1">Media msgs/dia por usuario</p>
              <p className="text-white font-bold text-lg">
                {dados.total_usuarios > 0 ? (resumo.total_chats / dados.total_usuarios / 30).toFixed(1) : '0'} msgs/dia
              </p>
              <p className="text-slate-500 text-xs">
                {resumo.total_chats} total / {dados.total_usuarios} usuarios / 30 dias
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de usuarios */}
      <div className="bg-[#111827] rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Uso Individual ({usuariosFiltrados.length} de {usuarios.length})
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-[#0A0F1C] border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48"
                />
              </div>
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value as 'custo' | 'chats' | 'tokens')}
                className="px-3 py-1.5 bg-[#0A0F1C] border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="custo">Maior custo</option>
                <option value="chats">Mais chats</option>
                <option value="tokens">Mais tokens</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Plano</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Chats</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Tokens</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Media/Chat</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Custo R$</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">R$/Chat</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    {filtro ? 'Nenhum usuario encontrado com esse filtro' : 'Nenhum usuario ativo neste mes'}
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u) => {
                  const custoAlto = u.custo_brl > 50
                  const custoMedio = u.custo_brl > 20
                  return (
                    <tr key={u.user_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{u.nome}</p>
                        <p className="text-slate-500 text-xs truncate max-w-[180px]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          u.plano === 'residencia' ? 'bg-amber-500/20 text-amber-400' :
                          u.plano === 'premium' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {u.plano}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white text-sm">{u.chats}</td>
                      <td className="px-4 py-3 text-right text-white text-sm">{formatarNumero(u.tokens_total)}</td>
                      <td className="px-4 py-3 text-right text-slate-300 text-sm">{formatarNumero(u.media_tokens_por_chat)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${custoAlto ? 'text-red-400' : custoMedio ? 'text-amber-400' : 'text-emerald-400'}`}>
                          R$ {safeFixed(u.custo_brl, 2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 text-sm">R$ {safeFixed(u.custo_por_chat_brl, 4)}</td>
                      <td className="px-4 py-3 text-center">
                        {custoAlto ? (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                            <ArrowUpRight className="w-3 h-3" /> Alto
                          </span>
                        ) : custoMedio ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-medium">
                            <TrendingUp className="w-3 h-3" /> Medio
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                            <ArrowDownRight className="w-3 h-3" /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setUsuarioDetalhe(u)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dicas para o admin */}
      <div className="bg-[#111827] rounded-xl border border-slate-700 p-6">
        <h3 className="text-white font-semibold mb-3">Como interpretar estes dados</h3>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>- <strong className="text-white">Media tokens/chat</strong>: se for &gt; 15K, os prompts estao muito longos. Ideal: 3K-8K</li>
          <li>- <strong className="text-white">Custo medio/usuario</strong>: deve ficar ABAIXO do preco do plano para ter lucro</li>
          <li>- <strong className="text-white">Usuarios com custo alto</strong> (vermelho &gt; R$50): podem precisar de limites ou creditos extras</li>
          <li>- <strong className="text-white">R$/Chat</strong>: valor real que cada mensagem custa. Use para calcular preco de creditos</li>
          <li>- <strong className="text-white">% Input vs Output</strong>: se Input &gt; 70%, o historico esta pesando demais (comprimir conversas)</li>
          <li>- <strong className="text-white">Simulacao financeira</strong>: mostra se o preco do plano cobre os custos reais</li>
          <li>- Navegue pelos meses para acompanhar evolucao dos custos ao longo do tempo</li>
          <li>- Use o botao <strong className="text-white">Atualizar</strong> para ver dados em tempo real</li>
        </ul>
      </div>

      {/* Modal de detalhe do usuario */}
      {usuarioDetalhe && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setUsuarioDetalhe(null)}>
          <div className="bg-[#111827] rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-white">{usuarioDetalhe.nome}</h2>
                <p className="text-slate-400 text-sm">{usuarioDetalhe.email}</p>
              </div>
              <button onClick={() => setUsuarioDetalhe(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Info geral */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  usuarioDetalhe.plano === 'residencia' ? 'bg-amber-500/20 text-amber-400' :
                  usuarioDetalhe.plano === 'premium' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  Plano: {usuarioDetalhe.plano}
                </span>
              </div>

              {/* Grid de metricas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0A0F1C] rounded-lg p-3">
                  <p className="text-slate-500 text-xs">Chats</p>
                  <p className="text-white font-bold text-lg">{usuarioDetalhe.chats}</p>
                </div>
                <div className="bg-[#0A0F1C] rounded-lg p-3">
                  <p className="text-slate-500 text-xs">Resumos</p>
                  <p className="text-white font-bold text-lg">{usuarioDetalhe.resumos || 0}</p>
                </div>
                <div className="bg-[#0A0F1C] rounded-lg p-3">
                  <p className="text-slate-500 text-xs">Flashcards</p>
                  <p className="text-white font-bold text-lg">{usuarioDetalhe.flashcards || 0}</p>
                </div>
                <div className="bg-[#0A0F1C] rounded-lg p-3">
                  <p className="text-slate-500 text-xs">Buscas Web</p>
                  <p className="text-white font-bold text-lg">{usuarioDetalhe.web_searches || 0}</p>
                </div>
              </div>

              {/* Tokens detalhados */}
              <div className="bg-[#0A0F1C] rounded-lg p-4">
                <p className="text-slate-400 text-sm font-medium mb-3">Tokens</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Input</span>
                    <span className="text-white text-sm font-medium">{formatarNumero(usuarioDetalhe.tokens_input)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Output</span>
                    <span className="text-white text-sm font-medium">{formatarNumero(usuarioDetalhe.tokens_output)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-slate-400 text-sm font-medium">Total</span>
                    <span className="text-white text-sm font-bold">{formatarNumero(usuarioDetalhe.tokens_total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Media por chat</span>
                    <span className="text-cyan-400 text-sm">{formatarNumero(usuarioDetalhe.media_tokens_por_chat)}</span>
                  </div>
                </div>
              </div>

              {/* Custos detalhados */}
              <div className="bg-[#0A0F1C] rounded-lg p-4">
                <p className="text-slate-400 text-sm font-medium mb-3">Custos</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Custo USD</span>
                    <span className="text-white text-sm">US$ {safeFixed(usuarioDetalhe.custo_usd, 4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Custo BRL</span>
                    <span className="text-amber-400 text-sm font-bold">R$ {safeFixed(usuarioDetalhe.custo_brl, 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Custo por chat</span>
                    <span className="text-white text-sm">R$ {safeFixed(usuarioDetalhe.custo_por_chat_brl, 4)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-slate-500 text-sm">Msgs/dia (est.)</span>
                    <span className="text-white text-sm">{(usuarioDetalhe.chats / 30).toFixed(1)}/dia</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-sm">Projecao mensal</span>
                    <span className={`text-sm font-bold ${(usuarioDetalhe.custo_brl || 0) > 149.90 ? 'text-red-400' : 'text-emerald-400'}`}>
                      R$ {safeFixed(usuarioDetalhe.custo_brl, 2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Veredicto */}
              <div className={`rounded-lg p-4 ${
                (usuarioDetalhe.custo_brl || 0) > 50 ? 'bg-red-500/10 border border-red-500/20' :
                (usuarioDetalhe.custo_brl || 0) > 20 ? 'bg-amber-500/10 border border-amber-500/20' :
                'bg-emerald-500/10 border border-emerald-500/20'
              }`}>
                <p className={`font-medium text-sm ${
                  (usuarioDetalhe.custo_brl || 0) > 50 ? 'text-red-400' :
                  (usuarioDetalhe.custo_brl || 0) > 20 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {(usuarioDetalhe.custo_brl || 0) > 50
                    ? 'ATENCAO: Custo alto - considere limites ou creditos extras'
                    : (usuarioDetalhe.custo_brl || 0) > 20
                    ? 'Uso moderado - monitorar evolucao'
                    : 'Uso saudavel - dentro do esperado'
                  }
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Margem com plano R$149,90: R$ {(149.90 - (usuarioDetalhe.custo_brl || 0)).toFixed(2)} |
                  Com R$199,90: R$ {(199.90 - (usuarioDetalhe.custo_brl || 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
