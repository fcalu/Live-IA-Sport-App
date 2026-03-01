"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import SoccerMatchCard from "./SoccerMatchCard"
import NBAMatchCard from "./NBAMatchCard"

const CACHE_TTL = 1000 * 60 * 15

const getCache = (key: string) => {
  if (typeof window === "undefined") return null
  const cached = localStorage.getItem(key)
  if (!cached) return null
  const parsed = JSON.parse(cached)
  return Date.now() - parsed.timestamp < CACHE_TTL ? parsed.data : null
}

const setCache = (key: string, data: any) => {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }))
}

export default function DashboardPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState<"soccer" | "nba">("soccer")
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    async function fetchMatches() {
      setLoading(true)
      try {
        const cacheKey = `dashboard_${sport}`
        const cached = getCache(cacheKey)

        if (cached) {
          setMatches(cached)
          setLoading(false)
          return
        }

        const res = await fetch(`/api/matches?sport=${sport}&days=1`)
        if (!res.ok) throw new Error("API error")
        let data = await res.json()
        
        data.sort((a: any, b: any) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )

        setCache(cacheKey, data)
        setMatches(data)
      } catch (error) {
        console.error(error)
        toast.error("Error cargando partidos")
      } finally {
        setLoading(false)
      }
    }
    fetchMatches()
  }, [sport])

  // --- FILTRO PROFESIONAL ---
  const filteredMatches = matches.filter((m: any) => {
    const league = (m.league || "").toUpperCase()
    return !league.includes("BRA.1") && !league.includes("ENG.2")
  })

  const visibleMatches = isPremium ? filteredMatches : filteredMatches.slice(0, 4)

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-4 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              📊 Próximos Partidos
            </h2>
            <p className="text-slate-400 mt-1 font-medium italic">Análisis predictivo con Inteligencia Artificial</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800 backdrop-blur-sm">
              <button onClick={() => setSport("soccer")} className={`px-6 py-2 rounded-lg transition-all font-bold text-sm ${sport === "soccer" ? "bg-cyan-500 text-white" : "text-slate-400"}`}>
                ⚽ Fútbol
              </button>
              <button onClick={() => setSport("nba")} className={`px-6 py-2 rounded-lg transition-all font-bold text-sm ${sport === "nba" ? "bg-orange-500 text-white" : "text-slate-400"}`}>
                🏀 NBA
              </button>
            </div>
            <button onClick={() => setIsPremium(!isPremium)} className={`px-6 py-3 rounded-xl font-black text-sm transition-all transform hover:scale-105 ${isPremium ? "bg-emerald-500 text-white" : "bg-gradient-to-r from-yellow-400 to-orange-500 text-black"}`}>
              {isPremium ? "✓ PREMIUM ACTIVO" : "⭐ ACTIVAR PREMIUM"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-64 bg-slate-900/50 animate-pulse rounded-3xl border border-slate-800" />)
          ) : (
            visibleMatches.map((m) => sport === "soccer" ? <SoccerMatchCard key={m.event_id} match={m} isPremium={isPremium} /> : <NBAMatchCard key={m.event_id} match={m} isPremium={isPremium} />)
          )}
        </div>
      </div>
    </div>
  )
}