/**
 * Native Bridge - Ponte entre o app web e features nativas do Capacitor
 *
 * Todas as chamadas nativas passam por aqui. No browser (PWA),
 * os metodos fazem fallback para APIs web ou sao no-ops.
 */

import { Capacitor } from '@capacitor/core'

// ============================================================
// STATUS BAR
// ============================================================

export async function configureStatusBar() {
  if (!Capacitor.isPluginAvailable('StatusBar')) return

  const { StatusBar, Style } = await import('@capacitor/status-bar')

  await StatusBar.setStyle({ style: Style.Light })
  await StatusBar.setBackgroundColor({ color: '#0f172a' })

  if (Capacitor.getPlatform() === 'android') {
    await StatusBar.setOverlaysWebView({ overlay: false })
  }
}

export async function hideStatusBar() {
  if (!Capacitor.isPluginAvailable('StatusBar')) return
  const { StatusBar } = await import('@capacitor/status-bar')
  await StatusBar.hide()
}

export async function showStatusBar() {
  if (!Capacitor.isPluginAvailable('StatusBar')) return
  const { StatusBar } = await import('@capacitor/status-bar')
  await StatusBar.show()
}

// ============================================================
// SPLASH SCREEN
// ============================================================

export async function hideSplashScreen() {
  if (!Capacitor.isPluginAvailable('SplashScreen')) return
  const { SplashScreen } = await import('@capacitor/splash-screen')
  await SplashScreen.hide({ fadeOutDuration: 500 })
}

// ============================================================
// HAPTICS
// ============================================================

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
  if (!Capacitor.isPluginAvailable('Haptics')) return

  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')

  const styleMap = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy,
  }

  await Haptics.impact({ style: styleMap[style] })
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  if (!Capacitor.isPluginAvailable('Haptics')) return

  const { Haptics, NotificationType } = await import('@capacitor/haptics')

  const typeMap = {
    success: NotificationType.Success,
    warning: NotificationType.Warning,
    error: NotificationType.Error,
  }

  await Haptics.notification({ type: typeMap[type] })
}

export async function hapticSelection() {
  if (!Capacitor.isPluginAvailable('Haptics')) return
  const { Haptics } = await import('@capacitor/haptics')
  await Haptics.selectionStart()
  await Haptics.selectionChanged()
  await Haptics.selectionEnd()
}

// ============================================================
// CAMERA
// ============================================================

export interface CapturedPhoto {
  dataUrl: string
  format: string
  base64?: string
}

export async function takePhoto(): Promise<CapturedPhoto | null> {
  if (!Capacitor.isPluginAvailable('Camera')) {
    // Fallback: usa input file no browser
    return takePhotoWeb()
  }

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')

  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // Pergunta: camera ou galeria
      width: 1200,
      height: 1200,
      correctOrientation: true,
    })

    return {
      dataUrl: photo.dataUrl || '',
      format: photo.format,
      base64: photo.base64String,
    }
  } catch {
    // Usuario cancelou
    return null
  }
}

export async function pickImage(): Promise<CapturedPhoto | null> {
  if (!Capacitor.isPluginAvailable('Camera')) {
    return takePhotoWeb()
  }

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')

  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      width: 1200,
      height: 1200,
    })

    return {
      dataUrl: photo.dataUrl || '',
      format: photo.format,
      base64: photo.base64String,
    }
  } catch {
    return null
  }
}

// Fallback web para camera
function takePhotoWeb(): Promise<CapturedPhoto | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'

    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        resolve({
          dataUrl: reader.result as string,
          format: file.type.split('/')[1] || 'jpeg',
        })
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    }

    input.oncancel = () => resolve(null)
    input.click()
  })
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

export async function registerPushNotifications(): Promise<string | null> {
  if (!Capacitor.isPluginAvailable('PushNotifications')) {
    // Fallback: tenta Web Push API
    return registerWebPush()
  }

  const { PushNotifications } = await import('@capacitor/push-notifications')

  const permission = await PushNotifications.requestPermissions()
  if (permission.receive !== 'granted') return null

  await PushNotifications.register()

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value)
    })

    PushNotifications.addListener('registrationError', () => {
      resolve(null)
    })
  })
}

