import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "NutriVida - Saude Feminina",
  description: "App de nutricao e bem-estar feminino - Gestantes, maes e mulheres em geral",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriVida",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "NutriVida",
    title: "NutriVida - Saude Feminina",
    description: "App de nutricao e bem-estar feminino",
  },
}

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function NutriVidaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link rel="apple-touch-icon" href="/icons/nutrivida-192.svg" />
      <link rel="icon" type="image/svg+xml" href="/icons/nutrivida-192.svg" />
      {children}
    </>
  )
}
