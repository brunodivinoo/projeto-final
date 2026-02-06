'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  ZoomIn
} from 'lucide-react'
import { ImageModal } from '@/components/ui/ImageModal'

// ==========================================
// TIPOS
// ==========================================

interface FlashcardData {
  id: string
  emoji?: string
  frente: string
  verso: string
  referencia?: string
}

interface AlternativaData {
  letra: string
  texto: string
}

interface QuestaoData {
  numero: number
  disciplina: string
  assunto: string
  enunciado: string
  caso_clinico?: string
  alternativas: AlternativaData[]
  gabarito_comentado: {
    resposta_correta: string
    explicacao: string
    imagem_url?: string
    analise_alternativas?: Array<{ letra: string; analise: string }>
    ponto_chave?: string
  }
}

interface FluxogramaEtapa {
  id: string
  texto: string
  subtexto?: string
  emoji?: string
  tipo: 'inicio' | 'processo' | 'decisao' | 'fim'
  cor?: string
}

interface FluxogramaConexao {
  de: string
  para: string
  label?: string
}

interface OrgNode {
  nome: string
  emoji?: string
  descricao?: string
  filhos?: OrgNode[]
}

interface ImagemRef {
  url: string
  titulo: string
  fonte?: string
}

export interface UnifiedStudyData {
  titulo: string
  icone?: string
  subtitulo?: string
  introducao?: string
  imagens?: ImagemRef[]
  flashcards?: {
    cards: FlashcardData[]
  }
  questoes?: QuestaoData[]
  diagrama?: {
    titulo: string
    descricao?: string
    elementos: Array<{
      id: string
      nome: string
      emoji?: string
      descricao?: string
      x: number
      y: number
      tipo?: string
    }>
  }
  fluxograma?: {
    titulo: string
    descricao?: string
    etapas: FluxogramaEtapa[]
    conexoes: FluxogramaConexao[]
  }
  organograma?: {
    titulo: string
    descricao?: string
    raiz: OrgNode
  }
}

interface UnifiedStudyMaterialProps {
  data: UnifiedStudyData
  isFullscreen?: boolean
}

// ==========================================
// CORES DO TEMA
// ==========================================

