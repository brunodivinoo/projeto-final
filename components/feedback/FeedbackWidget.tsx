'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquarePlus,
  X,
  Bug,
  Lightbulb,
  Heart,
  HelpCircle,
  MoreHorizontal,
  Send,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { useMedAuth } from '@/contexts/MedAuthContext'

const tiposFeedback = [
  { id: 'bug', label: 'Bug', icon: Bug, cor: 'text-red-400 bg-red-500/20', descricao: 'Algo não funcionou' },
  { id: 'sugestao', label: 'Sugestão', icon: Lightbulb, cor: 'text-amber-400 bg-amber-500/20', descricao: 'Ideia de melhoria' },
  { id: 'elogio', label: 'Elogio', icon: Heart, cor: 'text-pink-400 bg-pink-500/20', descricao: 'Algo que gostou' },
  { id: 'duvida', label: 'Dúvida', icon: HelpCircle, cor: 'text-blue-400 bg-blue-500/20', descricao: 'Preciso de ajuda' },
  { id: 'outro', label: 'Outro', icon: MoreHorizontal, cor: 'text-gray-400 bg-gray-500/20', descricao: 'Outro assunto' }
]

export function FeedbackWidget() {
  const { user } = useMedAuth()
  const [aberto, setAberto] = useState(false)
  const [etapa, setEtapa] = useState<'tipo' | 'form' | 'sucesso'>('tipo')
  const [tipo, setTipo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)

  const resetar = useCallback(() => {
    setEtapa('tipo')
    setTipo('')
    setTitulo('')
    setDescricao('')
  }, [])

  const fechar = useCallback(() => {
    setAberto(false)
    setTimeout(resetar, 300)
  }, [resetar])

  const selecionarTipo = useCallback((tipoId: string) => {
    setTipo(tipoId)
    setEtapa('form')
  }, [])

  const enviar = useCallback(async () => {
    if (!titulo.trim() || !descricao.trim()) return

    setEnviando(true)

    try {
      await fetch('/api/medicina/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          tipo,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          pagina: window.location.pathname,
          userAgent: navigator.userAgent
        })
      })

      setEtapa('sucesso')
      setTimeout(fechar, 2000)

    } catch (error) {
      console.error('Erro ao enviar feedback:', error)
    } finally {
      setEnviando(false)
    }
  }, [titulo, descricao, tipo, user, fechar])

  const tipoInfo = tiposFeedback.find(t => t.id === tipo)

  return (
    <>
      {/* Botão flutuante - pequeno e discreto */}
      <AnimatePresence>
        {!aberto && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setAberto(true)}
            className="fixed bottom-4 left-4 z-40 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all shadow-lg"
            title="Enviar feedback"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal de feedback */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={fechar}
          >
            {/* Overlay sutil */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

            {/* Card */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-slate-900 border border-white/10 rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {etapa === 'form' && tipoInfo && (
                    <button
                      onClick={() => setEtapa('tipo')}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      ←
                    </button>
                  )}
                  <span className="text-white font-medium text-sm">
                    {etapa === 'tipo' && 'Enviar Feedback'}
                    {etapa === 'form' && tipoInfo?.label}
                    {etapa === 'sucesso' && 'Obrigado!'}
                  </span>
                </div>
                <button
                  onClick={fechar}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo */}
              <div className="p-4">
                {/* Etapa 1: Escolher tipo */}
                {etapa === 'tipo' && (
                  <div className="grid grid-cols-2 gap-2">
                    {tiposFeedback.map(t => {
                      const Icon = t.icon
                      return (
                        <button
                          key={t.id}
                          onClick={() => selecionarTipo(t.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.cor}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-white text-sm font-medium">{t.label}</span>
                          <span className="text-white/40 text-xs">{t.descricao}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Etapa 2: Formulário */}
                {etapa === 'form' && (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                        placeholder="Título breve..."
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <textarea
                        value={descricao}
                        onChange={e => setDescricao(e.target.value)}
                        placeholder="Descreva com detalhes..."
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-emerald-500 resize-none"
                        maxLength={1000}
                      />
                    </div>
                    <button
                      onClick={enviar}
                      disabled={!titulo.trim() || !descricao.trim() || enviando}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {enviando ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Feedback
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Etapa 3: Sucesso */}
                {etapa === 'sucesso' && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-white font-medium">Feedback enviado!</p>
                    <p className="text-white/60 text-sm mt-1">Obrigado por nos ajudar a melhorar</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
