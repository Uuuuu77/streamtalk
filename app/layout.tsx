import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StreamTalk - Interactive Live Streaming",
  description: "Transform your one-way livestreams into dynamic, two-way audio conversations",
  keywords: ["streaming", "audio", "interactive", "webrtc", "live"],
  authors: [{ name: "StreamTalk Team" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    viewportFit: "cover"
  },
  openGraph: {
    title: "StreamTalk - Interactive Live Streaming",
    description: "Give every viewer a voice with real-time audio interaction",
    type: "website",
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
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
