// API Route - Chat IA PREPARAMED com Streaming

import { NextRequest, NextResponse } from 'next/server'

// Configuração de runtime para permitir execução mais longa
// Imagem (25s) + Questões em lote (60s+) + Flashcards + Diagramas = precisa de pelo menos 180s
// Vercel Pro permite até 300s para Serverless Functions
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 300 segundos (máximo do Vercel Pro para Serverless)
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  PlanoIA,
  LIMITES_IA,
  verificarLimiteIA,
  incrementarUsoIA,
  calcularCusto
} from '@/lib/ai'
import { SYSTEM_PROMPT_PREMIUM, SYSTEM_PROMPT_RESIDENCIA } from '@/lib/ai/prompts'
import { MODELOS, DOMINIOS_MEDICOS } from '@/lib/ai/config'
import { PREPARAMED_TOOLS, executarTool } from '@/lib/ai/tools'
import { uploadImageToStorage, isBase64Image } from '@/lib/storage'
import { analisarPergunta, gerarInstrucoesAdicionais } from '@/lib/ai/taskManager'
import { validarResposta, gerarResumoValidacao } from '@/lib/ai/responseValidator'
import { classificarIntencao, gerarInstrucoesDeIntencao, getConfiguracoesAPI } from '@/lib/ai/intentClassifier'
import { verificarQualidade, gerarRelatorioQualidade, precisaContinuar } from '@/lib/ai/qualityChecker'
// Novos módulos Meta AI avançados
import {
  criarPerfilPadrao,
  detectarNivelConhecimento,
  analisarPerfilParaContexto,
  gerarInstrucoesPersonalizadas,
  type PerfilUsuario
} from '@/lib/ai/userProfileManager'
import {
  detectarUrgencia,
  gerarInstrucoesUrgencia
} from '@/lib/ai/urgencyDetector'
import {
  gerarConfiguracaoQuestao,
  gerarPromptQuestoesProfissional,
  validarQuestoesGeradas,
  deveIncluirImagem,
  sugerirTipoQuestao,
  type EstiloProva,
  type ConfiguracaoQuestoes,
  type NivelDificuldade
} from '@/lib/ai/questionGenerator'
import {
  analisarDesempenhoEAdaptar,
  gerarRelatorioProgresso,
  criarPerfilDesempenho,
  type DesempenhoUsuario
} from '@/lib/ai/adaptiveLearning'
import {
  selecionarTipoExplicacao,
  gerarInstrucoesEstrutura,
  type ConfiguracaoExplicacao
} from '@/lib/ai/explanationStructure'

// ========== INTEGRACAO HUGGING FACE ==========
import {
  prepareAgentContext,
  formatAgentResponse,
  validateMedicalResponse,
  FEATURES,
  prepareImageContext,
  extractTextFromImage
} from '@/lib/huggingface'
// ========== FIM INTEGRACAO HUGGING FACE ==========

// ========== SISTEMA DE VARIABILIDADE ==========
import {
  VARIATION_CONFIG,
  generateVariedPrompt,
  detectResponseType,
  extractTopic,
  generateStyleInstructions,
  type VariationConfigType
} from '@/lib/huggingface/response-variation'
// ========== FIM SISTEMA DE VARIABILIDADE ==========

// ========== SUGESTOES INTELIGENTES ==========
import { updateUserLearning } from '@/lib/suggestions'
// ========== FIM SUGESTOES INTELIGENTES ==========

// ========== INTEGRACAO MULTI-AGENTES ==========
import {
  detectMultiAgentTask,
  executeMultiAgentTask,
  type MultiAgentDetectionResult,
  type MultiAgentExecutionResult
} from '@/lib/ai/multiAgentIntegration'
// ========== FIM INTEGRACAO MULTI-AGENTES ==========

// ========== SMART ROUTER - ROTEAMENTO INTELIGENTE ==========
import {
  selecionarModelo,
  streamInteligente,
  registrarRoteamento,
  SmartStreamChunk
} from '@/lib/ai/smart-router'
import { analisarComplexidade } from '@/lib/ai/complexity-detector'
// ========== FIM SMART ROUTER ==========

// ========== MEMORIA PERSISTENTE ==========
import {
  processMessageForMemory,
  getContextForPrompt
} from '@/lib/ai/persistentMemory'
// ========== FIM MEMORIA PERSISTENTE ==========

// Extrair título inteligente da mensagem do usuário
function extrairTituloInteligente(mensagem: string): string {
  let titulo = mensagem

  // Remover verbos de ação comuns no início
  titulo = titulo.replace(/^(gere|crie|cria|faça|faz|elabore|monte|produza|explique|me\s+(?:dê|de|fale|explique|ensine|ajude|conte))\s+/i, '')
  // Remover "pra mim", "para mim", "por favor", etc
  titulo = titulo.replace(/\b(pra\s+mi[mn]|para\s+mi[mn]|por\s+favor|pfv|pls|please)\b/gi, '')
  // Remover quantidades no inicio (5 flashcards, 2 questões...)
  titulo = titulo.replace(/^\d+\s*/g, '')
  // Remover tipos de conteudo do inicio (flashcards, questões, diagrama...)
  titulo = titulo.replace(/^(flashcards?|questões?|questoes?|cards?|diagramas?|fluxogramas?|organogramas?|mapas?\s+mentais?|resumos?)\s*(,?\s*\d+\s*(flashcards?|questões?|questoes?|cards?|diagramas?|fluxogramas?|organogramas?)\s*)*/gi, '')
  // Remover conectivos soltos no inicio
  titulo = titulo.replace(/^(e\s+|,\s*|sobre\s+|de\s+|do\s+|da\s+|dos\s+|das\s+|com\s+|para\s+)/i, '')
  // Capitalizar primeira letra
  titulo = titulo.trim()
  if (titulo.length > 0) {
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1)
  }
  // Limitar tamanho
  if (titulo.length > 60) {
    const corte = titulo.lastIndexOf(' ', 57)
    titulo = titulo.substring(0, corte > 30 ? corte : 57) + '...'
  }
  // Se ficou muito curto ou vazio, usar a mensagem original
  if (titulo.length < 3) {
    titulo = mensagem.substring(0, 60) + (mensagem.length > 60 ? '...' : '')
  }
  return titulo
}

// Formatar resposta de tool para exibição
function formatToolResponse(toolName: string, data: unknown): string {
  const resultado = data as Record<string, unknown>

  switch (toolName) {
    case 'buscar_questoes': {
      const questoes = resultado.questoes as Array<Record<string, unknown>>
      if (!questoes || questoes.length === 0) {
        return '\n\n📚 Não encontrei questões com esses critérios. Tente outros filtros.\n'
      }
      let texto = `\n\n📚 **Encontrei ${questoes.length} questões:**\n\n`
      questoes.forEach((q, i) => {
        texto += `**${i + 1}.** ${String(q.enunciado).substring(0, 200)}...\n`
        texto += `   📌 Banca: ${(q.banca as Record<string, string>)?.nome || 'N/A'} | Ano: ${q.ano || 'N/A'}\n\n`
      })
      return texto
    }

    case 'calcular_imc': {
      return `\n\n📊 **Cálculo de IMC:**
- Peso: ${resultado.peso_kg} kg
- Altura: ${resultado.altura_m} m
- **IMC: ${resultado.imc}**
- Classificação: **${resultado.classificacao}**
- ${resultado.recomendacao}\n`
    }

    case 'criar_plano_estudos': {
      const plano = resultado as Record<string, unknown>
      return `\n\n📅 **Plano de Estudos para ${plano.prova_alvo}:**
- Dias até a prova: ${plano.dias_ate_prova}
- Horas/dia: ${plano.horas_por_dia}
- ${(plano.sugestoes as Record<string, unknown>)?.foco_principal}
- Simulados: ${(plano.sugestoes as Record<string, unknown>)?.simulados}\n`
    }

    case 'explicar_questao': {
      const questao = resultado.questao as Record<string, unknown>
      if (!questao) {
        return '\n\n❌ Questão não encontrada.\n'
      }
      return `\n\n📝 **Questão encontrada:**\n${questao.enunciado}\n\n**Explicação:** ${questao.explicacao || 'Explicação não disponível'}\n`
    }

    case 'gerar_imagem_medica': {
      if (!resultado.imagem_url) {
        return '\n\n❌ Não foi possível gerar a imagem solicitada.\n'
      }
      // NÃO incluir a URL base64 no texto - a imagem será renderizada via tool_result no frontend
      // Apenas retornar uma confirmação de que a imagem foi gerada
      return `\n\n🖼️ **Imagem Gerada: ${resultado.estrutura || 'Ilustração Médica'}**\n\n*Imagem gerada com DALL-E 3 para fins educacionais.*\n`
    }

    case 'buscar_imagens_medicas': {
      const imagens = resultado.imagens as Array<{
        url: string
        titulo: string
        fonte: string
        linkOriginal: string
        referencia: string
      }>

      if (!imagens || imagens.length === 0) {
        return '\n\n📷 Não encontrei imagens para esse termo. Tente outro termo de busca.\n'
      }

      // Texto simplificado - imagens serão renderizadas pelo frontend
      // Cada imagem em seu próprio parágrafo para facilitar carregamento progressivo
      let texto = '\n\n📷 **Imagens de Referência:**\n\n'

      imagens.forEach((img, i) => {
        texto += `**${i + 1}. ${img.titulo}**\n`
        texto += `![${img.titulo}](${img.url})\n`
        texto += `📌 Fonte: [${img.fonte}](${img.linkOriginal})\n\n`
      })

      texto += '---\n📚 **Referências (ABNT):**\n'
      imagens.forEach((img, i) => {
        texto += `${i + 1}. ${img.referencia}\n`
      })

      return texto
    }

    default:
      return `\n\n✅ Ferramenta ${toolName} executada com sucesso.\n`
  }
}

