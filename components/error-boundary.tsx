"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
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
              <p className="text-gray-300">We encountered an unexpected error. Please try refreshing the page.</p>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false })
                    if (typeof window !== "undefined") {
                      window.location.reload()
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
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
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
