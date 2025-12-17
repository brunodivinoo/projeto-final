'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Deck = { id: string; nome: string; total_cards: number; progresso: number; materia: string }

export default function FlashcardsPage() {
  const { user } = useAuth()
  const [showCard, setShowCard] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [aiTopic, setAiTopic] = useState('')
  const [generatingCards, setGeneratingCards] = useState(false)

  const cards = [
    { frente: 'Qual é o principal pigmento utilizado na fotossíntese?', verso: 'Clorofila' },
    { frente: 'Onde ocorre a respiração celular?', verso: 'Mitocôndrias' },
    { frente: 'O que é ATP?', verso: 'Adenosina trifosfato - molécula de energia' },
  ]

  useEffect(() => {
    if (user) loadDecks()
  }, [user])

  const loadDecks = async () => {
    const { data } = await supabase.from('flashcard_decks').select('*').eq('user_id', user?.id)
    if (data && data.length > 0) {
      setDecks(data as Deck[])
      setSelectedDeck(data[0] as Deck)
    }
  }

  const createDeck = async () => {
    if (!user) return
    const nome = prompt('Nome do deck:')
    if (!nome) return

    const { data } = await supabase.from('flashcard_decks').insert({
      user_id: user.id,
      nome,
      materia: 'Geral'
    }).select().single()

    if (data) {
      setDecks([...decks, data as Deck])
      setSelectedDeck(data as Deck)
    }
  }

  const generateCards = async () => {
    if (!aiTopic.trim()) return
    setGeneratingCards(true)
    setTimeout(() => {
      setGeneratingCards(false)
      setAiTopic('')
    }, 2000)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#101922] text-white">
      {/* Header */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-800 bg-[#1c252e] px-6 py-3 z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-[#137fec] text-3xl">psychology</span>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Flashcards por IA</h2>
          </div>
          <label className="hidden md:flex flex-col min-w-40 !h-10 w-64">
            <div className="flex w-full flex-1 items-stretch rounded-lg h-full bg-[#101922] border border-transparent focus-within:border-[#137fec] transition-colors">
              <div className="text-slate-400 flex items-center justify-center pl-3">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg bg-transparent border-none text-white focus:outline-0 focus:ring-0 placeholder:text-slate-400 px-3 text-sm font-normal leading-normal"
                placeholder="Pesquisar baralhos ou cartões..."
              />
            </div>
          </label>
        </div>
        <div className="flex flex-1 justify-end gap-6 items-center">
          <button className="flex items-center justify-center text-slate-300 hover:text-[#137fec] transition-colors relative">
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            <span className="absolute top-0.5 right-0.5 size-2 bg-red-500 rounded-full border-2 border-[#1c252e]"></span>
          </button>
          <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-slate-700 cursor-pointer relative" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBuL_iL8rFlY4OKO968cr02-sadxjHdSLUccagC4GuNiL5Kwwmm3Rf_W_78IYqQ7vNn--SZDv4D9q6S2_CPg5oNlMIaogL90Mg5M1lhvG7PN-z-3FJf6bTyQehqLLv1JDv2vGEhdEwiCmAmFB4Oj-AEBpkfgIHOjC5A1IxDrkBF3Yy0MU91uyrhA4hKWCzVjo47xtylTGuTOxNN3ruNiF00144dowHfN0gHRVrnn-q0yRGKYHb2HiCJ1emV198JmWzAu1Rx6N9_a9Q")' }}>
            <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-[#1c252e]"></div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#1c252e] border-r border-slate-800">
          <div className="flex flex-col flex-1 p-4 gap-1.5 overflow-y-auto">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">home</span>
              <span className="text-sm font-medium flex-1">Página Inicial</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] text-purple-500 group-hover:text-purple-600 transition-colors">auto_awesome</span>
              <span className="text-sm font-medium flex-1">Central IA</span>
            </a>
            <div className="px-3 pt-4 pb-2">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Estudos</h3>
            </div>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#137fec]/10 text-[#137fec] group transition-all" href="#">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>style</span>
              <span className="text-sm font-medium flex-1">Flashcards</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">quiz</span>
              <span className="text-sm font-medium flex-1">Questões</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">assignment_turned_in</span>
              <span className="text-sm font-medium flex-1">Simulados</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">donut_large</span>
              <span className="text-sm font-medium flex-1">Ciclos de Estudo</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">history</span>
              <span className="text-sm font-medium flex-1">Revisões</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">calendar_month</span>
              <span className="text-sm font-medium flex-1">Planos de Estudo</span>
            </a>
            <div className="px-3 pt-4 pb-2">
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Comunidade</h3>
            </div>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">groups</span>
              <span className="text-sm font-medium flex-1">Social</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-all group" href="#">
              <span className="material-symbols-outlined text-[20px] group-hover:text-[#137fec] transition-colors">person</span>
              <span className="text-sm font-medium flex-1">Perfil do Usuário</span>
            </a>
          </div>
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={createDeck}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 text-white px-4 py-3 text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Criar Novo Deck
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#101922] relative">
          <div className="max-w-4xl w-full mx-auto flex flex-col flex-1 h-full p-6 lg:p-10 gap-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <span>Flashcards</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                  <span>Biologia</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Fotossíntese</h1>
                <p className="text-slate-400 text-sm font-medium">Revisando 20 cartões • Vence hoje</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 items-center rounded-lg bg-slate-800 p-1">
                  <label className="cursor-pointer h-full flex items-center px-4 rounded-md bg-[#1c252e] shadow-sm text-white text-sm font-medium transition-all">
                    <span className="material-symbols-outlined text-[18px] mr-2">style</span>
                    Estudar
                    <input checked readOnly className="hidden" name="view-mode" type="radio" value="study"/>
                  </label>
                  <label className="cursor-pointer h-full flex items-center px-4 rounded-md text-slate-500 hover:text-white text-sm font-medium transition-all">
                    <span className="material-symbols-outlined text-[18px] mr-2">grid_view</span>
                    Grade
                    <input className="hidden" name="view-mode" type="radio" value="grid"/>
                  </label>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end text-sm">
                <span className="text-white font-medium">Progresso da Sessão</span>
                <span className="text-slate-500">9 / 20</span>
              </div>
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#137fec] rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 flex flex-col justify-center items-center min-h-[400px]">
              <div className="group relative w-full max-w-2xl aspect-[3/2]">
                <div
                  onClick={() => setShowCard(!showCard)}
                  className="relative w-full h-full duration-500 cursor-pointer"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute inset-0 w-full h-full bg-[#1c252e] rounded-2xl shadow-xl border border-slate-700 flex flex-col items-center justify-center p-8 md:p-12 text-center z-10">
                    <span className="absolute top-6 left-6 text-xs font-bold tracking-widest text-slate-400 uppercase">
                      {showCard ? 'Resposta' : 'Questão'}
                    </span>
                    <p className="text-2xl md:text-3xl font-medium text-white leading-snug">
                      {showCard ? cards[currentCard].verso : cards[currentCard].frente}
                    </p>
                    <div className="absolute bottom-6 text-slate-400 text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-lg">touch_app</span>
                      Clique para virar
                    </div>
                  </div>
                </div>
              </div>

              {/* Difficulty Buttons */}
              <div className="mt-8 flex flex-wrap justify-center gap-4 w-full max-w-2xl">
                <button
                  onClick={() => { setCurrentCard(c => Math.min(cards.length - 1, c + 1)); setShowCard(false) }}
                  className="flex-1 min-w-[100px] py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xs uppercase tracking-wider opacity-70">Difícil</span>
                  <span className="text-sm font-bold">1m</span>
                </button>
                <button
                  onClick={() => { setCurrentCard(c => Math.min(cards.length - 1, c + 1)); setShowCard(false) }}
                  className="flex-1 min-w-[100px] py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 font-medium hover:bg-yellow-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xs uppercase tracking-wider opacity-70">Médio</span>
                  <span className="text-sm font-bold">10m</span>
                </button>
                <button
                  onClick={() => { setCurrentCard(c => Math.min(cards.length - 1, c + 1)); setShowCard(false) }}
                  className="flex-1 min-w-[100px] py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-500 font-medium hover:bg-green-500/20 transition-colors flex flex-col items-center gap-1"
                >
                  <span className="text-xs uppercase tracking-wider opacity-70">Fácil</span>
                  <span className="text-sm font-bold">4d</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - AI Generator */}
        <aside className="hidden xl:flex flex-col w-80 bg-[#1c252e] border-l border-slate-800">
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white">
              <span className="material-symbols-outlined text-purple-500">auto_awesome</span>
              <h3 className="font-bold text-base">Gerador IA</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
            {/* Generate by Topic */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gerar por Tópico</label>
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="w-full h-32 bg-[#101922] border-transparent focus:border-[#137fec] focus:ring-0 rounded-lg text-sm text-white p-3 resize-none placeholder:text-slate-400"
                placeholder="ex: Explique os estágios da Mitose ou cole um parágrafo do seu livro..."
              />
              <div className="flex gap-2">
                <button
                  onClick={generateCards}
                  disabled={generatingCards}
                  className="flex-1 bg-[#137fec] hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  {generatingCards ? 'Gerando...' : 'Gerar Cartões'}
                </button>
              </div>
            </div>

            {/* Drafts */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rascunhos</label>
                <button className="text-xs text-[#137fec] hover:underline">Limpar tudo</button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="bg-[#101922] p-3 rounded-lg border border-transparent hover:border-slate-600 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-white">Revolução Francesa</span>
                    <span className="text-[10px] text-slate-500">2m atrás</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">gerados 5 cartões sobre a queda da Bastilha e figuras chave...</p>
                  <div className="mt-2 flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button className="text-[10px] bg-slate-700 px-2 py-1 rounded shadow-sm hover:text-[#137fec]">Revisar</button>
                    <button className="text-[10px] bg-slate-700 px-2 py-1 rounded shadow-sm hover:text-green-500">Adicionar</button>
                  </div>
                </div>
                <div className="bg-[#101922] p-3 rounded-lg border border-transparent hover:border-slate-600 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-white">Derivadas de Cálculo</span>
                    <span className="text-[10px] text-slate-500">1h atrás</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">Regras básicas de diferenciação incluindo regra da potência.</p>
                </div>
              </div>
            </div>

            {/* Pro Tip */}
            <div className="mt-auto bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-purple-400 text-xl">tips_and_updates</span>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-white">Dica Pro</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Você pode enviar um PDF das suas anotações para gerar um baralho completo instantaneamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
