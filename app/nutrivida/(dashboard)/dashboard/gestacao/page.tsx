'use client'

import { useState, useEffect } from 'react'
import { useNutriAuth, formatarIdadeBebe } from '@/contexts/NutriAuthContext'
import { useRouter } from 'next/navigation'
import {
  HeartPulse,
  Calendar,
  Baby,
  Apple,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Scale,
  Ruler,
  Heart,
  Sparkles,
  ChevronRight,
  Info,
  Loader2,
  BookOpen
} from 'lucide-react'

// Informacoes por semana de gestacao
const infoSemanas: Record<number, {
  tamanho: string
  comparacao: string
  peso: string
  desenvolvimentos: string[]
  cuidados: string[]
  alimentosImportantes: string[]
  alimentosEvitar: string[]
}> = {
  4: {
    tamanho: '0.4 mm',
    comparacao: 'semente de papoula',
    peso: 'menos de 1g',
    desenvolvimentos: ['Implantacao no utero', 'Formacao do saco gestacional', 'Inicio da formacao do coracao'],
    cuidados: ['Iniciar acido folico', 'Evitar alcool e cigarro', 'Agendar primeira consulta'],
    alimentosImportantes: ['Folhas verdes escuras', 'Leguminosas', 'Cereais integrais'],
    alimentosEvitar: ['Alcool', 'Cafeina em excesso', 'Peixes crus']
  },
  8: {
    tamanho: '1.6 cm',
    comparacao: 'framboesa',
    peso: '1g',
    desenvolvimentos: ['Coracao batendo', 'Formacao dos bracos e pernas', 'Desenvolvimento do cerebro'],
    cuidados: ['Fazer primeiro ultrassom', 'Manter hidratacao', 'Descansar adequadamente'],
    alimentosImportantes: ['Proteinas magras', 'Ovos', 'Laticinios'],
    alimentosEvitar: ['Carnes mal passadas', 'Queijos nao pasteurizados', 'Embutidos']
  },
  12: {
    tamanho: '5.4 cm',
    comparacao: 'limao',
    peso: '14g',
    desenvolvimentos: ['Orgaos formados', 'Reflexos presentes', 'Unhas comecando a crescer'],
    cuidados: ['Exames de sangue', 'Translucencia nucal', 'Comeco do segundo trimestre'],
    alimentosImportantes: ['Ferro (carnes, feijao)', 'Vitamina C', 'Calcio'],
    alimentosEvitar: ['Figado em excesso', 'Suplementos de vitamina A', 'Adocantes artificiais']
  },
  16: {
    tamanho: '11.6 cm',
    comparacao: 'abacate',
    peso: '100g',
    desenvolvimentos: ['Pode sentir movimentos leves', 'Pele transparente', 'Ouvidos funcionando'],
    cuidados: ['Ultrassom morfologico', 'Atencao ao ganho de peso', 'Exercicios leves'],
    alimentosImportantes: ['Omega-3 (peixes cozidos)', 'Fibras', 'Vitamina D'],
    alimentosEvitar: ['Peixes com mercurio', 'Excesso de sal', 'Acucar refinado']
  },
  20: {
    tamanho: '16.5 cm',
    comparacao: 'banana',
    peso: '300g',
    desenvolvimentos: ['Movimentos mais perceptiveis', 'Sobrancelhas formadas', 'Pode descobrir o sexo'],
    cuidados: ['Morfologico de 2o trimestre', 'Monitorar pressao', 'Preparar o enxoval'],
    alimentosImportantes: ['Proteinas variadas', 'Frutas diversas', 'Graos integrais'],
    alimentosEvitar: ['Fast food', 'Refrigerantes', 'Excesso de gordura']
  },
  24: {
    tamanho: '30 cm',
    comparacao: 'espiga de milho',
    peso: '600g',
    desenvolvimentos: ['Pulmoes em desenvolvimento', 'Ciclo de sono', 'Reage a sons externos'],
    cuidados: ['Teste de glicemia', 'Atencao ao inchaco', 'Preparar documentos'],
    alimentosImportantes: ['Alimentos ricos em ferro', 'Vitamina B12', 'Zinco'],
    alimentosEvitar: ['Alimentos muito gordurosos', 'Excesso de carboidratos simples']
  },
  28: {
    tamanho: '37.5 cm',
    comparacao: 'berinjela',
    peso: '1kg',
    desenvolvimentos: ['Olhos podem abrir', 'Cerebro muito ativo', 'Posicao mais definida'],
    cuidados: ['Inicio do 3o trimestre', 'Consultas mais frequentes', 'Curso de gestante'],
    alimentosImportantes: ['Proteinas de alta qualidade', 'Calcio', 'Magnesio'],
    alimentosEvitar: ['Alimentos que causam azia', 'Refeicoes muito grandes']
  },
  32: {
    tamanho: '42.5 cm',
    comparacao: 'coco',
    peso: '1.7kg',
    desenvolvimentos: ['Unhas completas', 'Cabelo crescendo', 'Praticando respiracao'],
    cuidados: ['Escolher maternidade', 'Preparar mala', 'Monitorar movimentos'],
    alimentosImportantes: ['Alimentos leves', 'Frutas', 'Vegetais cozidos'],
    alimentosEvitar: ['Alimentos que causam gases', 'Comidas muito condimentadas']
  },
  36: {
    tamanho: '47.5 cm',
    comparacao: 'melao',
    peso: '2.6kg',
    desenvolvimentos: ['Quase pronto para nascer', 'Pulmoes maduros', 'Encaixando na pelve'],
    cuidados: ['Consultas semanais', 'Sinais de parto', 'Descansar bastante'],
    alimentosImportantes: ['Alimentos de facil digestao', 'Hidratacao', 'Pequenas porcoes'],
    alimentosEvitar: ['Refeicoes pesadas', 'Alimentos crus']
  },
  40: {
    tamanho: '51 cm',
    comparacao: 'melancia pequena',
    peso: '3.4kg',
    desenvolvimentos: ['Pronto para nascer!', 'Totalmente formado', 'Aguardando o momento'],
    cuidados: ['Atencao aos sinais de trabalho de parto', 'Manter calma', 'Ir a maternidade quando contrações regulares'],
    alimentosImportantes: ['Alimentos energeticos leves', 'Muita agua', 'Frutas'],
    alimentosEvitar: ['Jejum prolongado', 'Alimentos pesados']
  }
}

