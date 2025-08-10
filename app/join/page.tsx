"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, ArrowRight, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function JoinPage() {
  const [sessionId, setSessionId] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleJoinSession = async () => {
    if (!sessionId.trim()) {
      toast({
        title: "Session ID required",
        description: "Please enter a valid session ID or link",
        variant: "destructive",
      })
      return
    }

    try {
      setIsJoining(true)

      // Extract session ID from full URL if provided
      const extractedId = sessionId.includes("/join/") ? sessionId.split("/join/")[1] : sessionId

      // Simulate joining delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Use Next.js router for navigation
      router.push(`/viewer/${extractedId}`)
    } catch (error) {
      console.error("Failed to join session:", error)
      toast({
        title: "Failed to join",
        description: "There was an error joining the session. Please try again.",
        variant: "destructive",
      })
      setIsJoining(false)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText()
        setSessionId(text)
        toast({
          title: "Pasted from clipboard",
          description: "Session link has been pasted",
        })
      } else {
        toast({
          title: "Clipboard not supported",
          description: "Please paste the link manually",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Clipboard access denied",
        description: "Please paste the link manually",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
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
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="stream-abc123 or full link"
                  className="bg-slate-900 border-slate-600 text-white"
                  onKeyPress={(e) => e.key === "Enter" && handleJoinSession()}
                />
                <Button
                  onClick={handlePasteFromClipboard}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-gray-400 hover:bg-slate-700 bg-transparent"
                >
                  <LinkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleJoinSession}
              disabled={isJoining || !sessionId.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
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
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            Don't have a session link?{" "}
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              Create your own stream
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
