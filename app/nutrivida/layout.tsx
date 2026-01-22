// ============================================================
// NutriVida Layout - Configuracao PWA Completa
// ============================================================
// Este arquivo configura todas as meta tags necessarias para
// o PWA funcionar corretamente no Chrome, Safari e outros navegadores.
// ============================================================

import type { Metadata, Viewport } from "next"
import Script from "next/script"

// ============================================================
// METADATA - Configuracoes gerais do app e PWA
// ============================================================
export const metadata: Metadata = {
  // Titulo e descricao
  title: {
    default: "NutriVida - Sua Nutricionista Virtual",
    template: "%s | NutriVida"
  },
  description: "App de nutrição inteligente para mulheres. Planeje refeições, treinos, receitas e alcance seus objetivos de saúde com ajuda de IA.",

  // Keywords para SEO
  keywords: [
    "nutrição",
    "saúde feminina",
    "dieta",
    "receitas saudáveis",
    "treino",
    "bem-estar",
    "emagrecimento",
    "alimentação saudável",
    "app nutrição",
    "nutricionista virtual"
  ],

  // Autores
  authors: [{ name: "NutriVida" }],
  creator: "NutriVida",
  publisher: "NutriVida",

  // Manifest PWA
  manifest: "/manifest.json",

  // Configuracao Apple Web App (iOS)
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriVida",
    startupImage: [
      {
        url: "/splash/splash-640x1136.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/splash/splash-750x1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/splash/splash-1242x2208.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        url: "/splash/splash-1125x2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        url: "/splash/splash-1536x2048.png",
        media: "(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2)"
      }
    ]
  },

  // Desabilita deteccao automatica de telefone
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  // Open Graph (compartilhamento em redes sociais)
  openGraph: {
    type: "website",
    siteName: "NutriVida",
    title: "NutriVida - Sua Nutricionista Virtual",
    description: "App de nutrição inteligente para mulheres. Planeje refeições, treinos, receitas e alcance seus objetivos de saúde com ajuda de IA.",
    locale: "pt_BR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NutriVida - Nutrição Inteligente"
      }
    ]
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "NutriVida - Sua Nutricionista Virtual",
    description: "App de nutrição inteligente para mulheres",
    images: ["/og-image.png"]
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },

  // Icones
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icons/safari-pinned-tab.svg", color: "#ec4899" },
    ]
  },

  // Outros
  category: "health",
  classification: "Health & Fitness",
}

// ============================================================
// VIEWPORT - Configuracoes de visualizacao
// ============================================================
export const viewport: Viewport = {
  // Cor do tema (barra de status do navegador)
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ec4899" },
    { media: "(prefers-color-scheme: dark)", color: "#be185d" }
  ],

  // Configuracoes de viewport
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,

  // Cor de destaque do navegador
  colorScheme: "light",
}

// ============================================================
// LAYOUT COMPONENT
// ============================================================
export default function NutriVidaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* ============================================================ */}
      {/* HEAD - Meta tags adicionais para PWA */}
      {/* ============================================================ */}

      {/* Icones Apple Touch */}
      <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />

      {/* Favicon */}
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      <link rel="shortcut icon" href="/favicon.ico" />

      {/* Microsoft Tiles */}
      <meta name="msapplication-TileColor" content="#ec4899" />
      <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* Safari Pinned Tab */}
      <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#ec4899" />

      {/* Preconnect para performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />

      {/* ============================================================ */}
      {/* CONTEUDO DA PAGINA */}
      {/* ============================================================ */}
      {children}

      {/* ============================================================ */}
      {/* SCRIPT - Registro do Service Worker */}
      {/* ============================================================ */}
      <Script
        id="register-sw"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // ============================================================
            // Registro do Service Worker
            // ============================================================
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', async () => {
                try {
                  const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                    updateViaCache: 'none'
                  });

                  console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);

                  // Verifica atualizacoes periodicamente
                  setInterval(() => {
                    registration.update();
                  }, 60 * 60 * 1000); // A cada 1 hora

                  // Listener para atualizacoes
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          // Nova versao disponivel
                          console.log('[PWA] Nova versao disponivel!');

                          // Opcional: mostrar notificacao para o usuario atualizar
                          if (window.confirm('Nova versao do NutriVida disponivel! Deseja atualizar agora?')) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                            window.location.reload();
                          }
                        }
                      });
                    }
                  });

                } catch (error) {
                  console.error('[PWA] Erro ao registrar Service Worker:', error);
                }
              });

              // Listener para quando o SW assume controle
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[PWA] Service Worker atualizado');
              });
            }

            // ============================================================
            // Detectar modo de instalacao (standalone)
            // ============================================================
            window.addEventListener('DOMContentLoaded', () => {
              if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('[PWA] App executando em modo standalone');
                document.documentElement.classList.add('pwa-standalone');
              }
            });

            // ============================================================
            // Listener para evento de instalacao
            // ============================================================
            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
              console.log('[PWA] App pode ser instalado');
              // Armazena o evento para usar depois
              deferredPrompt = e;
              // Dispara evento customizado para a UI
              window.dispatchEvent(new CustomEvent('pwa-install-available'));
            });

            // Funcao global para instalar o app
            window.installPWA = async () => {
              if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log('[PWA] Resultado da instalacao:', outcome);
                deferredPrompt = null;
              }
            };

            // ============================================================
            // Monitorar status da conexao
            // ============================================================
            window.addEventListener('online', () => {
              console.log('[PWA] Conexao restaurada');
              document.documentElement.classList.remove('offline');
              window.dispatchEvent(new CustomEvent('pwa-online'));
            });

            window.addEventListener('offline', () => {
              console.log('[PWA] Conexao perdida');
              document.documentElement.classList.add('offline');
              window.dispatchEvent(new CustomEvent('pwa-offline'));
            });
          `,
        }}
      />
    </>
  )
}
