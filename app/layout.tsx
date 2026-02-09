// ============================================================
// RootLayout - Layout Principal com Configuracao PWA
// ============================================================
// Este arquivo configura todas as meta tags necessarias para PWA
// incluindo manifest, theme-color, icones e tags para iOS/Android
// ============================================================

import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration"

// ============================================================
// FONTE - Inter via next/font (auto-hosted, sem CLS)
// ============================================================
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
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
    default: "PREPARAMED - Plataforma de Estudos para Medicina",
    template: "%s | PREPARAMED"
  },
  description: "Plataforma completa de estudos com IA para estudantes de medicina preparando-se para residência médica. Questões, simulados, flashcards e tutor IA.",
  keywords: [
    "medicina", "residencia medica", "estudos medicina", "IA medica",
    "inteligencia artificial", "questoes medicina", "simulados medicina", "PREPARAMED", "flashcards medicina"
  ],
  authors: [{ name: "PREPARAMED" }],
  creator: "PREPARAMED",
  publisher: "PREPARAMED",

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
    title: "PREPARAMED",
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
    siteName: "PREPARAMED",
    title: "PREPARAMED - Plataforma de Estudos para Medicina",
    description: "Estude medicina com inteligência artificial. Questões, simulados, flashcards e tutor IA para residência médica.",
  },

  // === TWITTER ===
  twitter: {
    card: "summary_large_image",
    title: "PREPARAMED - Plataforma de Estudos para Medicina",
    description: "Estude medicina com inteligência artificial. Questões, simulados, flashcards e tutor IA para residência médica.",
  },

  // === OUTROS ===
  applicationName: "PREPARAMED",
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
    <html lang="pt-BR" className={`light ${inter.variable}`}>
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
        <meta name="apple-mobile-web-app-title" content="PREPARAMED" />

        {/* Apple Touch Icons (fallback) */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />

        {/* Mask Icon para Safari */}
        <link rel="mask-icon" href="/icons/icon.svg" color="#6366f1" />

        {/* DNS Prefetch para Supabase */}
        <link rel="dns-prefetch" href="https://zkcstkbpgwdoiihvfspp.supabase.co" />
      </head>

      <body className={`${inter.className} antialiased bg-[#f8fafc] text-slate-900`}>
        {/* === CONTEUDO DA PAGINA === */}
        {children}

        {/* === SERVICE WORKER REGISTRATION === */}
        {/* Componente que registra e gerencia o Service Worker */}
        {/* Inclui banner de atualizacao quando nova versao esta disponivel */}
        <ServiceWorkerRegistration showUpdateUI={true} />
      </body>
    </html>
  )
}
