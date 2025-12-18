import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CAKTO_EVENTS, verifyWebhookSignature } from '@/lib/cakto'

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
  amount: number
  customer: CaktoCustomer
  utm_content?: string
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

    const data = JSON.parse(payload)
    const event = data.event
    const order = data.data?.order as CaktoOrder | undefined
    const subscription = data.data?.subscription as CaktoSubscription | undefined

    console.log(`[Cakto Webhook] Evento recebido: ${event}`)

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

  console.log(`[Cakto] Compra aprovada para: ${email}`)

  // Buscar usuario pelo email ou userId
  let profileId = userId

  if (!profileId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    profileId = profile?.id
  }

  if (!profileId) {
    console.error(`[Cakto] Usuario nao encontrado: ${email}`)
    // Salvar para processamento posterior
    await saveUnmatchedPayment(order, subscription)
    return
  }

  // Atualizar plano do usuario para PRO
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      plano: 'ESTUDA_PRO',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (updateError) {
    console.error('[Cakto] Erro ao atualizar plano:', updateError)
    return
  }

  // Registrar assinatura
  const { error: subError } = await supabaseAdmin
    .from('assinaturas')
    .upsert({
      user_id: profileId,
      plano: 'ESTUDA_PRO',
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

  if (subError) {
    console.error('[Cakto] Erro ao registrar assinatura:', subError)
  }

  console.log(`[Cakto] Usuario ${profileId} atualizado para ESTUDA_PRO`)
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

  // Atualizar assinatura
  await supabaseAdmin
    .from('assinaturas')
    .update({
      status: 'active',
      proxima_cobranca: subscription?.nextBillingDate,
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

  // Downgrade para FREE
  await supabaseAdmin
    .from('profiles')
    .update({
      plano: 'FREE',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  // Atualizar assinatura
  await supabaseAdmin
    .from('assinaturas')
    .update({
      status: 'canceled',
      cancelada_em: new Date().toISOString(),
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

  console.log(`[Cakto] Falha na renovacao para: ${email}`)
}

// Salvar pagamento nao associado para processamento manual
async function saveUnmatchedPayment(order: CaktoOrder, subscription?: CaktoSubscription) {
  await supabaseAdmin
    .from('pagamentos_pendentes')
    .insert({
      email: order.customer?.email,
      cakto_order_id: order.id,
      cakto_subscription_id: subscription?.id,
      valor: order.amount,
      payload: JSON.stringify({ order, subscription }),
      created_at: new Date().toISOString(),
    })
}
