# 🎯 COMO IMPLEMENTAR CADA FEATURE

> Documentação completa para implementação das features avançadas do PreparaMed

---

## 📋 ÍNDICE

1. [Voz (Whisper + TTS)](#1-️-voz-whisper--tts)
2. [Análise de Exames (Vision)](#2--análise-de-exames-vision)
3. [Badges/Ranking](#3--badgesranking)
4. [Pop-ups Estratégicos](#4--pop-ups-estratégicos)
5. [Resumo e Custos](#-resumo)

---

## 1. 🎙️ VOZ (WHISPER + TTS)

### Arquitetura:

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO DE VOZ                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ENTRADA (Usuário fala):                                    │
│  [🎤 Gravar] → Áudio Blob → API Whisper → Texto             │
│                                                              │
│  SAÍDA (IA responde):                                       │
│  Texto resposta → API TTS → Áudio MP3 → [🔊 Reproduzir]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Arquivos a criar:

```
app/api/medicina/ia/speech/
├── transcribe/route.ts    ← Whisper (áudio → texto)
└── synthesize/route.ts    ← TTS (texto → áudio)

hooks/
└── useSpeech.ts           ← Hook de gravação/reprodução

components/medicina/
└── VoiceButton.tsx        ← Botão de microfone
```

### Código da API Whisper:

```typescript
// filepath: app/api/medicina/ia/speech/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'Áudio não enviado' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error) {
    return NextResponse.json({ error: 'Erro na transcrição' }, { status: 500 })
  }
}
```

### Código da API TTS:

```typescript
// filepath: app/api/medicina/ia/speech/synthesize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'nova' } = await req.json()
    
    if (!text) {
      return NextResponse.json({ error: 'Texto não enviado' }, { status: 400 })
    }

    // Limitar texto para não ficar muito caro
    const limitedText = text.slice(0, 4000)

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice, // 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
      input: limitedText,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro na síntese' }, { status: 500 })
  }
}
```

### Hook useSpeech:

```typescript
// filepath: hooks/useSpeech.ts
'use client'
import { useState, useRef, useCallback } from 'react'

export function useSpeech() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Iniciar gravação
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao acessar microfone:', error)
    }
  }, [])

  // Parar gravação e transcrever
  const stopRecording = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve('')
        return
      }

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false)
        setIsTranscribing(true)

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('audio', audioBlob, 'audio.webm')

        try {
          const response = await fetch('/api/medicina/ia/speech/transcribe', {
            method: 'POST',
            body: formData,
          })
          const data = await response.json()
          resolve(data.text || '')
        } catch (error) {
          console.error('Erro na transcrição:', error)
          resolve('')
        } finally {
          setIsTranscribing(false)
        }
      }

      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    })
  }, [])

  // Reproduzir texto como áudio
  const speak = useCallback(async (text: string) => {
    try {
      setIsPlaying(true)
      const response = await fetch('/api/medicina/ia/speech/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      if (audioRef.current) {
        audioRef.current.pause()
      }
      
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
      audioRef.current.play()
    } catch (error) {
      console.error('Erro ao sintetizar voz:', error)
      setIsPlaying(false)
    }
  }, [])

  // Parar reprodução
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  return {
    isRecording,
    isPlaying,
    isTranscribing,
    startRecording,
    stopRecording,
    speak,
    stopSpeaking,
  }
}
```

### Componente VoiceButton:

```typescript
// filepath: components/medicina/VoiceButton.tsx
'use client'
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { useSpeech } from '@/hooks/useSpeech'

interface VoiceButtonProps {
  onTranscription: (text: string) => void
  textToSpeak?: string
  disabled?: boolean
}

export function VoiceButton({ onTranscription, textToSpeak, disabled }: VoiceButtonProps) {
  const { 
    isRecording, 
    isPlaying, 
    isTranscribing,
    startRecording, 
    stopRecording,
    speak,
    stopSpeaking 
  } = useSpeech()

  const handleMicClick = async () => {
    if (isRecording) {
      const text = await stopRecording()
      if (text) onTranscription(text)
    } else {
      startRecording()
    }
  }

  const handleSpeakClick = () => {
    if (isPlaying) {
      stopSpeaking()
    } else if (textToSpeak) {
      speak(textToSpeak)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Botão Microfone */}
      <button
        onClick={handleMicClick}
        disabled={disabled || isTranscribing}
        className={`p-3 rounded-full transition-all ${
          isRecording 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        {isTranscribing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Botão Ouvir */}
      {textToSpeak && (
        <button
          onClick={handleSpeakClick}
          disabled={disabled}
          className={`p-3 rounded-full transition-all ${
            isPlaying 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {isPlaying ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      )}
    </div>
  )
}
```

### Custo estimado:

| Serviço | Preço | Uso típico/mês |
|---------|-------|----------------|
| Whisper | $0.006/min | ~$3-5 |
| TTS-1 | $0.015/1k chars | ~$5-10 |

---

## 2. 🔬 ANÁLISE DE EXAMES (VISION)

### Arquitetura:

```
┌─────────────────────────────────────────────────────────────┐
│                 FLUXO ANÁLISE DE EXAMES                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [📷 Upload] → Imagem Base64 → Claude Vision → Análise      │
│                                                              │
│  Tipos suportados:                                          │
│  • ECG (eletrocardiograma)                                  │
│  • Raio-X (tórax, abdome, ossos)                           │
│  • TC/RM (tomografia, ressonância)                         │
│  • Exames laboratoriais (foto da folha)                    │
│  • Dermatoscopia                                            │
│  • Fundo de olho                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Arquivos a criar:

```
app/api/medicina/ia/analyze-exam/route.ts   ← API principal
components/medicina/ExamAnalyzer.tsx        ← Componente de upload
```

### API de Análise:

```typescript
// filepath: app/api/medicina/ia/analyze-exam/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXAM_PROMPTS: Record<string, string> = {
  ecg: `Você é um cardiologista experiente analisando um ECG. Analise sistematicamente:
1. Ritmo (sinusal, FA, flutter, etc.)
2. Frequência cardíaca
3. Eixo elétrico
4. Intervalos (PR, QRS, QT)
5. Alterações de ST-T
6. Sobrecarga de câmaras
7. Conclusão e diagnóstico provável
Seja didático, explicando cada achado.`,

  raio_x: `Você é um radiologista analisando uma radiografia. Analise sistematicamente:
1. Qualidade técnica (penetração, rotação, inspiração)
2. Estruturas ósseas
3. Partes moles
4. Mediastino e silhueta cardíaca
5. Campos pulmonares
6. Seios costofrênicos
7. Conclusão e diagnóstico provável
Seja didático, explicando cada achado.`,

  laboratorio: `Você é um médico analisando exames laboratoriais. Para cada valor:
1. Identifique se está normal, alto ou baixo
2. Explique o significado clínico
3. Correlacione os achados entre si
4. Sugira possíveis diagnósticos
5. Recomende exames complementares se necessário`,

  dermatoscopia: `Você é um dermatologista analisando uma imagem. Avalie:
1. Padrão global (reticular, globular, homogêneo, etc.)
2. Simetria
3. Bordas
4. Cores presentes
5. Estruturas (rede pigmentar, glóbulos, estrias, véu azul-esbranquiçado)
6. Critérios ABCDE
7. Conclusão: benigno, suspeito ou maligno`,

  geral: `Você é um médico experiente analisando uma imagem médica.
Descreva detalhadamente o que você observa, identifique achados normais e anormais,
e forneça uma análise educativa que ajude o estudante a aprender.`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const image = formData.get('image') as File
    const examType = formData.get('examType') as string || 'geral'
    const question = formData.get('question') as string || ''

    if (!image) {
      return NextResponse.json({ error: 'Imagem não enviada' }, { status: 400 })
    }

    // Converter imagem para base64
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    // Montar prompt
    const systemPrompt = EXAM_PROMPTS[examType] || EXAM_PROMPTS.geral
    const userPrompt = question 
      ? `Analise esta imagem e responda: ${question}`
      : 'Analise esta imagem detalhadamente.'

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      system: systemPrompt,
    })

    const analysisText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    return NextResponse.json({ 
      analysis: analysisText,
      examType,
    })
  } catch (error) {
    console.error('Erro na análise:', error)
    return NextResponse.json({ error: 'Erro ao analisar imagem' }, { status: 500 })
  }
}
```

### Componente ExamAnalyzer:

```typescript
// filepath: components/medicina/ExamAnalyzer.tsx
'use client'
import { useState, useRef } from 'react'
import { Upload, FileImage, Loader2, X, Stethoscope } from 'lucide-react'

const EXAM_TYPES = [
  { id: 'ecg', label: '🫀 ECG', desc: 'Eletrocardiograma' },
  { id: 'raio_x', label: '🦴 Raio-X', desc: 'Radiografias' },
  { id: 'laboratorio', label: '🧪 Laboratório', desc: 'Exames de sangue/urina' },
  { id: 'dermatoscopia', label: '🔬 Pele', desc: 'Lesões cutâneas' },
  { id: 'geral', label: '📋 Outro', desc: 'Outros exames' },
]

interface ExamAnalyzerProps {
  onAnalysis: (analysis: string) => void
}

export function ExamAnalyzer({ onAnalysis }: ExamAnalyzerProps) {
  const [selectedType, setSelectedType] = useState('geral')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleAnalyze = async () => {
    if (!image) return

    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('examType', selectedType)
      formData.append('question', question)

      const response = await fetch('/api/medicina/ia/analyze-exam', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.analysis) {
        onAnalysis(data.analysis)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const clearImage = () => {
    setImage(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Stethoscope className="w-5 h-5 text-blue-400" />
        Análise de Exames
      </h3>

      {/* Tipo de exame */}
      <div className="flex flex-wrap gap-2">
        {EXAM_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-3 py-2 rounded-lg text-sm transition-all ${
              selectedType === type.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Upload de imagem */}
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400">Clique para enviar imagem do exame</p>
          <p className="text-gray-500 text-sm mt-1">PNG, JPG até 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-64 object-contain rounded-lg"
          />
          <button
            onClick={clearImage}
            className="absolute top-2 right-2 p-1 bg-red-500 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pergunta opcional */}
      {preview && (
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pergunta específica (opcional)..."
          className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
        />
      )}

      {/* Botão analisar */}
      {preview && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <FileImage className="w-5 h-5" />
              Analisar Exame
            </>
          )}
        </button>
      )}
    </div>
  )
}
```

---

## 3. 🏆 BADGES/RANKING

### Arquitetura:

```
┌─────────────────────────────────────────────────────────────┐
│                  SISTEMA DE BADGES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  TIPOS DE CONQUISTAS:                                       │
│  • Questões: 100, 500, 1000, 5000 respondidas              │
│  • Sequência: 7, 30, 100 dias seguidos                     │
│  • Acertos: 80%, 90%, 95% em simulado                      │
│  • Especialidades: Completou X em Cardio, Neuro, etc.      │
│  • Social: Ajudou X pessoas, compartilhou, etc.            │
│                                                              │
│  RANKING:                                                   │
│  • Semanal (reseta domingo)                                │
│  • Mensal (reseta dia 1)                                   │
│  • Geral (all-time)                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tabelas no banco:

```sql
-- Definição de badges disponíveis
CREATE TABLE badges_med (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT, -- emoji ou URL
  categoria TEXT, -- 'questoes', 'sequencia', 'acertos', 'social'
  requisito JSONB, -- {"tipo": "questoes_total", "valor": 1000}
  pontos INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Badges conquistados por usuário
CREATE TABLE badges_usuario_med (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  badge_id UUID REFERENCES badges_med(id),
  conquistado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Ranking/Pontuação
CREATE TABLE ranking_med (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  pontos_semana INTEGER DEFAULT 0,
  pontos_mes INTEGER DEFAULT 0,
  pontos_total INTEGER DEFAULT 0,
  questoes_semana INTEGER DEFAULT 0,
  questoes_mes INTEGER DEFAULT 0,
  questoes_total INTEGER DEFAULT 0,
  sequencia_atual INTEGER DEFAULT 0,
  maior_sequencia INTEGER DEFAULT 0,
  ultimo_estudo DATE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Inserir badges padrão
INSERT INTO badges_med (codigo, nome, descricao, icone, categoria, requisito, pontos) VALUES
('questoes_100', 'Iniciante', 'Respondeu 100 questões', '🌱', 'questoes', '{"tipo": "questoes_total", "valor": 100}', 10),
('questoes_500', 'Dedicado', 'Respondeu 500 questões', '📚', 'questoes', '{"tipo": "questoes_total", "valor": 500}', 25),
('questoes_1000', 'Estudioso', 'Respondeu 1000 questões', '🎓', 'questoes', '{"tipo": "questoes_total", "valor": 1000}', 50),
('questoes_5000', 'Mestre', 'Respondeu 5000 questões', '👑', 'questoes', '{"tipo": "questoes_total", "valor": 5000}', 100),
('sequencia_7', 'Consistente', '7 dias seguidos estudando', '🔥', 'sequencia', '{"tipo": "sequencia", "valor": 7}', 20),
('sequencia_30', 'Imparável', '30 dias seguidos estudando', '💪', 'sequencia', '{"tipo": "sequencia", "valor": 30}', 50),
('acerto_80', 'Boa Performance', '80% em um simulado', '⭐', 'acertos', '{"tipo": "simulado_acerto", "valor": 80}', 15),
('acerto_90', 'Excelência', '90% em um simulado', '🌟', 'acertos', '{"tipo": "simulado_acerto", "valor": 90}', 30),
('acerto_95', 'Perfeição', '95% em um simulado', '💎', 'acertos', '{"tipo": "simulado_acerto", "valor": 95}', 50);
```

### Hook useBadges:

```typescript
// filepath: hooks/useBadges.ts
'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useMedAuth } from '@/contexts/MedAuthContext'

interface Badge {
  id: string
  codigo: string
  nome: string
  descricao: string
  icone: string
  categoria: string
  pontos: number
  conquistado_em?: string
}

interface Ranking {
  pontos_semana: number
  pontos_mes: number
  pontos_total: number
  sequencia_atual: number
  posicao_semana?: number
  posicao_mes?: number
  posicao_geral?: number
}

export function useBadges() {
  const { user } = useMedAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [meusBadges, setMeusBadges] = useState<Badge[]>([])
  const [ranking, setRanking] = useState<Ranking | null>(null)
  const [loading, setLoading] = useState(true)

  // Buscar todos os badges e os conquistados
  const fetchBadges = useCallback(async () => {
    if (!user) return

    try {
      // Todos os badges
      const { data: todosBadges } = await supabase
        .from('badges_med')
        .select('*')
        .order('pontos')

      // Meus badges
      const { data: conquistados } = await supabase
        .from('badges_usuario_med')
        .select('badge_id, conquistado_em, badges_med(*)')
        .eq('user_id', user.id)

      // Meu ranking
      const { data: meuRanking } = await supabase
        .from('ranking_med')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setBadges(todosBadges || [])
      setMeusBadges(conquistados?.map(c => ({
        ...c.badges_med,
        conquistado_em: c.conquistado_em
      })) || [])
      setRanking(meuRanking)
    } catch (error) {
      console.error('Erro ao buscar badges:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  // Verificar e conceder novos badges
  const verificarBadges = useCallback(async () => {
    if (!user || !ranking) return

    const { data: todosBadges } = await supabase
      .from('badges_med')
      .select('*')

    const { data: jaConquistados } = await supabase
      .from('badges_usuario_med')
      .select('badge_id')
      .eq('user_id', user.id)

    const idsConquistados = new Set(jaConquistados?.map(b => b.badge_id))
    const novosConquistados: string[] = []

    for (const badge of todosBadges || []) {
      if (idsConquistados.has(badge.id)) continue

      const requisito = badge.requisito as { tipo: string; valor: number }
      let conquistou = false

      switch (requisito.tipo) {
        case 'questoes_total':
          conquistou = ranking.questoes_total >= requisito.valor
          break
        case 'sequencia':
          conquistou = ranking.sequencia_atual >= requisito.valor
          break
      }

      if (conquistou) {
        novosConquistados.push(badge.id)
      }
    }

    // Inserir novos badges
    if (novosConquistados.length > 0) {
      await supabase.from('badges_usuario_med').insert(
        novosConquistados.map(badge_id => ({
          user_id: user.id,
          badge_id,
        }))
      )
      fetchBadges() // Atualizar lista
    }

    return novosConquistados.length
  }, [user, ranking, fetchBadges])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  return {
    badges,
    meusBadges,
    ranking,
    loading,
    verificarBadges,
    refresh: fetchBadges,
  }
}
```

### Componente BadgeDisplay:

```typescript
// filepath: components/medicina/BadgeDisplay.tsx
'use client'
import { useBadges } from '@/hooks/useBadges'
import { useMedAuth } from '@/contexts/MedAuthContext'

export function BadgeDisplay() {
  const { meusBadges, badges, ranking } = useBadges()
  const { plano } = useMedAuth()

  const planoBadge = plano === 'residencia' ? '👑' : plano === 'premium' ? '💎' : '🆓'

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      {/* Plano Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{planoBadge}</span>
        <span className="font-semibold capitalize">{plano}</span>
      </div>

      {/* Sequência */}
      {ranking && (
        <div className="mb-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold">{ranking.sequencia_atual} dias</p>
              <p className="text-xs text-gray-400">Sequência atual</p>
            </div>
          </div>
        </div>
      )}

      {/* Badges conquistados */}
      <h3 className="text-sm text-gray-400 mb-2">Conquistas</h3>
      <div className="flex flex-wrap gap-2">
        {meusBadges.map((badge) => (
          <div
            key={badge.id}
            className="p-2 bg-gray-700 rounded-lg text-center"
            title={badge.descricao}
          >
            <span className="text-xl">{badge.icone}</span>
          </div>
        ))}
        
        {/* Badges não conquistados (bloqueados) */}
        {badges
          .filter(b => !meusBadges.find(mb => mb.id === b.id))
          .slice(0, 3)
          .map((badge) => (
            <div
              key={badge.id}
              className="p-2 bg-gray-900 rounded-lg text-center opacity-40"
              title={`${badge.nome}: ${badge.descricao}`}
            >
              <span className="text-xl grayscale">🔒</span>
            </div>
          ))}
      </div>
    </div>
  )
}
```

---

## 4. 💬 POP-UPS ESTRATÉGICOS

### Arquitetura:

```
┌─────────────────────────────────────────────────────────────┐
│              POP-UPS ESTRATÉGICOS (NÃO INVASIVOS)           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MOMENTOS DE EXIBIÇÃO:                                      │
│  ✅ Trial acabou (único, inevitável)                        │
│  ✅ Limite atingido (único, inevitável)                     │
│  ✅ Clicou em feature bloqueada (contexto)                  │
│  ✅ Conquista desbloqueada (celebração)                     │
│  ✅ Bom desempenho em simulado (1x/semana)                  │
│                                                              │
│  NUNCA EXIBIR:                                              │
│  ❌ Ao abrir o app                                          │
│  ❌ Durante estudo                                          │
│  ❌ Aleatoriamente                                          │
│  ❌ Mais de 1x por sessão (exceto limite)                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componente UpgradeModal:

```typescript
// filepath: components/medicina/UpgradeModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { X, Crown, Zap, Check } from 'lucide-react'
import { useMedAuth } from '@/contexts/MedAuthContext'

type ModalTipo = 'trial_expirado' | 'limite_questoes' | 'limite_chat' | 'feature_bloqueada' | 'conquista'

interface UpgradeModalProps {
  tipo: ModalTipo
  feature?: string
  onClose: () => void
}

const MODAL_CONTENT: Record<ModalTipo, {
  titulo: string
  subtitulo: string
  icone: React.ReactNode
  cor: string
}> = {
  trial_expirado: {
    titulo: 'Seu período de teste acabou',
    subtitulo: 'Continue sua jornada de estudos',
    icone: <Zap className="w-8 h-8" />,
    cor: 'yellow',
  },
  limite_questoes: {
    titulo: 'Limite de questões atingido',
    subtitulo: 'Você completou suas questões de hoje',
    icone: <Check className="w-8 h-8" />,
    cor: 'blue',
  },
  limite_chat: {
    titulo: 'Mensagens esgotadas',
    subtitulo: 'Você usou todas as mensagens do mês',
    icone: <Zap className="w-8 h-8" />,
    cor: 'purple',
  },
  feature_bloqueada: {
    titulo: 'Recurso Premium',
    subtitulo: 'Desbloqueie para acessar',
    icone: <Crown className="w-8 h-8" />,
    cor: 'yellow',
  },
  conquista: {
    titulo: 'Parabéns! 🎉',
    subtitulo: 'Você desbloqueou uma conquista',
    icone: <Crown className="w-8 h-8" />,
    cor: 'green',
  },
}

export function UpgradeModal({ tipo, feature, onClose }: UpgradeModalProps) {
  const { plano } = useMedAuth()
  const content = MODAL_CONTENT[tipo]

  // Para conquistas, fechar automaticamente
  useEffect(() => {
    if (tipo === 'conquista') {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [tipo, onClose])

  const planoSugerido = plano === 'gratuito' ? 'Premium' : 'Residência'
  const precoSugerido = plano === 'gratuito' ? 'R$60' : 'R$150'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6 relative">
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone */}
        <div className={`w-16 h-16 rounded-full bg-${content.cor}-500/20 flex items-center justify-center mx-auto mb-4 text-${content.cor}-400`}>
          {content.icone}
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold text-center mb-2">
          {content.titulo}
        </h2>
        <p className="text-gray-400 text-center mb-6">
          {content.subtitulo}
          {feature && <span className="block mt-1 text-blue-400">{feature}</span>}
        </p>

        {/* Não mostrar upgrade para conquistas */}
        {tipo !== 'conquista' && (
          <>
            {/* Benefícios */}
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-300 mb-3">
                Com o plano {planoSugerido} você tem:
              </p>
              <ul className="space-y-2 text-sm">
                {plano === 'gratuito' ? (
                  <>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      80 questões por dia
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      100 mensagens de IA por mês
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Simulados e flashcards
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Questões e chat ILIMITADOS
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Casos clínicos por voz
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Análise de exames com IA
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors"
              >
                {tipo === 'limite_questoes' ? 'Volto amanhã' : 'Agora não'}
              </button>
              <button
                onClick={() => window.location.href = '/medicina/planos'}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors"
              >
                Ver {planoSugerido}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

### Hook useUpgradePrompt:

```typescript
// filepath: hooks/useUpgradePrompt.ts
'use client'
import { useState, useCallback } from 'react'

type ModalTipo = 'trial_expirado' | 'limite_questoes' | 'limite_chat' | 'feature_bloqueada' | 'conquista'

export function useUpgradePrompt() {
  const [showModal, setShowModal] = useState(false)
  const [modalTipo, setModalTipo] = useState<ModalTipo>('feature_bloqueada')
  const [modalFeature, setModalFeature] = useState<string>('')

  const mostrarModal = useCallback((tipo: ModalTipo, feature?: string) => {
    // Verificar se já mostrou nesta sessão (exceto limites)
    const key = `modal_${tipo}_shown`
    if (tipo !== 'limite_questoes' && tipo !== 'limite_chat') {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, 'true')
    }

    setModalTipo(tipo)
    setModalFeature(feature || '')
    setShowModal(true)
  }, [])

  const fecharModal = useCallback(() => {
    setShowModal(false)
  }, [])

  return {
    showModal,
    modalTipo,
    modalFeature,
    mostrarModal,
    fecharModal,
  }
}
```

---

## 📋 RESUMO

| Feature | Complexidade | Tempo Estimado | Custo Mensal |
|---------|--------------|----------------|--------------|
| **Voz (Whisper + TTS)** | Média | 2-3h | ~$10-15 |
| **Análise de Exames** | Média | 2h | ~$5-10 |
| **Badges/Ranking** | Baixa | 2h | $0 |
| **Pop-ups Estratégicos** | Baixa | 1h | $0 |

---

## 📦 DEPENDÊNCIAS NECESSÁRIAS

```bash
# Para Voz (OpenAI Whisper + TTS)
npm install openai

# Para gravação de áudio (opcional, nativo funciona)
npm install react-media-recorder
```

---

## 🔧 VARIÁVEIS DE AMBIENTE

```env
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Instalar dependência `openai`
- [ ] Criar API de transcrição (Whisper)
- [ ] Criar API de síntese (TTS)
- [ ] Criar hook `useSpeech`
- [ ] Criar componente `VoiceButton`
- [ ] Criar API de análise de exames
- [ ] Criar componente `ExamAnalyzer`
- [ ] Criar tabelas de badges no banco
- [ ] Criar hook `useBadges`
- [ ] Criar componente `BadgeDisplay`
- [ ] Criar componente `UpgradeModal`
- [ ] Criar hook `useUpgradePrompt`
- [ ] Integrar tudo na página de IA

---

> **Documento gerado em:** Janeiro 2026
> **Projeto:** PreparaMed
> **Versão:** 1.0