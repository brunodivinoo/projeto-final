import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CAKTO_EVENTS, verifyWebhookSignature } from '@/lib/cakto'

// =============================================
// MAPEAMENTO DE PLANOS - UNIFICADO
// =============================================
// Nomenclatura padrão: gratuito | premium | residencia
// Legacy (para manter compatibilidade): FREE | ESTUDA_PRO
// =============================================

type PlanoUnificado = 'gratuito' | 'premium' | 'residencia'
type PlanoLegacy = 'FREE' | 'ESTUDA_PRO'

// Mapear valor do pedido para plano
// Ajuste os valores conforme os produtos cadastrados no Cakto
function mapearValorParaPlano(valorCentavos: number, productName?: string): PlanoUnificado {
  const valorReais = valorCentavos / 100

  // Primeiro, tentar identificar pelo nome do produto (mais confiável)
  if (productName) {
    const nomeLower = productName.toLowerCase()
    if (nomeLower.includes('residencia') || nomeLower.includes('residência')) {
      return 'residencia'
    }
    if (nomeLower.includes('premium')) {
      return 'premium'
    }
  }

  // Fallback: identificar pelo valor
  // R$140+ = Residência (R$149,90)
  if (valorReais >= 140) return 'residencia'
  // R$50+ = Premium (R$59,90)
  if (valorReais >= 50) return 'premium'
  // Padrão = gratuito (não deveria chegar aqui em compra aprovada)
  return 'gratuito'
}

// Mapear plano unificado para legacy (para tabela profiles)
function planoParaLegacy(plano: PlanoUnificado): PlanoLegacy {
  switch (plano) {
    case 'residencia':
    case 'premium':
      return 'ESTUDA_PRO' // Ambos são PRO no sistema legacy
    default:
      return 'FREE'
  }
}

// Tipos para o webhook
interface CaktoCustomer {
  email: string
  name?: string
  phone?: string
  document?: string
}

interface CaktoOrder {
  id: string
  refId?: string
  status: string
  amount: number // em centavos
  customer: CaktoCustomer
  utm_content?: string
  product_id?: string
  product_name?: string
}

interface CaktoSubscription {
  id: string
  status: string
  nextBillingDate?: string
}

