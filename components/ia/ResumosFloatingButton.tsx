'use client'

import { useState, useEffect, useRef } from 'react'
import { useResumos } from '@/contexts/ResumosContext'

export default function ResumosFloatingButton() {
  const { resumos, carregarResumos, abrirResumo, loading } = useResumos()
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Carregar resumos ao montar
  useEffect(() => {
    carregarResumos()
  }, [carregarResumos])

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (resumos.length === 0) return null

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-30">
      {/* Menu de resumos */}
      {menuAberto && (
        <div className="absolute bottom-16 right-0 w-80 max-h-96 bg-white dark:bg-[#1C252E] rounded-xl shadow-2xl border border-gray-200 dark:border-[#283039] overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="p-4 border-b border-gray-200 dark:border-[#283039] bg-gradient-to-r from-purple-500/10 to-purple-600/5">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">summarize</span>
              Meus Resumos
            </h3>
            <p className="text-xs text-[#9dabb9] mt-1">Acesse seus resumos rapidamente</p>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-[#9dabb9]">
                <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
                Carregando...
              </div>
            ) : (
              resumos.slice(0, 5).map((resumo) => (
                <button
                  key={resumo.id}
                  onClick={() => {
                    abrirResumo(resumo)
                    setMenuAberto(false)
                  }}
                  className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-[#283039] border-b border-gray-100 dark:border-[#283039] last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
                      <span className="material-symbols-outlined text-sm">summarize</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {resumo.titulo}
                      </p>
                      <p className="text-xs text-[#9dabb9] mt-0.5">
                        {resumo.disciplina || 'Sem disciplina'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {resumos.length > 5 && (
            <div className="p-3 border-t border-gray-200 dark:border-[#283039] bg-gray-50 dark:bg-[#141A21]">
              <a
                href="/dashboard/ia"
                className="text-xs text-purple-500 hover:text-purple-600 font-medium flex items-center justify-center gap-1"
              >
                Ver todos os {resumos.length} resumos
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setMenuAberto(!menuAberto)}
        className={`group relative p-4 rounded-full shadow-lg transition-all duration-200 ${
          menuAberto
            ? 'bg-purple-600 text-white shadow-purple-500/30'
            : 'bg-white dark:bg-[#1C252E] text-purple-500 hover:bg-purple-50 dark:hover:bg-[#283039] border border-gray-200 dark:border-[#283039]'
        }`}
        title="Meus Resumos"
      >
        <span className="material-symbols-outlined text-2xl">
          {menuAberto ? 'close' : 'summarize'}
        </span>

        {/* Badge de quantidade */}
        {!menuAberto && resumos.length > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {resumos.length > 9 ? '9+' : resumos.length}
          </span>
        )}
      </button>
    </div>
  )
}
