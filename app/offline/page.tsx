// ============================================================
// Offline Page - Pagina exibida quando usuario esta offline
// ============================================================
// Esta pagina e servida pelo Service Worker quando o usuario
// tenta acessar uma pagina que nao esta em cache e esta offline
// ============================================================

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline | StudyHub',
  description: 'Voce esta offline. Conecte-se a internet para continuar.',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-violet-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icone de Offline */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-200/50">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
        </div>

        {/* Titulo */}
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Voce esta offline
        </h1>

        {/* Descricao */}
        <p className="text-slate-600 mb-8 leading-relaxed">
          Parece que voce perdeu a conexao com a internet.
          Verifique sua conexao e tente novamente.
        </p>

        {/* Card de Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-slate-700 font-medium">Aguardando conexao...</span>
          </div>

          <p className="text-sm text-slate-500">
            A pagina sera atualizada automaticamente quando a conexao for restaurada.
          </p>
        </div>

        {/* Dicas */}
        <div className="text-left bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-slate-100">
          <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            O que voce pode fazer:
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">1.</span>
              Verifique se o Wi-Fi ou dados moveis estao ativados
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">2.</span>
              Tente se aproximar do roteador
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">3.</span>
              Reinicie seu roteador ou modem
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">4.</span>
              Entre em contato com seu provedor de internet
            </li>
          </ul>
        </div>

        {/* Botao de Tentar Novamente */}
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
        >
          Tentar novamente
        </button>

        {/* Logo do App */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="font-medium">StudyHub</span>
          </div>
        </div>
      </div>

      {/* Script para auto-reconexao */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Verifica conexao e recarrega automaticamente
            window.addEventListener('online', function() {
              window.location.reload();
            });
          `,
        }}
      />
    </div>
  )
}