// Cliente Supabase com service role para operacoes admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('x-cakto-signature') || ''
    const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET || ''

    // Verificar assinatura do webhook
    if (webhookSecret && !verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(payload)
    const event = body.event

    // O Cakto envia os dados diretamente em body.data (não em body.data.order)
    // Converter para o formato esperado pelo nosso código
    const rawData = body.data

    const order: CaktoOrder | undefined = rawData ? {
      id: rawData.id,
      refId: rawData.refId,
      status: rawData.status,
      amount: rawData.amount, // Já vem em centavos
      customer: {
        email: rawData.customer?.email,
        name: rawData.customer?.name,
        phone: rawData.customer?.phone,
        document: rawData.customer?.docNumber
      },
      utm_content: rawData.utm_content,
      product_id: rawData.product?.id,
      product_name: rawData.product?.name
    } : undefined

    const subscription: CaktoSubscription | undefined = rawData?.subscription ? {
      id: rawData.subscription.id,
      status: rawData.subscription.status,
      nextBillingDate: rawData.subscription.next_payment_date
    } : undefined

    console.log(`[Cakto Webhook] Evento recebido: ${event}`, {
      order_id: order?.id,
      amount: order?.amount,
      email: order?.customer?.email,
      product_name: order?.product_name
    })

    // Processar eventos
    switch (event) {
      case CAKTO_EVENTS.PURCHASE_APPROVED:
      case CAKTO_EVENTS.SUBSCRIPTION_CREATED:
        await handlePurchaseApproved(order, subscription)
        break

      case CAKTO_EVENTS.SUBSCRIPTION_RENEWED:
        await handleSubscriptionRenewed(order, subscription)
        break

      case CAKTO_EVENTS.SUBSCRIPTION_CANCELED:
      case CAKTO_EVENTS.REFUND:
      case CAKTO_EVENTS.CHARGEBACK:
        await handleSubscriptionCanceled(order)
        break

      case CAKTO_EVENTS.SUBSCRIPTION_RENEWAL_REFUSED:
        await handleRenewalRefused(order)
        break

      case CAKTO_EVENTS.INITIATE_CHECKOUT:
      case CAKTO_EVENTS.CHECKOUT_ABANDONMENT:
      case CAKTO_EVENTS.PIX_GERADO:
      case CAKTO_EVENTS.BOLETO_GERADO:
        // Apenas logar esses eventos por enquanto
        console.log(`[Cakto] Evento ${event} registrado`)
        break

      default:
        console.log(`[Cakto] Evento desconhecido: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Cakto Webhook] Erro:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Processar compra aprovada
async function handlePurchaseApproved(order?: CaktoOrder, subscription?: CaktoSubscription) {
  if (!order?.customer?.email) {
    console.error('[Cakto] Pedido sem email do cliente')
    return
  }

  const email = order.customer.email
  const userId = order.utm_content // userId passado via UTM

  // Determinar plano baseado no valor e nome do produto
  const planoUnificado = mapearValorParaPlano(order.amount, order.product_name)
  const planoLegacy = planoParaLegacy(planoUnificado)

  console.log(`[Cakto] Compra aprovada para: ${email}`, {
    valor: order.amount / 100,
    plano_unificado: planoUnificado,
    plano_legacy: planoLegacy
  })

  // Buscar usuario pelo email ou userId
  let profileId = userId

  if (!profileId) {
    // Tentar buscar na tabela profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    profileId = profile?.id

    // Se não encontrou, tentar na tabela profiles_med
    if (!profileId) {
      const { data: profileMed } = await supabaseAdmin
        .from('profiles_med')
        .select('id')
        .eq('email', email)
        .single()

      profileId = profileMed?.id
    }
  }

  if (!profileId) {
    console.error(`[Cakto] Usuario nao encontrado: ${email}`)
    // Salvar para processamento posterior
    await saveUnmatchedPayment(order, subscription, planoUnificado)
    return
  }

  // =============================================
  // ATUALIZAR AMBAS AS TABELAS (SINCRONIZAÇÃO)
  // =============================================

  // 1. Atualizar tabela profiles (sistema legacy)
  const { error: updateLegacyError } = await supabaseAdmin
    .from('profiles')
    .update({
      plano: planoLegacy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (updateLegacyError) {
    console.error('[Cakto] Erro ao atualizar profiles (legacy):', updateLegacyError)
  }

  // 2. Atualizar tabela profiles_med (sistema PreparaMed)
  const { error: updateMedError } = await supabaseAdmin
    .from('profiles_med')
    .update({
      plano: planoUnificado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (updateMedError) {
    console.error('[Cakto] Erro ao atualizar profiles_med:', updateMedError)
  }

  // 3. Registrar assinatura na tabela assinaturas (legacy)
  await supabaseAdmin
    .from('assinaturas')
    .upsert({
      user_id: profileId,
      plano: planoLegacy,
      status: 'active',
      cakto_order_id: order.id,
      cakto_subscription_id: subscription?.id,
      valor: order.amount,
      iniciada_em: new Date().toISOString(),
      proxima_cobranca: subscription?.nextBillingDate,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

  // 4. Registrar assinatura na tabela assinaturas_med (PreparaMed)
  await supabaseAdmin
    .from('assinaturas_med')
    .upsert({
      user_id: profileId,
      plano: planoUnificado,
      status: 'ativa',
      data_inicio: new Date().toISOString(),
      proximo_pagamento: subscription?.nextBillingDate,
      valor_mensal: order.amount / 100,
      gateway: 'cakto',
      gateway_subscription_id: subscription?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    })

  console.log(`[Cakto] Usuario ${profileId} atualizado para ${planoUnificado} (${planoLegacy})`)
}

// Processar renovacao de assinatura
async function handleSubscriptionRenewed(order?: CaktoOrder, subscription?: CaktoSubscription) {
  if (!order?.customer?.email) return

  const email = order.customer.email

  // Buscar usuario
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile?.id) return

  // Atualizar assinatura legacy
  await supabaseAdmin
    .from('assinaturas')
    .update({
      status: 'active',
      proxima_cobranca: subscription?.nextBillingDate,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)

  // Atualizar assinatura_med
  await supabaseAdmin
    .from('assinaturas_med')
    .update({
      status: 'ativa',
      proximo_pagamento: subscription?.nextBillingDate,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)

  console.log(`[Cakto] Assinatura renovada para: ${email}`)
}

// Processar cancelamento
async function handleSubscriptionCanceled(order?: CaktoOrder) {
  if (!order?.customer?.email) return

  const email = order.customer.email

  // Buscar usuario
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile?.id) return

  // =============================================
  // DOWNGRADE PARA GRATUITO EM AMBAS TABELAS
  // =============================================

  // 1. Downgrade em profiles (legacy)
  await supabaseAdmin
    .from('profiles')
    .update({
      plano: 'FREE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  // 2. Downgrade em profiles_med
  await supabaseAdmin
    .from('profiles_med')
    .update({
      plano: 'gratuito',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  // 3. Atualizar assinatura legacy
  await supabaseAdmin
    .from('assinaturas')
    .update({
      status: 'canceled',
      cancelada_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)

  // 4. Atualizar assinatura_med
  await supabaseAdmin
    .from('assinaturas_med')
    .update({
      status: 'cancelada',
      data_fim: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)

  console.log(`[Cakto] Assinatura cancelada para: ${email}`)
}

// Processar falha de renovacao
async function handleRenewalRefused(order?: CaktoOrder) {
  if (!order?.customer?.email) return

  const email = order.customer.email

  // Buscar usuario
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile?.id) return

  // Marcar assinatura como pendente (dar tempo para regularizar)
  await supabaseAdmin
    .from('assinaturas')
    .update({
      status: 'payment_failed',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)

  await supabaseAdmin
    .from('assinaturas_med')
    .update({
      status: 'pagamento_pendente',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)

  console.log(`[Cakto] Falha na renovacao para: ${email}`)
}

// Salvar pagamento nao associado para processamento manual
async function saveUnmatchedPayment(
  order: CaktoOrder,
  subscription?: CaktoSubscription,
  plano?: PlanoUnificado
) {
  await supabaseAdmin
    .from('pagamentos_pendentes')
    .insert({
      email: order.customer?.email,
      cakto_order_id: order.id,
      cakto_subscription_id: subscription?.id,
      valor: order.amount,
      plano_detectado: plano,
      payload: JSON.stringify({ order, subscription }),
      created_at: new Date().toISOString(),
    })
}
