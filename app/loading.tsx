import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading StreamTalk</h2>
          <p className="text-gray-300 text-center">Please wait while we prepare your experience...</p>
        </CardContent>
      </Card>
    </div>
  )
}
