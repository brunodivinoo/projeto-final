'use client'

import { useState, useRef, useEffect } from 'react'
import { useNutriAuth } from '@/contexts/NutriAuthContext'
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  ChefHat,
  Droplets,
  Dumbbell,
  Pill,
  User,
  RefreshCw
} from 'lucide-react'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

const SUGESTOES = [
  { icon: ChefHat, texto: 'Receita rapida para o almoco', tipo: 'receita' },
  { icon: Droplets, texto: 'Como beber mais agua?', tipo: 'dica' },
  { icon: Dumbbell, texto: 'Exercicio seguro pos-parto', tipo: 'treino' },
  { icon: Pill, texto: 'Suplementos na amamentacao', tipo: 'saude' }
]

export default function NutriIAPage() {
  const { user, profile } = useNutriAuth()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversaId, setConversaId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  const enviarMensagem = async (texto?: string) => {
    const mensagem = texto || input.trim()
    if (!mensagem || loading) return

    setInput('')
    setLoading(true)

    // Adicionar mensagem do usuario
    const novaMensagem: Mensagem = { role: 'user', content: mensagem }
    setMensagens(prev => [...prev, novaMensagem])

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem,
          historico: mensagens,
          userId: user?.id,
          conversaId
        })
      })

      const data = await response.json()

      if (data.resposta) {
        setMensagens(prev => [...prev, {
          role: 'assistant',
          content: data.resposta
        }])

        if (data.conversa_id) {
          setConversaId(data.conversa_id)
        }
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
      setMensagens(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const novaConversa = () => {
    setMensagens([])
    setConversaId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Nutri IA</h1>
            <p className="text-sm text-gray-500">Sua nutricionista virtual</p>
          </div>
        </div>
        <button
          onClick={novaConversa}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Nova conversa"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Area de Mensagens */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-pink-100 p-4 space-y-4">
        {mensagens.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-pink-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Ola, {profile?.nome}!
            </h2>
            <p className="text-gray-500 mb-6 max-w-xs">
              Sou sua nutricionista virtual. Posso te ajudar com receitas, dicas de alimentacao, exercicios e muito mais!
            </p>

            {/* Sugestoes */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGESTOES.map((sugestao, i) => (
                <button
                  key={i}
                  onClick={() => enviarMensagem(sugestao.texto)}
                  className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl text-left hover:from-pink-100 hover:to-purple-100 transition-colors"
                >
                  <sugestao.icon className="w-5 h-5 text-pink-500 mb-1" />
                  <p className="text-sm text-gray-700">{sugestao.texto}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {mensagens.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gradient-to-br from-pink-500 to-purple-500 text-white'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-pink-500 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="mt-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            disabled={loading}
            className="flex-1 px-4 py-3 bg-white border-2 border-pink-100 rounded-xl focus:outline-none focus:border-pink-300 transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => enviarMensagem()}
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          A Nutri IA fornece orientacoes gerais. Consulte um profissional para casos especificos.
        </p>
      </div>
    </div>
  )
}
