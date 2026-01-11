// Tools Customizadas para PREPARAMED IA

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'

// ==========================================
// DEFINIÇÕES DE TOOLS
// ==========================================

export const TOOL_BUSCAR_QUESTOES: Anthropic.Tool = {
  name: 'buscar_questoes',
  description: `Busca questões de provas de residência médica no banco de dados do PREPARAMED.
Use esta ferramenta quando o usuário quiser:
- Praticar questões sobre um tema
- Ver exemplos de questões de uma banca específica
- Encontrar questões por dificuldade`,
  input_schema: {
    type: 'object' as const,
    properties: {
      tema: {
        type: 'string',
        description: 'Tema ou disciplina das questões (ex: cardiologia, diabetes, pneumonia)'
      },
      banca: {
        type: 'string',
        description: 'Banca examinadora (ex: USP, UNICAMP, ENARE)'
      },
      ano: {
        type: 'number',
        description: 'Ano da prova'
      },
      dificuldade: {
        type: 'string',
        enum: ['facil', 'medio', 'dificil'],
        description: 'Nível de dificuldade'
      },
      limite: {
        type: 'number',
        description: 'Número máximo de questões (padrão: 5)'
      }
    },
    required: ['tema']
  }
}

export const TOOL_CRIAR_PLANO_ESTUDOS: Anthropic.Tool = {
  name: 'criar_plano_estudos',
  description: `Cria um plano de estudos personalizado para o usuário.
Use quando o usuário quiser:
- Organizar seus estudos para uma prova
- Criar um cronograma de revisão
- Planejar a preparação para residência`,
  input_schema: {
    type: 'object' as const,
    properties: {
      prova_alvo: {
        type: 'string',
        description: 'Prova para a qual está estudando (ex: USP, UNICAMP, ENARE)'
      },
      data_prova: {
        type: 'string',
        description: 'Data da prova (formato: YYYY-MM-DD)'
      },
      horas_disponiveis: {
        type: 'number',
        description: 'Horas disponíveis por dia para estudo'
      },
      pontos_fracos: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de temas que precisam de mais atenção'
      },
      pontos_fortes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Lista de temas em que já tem domínio'
      }
    },
    required: ['prova_alvo']
  }
}

export const TOOL_EXPLICAR_QUESTAO: Anthropic.Tool = {
  name: 'explicar_questao',
  description: `Busca uma questão específica e prepara explicação detalhada.
Use quando o usuário:
- Quer entender uma questão que errou
- Pede explicação de uma questão específica`,
  input_schema: {
    type: 'object' as const,
    properties: {
      questao_id: {
        type: 'string',
        description: 'ID da questão no banco de dados'
      },
      nivel_detalhe: {
        type: 'string',
        enum: ['basico', 'intermediario', 'avancado'],
        description: 'Nível de detalhe da explicação'
      }
    },
    required: ['questao_id']
  }
}

