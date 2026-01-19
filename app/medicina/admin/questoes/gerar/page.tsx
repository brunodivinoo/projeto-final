'use client'

import { QuestaoGenerator } from '@/components/admin/QuestaoGenerator'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GerarQuestoesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/medicina/admin"
            className="flex items-center gap-2 text-white/60 hover:text-white mb-2 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Gerar Questões com IA
          </h1>
          <p className="text-white/60 mt-1">
            Configure e gere questões em lote usando inteligência artificial
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
        <h3 className="text-cyan-400 font-medium mb-2">Como funciona</h3>
        <ul className="text-white/60 text-sm space-y-1">
          <li>1. Selecione a disciplina e os assuntos para gerar questões</li>
          <li>2. Escolha os períodos (níveis de dificuldade) - do 1º ao 12º período</li>
          <li>3. Defina a quantidade de questões por assunto/período</li>
          <li>4. Clique em &quot;Iniciar Geração&quot; e acompanhe em tempo real</li>
          <li>5. As questões são salvas automaticamente com referências ABNT</li>
        </ul>
      </div>

      {/* Gerador */}
      <QuestaoGenerator />
    </div>
  )
}
