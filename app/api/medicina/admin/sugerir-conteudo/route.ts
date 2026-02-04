import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/admin/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

interface AssuntoSugerido {
  nome: string
  descricao: string
  subassuntos: string[]
}

interface DisciplinaSugeridaItem {
  nome: string
  descricao: string
  assuntos: AssuntoSugerido[]
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const { tipo, disciplina_id, contexto } = body

    // Buscar disciplinas existentes
    const { data: disciplinasExistentes } = await getSupabaseAdmin()
      .from('disciplinas_med')
      .select('id, nome')
      .eq('ativo', true)

    // Buscar assuntos existentes (se tiver disciplina selecionada)
    let assuntosExistentes: { id: string; nome: string }[] = []
    if (disciplina_id) {
      const { data } = await getSupabaseAdmin()
        .from('assuntos_med')
        .select('id, nome')
        .eq('disciplina_id', disciplina_id)
      assuntosExistentes = data || []
    }

    const disciplinasNomes = disciplinasExistentes?.map(d => d.nome).join(', ') || 'Nenhuma'
    const assuntosNomes = assuntosExistentes.map(a => a.nome).join(', ') || 'Nenhum'

    let prompt = ''

    if (tipo === 'disciplinas') {
      prompt = `Você é um especialista em currículo de Medicina no Brasil.

DISCIPLINAS JÁ CADASTRADAS NO SISTEMA:
${disciplinasNomes}

Sua tarefa é sugerir NOVAS disciplinas de medicina que NÃO ESTÃO na lista acima. Considere o currículo completo de um curso de Medicina brasileiro (1º ao 12º período).

Para cada disciplina, forneça:
1. Nome oficial da disciplina
2. Uma breve descrição
3. 5-8 assuntos principais dessa disciplina
4. 2-3 subassuntos para cada assunto

${contexto ? `Contexto adicional do usuário: ${contexto}` : ''}

IMPORTANTE:
- NÃO sugira disciplinas que já existem
- Foque em disciplinas essenciais do currículo de medicina
- Inclua tanto disciplinas básicas (Anatomia, Fisiologia) quanto clínicas (Clínica Médica, Cirurgia)

Responda APENAS em JSON válido no seguinte formato:
{
  "sugestoes": [
    {
      "nome": "Nome da Disciplina",
      "descricao": "Breve descrição",
      "assuntos": [
        {
          "nome": "Nome do Assunto",
          "descricao": "Breve descrição do assunto",
          "subassuntos": ["Subassunto 1", "Subassunto 2", "Subassunto 3"]
        }
      ]
    }
  ]
}`
    } else if (tipo === 'assuntos') {
      const disciplinaNome = disciplinasExistentes?.find(d => d.id === disciplina_id)?.nome || 'Disciplina'

      prompt = `Você é um especialista em currículo de Medicina no Brasil.

DISCIPLINA SELECIONADA: ${disciplinaNome}

ASSUNTOS JÁ CADASTRADOS NESTA DISCIPLINA:
${assuntosNomes}

Sua tarefa é sugerir NOVOS assuntos para a disciplina "${disciplinaNome}" que NÃO ESTÃO na lista acima.

Para cada assunto, forneça:
1. Nome do assunto
2. Uma breve descrição
3. 3-5 subassuntos relevantes

${contexto ? `Contexto adicional do usuário: ${contexto}` : ''}

IMPORTANTE:
- NÃO sugira assuntos que já existem
- Foque em tópicos essenciais e relevantes para provas de residência
- Considere a progressão do 1º ao 12º período

Responda APENAS em JSON válido no seguinte formato:
{
  "sugestoes": [
    {
      "nome": "Nome do Assunto",
      "descricao": "Breve descrição",
      "subassuntos": ["Subassunto 1", "Subassunto 2", "Subassunto 3"]
    }
  ]
}`
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
    }

