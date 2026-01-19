'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import { supabase } from '@/lib/supabase'
import {
  Gift,
  Copy,
  CheckCircle2,
  Users,
  Crown,
  Share2,
  Sparkles,
  ArrowRight,
  Mail,
  Loader2
} from 'lucide-react'

interface Indicacao {
  id: string
  indicado_email: string
  status: 'pendente' | 'cadastrado' | 'convertido'
  bonus_aplicado: boolean
  created_at: string
}

export default function IndicacoesPage() {
  const { user, profile } = useMedAuth()
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiad] = useState(false)
  const [emailConvite, setEmailConvite] = useState('')
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [conviteEnviado, setConviteEnviado] = useState(false)
  const [erro, setErro] = useState('')

  // Gerar código de indicação único baseado no user id
  const codigoIndicacao = user?.id ? user.id.substring(0, 8).toUpperCase() : ''
  const linkIndicacao = typeof window !== 'undefined'
    ? `${window.location.origin}/medicina/cadastro?ref=${codigoIndicacao}`
    : ''

  const fetchIndicacoes = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('indicacoes_med')
        .select('*')
        .eq('indicador_id', user.id)
        .order('created_at', { ascending: false })

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar indicações:', error)
      }

      setIndicacoes(data || [])
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchIndicacoes()
  }, [fetchIndicacoes])

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkIndicacao)
      setCopiad(true)
      setTimeout(() => setCopiad(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const enviarConvite = async () => {
    if (!emailConvite || !user) return

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailConvite)) {
      setErro('Digite um email válido')
      return
    }

    setEnviandoConvite(true)
    setErro('')

    try {
      // Verificar se já convidou esse email
      const { data: existente } = await supabase
        .from('indicacoes_med')
        .select('id')
        .eq('indicador_id', user.id)
        .eq('indicado_email', emailConvite.toLowerCase())
        .single()

      if (existente) {
        setErro('Você já convidou este email')
        setEnviandoConvite(false)
        return
      }

      // Registrar indicação
      const { error: insertError } = await supabase
        .from('indicacoes_med')
        .insert({
          indicador_id: user.id,
          indicado_email: emailConvite.toLowerCase(),
          codigo_indicacao: codigoIndicacao,
          status: 'pendente'
        })

      if (insertError) {
        throw insertError
      }

      // Enviar convite por email via Supabase
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(emailConvite)

      // Se não conseguir enviar convite (sem admin), apenas registra
      if (inviteError) {
        console.log('Convite registrado, email será enviado manualmente ou usuário usará o link')
      }

      setConviteEnviado(true)
      setEmailConvite('')
      fetchIndicacoes()
      setTimeout(() => setConviteEnviado(false), 3000)
    } catch (err) {
      console.error('Erro ao enviar convite:', err)
      setErro('Erro ao enviar convite. Tente novamente.')
    } finally {
      setEnviandoConvite(false)
    }
  }

  const compartilharWhatsApp = () => {
    const texto = encodeURIComponent(
      `Estou usando o PreparaMed para estudar para a residência médica e está me ajudando muito! Use meu link para se cadastrar e ganhar benefícios: ${linkIndicacao}`
    )
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  const indicacoesCadastradas = indicacoes.filter(i => i.status === 'cadastrado' || i.status === 'convertido').length
  const indicacoesConvertidas = indicacoes.filter(i => i.status === 'convertido').length

  // Calcular benefícios
  const questoesBonus = indicacoesCadastradas * 5 // +5 questões por indicação cadastrada
  const diasPremiumBonus = indicacoesConvertidas * 7 // +7 dias premium por conversão

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
          <Gift className="w-8 h-8 text-purple-400" />
          Programa de Indicação
        </h1>
        <p className="text-emerald-200/70 mt-1">
          Convide amigos e ganhe benefícios exclusivos!
        </p>
      </div>

      {/* Banner de Benefícios */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Ganhe recompensas por cada indicação!
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white font-semibold">Amigo se cadastra</p>
            <p className="text-emerald-400 text-sm mt-1">+5 questões/dia para você</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-white font-semibold">Amigo assina Premium</p>
            <p className="text-purple-400 text-sm mt-1">+7 dias grátis de Premium</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-white font-semibold">Seu amigo também ganha</p>
            <p className="text-amber-400 text-sm mt-1">+3 questões/dia de bônus</p>
          </div>
        </div>
      </div>

      {/* Seus Benefícios Atuais */}
      {(questoesBonus > 0 || diasPremiumBonus > 0) && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <h3 className="text-emerald-400 font-semibold mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Seus benefícios ativos
          </h3>
          <div className="flex flex-wrap gap-4">
            {questoesBonus > 0 && (
              <span className="bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-300 text-sm">
                +{questoesBonus} questões/dia
              </span>
            )}
            {diasPremiumBonus > 0 && (
              <span className="bg-purple-500/20 px-3 py-1 rounded-full text-purple-300 text-sm">
                +{diasPremiumBonus} dias Premium
              </span>
            )}
          </div>
        </div>
      )}

      {/* Link de Indicação */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Seu link de indicação</h3>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/70 text-sm truncate">
            {linkIndicacao}
          </div>
          <button
            onClick={copiarLink}
            className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              copiado
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {copiado ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={compartilharWhatsApp}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar no WhatsApp
          </button>
        </div>
      </div>

      {/* Convidar por Email */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-emerald-400" />
          Convidar por email
        </h3>

        {erro && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {erro}
          </div>
        )}

        {conviteEnviado && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Convite registrado com sucesso! Seu amigo receberá o link de cadastro.
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="email"
            value={emailConvite}
            onChange={(e) => setEmailConvite(e.target.value)}
            placeholder="email@amigo.com"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={enviarConvite}
            disabled={enviandoConvite || !emailConvite}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {enviandoConvite ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Enviar
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="text-3xl font-bold text-white">{indicacoes.length}</div>
          <div className="text-white/60 text-sm">Convites enviados</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="text-3xl font-bold text-emerald-400">{indicacoesCadastradas}</div>
          <div className="text-white/60 text-sm">Cadastros</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="text-3xl font-bold text-purple-400">{indicacoesConvertidas}</div>
          <div className="text-white/60 text-sm">Assinantes</div>
        </div>
      </div>

      {/* Histórico de Indicações */}
      {indicacoes.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Histórico de indicações</h3>
          <div className="space-y-3">
            {indicacoes.map((indicacao) => (
              <div
                key={indicacao.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{indicacao.indicado_email}</p>
                  <p className="text-white/50 text-xs">
                    {new Date(indicacao.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  indicacao.status === 'convertido'
                    ? 'bg-purple-500/20 text-purple-400'
                    : indicacao.status === 'cadastrado'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-white/10 text-white/60'
                }`}>
                  {indicacao.status === 'convertido'
                    ? 'Assinante'
                    : indicacao.status === 'cadastrado'
                    ? 'Cadastrado'
                    : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Código de Indicação */}
      <div className="text-center text-white/40 text-sm">
        Seu código de indicação: <span className="text-emerald-400 font-mono">{codigoIndicacao}</span>
      </div>
    </div>
  )
}
