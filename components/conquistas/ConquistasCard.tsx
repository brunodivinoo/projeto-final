'use client'
import { useConquistas } from '@/hooks/useConquistas'
import Link from 'next/link'

export function ConquistasCard() {
  const {
    conquistadas,
    pendentes,
    totalConquistas,
    conquistasObtidas,
    porcentagemCompleta,
    loading
  } = useConquistas()

  // Pegar as últimas 3 conquistas obtidas
  const ultimasConquistadas = conquistadas.slice(0, 3)

  // Pegar as próximas 2 conquistas mais próximas de serem desbloqueadas
  const proximasConquistas = pendentes
    .filter(c => c.progresso && c.meta)
    .sort((a, b) => {
      const progressoA = ((a.progresso || 0) / (a.meta || 1)) * 100
      const progressoB = ((b.progresso || 0) / (b.meta || 1)) * 100
      return progressoB - progressoA
    })
    .slice(0, 2)

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-[#1c252e] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">emoji_events</span>
            Conquistas
          </h3>
          <span className="text-sm font-bold text-purple-500">
            {conquistasObtidas}/{totalConquistas}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${porcentagemCompleta}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">{porcentagemCompleta}% completo</p>
      </div>

      {/* Últimas conquistas */}
      {ultimasConquistadas.length > 0 && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Últimas obtidas</p>
          <div className="flex gap-2">
            {ultimasConquistadas.map(conquista => (
              <div
                key={conquista.id}
                className="flex-1 p-2 rounded-lg text-center"
                style={{ backgroundColor: `${conquista.cor}15` }}
                title={conquista.nome}
              >
                <div
                  className="w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${conquista.cor}30` }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: conquista.cor }}
                  >
                    {conquista.icone}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {conquista.nome}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximas conquistas */}
      {proximasConquistas.length > 0 && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Quase lá!</p>
          <div className="space-y-2">
            {proximasConquistas.map(conquista => {
              const progresso = conquista.progresso || 0
              const meta = conquista.meta || 1
              const porcentagem = Math.min(Math.round((progresso / meta) * 100), 100)

              return (
                <div
                  key={conquista.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center opacity-60"
                    style={{ backgroundColor: `${conquista.cor}20` }}
                  >
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: conquista.cor }}
                    >
                      {conquista.icone}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {conquista.nome}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${porcentagem}%`,
                            backgroundColor: conquista.cor
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500">{porcentagem}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4">
        <Link
          href="/dashboard/conquistas"
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
        >
          Ver todas as conquistas
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  )
}
