'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'

const questoesExemplo = [
  {
    id: 1,
    materia: 'Português',
    topico: 'Crase',
    enunciado: 'Assinale a alternativa em que o sinal indicativo de crase foi empregado em conformidade com a norma-padrão da língua portuguesa.',
    opcoes: ['A) Ela referiu-se à ele com muito respeito durante a reunião.', 'B) Fomos àquele texto que você mencionou na semana passada.', 'C) O documento foi entregue à Vossa Senhoria ontem à tarde.', 'D) Não direi nada à linguagem sobre a ocorrida.', 'E) Ela foi à pé até a escola.'],
    resposta: 'B',
    explicacao: 'A crase ocorre na fusão da preposição "a" com o artigo "a" ou com os pronomes demonstrativos "aquele(s)", "aquela(s)", "aquilo".',
  },
]

export default function QuestoesPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [showResposta, setShowResposta] = useState(false)
  const questao = questoesExemplo[0]

  return (
    <div className="min-h-screen">
      <Header title="Banco de Questões" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Banco de Questões</h2>
            <p className="text-[#92adc9]">Explore mais de 24.300 questões filtradas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question */}
          <div className="lg:col-span-3 space-y-4">
            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">Inéditas</span>
              <span className="px-3 py-1 rounded-full bg-[#233648] text-[#92adc9] text-xs">Errei anteriormente</span>
              <span className="px-3 py-1 rounded-full bg-[#233648] text-[#92adc9] text-xs">Comentadas</span>
              <span className="px-3 py-1 rounded-full bg-[#233648] text-[#92adc9] text-xs">Minhas anotações</span>
            </div>

            {/* Question Card */}
            <div className="bg-[#192633] rounded-xl border border-[#233648] p-6">
              <div className="flex items-center gap-2 text-[#92adc9] text-sm mb-4">
                <span>ENEM</span>
                <span>•</span>
                <span>{questao.materia}</span>
                <span>•</span>
                <span>{questao.topico}</span>
              </div>

              <p className="text-white mb-6">{questao.enunciado}</p>

              <div className="space-y-3">
                {questao.opcoes.map((opcao, i) => {
                  const letra = opcao[0]
                  const isSelected = selected === letra
                  const isCorrect = showResposta && letra === questao.resposta
                  const isWrong = showResposta && isSelected && letra !== questao.resposta

                  return (
                    <button
                      key={i}
                      onClick={() => !showResposta && setSelected(letra)}
                      disabled={showResposta}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isCorrect ? 'bg-green-500/20 border-green-500 text-green-400' :
                        isWrong ? 'bg-red-500/20 border-red-500 text-red-400' :
                        isSelected ? 'bg-primary/20 border-primary text-white' :
                        'bg-[#111a22] border-[#324d67] text-[#92adc9] hover:border-[#92adc9]'
                      }`}
                    >
                      {opcao}
                    </button>
                  )
                })}
              </div>

              {showResposta && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-bold mb-2">Resposta: {questao.resposta}</p>
                  <p className="text-[#92adc9] text-sm">{questao.explicacao}</p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setShowResposta(true)}
                  disabled={!selected || showResposta}
                  className="px-6 py-3 rounded-lg bg-primary text-white font-bold disabled:opacity-50 hover:bg-[#0f6ac6] transition-colors"
                >
                  Responder
                </button>
                {showResposta && (
                  <button
                    onClick={() => { setSelected(null); setShowResposta(false) }}
                    className="px-6 py-3 rounded-lg bg-[#233648] text-white font-bold hover:bg-[#2f465c] transition-colors"
                  >
                    Próxima Questão
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#192633] rounded-xl border border-[#233648] p-5 h-fit">
            <h3 className="text-white font-bold mb-4">Filtros</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[#92adc9] text-sm block mb-2">Disciplina</label>
                <select className="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white">
                  <option>Português</option>
                  <option>Matemática</option>
                  <option>História</option>
                  <option>Biologia</option>
                </select>
              </div>
              <div>
                <label className="text-[#92adc9] text-sm block mb-2">Dificuldade</label>
                <select className="w-full bg-[#111a22] border border-[#324d67] rounded-lg p-2 text-white">
                  <option>Todas</option>
                  <option>Fácil</option>
                  <option>Médio</option>
                  <option>Difícil</option>
                </select>
              </div>
              <button className="w-full py-2 rounded-lg bg-primary text-white font-bold hover:bg-[#0f6ac6] transition-colors">
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
