'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Stethoscope,
  GraduationCap,
  FileQuestion,
  Brain,
  Sparkles,
  ChevronDown,
  Lock
} from 'lucide-react'
import { useMedAuth } from '@/contexts/MedAuthContext'

export type ChatMode = 'chat' | 'caso_clinico' | 'tutor' | 'questoes'

interface ChatModeConfig {
  id: ChatMode
  nome: string
  descricao: string
  icon: React.ElementType
  cor: string
  corBg: string
  premium?: boolean
  residencia?: boolean
}

export const CHAT_MODES: ChatModeConfig[] = [
  {
    id: 'chat',
    nome: 'Chat Livre',
    descricao: 'Tire dúvidas e converse livremente',
    icon: MessageSquare,
    cor: 'text-blue-400',
    corBg: 'bg-blue-500/20'
  },
  {
    id: 'caso_clinico',
    nome: 'Caso Clínico',
    descricao: 'Pratique com casos interativos',
    icon: Stethoscope,
    cor: 'text-emerald-400',
    corBg: 'bg-emerald-500/20',
    premium: true
  },
  {
    id: 'tutor',
    nome: 'Modo Tutor',
    descricao: 'Aprendizado socrático guiado',
    icon: GraduationCap,
    cor: 'text-purple-400',
    corBg: 'bg-purple-500/20',
    premium: true
  },
  {
    id: 'questoes',
    nome: 'Questões',
    descricao: 'Gere questões sobre qualquer tema',
    icon: FileQuestion,
    cor: 'text-amber-400',
    corBg: 'bg-amber-500/20'
  }
]

// Prompts do sistema para cada modo
export const MODE_PROMPTS: Record<ChatMode, string> = {
  chat: '', // Usa o prompt padrão
  caso_clinico: `Você está no MODO CASO CLÍNICO.

REGRAS ESPECIAIS:
1. Apresente casos clínicos INTERATIVOS
2. Não revele o diagnóstico imediatamente
3. Faça perguntas ao aluno sobre:
   - Hipóteses diagnósticas
   - Exames a solicitar
   - Conduta inicial
4. Dê feedback construtivo a cada resposta
5. Revele o diagnóstico e discussão completa ao final

ESTRUTURA DO CASO:
📋 **CASO CLÍNICO**
*Identificação:* [Idade, sexo, ocupação]
*QP:* [Queixa principal com tempo de evolução]
*HDA:* [História detalhada]
*Antecedentes:* [Relevantes]
*Exame físico:* [Achados principais]

❓ **Qual sua hipótese diagnóstica inicial?**
❓ **Quais exames você solicitaria?**

Aguarde a resposta do aluno antes de continuar.`,

  tutor: `Você está no MODO TUTOR SOCRÁTICO.

REGRAS ESPECIAIS:
1. NUNCA dê respostas diretas imediatamente
2. Use perguntas para guiar o raciocínio do aluno
3. Faça o aluno "descobrir" as respostas
4. Construa o conhecimento passo a passo
5. Celebre quando ele chegar à conclusão correta

TÉCNICAS A USAR:
- "O que você já sabe sobre...?"
- "O que aconteceria se...?"
- "Qual seria o próximo passo lógico?"
- "Como isso se relaciona com...?"
- "Você pode me explicar por quê?"

ESTRUTURA:
1. Entenda o que o aluno já sabe
2. Identifique lacunas no conhecimento
3. Guie com perguntas direcionadas
4. Confirme entendimento
5. Aprofunde gradualmente

Lembre-se: O objetivo é que o ALUNO construa o conhecimento, não você.`,

  questoes: `Você está no MODO GERAÇÃO DE QUESTÕES.

Quando o usuário pedir questões sobre um tema, gere questões no formato ESTRUTURADO usando o bloco \`\`\`questao.

Pergunte:
1. Quantas questões? (padrão: 3)
2. Dificuldade? (fácil, médio, difícil)
3. Estilo? (conceitual, caso clínico, imagem)

Depois gere UMA questão por vez no formato JSON correto.`
}

interface ChatModeSelectorProps {
  modoAtual: ChatMode
  onChange: (modo: ChatMode) => void
  variant?: 'tabs' | 'dropdown' | 'pills'
  className?: string
}

