"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
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
    this.setState({ errorInfo })

    // Report to error tracking service
    if (typeof window !== "undefined") {
      // You can integrate with services like Sentry here
      console.error("Error details:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  handleRefresh = () => {
    if (typeof window !== "undefined") {
      window.location.reload()
    }
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
              <CardTitle className="text-white">Oops! Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-300">
                We encountered an unexpected error. This has been logged and we'll look into it.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button onClick={this.handleReset} className="bg-purple-600 hover:bg-purple-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700 bg-transparent"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 text-xs text-red-400 bg-slate-900/50 p-3 rounded overflow-auto max-h-40">
                    <div className="font-semibold mb-2">Error: {this.state.error.message}</div>
                    <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    {this.state.errorInfo && (
                      <>
                        <div className="font-semibold mt-2 mb-1">Component Stack:</div>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
