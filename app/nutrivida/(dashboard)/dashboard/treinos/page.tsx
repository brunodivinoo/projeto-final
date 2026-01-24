'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNutriAuth, formatarIdadeBebe } from '@/contexts/NutriAuthContext'
import { supabase } from '@/lib/supabase'
import { TREINOS_COMPLETOS, Treino, Exercicio } from '@/lib/nutrivida/data'
import {
  Dumbbell,
  Clock,
  Target,
  Check,
  Play,
  Trophy,
  Timer,
  Flame,
  ArrowLeft,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  Loader2,
  Heart,
  Zap,
  Moon,
  Calendar,
  MessageSquare,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Baby,
  HeartPulse,
  ShieldAlert
} from 'lucide-react'

type FaseTreino = 'fase1' | 'fase2' | 'fase3'
type TipoTreino = 'fases' | 'rapido' | 'yoga' | 'cardio' | 'forca' | 'gestante' | 'pos_parto'

// Treinos rapidos sem fases
const TREINOS_RAPIDOS = {
  '5min': {
    nome: '5 Minutos Energia',
    duracao: '5 min',
    foco: 'Ativacao rapida',
    exercicios: [
      { nome: 'Polichinelos', series: 1, reps: '20', tempo: '1 min', dica: 'Movimentos controlados' },
      { nome: 'Agachamento', series: 1, reps: '15', tempo: '1 min', dica: 'Joelhos alinhados' },
      { nome: 'Prancha', series: 1, reps: '1', tempo: '30 seg', dica: 'Mantenha o abdomen contraido' },
      { nome: 'Alongamento', series: 1, reps: '-', tempo: '2 min', dica: 'Respire profundamente' },
    ]
  },
  '10min': {
    nome: '10 Minutos Full Body',
    duracao: '10 min',
    foco: 'Corpo todo',
    exercicios: [
      { nome: 'Aquecimento articular', series: 1, reps: '-', tempo: '2 min', dica: 'Rotacione todas as articulacoes' },
      { nome: 'Agachamento', series: 2, reps: '12', tempo: '2 min', dica: 'Desça ate 90 graus' },
      { nome: 'Flexao (joelhos)', series: 2, reps: '10', tempo: '2 min', dica: 'Cotovelos para fora' },
      { nome: 'Abdominal', series: 2, reps: '15', tempo: '2 min', dica: 'Queixo longe do peito' },
      { nome: 'Alongamento', series: 1, reps: '-', tempo: '2 min', dica: 'Foque nos musculos trabalhados' },
    ]
  },
  '15min': {
    nome: '15 Minutos HIIT',
    duracao: '15 min',
    foco: 'Alta intensidade',
    exercicios: [
      { nome: 'Aquecimento', series: 1, reps: '-', tempo: '2 min', dica: 'Eleve a frequencia cardiaca' },
      { nome: 'Burpees', series: 3, reps: '8', tempo: '3 min', dica: 'Explosao no salto' },
      { nome: 'Mountain climbers', series: 3, reps: '20', tempo: '3 min', dica: 'Mantenha quadril baixo' },
      { nome: 'Squat jumps', series: 3, reps: '10', tempo: '3 min', dica: 'Aterrisse suavemente' },
      { nome: 'Prancha', series: 2, reps: '1', tempo: '2 min', dica: 'Segure 30 segundos cada' },
      { nome: 'Alongamento', series: 1, reps: '-', tempo: '2 min', dica: 'Respiracao profunda' },
    ]
  }
}

const TREINOS_YOGA = {
  relaxamento: {
    nome: 'Yoga Relaxamento',
    duracao: '15 min',
    foco: 'Relaxar e acalmar',
    exercicios: [
      { nome: 'Postura da crianca', series: 1, reps: '-', tempo: '2 min', dica: 'Respire lentamente' },
      { nome: 'Gato-vaca', series: 1, reps: '10', tempo: '2 min', dica: 'Sincronize com a respiracao' },
      { nome: 'Cachorro olhando para baixo', series: 1, reps: '-', tempo: '1 min', dica: 'Pressione os calcanhares' },
      { nome: 'Alongamento de piriforme', series: 2, reps: '-', tempo: '2 min', dica: '1 min cada lado' },
      { nome: 'Torção deitada', series: 2, reps: '-', tempo: '2 min', dica: '1 min cada lado' },
      { nome: 'Pernas na parede', series: 1, reps: '-', tempo: '3 min', dica: 'Relaxe completamente' },
      { nome: 'Savasana', series: 1, reps: '-', tempo: '3 min', dica: 'Deixe o corpo pesado' },
    ]
  },
  energia: {
    nome: 'Yoga Energia',
    duracao: '20 min',
    foco: 'Despertar e energizar',
    exercicios: [
      { nome: 'Saudacao ao sol', series: 3, reps: '1', tempo: '5 min', dica: 'Movimentos fluidos' },
      { nome: 'Guerreiro I', series: 2, reps: '-', tempo: '2 min', dica: '1 min cada lado' },
      { nome: 'Guerreiro II', series: 2, reps: '-', tempo: '2 min', dica: 'Olhar sobre a mao da frente' },
      { nome: 'Triangulo', series: 2, reps: '-', tempo: '2 min', dica: 'Alongue lateralmente' },
      { nome: 'Arvore', series: 2, reps: '-', tempo: '2 min', dica: 'Equilibrio e foco' },
      { nome: 'Ponte', series: 2, reps: '5', tempo: '2 min', dica: 'Eleve o quadril' },
      { nome: 'Meditacao', series: 1, reps: '-', tempo: '5 min', dica: 'Atencao na respiracao' },
    ]
  },
  flexibilidade: {
    nome: 'Yoga Flexibilidade',
    duracao: '20 min',
    foco: 'Alongar e soltar',
    exercicios: [
      { nome: 'Respiracao diafragmatica', series: 1, reps: '-', tempo: '2 min', dica: 'Inspire pelo nariz, expire pela boca' },
      { nome: 'Alongamento de pescoco', series: 1, reps: '-', tempo: '2 min', dica: 'Movimentos suaves' },
      { nome: 'Abertura de quadril borboleta', series: 1, reps: '-', tempo: '2 min', dica: 'Pressione os joelhos para baixo' },
      { nome: 'Pomba', series: 2, reps: '-', tempo: '3 min', dica: '1.5 min cada lado' },
      { nome: 'Cachorro de 3 patas', series: 2, reps: '-', tempo: '2 min', dica: 'Mantenha os quadris nivelados' },
      { nome: 'Alongamento de isquiotibiais', series: 2, reps: '-', tempo: '2 min', dica: 'Perna esticada, pe flexionado' },
      { nome: 'Relaxamento final', series: 1, reps: '-', tempo: '5 min', dica: 'Solte toda a tensao' },
    ]
  }
}