export function ChatModeSelector({
  modoAtual,
  onChange,
  variant = 'tabs',
  className = ''
}: ChatModeSelectorProps) {
  const { plano, podeUsarFuncionalidade } = useMedAuth()
  const [aberto, setAberto] = useState(false)

  const modoConfig = CHAT_MODES.find(m => m.id === modoAtual) || CHAT_MODES[0]

  const podeUsarModo = (modo: ChatModeConfig): boolean => {
    if (modo.residencia) return plano === 'residencia'
    if (modo.premium) return plano !== 'gratuito' || podeUsarFuncionalidade('ia')
    return true
  }

  // Variante Dropdown (compacta)
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setAberto(!aberto)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${modoConfig.corBg} ${modoConfig.cor} transition-colors`}
        >
          <modoConfig.icon className="w-4 h-4" />
          <span className="text-sm font-medium">{modoConfig.nome}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {aberto && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-1 w-56 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {CHAT_MODES.map(modo => {
                const Icon = modo.icon
                const disponivel = podeUsarModo(modo)

                return (
                  <button
                    key={modo.id}
                    onClick={() => {
                      if (disponivel) {
                        onChange(modo.id)
                        setAberto(false)
                      }
                    }}
                    disabled={!disponivel}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      modoAtual === modo.id
                        ? `${modo.corBg} ${modo.cor}`
                        : disponivel
                          ? 'text-white/80 hover:bg-white/5'
                          : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{modo.nome}</p>
                      <p className="text-xs opacity-60">{modo.descricao}</p>
                    </div>
                    {!disponivel && <Lock className="w-4 h-4" />}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay para fechar */}
        {aberto && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAberto(false)}
          />
        )}
      </div>
    )
  }

  // Variante Pills (horizontal compacta)
  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-white/5 rounded-lg ${className}`}>
        {CHAT_MODES.map(modo => {
          const Icon = modo.icon
          const disponivel = podeUsarModo(modo)
          const ativo = modoAtual === modo.id

          return (
            <button
              key={modo.id}
              onClick={() => disponivel && onChange(modo.id)}
              disabled={!disponivel}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${
                ativo
                  ? `${modo.corBg} ${modo.cor}`
                  : disponivel
                    ? 'text-white/60 hover:text-white hover:bg-white/5'
                    : 'text-white/30 cursor-not-allowed'
              }`}
              title={modo.descricao}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{modo.nome}</span>
              {!disponivel && <Lock className="w-3 h-3 ml-1" />}
            </button>
          )
        })}
      </div>
    )
  }

  // Variante Tabs (padrão)
  return (
    <div className={`flex items-center border-b border-white/10 ${className}`}>
      {CHAT_MODES.map(modo => {
        const Icon = modo.icon
        const disponivel = podeUsarModo(modo)
        const ativo = modoAtual === modo.id

        return (
          <button
            key={modo.id}
            onClick={() => disponivel && onChange(modo.id)}
            disabled={!disponivel}
            className={`relative flex items-center gap-2 px-4 py-3 transition-colors ${
              ativo
                ? modo.cor
                : disponivel
                  ? 'text-white/60 hover:text-white'
                  : 'text-white/30 cursor-not-allowed'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{modo.nome}</span>
            {!disponivel && <Lock className="w-3 h-3" />}

            {/* Indicador ativo */}
            {ativo && (
              <motion.div
                layoutId="activeTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${modo.corBg.replace('/20', '')}`}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

// Componente de introdução do modo
interface ChatModeIntroProps {
  modo: ChatMode
  onStart?: () => void
}

export function ChatModeIntro({ modo, onStart }: ChatModeIntroProps) {
  const modoConfig = CHAT_MODES.find(m => m.id === modo)
  if (!modoConfig || modo === 'chat') return null

  const Icon = modoConfig.icon

  const getInstrucoes = () => {
    switch (modo) {
      case 'caso_clinico':
        return [
          'Você receberá um caso clínico completo',
          'Formule suas hipóteses diagnósticas',
          'Proponha exames complementares',
          'Defina a conduta inicial',
          'Receba feedback detalhado ao final'
        ]
      case 'tutor':
        return [
          'Diga qual tema quer aprender',
          'A IA fará perguntas para guiar você',
          'Construa o conhecimento ativamente',
          'Perfeito para fixar conceitos',
          'Simula um professor particular'
        ]
      case 'questoes':
        return [
          'Escolha o tema das questões',
          'Defina quantidade e dificuldade',
          'Responda uma questão por vez',
          'Receba feedback detalhado',
          'Revise os pontos fracos'
        ]
      default:
        return []
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 rounded-xl border ${modoConfig.corBg} border-white/10 max-w-lg mx-auto text-center`}
    >
      <div className={`w-16 h-16 rounded-2xl ${modoConfig.corBg} flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`w-8 h-8 ${modoConfig.cor}`} />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{modoConfig.nome}</h3>
      <p className="text-white/60 mb-4">{modoConfig.descricao}</p>

      <ul className="text-left space-y-2 mb-6">
        {getInstrucoes().map((instrucao, i) => (
          <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
            <Sparkles className={`w-4 h-4 ${modoConfig.cor} mt-0.5 flex-shrink-0`} />
            {instrucao}
          </li>
        ))}
      </ul>

      {onStart && (
        <button
          onClick={onStart}
          className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
            modoConfig.cor === 'text-emerald-400' ? 'bg-emerald-600 hover:bg-emerald-700' :
            modoConfig.cor === 'text-purple-400' ? 'bg-purple-600 hover:bg-purple-700' :
            modoConfig.cor === 'text-amber-400' ? 'bg-amber-600 hover:bg-amber-700' :
            'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Começar
        </button>
      )}
    </motion.div>
  )
}

// Hook para usar o modo no chat
export function useChatMode() {
  const [modo, setModo] = useState<ChatMode>('chat')
  const [mostrarIntro, setMostrarIntro] = useState(false)

  const trocarModo = (novoModo: ChatMode) => {
    setModo(novoModo)
    setMostrarIntro(novoModo !== 'chat')
  }

  const iniciarModo = () => {
    setMostrarIntro(false)
  }

  const getSystemPrompt = (): string => {
    return MODE_PROMPTS[modo]
  }

  return {
    modo,
    trocarModo,
    mostrarIntro,
    iniciarModo,
    getSystemPrompt
  }
}
