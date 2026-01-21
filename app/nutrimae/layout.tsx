import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "NutriMae - Sua Jornada Fitness",
  description: "App de nutricao e saude para maes - Controle de alimentacao, agua, treinos e suplementos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriMae",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "NutriMae",
    title: "NutriMae - Sua Jornada Fitness",
    description: "App de nutricao e saude para maes",
  },
}

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function NutrimaeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link rel="apple-touch-icon" href="/icons/nutrimae-192.svg" />
      <link rel="icon" type="image/svg+xml" href="/icons/nutrimae-192.svg" />
      {children}
    </>
  )
}
