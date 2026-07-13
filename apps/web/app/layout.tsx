import { Inter, Noto_Sans_Thai, Outfit, Anuphan } from "next/font/google"
import { Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/components/cart-provider"
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

const fontOutfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

const fontAnuphan = Anuphan({
  subsets: ["thai"],
  variable: "--font-anuphan",
  weight: ["300", "400", "500", "600", "700"],
})

import { SessionProvider } from "next-auth/react";
import { cookies } from "next/headers";
import { SyncToken } from "@/components/sync-token";
import { auth } from "../auth";
import { ToastContainer } from "@/components/toast";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies();
  const session = await auth();
  const token =
    cookieStore.get("mg_web_session")?.value ||
    cookieStore.get("__Secure-mg_web_session")?.value;

  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable,
        fontThai.variable,
        fontOutfit.variable,
        fontAnuphan.variable
      )}
    >
      <body>
        <SyncToken token={token} />
        <ToastContainer />
        <SessionProvider session={session}>
          <ThemeProvider defaultTheme="light" enableSystem={false}>
            <CartProvider>
              {children}
            </CartProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}