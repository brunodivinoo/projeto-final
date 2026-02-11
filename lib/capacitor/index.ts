export {
  // Status Bar
  configureStatusBar,
  hideStatusBar,
  showStatusBar,
  // Splash Screen
  hideSplashScreen,
  // Haptics
  hapticImpact,
  hapticNotification,
  hapticSelection,
  // Camera
  takePhoto,
  pickImage,
  // Push Notifications
  registerPushNotifications,
  addPushNotificationListeners,
  // Keyboard
  hideKeyboard,
  addKeyboardListeners,
  // App Lifecycle
  addAppListeners,
  // Browser
  openExternalUrl,
  // Preferences
  setPreference,
  getPreference,
  // Init
  initializeNativeApp,
} from './native-bridge'

export type { CapturedPhoto } from './native-bridge'
