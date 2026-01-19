'use client'

// =============================================
// DEVICE FINGERPRINT
// =============================================
// Sistema para identificar dispositivos e evitar
// abuso do trial com múltiplas contas
// =============================================

const FINGERPRINT_KEY = 'preparamed_device_fp'
const MAX_TRIALS_POR_DISPOSITIVO = 1 // Máximo de trials por dispositivo

// Gerar fingerprint único do dispositivo
export async function generateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return ''

  const components: string[] = []

  // 1. User Agent
  components.push(navigator.userAgent || 'unknown')

  // 2. Linguagem
  components.push(navigator.language || 'unknown')

  // 3. Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown')

  // 4. Resolução de tela
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`)

  // 5. Plataforma
  components.push(navigator.platform || 'unknown')

  // 6. Número de núcleos de CPU
  components.push(String(navigator.hardwareConcurrency || 0))

  // 7. Memória do dispositivo (aproximada)
  const nav = navigator as Navigator & { deviceMemory?: number }
  components.push(String(nav.deviceMemory || 0))

  // 8. Canvas fingerprint
  const canvasFingerprint = getCanvasFingerprint()
  components.push(canvasFingerprint)

  // 9. WebGL fingerprint
  const webglFingerprint = getWebGLFingerprint()
  components.push(webglFingerprint)

  // 10. Fontes instaladas (simplificado)
  const fontsFingerprint = getFontsFingerprint()
  components.push(fontsFingerprint)

  // Combinar e criar hash
  const combined = components.join('|||')
  const hash = await sha256(combined)

  return hash
}

// Canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'

    canvas.width = 200
    canvas.height = 50

    // Texto com diferentes estilos
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('PreparaMed FP', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Device Check', 4, 17)

    // Retornar hash do canvas
    return canvas.toDataURL().substring(0, 100)
  } catch {
    return 'canvas-error'
  }
}

// WebGL fingerprint
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null

    if (!gl) return 'no-webgl'

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      return `${vendor}|${renderer}`
    }

    return 'webgl-no-debug'
  } catch {
    return 'webgl-error'
  }
}

// Fontes fingerprint (simplificado)
function getFontsFingerprint(): string {
  const baseFonts = ['monospace', 'sans-serif', 'serif']
  const testFonts = [
    'Arial', 'Courier New', 'Georgia', 'Times New Roman',
    'Verdana', 'Helvetica', 'Comic Sans MS', 'Impact'
  ]

  const testString = 'mmmmmmmmmmlli'
  const testSize = '72px'
  const detected: string[] = []

  const span = document.createElement('span')
  span.style.position = 'absolute'
  span.style.left = '-9999px'
  span.style.fontSize = testSize
  span.innerHTML = testString
  document.body.appendChild(span)

  const baseWidths: Record<string, number> = {}
  baseFonts.forEach(baseFont => {
    span.style.fontFamily = baseFont
    baseWidths[baseFont] = span.offsetWidth
  })

  testFonts.forEach(testFont => {
    for (const baseFont of baseFonts) {
      span.style.fontFamily = `'${testFont}', ${baseFont}`
      if (span.offsetWidth !== baseWidths[baseFont]) {
        detected.push(testFont)
        break
      }
    }
  })

  document.body.removeChild(span)
  return detected.join(',')
}

// SHA256 hash
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Obter ou gerar fingerprint (com cache local)
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return ''

  // Verificar cache
  let fp = localStorage.getItem(FINGERPRINT_KEY)
  if (fp) return fp

  // Gerar novo
  fp = await generateFingerprint()
  localStorage.setItem(FINGERPRINT_KEY, fp)

  return fp
}

// Tipo para o supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any

// Verificar se dispositivo pode usar trial
export async function verificarDispositivoPodeTrial(
  supabase: SupabaseClient,
  userId: string
): Promise<{ permitido: boolean; motivo?: string }> {
  try {
    const fingerprint = await getDeviceFingerprint()

    if (!fingerprint) {
      return { permitido: true } // Em caso de erro, permitir
    }

    // Buscar registro do dispositivo
    const { data: device, error } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao verificar dispositivo:', error)
      return { permitido: true } // Em caso de erro, permitir
    }

    // Dispositivo novo - permitir
    if (!device) {
      // Registrar dispositivo
      await supabase
        .from('device_fingerprints')
        .insert({
          fingerprint,
          user_ids: [userId],
          trials_usados: 0,
          primeiro_uso: new Date().toISOString(),
          ultimo_uso: new Date().toISOString()
        })

      return { permitido: true }
    }

    // Verificar se dispositivo está bloqueado
    if (device.bloqueado) {
      return {
        permitido: false,
        motivo: device.motivo_bloqueio || 'Dispositivo bloqueado por uso suspeito.'
      }
    }

    // Verificar se já usou trial demais
    if (device.trials_usados >= MAX_TRIALS_POR_DISPOSITIVO) {
      // Verificar se este usuário específico já está registrado
      if (!device.user_ids.includes(userId)) {
        return {
          permitido: false,
          motivo: 'Este dispositivo já utilizou o período de teste com outra conta.'
        }
      }
    }

    return { permitido: true }
  } catch (error) {
    console.error('Erro no sistema de fingerprint:', error)
    return { permitido: true } // Em caso de erro, não bloquear
  }
}

// Registrar uso de trial
export async function registrarUsoTrial(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  try {
    const fingerprint = await getDeviceFingerprint()
    if (!fingerprint) return

    // Atualizar registro do dispositivo
    const { data: device } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single()

    if (device) {
      const userIds = device.user_ids || []
      if (!userIds.includes(userId)) {
        userIds.push(userId)
      }

      await supabase
        .from('device_fingerprints')
        .update({
          user_ids: userIds,
          trials_usados: device.trials_usados + 1,
          ultimo_uso: new Date().toISOString()
        })
        .eq('fingerprint', fingerprint)
    } else {
      // Criar registro
      await supabase
        .from('device_fingerprints')
        .insert({
          fingerprint,
          user_ids: [userId],
          trials_usados: 1,
          primeiro_uso: new Date().toISOString(),
          ultimo_uso: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Erro ao registrar uso de trial:', error)
  }
}
