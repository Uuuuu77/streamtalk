import { type NextRequest, NextResponse } from "next/server"

// Simple in-memory storage for demo
const queueEntries = new Map()
const sessionQueues = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, viewerId, viewerName } = body

    if (!sessionId || !viewerId || !viewerName) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get or create queue for session
    const queue = sessionQueues.get(sessionId) || []

    // Check if viewer is already in queue
    const existingEntry = queue.find((entry: any) => entry.viewerId === viewerId)
    if (existingEntry) {
      return NextResponse.json({ success: false, error: "Already in queue" }, { status: 400 })
    }

    const position = queue.length + 1
    const queueEntry = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      viewerId,
      viewerName,
      position,
      status: "waiting",
      joinedAt: new Date().toISOString(),
    }

    queue.push(queueEntry)
    sessionQueues.set(sessionId, queue)
    queueEntries.set(queueEntry.id, queueEntry)

    return NextResponse.json({
      success: true,
      queueEntry: {
        id: queueEntry.id,
        position: queueEntry.position,
        estimatedWait: `~${position * 2} minutes`,
      },
    })
  } catch (error) {
    console.error("Queue join error:", error)
    return NextResponse.json({ success: false, error: "Failed to join queue" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    const queue = sessionQueues.get(sessionId) || []

    return NextResponse.json({
      success: true,
      queue: queue.filter((entry: any) => entry.status === "waiting"),
    })
  } catch (error) {
    console.error("Queue fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch queue" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, viewerId } = body

    if (!sessionId || !viewerId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    let queue = sessionQueues.get(sessionId) || []
    queue = queue.filter((entry: any) => entry.viewerId !== viewerId)

    // Reorder positions
    queue.forEach((entry: any, index: number) => {
      entry.position = index + 1
    })

    sessionQueues.set(sessionId, queue)

    return NextResponse.json({
      success: true,
      message: "Left queue successfully",
    })
  } catch (error) {
    console.error("Queue leave error:", error)
    return NextResponse.json({ success: false, error: "Failed to leave queue" }, { status: 500 })
  }
}
