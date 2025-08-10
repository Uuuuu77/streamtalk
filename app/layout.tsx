import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StreamTalk - Interactive Live Streaming",
  description: "Transform your one-way livestreams into dynamic, two-way audio conversations",
  keywords: ["streaming", "audio", "interactive", "webrtc", "live"],
  authors: [{ name: "StreamTalk Team" }],
  openGraph: {
    title: "StreamTalk - Interactive Live Streaming",
    description: "Give every viewer a voice with real-time audio interaction",
    type: "website",
    images: ["/og-image.png"],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
