"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowRight, LinkIcon, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function JoinPage() {
  const [sessionId, setSessionId] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleJoinSession = async () => {
    if (!sessionId.trim()) {
      setError("Please enter a valid session ID or link")
      return
    }

    try {
      setIsJoining(true)
      setError("")
      setSuccess("")

      // Extract session ID from full URL if provided
      const extractedId = sessionId.includes("/join/") ? sessionId.split("/join/")[1] : sessionId.trim()

      // Validate session ID format
      if (extractedId.length < 5) {
        throw new Error("Invalid session ID format")
      }

      setSuccess("Joining session...")

      // Simulate joining delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Safe navigation
      if (mounted && typeof window !== "undefined") {
        window.location.href = `/viewer/${extractedId}`
      }
    } catch (err) {
      console.error("Failed to join session:", err)
      setError(err instanceof Error ? err.message : "Failed to join session. Please try again.")
      setIsJoining(false)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      if (!mounted || typeof navigator === "undefined" || !navigator.clipboard) {
        setError("Clipboard not supported. Please paste the link manually.")
        return
      }

      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        setSessionId(text.trim())
        setError("")
        setSuccess("Link pasted successfully!")
        setTimeout(() => setSuccess(""), 2000)
      } else {
        setError("Clipboard is empty")
      }
    } catch (err) {
      setError("Clipboard access denied. Please paste the link manually.")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSessionId(e.target.value)
    setError("")
    setSuccess("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isJoining) {
      handleJoinSession()
    }
  }

  if (!mounted) {
    return <LoadingPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Join <span className="text-purple-400">StreamTalk</span>
          </h1>
          <p className="text-gray-300">Enter a session ID or paste the link shared by the streamer</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Join Audio Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Session ID or Link</label>
              <div className="flex gap-2">
                <Input
                  value={sessionId}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="stream-abc123 or full link"
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-gray-500"
                  disabled={isJoining}
                />
                <Button
                  onClick={handlePasteFromClipboard}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-gray-400 hover:bg-slate-700 bg-transparent"
                  disabled={isJoining}
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <Button
              onClick={handleJoinSession}
              disabled={isJoining || !sessionId.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining Session...
                </>
              ) : (
                <>
                  Join Queue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <StepsSection />
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Don't have a session link?{" "}
            <Link href="/" className="text-purple-400 hover:text-purple-300 underline">
              Create your own stream
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <h2 className="text-xl font-semibold text-white mb-2">Loading</h2>
        <p className="text-gray-300">Please wait...</p>
      </div>
    </div>
  )
}

function StepsSection() {
  return (
    <div className="pt-4 border-t border-slate-700">
      <h4 className="text-white text-sm font-medium mb-3">What to expect:</h4>
      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
            1
          </Badge>
          Join the audio queue
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
            2
          </Badge>
          Wait for your turn to speak
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
            3
          </Badge>
          Get selected and share your voice
        </div>
      </div>
    </div>
  )
}
