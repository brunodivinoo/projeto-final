import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

interface ConfigGeracao {
  disciplina: string
  assunto?: string
  banca: string
  quantidade: number
  modalidade: 'multipla_escolha' | 'certo_errado' | 'mista'
  dificuldade: 'facil' | 'media' | 'dificil'
}

// Função para normalizar texto
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

// Buscar ou criar disciplina
async function getOrCreateDisciplina(nome: string): Promise<string> {
  const nomeNormalizado = normalizar(nome)

  const { data: existing } = await supabase
    .from('disciplinas')
    .select('id')
    .eq('nome_normalizado', nomeNormalizado)
    .single()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('disciplinas')
    .insert({ nome, nome_normalizado: nomeNormalizado })
    .select('id')
    .single()

  return created?.id || ''
}

// Buscar ou criar assunto
async function getOrCreateAssunto(disciplinaId: string, nome: string): Promise<string | null> {
  if (!nome) return null

  const nomeNormalizado = normalizar(nome)

  const { data: existing } = await supabase
    .from('assuntos')
    .select('id')
    .eq('disciplina_id', disciplinaId)
    .eq('nome_normalizado', nomeNormalizado)
    .single()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('assuntos')
    .insert({ disciplina_id: disciplinaId, nome, nome_normalizado: nomeNormalizado })
    .select('id')
    .single()

  return created?.id || null
}

export async function POST(req: NextRequest) {
  try {
    const config = await req.json() as ConfigGeracao

    if (!config.disciplina) {
      return NextResponse.json({ error: 'Disciplina é obrigatória' }, { status: 400 })
    }

    const quantidade = Math.min(Math.max(1, config.quantidade), 100)

    // Garantir que disciplina existe
    const disciplinaId = await getOrCreateDisciplina(config.disciplina)
    if (config.assunto) {
      await getOrCreateAssunto(disciplinaId, config.assunto)
    }

    // Gerar questões em lotes de 5
    const questoesGeradas: Array<{
      enunciado: string
      gabarito: string
      comentario: string
      alternativa_a?: string
      alternativa_b?: string
      alternativa_c?: string
      alternativa_d?: string
      alternativa_e?: string
    }> = []

    for (let i = 0; i < quantidade; i += 5) {
      const qtdLote = Math.min(5, quantidade - i)
      const modalidadeLote = config.modalidade === 'mista'
        ? (i % 2 === 0 ? 'multipla_escolha' : 'certo_errado')
        : config.modalidade

      const prompt = modalidadeLote === 'certo_errado'
        ? `Você é um especialista em elaborar questões de concursos públicos brasileiros.

Crie ${qtdLote} questões no estilo ${config.banca} (Certo ou Errado).

CONFIGURAÇÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}
- Dificuldade: ${config.dificuldade}
- Modalidade: Certo ou Errado

INSTRUÇÕES:
1. Cada questão deve ser uma afirmação que pode ser julgada como CERTA ou ERRADA
2. Varie os temas dentro da disciplina/assunto
3. Inclua comentário explicativo detalhado para cada questão

RESPONDA EM JSON:
{
  "questoes": [
    {
      "enunciado": "afirmação para julgar",
      "gabarito": "CERTO" ou "ERRADO",
      "comentario": "explicação detalhada"
    }
  ]
}

Retorne APENAS o JSON, sem markdown.`
        : `Você é um especialista em elaborar questões de concursos públicos brasileiros.

Crie ${qtdLote} questões de múltipla escolha no estilo ${config.banca}.

CONFIGURAÇÃO:
- Disciplina: ${config.disciplina}
- Assunto: ${config.assunto || 'Geral'}
- Dificuldade: ${config.dificuldade}
- Modalidade: Múltipla Escolha (5 alternativas: A, B, C, D, E)

INSTRUÇÕES:
1. Cada questão deve ter 5 alternativas (A a E), sendo apenas UMA correta
2. Varie os temas dentro da disciplina/assunto
3. Inclua comentário explicativo detalhado para cada questão

RESPONDA EM JSON:
{
  "questoes": [
    {
      "enunciado": "texto do enunciado",
      "alternativa_a": "texto da alternativa A",
      "alternativa_b": "texto da alternativa B",
      "alternativa_c": "texto da alternativa C",
      "alternativa_d": "texto da alternativa D",
      "alternativa_e": "texto da alternativa E",
      "gabarito": "A",
      "comentario": "explicação detalhada"
    }
  ]
}

Retorne APENAS o JSON, sem markdown.`

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
            })
          }
        )

        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

          let resultado
          try {
            resultado = JSON.parse(text.trim())
          } catch {
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              resultado = JSON.parse(jsonMatch[0])
            }
          }

          if (resultado?.questoes) {
            questoesGeradas.push(...resultado.questoes)
          }
        }
      } catch (err) {
        console.error(`Erro no lote ${i}:`, err)
      }

      // Pausa entre lotes
      if (i + 5 < quantidade) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Inserir questões no banco
    const questoesParaInserir = questoesGeradas.map((q, index) => ({
      tipo_prova: 'concurso',
      modalidade: q.alternativa_a ? 'multipla_escolha_5' : 'certo_errado',
      disciplina: config.disciplina,
      assunto: config.assunto || null,
      banca: config.banca.toLowerCase(),
      ano: 2025,
      dificuldade: config.dificuldade,
      enunciado: q.enunciado,
      alternativa_a: q.alternativa_a || null,
      alternativa_b: q.alternativa_b || null,
      alternativa_c: q.alternativa_c || null,
      alternativa_d: q.alternativa_d || null,
      alternativa_e: q.alternativa_e || null,
      gabarito: q.gabarito,
      comentario: q.comentario,
      id_original: `admin-${Date.now()}-${index}`
    }))

    const { error } = await supabase
      .from('questoes')
      .insert(questoesParaInserir)

    if (error) {
      console.error('Erro ao inserir questões:', error)
      return NextResponse.json({ error: 'Erro ao inserir questões' }, { status: 500 })
    }

    return NextResponse.json({
      geradas: questoesGeradas.length,
      inseridas: questoesParaInserir.length
    })
  } catch (error) {
    console.error('Erro ao gerar questões:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
