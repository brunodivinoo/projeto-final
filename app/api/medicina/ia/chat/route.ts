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
import OpenAI from 'openai'
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

// OpenAI client para fallback
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null

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
          titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
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
            titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
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
              titulo: mensagem.substring(0, 50) + (mensagem.length > 50 ? '...' : ''),
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

    // Escolher modelo e fazer streaming
    // Premium = Sonnet | Residência = Opus (ambos Claude)
    return await streamClaude({
      historico,
      mensagem,
      conversa_id: conversaAtual,
      user_id,
      plano, // Passar plano para escolher modelo
      imagem_base64,
      imagem_tipo,
      pdf_base64,
      use_web_search,
      use_extended_thinking,
      thinking_budget
    })
  } catch (error) {
    console.error('Erro na API de chat:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
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

  // ========== PIPELINE META AI COMPLETO ==========
  // PASSO 1: Recebe pergunta (já recebida em 'mensagem')

  // PASSO 2: Análise de estrutura (TaskManager)
  const analise = analisarPergunta(mensagem)
  const instrucoesAdicionais = gerarInstrucoesAdicionais(analise)

  // PASSO 3: Classificação de intenção (IntentClassifier)
  const classificacao = classificarIntencao(mensagem)
  const instrucoesIntencao = gerarInstrucoesDeIntencao(classificacao)
  const configAPI = getConfiguracoesAPI(classificacao)

  // PASSO 3.1: Análise de perfil do usuário (UserProfileManager)
  // Criar perfil básico para esta sessão (pode ser persistido no futuro)
  const perfilUsuario: PerfilUsuario = criarPerfilPadrao(user_id)
  const nivelDetectado = detectarNivelConhecimento(mensagem)
  perfilUsuario.nivelConhecimento = nivelDetectado
  const analisePerfil = analisarPerfilParaContexto(perfilUsuario, mensagem)
  const instrucoesPerfil = gerarInstrucoesPersonalizadas(analisePerfil)

  // PASSO 3.2: Detecção de urgência (UrgencyDetector)
  const analiseUrgencia = detectarUrgencia(mensagem)
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

  // Selecionar modelo baseado no plano
  // Premium = Sonnet (mais barato), Residência = Opus (mais capaz)
  const modeloSelecionado = params.plano === 'residencia' ? MODELOS.claude.opus : MODELOS.claude.sonnet
  let systemPrompt = params.plano === 'residencia' ? SYSTEM_PROMPT_RESIDENCIA : SYSTEM_PROMPT_PREMIUM

  // ========== SISTEMA DE VARIABILIDADE ==========
  // Detectar tipo de resposta e aplicar configurações de variação
  const responseType = detectResponseType(params.mensagem)
  const variationConfig = VARIATION_CONFIG[responseType]
  const topic = extractTopic(params.mensagem)
  const styleInstructions = generateStyleInstructions(user_id)

  // Enriquecer prompt com variação de abordagem
  const variedPromptInstructions = generateVariedPrompt('', topic, user_id)

  // Adicionar instruções de estilo e variação ao system prompt
  systemPrompt += `\n\n---\n${styleInstructions}\n${variedPromptInstructions}`

  console.log(`[Variação] Tipo: ${responseType} | Temp: ${variationConfig.temperature} | Tópico: ${topic}`)
  // ========== FIM SISTEMA DE VARIABILIDADE ==========

  // ========== ENRIQUECIMENTO COM HUGGING FACE ==========
  let agentContext: Awaited<ReturnType<typeof prepareAgentContext>> | null = null

  try {
    if (FEATURES.SMART_AGENTS || FEATURES.MEDICAL_RAG) {
      // Preparar contexto do agente
      agentContext = await prepareAgentContext(params.mensagem)

      // Adicionar instrucoes especificas do agente
      if (agentContext.systemPromptAddition) {
        systemPrompt += '\n\n' + agentContext.systemPromptAddition
      }

      // Adicionar contexto medico enriquecido
      if (agentContext.enrichedContext) {
        systemPrompt += '\n\n' + agentContext.enrichedContext
      }

      console.log(`[HF] Agente detectado: ${agentContext.agentType}`)
    }
  } catch (hfError) {
    // Se falhar, continua com o prompt original
    console.error('[HF] Erro ao enriquecer prompt (usando fallback):', hfError)
  }
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
  const streamParams: Record<string, unknown> = {
    model: modeloSelecionado,
    max_tokens: canUseExtendedThinking ? 16000 : 12000, // Aumentado para evitar cortes
    system: systemPrompt,
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
          titulo: params.mensagem.substring(0, 50) + (params.mensagem.length > 50 ? '...' : ''),
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
        const errorString = String(error).toLowerCase()

        // Verificar tipo de erro para dar resposta adequada
        // Detectar mais padroes de erro de sobrecarga/rate limit
        const isOverloaded = errorMessage.includes('overloaded') ||
                            errorMessage.includes('529') ||
                            errorString.includes('overloaded') ||
                            errorString.includes('capacity') ||
                            errorString.includes('service unavailable') ||
                            errorString.includes('503')
        const isRateLimit = errorMessage.includes('rate_limit') ||
                          errorMessage.includes('429') ||
                          errorString.includes('too many requests') ||
                          errorString.includes('rate limit')
        const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')

        // SEMPRE tentar fallback se o erro for de sobrecarga ou rate limit
        // Removido a condicao fullResponse.length < 100 para garantir que o fallback funcione
        const shouldFallback = isOverloaded || isRateLimit

        console.log(`[Chat API] Erro detectado - Overloaded: ${isOverloaded}, RateLimit: ${isRateLimit}, Timeout: ${isTimeout}, ShouldFallback: ${shouldFallback}`)
        console.log(`[Chat API] Resposta parcial existente: ${fullResponse.length} caracteres`)

        // ========== FALLBACK AUTOMATICO MULTI-PROVIDER ==========
        // Ordem: Claude falhou -> Gemini -> OpenAI
        if (shouldFallback) {
          console.log('[Chat API] Iniciando fallback automatico devido a:', errorMessage.substring(0, 100))

          // Notificar frontend sobre a troca de provider
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'provider_switch',
              from: 'claude',
              to: 'gemini',
              message: 'Alternando para servidor secundario...'
            })}\n\n`)
          )

          // ========== TENTATIVA 1: GEMINI ==========
          let fallbackSuccess = false
          try {
            console.log('[Chat API] Tentando fallback para Gemini...')

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
            fallbackSuccess = true
            return

          } catch (geminiError) {
            console.error('[Chat API] Fallback Gemini falhou:', geminiError)
          }

          // ========== TENTATIVA 2: OPENAI ==========
          if (!fallbackSuccess && openai) {
            try {
              console.log('[Chat API] Tentando fallback para OpenAI...')

              // Notificar frontend
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'provider_switch',
                  from: 'gemini',
                  to: 'openai',
                  message: 'Alternando para servidor terciario...'
                })}\n\n`)
              )

              const lastMessage = currentMessages[currentMessages.length - 1]
              const lastContent = typeof lastMessage.content === 'string'
                ? lastMessage.content
                : Array.isArray(lastMessage.content)
                  ? lastMessage.content.map((c: { type: string; text?: string }) => c.type === 'text' ? c.text : '').join(' ')
                  : String(lastMessage.content)

              // Preparar mensagens para OpenAI
              const openaiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
                { role: 'system', content: systemPrompt }
              ]

              currentMessages.slice(0, -1).forEach(m => {
                openaiMessages.push({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
                })
              })

              openaiMessages.push({ role: 'user', content: lastContent })

              const openaiStream = await openai.chat.completions.create({
                model: 'gpt-4o-mini', // Modelo rapido e economico
                messages: openaiMessages,
                stream: true,
                max_tokens: 8192,
                temperature: 0.7
              })

              let openaiResponse = ''
              for await (const chunk of openaiStream) {
                const text = chunk.choices[0]?.delta?.content || ''
                if (text) {
                  openaiResponse += text
                  fullResponse += text
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
                  )
                }
              }

              // Estimar tokens OpenAI
              const openaiInputTokens = Math.ceil(lastContent.length / 4)
              const openaiOutputTokens = Math.ceil(openaiResponse.length / 4)
              tokensInput = openaiInputTokens
              tokensOutput = openaiOutputTokens

              console.log('[Chat API] Fallback OpenAI sucesso, tamanho:', openaiResponse.length)

              // Salvar resposta
              await updateResponse(true)

              // Incrementar uso
              await incrementarUsoIA(user_id, 'chats', 1, openaiInputTokens, openaiOutputTokens, 0)

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'done',
                  conversa_id,
                  tokens: { input: openaiInputTokens, output: openaiOutputTokens },
                  provider: 'openai',
                  fallback: true
                })}\n\n`)
              )

              controller.close()
              return

            } catch (openaiError) {
              console.error('[Chat API] Fallback OpenAI tambem falhou:', openaiError)
            }
          }
        }
        // ========== FIM FALLBACK MULTI-PROVIDER ==========

        let fallbackMessage = ''

        if (fullResponse && fullResponse.length > 100) {
          // Se já tem conteúdo substancial, apenas avisar que pode estar incompleto
          fallbackMessage = '\n\n---\n*Resposta pode estar incompleta. Se precisar de mais detalhes, pergunte novamente.*'
        } else if (isOverloaded || isRateLimit) {
          // Se API está sobrecarregada, dar mensagem amigável
          fallbackMessage = 'Estamos com muitos acessos no momento. Aguarde alguns segundos e sua resposta sera gerada automaticamente. Se preferir, reformule sua pergunta.'
        } else if (isTimeout) {
          fallbackMessage = 'A resposta esta demorando mais que o esperado. Por favor, tente fazer uma pergunta mais especifica ou divida em partes menores.'
        } else {
          fallbackMessage = 'Desculpe, tive uma instabilidade tecnica. Por favor, tente novamente ou reformule sua pergunta de forma diferente.'
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
