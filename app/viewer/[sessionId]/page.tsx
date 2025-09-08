"use client"

import { useState, useEffect } from "react"
import ViewerInterface from "@/components/ViewerInterface"

interface ViewerPageProps {
  params: Promise<{
    sessionId: string
  }>
}

export default function ViewerPage({ params }: ViewerPageProps) {
  const [sessionId, setSessionId] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // Load session ID from params
  useEffect(() => {
    params.then(p => {
      setSessionId(p.sessionId)
      setMounted(true)
    })
  }, [params])

  // Don't render until we have the session ID
  if (!mounted || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Viewer</h2>
          <p className="text-gray-300">Please wait...</p>
        </div>
      </div>
    )
  }

  return <ViewerInterface sessionId={sessionId} />
}