// Clientes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ==========================================
// POST - Enviar Mensagem com Streaming
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      mensagem,
      conversa_id,
      modo = 'chat', // Modo de chat: chat, caso_clinico, tutor, questoes
      imagem_base64,
      imagem_tipo,
      pdf_base64,
      use_web_search,
      use_extended_thinking,
      thinking_budget
    } = body

    if (!user_id || !mensagem) {
      return NextResponse.json(
        { error: 'user_id e mensagem são obrigatórios' },
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

    // Verificar se plano permite IA (gratuito agora tem 10 chats grátis)
    const limites = LIMITES_IA[plano]
    if (limites.chats_mes === 0) {
      return NextResponse.json(
        { error: 'Plano gratuito não tem acesso à IA. Faça upgrade para Premium ou Residência.' },
        { status: 403 }
      )
    }

    // Verificar limite de chats
    const { permitido, usado, limite } = await verificarLimiteIA(user_id, plano, 'chats')
    if (!permitido) {
      return NextResponse.json(
        {
          error: `Limite de mensagens atingido (${usado}/${limite}). Aguarde o próximo mês ou faça upgrade.`,
          usado,
          limite
        },
        { status: 429 }
      )
    }

    // Verificar funcionalidades específicas por plano
    if (imagem_base64 && !limites.vision) {
      return NextResponse.json(
        { error: 'Análise de imagens disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    if (pdf_base64 && !limites.pdf_support) {
      return NextResponse.json(
        { error: 'Análise de PDFs disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    if (use_web_search && !limites.web_search) {
      return NextResponse.json(
        { error: 'Busca na web disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    if (use_extended_thinking && !limites.extended_thinking) {
      return NextResponse.json(
        { error: 'Extended Thinking disponível apenas no plano Residência' },
        { status: 403 }
      )
    }

    // Buscar ou criar conversa
    let conversaAtual = conversa_id

    if (!conversaAtual) {
      // Criar nova conversa
      const { data: novaConversa, error: convError } = await supabase
        .from('conversas_ia_med')
        .insert({
          user_id,
          titulo: extrairTituloInteligente(mensagem),
          modelo: plano === 'residencia' ? 'claude' : 'gemini',
          modo: modo // Salvar modo da conversa
        })
        .select()
        .single()

      if (convError) {
        console.error('Erro ao criar conversa:', convError)
        return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
      }

      conversaAtual = novaConversa.id
    } else {
      // CORREÇÃO RACE CONDITION: Verificar se conversa existe, se não existir, criar
      const { data: conversaExistente, error: checkError } = await supabase
        .from('conversas_ia_med')
        .select('id')
        .eq('id', conversaAtual)
        .single()

      if (checkError || !conversaExistente) {
        console.log('[Chat API] Conversa não encontrada, criando:', conversaAtual)
        
        // Criar conversa com o ID fornecido (upsert)
        const { error: createError } = await supabase
          .from('conversas_ia_med')
          .upsert({
            id: conversaAtual,
            user_id,
            titulo: extrairTituloInteligente(mensagem),
            modelo: plano === 'residencia' ? 'claude' : 'gemini',
            modo: modo
          }, { onConflict: 'id' })

        if (createError) {
          console.error('[Chat API] Erro ao criar conversa com ID fornecido:', createError)
          // Se falhar o upsert, criar com ID novo
          const { data: novaConversa, error: newConvError } = await supabase
            .from('conversas_ia_med')
            .insert({
              user_id,
              titulo: extrairTituloInteligente(mensagem),
              modelo: plano === 'residencia' ? 'claude' : 'gemini',
              modo: modo
            })
            .select()
            .single()

          if (newConvError) {
            console.error('Erro ao criar conversa fallback:', newConvError)
            return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
          }
          conversaAtual = novaConversa.id
        }
      }
    }

    // Buscar mensagens anteriores da conversa
    const { data: mensagensAnteriores } = await supabase
      .from('mensagens_ia_med')
      .select('role, content')
      .eq('conversa_id', conversaAtual)
      .order('created_at', { ascending: true })

    // Salvar mensagem do usuário
    console.log('[Chat API] Salvando mensagem do usuário, conversa_id:', conversaAtual)
    const { error: userMsgError } = await supabase
      .from('mensagens_ia_med')
      .insert({
        conversa_id: conversaAtual,
        role: 'user',
        content: mensagem,
        has_image: !!imagem_base64,
        has_pdf: !!pdf_base64
      })

    if (userMsgError) {
      console.error('[Chat API] ERRO ao salvar mensagem do usuário:', userMsgError)
    }

    // Preparar histórico
    const historico = mensagensAnteriores?.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    })) || []

    // ========== MEMORIA PERSISTENTE ==========
    // Processar mensagem para extrair e salvar entidades em background
    // Não bloqueia a resposta - executa em paralelo
    processMessageForMemory(user_id, mensagem, conversaAtual).then(result => {
      if (result.entitiesFound > 0 || result.topicsSaved > 0) {
        console.log(`[Memory] Salvo ${result.entitiesFound} entidades, ${result.topicsSaved} topicos`)
      }
    }).catch(err => {
      console.error('[Memory] Erro ao processar memoria:', err)
    })
    // ========== FIM MEMORIA PERSISTENTE ==========

    // ========== VERIFICAR SE DEVE USAR MULTI-AGENTES ==========
    // Multi-agentes são usados para tarefas complexas como:
    // - Planos de estudo (requer pesquisa + planejamento + criação)
    // - Conteúdo complexo (múltiplos tipos ou grande quantidade)
    // Só usar se não tem imagem/PDF (multi-agentes não suportam)

    if (!imagem_base64 && !pdf_base64) {
      const multiAgentDetection = detectMultiAgentTask(mensagem)

      if (multiAgentDetection.shouldUseAgents) {
        console.log(`[Chat API] 🤖 Multi-agentes ativados: ${multiAgentDetection.reason}`)
        console.log(`[Chat API] Tipo: ${multiAgentDetection.taskType} | Confiança: ${multiAgentDetection.confidence}`)

        // Executar com multi-agentes e retornar via streaming simulado
        return await streamMultiAgentResponse({
          detection: multiAgentDetection,
          conversa_id: conversaAtual,
          user_id,
          mensagem,
          plano
        })
      }
    }
    // ========== FIM VERIFICAÇÃO MULTI-AGENTES ==========

    // ========== ROTEAMENTO INTELIGENTE COM SMART ROUTER ==========
    // Analisar complexidade da mensagem para decidir modelo
    const complexityAnalysis = analisarComplexidade(mensagem, {
      historicoMensagens: historico.length,
      temImagem: !!imagem_base64,
      temPdf: !!pdf_base64,
      plano: plano === 'gratuito' ? 'premium' : plano
    })

    console.log(`[Smart Router] Complexidade: ${complexityAnalysis.nivel} (score: ${complexityAnalysis.score})`)
    console.log(`[Smart Router] Modelo recomendado: ${complexityAnalysis.modeloRecomendado}`)
    console.log(`[Smart Router] Motivo: ${complexityAnalysis.motivo}`)

    // Decidir se usa OpenAI (mais economico) ou Claude (mais capaz)
    // Usar OpenAI para:
    // - Perguntas simples e moderadas (o4-mini)
    // - Perguntas complexas sem web search (gpt-5.2)
    // Manter Claude para:
    // - Web search (somente Opus suporta)
    // - Extended thinking
    // - PDFs (melhor suporte)
    // - Plano Residência com tarefas especializadas

    const deveUsarClaude = use_web_search || // Web search só com Claude
                          use_extended_thinking || // Extended thinking só com Claude
                          imagem_base64 || // Imagens só com Claude (vision)
                          pdf_base64 || // PDFs melhor com Claude
                          (plano === 'residencia' && complexityAnalysis.nivel === 'especializada') // Tarefas especializadas

    if (deveUsarClaude) {
      console.log('[Smart Router] Usando Claude (funcionalidade exclusiva)')
      return await streamClaude({
        historico,
        mensagem,
        conversa_id: conversaAtual,
        user_id,
        plano,
        imagem_base64,
        imagem_tipo,
        pdf_base64,
        use_web_search,
        use_extended_thinking,
        thinking_budget
      })
    }

    // Usar Smart Router para roteamento OpenAI
    console.log('[Smart Router] Usando roteamento inteligente OpenAI')
    return await streamComSmartRouter({
      historico,
      mensagem,
      conversa_id: conversaAtual,
      user_id,
      plano,
      imagem_base64,
      imagem_tipo,
      complexityAnalysis
    })
    // ========== FIM ROTEAMENTO INTELIGENTE ==========
  } catch (error) {
    console.error('Erro na API de chat:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ==========================================
// STREAMING COM MULTI-AGENTES
// ==========================================

interface StreamMultiAgentParams {
  detection: MultiAgentDetectionResult
  conversa_id: string
  user_id: string
  mensagem: string
  plano: string
}

async function streamMultiAgentResponse(params: StreamMultiAgentParams) {
  const { detection, conversa_id, user_id, mensagem, plano } = params

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''

      // Criar registro de resposta ANTES de iniciar
      const { data: assistantMsg, error: createMsgError } = await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'assistant',
          content: '[Processando com multi-agentes...]',
          tokens: 0
        })
        .select('id')
        .single()

      if (createMsgError) {
        console.error('[MultiAgent] Erro ao criar mensagem:', createMsgError)
      }

      const assistantMsgId = assistantMsg?.id
      console.log('[MultiAgent] Mensagem criada com ID:', assistantMsgId)

      // Enviar conversa_id imediatamente
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'conversa_created',
          conversa_id,
          titulo: extrairTituloInteligente(mensagem),
          modelo: 'multi-agent'
        })}\n\n`)
      )

      // Feedback visual detalhado do multi-agentes
      const taskLabel = detection.taskType === 'study_plan' ? 'Plano de Estudos' : 'Conteúdo Complexo'
      const agentNotice = `🤖 **Ativando Multi-Agentes** — *${taskLabel}*\n\n*${detection.reason}*\n\n---\n\n`
      fullResponse += agentNotice
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'text', content: agentNotice })}\n\n`)
      )

      // Enviar notificação de progresso com detalhes
      const tiposDesc = (detection.extractedParams.tipos as string[] || []).join(', ')
      const visuaisDesc = (detection.extractedParams.visuais as string[] || []).join(', ')
      const todosDesc = [tiposDesc, visuaisDesc].filter(Boolean).join(', ')
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'agent_status',
          status: 'starting',
          taskType: detection.taskType,
          message: `Gerando: ${todosDesc || taskLabel}`,
          agents: ['Pesquisador', 'Criador', 'Revisor']
        })}\n\n`)
      )

      try {
        // Executar multi-agentes
        const result = await executeMultiAgentTask(
          detection.taskType,
          detection.extractedParams
        )

        if (result.success) {
          // Separar texto de artefatos (code blocks) para não quebrar blocos no chunking
          const parts = splitTextAndArtifacts(result.response)

          for (const part of parts) {
            if (part.type === 'artifact') {
              // Enviar blocos de artefatos INTEIROS (nunca chunkar)
              fullResponse += part.content
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: part.content })}\n\n`)
              )
              // Delay maior para dar tempo do frontend processar o artefato
              await new Promise(resolve => setTimeout(resolve, 50))
            } else {
              // Streamar texto em chunks pequenos para efeito de streaming
              const chunks = chunkResponse(part.content, 30)
              for (const chunk of chunks) {
                fullResponse += chunk
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`)
                )
                await new Promise(resolve => setTimeout(resolve, 15))
              }
            }
          }

          // Log de execução apenas no console do servidor (não enviar para o chat)
          if (result.executionLog && result.executionLog.length > 0) {
            console.log('[MultiAgent] Log de execução:', result.executionLog.join(' | '))
          }

          // Enviar artefatos se disponíveis
          if (result.artifacts) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'artifacts',
                artifactType: result.artifacts.type,
                data: result.artifacts.data
              })}\n\n`)
            )
          }

        } else {
          // Erro - informar e fazer fallback
          const errorMsg = `\n\n⚠️ Erro nos multi-agentes: ${result.error}\n\nTentando resposta alternativa...`
          fullResponse += errorMsg
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', content: errorMsg })}\n\n`)
          )
        }

        // Estimar tokens
        const tokensInput = Math.ceil(mensagem.length / 4)
        const tokensOutput = Math.ceil(fullResponse.length / 4)

        // Atualizar resposta no banco
        if (assistantMsgId) {
          await supabase
            .from('mensagens_ia_med')
            .update({
              content: fullResponse || '[Resposta vazia]',
              tokens: tokensInput + tokensOutput
            })
            .eq('id', assistantMsgId)
        }

        // Atualizar conversa
        await supabase
          .from('conversas_ia_med')
          .update({
            tokens_usados: tokensInput + tokensOutput,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa_id)

        // Incrementar uso
        await incrementarUsoIA(user_id, 'chats', 1, tokensInput, tokensOutput, 0)

        // Atualizar aprendizado
        try {
          const topicoEstudado = extractTopic(mensagem)
          if (topicoEstudado && topicoEstudado !== 'medicina') {
            await updateUserLearning(user_id, topicoEstudado)
          }
        } catch (e) {
          console.error('[MultiAgent] Erro ao atualizar aprendizado:', e)
        }

        // Enviar conclusão
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            conversa_id,
            tokens: { input: tokensInput, output: tokensOutput },
            provider: 'multi-agent',
            taskType: detection.taskType
          })}\n\n`)
        )

      } catch (error) {
        console.error('[MultiAgent] Erro na execução:', error)

        const errorMsg = `\n\n❌ Erro ao processar com multi-agentes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        fullResponse += errorMsg
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'text', content: errorMsg })}\n\n`)
        )

        // Atualizar resposta com erro
        if (assistantMsgId) {
          await supabase
            .from('mensagens_ia_med')
            .update({ content: fullResponse })
            .eq('id', assistantMsgId)
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            conversa_id,
            error: true
          })}\n\n`)
        )
      }

      controller.close()
    }
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

