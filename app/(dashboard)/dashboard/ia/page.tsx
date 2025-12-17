'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'

const ferramentas = [
  { id: 'questoes', icon: 'quiz', label: 'Gerador de Questões', desc: 'Crie simulados personalizados' },
  { id: 'resumo', icon: 'summarize', label: 'Resumidor Inteligente', desc: 'Transforme textos em resumos' },
  { id: 'chat', icon: 'chat', label: 'Chat Tira-Dúvidas', desc: 'Converse com a IA em tempo real' },
]

export default function CentralIAPage() {
  const [tool, setTool] = useState('chat')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: tool })
      })
      const data = await res.json()
      setResponse(data.response || data.error)
    } catch {
      setResponse('Erro ao conectar com a IA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Central IA" />

      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Olá, Estudante</h2>
          <p className="text-[#92adc9]">Potencialize seus estudos com inteligência artificial</p>
        </div>

        {/* Ferramentas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {ferramentas.map(f => (
            <button
              key={f.id}
              onClick={() => setTool(f.id)}
              className={`p-5 rounded-xl border text-left transition-all ${
                tool === f.id
                  ? 'bg-primary/20 border-primary'
                  : 'bg-[#192633] border-[#233648] hover:border-[#324d67]'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                tool === f.id ? 'bg-primary' : 'bg-[#233648]'
              }`}>
                <span className="material-symbols-outlined text-white text-2xl">{f.icon}</span>
              </div>
              <h3 className="text-white font-bold mb-1">{f.label}</h3>
              <p className="text-[#92adc9] text-sm">{f.desc}</p>
            </button>
          ))}
        </div>

        {/* Chat Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#192633] rounded-xl border border-[#233648] flex flex-col">
            {/* Response */}
            <div className="flex-1 p-6 min-h-[300px] max-h-[500px] overflow-y-auto">
              {response ? (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-white text-sm font-normal bg-transparent p-0">{response}</pre>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#92adc9]">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl mb-2">psychology</span>
                    <p>Envie uma mensagem para começar</p>
                  </div>
                </div>
              )}
              {loading && (
                <div className="flex items-center gap-2 text-primary">
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm">Gerando resposta...</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[#233648]">
              <div className="flex gap-3">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                  placeholder={
                    tool === 'questoes' ? 'Ex: Gere 5 questões sobre Revolução Francesa...' :
                    tool === 'resumo' ? 'Cole o texto que deseja resumir...' :
                    'Digite sua dúvida...'
                  }
                  className="flex-1 bg-[#111a22] border border-[#324d67] rounded-lg p-3 text-white placeholder:text-[#92adc9] resize-none focus:border-primary focus:outline-none"
                  rows={2}
                />
                <Button onClick={handleSubmit} loading={loading} className="self-end">
                  <span className="material-symbols-outlined">send</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-[#192633] rounded-xl border border-[#233648] p-5">
            <h3 className="text-white font-bold mb-4">Sugestões</h3>
            <div className="space-y-3">
              {[
                'Gere 5 questões de matemática sobre funções',
                'Resuma o período da Guerra Fria',
                'Explique as leis de Newton',
                'Crie flashcards sobre biologia celular',
              ].map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="w-full text-left p-3 rounded-lg bg-[#111a22] border border-[#324d67] text-[#92adc9] text-sm hover:border-primary hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
