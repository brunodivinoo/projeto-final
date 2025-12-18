'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { useConquistas, getNomeCategoria, getCorCategoria } from '@/hooks/useConquistas'

type Categoria = 'todas' | 'estudo' | 'consistencia' | 'social' | 'especial'

export default function ConquistasPage() {
  const {
    conquistas,
    conquistadas,
    pendentes,
    totalConquistas,
    conquistasObtidas,
    porcentagemCompleta,
    loading
  } = useConquistas()

  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria>('todas')
  const [mostrarApenas, setMostrarApenas] = useState<'todas' | 'conquistadas' | 'pendentes'>('todas')

  // Filtrar conquistas
  const conquistasFiltradas = conquistas.filter(c => {
    const passaCategoria = categoriaAtiva === 'todas' || c.categoria === categoriaAtiva
    const passaStatus =
      mostrarApenas === 'todas' ||
      (mostrarApenas === 'conquistadas' && c.conquistada) ||
      (mostrarApenas === 'pendentes' && !c.conquistada)
    return passaCategoria && passaStatus
  })

  // Agrupar por categoria
  const categorias: Categoria[] = ['todas', 'estudo', 'consistencia', 'social', 'especial']

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
        <Header title="Conquistas" />
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#101922]">
      <Header title="Conquistas" />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Conquistas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            Desbloqueie conquistas completando desafios e ganhe XP bônus!
          </p>
        </div>

        {/* Card de progresso geral */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">emoji_events</span>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Progresso Total</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {conquistasObtidas} de {totalConquistas}
                  </p>
                </div>
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Conquistas desbloqueadas</span>
                  <span className="font-bold text-purple-500">{porcentagemCompleta}%</span>
                </div>
                <div className="h-3 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${porcentagemCompleta}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-3 gap-4 lg:w-80">
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-500">{conquistadas.length}</p>
                <p className="text-xs text-slate-500">Obtidas</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-slate-400">{pendentes.length}</p>
                <p className="text-xs text-slate-500">Pendentes</p>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-purple-500">
                  {conquistadas.reduce((acc, c) => acc + c.xpRecompensa, 0)}
                </p>
                <p className="text-xs text-slate-500">XP Ganho</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  categoriaAtiva === cat
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white dark:bg-[#1c252e] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat === 'todas' ? 'Todas' : getNomeCategoria(cat)}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex gap-2 sm:ml-auto">
            {(['todas', 'conquistadas', 'pendentes'] as const).map(status => (
              <button
                key={status}
                onClick={() => setMostrarApenas(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  mostrarApenas === status
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-white dark:bg-[#1c252e] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {status === 'todas' ? 'Todas' : status === 'conquistadas' ? 'Obtidas' : 'Bloqueadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de conquistas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {conquistasFiltradas.map(conquista => {
            const progresso = conquista.progresso || 0
            const meta = conquista.meta || 1
            const porcentagemProgresso = Math.min(Math.round((progresso / meta) * 100), 100)

            return (
              <div
                key={conquista.id}
                className={`relative bg-white dark:bg-[#1c252e] rounded-xl border overflow-hidden transition-all hover:shadow-lg ${
                  conquista.conquistada
                    ? 'border-green-500/30'
                    : 'border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                {/* Badge de conquistada */}
                {conquista.conquistada && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">check</span>
                  </div>
                )}

                <div className="p-4">
                  {/* Ícone */}
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${
                      conquista.conquistada ? '' : 'grayscale'
                    }`}
                    style={{ backgroundColor: `${conquista.cor}20` }}
                  >
                    <span
                      className="material-symbols-outlined text-3xl"
                      style={{ color: conquista.conquistada ? conquista.cor : '#94a3b8' }}
                    >
                      {conquista.icone}
                    </span>
                  </div>

                  {/* Info */}
                  <h3 className={`font-bold mb-1 ${
                    conquista.conquistada ? 'text-slate-900 dark:text-white' : 'text-slate-500'
                  }`}>
                    {conquista.nome}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    {conquista.descricao}
                  </p>

                  {/* Progresso ou data */}
                  {conquista.conquistada ? (
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded"
                        style={{
                          backgroundColor: getCorCategoria(conquista.categoria) + '20',
                          color: getCorCategoria(conquista.categoria)
                        }}
                      >
                        {getNomeCategoria(conquista.categoria)}
                      </span>
                      <span className="text-xs text-green-500 font-medium">
                        +{conquista.xpRecompensa} XP
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{conquista.requisito}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {progresso}/{meta}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${porcentagemProgresso}%`,
                            backgroundColor: conquista.cor
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* XP Reward badge */}
                {!conquista.conquistada && (
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Recompensa</span>
                      <span className="text-xs font-bold text-primary">+{conquista.xpRecompensa} XP</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mensagem se não houver conquistas */}
        {conquistasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
              emoji_events
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Nenhuma conquista encontrada com esses filtros.
            </p>
          </div>
        )}

        {/* Dica */}
        <div className="mt-8 bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            Dicas para desbloquear mais conquistas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>Estude todos os dias para manter sua sequência ativa</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>Complete simulados inteiros para ganhar mais XP</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>Participe do ranking semanal para conquistas sociais</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <p>Experimente todas as ferramentas de IA disponíveis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