/**
 * Separa texto de artefatos (code blocks) para que artefatos
 * sejam enviados inteiros e não quebrados pelo chunking
 */
function splitTextAndArtifacts(text: string): Array<{ type: 'text' | 'artifact'; content: string }> {
  const parts: Array<{ type: 'text' | 'artifact'; content: string }> = []

  // Regex para encontrar blocos de código completos (```tipo:titulo ... ```)
  const codeBlockRegex = /```(?:mermaid|questao|question|flashcards|simulado|layers|staging|flowchart|tree|organograma)[:\s][^`]*```/gs

  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Texto antes do bloco
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index)
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore })
      }
    }
    // O bloco de artefato inteiro
    parts.push({ type: 'artifact', content: match[0] })
    lastIndex = match.index + match[0].length
  }

  // Texto restante após último bloco
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex)
    if (remaining.trim()) {
      parts.push({ type: 'text', content: remaining })
    }
  }

  // Se não encontrou nenhum bloco, retornar tudo como texto
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }

  return parts
}

/**
 * Divide resposta em chunks para simular streaming
 */
function chunkResponse(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  let i = 0

  while (i < text.length) {
    // Tentar não quebrar no meio de uma palavra
    let end = Math.min(i + chunkSize, text.length)

    if (end < text.length) {
      // Procurar o próximo espaço ou quebra de linha
      const nextSpace = text.indexOf(' ', end)
      const nextNewline = text.indexOf('\n', end)

      if (nextSpace !== -1 && nextSpace - end < 20) {
        end = nextSpace + 1
      } else if (nextNewline !== -1 && nextNewline - end < 20) {
        end = nextNewline + 1
      }
    }

    chunks.push(text.slice(i, end))
    i = end
  }

  return chunks
}

// ==========================================
// STREAMING COM SMART ROUTER (OpenAI)
// ==========================================

interface StreamSmartRouterParams {
  historico: Array<{ role: 'user' | 'assistant'; content: string }>
  mensagem: string
  conversa_id: string
  user_id: string
  plano?: string
  imagem_base64?: string
  imagem_tipo?: string
  complexityAnalysis: ReturnType<typeof analisarComplexidade>
}

async function streamComSmartRouter(params: StreamSmartRouterParams) {
  const {
    historico,
    mensagem,
    conversa_id,
    user_id,
    plano = 'premium',
    imagem_base64,
    imagem_tipo,
    complexityAnalysis
  } = params

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      let tokensInput = 0
      let tokensOutput = 0

      // Criar registro de resposta ANTES de iniciar streaming
      const { data: assistantMsg, error: createMsgError } = await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'assistant',
          content: '[Gerando resposta...]',
          tokens: 0
        })
        .select('id')
        .single()

      if (createMsgError) {
        console.error('[Smart Router] Erro ao criar mensagem assistant:', createMsgError)
      }

      const assistantMsgId = assistantMsg?.id
      console.log('[Smart Router] Mensagem criada com ID:', assistantMsgId)

      // Enviar conversa_id imediatamente
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'conversa_created',
          conversa_id,
          titulo: extrairTituloInteligente(mensagem),
          modelo: complexityAnalysis.modeloRecomendado
        })}\n\n`)
      )

      // Variável para controlar atualizações
      let lastUpdateTime = Date.now()
      const UPDATE_INTERVAL = 10000

      const updateResponse = async (final = false) => {
        const now = Date.now()
        if (!final && now - lastUpdateTime < UPDATE_INTERVAL) return
        if (!assistantMsgId) return

        lastUpdateTime = now
        const { error } = await supabase
          .from('mensagens_ia_med')
          .update({
            content: fullResponse || '[Resposta vazia]',
            tokens: tokensInput + tokensOutput
          })
          .eq('id', assistantMsgId)

        if (error) {
          console.error('[Smart Router] Erro ao atualizar resposta:', error)
        } else if (final) {
          console.log('[Smart Router] Resposta final salva, tamanho:', fullResponse.length)
        }
      }

      // Heartbeat para manter conexão
      const heartbeatInterval = setInterval(async () => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          await updateResponse()
        } catch {
          // Controller já fechado
        }
      }, 25000)

      try {
        // Usar streaming inteligente
        const streamGenerator = streamInteligente({
          plano: plano as 'premium' | 'residencia' | 'gratuito',
          mensagem,
          historico: historico.map(h => ({
            role: h.role,
            content: h.content
          })),
          temImagem: !!imagem_base64,
          imagemBase64: imagem_base64,
          imagemMediaType: imagem_tipo,
          onModelSelected: (model, analysis) => {
            console.log(`[Smart Router] Modelo final: ${model}`)
            // Notificar frontend sobre modelo selecionado
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'model_selected',
                model,
                complexity: analysis.nivel,
                reason: analysis.motivo
              })}\n\n`)
            )
          }
        })

        // Processar chunks do stream
        for await (const chunk of streamGenerator) {
          if (chunk.type === 'text' && chunk.content) {
            fullResponse += chunk.content
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.content })}\n\n`)
            )
          } else if (chunk.type === 'reasoning' && chunk.reasoning) {
            // Tokens de raciocínio do gpt-5.2
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'thinking', content: chunk.reasoning })}\n\n`)
            )
          } else if (chunk.type === 'done') {
            // Capturar tokens
            if (chunk.tokens) {
              tokensInput = chunk.tokens.input || 0
              tokensOutput = chunk.tokens.output || 0
            }
          } else if (chunk.type === 'error') {
            console.error('[Smart Router] Erro no stream:', chunk.error)
            throw new Error(chunk.error || 'Erro desconhecido')
          }
        }

        // Atualizar resposta final
        await updateResponse(true)

        // Atualizar conversa
        await supabase
          .from('conversas_ia_med')
          .update({
            tokens_usados: tokensInput + tokensOutput,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa_id)

        // Incrementar uso e registrar roteamento
        const custo = calcularCusto(complexityAnalysis.modeloRecomendado, tokensInput, tokensOutput)
        await incrementarUsoIA(user_id, 'chats', 1, tokensInput, tokensOutput, custo)
        registrarRoteamento(complexityAnalysis.modeloRecomendado, complexityAnalysis.nivel, custo)

        // Atualizar aprendizado
        try {
          const topicoEstudado = extractTopic(mensagem)
          if (topicoEstudado && topicoEstudado !== 'medicina') {
            await updateUserLearning(user_id, topicoEstudado)
          }
        } catch (e) {
          console.error('[Smart Router] Erro ao atualizar aprendizado:', e)
        }

        // Enviar conclusão
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            conversa_id,
            tokens: { input: tokensInput, output: tokensOutput },
            provider: 'openai',
            model: complexityAnalysis.modeloRecomendado,
            complexity: complexityAnalysis.nivel
          })}\n\n`)
        )

        clearInterval(heartbeatInterval)
        controller.close()

      } catch (error) {
        clearInterval(heartbeatInterval)
        console.error('[Smart Router] Erro:', error)

        // Tentar fallback para Claude
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        console.log('[Smart Router] Fazendo fallback para Claude devido a:', errorMessage)

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'provider_switch',
            from: 'openai',
            to: 'claude',
            message: 'Alternando para servidor secundário...'
          })}\n\n`)
        )

        try {
          // Fallback para Claude - usando Sonnet 4.5 para todos os planos (excelente qualidade, 5x mais barato que Opus)
          const modeloSelecionado = MODELOS.claude.sonnet
          let systemPrompt = plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

          // Adicionar contexto da memória persistente
          try {
            const memCtx = await getContextForPrompt(user_id)
            if (memCtx && memCtx.trim().length > 0) systemPrompt += memCtx
          } catch { /* continua sem memória */ }

          const messages = historico.map(m => ({
            role: m.role,
            content: m.content
          }))
          messages.push({ role: 'user', content: mensagem })

          const stream = await anthropic.messages.stream({
            model: modeloSelecionado,
            max_tokens: 8192,
            system: [{
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral' }
            }],
            messages: messages as Anthropic.MessageParam[],
            stream: true
          })

          for await (const event of stream) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const evt = event as any
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
              fullResponse += evt.delta.text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: evt.delta.text })}\n\n`)
              )
            }
            if (evt.type === 'message_start' && evt.message?.usage) {
              tokensInput = evt.message.usage.input_tokens
            }
            if (evt.type === 'message_delta' && evt.usage) {
              tokensOutput = evt.usage.output_tokens
            }
          }

          await updateResponse(true)

          await supabase
            .from('conversas_ia_med')
            .update({
              tokens_usados: tokensInput + tokensOutput,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversa_id)

          const custoClaude = calcularCusto(modeloSelecionado, tokensInput, tokensOutput)
          await incrementarUsoIA(user_id, 'chats', 1, tokensInput, tokensOutput, custoClaude)

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              conversa_id,
              tokens: { input: tokensInput, output: tokensOutput },
              provider: 'claude',
              fallback: true
            })}\n\n`)
          )

          controller.close()
          return

        } catch (claudeError) {
          console.error('[Smart Router] Fallback Claude também falhou:', claudeError)

          const fallbackMessage = fullResponse.length > 100
            ? '\n\n---\n*Resposta pode estar incompleta.*'
            : 'Nossos servidores estão processando muitas solicitações. Por favor, tente novamente.'

          if (fullResponse) {
            fullResponse += fallbackMessage
          } else {
            fullResponse = fallbackMessage
          }

          await updateResponse(true)

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fallbackMessage })}\n\n`)
          )
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              conversa_id,
              error: true
            })}\n\n`)
          )

          controller.close()
        }
      }
    }
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// ==========================================
// STREAMING COM CLAUDE
// ==========================================

interface StreamClaudeParams {
  historico: Array<{ role: 'user' | 'assistant'; content: string }>
  mensagem: string
  conversa_id: string
  user_id: string
  plano?: string
  imagem_base64?: string
  imagem_tipo?: string
  pdf_base64?: string
  use_web_search?: boolean
  use_extended_thinking?: boolean
  thinking_budget?: number
}

async function streamClaude(params: StreamClaudeParams) {
  const {
    historico,
    mensagem,
    conversa_id,
    user_id,
    imagem_base64,
    imagem_tipo,
    pdf_base64,
    use_web_search,
    use_extended_thinking,
    thinking_budget = 8000
  } = params

  // Preparar mensagens - limitar histórico para evitar erro de tokens
  // Limite: últimas 20 mensagens para evitar exceder 200k tokens
  const MAX_HISTORICO = 20
  const historicoLimitado = historico.slice(-MAX_HISTORICO)

  // Limpar imagens base64 de mensagens antigas (manter só nas últimas 2)
  const messages: Anthropic.MessageParam[] = historicoLimitado.map((m, index) => {
    // Se é uma das últimas 2 mensagens, manter conteúdo original
    if (index >= historicoLimitado.length - 2) {
      return {
        role: m.role,
        content: m.content
      }
    }

    // Para mensagens antigas, remover imagens base64 para economizar tokens
    if (typeof m.content === 'string') {
      // Remover base64 de imagens inline no texto
      const contentLimpo = m.content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[imagem removida do histórico]')
      return {
        role: m.role,
        content: contentLimpo
      }
    }

    // Se content é array (multi-modal), filtrar imagens
    if (Array.isArray(m.content)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentArray = m.content as any[]
      const contentFiltrado = contentArray.filter((block) => {
        // Manter apenas blocos de texto, remover imagens
        return block.type === 'text'
      })
      return {
        role: m.role,
        content: contentFiltrado.length > 0 ? contentFiltrado : '[conteúdo de imagem removido do histórico]'
      }
    }

    return {
      role: m.role,
      content: m.content
    }
  })

  // Preparar conteúdo da mensagem atual
  const userContent: Anthropic.ContentBlockParam[] = []

  // Adicionar imagem se houver
  let ocrContext = ''
  if (imagem_base64 && imagem_tipo) {
    userContent.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: imagem_tipo as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: imagem_base64
      }
    })

    // Tentar extrair texto da imagem com OCR para enriquecer o contexto
    try {
      const ocrResult = await extractTextFromImage(imagem_base64)
      if (ocrResult.text && ocrResult.text.length > 10) {
        ocrContext = `\n\n[TEXTO DETECTADO NA IMAGEM VIA OCR]:\n${ocrResult.text}\n`
        console.log('[OCR] Texto extraído da imagem:', ocrResult.text.substring(0, 100) + '...')
      }
    } catch (ocrError) {
      console.log('[OCR] Não foi possível extrair texto da imagem:', ocrError)
    }
  }

  // Adicionar PDF se houver
  if (pdf_base64) {
    userContent.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: pdf_base64
      }
    } as Anthropic.DocumentBlockParam)
  }

  // ========== PIPELINE META AI COMPLETO (OTIMIZADO - PARALELO) ==========
  // Executar análises independentes em paralelo para reduzir latência

  // BATCH 1: Análises independentes (não dependem umas das outras)
  const analise = analisarPergunta(mensagem)
  const classificacao = classificarIntencao(mensagem)
  const nivelDetectado = detectarNivelConhecimento(mensagem)
  const analiseUrgencia = detectarUrgencia(mensagem)

  // BATCH 2: Derivações (dependem do batch 1)
  const instrucoesAdicionais = gerarInstrucoesAdicionais(analise)
  const instrucoesIntencao = gerarInstrucoesDeIntencao(classificacao)
  const configAPI = getConfiguracoesAPI(classificacao)
  const perfilUsuario: PerfilUsuario = criarPerfilPadrao(user_id)
  perfilUsuario.nivelConhecimento = nivelDetectado
  const analisePerfil = analisarPerfilParaContexto(perfilUsuario, mensagem)
  const instrucoesPerfil = gerarInstrucoesPersonalizadas(analisePerfil)
  const instrucoesUrgencia = gerarInstrucoesUrgencia(analiseUrgencia)

  // PASSO 3.3: Estrutura de explicação (ExplanationStructure)
  const configExplicacao: Partial<ConfiguracaoExplicacao> = {
    nivel: nivelDetectado,
    preferencia: analisePerfil.formatoRecomendado,
    urgencia: analiseUrgencia.nivel,
    incluirImagens: analisePerfil.incluirImagens || analise.quantidadeImagens > 0,
    incluirExemplos: analisePerfil.incluirExemplos,
    incluirQuestoes: analisePerfil.incluirQuestoes,
    incluirResumo: analiseUrgencia.recomendacoes.incluirResumo,
    incluirReferencias: true
  }
  const tipoExplicacao = selecionarTipoExplicacao(mensagem, configExplicacao)
  const instrucoesEstrutura = gerarInstrucoesEstrutura(tipoExplicacao, configExplicacao)

  // PASSO 3.4: Configuração de questões (QuestionGenerator) - se aplicável
  let instrucoesQuestoes = ''
  if (analise.quantidadeQuestoes > 0) {
    // Detectar estilo de prova se mencionado
    let estiloDetectado: EstiloProva | undefined
    const msgLower = mensagem.toLowerCase()
    if (msgLower.includes('enade')) estiloDetectado = 'enade'
    else if (msgLower.includes('residência') || msgLower.includes('residencia')) estiloDetectado = 'residencia'
    else if (msgLower.includes('revalida')) estiloDetectado = 'revalida'
    else if (msgLower.includes('concurso')) estiloDetectado = 'concurso'

    const tipoQuestao = sugerirTipoQuestao(mensagem, estiloDetectado)
    const incluirImagemQuestao = deveIncluirImagem(mensagem)

    const configQuestao = gerarConfiguracaoQuestao(
      mensagem.substring(0, 100), // Tema resumido
      analise.quantidadeQuestoes,
      {
        tipo: tipoQuestao,
        nivel: nivelDetectado === 'iniciante' ? 'facil' : nivelDetectado === 'avancado' ? 'dificil' : 'medio',
        estilo: estiloDetectado,
        incluirImagem: incluirImagemQuestao,
        incluirExplicacao: true
      }
    )
    instrucoesQuestoes = configQuestao.prompt
  }

  console.log(`[Pipeline] Passo 2-3: Intenção=${classificacao.intencao} (${(classificacao.confianca * 100).toFixed(0)}%) | Tools=${classificacao.toolsNecessarias.join(',')} | Formato=${classificacao.formatoIdeal} | Temp=${configAPI.temperature}`)
  console.log(`[Pipeline] TaskManager: ${analise.tarefas.join(' → ')} | Questões: ${analise.quantidadeQuestoes} | Imagens: ${analise.quantidadeImagens}`)
  console.log(`[Pipeline] Profile: Nível=${nivelDetectado} | Preferência=${analisePerfil.formatoRecomendado} | Urgência=${analiseUrgencia.nivel} (${analiseUrgencia.tipo})`)
  console.log(`[Pipeline] Explicação: Tipo=${tipoExplicacao} | Incluir: imagens=${analisePerfil.incluirImagens}, exemplos=${analisePerfil.incluirExemplos}`)

  // Combinar TODAS as instruções dos módulos Meta AI
  const todasInstrucoes = [
    instrucoesIntencao,
    instrucoesAdicionais,
    instrucoesPerfil,
    instrucoesUrgencia,
    instrucoesEstrutura,
    instrucoesQuestoes
  ].filter(Boolean).join('\n\n---\n\n')

  // Construir mensagem enriquecida com instruções + OCR context
  let mensagemEnriquecida = todasInstrucoes
    ? mensagem + '\n\n' + todasInstrucoes
    : mensagem

  // Adicionar contexto do OCR se disponível (texto extraído da imagem)
  if (ocrContext) {
    mensagemEnriquecida += ocrContext
  }

  // Adicionar texto
  userContent.push({
    type: 'text',
    text: mensagemEnriquecida
  })

  messages.push({
    role: 'user',
    content: userContent
  })

  // Configurar tools - criar array separado para evitar problemas de tipo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [...PREPARAMED_TOOLS]
  if (use_web_search) {
    tools.push({
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: 5,
      allowed_domains: DOMINIOS_MEDICOS
    })
  }

  // Selecionar modelo - Sonnet 4.5 para todos os planos
  // Sonnet oferece excelente qualidade com custo 5x menor que Opus
  const modeloSelecionado = MODELOS.claude.sonnet
  let systemPrompt = params.plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

  // ========== ENRIQUECIMENTO PARALELO (memória + variação + HF) ==========
  // Executar todas as operações async em paralelo para reduzir latência
  const responseType = detectResponseType(params.mensagem)
  const variationConfig = VARIATION_CONFIG[responseType]
  const topic = extractTopic(params.mensagem)
  const styleInstructions = generateStyleInstructions(user_id)
  const variedPromptInstructions = generateVariedPrompt('', topic, user_id)

  // Rodar memória e HF em paralelo (ambos são I/O-bound)
  const [memoryResult, agentResult] = await Promise.allSettled([
    getContextForPrompt(user_id),
    (FEATURES.SMART_AGENTS || FEATURES.MEDICAL_RAG)
      ? prepareAgentContext(params.mensagem)
      : Promise.resolve(null)
  ])

  // Aplicar resultados
  if (memoryResult.status === 'fulfilled' && memoryResult.value?.trim()) {
    systemPrompt += memoryResult.value
    console.log(`[Memory] Contexto adicionado (${memoryResult.value.length} chars)`)
  }

  systemPrompt += `\n\n---\n${styleInstructions}\n${variedPromptInstructions}`

  let agentContext: Awaited<ReturnType<typeof prepareAgentContext>> | null = null
  if (agentResult.status === 'fulfilled' && agentResult.value) {
    agentContext = agentResult.value
    if (agentContext.systemPromptAddition) {
      systemPrompt += '\n\n' + agentContext.systemPromptAddition
    }
    if (agentContext.enrichedContext) {
      systemPrompt += '\n\n' + agentContext.enrichedContext
    }
    console.log(`[HF] Agente: ${agentContext.agentType}`)
  }

  console.log(`[Variação] Tipo: ${responseType} | Temp: ${variationConfig.temperature} | Tópico: ${topic}`)
  // ========== FIM ENRIQUECIMENTO ==========

  // IMPORTANTE: Extended Thinking NÃO é compatível com tool_use no agentic loop
  // Quando tools são usadas, precisamos desabilitar thinking para evitar o erro:
  // "Expected `thinking` or `redacted_thinking`, but found `tool_use`"
  // Isso porque a API exige que mensagens assistant comecem com thinking blocks
  // quando thinking está habilitado, mas nosso agentic loop não preserva esses blocos
  const hasTools = tools.length > 0
  const canUseExtendedThinking = use_extended_thinking && !hasTools

  if (use_extended_thinking && hasTools) {
    console.log('[Chat API] Extended Thinking desabilitado - incompatível com tools no agentic loop')
  }

  // Configurar parâmetros
  // max_tokens aumentado para respostas mais completas
  // A auto-continuação vai pedir mais se necessário
  // Prompt caching habilitado para economizar tokens (system prompt cacheado por 5 min)
  const streamParams: Record<string, unknown> = {
    model: modeloSelecionado,
    max_tokens: canUseExtendedThinking ? 16000 : 12000, // Aumentado para evitar cortes
    system: [{
      type: 'text',
      text: systemPrompt,
      cache_control: { type: 'ephemeral' }
    }],
    messages,
    stream: true,
    tools: hasTools ? tools : undefined
  }

  if (canUseExtendedThinking) {
    streamParams.thinking = {
      type: 'enabled',
      budget_tokens: thinking_budget
    }
  }

  // Criar encoder para streaming
  const encoder = new TextEncoder()

  // Stream response com agentic loop para múltiplas tools
  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      let thinking = ''
      let tokensInput = 0
      let tokensOutput = 0
      const currentMessages = [...messages]
      let iterationCount = 0
      let continuationCount = 0 // Contador de continuações por max_tokens
      const MAX_ITERATIONS = 10 // Limite de iterações (tools + continuações)
      const MAX_CONTINUATIONS = 5 // Limite de continuações automáticas por max_tokens (aumentado para garantir respostas completas)

      // Criar registro de resposta ANTES de iniciar streaming (para garantir salvamento)
      const { data: assistantMsg, error: createMsgError } = await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'assistant',
          content: '[Gerando resposta...]', // Placeholder inicial
          tokens: 0
        })
        .select('id')
        .single()

      if (createMsgError) {
        console.error('[Chat API] Erro ao criar mensagem assistant:', createMsgError)
      }

      const assistantMsgId = assistantMsg?.id
      console.log('[Chat API] Mensagem assistant criada com ID:', assistantMsgId)

      // ========== ENVIAR CONVERSA_ID IMEDIATAMENTE PARA O FRONTEND ==========
      // Isso permite que o frontend atualize a URL e o histórico ANTES do streaming começar
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({
          type: 'conversa_created',
          conversa_id: conversa_id,
          titulo: extrairTituloInteligente(params.mensagem),
          modelo: params.plano === 'residencia' ? 'claude' : 'gemini'
        })}\n\n`)
      )
      console.log('[Chat API] Evento conversa_created enviado:', conversa_id)

      // Variável para controlar última atualização
      let lastUpdateTime = Date.now()
      const UPDATE_INTERVAL = 10000 // Atualizar a cada 10 segundos

      // Função para atualizar resposta no banco
      const updateResponse = async (final = false) => {
        const now = Date.now()
        // Só atualiza se passou o intervalo ou é final
        if (!final && now - lastUpdateTime < UPDATE_INTERVAL) return
        if (!assistantMsgId) return

        lastUpdateTime = now
        const { error } = await supabase
          .from('mensagens_ia_med')
          .update({
            content: fullResponse || '[Resposta vazia]',
            tokens: tokensInput + tokensOutput
          })
          .eq('id', assistantMsgId)

        if (error) {
          console.error('[Chat API] Erro ao atualizar resposta:', error)
        } else if (final) {
          console.log('[Chat API] Resposta final salva, tamanho:', fullResponse.length)
        }
      }

      // Heartbeat para manter conexão viva (a cada 25s) E atualizar resposta
      const heartbeatInterval = setInterval(async () => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          // Atualizar resposta durante o heartbeat
          await updateResponse()
        } catch {
          // Controller já fechado, ignorar
        }
      }, 25000)

      try {
        // Agentic loop - continua até o Claude terminar ou atingir limite
        while (iterationCount < MAX_ITERATIONS) {
          iterationCount++
          console.log(`[Chat API] Iteração ${iterationCount}/${MAX_ITERATIONS} (continuações: ${continuationCount}/${MAX_CONTINUATIONS})`)

          // Criar stream para esta iteração
          const currentStreamParams = {
            ...streamParams,
            messages: currentMessages
          }
          // @ts-expect-error - streamParams já contém model e max_tokens
          const stream = await anthropic.messages.stream(currentStreamParams)

          const toolCallsThisIteration: Array<{ id: string; name: string; input: Record<string, unknown>; result: unknown }> = []
          let currentToolCall: { id: string; name: string; input: string } | null = null
          const assistantContent: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }> = []
          let stopReason = ''

          for await (const event of stream) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const evt = event as any

            if (evt.type === 'content_block_start') {
              if (evt.content_block?.type === 'tool_use') {
                currentToolCall = { id: evt.content_block.id, name: evt.content_block.name, input: '' }
              } else if (evt.content_block?.type === 'text') {
                // Início de bloco de texto
              }
            } else if (evt.type === 'content_block_delta') {
              if (evt.delta.type === 'text_delta') {
                const text = evt.delta.text
                fullResponse += text

                // Enviar chunk
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
                )
              } else if (evt.delta.type === 'thinking_delta') {
                thinking += evt.delta.thinking || ''
              } else if (evt.delta.type === 'input_json_delta' && currentToolCall) {
                currentToolCall.input += evt.delta.partial_json || ''
              }
            } else if (evt.type === 'content_block_stop') {
              if (currentToolCall) {
                // Tool call completa, processar
                try {
                  const toolInput = JSON.parse(currentToolCall.input || '{}')

                  // Executar tool
                  console.log('[Chat API] Executando tool:', currentToolCall.name)

                  const toolResult = await executarTool(currentToolCall.name, toolInput, user_id)

                  console.log('[Chat API] Tool result success:', toolResult.success)
                  if (toolResult.error) {
                    console.error('[Chat API] Tool error:', toolResult.error)
                  }

                  // Se for imagem gerada, fazer upload para storage permanente
                  let processedResult = toolResult.data
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const toolData = toolResult.data as Record<string, any> | undefined
                  if (currentToolCall.name === 'gerar_imagem_medica' && toolData?.imagem_url) {
                    const imageUrl = toolData.imagem_url as string
                    if (isBase64Image(imageUrl)) {
                      console.log('[Chat API] Fazendo upload da imagem para storage...')
                      const storageUrl = await uploadImageToStorage(imageUrl, user_id, conversa_id)
                      if (storageUrl) {
                        console.log('[Chat API] Imagem salva no storage:', storageUrl)
                        processedResult = {
                          ...toolData,
                          imagem_url: storageUrl,
                          imagem_base64: imageUrl // Manter base64 para exibição imediata
                        }
                      } else {
                        console.error('[Chat API] Falha ao salvar imagem no storage')
                      }
                    }
                  }

                  // Enviar resultado da tool como evento para o frontend
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: 'tool_result',
                      tool_name: currentToolCall.name,
                      result: processedResult,
                      error: toolResult.error
                    })}\n\n`)
                  )

                  // Adicionar resposta textual formatada
                  if (toolResult.success && toolResult.data) {
                    const toolResponseText = formatToolResponse(currentToolCall.name, toolResult.data)
                    fullResponse += toolResponseText
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'text', content: toolResponseText })}\n\n`)
                    )
                  }

                  // Guardar para o próximo loop
                  toolCallsThisIteration.push({
                    id: currentToolCall.id,
                    name: currentToolCall.name,
                    input: toolInput,
                    result: toolResult.data || { error: toolResult.error }
                  })

                  // Adicionar ao content do assistant
                  assistantContent.push({
                    type: 'tool_use',
                    id: currentToolCall.id,
                    name: currentToolCall.name,
                    input: toolInput
                  })
                } catch (parseError) {
                  console.error('[Chat API] Erro ao processar tool call:', parseError)
                }
                currentToolCall = null
              }
            } else if (evt.type === 'message_delta') {
              if (evt.usage) {
                tokensOutput += evt.usage.output_tokens || 0
              }
              if (evt.delta?.stop_reason) {
                stopReason = evt.delta.stop_reason
              }
            } else if (evt.type === 'message_start') {
              if (evt.message?.usage) {
                tokensInput += evt.message.usage.input_tokens
              }
            }
          }

          // IMPORTANTE: Verificar max_tokens PRIMEIRO, antes de verificar end_turn
          // Se a resposta foi cortada por max_tokens, CONTINUAR automaticamente
          if (stopReason === 'max_tokens') {
            continuationCount++
            console.log(`[Chat API] Resposta cortada por max_tokens (continuação ${continuationCount}/${MAX_CONTINUATIONS})`)

            // Se atingiu limite de continuações, parar
            if (continuationCount > MAX_CONTINUATIONS) {
              console.log('[Chat API] Limite de continuações atingido')
              const endMsg = '\n\n---\n*[Resposta muito longa. Pergunte sobre um tópico mais específico para continuar.]*'
              fullResponse += endMsg
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: endMsg })}\n\n`)
              )
              break
            }

            console.log(`[Chat API] Continuando automaticamente de onde parou...`)

            // ========== VALIDAÇÃO META AI ==========
            // Usar o validador para detectar o que falta de forma mais inteligente
            const validacao = validarResposta(fullResponse, mensagem)
            console.log(gerarResumoValidacao(validacao))

            // Se a validação indica que está completa, podemos parar
            if (validacao.completa && validacao.confianca > 80) {
              console.log('[Chat API] Validação indica resposta completa, finalizando')
              break
            }

            // Usar o prompt de continuação gerado pelo validador se houver
            let promptContinuacao = validacao.promptContinuacao

            // Se não gerou prompt específico, usar fallback manual
            if (!promptContinuacao) {
              const conteudoSolicitado = mensagem.toLowerCase()
              const respostaAtual = fullResponse.toLowerCase()

              // Verificar questões pedidas vs entregues
              let questoesPedidas = 0
              const matchQuestoes = conteudoSolicitado.match(/(\d+)\s*quest[õo]es?/i)
              if (matchQuestoes) {
                questoesPedidas = parseInt(matchQuestoes[1])
              }
              const questoesEntregues = (fullResponse.match(/\*\*\d+[\.\)]/g) || []).length

              // Verificar se falta conteúdo
              const faltaQuestoes = questoesPedidas > 0 && questoesEntregues < questoesPedidas
              const faltaReferencias = !respostaAtual.includes('referência') &&
                                      !respostaAtual.includes('📚') &&
                                      !respostaAtual.includes('fontes:') &&
                                      !respostaAtual.includes('[1]')
              const faltaImagens = conteudoSolicitado.includes('imagem') && !respostaAtual.includes('📷')
              const terminouAbruptamente = fullResponse.endsWith('...') ||
                fullResponse.endsWith('-') ||
                /[a-z,]$/.test(fullResponse.trim())

              promptContinuacao = 'Continue EXATAMENTE de onde parou. '

              if (faltaQuestoes) {
                promptContinuacao += `Faltam ${questoesPedidas - questoesEntregues} questões para completar. `
              }
              if (faltaImagens) {
                promptContinuacao += 'Inclua as imagens solicitadas usando a tool buscar_imagens_medicas. '
              }
              if (faltaReferencias) {
                promptContinuacao += 'Finalize com as referências bibliográficas em formato ABNT. '
              }
              if (terminouAbruptamente) {
                promptContinuacao += 'A resposta foi cortada no meio - continue do ponto exato onde parou. '
              }

              promptContinuacao += 'NÃO repita o que já foi dito. Complete o restante.'
            }

            console.log(`[Chat API] Prompt de continuação: ${promptContinuacao.substring(0, 80)}...`)

            // Adicionar mensagem parcial do assistant e pedir para continuar
            currentMessages.push({
              role: 'assistant',
              content: fullResponse
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)

            currentMessages.push({
              role: 'user',
              content: promptContinuacao
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)

            // Continuar para próxima iteração (vai chamar a API novamente)
            continue
          }

          // Verificar se a resposta parece incompleta mesmo com end_turn
          const textoLimpo = fullResponse.replace(/\s+$/g, '') // Remove whitespace do final
          const ultimoChar = textoLimpo.slice(-1)
          const ultimaPalavra = textoLimpo.split(/\s+/).pop() || ''
          
          const pareceIncompleta = (
            // Termina abruptamente
            fullResponse.endsWith('...') ||
            fullResponse.endsWith('-') ||
            fullResponse.endsWith(',') ||
            // Termina com letra minúscula (indica corte no meio de frase)
            /[a-z]$/.test(ultimoChar) ||
            // Termina com palavra curta comum (indica corte no meio)
            ['ou', 'e', 'de', 'da', 'do', 'que', 'com', 'por', 'para', 'uma', 'um', 'o', 'a', 'os', 'as'].includes(ultimaPalavra.toLowerCase()) ||
            // Falta seção de fontes quando deveria ter
            (!fullResponse.includes('📚 **Fontes') &&
             !fullResponse.includes('**Fontes:**') &&
             !fullResponse.includes('Referências') &&
             !fullResponse.includes('📖') &&
             fullResponse.length > 500 && // Resposta substancial
             continuationCount < MAX_CONTINUATIONS)
          )
          
          console.log(`[Chat API] Verificação completude: último char="${ultimoChar}" última palavra="${ultimaPalavra}" pareceIncompleta=${pareceIncompleta}`)

          // Se não houve tool calls ou o stop_reason é end_turn, verificar se realmente terminou
          if (toolCallsThisIteration.length === 0 || stopReason === 'end_turn') {
            // Se parece incompleta e ainda temos continuações disponíveis, continuar
            if (pareceIncompleta && continuationCount < MAX_CONTINUATIONS) {
              console.log('[Chat API] Resposta parece incompleta, forçando continuação...')
              continuationCount++

              currentMessages.push({
                role: 'assistant',
                content: fullResponse
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any)

              currentMessages.push({
                role: 'user',
                content: 'A resposta foi cortada. Continue de onde parou e INCLUA OBRIGATORIAMENTE a seção 📚 **Fontes:** ao final com as referências bibliográficas numeradas [1], [2], [3]...'
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any)

              continue
            }

            console.log('[Chat API] Finalizando - stop_reason:', stopReason, 'tools:', toolCallsThisIteration.length)
            break
          }

          // Preparar mensagens para próxima iteração (continuar após tool use)
          console.log('[Chat API] Continuando após tool use...')

          // Adicionar resposta do assistant com tool_use
          currentMessages.push({
            role: 'assistant',
            content: assistantContent.length > 0 ? assistantContent : [{ type: 'text', text: fullResponse }]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)

          // Adicionar resultados das tools (com tratamento especial para imagens)
          const toolResults = toolCallsThisIteration.map(tc => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let resultContent: any = tc.result

            // Se for imagem, não passar o base64 de volta (muito grande)
            // Passar apenas confirmação de que foi gerada
            if (tc.name === 'gerar_imagem_medica' && resultContent?.imagem_url) {
              resultContent = {
                success: true,
                estrutura: resultContent.estrutura,
                descricao: resultContent.descricao,
                tipo: resultContent.tipo,
                mensagem: `Imagem de "${resultContent.estrutura}" gerada com sucesso e já exibida ao usuário.`
              }
            }

            return {
              type: 'tool_result',
              tool_use_id: tc.id,
              content: JSON.stringify(resultContent)
            }
          })

          currentMessages.push({
            role: 'user',
            content: toolResults
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)

          console.log('[Chat API] Mensagens atualizadas, iniciando próxima iteração...')
        }

        console.log('[Chat API] Agentic loop finalizado após', iterationCount, 'iterações')

        // ========== PASSO 6: VALIDAÇÃO FINAL META AI ==========
        // Validação do ResponseValidator (contagem de questões, referências)
        const validacaoFinal = validarResposta(fullResponse, mensagem)
        console.log('[Chat API] Validação ResponseValidator:')
        console.log(gerarResumoValidacao(validacaoFinal))

        // Validação do QualityChecker (coerência, relevância, completude)
        const metricasQualidade = verificarQualidade(mensagem, fullResponse, {
          questoesEsperadas: analise.quantidadeQuestoes,
          imagensEsperadas: analisePerfil.incluirImagens || analise.quantidadeImagens > 0 || classificacao.toolsNecessarias.includes('buscar_imagens_medicas'),
          referenciasEsperadas: true,
          nivelDetalhe: classificacao.nivelDetalhe,
          formatoEsperado: classificacao.formatoIdeal
        })
        console.log('[Chat API] Validação QualityChecker:')
        console.log(gerarRelatorioQualidade(metricasQualidade))
        console.log(`[Chat API] Perfil aplicado: Nível=${nivelDetectado} | Urgência=${analiseUrgencia.nivel} | Tipo Explicação=${tipoExplicacao}`)

        // PASSO 6.5: Validação de questões geradas (QuestionGenerator profissional)
        if (analise.quantidadeQuestoes > 0) {
          const configQuestoesValidacao: ConfiguracaoQuestoes = {
            quantidade: analise.quantidadeQuestoes,
            tema: mensagem.substring(0, 100),
            dificuldade: (nivelDetectado === 'iniciante' ? 'facil' : nivelDetectado === 'avancado' ? 'dificil' : 'medio') as NivelDificuldade,
            incluirCasosClinicos: analise.quantidadeQuestoes >= 5,
            incluirImagens: deveIncluirImagem(mensagem),
            niveisCognitivos: 'misto',
            formatoGabarito: 'detalhado'
          }
          const validacaoQuestoes = validarQuestoesGeradas(fullResponse, configQuestoesValidacao)
          console.log(`[Chat API] Validação Questões Profissional: ${validacaoQuestoes.questoesEncontradas}/${analise.quantidadeQuestoes} | Qualidade: ${validacaoQuestoes.qualidade}%`)
          if (validacaoQuestoes.problemasEncontrados.length > 0) {
            console.log(`[Chat API] Problemas nas questões: ${validacaoQuestoes.problemasEncontrados.join(', ')}`)
          }
        }

        // PASSO 7: Se precisa continuar mas atingimos o limite, logar aviso
        if (precisaContinuar(metricasQualidade) && iterationCount >= MAX_ITERATIONS) {
          console.log('[Chat API] AVISO: Resposta pode estar incompleta, mas atingimos o limite de iterações')
        }

        // Atualizar resposta final no banco (já foi criada no início)
        console.log('[Chat API] Atualizando resposta final no banco, conversa_id:', conversa_id, 'tamanho:', fullResponse.length)
        await updateResponse(true)

        // Atualizar tokens da conversa
        const { error: updateError } = await supabase
          .from('conversas_ia_med')
          .update({
            tokens_usados: tokensInput + tokensOutput,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa_id)

        if (updateError) {
          console.error('[Chat API] ERRO ao atualizar conversa:', updateError)
        }

        // Incrementar uso
        const custo = calcularCusto(modeloSelecionado, tokensInput, tokensOutput)
        await incrementarUsoIA(user_id, 'chats', 1, tokensInput, tokensOutput, custo)

        // ========== ATUALIZAR APRENDIZADO DO USUARIO ==========
        try {
          // Extrair tópico da mensagem para atualizar aprendizado
          const topicoEstudado = extractTopic(params.mensagem)
          if (topicoEstudado && topicoEstudado !== 'medicina') {
            await updateUserLearning(user_id, topicoEstudado)
            console.log(`[Aprendizado] Atualizado para usuário ${user_id}: ${topicoEstudado}`)
          }
        } catch (learnError) {
          console.error('[Aprendizado] Erro ao atualizar:', learnError)
        }
        // ========== FIM ATUALIZAR APRENDIZADO ==========

        // ========== POS-PROCESSAMENTO HUGGING FACE ==========
        try {
          if (agentContext && FEATURES.SMART_AGENTS) {
            // Formatar resposta com sugestoes de topicos relacionados
            fullResponse = formatAgentResponse(
              fullResponse,
              agentContext.agentType,
              agentContext.relatedTopics
            )

            // Validar resposta medica
            const validation = await validateMedicalResponse(fullResponse, params.mensagem)
            if (validation.warnings.length > 0) {
              console.log('[HF] Avisos de validacao:', validation.warnings)
            }
          }
        } catch (hfError) {
          console.error('[HF] Erro no pos-processamento:', hfError)
        }
        // ========== FIM POS-PROCESSAMENTO ==========

        // Verificar se resposta parece incompleta
        const respostaIncompleta = fullResponse.endsWith('(') ||
          fullResponse.endsWith(',') ||
          fullResponse.endsWith('...') ||
          (fullResponse.includes('1.') && !fullResponse.includes('2.') && fullResponse.length > 500) ||
          fullResponse.trim().endsWith(':')

        // Enviar metadados finais
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            conversa_id,
            tokens: { input: tokensInput, output: tokensOutput },
            thinking: thinking || undefined,
            incomplete: respostaIncompleta
          })}\n\n`)
        )

        clearInterval(heartbeatInterval)
        controller.close()
      } catch (error) {
        clearInterval(heartbeatInterval)
        console.error('Erro no stream Claude:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

        // Verificar tipo de erro para dar resposta adequada
        const isOverloaded = errorMessage.includes('overloaded') || errorMessage.includes('529')
        const isRateLimit = errorMessage.includes('rate_limit') || errorMessage.includes('429')
        const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')
        const shouldFallbackToGemini = (isOverloaded || isRateLimit) && fullResponse.length < 100

        // ========== FALLBACK AUTOMATICO PARA GEMINI ==========
        if (shouldFallbackToGemini) {
          console.log('[Chat API] Fazendo fallback automatico para Gemini devido a:', errorMessage)

          // Notificar frontend sobre a troca de provider
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'provider_switch',
              from: 'claude',
              to: 'gemini',
              message: 'Alternando para servidor secundario...'
            })}\n\n`)
          )

          try {
            // Usar Gemini como fallback
            const geminiModel = genAI.getGenerativeModel({
              model: MODELOS.gemini.flash,
              systemInstruction: systemPrompt,
              generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 8192
              }
            })

            // Preparar historico para Gemini
            const geminiHistory = currentMessages.slice(0, -1).map(m => ({
              role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
              parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
            }))

            const lastMessage = currentMessages[currentMessages.length - 1]
            const lastContent = typeof lastMessage.content === 'string'
              ? lastMessage.content
              : Array.isArray(lastMessage.content)
                ? lastMessage.content.map((c: { type: string; text?: string }) => c.type === 'text' ? c.text : '').join(' ')
                : String(lastMessage.content)

            const geminiChat = geminiModel.startChat({ history: geminiHistory })
            const geminiResult = await geminiChat.sendMessageStream(lastContent)

            let geminiResponse = ''
            for await (const chunk of geminiResult.stream) {
              const text = chunk.text()
              if (text) {
                geminiResponse += text
                fullResponse += text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
                )
              }
            }

            // Estimar tokens Gemini
            const geminiInputTokens = Math.ceil(lastContent.length / 4) + geminiHistory.reduce((acc, m) => acc + Math.ceil(m.parts[0].text.length / 4), 0)
            const geminiOutputTokens = Math.ceil(geminiResponse.length / 4)
            tokensInput = geminiInputTokens
            tokensOutput = geminiOutputTokens

            console.log('[Chat API] Fallback Gemini sucesso, tamanho:', geminiResponse.length)

            // Salvar resposta
            await updateResponse(true)

            // Incrementar uso com Gemini
            const custoGemini = calcularCusto('gemini-flash', geminiInputTokens, geminiOutputTokens)
            await incrementarUsoIA(user_id, 'chats', 1, geminiInputTokens, geminiOutputTokens, custoGemini)

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                conversa_id,
                tokens: { input: geminiInputTokens, output: geminiOutputTokens },
                provider: 'gemini',
                fallback: true
              })}\n\n`)
            )

            controller.close()
            return

          } catch (geminiError) {
            console.error('[Chat API] Fallback Gemini tambem falhou:', geminiError)
            // Continuar para mensagem de erro padrao
          }
        }
        // ========== FIM FALLBACK GEMINI ==========

        let fallbackMessage = ''

        if (fullResponse && fullResponse.length > 100) {
          // Se já tem conteúdo substancial, apenas avisar que pode estar incompleto
          fallbackMessage = '\n\n---\n*Resposta pode estar incompleta. Se precisar de mais detalhes, pergunte novamente.*'
        } else if (isOverloaded || isRateLimit) {
          // Se API está sobrecarregada - mensagem mais amigável
          fallbackMessage = 'Nossos servidores estao processando muitas solicitacoes. Por favor, aguarde alguns segundos e tente novamente. Sua pergunta sera respondida normalmente.'
        } else if (isTimeout) {
          fallbackMessage = 'O processamento esta levando mais tempo que o esperado. Tente uma pergunta mais curta ou especifica.'
        } else {
          fallbackMessage = 'Ocorreu um problema temporario. Por favor, tente novamente em alguns instantes.'
        }

        // Se já tem resposta parcial, adicionar aviso
        if (fullResponse && fullResponse.length > 0) {
          fullResponse += fallbackMessage
          console.log('[Chat API] Salvando resposta parcial apos erro, tamanho:', fullResponse.length)
          try {
            // Atualizar resposta existente (já foi criada no início do streaming)
            await updateResponse(true)

            // Enviar o conteúdo parcial que já foi gerado
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fallbackMessage })}\n\n`)
            )
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                conversa_id,
                tokens: { input: tokensInput, output: tokensOutput },
                partial: true
              })}\n\n`)
            )
          } catch (saveError) {
            console.error('[Chat API] Erro ao salvar resposta parcial:', saveError)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: fallbackMessage })}\n\n`)
            )
          }
        } else {
          // Sem resposta parcial, usar fallback como resposta
          fullResponse = fallbackMessage
          try {
            // Atualizar mensagem existente com fallback
            await updateResponse(true)

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: fallbackMessage })}\n\n`)
            )
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'done',
                conversa_id,
                tokens: { input: 0, output: 0 },
                error: true
              })}\n\n`)
            )
          } catch (saveError) {
            console.error('[Chat API] Erro ao salvar fallback:', saveError)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: fallbackMessage })}\n\n`)
            )
          }
        }

        controller.close()
      }
    }
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// ==========================================
// STREAMING COM GEMINI
// ==========================================