// Treinos de forca e cardio extras
const TREINOS_FORCA = {
  glúteos: {
    nome: 'Gluteos em Fogo',
    duracao: '20 min',
    foco: 'Gluteos e pernas',
    exercicios: [
      { nome: 'Aquecimento de quadril', series: 1, reps: '-', tempo: '2 min', dica: 'Circulos de quadril' },
      { nome: 'Agachamento sumô', series: 3, reps: '15', tempo: '3 min', dica: 'Pes bem abertos, pontas para fora' },
      { nome: 'Elevacao de quadril', series: 3, reps: '20', tempo: '3 min', dica: 'Aperte os gluteos no topo' },
      { nome: 'Afundo reverso', series: 3, reps: '12 cada', tempo: '4 min', dica: 'Joelho quase no chao' },
      { nome: 'Fire hydrant', series: 3, reps: '15 cada', tempo: '3 min', dica: 'Mantenha o core ativado' },
      { nome: 'Donkey kicks', series: 3, reps: '15 cada', tempo: '3 min', dica: 'Calcanhar empurra o teto' },
      { nome: 'Alongamento de gluteos', series: 1, reps: '-', tempo: '2 min', dica: 'Cruzar perna sobre o joelho' },
    ]
  },
  core: {
    nome: 'Core Power',
    duracao: '15 min',
    foco: 'Abdomen e costas',
    exercicios: [
      { nome: 'Prancha frontal', series: 3, reps: '30 seg', tempo: '2 min', dica: 'Corpo reto como uma tabua' },
      { nome: 'Prancha lateral', series: 2, reps: '20 seg cada', tempo: '2 min', dica: 'Quadril elevado' },
      { nome: 'Abdominal bicicleta', series: 3, reps: '20', tempo: '2 min', dica: 'Cotovelo encontra joelho oposto' },
      { nome: 'Dead bug', series: 3, reps: '10 cada', tempo: '3 min', dica: 'Lombar grudada no chao' },
      { nome: 'Bird dog', series: 3, reps: '10 cada', tempo: '2 min', dica: 'Estenda devagar' },
      { nome: 'Crunch reverso', series: 3, reps: '15', tempo: '2 min', dica: 'Eleve os quadris do chao' },
      { nome: 'Respiracao abdominal', series: 1, reps: '-', tempo: '2 min', dica: 'Ative o transverso' },
    ]
  },
  braços: {
    nome: 'Bracos Definidos',
    duracao: '15 min',
    foco: 'Bracos e ombros',
    exercicios: [
      { nome: 'Aquecimento de ombros', series: 1, reps: '-', tempo: '2 min', dica: 'Circulos pequenos e grandes' },
      { nome: 'Flexao no joelho', series: 3, reps: '12', tempo: '3 min', dica: 'Cotovelos a 45 graus' },
      { nome: 'Flexao diamante', series: 3, reps: '8', tempo: '2 min', dica: 'Maos formam um diamante' },
      { nome: 'Triceps no banco', series: 3, reps: '12', tempo: '2 min', dica: 'Cotovelos para tras' },
      { nome: 'Superman', series: 3, reps: '15', tempo: '2 min', dica: 'Eleve bracos e pernas' },
      { nome: 'Prancha com toque no ombro', series: 3, reps: '10 cada', tempo: '2 min', dica: 'Evite balançar o quadril' },
      { nome: 'Alongamento de bracos', series: 1, reps: '-', tempo: '2 min', dica: 'Alongue triceps e biceps' },
    ]
  }
}

const TREINOS_CARDIO = {
  dança: {
    nome: 'Dança Cardio',
    duracao: '20 min',
    foco: 'Queima com diversao',
    exercicios: [
      { nome: 'Aquecimento dançando', series: 1, reps: '-', tempo: '2 min', dica: 'Movimente-se no ritmo' },
      { nome: 'Step touch', series: 1, reps: '40', tempo: '2 min', dica: 'Adicione movimentos de bracos' },
      { nome: 'Grapevine', series: 1, reps: '20', tempo: '2 min', dica: 'Deslize para os lados' },
      { nome: 'Mambo', series: 1, reps: '30', tempo: '2 min', dica: 'Frente e tras com gingado' },
      { nome: 'Chassé', series: 1, reps: '20', tempo: '2 min', dica: 'Deslize rapido lateral' },
      { nome: 'Coreografia livre', series: 1, reps: '-', tempo: '6 min', dica: 'Dance como quiser!' },
      { nome: 'Desaquecimento', series: 1, reps: '-', tempo: '2 min', dica: 'Movimentos lentos' },
    ]
  },
  escada: {
    nome: 'Simulador de Escada',
    duracao: '15 min',
    foco: 'Resistencia cardiovascular',
    exercicios: [
      { nome: 'Marcha no lugar', series: 1, reps: '-', tempo: '2 min', dica: 'Eleve bem os joelhos' },
      { nome: 'Subida de step imaginario', series: 3, reps: '30', tempo: '3 min', dica: 'Alterne as pernas' },
      { nome: 'Skipping alto', series: 3, reps: '20', tempo: '3 min', dica: 'Joelhos na altura do quadril' },
      { nome: 'Agachamento com salto', series: 3, reps: '10', tempo: '3 min', dica: 'Exploda no salto' },
      { nome: 'Corrida estacionaria', series: 1, reps: '-', tempo: '2 min', dica: 'Acelere gradualmente' },
      { nome: 'Desaquecimento', series: 1, reps: '-', tempo: '2 min', dica: 'Caminhada lenta' },
    ]
  }
}

