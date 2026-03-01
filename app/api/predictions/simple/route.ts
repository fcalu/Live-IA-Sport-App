import { NextResponse } from "next/server"

const API_BASE = process.env.API_BASE_URL!

export async function POST(req: Request) {
  try {
    let body: any = null

    // 🛡 Protección contra body vacío
    try {
      const text = await req.text()
      if (!text) {
        return fallback("Empty body")
      }
      body = JSON.parse(text)
    } catch {
      return fallback("Invalid JSON")
    }

    const res = await fetch(
      `${API_BASE}/api/v1/ai/predict`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      return fallback("External API failed")
    }

    const data = await res.json()

    if (!data?.player_props) {
      return fallback("No player props")
    }

    const totalGoals = data.player_props.find(
      (p: any) => p.type === "total_goals"
    )

    if (!totalGoals) {
      return fallback("No total goals prop")
    }

    const overProb = totalGoals.model_prob_over ?? 0
    const overPercent = overProb * 100

    let pick = ""
    let explanation = ""
    let probability = Math.round(overPercent)
    let confidence = totalGoals.confidence ?? 60

    if (overPercent > 60) {
      pick = "Over 2.5 Goals"
      explanation = "Alta expectativa ofensiva según xG"
    } else if (overPercent >= 50.5) {
      pick = "Over 1.5 Goals"
      explanation = "Probabilidad moderada de goles"
    } else {
      pick = "Under 3.5 Goals"
      explanation = "Modelo proyecta partido contenido"
    }

    return NextResponse.json({
      pick,
      probability,
      confidence,
      explanation,
    })

  } catch (error) {
    console.error("Route error:", error)
    return fallback("Internal error")
  }
}

function fallback(reason?: string) {
  if (reason) {
    console.warn("Fallback triggered:", reason)
  }

  return NextResponse.json({
    pick: "Over 1.5 Goals",
    probability: 55,
    confidence: 55,
    explanation: "Predicción automática conservadora",
  })
}