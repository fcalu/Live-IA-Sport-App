import { NextResponse } from "next/server"

const API_BASE = process.env.API_BASE_URL!

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const sport = searchParams.get("sport") ?? "soccer"
    const days = searchParams.get("days") ?? "3"

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      `${API_BASE}/api/v1/matches/upcoming?sport=${sport}&days=${days}`,
      {
        cache: "no-store",
        signal: controller.signal,
      }
    )

    clearTimeout(timeout)

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
    console.error("Route error:", error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}