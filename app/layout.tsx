import type { Metadata } from "next"
import { Lexend } from "next/font/google"
import "./globals.css"

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
})

export const metadata: Metadata = {
  title: "StudyHub - Plataforma de Estudos",
  description: "Gerencie seus estudos com inteligência artificial",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={`${lexend.variable} font-sans antialiased bg-[#101922] text-white`}>
        {children}
      </body>
    </html>
  )
}