export const TOOL_CALCULAR_IMC: Anthropic.Tool = {
  name: 'calcular_imc',
  description: `Calcula o Índice de Massa Corporal e classifica.
Use quando o usuário fornecer peso e altura para cálculo.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      peso_kg: {
        type: 'number',
        description: 'Peso em quilogramas'
      },
      altura_m: {
        type: 'number',
        description: 'Altura em metros'
      }
    },
    required: ['peso_kg', 'altura_m']
  }
}

export const TOOL_GERAR_FLASHCARDS: Anthropic.Tool = {
  name: 'gerar_flashcards',
  description: 'Gera flashcards estruturados para memorização',
  input_schema: {
    type: 'object' as const,
    properties: {
      flashcards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            frente: {
              type: 'string',
              description: 'Pergunta ou conceito na frente do flashcard'
            },
            verso: {
              type: 'string',
              description: 'Resposta ou explicação no verso'
            },
            dificuldade: {
              type: 'string',
              enum: ['facil', 'medio', 'dificil']
            },
            tags: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['frente', 'verso', 'dificuldade']
        }
      }
    },
    required: ['flashcards']
  }
}

export const TOOL_GERAR_RESUMO: Anthropic.Tool = {
  name: 'gerar_resumo',
  description: 'Gera resumo estruturado de tema médico',
  input_schema: {
    type: 'object' as const,
    properties: {
      titulo: {
        type: 'string',
        description: 'Título do resumo'
      },
      topicos: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subtitulo: { type: 'string' },
            conteudo: { type: 'string' },
            pontos_chave: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['subtitulo', 'conteudo']
        }
      },
      referencias: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['titulo', 'topicos']
  }
}

// ==========================================
// LISTA DE TODAS AS TOOLS
// ==========================================

export const PREPARAMED_TOOLS: Anthropic.Tool[] = [
  TOOL_BUSCAR_QUESTOES,
  TOOL_CRIAR_PLANO_ESTUDOS,
  TOOL_EXPLICAR_QUESTAO,
  TOOL_CALCULAR_IMC
]

export const STRUCTURED_OUTPUT_TOOLS: Anthropic.Tool[] = [
  TOOL_GERAR_FLASHCARDS,
  TOOL_GERAR_RESUMO
]

// ==========================================
// HANDLERS DE TOOLS
// ==========================================

// Interface ToolResult já exportada em types.ts
interface LocalToolResult {
  success: boolean
  data?: unknown
  error?: string
}

export async function executarTool(
  toolName: string,
  input: Record<string, unknown>,
  _userId?: string
): Promise<LocalToolResult> {
  try {
    switch (toolName) {
      case 'buscar_questoes':
        return await handleBuscarQuestoes(input)

      case 'criar_plano_estudos':
        return await handleCriarPlanoEstudos(input)

      case 'explicar_questao':
        return await handleExplicarQuestao(input)

      case 'calcular_imc':
        return handleCalcularIMC(input)

      default:
        return { success: false, error: `Tool "${toolName}" não implementada` }
    }
  } catch (error) {
    console.error(`Erro ao executar tool ${toolName}:`, error)
    return { success: false, error: String(error) }
  }
}

// ==========================================
// IMPLEMENTAÇÕES DOS HANDLERS
// ==========================================

async function handleBuscarQuestoes(input: Record<string, unknown>): Promise<LocalToolResult> {
  const { tema, banca, ano, dificuldade, limite = 5 } = input

  let query = supabase
    .from('questoes_med')
    .select(`
      id,
      enunciado,
      alternativas,
      resposta_correta,
      explicacao,
      disciplina:disciplinas_med(nome),
      assunto:assuntos_med(nome),
      banca:bancas_med(nome),
      ano,
      dificuldade
    `)
    .limit(Number(limite))

  // Aplicar filtros
  if (tema) {
    query = query.or(`enunciado.ilike.%${tema}%,explicacao.ilike.%${tema}%`)
  }
  if (banca) {
    query = query.eq('banca_id', banca)
  }
  if (ano) {
    query = query.eq('ano', ano)
  }
  if (dificuldade) {
    query = query.eq('dificuldade', dificuldade)
  }

  const { data, error } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: {
      questoes: data,
      total: data?.length || 0,
      mensagem: data?.length
        ? `Encontrei ${data.length} questões sobre o tema.`
        : 'Não encontrei questões com esses critérios.'
    }
  }
}

async function handleCriarPlanoEstudos(input: Record<string, unknown>): Promise<LocalToolResult> {
  const { prova_alvo, data_prova, horas_disponiveis, pontos_fracos, pontos_fortes } = input

  // Calcular dias até a prova
  const hoje = new Date()
  const dataProva = data_prova ? new Date(data_prova as string) : null
  const diasAteProva = dataProva
    ? Math.ceil((dataProva.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    : 90 // padrão: 3 meses

  // Gerar plano básico estruturado
  const plano = {
    prova_alvo,
    dias_ate_prova: diasAteProva,
    horas_por_dia: horas_disponiveis || 4,
    pontos_fracos: pontos_fracos || [],
    pontos_fortes: pontos_fortes || [],
    sugestoes: {
      foco_principal: pontos_fracos && (pontos_fracos as string[]).length > 0
        ? `Priorizar: ${(pontos_fracos as string[]).join(', ')}`
        : 'Revisar todas as grandes áreas',
      distribuicao_semanal: {
        clinica_medica: '25%',
        cirurgia: '20%',
        pediatria: '15%',
        gineco_obstetricia: '15%',
        preventiva: '10%',
        outras: '15%'
      },
      simulados: diasAteProva > 60
        ? 'Fazer 1 simulado por semana'
        : 'Fazer 2-3 simulados por semana'
    }
  }

  return {
    success: true,
    data: plano
  }
}

async function handleExplicarQuestao(input: Record<string, unknown>): Promise<LocalToolResult> {
  const { questao_id, nivel_detalhe = 'intermediario' } = input

  const { data, error } = await supabase
    .from('questoes_med')
    .select(`
      *,
      disciplina:disciplinas_med(nome),
      assunto:assuntos_med(nome),
      banca:bancas_med(nome)
    `)
    .eq('id', questao_id)
    .single()

  if (error || !data) {
    return { success: false, error: 'Questão não encontrada' }
  }

  return {
    success: true,
    data: {
      questao: data,
      nivel_explicacao: nivel_detalhe
    }
  }
}

function handleCalcularIMC(input: Record<string, unknown>): LocalToolResult {
  const { peso_kg, altura_m } = input

  if (!peso_kg || !altura_m) {
    return { success: false, error: 'Peso e altura são obrigatórios' }
  }

  const peso = Number(peso_kg)
  const altura = Number(altura_m)

  if (altura <= 0 || peso <= 0) {
    return { success: false, error: 'Valores devem ser positivos' }
  }

  const imc = peso / (altura * altura)
  let classificacao = ''

  if (imc < 18.5) {
    classificacao = 'Baixo peso'
  } else if (imc < 25) {
    classificacao = 'Peso normal'
  } else if (imc < 30) {
    classificacao = 'Sobrepeso'
  } else if (imc < 35) {
    classificacao = 'Obesidade grau I'
  } else if (imc < 40) {
    classificacao = 'Obesidade grau II'
  } else {
    classificacao = 'Obesidade grau III (mórbida)'
  }

  return {
    success: true,
    data: {
      peso_kg: peso,
      altura_m: altura,
      imc: imc.toFixed(2),
      classificacao,
      recomendacao: imc < 18.5 || imc >= 25
        ? 'Recomenda-se acompanhamento nutricional e avaliação médica.'
        : 'IMC dentro da faixa de normalidade.'
    }
  }
}
