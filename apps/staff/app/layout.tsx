import { Inter, Noto_Sans_Thai } from "next/font/google"
import { Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/toast-provider"
import { cn } from "@workspace/ui/lib/utils";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", fontSans.variable, fontThai.variable)}
    >
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}