// Funcao para obter info da semana mais proxima
function getInfoSemana(semana: number) {
  const semanasDisponiveis = Object.keys(infoSemanas).map(Number).sort((a, b) => a - b)
  let semanaMaisProxima = semanasDisponiveis[0]

  for (const s of semanasDisponiveis) {
    if (s <= semana) {
      semanaMaisProxima = s
    } else {
      break
    }
  }

  return { info: infoSemanas[semanaMaisProxima], semanaBase: semanaMaisProxima }
}

export default function GestacaoPage() {
  const router = useRouter()
  const {
    profile,
    semanaGestacaoCalculada,
    trimestreGestacao,
    dppCalculada,
    situacaoAtual,
    idadeBebeCalculada
  } = useNutriAuth()

  const [dicaDia, setDicaDia] = useState('')
  const [carregandoDica, setCarregandoDica] = useState(false)

  // Se nao esta gestante nem tem bebe, mostrar opcao de configurar
  const mostrarConfiguracao = situacaoAtual === 'normal'

  // Calcular dias restantes para o parto
  const diasParaParto = dppCalculada
    ? Math.ceil((new Date(dppCalculada).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Info da semana atual
  const { info: infoSemana, semanaBase } = semanaGestacaoCalculada
    ? getInfoSemana(semanaGestacaoCalculada)
    : { info: null, semanaBase: 0 }

  // Buscar dica do dia
  useEffect(() => {
    if (situacaoAtual === 'gestante' && semanaGestacaoCalculada) {
      buscarDicaDia()
    }
  }, [situacaoAtual, semanaGestacaoCalculada])

  const buscarDicaDia = async () => {
    setCarregandoDica(true)
    try {
      // Dicas locais por trimestre
      const dicasPorTrimestre: Record<number, string[]> = {
        1: [
          'O primeiro trimestre e crucial para a formacao do bebe. Priorize o descanso!',
          'O acido folico e essencial agora. Consuma folhas verdes escuras diariamente.',
          'Enjoos matinais? Tente comer pequenas porcoes ao longo do dia.',
          'Hidrate-se bem! Agua ajuda a combater o cansaco e a constipacao.',
          'Evite alimentos crus e mal cozidos para prevenir infeccoes.'
        ],
        2: [
          'O segundo trimestre costuma ser o mais confortavel. Aproveite para se exercitar!',
          'Seu bebe ja ouve sua voz. Converse e cante para ele!',
          'Aumente o consumo de proteinas para o crescimento do bebe.',
          'O ferro e muito importante agora. Combine com vitamina C para melhor absorcao.',
          'Alongue-se diariamente para aliviar dores nas costas.'
        ],
        3: [
          'Reta final! Descanse bastante e prepare-se para a chegada do bebe.',
          'Coma pequenas porcoes frequentes para evitar azia e desconforto.',
          'Mantenha os pes elevados para reduzir o inchaco.',
          'Prepare a mala da maternidade com antecedencia.',
          'Pratique tecnicas de respiracao para o parto.'
        ]
      }

      const dicas = dicasPorTrimestre[trimestreGestacao || 1] || dicasPorTrimestre[1]
      const dicaAleatoria = dicas[Math.floor(Math.random() * dicas.length)]
      setDicaDia(dicaAleatoria)
    } catch (error) {
      console.error('Erro ao buscar dica:', error)
    } finally {
      setCarregandoDica(false)
    }
  }

  if (mostrarConfiguracao) {
    return (
      <div className="space-y-6 pb-20 lg:pb-6 max-w-lg mx-auto">
        <div className="text-center pt-8">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HeartPulse className="w-12 h-12 text-pink-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acompanhamento</h1>
          <p className="text-gray-500 mb-8">
            Configure seu perfil para acessar o acompanhamento de gestacao ou maternidade
          </p>

          <div className="space-y-4">
            <button
              onClick={() => router.push('/nutrivida/dashboard/perfil')}
              className="w-full p-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <HeartPulse className="w-5 h-5" />
              Estou Gravida
            </button>
            <button
              onClick={() => router.push('/nutrivida/dashboard/perfil')}
              className="w-full p-4 bg-white border-2 border-purple-200 text-purple-600 rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <Baby className="w-5 h-5" />
              Sou Mae
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Se esta amamentando ou pos-parto, mostrar info de maternidade
  if (situacaoAtual === 'amamentando' || situacaoAtual === 'pos_parto') {
    return (
      <div className="space-y-6 pb-20 lg:pb-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Baby className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Maternidade</h1>
              <p className="text-purple-100">
                {situacaoAtual === 'amamentando' ? 'Amamentando' : 'Pos-parto'}
              </p>
            </div>
          </div>

          {idadeBebeCalculada !== null && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-purple-200 text-sm">Idade do bebe</p>
                <p className="text-2xl font-bold">{formatarIdadeBebe(idadeBebeCalculada)}</p>
              </div>
              {situacaoAtual === 'amamentando' && (
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm">Calorias extras</p>
                  <p className="text-2xl font-bold">+500 kcal</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dicas para maes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-800">Dicas para voce</h2>
          </div>

          <div className="space-y-3">
            {situacaoAtual === 'amamentando' ? (
              <>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Beba bastante agua - a amamentacao exige hidratacao extra</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Consuma alimentos ricos em calcio como laticinios e folhas verdes</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Aveia e erva-doce podem ajudar na producao de leite</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Seu corpo esta se recuperando - seja gentil consigo mesma</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Priorize alimentos nutritivos para recuperar energia</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700">Descanse sempre que possivel - o sono e essencial</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Link para perfil */}
        <button
          onClick={() => router.push('/nutrivida/dashboard/perfil')}
          className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <span>Atualizar informacoes</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // Tela principal de gestacao
  return (
    <div className="space-y-6 pb-20 lg:pb-6 max-w-lg mx-auto">
      {/* Header com info principal */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <HeartPulse className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sua Gestacao</h1>
            <p className="text-pink-100">{trimestreGestacao}o Trimestre</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Calendar className="w-5 h-5 mx-auto mb-1" />
            <p className="text-2xl font-bold">{semanaGestacaoCalculada}</p>
            <p className="text-xs text-pink-200">semanas</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1" />
            <p className="text-2xl font-bold">{diasParaParto && diasParaParto > 0 ? diasParaParto : '—'}</p>
            <p className="text-xs text-pink-200">dias restantes</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Heart className="w-5 h-5 mx-auto mb-1" />
            <p className="text-sm font-bold">{dppCalculada ? new Date(dppCalculada).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}</p>
            <p className="text-xs text-pink-200">DPP</p>
          </div>
        </div>
      </div>

      {/* Dica do dia */}
      {dicaDia && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-5 border border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-yellow-800 mb-1">Dica do dia</p>
              <p className="text-sm text-yellow-700">{dicaDia}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info do bebe */}
      {infoSemana && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
          <div className="flex items-center gap-2 mb-4">
            <Baby className="w-5 h-5 text-pink-500" />
            <h2 className="font-semibold text-gray-800">Seu bebe na semana {semanaGestacaoCalculada}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-pink-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-pink-600 mb-1">
                <Ruler className="w-4 h-4" />
                <span className="text-xs font-medium">Tamanho</span>
              </div>
              <p className="font-bold text-gray-800">{infoSemana.tamanho}</p>
              <p className="text-xs text-gray-500">como um(a) {infoSemana.comparacao}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Scale className="w-4 h-4" />
                <span className="text-xs font-medium">Peso</span>
              </div>
              <p className="font-bold text-gray-800">{infoSemana.peso}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Desenvolvimentos:</p>
            {infoSemana.desenvolvimentos.map((dev, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                {dev}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cuidados */}
      {infoSemana && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Cuidados importantes</h2>
          </div>

          <div className="space-y-2">
            {infoSemana.cuidados.map((cuidado, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700 p-2 bg-blue-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                {cuidado}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alimentacao */}
      {infoSemana && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
          <div className="flex items-center gap-2 mb-4">
            <Apple className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-gray-800">Alimentacao</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Priorize
              </p>
              <div className="flex flex-wrap gap-2">
                {infoSemana.alimentosImportantes.map((alimento, i) => (
                  <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                    {alimento}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Evite
              </p>
              <div className="flex flex-wrap gap-2">
                {infoSemana.alimentosEvitar.map((alimento, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                    {alimento}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link para mais informacoes */}
      <button
        onClick={() => router.push('/nutrivida/dashboard/perfil')}
        className="w-full p-4 bg-gray-50 rounded-2xl flex items-center justify-between text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span>Atualizar dados da gestacao</span>
        </div>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