// Categorias dinamicas baseadas na situacao
const getCategoriasTreino = (situacao: string, trimestre: number | null) => {
  const categorias = []

  // Para gestantes: mostrar treinos especificos primeiro
  if (situacao === 'gestante') {
    categorias.push({ id: 'gestante', nome: 'Gestante', icon: Baby, cor: 'from-pink-500 to-rose-500', desc: `${trimestre}º trimestre` })
  }

  // Para pos-parto: mostrar treinos de recuperacao primeiro
  if (situacao === 'pos_parto' || situacao === 'amamentando') {
    categorias.push({ id: 'pos_parto', nome: 'Pos-Parto', icon: HeartPulse, cor: 'from-pink-500 to-purple-500', desc: 'Recuperacao' })
  }

  // Categorias comuns (algumas bloqueadas para gestantes)
  if (situacao !== 'gestante') {
    categorias.push({ id: 'fases', nome: 'Por Fase', icon: Target, cor: 'from-purple-500 to-pink-500', desc: 'Progressao gradual' })
  }

  categorias.push({ id: 'rapido', nome: 'Rapidos', icon: Zap, cor: 'from-orange-500 to-red-500', desc: '5-15 minutos' })
  categorias.push({ id: 'yoga', nome: 'Yoga', icon: Moon, cor: 'from-blue-500 to-indigo-500', desc: 'Flexibilidade e calma' })

  // Forca e Cardio nao recomendados para gestantes
  if (situacao !== 'gestante') {
    categorias.push({ id: 'forca', nome: 'Forca', icon: Dumbbell, cor: 'from-green-500 to-emerald-500', desc: 'Tonificacao muscular' })
    categorias.push({ id: 'cardio', nome: 'Cardio', icon: Heart, cor: 'from-pink-500 to-rose-500', desc: 'Queima de gordura' })
  }

  return categorias
}

const CATEGORIAS_TREINO = [
  { id: 'fases', nome: 'Por Fase', icon: Target, cor: 'from-purple-500 to-pink-500', desc: 'Progressao gradual' },
  { id: 'rapido', nome: 'Rapidos', icon: Zap, cor: 'from-orange-500 to-red-500', desc: '5-15 minutos' },
  { id: 'yoga', nome: 'Yoga', icon: Moon, cor: 'from-blue-500 to-indigo-500', desc: 'Flexibilidade e calma' },
  { id: 'forca', nome: 'Forca', icon: Dumbbell, cor: 'from-green-500 to-emerald-500', desc: 'Tonificacao muscular' },
  { id: 'cardio', nome: 'Cardio', icon: Heart, cor: 'from-pink-500 to-rose-500', desc: 'Queima de gordura' },
]

// Treinos especiais para gestantes
const TREINOS_GESTANTE = {
  primeiro_trimestre: {
    nome: 'Gestante - 1º Trimestre',
    duracao: '15 min',
    foco: 'Alongamento e respiracao',
    alerta: 'Evite exercicios de impacto. Consulte seu medico antes de iniciar.',
    exercicios: [
      { nome: 'Respiracao diafragmatica', series: 1, reps: '-', tempo: '3 min', dica: 'Inspire pelo nariz, expire pela boca lentamente' },
      { nome: 'Alongamento de pescoco', series: 1, reps: '-', tempo: '2 min', dica: 'Movimentos suaves em todas as direcoes' },
      { nome: 'Rotacao de ombros', series: 1, reps: '10 cada lado', tempo: '2 min', dica: 'Circulos amplos e lentos' },
      { nome: 'Gato-vaca', series: 1, reps: '8', tempo: '2 min', dica: 'Sincronize com a respiracao' },
      { nome: 'Alongamento de quadril borboleta', series: 1, reps: '-', tempo: '2 min', dica: 'Nao force, va ate onde for confortavel' },
      { nome: 'Caminhada leve no lugar', series: 1, reps: '-', tempo: '4 min', dica: 'Mantenha ritmo tranquilo' },
    ]
  },
  segundo_trimestre: {
    nome: 'Gestante - 2º Trimestre',
    duracao: '20 min',
    foco: 'Fortalecimento suave',
    alerta: 'Evite deitar de barriga para cima por muito tempo. Beba bastante agua.',
    exercicios: [
      { nome: 'Aquecimento articular', series: 1, reps: '-', tempo: '2 min', dica: 'Movimente todas as articulacoes' },
      { nome: 'Agachamento com apoio', series: 2, reps: '10', tempo: '3 min', dica: 'Segure em uma cadeira para apoio' },
      { nome: 'Elevacao lateral de perna (de lado)', series: 2, reps: '12 cada', tempo: '4 min', dica: 'Deite de lado, eleve a perna de cima' },
      { nome: 'Exercicio de Kegel', series: 3, reps: '10', tempo: '3 min', dica: 'Contraia os musculos do assoalho pelvico' },
      { nome: 'Alongamento de panturrilha', series: 1, reps: '-', tempo: '2 min', dica: 'Previne caimbras' },
      { nome: 'Bird dog modificado', series: 2, reps: '8 cada', tempo: '3 min', dica: 'Estenda um braco e a perna oposta' },
      { nome: 'Relaxamento', series: 1, reps: '-', tempo: '3 min', dica: 'Deite de lado esquerdo, respire' },
    ]
  },
  terceiro_trimestre: {
    nome: 'Gestante - 3º Trimestre',
    duracao: '15 min',
    foco: 'Preparo para o parto',
    alerta: 'Pare imediatamente se sentir dor, tontura ou falta de ar.',
    exercicios: [
      { nome: 'Respiracao para o parto', series: 1, reps: '-', tempo: '3 min', dica: 'Pratique respiracao lenta e profunda' },
      { nome: 'Agachamento profundo com apoio', series: 2, reps: '5', tempo: '2 min', dica: 'Segure 10 segundos cada - prepara para o parto' },
      { nome: 'Exercicio de Kegel avancado', series: 3, reps: '15', tempo: '3 min', dica: 'Contraia, segure 5s, solte' },
      { nome: 'Mobilidade de quadril', series: 1, reps: '-', tempo: '2 min', dica: 'Circulos com o quadril em pe' },
      { nome: 'Alongamento de quadril lateral', series: 1, reps: '-', tempo: '2 min', dica: '1 min cada lado' },
      { nome: 'Postura da crianca modificada', series: 1, reps: '-', tempo: '3 min', dica: 'Joelhos afastados para acomodar a barriga' },
    ]
  }
}

