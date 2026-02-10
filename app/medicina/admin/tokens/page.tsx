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
  ArrowDownRight
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

function formatarNumero(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export default function TokensAdminPage() {
  const [dados, setDados] = useState<DadosMonitoramento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mesAtual, setMesAtual] = useState(() => new Date().toISOString().slice(0, 7))
  const [adminKey, setAdminKey] = useState('')
  const [keySubmitted, setKeySubmitted] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Coins className="w-7 h-7 text-amber-400" />
            Monitoramento de Tokens
          </h1>
          <p className="text-slate-400 mt-1">Custos e uso por usuario em tempo real</p>
        </div>
        <button
          onClick={carregarDados}
          className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-cyan-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
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

      {/* Cards de resumo */}
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
          <p className="text-xs text-slate-500 mt-1">
            In: {formatarNumero(resumo.total_tokens_input)} | Out: {formatarNumero(resumo.total_tokens_output)}
          </p>
        </div>

        <div className="bg-[#111827] rounded-xl border border-amber-500/30 p-5">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            Custo Total
          </div>
          <p className="text-3xl font-bold text-amber-400">R$ {resumo.custo_total_brl.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">
            US$ {resumo.custo_total_usd.toFixed(4)}
          </p>
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
          <p className="text-2xl font-bold text-white">R$ {resumo.media_custo_por_chat_brl.toFixed(4)}</p>
          <p className="text-xs text-slate-400 mt-1">custo por mensagem em reais</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 rounded-xl border border-amber-500/30 p-5">
          <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
            <Users className="w-4 h-4" />
            Custo medio/usuario
          </div>
          <p className="text-2xl font-bold text-white">R$ {resumo.media_custo_por_usuario_brl.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">custo mensal por usuario ativo</p>
        </div>
      </div>

      {/* Tabela de usuarios */}
      <div className="bg-[#111827] rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Uso por Usuario ({usuarios.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Plano</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Chats</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Tokens Total</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Media/Chat</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Custo BRL</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase">R$/Chat</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    Nenhum usuario ativo neste mes
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => {
                  const custoAlto = u.custo_brl > 50
                  const custoMedio = u.custo_brl > 20
                  return (
                    <tr key={u.user_id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{u.nome}</p>
                        <p className="text-slate-500 text-xs">{u.email}</p>
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
                          R$ {u.custo_brl.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300 text-sm">R$ {u.custo_por_chat_brl.toFixed(4)}</td>
                      <td className="px-4 py-3 text-center">
                        {custoAlto ? (
                          <span className="inline-flex items-center gap-1 text-red-400 text-xs">
                            <ArrowUpRight className="w-3 h-3" /> Alto
                          </span>
                        ) : custoMedio ? (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-xs">
                            <TrendingUp className="w-3 h-3" /> Medio
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                            <ArrowDownRight className="w-3 h-3" /> OK
                          </span>
                        )}
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
        <h3 className="text-white font-semibold mb-3">Como usar estes dados</h3>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li>- <strong className="text-white">Media tokens/chat</strong>: se for &gt; 15K, os prompts estao muito longos</li>
          <li>- <strong className="text-white">Custo medio/usuario</strong>: deve ficar ABAIXO do preco do plano (R$149,90) para ter lucro</li>
          <li>- <strong className="text-white">Usuarios com custo alto</strong> (vermelho): podem estar abusando do sistema</li>
          <li>- <strong className="text-white">R$/Chat</strong>: valor real que cada mensagem custa. Use para calcular creditos</li>
          <li>- Navegue pelos meses para ver evolucao historica</li>
        </ul>
      </div>
    </div>
  )
}
