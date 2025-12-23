import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

// POST - Gerar UMA questão e salvar
export async function POST(req: NextRequest) {
  try {
    const { fila_id, user_id } = await req.json() as {
      fila_id: string
      user_id: string
    }

    if (!fila_id || !user_id) {
      return NextResponse.json({ error: 'fila_id e user_id obrigatórios' }, { status: 400 })
    }

    // Buscar item da fila
    const { data: item, error: fetchError } = await supabase
      .from('geracao_fila')
      .select('*')
      .eq('id', fila_id)
      .eq('user_id', user_id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Verificar se ainda precisa gerar
    if (item.geradas >= item.quantidade) {
      // Marcar como concluído
      await supabase
        .from('geracao_fila')
        .update({ status: 'concluido', completed_at: new Date().toISOString() })
        .eq('id', fila_id)

      return NextResponse.json({ concluido: true, geradas: item.geradas })
    }

    // Verificar se foi cancelado
    if (item.status === 'cancelado') {
      return NextResponse.json({ cancelado: true })
    }

    // Atualizar status para processando
    if (item.status === 'pendente') {
      await supabase
        .from('geracao_fila')
        .update({ status: 'processando', started_at: new Date().toISOString() })
        .eq('id', fila_id)
    }

    // Montar prompt para UMA questão
    const prompt = item.modalidade === 'certo_errado'
      ? `Você é um especialista em elaborar questões de concursos públicos brasileiros.

Crie APENAS 1 questão no estilo ${item.banca.toUpperCase()} (Certo ou Errado).

CONFIGURAÇÃO:
- Disciplina: ${item.disciplina}
- Assunto: ${item.assunto || 'Geral'}
${item.subassunto ? `- Subassunto/Tema específico: ${item.subassunto}` : ''}
- Dificuldade: ${item.dificuldade}

INSTRUÇÕES IMPORTANTES:
1. A questão deve ser uma AFIRMAÇÃO que pode ser julgada como CERTA ou ERRADA
2. Use linguagem técnica e formal de concursos
3. Base-se em legislação, doutrina ou jurisprudência ATUALIZADAS
4. O comentário deve explicar DETALHADAMENTE o porquê da resposta
5. NÃO repita questões genéricas - seja ESPECÍFICO sobre o tema

RESPONDA EM JSON:
{
  "enunciado": "afirmação completa para julgar",
  "gabarito": "CERTO" ou "ERRADO",
  "comentario": "explicação detalhada com fundamentação"
}

Retorne APENAS o JSON, sem markdown.`
      : `Você é um especialista em elaborar questões de concursos públicos brasileiros.

Crie APENAS 1 questão de múltipla escolha no estilo ${item.banca.toUpperCase()}.

CONFIGURAÇÃO:
- Disciplina: ${item.disciplina}
- Assunto: ${item.assunto || 'Geral'}
${item.subassunto ? `- Subassunto/Tema específico: ${item.subassunto}` : ''}
- Dificuldade: ${item.dificuldade}
- Modalidade: Múltipla Escolha (5 alternativas: A, B, C, D, E)

INSTRUÇÕES IMPORTANTES:
1. Crie um enunciado completo e contextualizado
2. As 5 alternativas devem ser PLAUSÍVEIS, com apenas UMA correta
3. Use linguagem técnica e formal de concursos
4. Base-se em legislação, doutrina ou jurisprudência ATUALIZADAS
5. O comentário deve explicar CADA alternativa (por que está certa/errada)
6. NÃO repita questões genéricas - seja ESPECÍFICO sobre o tema

RESPONDA EM JSON:
{
  "enunciado": "texto completo do enunciado com contexto",
  "alternativa_a": "texto da alternativa A",
  "alternativa_b": "texto da alternativa B",
  "alternativa_c": "texto da alternativa C",
  "alternativa_d": "texto da alternativa D",
  "alternativa_e": "texto da alternativa E",
  "gabarito": "A" (ou B, C, D, E),
  "comentario": "explicação detalhada de cada alternativa"
}

Retorne APENAS o JSON, sem markdown.`

    // Chamar Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 4096
          }
        })
      }
    )

    if (!response.ok) {
      // Incrementar erro
      await supabase
        .from('geracao_fila')
        .update({ erros: item.erros + 1 })
        .eq('id', fila_id)

      return NextResponse.json({
        erro: true,
        message: 'Erro na API Gemini',
        status: response.status
      })
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Parse do JSON
    let questao
    try {
      // Tentar parse direto
      questao = JSON.parse(text.trim())
    } catch {
      // Tentar extrair JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        questao = JSON.parse(jsonMatch[0])
      }
    }

    if (!questao || !questao.enunciado) {
      // Incrementar erro
      await supabase
        .from('geracao_fila')
        .update({ erros: item.erros + 1 })
        .eq('id', fila_id)

      return NextResponse.json({
        erro: true,
        message: 'Resposta inválida da IA',
        resposta: text.slice(0, 200)
      })
    }

    // Inserir questão no banco
    const questaoParaInserir = {
      tipo_prova: 'concurso',
      modalidade: questao.alternativa_a ? 'multipla_escolha_5' : 'certo_errado',
      disciplina: item.disciplina,
      assunto: item.assunto || null,
      subassunto: item.subassunto || null,
      banca: item.banca.toLowerCase(),
      ano: 2025,
      dificuldade: item.dificuldade,
      enunciado: questao.enunciado,
      alternativa_a: questao.alternativa_a || null,
      alternativa_b: questao.alternativa_b || null,
      alternativa_c: questao.alternativa_c || null,
      alternativa_d: questao.alternativa_d || null,
      alternativa_e: questao.alternativa_e || null,
      gabarito: questao.gabarito,
      comentario: questao.comentario,
      id_original: `admin-${user_id.slice(0, 8)}-${Date.now()}`
    }

    const { error: insertError } = await supabase
      .from('questoes')
      .insert(questaoParaInserir)

    if (insertError) {
      console.error('Erro ao inserir questão:', insertError)
      await supabase
        .from('geracao_fila')
        .update({ erros: item.erros + 1 })
        .eq('id', fila_id)

      return NextResponse.json({
        erro: true,
        message: 'Erro ao salvar questão',
        details: insertError.message
      })
    }

    // Atualizar contador de geradas
    const novasGeradas = item.geradas + 1
    const statusFinal = novasGeradas >= item.quantidade ? 'concluido' : 'processando'

    await supabase
      .from('geracao_fila')
      .update({
        geradas: novasGeradas,
        status: statusFinal,
        ...(statusFinal === 'concluido' ? { completed_at: new Date().toISOString() } : {})
      })
      .eq('id', fila_id)

    return NextResponse.json({
      sucesso: true,
      geradas: novasGeradas,
      total: item.quantidade,
      concluido: novasGeradas >= item.quantidade,
      questao: {
        disciplina: item.disciplina,
        assunto: item.assunto,
        subassunto: item.subassunto,
        enunciado: questao.enunciado.slice(0, 100) + '...'
      }
    })
  } catch (error) {
    console.error('Erro ao gerar questão:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
