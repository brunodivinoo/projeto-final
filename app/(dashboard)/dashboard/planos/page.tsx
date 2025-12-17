'use client'
import { Header } from '@/components/layout/Header'
import { useState } from 'react'

interface Materia {
  id: number
  nome: string
  icon: string
  color: string
  dificuldade: number
  dificuldadeTexto: string
  accentColor: string
}

export default function PlanosPage() {
  const [nomePlano, setNomePlano] = useState('Plano Intensivo ENEM 2024')
  const [focoPrincipal, setFocoPrincipal] = useState('Aprovação em Medicina')
  const [aiSugestoes, setAiSugestoes] = useState(true)
  const [materias, setMaterias] = useState<Materia[]>([
    { id: 1, nome: 'Matemática', icon: 'calculate', color: 'orange', dificuldade: 5, dificuldadeTexto: 'Alta', accentColor: 'orange-500' },
    { id: 2, nome: 'Física', icon: 'science', color: 'blue', dificuldade: 3, dificuldadeTexto: 'Média', accentColor: 'blue-500' },
    { id: 3, nome: 'Biologia', icon: 'biotech', color: 'green', dificuldade: 2, dificuldadeTexto: 'Baixa', accentColor: 'green-500' },
  ])

  const [disponibilidade, setDisponibilidade] = useState([
    [true, false, true, false, true, false, false], // Manhã
    [false, true, false, true, false, true, true], // Tarde
    [true, true, true, true, false, false, false], // Noite
  ])

  const getDificuldadeInfo = (valor: number) => {
    if (valor >= 4) return { texto: 'Alta', cor: 'orange-500' }
    if (valor >= 3) return { texto: 'Média', cor: 'blue-500' }
    return { texto: 'Baixa', cor: 'green-500' }
  }

  const handleDificuldadeChange = (id: number, valor: number) => {
    setMaterias(materias.map(m => {
      if (m.id === id) {
        const info = getDificuldadeInfo(valor)
        return { ...m, dificuldade: valor, dificuldadeTexto: info.texto, accentColor: info.cor }
      }
      return m
    }))
  }

  const toggleDisponibilidade = (periodo: number, dia: number) => {
    const newDisp = [...disponibilidade]
    newDisp[periodo][dia] = !newDisp[periodo][dia]
    setDisponibilidade(newDisp)
  }

  const removerMateria = (id: number) => {
    setMaterias(materias.filter(m => m.id !== id))
  }

  const totalHoras = disponibilidade.flat().filter(Boolean).length * 3
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
  const periodos = ['Manhã', 'Tarde', 'Noite']

  return (
    <div className="min-h-screen">
      <Header title="Planos de Estudo" />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white">
            Configure seu cronograma
          </h1>
          <p className="text-slate-400 text-base">
            Defina suas metas, adicione as matérias que precisa focar e marque seus horários livres.
          </p>
        </div>

        {/* Progresso */}
        <div className="bg-[#1c2127] p-5 rounded-xl border border-slate-700 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-primary">Passo 2 de 3: Matérias e Preferências</span>
            <span className="text-sm font-bold text-white">66%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: '66%' }}></div>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Objetivos Principais */}
            <div className="bg-[#1c2127] p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary">flag</span>
                Objetivos Principais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-400">Nome do Plano</span>
                  <input
                    className="w-full rounded-lg border-slate-700 bg-[#101922] text-white px-4 py-3 text-sm focus:border-primary focus:ring-primary"
                    type="text"
                    value={nomePlano}
                    onChange={(e) => setNomePlano(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-400">Foco Principal</span>
                  <select
                    className="w-full rounded-lg border-slate-700 bg-[#101922] text-white px-4 py-3 text-sm focus:border-primary focus:ring-primary"
                    value={focoPrincipal}
                    onChange={(e) => setFocoPrincipal(e.target.value)}
                  >
                    <option>Aprovação em Medicina</option>
                    <option>Concurso Público</option>
                    <option>Reforço Escolar</option>
                    <option>Aprendizado de Idiomas</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Matérias e Dificuldade */}
            <div className="bg-[#1c2127] p-6 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-primary">library_books</span>
                  Matérias e Dificuldade
                </h3>
                <button className="text-xs font-bold text-primary hover:text-blue-400 bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                  + Adicionar
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {materias.map((materia) => (
                  <div
                    key={materia.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border border-slate-700 bg-[#101922]"
                  >
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <div className={`size-8 rounded-full bg-${materia.color}-500/20 text-${materia.color}-500 flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-sm">{materia.icon}</span>
                      </div>
                      <span className="font-medium text-sm text-white">{materia.nome}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Dificuldade</span>
                        <span className={`text-${materia.accentColor} font-bold`}>{materia.dificuldadeTexto}</span>
                      </div>
                      <input
                        className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-${materia.color}-500`}
                        type="range"
                        min="1"
                        max="5"
                        value={materia.dificuldade}
                        onChange={(e) => handleDificuldadeChange(materia.id, parseInt(e.target.value))}
                      />
                    </div>
                    <button
                      onClick={() => removerMateria(materia.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-2 self-end sm:self-center"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Disponibilidade Semanal */}
            <div className="bg-[#1c2127] p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Disponibilidade Semanal
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Clique nos blocos para marcar seus horários livres para estudo.
              </p>
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[500px] grid grid-cols-8 gap-1 text-center text-sm">
                  <div className="h-8"></div>
                  {dias.map((dia) => (
                    <div key={dia} className="font-bold text-slate-400">{dia}</div>
                  ))}
                  {periodos.map((periodo, pIdx) => (
                    <>
                      <div key={`label-${periodo}`} className="flex items-center justify-end pr-2 text-xs font-medium text-slate-400">
                        {periodo}
                      </div>
                      {dias.map((_, dIdx) => (
                        <button
                          key={`${pIdx}-${dIdx}`}
                          onClick={() => toggleDisponibilidade(pIdx, dIdx)}
                          className={`h-10 rounded transition-colors ${
                            disponibilidade[pIdx][dIdx]
                              ? 'bg-primary/20 border border-primary/40 hover:bg-primary/30'
                              : 'bg-[#101922] border border-transparent hover:border-slate-700'
                          }`}
                        />
                      ))}
                    </>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-primary/20 border border-primary/40 rounded"></div>
                  <span className="text-slate-400">Livre para Estudar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 bg-[#101922] border border-slate-700 rounded"></div>
                  <span className="text-slate-400">Ocupado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Direita */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Resumo do Plano */}
            <div className="bg-[#1c2127] p-6 rounded-xl border border-slate-700 sticky top-6">
              <h3 className="text-lg font-bold mb-4 text-white">Resumo do Plano</h3>
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-sm text-slate-400">Total de Matérias</span>
                  <span className="font-bold text-white">{materias.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-sm text-slate-400">Horas Semanais</span>
                  <span className="font-bold text-primary">{totalHoras}h</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-400">Data da Prova</span>
                  <span className="font-bold text-white">03/11/2024</span>
                </div>
              </div>

              {/* Toggle IA */}
              <div className="bg-[#101922] p-4 rounded-lg flex items-center justify-between mb-6 border border-slate-700">
                <div className="flex flex-col">
                  <span className="text-sm font-bold flex items-center gap-1 text-white">
                    <span className="material-symbols-outlined text-primary text-base">auto_awesome</span>
                    Sugestões via IA
                  </span>
                  <span className="text-xs text-slate-400">Otimizar horários auto</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={aiSugestoes}
                    onChange={(e) => setAiSugestoes(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Botões */}
              <div className="flex flex-col gap-3">
                <button className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                  <span>Gerar Plano</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <button className="w-full bg-transparent hover:bg-slate-800 text-slate-400 font-medium py-3 px-4 rounded-lg transition-colors text-sm">
                  Salvar rascunho
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-slate-400">
                  Você poderá compartilhar este plano com seu grupo de estudos na próxima etapa.
                </p>
              </div>
            </div>

            {/* Dica de Estudo */}
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-6 rounded-xl relative overflow-hidden hidden lg:block">
              <div className="relative z-10">
                <span className="material-symbols-outlined text-white/80 text-3xl mb-2">lightbulb</span>
                <h4 className="text-white font-bold text-lg mb-1">Dica de Estudo</h4>
                <p className="text-white/70 text-sm">
                  Intercale matérias de exatas e humanas para manter o cérebro ativo por mais tempo.
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 size-24 bg-white/10 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
