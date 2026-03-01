"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function NBAMatchCard({ match, isPremium }: any) {
  const [full, setFull] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (full) return

    const cacheKey = `premium_nba_${match.event_id}`
    const cached = localStorage.getItem(cacheKey)

    if (cached) {
      const { timestamp, data } = JSON.parse(cached)
      if (Date.now() - timestamp < 1000 * 60 * 60) {
        setFull(data)
      }
    }
  }, [match.event_id, full])

  async function loadAnalysis() {
    setLoading(true)

    try {
      const res = await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport: "basketball",
          league: "nba",
          event_id: match.event_id,
          home_team: match.home,
          away_team: match.away,
        }),
      })

      if (!res.ok) throw new Error("API error")

      const data = await res.json()

      localStorage.setItem(
        `premium_nba_${match.event_id}`,
        JSON.stringify({
          timestamp: Date.now(),
          data,
        })
      )

      setFull(data)
    } catch (err) {
      console.error("NBA fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const getEdgeColor = (edge: number) => {
    if (edge >= 0.08) return "text-emerald-400 font-black"
    if (edge >= 0.04) return "text-cyan-400 font-bold"
    return "text-slate-500"
  }

  const sortedProps =
    full?.player_props
      ?.filter((p: any) => p.bet_decision !== "PASS")
      ?.sort((a: any, b: any) => b.edge_over - a.edge_over)
      ?.slice(0, 6) || []

  const overUnder = full?.odds?.over_under || "230.5"

  const homeLogo =
    full?.home_logo ||
    full?.teams?.home?.logo ||
    match.home_logo

  const awayLogo =
    full?.away_logo ||
    full?.teams?.away?.logo ||
    match.away_logo

  return (
    <div className="bg-[#0f172a]/80 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl backdrop-blur-md hover:border-orange-500/30 transition-all duration-500">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <span className="text-orange-500 font-black text-[10px] tracking-[0.2em] uppercase">
          NBA BASKETBALL
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-500 font-bold uppercase italic">
            Live Odds Data
          </span>
          <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
        </div>
      </div>

      {/* TEAMS */}
      <div className="flex justify-between items-center gap-4 mb-8">
        <TeamUnit name={match.home} logo={homeLogo} />

        <div className="flex flex-col items-center">
          <span className="text-slate-800 font-black italic text-2xl">
            VS
          </span>
          <span className="text-[10px] text-slate-600 font-bold">
            {overUnder} O/U
          </span>
        </div>

        <TeamUnit name={match.away} logo={awayLogo} />
      </div>

      {!full ? (
        <button
          onClick={loadAnalysis}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg active:scale-95"
        >
          {loading ? "Calculando Algoritmos..." : "🔥 Ver Análisis Premium"}
        </button>
      ) : (
        <div className="space-y-6">

          {isPremium ? (
            <>
              {/* PLAYER PROPS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    🎯 Top Value Props
                  </p>
                  <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-black">
                    WSPM ENGINE v2.0
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black/20">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-800/80 text-slate-500 uppercase font-black">
                      <tr>
                        <th className="px-4 py-3">Jugador</th>
                        <th className="px-4 py-3 text-center">Línea</th>
                        <th className="px-4 py-3 text-center">Edge</th>
                        <th className="px-4 py-3 text-right">Pick</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-800">
                      {sortedProps.map((prop: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 relative rounded-full bg-slate-800 overflow-hidden">
                                <Image
                                  src={prop.player_image}
                                  alt={prop.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-bold text-slate-200">
                                  {prop.name}
                                </div>
                                <div className="text-[8px] text-slate-500 uppercase">
                                  {prop.type}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center font-mono">
                            {prop.line}
                          </td>

                          <td className={`px-4 py-3 text-center ${getEdgeColor(prop.edge_over)}`}>
                            +{(prop.edge_over * 100).toFixed(1)}%
                          </td>

                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-1 text-[8px] rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black">
                              {prop.bet_decision}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STRATEGY */}
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500 rounded-r-xl">
                <p className="text-[9px] font-black text-orange-500 uppercase mb-1">
                  Estrategia Recomendada
                </p>
                <p className="text-[10px] italic text-slate-300">
                  "{full.tipster_decisions?.[0]?.play}"
                </p>
              </div>
            </>
          ) : (
            <div className="p-6 bg-yellow-500/5 border border-dashed border-yellow-500/20 rounded-2xl text-center">
              <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em]">
                🔒 Premium Requerido
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TeamUnit({ name, logo }: any) {
  return (
    <div className="flex flex-col items-center flex-1">
      <div className="w-16 h-16 relative mb-3 bg-white/5 rounded-2xl p-2 border border-white/10">
        {logo && (
          <Image
            src={logo}
            alt={name}
            fill
            className="object-contain"
          />
        )}
      </div>
      <p className="font-black text-[11px] uppercase text-center">
        {name}
      </p>
    </div>
  )
}