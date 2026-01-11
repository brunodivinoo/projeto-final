// API Route - Geração de Documentos PREPARAMED

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PlanoIA, verificarLimiteIA, incrementarUsoIA, calcularCusto } from '@/lib/ai'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS } from '@/lib/ai/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Templates de documentos
const TEMPLATES = {
  resumo_tema: {
    titulo: 'Resumo de Tema',
    prompt: `Crie um resumo completo e bem estruturado sobre o tema fornecido.

ESTRUTURA OBRIGATÓRIA:
1. INTRODUÇÃO
   - Definição e importância clínica
   - Epidemiologia

2. FISIOPATOLOGIA
   - Mecanismos envolvidos
   - Fatores de risco

3. QUADRO CLÍNICO
   - Sinais e sintomas principais
   - Formas de apresentação

4. DIAGNÓSTICO
   - Critérios diagnósticos
   - Exames complementares
   - Diagnóstico diferencial

5. TRATAMENTO
   - Medidas gerais
   - Tratamento farmacológico
   - Tratamento não-farmacológico

6. PROGNÓSTICO E COMPLICAÇÕES

7. PONTOS-CHAVE PARA PROVAS

Formate em Markdown com headers, listas e tabelas quando apropriado.`
  },

  protocolo_atendimento: {
    titulo: 'Protocolo de Atendimento',
    prompt: `Crie um protocolo de atendimento médico completo para a condição especificada.

ESTRUTURA:
1. TÍTULO E OBJETIVO
2. POPULAÇÃO-ALVO
3. CRITÉRIOS DE INCLUSÃO/EXCLUSÃO
4. FLUXOGRAMA DE ATENDIMENTO
5. AVALIAÇÃO INICIAL
   - Anamnese
   - Exame físico
   - Exames complementares
6. CLASSIFICAÇÃO DE GRAVIDADE
7. CONDUTAS POR NÍVEL DE GRAVIDADE
8. CRITÉRIOS DE INTERNAÇÃO
9. CRITÉRIOS DE ALTA
10. SEGUIMENTO
11. REFERÊNCIAS

Use formatação Markdown com tabelas e fluxogramas em ASCII quando útil.`
  },

  caso_clinico: {
    titulo: 'Caso Clínico Comentado',
    prompt: `Crie um caso clínico didático completo sobre o tema especificado.

ESTRUTURA:
1. IDENTIFICAÇÃO DO PACIENTE (fictício)
2. QUEIXA PRINCIPAL
3. HISTÓRIA DA DOENÇA ATUAL (HDA)
4. HISTÓRIA PATOLÓGICA PREGRESSA (HPP)
5. HISTÓRIA FAMILIAR
6. HISTÓRIA SOCIAL
7. EXAME FÍSICO
8. EXAMES COMPLEMENTARES
9. QUESTÕES PARA DISCUSSÃO (5 questões)
10. DISCUSSÃO DO CASO
    - Análise dos dados clínicos
    - Diagnóstico diferencial
    - Diagnóstico definitivo e justificativa
11. TRATAMENTO PROPOSTO
12. EVOLUÇÃO E DESFECHO
13. PONTOS DE APRENDIZADO

Formato: Markdown bem estruturado.`
  },

  questoes_comentadas: {
    titulo: 'Questões Comentadas',
    prompt: `Crie questões no estilo de provas de residência médica sobre o tema.

PARA CADA QUESTÃO:
1. ENUNCIADO (caso clínico ou questão direta)
2. ALTERNATIVAS (A, B, C, D, E)
3. GABARITO
4. COMENTÁRIO DETALHADO
   - Por que a correta está correta
   - Por que cada alternativa incorreta está errada
5. DICA PARA PROVA
6. REFERÊNCIAS

Crie pelo menos 5 questões com níveis de dificuldade variados (fácil, médio, difícil).
Formato: Markdown.`
  },

  tabela_medicamentos: {
    titulo: 'Tabela de Medicamentos',
    prompt: `Crie uma tabela completa de medicamentos para o tema/condição especificada.

COLUNAS OBRIGATÓRIAS:
| Medicamento | Classe | Mecanismo | Dose | Via | Intervalo | Indicação Principal | Contraindicações | Efeitos Adversos | Interações | Ajuste Renal | Ajuste Hepático | Gestação |

Inclua:
- Todos os medicamentos relevantes para a condição
- Doses para adultos (com peso médio de 70kg)
- Notas especiais quando aplicável

Formato: Tabela Markdown.`
  },

  mapa_mental: {
    titulo: 'Mapa Mental',
    prompt: `Crie um mapa mental em formato texto/ASCII sobre o tema especificado.

ESTRUTURA:
- Tema central no topo
- Ramificações principais (máximo 5-6)
- Sub-ramificações para cada tópico
- Use símbolos: ├── ─── └── │ para criar a estrutura

Exemplo de formato:
TEMA CENTRAL
├── Ramificação 1
│   ├── Sub-item 1.1
│   ├── Sub-item 1.2
│   └── Sub-item 1.3
├── Ramificação 2
│   ├── Sub-item 2.1
│   └── Sub-item 2.2
└── Ramificação 3
    ├── Sub-item 3.1
    └── Sub-item 3.2

Seja completo mas organizado. Máximo 100 itens no total.`
  },

  checklist_clinico: {
    titulo: 'Checklist Clínico',
    prompt: `Crie um checklist clínico completo para a situação especificada.

FORMATO:
□ Item a verificar/realizar
  → Detalhes ou observações importantes

SEÇÕES SUGERIDAS:
1. AVALIAÇÃO INICIAL
2. EXAMES A SOLICITAR
3. CONDUTAS IMEDIATAS
4. MEDICAÇÕES
5. ORIENTAÇÕES AO PACIENTE
6. CRITÉRIOS DE ALERTA
7. SEGUIMENTO
8. DOCUMENTAÇÃO NECESSÁRIA

Use checkbox (□) para cada item e setas (→) para sub-itens.`
  },

  comparativo: {
    titulo: 'Tabela Comparativa',
    prompt: `Crie uma tabela comparativa completa sobre o tema especificado.

Se for comparação entre doenças:
| Característica | Doença A | Doença B | Doença C |

Se for comparação entre tratamentos:
| Aspecto | Tratamento A | Tratamento B | Tratamento C |

ASPECTOS A COMPARAR:
- Definição
- Epidemiologia
- Fisiopatologia
- Quadro clínico
- Diagnóstico
- Tratamento
- Prognóstico
- Complicações
- Particularidades

Formato: Tabela Markdown. Seja completo e preciso.`
  }
}