// Web Push fallback
async function registerWebPush(): Promise<string | null> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: undefined, // VAPID key seria configurada aqui
    })
    return JSON.stringify(sub.toJSON())
  } catch {
    return null
  }
}

export async function addPushNotificationListeners(handlers: {
  onReceived?: (notification: { title?: string; body?: string; data?: Record<string, unknown> }) => void
  onActionPerformed?: (action: { actionId: string; notification: { title?: string; body?: string } }) => void
}) {
  if (!Capacitor.isPluginAvailable('PushNotifications')) return

  const { PushNotifications } = await import('@capacitor/push-notifications')

  if (handlers.onReceived) {
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      handlers.onReceived?.({
        title: notification.title,
        body: notification.body,
        data: notification.data,
      })
    })
  }

  if (handlers.onActionPerformed) {
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      handlers.onActionPerformed?.({
        actionId: action.actionId,
        notification: {
          title: action.notification.title,
          body: action.notification.body,
        },
      })
    })
  }
}

// ============================================================
// KEYBOARD
// ============================================================

export async function hideKeyboard() {
  if (!Capacitor.isPluginAvailable('Keyboard')) return
  const { Keyboard } = await import('@capacitor/keyboard')
  await Keyboard.hide()
}

export async function addKeyboardListeners(handlers: {
  onShow?: (info: { keyboardHeight: number }) => void
  onHide?: () => void
}) {
  if (!Capacitor.isPluginAvailable('Keyboard')) return

  const { Keyboard } = await import('@capacitor/keyboard')

  if (handlers.onShow) {
    Keyboard.addListener('keyboardWillShow', (info) => {
      handlers.onShow?.({ keyboardHeight: info.keyboardHeight })
    })
  }

  if (handlers.onHide) {
    Keyboard.addListener('keyboardWillHide', () => {
      handlers.onHide?.()
    })
  }
}

// ============================================================
// APP LIFECYCLE
// ============================================================

export async function addAppListeners(handlers: {
  onStateChange?: (isActive: boolean) => void
  onBackButton?: () => void
  onUrlOpen?: (url: string) => void
}) {
  if (!Capacitor.isPluginAvailable('App')) return

  const { App } = await import('@capacitor/app')

  if (handlers.onStateChange) {
    App.addListener('appStateChange', (state) => {
      handlers.onStateChange?.(state.isActive)
    })
  }

  if (handlers.onBackButton) {
    App.addListener('backButton', () => {
      handlers.onBackButton?.()
    })
  }

  if (handlers.onUrlOpen) {
    App.addListener('appUrlOpen', (data) => {
      handlers.onUrlOpen?.(data.url)
    })
  }
}

// ============================================================
// BROWSER (para links externos)
// ============================================================

export async function openExternalUrl(url: string) {
  if (!Capacitor.isPluginAvailable('Browser')) {
    window.open(url, '_blank')
    return
  }

  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url, presentationStyle: 'popover' })
}

// ============================================================
// PREFERENCES (storage persistente nativo)
// ============================================================

export async function setPreference(key: string, value: string) {
  if (!Capacitor.isPluginAvailable('Preferences')) {
    localStorage.setItem(key, value)
    return
  }

  const { Preferences } = await import('@capacitor/preferences')
  await Preferences.set({ key, value })
}

export async function getPreference(key: string): Promise<string | null> {
  if (!Capacitor.isPluginAvailable('Preferences')) {
    return localStorage.getItem(key)
  }

  const { Preferences } = await import('@capacitor/preferences')
  const result = await Preferences.get({ key })
  return result.value
}

// ============================================================
// INICIALIZACAO - Chamar no app startup
// ============================================================

export async function initializeNativeApp() {
  if (!Capacitor.isNativePlatform()) return

  // Configura status bar
  await configureStatusBar()

  // Esconde splash screen apos app carregar
  await hideSplashScreen()

  // Registra push notifications
  await registerPushNotifications()

  console.log('[Native] App nativo inicializado -', Capacitor.getPlatform())
}