const ETAPA_CORES: Record<string, { bg: string; border: string; text: string }> = {
  inicio: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  processo: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  decisao: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900' },
  fim: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  ovulacao: { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-900' },
  lutea: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
}

const CARD_GRADIENTS = [
  'from-pink-100 to-rose-50',
  'from-sky-100 to-blue-50',
  'from-amber-100 to-yellow-50',
  'from-emerald-100 to-green-50',
  'from-violet-100 to-purple-50',
  'from-orange-100 to-amber-50',
  'from-teal-100 to-cyan-50',
  'from-fuchsia-100 to-pink-50',
]

// ==========================================
// SUB-COMPONENTES
// ==========================================

// --- Flashcards Tab ---
function FlashcardsTab({ cards }: { cards: FlashcardData[] }) {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  const toggleFlip = useCallback((id: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const progress = el.scrollLeft / (el.scrollWidth - el.clientWidth)
    setScrollProgress(Math.min(1, Math.max(0, progress)))
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.addEventListener('scroll', handleScroll)
      return () => el.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return (
    <div>
      <p className="text-center text-xs tracking-widest text-rose-400 font-medium mb-4 uppercase">
        Toque nos cards para ver a resposta
      </p>

      {/* Horizontal scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cards.map((card, i) => {
          const isFlipped = flippedCards.has(card.id)
          const gradient = CARD_GRADIENTS[i % CARD_GRADIENTS.length]

          return (
            <div
              key={card.id}
              className="flex-shrink-0 w-[200px] sm:w-[220px] snap-center cursor-pointer"
              style={{ perspective: '800px' }}
              onClick={() => toggleFlip(card.id)}
            >
              <motion.div
                className="relative w-full h-[260px] sm:h-[280px]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Frente */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${gradient} border border-rose-200/50 shadow-sm p-5 flex flex-col items-center justify-center`}
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="absolute top-3 right-3 text-xs font-medium text-rose-400">
                    {String(i + 1).padStart(2, '0')}/{String(cards.length).padStart(2, '0')}
                  </div>

                  {card.emoji && (
                    <span className="text-4xl mb-4">{card.emoji}</span>
                  )}

                  <h4 className="text-base sm:text-lg font-semibold text-rose-800 text-center leading-snug">
                    {card.frente}
                  </h4>

                  <p className="mt-4 text-xs text-rose-400 flex items-center gap-1">
                    Toque para virar ↻
                  </p>
                </div>

                {/* Verso */}
                <div
                  className="absolute inset-0 rounded-2xl bg-white border border-rose-200 shadow-sm p-5 flex flex-col items-center justify-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="absolute top-3 left-3 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-medium rounded-full">
                    Resposta
                  </div>

                  <p className="text-sm text-gray-700 text-center leading-relaxed mt-2 overflow-y-auto max-h-[200px]">
                    {card.verso}
                  </p>

                  {card.referencia && (
                    <p className="text-[10px] text-rose-400 text-center italic mt-2">
                      {card.referencia}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Scroll indicator */}
      {cards.length > 2 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-rose-400 rounded-full"
              animate={{ width: `${Math.max(20, scrollProgress * 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// --- Questões Tab ---
function QuestoesTab({ questoes }: { questoes: QuestaoData[] }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, string>>(new Map())
  const [showFeedback, setShowFeedback] = useState<Set<number>>(new Set())
  const [modalImage, setModalImage] = useState<string | null>(null)

  const q = questoes[currentQ]
  if (!q) return null

  const selected = selectedAnswers.get(currentQ) || null
  const answered = showFeedback.has(currentQ)
  const correctLetter = q.gabarito_comentado.resposta_correta

  const handleSelect = (letra: string) => {
    if (answered) return
    setSelectedAnswers(prev => new Map(prev).set(currentQ, letra))
  }

  const handleConfirm = () => {
    if (!selected || answered) return
    setShowFeedback(prev => new Set(prev).add(currentQ))
  }

  const goNext = () => {
    if (currentQ < questoes.length - 1) {
      setCurrentQ(currentQ + 1)
    }
  }

  const goPrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
    }
  }

  return (
    <div>
      {/* Question header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2.5 py-1 rounded-lg">
            Q{q.numero}
          </span>
          <span className="text-xs text-gray-500">
            {q.disciplina} {q.assunto ? `• ${q.assunto}` : ''}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {currentQ + 1}/{questoes.length}
        </span>
      </div>

      {/* Enunciado */}
      {q.caso_clinico && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-sm text-blue-900">
          {q.caso_clinico}
        </div>
      )}
      <p className="text-sm text-gray-800 mb-4 leading-relaxed">{q.enunciado}</p>

      {/* Alternativas */}
      <div className="space-y-2 mb-4">
        {q.alternativas.map((alt) => {
          const isSelected = selected === alt.letra
          const isCorrect = answered && alt.letra === correctLetter
          const isWrong = answered && isSelected && alt.letra !== correctLetter

          return (
            <button
              key={alt.letra}
              onClick={() => handleSelect(alt.letra)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                isCorrect
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                  : isWrong
                    ? 'border-red-400 bg-red-50 text-red-800'
                    : isSelected
                      ? 'border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-bold mr-2">{alt.letra})</span>
              {alt.texto}
              {isCorrect && <Check className="inline w-4 h-4 ml-2 text-emerald-600" />}
              {isWrong && <X className="inline w-4 h-4 ml-2 text-red-600" />}
            </button>
          )
        })}
      </div>

      {/* Confirmar / Feedback */}
      {!answered && selected && (
        <button
          onClick={handleConfirm}
          className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm transition-all"
        >
          Confirmar Resposta
        </button>
      )}

      {answered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3"
        >
          <div className={`p-4 rounded-xl border ${
            selected === correctLetter
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className="font-semibold text-sm mb-1">
              {selected === correctLetter ? '✅ Correto!' : `❌ Incorreto. Resposta: ${correctLetter})`}
            </p>
            <p className="text-sm text-gray-700">{q.gabarito_comentado.explicacao}</p>

            {q.gabarito_comentado.ponto_chave && (
              <p className="mt-2 text-xs text-gray-600 bg-white/60 px-3 py-1.5 rounded-lg">
                💡 <strong>Ponto-chave:</strong> {q.gabarito_comentado.ponto_chave}
              </p>
            )}

            {q.gabarito_comentado.imagem_url && (
              <div className="mt-3">
                <img
                  src={q.gabarito_comentado.imagem_url}
                  alt="Imagem do gabarito"
                  className="rounded-lg max-h-48 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setModalImage(q.gabarito_comentado.imagem_url || null)}
                />
              </div>
            )}
          </div>

          {q.gabarito_comentado.analise_alternativas && q.gabarito_comentado.analise_alternativas.length > 0 && (
            <AnaliseAlternativas analises={q.gabarito_comentado.analise_alternativas} correta={correctLetter} />
          )}
        </motion.div>
      )}

      {/* Navegação */}
      {questoes.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={goPrev}
            disabled={currentQ === 0}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          {questoes.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                i === currentQ
                  ? 'bg-rose-500 text-white'
                  : showFeedback.has(i)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={goNext}
            disabled={currentQ === questoes.length - 1}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {modalImage && (
        <ImageModal src={modalImage} alt="Imagem do gabarito" isOpen={true} onClose={() => setModalImage(null)} />
      )}
    </div>
  )
}

function AnaliseAlternativas({ analises, correta }: { analises: Array<{ letra: string; analise: string }>; correta: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
      >
        📋 Análise das alternativas
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-3 space-y-2">
          {analises.map((a) => (
            <div key={a.letra} className={`px-3 py-2 rounded-lg text-xs ${
              a.letra === correta ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
            }`}>
              <span className="font-bold">{a.letra})</span> {a.analise}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Diagrama Tab ---
function DiagramaTab({ diagrama, imagens }: { diagrama: UnifiedStudyData['diagrama']; imagens?: ImagemRef[] }) {
  const [hoveredEl, setHoveredEl] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)

  if (!diagrama) return null

  // Se temos imagens reais do Serper, mostrar como diagrama visual
  const imagemPrincipal = imagens?.find(img =>
    img.titulo.toLowerCase().includes('anatom') ||
    img.titulo.toLowerCase().includes('diagram') ||
    img.titulo.toLowerCase().includes('sistema')
  ) || imagens?.[0]

  return (
    <div>
      <h3 className="text-xl font-semibold text-center text-gray-800 mb-1">{diagrama.titulo}</h3>
      {diagrama.descricao && (
        <p className="text-center text-xs tracking-widest text-rose-400 font-medium mb-4 uppercase">
          {diagrama.descricao}
        </p>
      )}

      {/* Imagem real do Serper se disponível */}
      {imagemPrincipal && (
        <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-4 mb-4">
          <img
            src={imagemPrincipal.url}
            alt={imagemPrincipal.titulo}
            className="max-h-80 mx-auto object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setModalImage(imagemPrincipal.url)}
          />
          {imagemPrincipal.fonte && (
            <p className="text-[10px] text-gray-400 text-center mt-2">Fonte: {imagemPrincipal.fonte}</p>
          )}
        </div>
      )}

      {/* Diagrama CSS interativo */}
      <div className="bg-rose-50/50 rounded-2xl border border-rose-100 p-6 relative" style={{ minHeight: '320px' }}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {/* Linhas de conexão entre elementos */}
          {diagrama.elementos.length > 1 && diagrama.elementos.slice(1).map((el, i) => {
            const prev = diagrama.elementos[Math.max(0, i)]
            return (
              <line
                key={`line-${i}`}
                x1={`${prev.x}%`}
                y1={`${prev.y}%`}
                x2={`${el.x}%`}
                y2={`${el.y}%`}
                stroke="#f9a8d4"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity={0.5}
              />
            )
          })}
        </svg>

        {diagrama.elementos.map((el) => {
          const isHovered = hoveredEl === el.id
          return (
            <div
              key={el.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${el.x}%`, top: `${el.y}%` }}
              onMouseEnter={() => setHoveredEl(el.id)}
              onMouseLeave={() => setHoveredEl(null)}
            >
              <motion.div
                animate={{ scale: isHovered ? 1.1 : 1 }}
                className="text-center"
              >
                {el.emoji && <span className="text-2xl">{el.emoji}</span>}
                <p className={`text-xs font-semibold whitespace-nowrap ${isHovered ? 'text-rose-700' : 'text-gray-700'}`}>
                  {el.nome}
                </p>
                {isHovered && el.descricao && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white shadow-lg rounded-lg px-3 py-2 text-xs text-gray-600 whitespace-nowrap border z-20"
                  >
                    {el.descricao}
                  </motion.div>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Legenda passe o mouse */}
      <p className="text-center text-xs text-gray-400 mt-3">
        Passe o mouse sobre as estruturas para identificá-las
      </p>

      {modalImage && (
        <ImageModal src={modalImage} alt="Diagrama" isOpen={true} onClose={() => setModalImage(null)} />
      )}
    </div>
  )
}

// --- Fluxograma Tab ---
function FluxogramaTab({ fluxograma: fluxogramaProp }: { fluxograma: UnifiedStudyData['fluxograma'] }) {
  if (!fluxogramaProp) return null

  // Copiar para variável local não-nula (TypeScript narrowing em closures)
  const fluxograma = fluxogramaProp

  // Construir ordem de renderização a partir das conexões
  const etapaMap = new Map(fluxograma.etapas.map(e => [e.id, e]))

  // Agrupar: achar etapas que são destino de mesma origem (ramificações)
  const children: Map<string, string[]> = new Map()
  for (const c of fluxograma.conexoes) {
    const list = children.get(c.de) || []
    list.push(c.para)
    children.set(c.de, list)
  }

  // Encontrar raiz (sem pais)
  const allTargets = new Set(fluxograma.conexoes.map(c => c.para))
  const roots = fluxograma.etapas.filter(e => !allTargets.has(e.id))
  const startId = roots.length > 0 ? roots[0].id : fluxograma.etapas[0]?.id

  // Renderizar nó recursivamente
  function renderNode(id: string, depth: number = 0): React.ReactNode {
    const etapa = etapaMap.get(id)
    if (!etapa || depth > 10) return null

    const corKey = etapa.cor || etapa.tipo
    const cores = ETAPA_CORES[corKey] || ETAPA_CORES.processo
    const filhos = children.get(id) || []
    const isDecisao = etapa.tipo === 'decisao' || filhos.length > 1

    return (
      <div key={id} className="flex flex-col items-center">
        {/* Nó */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: depth * 0.08 }}
          className={`${cores.bg} ${cores.border} border-2 ${
            isDecisao ? 'rounded-xl rotate-0' : 'rounded-2xl'
          } px-5 py-3 text-center max-w-[280px] shadow-sm`}
        >
          <p className={`font-semibold text-sm ${cores.text}`}>
            {etapa.emoji && <span className="mr-1">{etapa.emoji}</span>}
            {etapa.texto}
          </p>
          {etapa.subtexto && (
            <p className="text-xs text-gray-500 mt-0.5">{etapa.subtexto}</p>
          )}
        </motion.div>

        {/* Seta para baixo (se tem filhos) */}
        {filhos.length === 1 && (
          <>
            <div className="w-px h-6 bg-gray-300" />
            <span className="text-gray-400 text-sm mb-0.5">↓</span>
            {renderNode(filhos[0], depth + 1)}
          </>
        )}

        {/* Ramificação (decisão com múltiplos filhos) */}
        {filhos.length > 1 && (
          <>
            <div className="w-px h-6 bg-gray-300" />
            <span className="text-gray-400 text-sm mb-1">↓</span>
            <div className="flex gap-4 sm:gap-6">
              {filhos.map((childId, i) => {
                const conn = fluxograma.conexoes.find(c => c.de === id && c.para === childId)
                return (
                  <div key={childId} className="flex flex-col items-center">
                    {conn?.label && (
                      <span className="text-[10px] text-gray-500 mb-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        {conn.label}
                      </span>
                    )}
                    {renderNode(childId, depth + 1)}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-center text-gray-800 mb-1">{fluxograma.titulo}</h3>
      {fluxograma.descricao && (
        <p className="text-center text-xs tracking-widest text-rose-400 font-medium mb-5 uppercase">
          {fluxograma.descricao}
        </p>
      )}

      <div className="bg-rose-50/30 rounded-2xl border border-rose-100 p-6 flex justify-center overflow-x-auto">
        {startId ? renderNode(startId) : (
          <p className="text-gray-400 text-sm">Sem etapas para exibir</p>
        )}
      </div>
    </div>
  )
}

// --- Organograma Tab ---
function OrganogramaTab({ organograma }: { organograma: UnifiedStudyData['organograma'] }) {
  if (!organograma) return null

  function renderOrgNode(node: OrgNode, level: number = 0, isLast: boolean = true): React.ReactNode {
    const hasChildren = node.filhos && node.filhos.length > 0

    return (
      <div className="flex flex-col items-center">
        {/* Nó */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: level * 0.1 }}
          className={`${
            level === 0
              ? 'bg-rose-100 border-rose-300 min-w-[180px]'
              : level === 1
                ? 'bg-white border-rose-200 min-w-[140px]'
                : 'bg-gray-50 border-gray-200 min-w-[110px]'
          } border-2 rounded-xl px-4 py-3 text-center shadow-sm`}
        >
          {node.emoji && <span className="text-xl block mb-1">{node.emoji}</span>}
          <p className={`font-semibold text-sm ${level === 0 ? 'text-rose-800' : 'text-gray-800'}`}>
            {node.nome}
          </p>
          {node.descricao && (
            <p className="text-[11px] text-gray-500 mt-0.5">{node.descricao}</p>
          )}
        </motion.div>

        {/* Filhos */}
        {hasChildren && (
          <>
            {/* Linha vertical */}
            <div className="w-px h-5 bg-gray-300" />

            {/* Linha horizontal + filhos */}
            <div className="relative flex">
              {/* Linha horizontal conectora */}
              {node.filhos!.length > 1 && (
                <div
                  className="absolute top-0 h-px bg-gray-300"
                  style={{
                    left: '50%',
                    right: '50%',
                    marginLeft: `-${(node.filhos!.length - 1) * 50}%`,
                    marginRight: `-${(node.filhos!.length - 1) * 50}%`,
                    width: `${(node.filhos!.length - 1) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              )}

              <div className="flex gap-3 sm:gap-5">
                {node.filhos!.map((child, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-px h-5 bg-gray-300" />
                    {renderOrgNode(child, level + 1, i === node.filhos!.length - 1)}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-center text-gray-800 mb-1">{organograma.titulo}</h3>
      {organograma.descricao && (
        <p className="text-center text-xs tracking-widest text-rose-400 font-medium mb-5 uppercase">
          {organograma.descricao}
        </p>
      )}

      <div className="bg-rose-50/30 rounded-2xl border border-rose-100 p-6 flex justify-center overflow-x-auto">
        {renderOrgNode(organograma.raiz)}
      </div>
    </div>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

// Definição das abas disponíveis
interface TabDef {
  key: string
  label: string
  emoji: string
}

export default function UnifiedStudyMaterial({ data, isFullscreen = false }: UnifiedStudyMaterialProps) {
  const availableTabs = useMemo(() => {
    const tabs: TabDef[] = []
    if (data.flashcards?.cards?.length) tabs.push({ key: 'flashcards', label: 'Flashcards', emoji: '🃏' })
    if (data.questoes?.length) tabs.push({ key: 'questoes', label: 'Questões', emoji: '❓' })
    if (data.diagrama?.elementos?.length) tabs.push({ key: 'diagrama', label: 'Diagrama', emoji: '🏛' })
    if (data.fluxograma?.etapas?.length) tabs.push({ key: 'fluxograma', label: 'Fluxograma', emoji: '📊' })
    if (data.organograma?.raiz) tabs.push({ key: 'organograma', label: 'Organograma', emoji: '📁' })
    return tabs
  }, [data])

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.key || 'flashcards')

  // Garantir que activeTab é válido
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.key === activeTab)) {
      setActiveTab(availableTabs[0].key)
    }
  }, [availableTabs, activeTab])

  return (
    <div className={`bg-gradient-to-b from-rose-50/80 to-pink-50/40 rounded-2xl border border-rose-100 shadow-sm overflow-hidden ${
      isFullscreen ? 'h-full flex flex-col' : ''
    }`}>
      {/* Header */}
      <div className="text-center pt-6 pb-4 px-4">
        {data.icone && (
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center">
            <span className="text-2xl">{data.icone}</span>
          </div>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{data.titulo}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {data.subtitulo || 'Material de estudo interativo'}
        </p>
      </div>

      {/* Imagens de introdução */}
      {data.imagens && data.imagens.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.imagens.slice(0, 3).map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.titulo}
                className="h-20 w-auto rounded-lg object-cover flex-shrink-0 border border-rose-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {availableTabs.length > 1 && (
        <div className="flex justify-center gap-1.5 sm:gap-2 px-4 pb-4 flex-wrap">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                activeTab === tab.key
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-600'
              }`}
            >
              <span className="mr-1">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo da aba ativa */}
      <div className={`px-4 pb-6 ${isFullscreen ? 'flex-1 overflow-y-auto' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'flashcards' && data.flashcards?.cards && (
              <FlashcardsTab cards={data.flashcards.cards} />
            )}
            {activeTab === 'questoes' && data.questoes && (
              <QuestoesTab questoes={data.questoes} />
            )}
            {activeTab === 'diagrama' && data.diagrama && (
              <DiagramaTab diagrama={data.diagrama} imagens={data.imagens} />
            )}
            {activeTab === 'fluxograma' && data.fluxograma && (
              <FluxogramaTab fluxograma={data.fluxograma} />
            )}
            {activeTab === 'organograma' && data.organograma && (
              <OrganogramaTab organograma={data.organograma} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="text-center pb-4 px-4">
        <p className="text-xs text-gray-400">
          Material educativo • {data.titulo}
        </p>
      </div>
    </div>
  )
}
