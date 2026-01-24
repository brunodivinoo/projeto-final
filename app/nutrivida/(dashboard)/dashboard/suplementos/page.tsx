'use client'

import { useState, useEffect, useMemo } from 'react'
import { useNutriAuth, formatarIdadeBebe } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { SUPLEMENTOS, Suplemento } from '@/lib/nutrivida/data'
import {
  Pill,
  Clock,
  Check,
  Info,
  Sun,
  Moon,
  Utensils,
  Fish,
  Bone,
  Zap,
  Sparkle,
  Dumbbell,
  Baby,
  Heart,
  HeartPulse,
  AlertTriangle,
  Star,
  Leaf
} from 'lucide-react'

// Suplementos especificos para gestantes
const SUPLEMENTOS_GESTANTE: Suplemento[] = [
  { id: "acidofolico", nome: "Acido Folico", descricao: "ESSENCIAL para prevenir defeitos no tubo neural do bebe", dose: "400-800mcg/dia", horario: "Manha", essencial: true, icon: "baby" },
  { id: "ferro_gest", nome: "Ferro", descricao: "Previne anemia gestacional - muito importante!", dose: "27mg/dia", horario: "Longe das refeicoes", essencial: true, icon: "strength" },
  { id: "calcio_gest", nome: "Calcio", descricao: "Formacao ossea do bebe e saude da mae", dose: "1000-1300mg/dia", horario: "Dividir em 2x", essencial: true, icon: "bone" },
  { id: "vitd_gest", nome: "Vitamina D", descricao: "Absorcao de calcio e imunidade", dose: "600-2000 UI/dia", horario: "Com refeicao gordurosa", essencial: true, icon: "sun" },
  { id: "omega3_gest", nome: "Omega 3 DHA", descricao: "Desenvolvimento cerebral do bebe", dose: "200-300mg DHA/dia", horario: "Com refeicao", essencial: true, icon: "fish" },
  { id: "b12_gest", nome: "Vitamina B12", descricao: "Desenvolvimento neurologico do bebe", dose: "2.6mcg/dia", horario: "Manha", essencial: false, icon: "zap" },
  { id: "iodo", nome: "Iodo", descricao: "Desenvolvimento da tireoide do bebe", dose: "220mcg/dia", horario: "Com refeicao", essencial: false, icon: "sparkle" },
]

// Suplementos especificos para pos-parto/amamentacao
const SUPLEMENTOS_POS_PARTO: Suplemento[] = [
  { id: "vitd_amam", nome: "Vitamina D", descricao: "Para voce e para o bebe via leite materno", dose: "2000-4000 UI/dia", horario: "Manha", essencial: true, icon: "sun" },
  { id: "omega3_amam", nome: "Omega 3 DHA", descricao: "Continua importante para o desenvolvimento do bebe", dose: "200-300mg DHA/dia", horario: "Com refeicao", essencial: true, icon: "fish" },
  { id: "ferro_amam", nome: "Ferro", descricao: "Repoe as reservas perdidas no parto", dose: "9-18mg/dia", horario: "Jejum ou longe de laticinios", essencial: true, icon: "strength" },
  { id: "calcio_amam", nome: "Calcio", descricao: "Protege seus ossos durante amamentacao", dose: "1000mg/dia", horario: "Dividir em 2x", essencial: true, icon: "bone" },
  { id: "b12_amam", nome: "Vitamina B12", descricao: "Energia e desenvolvimento do bebe", dose: "2.8mcg/dia", horario: "Manha", essencial: false, icon: "zap" },
  { id: "colageno_amam", nome: "Colageno", descricao: "Recuperacao da pele e tecidos", dose: "10g/dia", horario: "Manha ou noite", essencial: false, icon: "sparkle" },
  { id: "probiotico_amam", nome: "Probiotico", descricao: "Saude intestinal sua e do bebe", dose: "1 capsula/dia", horario: "Jejum", essencial: false, icon: "gut" },
]

const ICONS: Record<string, React.ReactNode> = {
  fish: <Fish className="w-5 h-5" />,
  sun: <Sun className="w-5 h-5" />,
  strength: <Dumbbell className="w-5 h-5" />,
  bone: <Bone className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  sparkle: <Sparkle className="w-5 h-5" />,
  gut: <Pill className="w-5 h-5" />,
  moon: <Moon className="w-5 h-5" />,
  baby: <Baby className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  leaf: <Leaf className="w-5 h-5" />,
  hair: <Sparkle className="w-5 h-5" />,
  shield: <Star className="w-5 h-5" />
}