interface StreamGeminiParams {
  historico: Array<{ role: 'user' | 'assistant'; content: string }>
  mensagem: string
  conversa_id: string
  user_id: string
  imagem_base64?: string
  imagem_tipo?: string
}

async function streamGemini(params: StreamGeminiParams) {
  const { historico, mensagem, conversa_id, user_id, imagem_base64, imagem_tipo } = params

  const model = genAI.getGenerativeModel({
    model: MODELOS.gemini.flash,
    systemInstruction: SYSTEM_PROMPT_PREMIUM,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 8192  // Aumentado para evitar cortes em respostas longas
    }
  })

  // Preparar histórico
  const history = historico.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  // Preparar conteúdo da mensagem
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

  if (imagem_base64 && imagem_tipo) {
    parts.push({
      inlineData: {
        mimeType: imagem_tipo,
        data: imagem_base64
      }
    })
  }

  parts.push({ text: mensagem })

  // Criar chat e enviar com stream
  const chat = model.startChat({ history })
  const result = await chat.sendMessageStream(parts)

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''

      // Criar registro de resposta ANTES de iniciar streaming
      const { data: assistantMsg, error: createMsgError } = await supabase
        .from('mensagens_ia_med')
        .insert({
          conversa_id,
          role: 'assistant',
          content: '[Gerando resposta...]',
          tokens: 0
        })
        .select('id')
        .single()

      if (createMsgError) {
        console.error('[Gemini] Erro ao criar mensagem assistant:', createMsgError)
      }

      const assistantMsgId = assistantMsg?.id
      console.log('[Gemini] Mensagem assistant criada com ID:', assistantMsgId)

      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullResponse += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
            )
          }
        }

        // Estimar tokens
        const tokensInput = Math.ceil(mensagem.length / 4) + historico.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0)
        const tokensOutput = Math.ceil(fullResponse.length / 4)

        // Atualizar resposta final
        if (assistantMsgId) {
          console.log('[Gemini] Atualizando resposta final, tamanho:', fullResponse.length)
          const { error: updateMsgError } = await supabase
            .from('mensagens_ia_med')
            .update({
              content: fullResponse || '[Resposta vazia]',
              tokens: tokensInput + tokensOutput
            })
            .eq('id', assistantMsgId)

          if (updateMsgError) {
            console.error('[Gemini] ERRO ao atualizar resposta:', updateMsgError)
          } else {
            console.log('[Gemini] Resposta salva com sucesso!')
          }
        }

        // Atualizar conversa
        const { error: updateError } = await supabase
          .from('conversas_ia_med')
          .update({
            tokens_usados: tokensInput + tokensOutput,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversa_id)

        if (updateError) {
          console.error('[Gemini] ERRO ao atualizar conversa:', updateError)
        }

        // Incrementar uso
        const custo = calcularCusto('gemini-flash', tokensInput, tokensOutput)
        await incrementarUsoIA(user_id, 'chats', 1, tokensInput, tokensOutput, custo)

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            conversa_id,
            tokens: { input: tokensInput, output: tokensOutput }
          })}\n\n`)
        )

        controller.close()
      } catch (error) {
        console.error('Erro no stream Gemini:', error)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Erro no processamento' })}\n\n`)
        )
        controller.close()
      }
    }
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

