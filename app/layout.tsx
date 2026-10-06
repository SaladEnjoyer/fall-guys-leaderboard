import type { Metadata } from "next"
import { Fredoka, Nunito } from "next/font/google"
import "./globals.css"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
})

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
})

export const metadata: Metadata = {
  title: "Liga Fall Guys 1v1",
  description:
    "Marcador público de cuatro ligas. Al cargar un partido, la tabla, el ascenso y el descenso se actualizan solos.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