export default function SuplementosPage() {
  const { profile, situacaoAtual, semanaGestacaoCalculada, trimestreGestacao, idadeBebeCalculada } = useNutriAuth()
  const [suplementosTomados, setSuplementosTomados] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [infoAberto, setInfoAberto] = useState<string | null>(null)

  const hoje = new Date().toISOString().split('T')[0]

  // Lista de suplementos baseada na situacao da usuaria
  const suplementosLista = useMemo(() => {
    if (situacaoAtual === 'gestante') {
      return SUPLEMENTOS_GESTANTE
    } else if (situacaoAtual === 'amamentando' || situacaoAtual === 'pos_parto') {
      return SUPLEMENTOS_POS_PARTO
    }
    return SUPLEMENTOS
  }, [situacaoAtual])

  const progresso = suplementosLista.length > 0 ? (suplementosTomados.length / suplementosLista.length) * 100 : 0
  const essenciaisTomados = suplementosLista.filter(s => s.essencial && suplementosTomados.includes(s.id)).length
  const essenciaisTotal = suplementosLista.filter(s => s.essencial).length

  useEffect(() => {
    const fetchSuplementos = async () => {
      if (!profile?.id) return

      try {
        const { data } = await supabase
          .from('suplementos_diarios_nutri')
          .select('suplemento_id')
          .eq('user_id', profile.id)
          .eq('data', hoje)
          .eq('tomado', true)

        if (data) {
          setSuplementosTomados(data.map(d => d.suplemento_id))
        }
      } catch (err) {
        console.error('Erro ao buscar suplementos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuplementos()
  }, [profile?.id, hoje])

  const toggleSuplemento = async (id: string) => {
    if (!profile?.id) return

    const tomado = suplementosTomados.includes(id)

    try {
      if (tomado) {
        await supabase
          .from('suplementos_diarios_nutri')
          .delete()
          .eq('user_id', profile.id)
          .eq('suplemento_id', id)
          .eq('data', hoje)

        setSuplementosTomados(prev => prev.filter(s => s !== id))
      } else {
        await supabase
          .from('suplementos_diarios_nutri')
          .upsert({
            user_id: profile.id,
            suplemento_id: id,
            tomado: true,
            data: hoje
          }, {
            onConflict: 'user_id,suplemento_id,data'
          })

        setSuplementosTomados(prev => [...prev, id])
      }
    } catch (err) {
      console.error('Erro ao atualizar suplemento:', err)
    }
  }

  // Titulo e subtitulo dinamicos
  const getTituloSubtitulo = () => {
    if (situacaoAtual === 'gestante') {
      return {
        titulo: 'Vitaminas para Gestantes',
        subtitulo: `${semanaGestacaoCalculada}ª semana de gestacao - ${trimestreGestacao}º trimestre`
      }
    } else if (situacaoAtual === 'amamentando') {
      return {
        titulo: 'Vitaminas para Mamae',
        subtitulo: `Amamentando - Bebe com ${formatarIdadeBebe(idadeBebeCalculada)}`
      }
    } else if (situacaoAtual === 'pos_parto') {
      return {
        titulo: 'Vitaminas Pos-Parto',
        subtitulo: `Recuperacao - Bebe com ${formatarIdadeBebe(idadeBebeCalculada)}`
      }
    }
    return {
      titulo: 'Suplementos',
      subtitulo: 'Vitaminas recomendadas para seu bem-estar'
    }
  }

  const { titulo, subtitulo } = getTituloSubtitulo()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{titulo}</h1>
        <p className="text-gray-500">{subtitulo}</p>
      </div>

      {/* Banner especial para gestantes - Acido Folico */}
      {situacaoAtual === 'gestante' && (
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-5 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Baby className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Acido Folico e Essencial!</h3>
              <p className="text-pink-100 text-sm mt-1">
                {trimestreGestacao === 1
                  ? 'No 1º trimestre, o acido folico e CRUCIAL para a formacao do tubo neural do bebe. Tome todos os dias!'
                  : 'Continue tomando acido folico durante toda a gestacao para o desenvolvimento saudavel do bebe.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner para pos-parto/amamentacao */}
      {(situacaoAtual === 'amamentando' || situacaoAtual === 'pos_parto') && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {situacaoAtual === 'amamentando' ? 'Vitaminas para Voce e o Bebe' : 'Recuperacao Pos-Parto'}
              </h3>
              <p className="text-purple-100 text-sm mt-1">
                {situacaoAtual === 'amamentando'
                  ? 'Suas vitaminas passam para o bebe pelo leite materno. Vitamina D e especialmente importante!'
                  : 'Seu corpo precisa repor os nutrientes gastos na gestacao e no parto. Foque em ferro e calcio!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progresso */}
      <div className={`rounded-2xl p-5 text-white ${
        situacaoAtual === 'gestante'
          ? 'bg-gradient-to-r from-pink-500 to-rose-500'
          : situacaoAtual === 'amamentando' || situacaoAtual === 'pos_parto'
          ? 'bg-gradient-to-r from-purple-500 to-pink-500'
          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white/80">Progresso de hoje</p>
            <p className="text-2xl font-bold">{suplementosTomados.length}/{suplementosLista.length}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80">Essenciais</p>
            <p className="text-xl font-bold">{essenciaisTomados}/{essenciaisTotal}</p>
          </div>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Essenciais */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            situacaoAtual === 'gestante' ? 'bg-pink-500' : 'bg-red-500'
          }`}></span>
          {situacaoAtual === 'gestante' ? 'Essenciais para a Gestacao' :
           situacaoAtual === 'amamentando' ? 'Essenciais para Amamentacao' : 'Essenciais'}
        </h2>
        <div className="space-y-3">
          {suplementosLista.filter(s => s.essencial).map((suplemento) => {
            const tomado = suplementosTomados.includes(suplemento.id)
            const isAcidoFolico = suplemento.id === 'acidofolico'
            return (
              <div
                key={suplemento.id}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  tomado ? 'border-green-300 bg-green-50/50' :
                  isAcidoFolico ? 'border-pink-300 bg-pink-50/30' : 'border-gray-100'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleSuplemento(suplemento.id)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      tomado ? 'bg-green-500 text-white' :
                      isAcidoFolico ? 'bg-pink-500 text-white' :
                      situacaoAtual === 'gestante' ? 'bg-pink-100 text-pink-500' : 'bg-purple-100 text-purple-500'
                    }`}
                  >
                    {tomado ? <Check className="w-6 h-6" /> : ICONS[suplemento.icon] || <Pill className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${tomado ? 'text-gray-400' : 'text-gray-800'}`}>
                        {suplemento.nome}
                      </h3>
                      {isAcidoFolico && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-pink-500 text-white rounded-full font-medium flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" /> PRIORIDADE
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        situacaoAtual === 'gestante' ? 'bg-pink-100 text-pink-600' : 'bg-red-100 text-red-600'
                      }`}>
                        ESSENCIAL
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{suplemento.descricao}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        {suplemento.dose}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {suplemento.horario}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setInfoAberto(infoAberto === suplemento.id ? null : suplemento.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Info className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                {infoAberto === suplemento.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className={`p-3 rounded-xl text-sm text-gray-600 ${
                      situacaoAtual === 'gestante' ? 'bg-pink-50' : 'bg-purple-50'
                    }`}>
                      <p><strong>Beneficio:</strong> {suplemento.descricao}</p>
                      <p className="mt-1"><strong>Dose:</strong> {suplemento.dose}</p>
                      <p className="mt-1"><strong>Melhor horario:</strong> {suplemento.horario}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Opcionais */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          {situacaoAtual === 'gestante' ? 'Recomendados na Gestacao' : 'Opcionais'}
        </h2>
        <div className="space-y-3">
          {suplementosLista.filter(s => !s.essencial).map((suplemento) => {
            const tomado = suplementosTomados.includes(suplemento.id)
            return (
              <div
                key={suplemento.id}
                className={`bg-white rounded-2xl border-2 transition-all ${
                  tomado ? 'border-green-300 bg-green-50/50' : 'border-gray-100'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleSuplemento(suplemento.id)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                      tomado ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tomado ? <Check className="w-6 h-6" /> : ICONS[suplemento.icon] || <Pill className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${tomado ? 'text-gray-400' : 'text-gray-800'}`}>
                      {suplemento.nome}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{suplemento.descricao}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        {suplemento.dose}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {suplemento.horario}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setInfoAberto(infoAberto === suplemento.id ? null : suplemento.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Info className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                {infoAberto === suplemento.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                      <p><strong>Beneficio:</strong> {suplemento.descricao}</p>
                      <p className="mt-1"><strong>Dose:</strong> {suplemento.dose}</p>
                      <p className="mt-1"><strong>Melhor horario:</strong> {suplemento.horario}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Aviso especifico por situacao */}
      <div className={`border rounded-2xl p-4 text-sm ${
        situacaoAtual === 'gestante'
          ? 'bg-pink-50 border-pink-200 text-pink-800'
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Importante</p>
            {situacaoAtual === 'gestante' ? (
              <p>
                Consulte seu obstetra antes de iniciar qualquer suplementacao.
                A dosagem pode variar conforme sua necessidade individual e exames de sangue.
              </p>
            ) : situacaoAtual === 'amamentando' ? (
              <p>
                Durante a amamentacao, alguns suplementos passam para o leite materno.
                Consulte seu medico para ajustar as doses adequadamente.
              </p>
            ) : (
              <p>
                Consulte seu medico antes de iniciar qualquer suplementacao,
                especialmente se estiver tomando outros medicamentos.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dicas especiais para gestantes */}
      {situacaoAtual === 'gestante' && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-4">
          <h3 className="font-semibold text-pink-800 mb-2 flex items-center gap-2">
            <Baby className="w-4 h-4" />
            Dicas para Gestantes
          </h3>
          <ul className="text-sm text-pink-700 space-y-1">
            <li>• Tome ferro longe de laticinios e cha/cafe (reduzem absorcao)</li>
            <li>• Vitamina C melhora a absorcao de ferro - tome junto</li>
            <li>• Calcio e ferro nao devem ser tomados juntos</li>
            <li>• Acido folico e mais importante no 1º trimestre</li>
            <li>• Prefira omega 3 de origem vegetal (DHA de algas) se possivel</li>
          </ul>
        </div>
      )}
    </div>
  )
}
