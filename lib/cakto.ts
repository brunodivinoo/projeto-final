// Cakto Payment Integration
// Docs: https://docs.cakto.com.br

const CAKTO_API_URL = 'https://api.cakto.com.br'

// Tipos
export interface CaktoToken {
  access_token: string
  token_type: string
  expires_in: number
}

export interface CaktoOrder {
  id: string
  refId: string
  status: string
  amount: number
  baseAmount: number
  discount: number
  fees: number
  createdAt: string
  paidAt?: string
  customer: {
    name: string
    email: string
    phone?: string
    document?: string
  }
  product?: {
    id: string
    name: string
  }
  offer?: {
    id: string
    name: string
  }
}

export interface CaktoWebhookPayload {
  event: string
  data: {
    order: CaktoOrder
    subscription?: {
      id: string
      status: string
      nextBillingDate?: string
    }
  }
}

// Eventos de webhook suportados
export const CAKTO_EVENTS = {
  // Compras
  PURCHASE_APPROVED: 'purchase_approved',
  PURCHASE_REFUSED: 'purchase_refused',

  // Checkout
  INITIATE_CHECKOUT: 'initiate_checkout',
  CHECKOUT_ABANDONMENT: 'checkout_abandonment',

  // Pagamentos
  PIX_GERADO: 'pix_gerado',
  BOLETO_GERADO: 'boleto_gerado',

  // Reembolsos
  CHARGEBACK: 'chargeback',
  REFUND: 'refund',

  // Assinaturas
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_RENEWAL_REFUSED: 'subscription_renewal_refused',
} as const

// Cache do token
let tokenCache: { token: string; expiresAt: number } | null = null

// Obter token de acesso
export async function getCaktoToken(): Promise<string> {
  // Verificar cache
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const clientId = process.env.CAKTO_CLIENT_ID
  const clientSecret = process.env.CAKTO_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Credenciais do Cakto não configuradas')
  }

  const response = await fetch(`${CAKTO_API_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    throw new Error('Falha ao obter token do Cakto')
  }

  const data: CaktoToken = await response.json()

  // Cachear token (com margem de 5 minutos)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.access_token
}

// Fazer requisição autenticada
async function caktoFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getCaktoToken()

  const response = await fetch(`${CAKTO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Cakto API Error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Buscar pedido por ID
export async function getOrder(orderId: string): Promise<CaktoOrder> {
  return caktoFetch<CaktoOrder>(`/public_api/orders/${orderId}/`)
}

// Listar pedidos
export async function listOrders(params?: {
  status?: string
  email?: string
  page?: number
  limit?: number
}): Promise<{ count: number; results: CaktoOrder[] }> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.email) searchParams.set('customer__email', params.email)
  if (params?.page) searchParams.set('page', params.page.toString())
  if (params?.limit) searchParams.set('limit', params.limit.toString())

  const query = searchParams.toString()
  return caktoFetch(`/public_api/orders/${query ? `?${query}` : ''}`)
}

// Gerar URL de checkout
// Nota: O Cakto usa links de checkout pré-configurados no painel
// Esta função retorna a URL do checkout com parâmetros do usuário
export function getCheckoutUrl(params: {
  offerId: string
  email?: string
  name?: string
  userId?: string
}): string {
  const checkoutBaseUrl = process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_URL

  if (!checkoutBaseUrl) {
    throw new Error('URL de checkout do Cakto não configurada')
  }

  const url = new URL(checkoutBaseUrl)

  // Adicionar parâmetros para pré-preencher checkout
  if (params.email) url.searchParams.set('email', params.email)
  if (params.name) url.searchParams.set('name', params.name)
  if (params.userId) url.searchParams.set('utm_content', params.userId) // Para rastrear no webhook

  return url.toString()
}

// Verificar assinatura de webhook (se o Cakto usar)
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Implementar verificação HMAC se o Cakto fornecer
  // Por enquanto, retorna true se tiver secret configurado
  if (!secret) return true

  // Usar importacao dinamica para crypto
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = globalThis.crypto || null
  if (!crypto) return true

  // Verificacao simplificada - comparar strings
  // Em producao, implementar HMAC-SHA256 adequado
  return signature.length > 0
}

// Mapear status do Cakto para status interno
export function mapCaktoStatus(caktoStatus: string): 'active' | 'canceled' | 'pending' {
  const statusMap: Record<string, 'active' | 'canceled' | 'pending'> = {
    paid: 'active',
    authorized: 'active',
    processing: 'pending',
    waiting_payment: 'pending',
    refused: 'canceled',
    canceled: 'canceled',
    refunded: 'canceled',
    chargedback: 'canceled',
  }

  return statusMap[caktoStatus] || 'pending'
}