// ==========================================
// GET - Listar Conversas
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const conversa_id = searchParams.get('conversa_id')
    const modo = searchParams.get('modo') // Filtrar por modo (chat, caso_clinico, tutor, questoes)

    if (!user_id) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    if (conversa_id) {
      // Buscar conversa específica com mensagens
      const { data: conversa, error: convError } = await supabase
        .from('conversas_ia_med')
        .select('*')
        .eq('id', conversa_id)
        .eq('user_id', user_id)
        .single()

      console.log('[Chat API GET] Buscando conversa:', conversa_id)
      console.log('[Chat API GET] Conversa encontrada:', !!conversa, 'erro:', convError?.message)

      if (!conversa) {
        return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
      }

      const { data: mensagens, error: msgError } = await supabase
        .from('mensagens_ia_med')
        .select('*')
        .eq('conversa_id', conversa_id)
        .order('created_at', { ascending: true })

      console.log('[Chat API GET] Mensagens encontradas:', mensagens?.length || 0, 'erro:', msgError?.message)

      return NextResponse.json({ conversa, mensagens })
    }

    // Listar conversas do usuário (filtradas por modo se especificado)
    let query = supabase
      .from('conversas_ia_med')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(50)

    // Aplicar filtro de modo se especificado
    if (modo) {
      query = query.eq('modo', modo)
    }

    const { data: conversas } = await query

    return NextResponse.json({ conversas })
  } catch (error) {
    console.error('Erro ao buscar conversas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// DELETE - Excluir Conversa
// ==========================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversa_id = searchParams.get('conversa_id')
    const user_id = searchParams.get('user_id')

    if (!conversa_id || !user_id) {
      return NextResponse.json(
        { error: 'conversa_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se conversa pertence ao usuário
    const { data: conversa } = await supabase
      .from('conversas_ia_med')
      .select('id')
      .eq('id', conversa_id)
      .eq('user_id', user_id)
      .single()

    if (!conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Deletar (cascade vai deletar mensagens)
    await supabase
      .from('conversas_ia_med')
      .delete()
      .eq('id', conversa_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar conversa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
