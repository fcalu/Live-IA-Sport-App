"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function AdvancedStatsPage() {
  const { sport, league, eventId } = useParams() as {
    sport: string
    league: string
    eventId: string
  }

  const [loading, setLoading] = useState(true)
  const [premium, setPremium] = useState<any>(null)

  useEffect(() => {
    async function loadPremium() {
      try {
        const res = await fetch("/api/premium", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sport,
            league: `soccer/${league}`,
            event_id: eventId,
            home_team: "TBD",
            away_team: "TBD",
          }),
        })

        if (!res.ok) throw new Error("Premium API error")

        const data = await res.json()
        setPremium(data)

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadPremium()
  }, [sport, league, eventId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 p-10">
        Cargando análisis premium...
      </div>
    )
  }

  if (!premium) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-10">
        No se pudo cargar el análisis.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10 space-y-8">

      <h1 className="text-3xl font-bold text-cyan-400">
        🧠 Análisis Premium
      </h1>

      <div className="bg-slate-900 p-6 rounded-2xl border border-indigo-500/40">
        <p className="text-lg font-semibold mb-2">
          {premium.match}
        </p>
        <p className="text-slate-400">
          Liga: {premium.league}
        </p>
      </div>

      {premium.player_props?.map((prop: any, i: number) => (
        <div
          key={i}
          className="bg-slate-900 p-6 rounded-2xl border border-slate-700"
        >
          <h3 className="text-cyan-400 font-semibold mb-3">
            {prop.name}
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">

            {prop.model_prob && (
              <div>
                <p className="text-slate-400">Prob Modelo</p>
                <p className="text-lg font-bold">
                  {(prop.model_prob * 100).toFixed(1)}%
                </p>
              </div>
            )}

            {prop.edge_over !== undefined && (
              <div>
                <p className="text-slate-400">Edge</p>
                <p className={`text-lg font-bold ${
                  prop.edge_over > 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}>
                  {(prop.edge_over * 100).toFixed(1)}%
                </p>
              </div>
            )}

            <div>
              <p className="text-slate-400">Decisión</p>
              <p className="font-bold text-yellow-400">
                {prop.bet_decision}
              </p>
            </div>

          </div>
        </div>
      ))}

      <div className="bg-slate-900 p-6 rounded-2xl border border-indigo-500/30">
        <h3 className="text-indigo-400 font-bold mb-3">
          📝 Análisis IA
        </h3>

        <p className="text-slate-300 whitespace-pre-line leading-relaxed">
          {premium.analysis}
        </p>
      </div>

    </div>
  )
}