// Treinos para pos-parto
const TREINOS_POS_PARTO = {
  recuperacao_inicial: {
    nome: 'Pos-Parto - Recuperacao Inicial',
    duracao: '10 min',
    foco: 'Primeiras 6 semanas',
    alerta: 'Aguarde liberacao medica. Comece muito devagar.',
    exercicios: [
      { nome: 'Respiracao abdominal', series: 1, reps: '-', tempo: '3 min', dica: 'Reconecte com seu abdomen' },
      { nome: 'Exercicio de Kegel', series: 3, reps: '10', tempo: '2 min', dica: 'Comece a fortalecer o assoalho pelvico' },
      { nome: 'Ponte suave', series: 2, reps: '8', tempo: '2 min', dica: 'Eleve minimamente o quadril' },
      { nome: 'Alongamento de peito', series: 1, reps: '-', tempo: '2 min', dica: 'Alivia tensao da amamentacao' },
      { nome: 'Rotacao de tornozelos', series: 1, reps: '10 cada', tempo: '1 min', dica: 'Melhora circulacao' },
    ]
  },
  fortalecimento_suave: {
    nome: 'Pos-Parto - Fortalecimento',
    duracao: '15 min',
    foco: 'Apos 6-8 semanas',
    alerta: 'Se teve cesarea, aguarde 8-10 semanas e liberacao medica.',
    exercicios: [
      { nome: 'Aquecimento leve', series: 1, reps: '-', tempo: '2 min', dica: 'Marcha no lugar' },
      { nome: 'Ativacao de core (vaccum)', series: 3, reps: '10', tempo: '2 min', dica: 'Puxe o umbigo para dentro e segure' },
      { nome: 'Agachamento parcial', series: 2, reps: '10', tempo: '2 min', dica: 'Nao desça muito, foque na tecnica' },
      { nome: 'Ponte com pegada', series: 2, reps: '12', tempo: '2 min', dica: 'Aperte uma almofada entre os joelhos' },
      { nome: 'Bird dog', series: 2, reps: '8 cada', tempo: '2 min', dica: 'Fortalece core e costas' },
      { nome: 'Alongamento de quadril', series: 1, reps: '-', tempo: '2 min', dica: 'Alivia tensao do colo' },
      { nome: 'Alongamento de peito e ombros', series: 1, reps: '-', tempo: '3 min', dica: 'Essencial para quem amamenta' },
    ]
  }
}