// ==========================================
// POST - Gerar Documento
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      tipo_documento,
      tema,
      conteudo_adicional,
      formato_saida = 'markdown'
    } = body

    if (!user_id || !tipo_documento || !tema) {
      return NextResponse.json(
        { error: 'user_id, tipo_documento e tema são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de documento
    const template = TEMPLATES[tipo_documento as keyof typeof TEMPLATES]
    if (!template) {
      return NextResponse.json(
        { error: `Tipo de documento inválido. Opções: ${Object.keys(TEMPLATES).join(', ')}` },
        { status: 400 }
      )
    }

    // Buscar plano do usuário
    const { data: profile } = await supabase
      .from('profiles_med')
      .select('plano')
      .eq('id', user_id)
      .single()

    const plano = (profile?.plano || 'gratuito') as PlanoIA

    // Verificar se plano permite
    if (plano === 'gratuito') {
      return NextResponse.json(
        { error: 'Geração de documentos não disponível no plano gratuito' },
        { status: 403 }
      )
    }

    // Verificar limite de resumos (usamos o mesmo limite)
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'resumos')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de documentos atingido (${usado}/${limite})`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Construir prompt
    const promptCompleto = `${template.prompt}

TEMA: ${tema}
${conteudo_adicional ? `\nINFORMAÇÕES ADICIONAIS: ${conteudo_adicional}` : ''}

Crie um documento completo, preciso e adequado para estudo de residência médica.
Seja detalhado e inclua todas as informações relevantes.
${formato_saida === 'html' ? 'Formate a saída em HTML.' : 'Formate a saída em Markdown.'}`

    let documento = ''
    let tokensInput = 0
    let tokensOutput = 0

    if (plano === 'residencia') {
      // Usar Claude
      const response = await anthropic.messages.create({
        model: MODELOS.claude.opus,
        max_tokens: 16384,
        system: SYSTEM_PROMPT_RESIDENCIA,
        messages: [{ role: 'user', content: promptCompleto }]
      })

      tokensInput = response.usage.input_tokens
      tokensOutput = response.usage.output_tokens

      for (const block of response.content) {
        if (block.type === 'text') {
          documento += block.text
        }
      }
    } else {
      // Usar Gemini
      const model = genAI.getGenerativeModel({
        model: MODELOS.gemini.flash,
        systemInstruction: SYSTEM_PROMPT_PREMIUM,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192
        }
      })

      const result = await model.generateContent(promptCompleto)
      documento = result.response.text()

      // Estimar tokens
      tokensInput = Math.ceil(promptCompleto.length / 4)
      tokensOutput = Math.ceil(documento.length / 4)
    }

    // Salvar no banco
    const { data: savedDoc, error: saveError } = await supabase
      .from('resumos_ia_med')
      .insert({
        user_id,
        titulo: `${template.titulo}: ${tema.substring(0, 50)}`,
        tema,
        conteudo: documento,
        formato: formato_saida,
        tokens_usados: tokensInput + tokensOutput
      })
      .select()
      .single()

    if (saveError) {
      console.error('Erro ao salvar documento:', saveError)
    }

    // Incrementar uso
    const custo = calcularCusto(
      plano === 'residencia' ? MODELOS.claude.opus : 'gemini-flash',
      tokensInput,
      tokensOutput
    )
    await incrementarUsoIA(user_id, 'resumos', 1, tokensInput, tokensOutput, custo)

    return NextResponse.json({
      success: true,
      documento,
      tipo: tipo_documento,
      titulo: template.titulo,
      formato: formato_saida,
      documento_id: savedDoc?.id,
      tokens: {
        input: tokensInput,
        output: tokensOutput,
        total: tokensInput + tokensOutput
      }
    })
  } catch (error) {
    console.error('Erro ao gerar documento:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ==========================================
// GET - Listar Templates Disponíveis
// ==========================================

export async function GET() {
  const templates = Object.entries(TEMPLATES).map(([key, value]) => ({
    id: key,
    titulo: value.titulo,
    descricao: value.prompt.substring(0, 100) + '...'
  }))

  return NextResponse.json({ templates })
}
