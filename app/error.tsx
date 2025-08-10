"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <CardTitle className="text-white">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-300">
            We encountered an unexpected error. Please try refreshing the page or go back to the home page.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={reset} className="bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/"
                }
              }}
              className="border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent"
            >
              Go Home
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-400 cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-xs text-red-400 bg-slate-900/50 p-2 rounded overflow-auto">{error.message}</pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