    // Chamar a API do Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Resposta inválida da IA')
    }

    // Extrair JSON da resposta
    let jsonStr = textContent.text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
    }

    const sugestoes = JSON.parse(jsonStr)

    return NextResponse.json({
      success: true,
      ...sugestoes,
      tokens_usados: response.usage?.input_tokens + (response.usage?.output_tokens || 0)
    })

  } catch (error) {
    console.error('Erro ao gerar sugestões:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar sugestões com IA' },
      { status: 500 }
    )
  }
}

// Endpoint para criar as sugestões em lote
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const { tipo, disciplina_id, itens } = body

    const resultados = {
      criados: 0,
      ignorados: 0,
      erros: [] as string[]
    }

    if (tipo === 'disciplinas') {
      for (const disciplina of itens as DisciplinaSugeridaItem[]) {
        try {
          // Verificar se já existe
          const { data: existente } = await getSupabaseAdmin()
            .from('disciplinas_med')
            .select('id')
            .ilike('nome', disciplina.nome)
            .single()

          if (existente) {
            resultados.ignorados++
            continue
          }

          // Criar disciplina (nota: tabela não tem coluna descricao)
          const { data: novaDisciplina, error: errDisciplina } = await getSupabaseAdmin()
            .from('disciplinas_med')
            .insert({
              nome: disciplina.nome,
              nome_normalizado: disciplina.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
              icone: 'book',
              cor: '#3B82F6',
              ativo: true
            })
            .select()
            .single()

          if (errDisciplina) throw errDisciplina

          // Criar assuntos da disciplina
          if (disciplina.assuntos && novaDisciplina) {
            for (const assunto of disciplina.assuntos) {
              const { data: novoAssunto, error: errAssunto } = await getSupabaseAdmin()
                .from('assuntos_med')
                .insert({
                  nome: assunto.nome,
                  nome_normalizado: assunto.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                  disciplina_id: novaDisciplina.id
                })
                .select()
                .single()

              if (errAssunto) continue

              // Criar subassuntos
              if (assunto.subassuntos && novoAssunto) {
                for (const subNome of assunto.subassuntos) {
                  await getSupabaseAdmin()
                    .from('subassuntos_med')
                    .insert({
                      nome: subNome,
                      nome_normalizado: subNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                      assunto_id: novoAssunto.id
                    })
                }
              }
            }
          }

          resultados.criados++
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Erro desconhecido')
          resultados.erros.push(`Erro ao criar ${disciplina.nome}: ${errorMessage}`)
        }
      }
    } else if (tipo === 'assuntos') {
      if (!disciplina_id) {
        return NextResponse.json({ error: 'disciplina_id é obrigatório' }, { status: 400 })
      }

      for (const assunto of itens as AssuntoSugerido[]) {
        try {
          // Verificar se já existe
          const { data: existente } = await getSupabaseAdmin()
            .from('assuntos_med')
            .select('id')
            .eq('disciplina_id', disciplina_id)
            .ilike('nome', assunto.nome)
            .single()

          if (existente) {
            resultados.ignorados++
            continue
          }

          // Criar assunto (nota: tabela não tem coluna descricao)
          const { data: novoAssunto, error: errAssunto } = await getSupabaseAdmin()
            .from('assuntos_med')
            .insert({
              nome: assunto.nome,
              nome_normalizado: assunto.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
              disciplina_id
            })
            .select()
            .single()

          if (errAssunto) throw errAssunto

          // Criar subassuntos
          if (assunto.subassuntos && novoAssunto) {
            for (const subNome of assunto.subassuntos) {
              await getSupabaseAdmin()
                .from('subassuntos_med')
                .insert({
                  nome: subNome,
                  nome_normalizado: subNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                  assunto_id: novoAssunto.id
                })
            }
          }

          resultados.criados++
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'Erro desconhecido')
          resultados.erros.push(`Erro ao criar ${assunto.nome}: ${errorMessage}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      resultados
    })

  } catch (error) {
    console.error('Erro ao criar conteúdo:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conteúdo' },
      { status: 500 }
    )
  }
}
