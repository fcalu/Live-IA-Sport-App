import { NextResponse } from "next/server"

const API_BASE = process.env.API_BASE_URL!

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { sport, league, event_id, home_team, away_team } = body

    if (!sport || !league || !event_id || !home_team || !away_team) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 422 }
      )
    }

    const res = await fetch(
      `${API_BASE}/api/v1/ai/predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json"
        },
        body: JSON.stringify({
          sport,
          league,
          event_id,
          home_team,
          away_team
        }),
      }
    )

    if (!res.ok) {
      const text = await res.text()
      console.error("External API error:", text)

      return NextResponse.json(
        { error: "External API failed" },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error("Internal error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}