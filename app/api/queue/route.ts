import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { sessionId, viewerId, viewerName } = await request.json()

    // Check if session exists and is active
    const [session] = await sql`
      SELECT * FROM sessions WHERE id = ${sessionId} AND status = 'active'
    `

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found or inactive" }, { status: 404 })
    }

    // Check if viewer is already in queue
    const [existingEntry] = await sql`
      SELECT * FROM queue_entries 
      WHERE session_id = ${sessionId} AND viewer_id = ${viewerId} AND status = 'waiting'
    `

    if (existingEntry) {
      return NextResponse.json({ success: false, error: "Already in queue" }, { status: 400 })
    }

    // Get current queue position
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM queue_entries 
      WHERE session_id = ${sessionId} AND status = 'waiting'
    `

    const position = Number.parseInt(count) + 1

    // Add to queue
    const [queueEntry] = await sql`
      INSERT INTO queue_entries (session_id, viewer_id, viewer_name, position, status, joined_at)
      VALUES (${sessionId}, ${viewerId}, ${viewerName}, ${position}, 'waiting', NOW())
      RETURNING *
    `

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

    const queueEntries = await sql`
      SELECT * FROM queue_entries 
      WHERE session_id = ${sessionId} AND status = 'waiting'
      ORDER BY position ASC
    `

    return NextResponse.json({
      success: true,
      queue: queueEntries,
    })
  } catch (error) {
    console.error("Queue fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch queue" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId, viewerId } = await request.json()

    await sql`
      UPDATE queue_entries 
      SET status = 'left', left_at = NOW()
      WHERE session_id = ${sessionId} AND viewer_id = ${viewerId} AND status = 'waiting'
    `

    // Reorder remaining queue positions
    await sql`
      UPDATE queue_entries 
      SET position = position - 1
      WHERE session_id = ${sessionId} AND status = 'waiting' AND position > (
        SELECT position FROM queue_entries 
        WHERE session_id = ${sessionId} AND viewer_id = ${viewerId} AND status = 'left'
        LIMIT 1
      )
    `

    return NextResponse.json({
      success: true,
      message: "Left queue successfully",
    })
  } catch (error) {
    console.error("Queue leave error:", error)
    return NextResponse.json({ success: false, error: "Failed to leave queue" }, { status: 500 })
  }
}
