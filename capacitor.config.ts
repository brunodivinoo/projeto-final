import type { CapacitorConfig } from '@capacitor/cli'
import { KeyboardResize } from '@capacitor/keyboard'

const config: CapacitorConfig = {
  appId: 'com.preparamed.app',
  appName: 'PREPARAMED',
  webDir: 'out',

  // ============================================================
  // SERVER - Aponta para o backend Vercel em producao
  // Em dev, usa localhost (comentar server para usar build local)
  // ============================================================
  server: {
    url: 'https://projeto-final-zeta-navy.vercel.app',
    cleartext: false,
    // Permite navegacao dentro do dominio do app
    allowNavigation: [
      'projeto-final-zeta-navy.vercel.app',
      'preparamed-navy.vercel.app',
      'zkcstkbpgwdoiihvfspp.supabase.co',
      '*.google.com',
      '*.googleapis.com',
    ],
  },

  // ============================================================
  // PLUGINS NATIVOS
  // ============================================================
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#6366f1',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#6366f1',
    },
  },

  // ============================================================
  // iOS - Configuracoes especificas
  // ============================================================
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    preferredContentMode: 'mobile',
    scheme: 'preparamed',
    scrollEnabled: true,
  },

  // ============================================================
  // ANDROID - Configuracoes especificas
  // ============================================================
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    useLegacyBridge: false,
  },
}

export default config
