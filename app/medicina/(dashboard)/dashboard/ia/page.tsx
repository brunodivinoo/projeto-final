'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMedAuth } from '@/contexts/MedAuthContext'
import {
  Brain,
  Send,
  Sparkles,
  History,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  FileText,
  Layers,
  User,
  Bot,
  Crown,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface Mensagem {
  tipo: 'usuario' | 'ia'
  conteudo: string
  timestamp: Date
}

interface HistoricoItem {
  id: string
  mensagem_usuario: string
  resposta_ia: string
  created_at: string
}

export default function IAPage() {
  const { user, plano, limitesPlano, limites } = useMedAuth()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [showHistorico, setShowHistorico] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const perguntasUsadas = limites?.perguntas_ia_mes || 0
  const perguntasLimite = limitesPlano.perguntas_ia_mes
  const podePerguntar = plano !== 'gratuito' && (perguntasLimite === -1 || perguntasUsadas < perguntasLimite)

  const fetchHistorico = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/medicina/ia?userId=${user.id}`)
      const data = await response.json()
      setHistorico(data.historico || [])
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
    }
  }, [user])

  useEffect(() => {
    if (showHistorico) {
      fetchHistorico()
    }
  }, [showHistorico, fetchHistorico])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens])

  const enviarMensagem = async () => {
    if (!input.trim() || !user || loading || !podePerguntar) return

    const mensagemUsuario = input.trim()
    setInput('')
    setMensagens(prev => [...prev, {
      tipo: 'usuario',
      conteudo: mensagemUsuario,
      timestamp: new Date()
    }])
    setLoading(true)

    try {
      const response = await fetch('/api/medicina/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mensagem: mensagemUsuario
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pergunta')
      }

      setMensagens(prev => [...prev, {
        tipo: 'ia',
        conteudo: data.resposta,
        timestamp: new Date()
      }])

    } catch (error: any) {
      setMensagens(prev => [...prev, {
        tipo: 'ia',
        conteudo: `Erro: ${error.message}`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const copiarResposta = (texto: string) => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const carregarConversa = (item: HistoricoItem) => {
    setMensagens([
      { tipo: 'usuario', conteudo: item.mensagem_usuario, timestamp: new Date(item.created_at) },
      { tipo: 'ia', conteudo: item.resposta_ia, timestamp: new Date(item.created_at) }
    ])
    setShowHistorico(false)
  }

  const limparChat = () => {
    setMensagens([])
  }

  // Sugestões rápidas
  const sugestoes = [
    { icon: BookOpen, texto: 'Explique a fisiopatologia da insuficiência cardíaca' },
    { icon: FileText, texto: 'Quais são os critérios de Light para derrame pleural?' },
    { icon: Layers, texto: 'Faça um resumo sobre diabetes mellitus tipo 2' },
  ]

  // Se usuário é gratuito
  if (plano === 'gratuito') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-8 border border-amber-500/30 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">IA Tutora</h1>
          <p className="text-amber-200/80 mb-6 max-w-md mx-auto">
            A IA Tutora está disponível apenas para assinantes Premium e Residência.
            Tire suas dúvidas, peça explicações e receba ajuda personalizada para seus estudos.
          </p>
          <Link
            href="/medicina/dashboard/assinatura"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Fazer Upgrade
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">IA Tutora</h1>
            <p className="text-white/60 text-sm">
              {perguntasLimite === -1 ? 'Perguntas ilimitadas' :
               `${perguntasUsadas}/${perguntasLimite} perguntas este mês`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className={`p-2 rounded-lg transition-colors ${
              showHistorico ? 'bg-purple-500/20 text-purple-400' : 'text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-5 h-5" />
          </button>
          <button
            onClick={limparChat}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Histórico Sidebar */}
      {showHistorico && (
        <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10 max-h-48 overflow-y-auto">
          <h3 className="text-white font-medium mb-3">Conversas Anteriores</h3>
          {historico.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma conversa anterior</p>
          ) : (
            <div className="space-y-2">
              {historico.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  onClick={() => carregarConversa(item)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <p className="text-white/80 text-sm truncate">{item.mensagem_usuario}</p>
                  <p className="text-white/40 text-xs">
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div
        ref={chatRef}
        className="flex-1 bg-white/5 rounded-xl border border-white/10 p-4 overflow-y-auto space-y-4"
      >
        {mensagens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Brain className="w-16 h-16 text-purple-400/40 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Como posso ajudar?</h2>
            <p className="text-white/60 mb-6 max-w-md">
              Tire dúvidas sobre medicina, peça explicações de conceitos ou ajuda com questões de prova.
            </p>

            <div className="space-y-2 w-full max-w-md">
              {sugestoes.map((sugestao, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(sugestao.texto)
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <sugestao.icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span className="text-white/80 text-sm">{sugestao.texto}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensagens.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.tipo === 'ia' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`max-w-[80%] ${msg.tipo === 'usuario' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl p-4 ${
                  msg.tipo === 'usuario'
                    ? 'bg-emerald-500/20 text-white'
                    : 'bg-white/5 text-white/90'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.conteudo}</p>
                </div>

                {msg.tipo === 'ia' && (
                  <div className="flex items-center gap-2 mt-1 ml-2">
                    <button
                      onClick={() => copiarResposta(msg.conteudo)}
                      className="text-white/40 hover:text-white text-xs flex items-center gap-1"
                    >
                      {copiado ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiado ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                )}
              </div>

              {msg.tipo === 'usuario' && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-white/60">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-4">
        {!podePerguntar && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-3 text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              Você atingiu o limite de perguntas do mês.
              <Link href="/medicina/dashboard/assinatura" className="text-amber-400 hover:underline ml-1">
                Fazer upgrade
              </Link>
            </span>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
            placeholder={podePerguntar ? "Digite sua pergunta..." : "Limite de perguntas atingido"}
            disabled={!podePerguntar || loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            onClick={enviarMensagem}
            disabled={!input.trim() || !podePerguntar || loading}
            className="px-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