export default function TreinosPage() {
  const { profile, situacaoAtual, semanaGestacaoCalculada, trimestreGestacao, idadeBebeCalculada } = useNutriAuth()

  // Categorias dinamicas baseadas na situacao da usuaria
  const categoriasDisponiveis = getCategoriasTreino(situacaoAtual, trimestreGestacao)

  // Definir categoria inicial com base na situacao
  const categoriaInicial = situacaoAtual === 'gestante' ? 'gestante' :
    (situacaoAtual === 'pos_parto' || situacaoAtual === 'amamentando') ? 'pos_parto' : 'fases'

  const [categoria, setCategoria] = useState<TipoTreino>(categoriaInicial)
  const [faseAtual, setFaseAtual] = useState<FaseTreino>('fase1')
  const [treinoAtivo, setTreinoAtivo] = useState<{ nome: string; treino: Treino | typeof TREINOS_RAPIDOS['5min'] } | null>(null)
  const [exerciciosConcluidos, setExerciciosConcluidos] = useState<number[]>([])
  const [treinosConcluidos, setTreinosConcluidos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Timer
  const [timerAtivo, setTimerAtivo] = useState(false)
  const [timerSegundos, setTimerSegundos] = useState(0)
  const [exercicioTimer, setExercicioTimer] = useState<number | null>(null)
  const [somAtivo, setSomAtivo] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // IA Dica
  const [dicaIA, setDicaIA] = useState<string | null>(null)
  const [buscandoDica, setBuscandoDica] = useState(false)
  const [dicaDetalhada, setDicaDetalhada] = useState(false)

  // Observacoes do usuario
  const [mostrarObservacoes, setMostrarObservacoes] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [diasTreino, setDiasTreino] = useState<string[]>(['seg', 'qua', 'sex'])
  const [horarioPreferido, setHorarioPreferido] = useState('manha')

  // Dica geral da IA para o treino
  const [dicaGeralIA, setDicaGeralIA] = useState<string | null>(null)
  const [buscandoDicaGeral, setBuscandoDicaGeral] = useState(false)

  const hoje = new Date().toISOString().split('T')[0]
  const faseData = TREINOS_COMPLETOS[faseAtual]

  useEffect(() => {
    const fetchProgresso = async () => {
      if (!profile?.id) return

      try {
        const { data } = await supabase
          .from('treinos_progresso_nutri')
          .select('treino, exercicios_concluidos, concluido')
          .eq('user_id', profile.id)
          .eq('data', hoje)

        if (data) {
          const concluidos = data.filter(t => t.concluido).map(t => t.treino)
          setTreinosConcluidos(concluidos)
        }
      } catch (err) {
        console.error('Erro ao buscar progresso:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgresso()
  }, [profile?.id, hoje])

  // Timer effect
  useEffect(() => {
    if (timerAtivo && timerSegundos > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSegundos(prev => {
          if (prev <= 1) {
            setTimerAtivo(false)
            if (somAtivo) {
              // Tocar som de conclusao
              const audio = new Audio('/sounds/timer-end.mp3')
              audio.play().catch(() => {})
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerAtivo, somAtivo])

  const iniciarTimer = (segundos: number, exercicioIndex: number) => {
    setTimerSegundos(segundos)
    setExercicioTimer(exercicioIndex)
    setTimerAtivo(true)
  }

  const pausarTimer = () => {
    setTimerAtivo(false)
  }

  const resetarTimer = () => {
    setTimerAtivo(false)
    setTimerSegundos(0)
    setExercicioTimer(null)
  }

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const parseTempoParaSegundos = (tempo: string): number => {
    const match = tempo.match(/(\d+)\s*(min|seg|s|m)/i)
    if (match) {
      const valor = parseInt(match[1])
      const unidade = match[2].toLowerCase()
      if (unidade.startsWith('m')) return valor * 60
      return valor
    }
    return 60 // default 1 minuto
  }

  // Buscar dica da IA para o exercicio
  const buscarDicaIA = useCallback(async (exercicio: Exercicio | (typeof TREINOS_RAPIDOS)['5min']['exercicios'][0], detalhada: boolean = false) => {
    setBuscandoDica(true)
    setDicaIA(null)
    setDicaDetalhada(detalhada)

    const tipoMensagem = detalhada
      ? `Explique como executar o exercicio "${exercicio.nome}" de forma clara e visual.

FORMATO OBRIGATORIO (use exatamente esses titulos):

1. POSIÇÃO INICIAL
[Descreva em 1-2 frases curtas]

2. MOVIMENTO
[Descreva o movimento em passos simples e curtos]

3. ERROS A EVITAR
[Liste 2-3 erros comuns em frases curtas]

4. RESPIRAÇÃO
[1 frase sobre quando inspirar/expirar]

5. VARIAÇÕES
[1 opcao mais facil e 1 mais dificil]

Seja CONCISA. Frases curtas. Facil de ler rapidamente.`
      : `Me de uma dica rapida e pratica (max 2 frases) sobre como executar corretamente o exercicio "${exercicio.nome}" para uma mulher. Foque na tecnica e seguranca.`

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: tipoMensagem,
          modo: 'treino',
          timestamp: Date.now() // Garante variacao nas respostas
        })
      })

      const data = await response.json()
      if (data.resposta) {
        setDicaIA(data.resposta)
      }
    } catch (err) {
      console.error('Erro ao buscar dica:', err)
    } finally {
      setBuscandoDica(false)
    }
  }, [])

  // Buscar dica geral motivacional para o treino
  const buscarDicaGeralIA = useCallback(async () => {
    setBuscandoDicaGeral(true)
    setDicaGeralIA(null)

    const contextoDias = diasTreino.length > 0 ? `Ela treina ${diasTreino.join(', ')}` : ''
    const contextoHorario = horarioPreferido ? `no horario da ${horarioPreferido}` : ''
    const contextoObs = observacoes ? `Observacoes pessoais: ${observacoes}` : ''

    try {
      const response = await fetch('/api/nutrivida/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: `Gere uma dica motivacional e pratica para uma mulher que vai comecar seu treino agora. ${contextoDias} ${contextoHorario}. ${contextoObs}

          Inclua:
          - Uma frase motivacional unica e personalizada
          - Uma dica pratica baseada no horario/momento do dia
          - Um lembrete de seguranca ou hidratacao

          Seja amigavel e variada nas respostas (nao repita frases genericas).`,
          modo: 'treino',
          timestamp: Date.now()
        })
      })

      const data = await response.json()
      if (data.resposta) {
        setDicaGeralIA(data.resposta)
      }
    } catch (err) {
      console.error('Erro ao buscar dica geral:', err)
    } finally {
      setBuscandoDicaGeral(false)
    }
  }, [diasTreino, horarioPreferido, observacoes])

  const iniciarTreino = (nome: string, treino: Treino | typeof TREINOS_RAPIDOS['5min']) => {
    setTreinoAtivo({ nome, treino })
    setExerciciosConcluidos([])
    setDicaIA(null)
  }

  const toggleExercicio = (index: number) => {
    setExerciciosConcluidos(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const finalizarTreino = async () => {
    if (!profile?.id || !treinoAtivo) return

    const todosFeitos = exerciciosConcluidos.length === treinoAtivo.treino.exercicios.length

    try {
      await supabase
        .from('treinos_progresso_nutri')
        .upsert({
          user_id: profile.id,
          fase: faseAtual,
          treino: treinoAtivo.nome,
          exercicios_concluidos: exerciciosConcluidos.map(String),
          concluido: todosFeitos,
          data: hoje
        })

      if (todosFeitos) {
        setTreinosConcluidos(prev => [...prev, treinoAtivo.nome])
      }
    } catch (err) {
      console.error('Erro ao salvar treino:', err)
    }

    setTreinoAtivo(null)
    setExerciciosConcluidos([])
    resetarTimer()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Tela do treino ativo
  if (treinoAtivo) {
    const progresso = (exerciciosConcluidos.length / treinoAtivo.treino.exercicios.length) * 100
    const todosConcluidos = exerciciosConcluidos.length === treinoAtivo.treino.exercicios.length

    return (
      <div className="space-y-4 pb-20 lg:pb-6">
        {/* Header do Treino */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setTreinoAtivo(null); resetarTimer() }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{treinoAtivo.treino.nome}</h1>
            <p className="text-sm text-gray-500">{treinoAtivo.treino.foco}</p>
          </div>
        </div>

        {/* Progresso */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{treinoAtivo.treino.duracao}</span>
            </div>
            <span className="font-bold">{Math.round(progresso)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>
          {todosConcluidos && (
            <div className="mt-3 flex items-center justify-center gap-2 text-yellow-300">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">Treino completo!</span>
            </div>
          )}
        </div>

        {/* Timer Flutuante */}
        {timerSegundos > 0 && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Exercicio {(exercicioTimer ?? 0) + 1}</p>
                <p className="text-3xl font-bold font-mono">{formatarTempo(timerSegundos)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSomAtivo(!somAtivo)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  {somAtivo ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={timerAtivo ? pausarTimer : () => setTimerAtivo(true)}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  {timerAtivo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={resetarTimer}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dica da IA */}
        {(dicaIA || buscandoDica) && (
          <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-2xl p-4 ${dicaDetalhada ? 'max-h-[50vh] overflow-y-auto' : ''}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-purple-600 font-medium">
                    {dicaDetalhada ? 'Tutorial Visual' : 'Dica da Nutri IA'}
                  </p>
                  {dicaIA && (
                    <button
                      onClick={() => setDicaIA(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {buscandoDica ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{dicaDetalhada ? 'Gerando tutorial visual...' : 'Gerando dica...'}</span>
                  </div>
                ) : dicaDetalhada ? (
                  // Tutorial visual formatado
                  <div className="space-y-3">
                    {dicaIA?.split(/\n\n|\n(?=\d\.)/g).map((secao, i) => {
                      const linhas = secao.trim().split('\n')
                      const primeiraLinha = linhas[0]
                      const resto = linhas.slice(1).join('\n')

                      // Detectar se e um titulo/secao numerada
                      const isTitulo = /^(\d+\.|•|-|\*|POSIÇÃO|MOVIMENTO|ERROS|RESPIRAÇÃO|VARIAÇÕES|DICA)/i.test(primeiraLinha)

                      // Icones por tipo de secao
                      let icon = '💡'
                      let bgColor = 'bg-gray-50'
                      if (/posição|inicial/i.test(primeiraLinha)) { icon = '🧍'; bgColor = 'bg-green-50' }
                      else if (/movimento|passo|como/i.test(primeiraLinha)) { icon = '🔄'; bgColor = 'bg-blue-50' }
                      else if (/erro|evitar|cuidado/i.test(primeiraLinha)) { icon = '⚠️'; bgColor = 'bg-red-50' }
                      else if (/respiração|respir/i.test(primeiraLinha)) { icon = '🌬️'; bgColor = 'bg-cyan-50' }
                      else if (/variação|alternativa|modific/i.test(primeiraLinha)) { icon = '✨'; bgColor = 'bg-purple-50' }
                      else if (/dica|lembre/i.test(primeiraLinha)) { icon = '💪'; bgColor = 'bg-yellow-50' }

                      if (!isTitulo && primeiraLinha.length < 10) return null

                      return (
                        <div key={i} className={`${bgColor} rounded-xl p-3`}>
                          <div className="flex items-start gap-2">
                            <span className="text-lg flex-shrink-0">{icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{primeiraLinha.replace(/^(\d+\.|•|-|\*)\s*/, '')}</p>
                              {resto && (
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{resto}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{dicaIA}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Exercicios */}
        <div className="space-y-3">
          {treinoAtivo.treino.exercicios.map((exercicio, index) => {
            const concluido = exerciciosConcluidos.includes(index)
            const tempoSegundos = parseTempoParaSegundos(exercicio.tempo)

            return (
              <div
                key={index}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  concluido
                    ? 'border-green-300 bg-green-50'
                    : exercicioTimer === index
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleExercicio(index)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      concluido ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-500 hover:bg-purple-200'
                    }`}
                  >
                    {concluido ? <Check className="w-5 h-5" /> : <span className="font-bold">{index + 1}</span>}
                  </button>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${concluido ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {exercicio.nome}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{exercicio.series}x{exercicio.reps}</span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {exercicio.tempo}
                      </span>
                    </div>
                    <p className="text-xs text-purple-500 mt-2">{exercicio.dica}</p>

                    {/* Botoes de acao */}
                    {!concluido && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button
                          onClick={() => iniciarTimer(tempoSegundos, index)}
                          className="px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-200 flex items-center gap-1"
                        >
                          <Timer className="w-3 h-3" />
                          Iniciar Timer
                        </button>
                        <button
                          onClick={() => buscarDicaIA(exercicio, false)}
                          disabled={buscandoDica}
                          className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-200 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" />
                          Dica Rapida
                        </button>
                        <button
                          onClick={() => buscarDicaIA(exercicio, true)}
                          disabled={buscandoDica}
                          className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-200 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Info className="w-3 h-3" />
                          Tutorial
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Botao Finalizar */}
        <button
          onClick={finalizarTreino}
          className={`w-full py-4 rounded-2xl font-semibold transition-all ${
            todosConcluidos
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {todosConcluidos ? 'Finalizar Treino' : 'Encerrar e Salvar Progresso'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Treinos</h1>
          <p className="text-gray-500">
            {situacaoAtual === 'gestante' ? `Exercicios seguros para gestantes - ${semanaGestacaoCalculada}ª semana` :
             situacaoAtual === 'pos_parto' ? `Recuperacao pos-parto - Bebe com ${idadeBebeCalculada} dias` :
             situacaoAtual === 'amamentando' ? 'Exercicios adaptados para mamaes' :
             'Exercicios para seu bem-estar'}
          </p>
        </div>
        <button
          onClick={() => setMostrarObservacoes(!mostrarObservacoes)}
          className={`p-3 rounded-xl transition-all ${
            mostrarObservacoes
              ? 'bg-purple-500 text-white'
              : 'bg-purple-50 text-purple-500 hover:bg-purple-100'
          }`}
        >
          <Calendar className="w-5 h-5" />
        </button>
      </div>

      {/* Painel de Observacoes */}
      {mostrarObservacoes && (
        <div className="bg-white rounded-2xl border border-purple-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Minha Agenda de Treinos
            </h3>
            <button
              onClick={() => setMostrarObservacoes(false)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dias da semana */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Dias que treino:</p>
            <div className="flex flex-wrap gap-2">
              {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((dia) => (
                <button
                  key={dia}
                  onClick={() => {
                    setDiasTreino(prev =>
                      prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    diasTreino.includes(dia)
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {dia.charAt(0).toUpperCase() + dia.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Horario preferido */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Horario preferido:</p>
            <div className="flex gap-2">
              {[
                { id: 'manha', label: '🌅 Manha' },
                { id: 'tarde', label: '☀️ Tarde' },
                { id: 'noite', label: '🌙 Noite' }
              ].map((h) => (
                <button
                  key={h.id}
                  onClick={() => setHorarioPreferido(h.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    horarioPreferido === h.id
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observacoes pessoais */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Observacoes (lesoes, limitacoes, metas):</p>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Tenho problema no joelho, quero focar em gluteos..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows={2}
            />
          </div>
        </div>
      )}

      {/* Alerta para Gestantes */}
      {situacaoAtual === 'gestante' && (
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Baby className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-pink-800">Gestante - {trimestreGestacao}º Trimestre</h3>
              <p className="text-sm text-pink-700 mt-1">
                {trimestreGestacao === 1 && 'Foque em exercicios leves e alongamentos. Evite impacto e sobrecarga.'}
                {trimestreGestacao === 2 && 'Fase mais segura para exercicios moderados. Mantenha-se hidratada!'}
                {trimestreGestacao === 3 && 'Prepare-se para o parto com exercicios de respiracao e alongamento.'}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs text-pink-600">
                <ShieldAlert className="w-3 h-3" />
                <span>Sempre consulte seu obstetra antes de iniciar qualquer atividade fisica</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerta para Pos-Parto */}
      {(situacaoAtual === 'pos_parto' || situacaoAtual === 'amamentando') && idadeBebeCalculada !== null && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-800">
                {idadeBebeCalculada < 42 ? 'Recuperacao Pos-Parto Inicial' : 'Retorno Gradual aos Exercicios'}
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                {idadeBebeCalculada < 42
                  ? 'Nas primeiras 6 semanas, foque apenas em respiracao e exercicios de Kegel. Aguarde liberacao medica.'
                  : idadeBebeCalculada < 84
                  ? 'Entre 6-12 semanas, comece com exercicios muito leves. Se teve cesarea, aguarde mais.'
                  : 'Seu corpo esta se recuperando bem! Avance gradualmente nos exercicios.'}
              </p>
              {situacaoAtual === 'amamentando' && (
                <div className="mt-2 flex items-center gap-2 text-xs text-purple-600">
                  <Heart className="w-3 h-3" />
                  <span>Amamentando: mantenha boa hidratacao e evite exercicios muito intensos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dica Motivacional da IA */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-purple-700">Dica da Nutri IA</p>
              <button
                onClick={buscarDicaGeralIA}
                disabled={buscandoDicaGeral}
                className="p-1.5 text-purple-500 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${buscandoDicaGeral ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {buscandoDicaGeral ? (
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Gerando dica motivacional...</span>
              </div>
            ) : dicaGeralIA ? (
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{dicaGeralIA}</p>
            ) : (
              <p className="text-sm text-gray-600 mt-1">
                Clique em 🔄 para receber uma dica personalizada antes de comecar!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
        {categoriasDisponiveis.map((cat) => {
          const isActive = categoria === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setCategoria(cat.id as TipoTreino)}
              className={`p-3 rounded-xl text-center transition-all ${
                isActive
                  ? `bg-gradient-to-br ${cat.cor} text-white shadow-lg`
                  : 'bg-white border border-gray-200 hover:border-purple-200'
              }`}
            >
              <cat.icon className={`w-6 h-6 mx-auto mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <p className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>{cat.nome}</p>
            </button>
          )
        })}
      </div>

      {/* Conteudo por categoria */}
      {categoria === 'fases' && (
        <>
          {/* Seletor de Fase */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(Object.keys(TREINOS_COMPLETOS) as FaseTreino[]).map((fase) => {
              const isActive = faseAtual === fase
              return (
                <button
                  key={fase}
                  onClick={() => setFaseAtual(fase)}
                  className={`px-4 py-3 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  <span className="font-semibold">{TREINOS_COMPLETOS[fase].nome}</span>
                  <span className={`block text-xs mt-0.5 ${isActive ? 'text-purple-100' : 'text-gray-400'}`}>
                    Semanas {TREINOS_COMPLETOS[fase].semanas}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Info da Fase */}
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">{faseData.nome}</h2>
                <p className="text-sm text-gray-600 mt-1">{faseData.descricao}</p>
                <p className="text-xs text-purple-600 mt-2 font-medium">{faseData.frequencia}</p>
              </div>
            </div>
          </div>

          {/* Lista de Treinos da Fase */}
          <div className="space-y-3">
            {Object.entries(faseData.treinos).map(([key, treino]) => {
              const concluido = treinosConcluidos.includes(key)
              return (
                <button
                  key={key}
                  onClick={() => iniciarTreino(key, treino)}
                  className={`w-full bg-white rounded-2xl p-5 border-2 text-left transition-all ${
                    concluido ? 'border-green-300 bg-green-50/50' : 'border-gray-100 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      concluido ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-500'
                    }`}>
                      {concluido ? <Check className="w-7 h-7" /> : <Dumbbell className="w-7 h-7" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
                        {concluido && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">
                            Feito hoje
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{treino.foco}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {treino.duracao}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {treino.exercicios.length} exercicios
                        </span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      concluido ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      {concluido ? (
                        <Trophy className="w-5 h-5 text-green-500" />
                      ) : (
                        <Play className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {categoria === 'rapido' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Treinos express para seu dia a dia</p>
          {Object.entries(TREINOS_RAPIDOS).map(([key, treino]) => (
            <button
              key={key}
              onClick={() => iniciarTreino(key, treino)}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-orange-200 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
                  <p className="text-sm text-gray-500">{treino.foco}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {treino.duracao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {treino.exercicios.length} exercicios
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-orange-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {categoria === 'yoga' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Praticas para relaxar e alongar</p>
          {Object.entries(TREINOS_YOGA).map(([key, treino]) => (
            <button
              key={key}
              onClick={() => iniciarTreino(key, treino)}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-blue-200 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Moon className="w-7 h-7 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
                  <p className="text-sm text-gray-500">{treino.foco}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {treino.duracao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {treino.exercicios.length} posturas
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {categoria === 'forca' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Tonifique e fortaleça seus musculos</p>
          {Object.entries(TREINOS_FORCA).map(([key, treino]) => (
            <button
              key={key}
              onClick={() => iniciarTreino(key, treino)}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-green-200 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <Dumbbell className="w-7 h-7 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
                  <p className="text-sm text-gray-500">{treino.foco}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {treino.duracao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {treino.exercicios.length} exercicios
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {categoria === 'cardio' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Queime calorias e melhore o condicionamento</p>
          {Object.entries(TREINOS_CARDIO).map(([key, treino]) => (
            <button
              key={key}
              onClick={() => iniciarTreino(key, treino)}
              className="w-full bg-white rounded-2xl p-5 border-2 border-gray-100 hover:border-pink-200 text-left transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-pink-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{treino.nome}</h3>
                  <p className="text-sm text-gray-500">{treino.foco}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {treino.duracao}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {treino.exercicios.length} exercicios
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Play className="w-5 h-5 text-pink-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Categoria Gestante */}
      {categoria === 'gestante' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Exercicios seguros para sua fase da gestacao</p>

          {/* Treino recomendado para o trimestre */}
          {trimestreGestacao && (
            <div className="bg-white rounded-2xl p-5 border-2 border-pink-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Baby className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold text-gray-800">Recomendado para Voce</h3>
                <span className="ml-auto text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full">
                  {trimestreGestacao}º Trimestre
                </span>
              </div>

              {trimestreGestacao === 1 && (
                <TreinoGestanteCard treino={TREINOS_GESTANTE.primeiro_trimestre} corGradient="from-pink-500 to-rose-500" />
              )}
              {trimestreGestacao === 2 && (
                <TreinoGestanteCard treino={TREINOS_GESTANTE.segundo_trimestre} corGradient="from-purple-500 to-pink-500" />
              )}
              {trimestreGestacao === 3 && (
                <TreinoGestanteCard treino={TREINOS_GESTANTE.terceiro_trimestre} corGradient="from-rose-500 to-pink-500" />
              )}
            </div>
          )}

          {/* Outros treinos de gestante */}
          <h4 className="text-sm font-medium text-gray-600 mt-4">Outros treinos para gestantes:</h4>
          {Object.entries(TREINOS_GESTANTE).map(([key, treino]) => {
            const trimestre = key === 'primeiro_trimestre' ? 1 : key === 'segundo_trimestre' ? 2 : 3
            if (trimestre === trimestreGestacao) return null // Ja mostrado acima
            return (
              <div key={key} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-pink-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center">
                    <Baby className="w-6 h-6 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{treino.nome}</h4>
                    <p className="text-xs text-gray-500">{treino.foco} • {treino.duracao}</p>
                  </div>
                  <span className="text-xs text-gray-400">{trimestre}º tri</span>
                </div>
              </div>
            )
          })}

          {/* Alerta importante */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Sinais de Alerta</p>
              <p className="text-xs text-amber-700 mt-1">
                Pare imediatamente e procure atendimento se sentir: sangramento, dor abdominal forte,
                contrações antes das 37 semanas, vazamento de liquido, tontura intensa ou falta de ar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categoria Pos-Parto */}
      {categoria === 'pos_parto' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Recuperacao gradual e segura apos o parto</p>

          {/* Treino recomendado baseado na idade do bebe */}
          {idadeBebeCalculada !== null && (
            <div className="bg-white rounded-2xl p-5 border-2 border-purple-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <HeartPulse className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-gray-800">Recomendado para Voce</h3>
                <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                  Bebe: {formatarIdadeBebe(idadeBebeCalculada)}
                </span>
              </div>

              {idadeBebeCalculada < 42 ? (
                <TreinoGestanteCard treino={TREINOS_POS_PARTO.recuperacao_inicial} corGradient="from-purple-500 to-pink-500" />
              ) : (
                <TreinoGestanteCard treino={TREINOS_POS_PARTO.fortalecimento_suave} corGradient="from-pink-500 to-purple-500" />
              )}
            </div>
          )}

          {/* Todos os treinos pos-parto */}
          <h4 className="text-sm font-medium text-gray-600 mt-4">Treinos de recuperacao:</h4>
          {Object.entries(TREINOS_POS_PARTO).map(([key, treino]) => (
            <div key={key} className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-purple-200 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{treino.nome}</h4>
                  <p className="text-xs text-gray-500">{treino.foco} • {treino.duracao}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Dicas pos-parto */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Dicas para Recuperacao</h4>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Aguarde liberacao medica antes de iniciar (geralmente 6-8 semanas)</li>
              <li>• Se teve cesarea, aguarde pelo menos 8-10 semanas</li>
              <li>• Comece sempre pelo fortalecimento do assoalho pelvico</li>
              <li>• Evite abdominais tradicionais nos primeiros meses</li>
              <li>• Hidrate-se bem, especialmente se estiver amamentando</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente auxiliar para card de treino gestante/pos-parto
function TreinoGestanteCard({ treino, corGradient }: { treino: typeof TREINOS_GESTANTE.primeiro_trimestre, corGradient: string }) {
  const [expandido, setExpandido] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-800">{treino.nome}</h4>
          <p className="text-sm text-gray-500">{treino.foco}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {treino.duracao}
          </span>
        </div>
      </div>

      {treino.alerta && (
        <div className="bg-amber-50 rounded-lg p-2 mb-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{treino.alerta}</p>
        </div>
      )}

      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        {expandido ? 'Ocultar exercicios' : 'Ver exercicios'}
        {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expandido && (
        <div className="mt-3 space-y-2">
          {treino.exercicios.map((ex, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-800 text-sm">{ex.nome}</p>
                <span className="text-xs text-gray-500">{ex.tempo}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                {ex.series > 0 && <span>{ex.series}x{ex.reps}</span>}
              </div>
              {ex.dica && (
                <p className="text-xs text-purple-600 mt-1 italic">{ex.dica}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
