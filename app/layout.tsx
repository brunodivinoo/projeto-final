// ============================================================
// RootLayout - Layout Principal com Configuracao PWA
// ============================================================
// Este arquivo configura todas as meta tags necessarias para PWA
// incluindo manifest, theme-color, icones e tags para iOS/Android
// ============================================================

import type { Metadata, Viewport } from "next"
import { Lexend } from "next/font/google"
import "./globals.css"
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration"

// ============================================================
// FONTE
// ============================================================
const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
})

// ============================================================
// VIEWPORT - Configuracoes de visualizacao
// ============================================================
export const viewport: Viewport = {
  // Cor do tema (barra de navegacao do browser no mobile)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366f1" },
    { media: "(prefers-color-scheme: dark)", color: "#4f46e5" }
  ],
  // Largura e escala inicial
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Cor da interface no iOS
  colorScheme: "light",
}

// ============================================================
// METADATA - SEO e PWA
// ============================================================
export const metadata: Metadata = {
  // === BASICO ===
  title: {
    default: "StudyHub - Plataforma de Estudos Inteligente",
    template: "%s | StudyHub"
  },
  description: "Plataforma completa de estudos com IA. Inclui PREPARA MED para estudantes de medicina e NutriVida para nutricao personalizada.",
  keywords: [
    "estudos", "medicina", "residencia medica", "nutricao", "IA",
    "inteligencia artificial", "questoes", "simulados", "PREPARA MED", "NutriVida"
  ],
  authors: [{ name: "StudyHub" }],
  creator: "StudyHub",
  publisher: "StudyHub",

  // === PWA MANIFEST ===
  manifest: "/manifest.json",

  // === ICONES ===
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // === APPLE/iOS ===
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StudyHub",
  },

  // === FORMATO DE DETECCAO ===
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // === OPEN GRAPH (compartilhamento social) ===
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "StudyHub",
    title: "StudyHub - Plataforma de Estudos Inteligente",
    description: "Estude com inteligencia artificial. PREPARA MED e NutriVida em uma unica plataforma.",
  },

  // === TWITTER ===
  twitter: {
    card: "summary_large_image",
    title: "StudyHub - Plataforma de Estudos Inteligente",
    description: "Estude com inteligencia artificial. PREPARA MED e NutriVida em uma unica plataforma.",
  },

  // === OUTROS ===
  applicationName: "StudyHub",
  category: "education",
}

// ============================================================
// LAYOUT COMPONENT
// ============================================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="light">
      <head>
        {/* === PWA META TAGS ADICIONAIS === */}
        {/* Estas tags complementam as definidas em metadata */}

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Mobile Web App Capable (legacy) */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Apple Specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StudyHub" />

        {/* Apple Touch Icons (fallback) */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />

        {/* Mask Icon para Safari */}
        <link rel="mask-icon" href="/icons/icon.svg" color="#6366f1" />

        {/* Preconnect para recursos externos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>

      <body className={`${lexend.className} antialiased bg-[#f6f7f8] text-slate-900`}>
        {/* === CONTEUDO DA PAGINA === */}
        {children}

        {/* === SERVICE WORKER REGISTRATION === */}
        {/* Componente que registra e gerencia o Service Worker */}
        {/* Inclui banner de atualizacao quando nova versao esta disponivel */}
        <ServiceWorkerRegistration
          showUpdateUI={true}
          onRegistered={(reg) => {
            console.log('[App] SW registrado, escopo:', reg.scope)
          }}
          onUpdateAvailable={() => {
            console.log('[App] Nova versao do app disponivel!')
          }}
          onError={(error) => {
            console.error('[App] Erro no SW:', error.message)
          }}
        />
      </body>
    </html>
  )
}
