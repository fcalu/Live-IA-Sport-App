"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Image from "next/image"

const ELITE_LEAGUES = [
  "ENG.1", "ESP.1", "GER.1", "ITA.1", "FRA.1", "POR.1",
  "UEFA.CHAMPIONS", "UEFA.EUROPA", "UEFA.CONFERENCE",
  "MEX.1", "USA.1", "BRA.1", "CONMEBOL.LIBERTADORES"
]

const CACHE_TTL = 1000 * 60 * 60

export default function SoccerMatchCard({ match, isPremium, index }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [espnData, setEspnData] = useState<any>(null)
  const [liveInfo, setLiveInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef(null)

  const eventId = String(match?.event_id ?? "")
  const homeTeam = match?.home || ""
  const awayTeam = match?.away || ""
  const leagueRaw = String(match?.league ?? "")
  const leagueCode = useMemo(() => leagueRaw.split("/").pop()?.toUpperCase() ?? "", [leagueRaw])
  const isElite = useMemo(() => ELITE_LEAGUES.includes(leagueCode), [leagueCode])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { 
        if (entry.isIntersecting && (!isPremium || index < 55)) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [index, isPremium])

  const matchTime = useMemo(() => {
    if (!match?.start_time) return "HORA PENDIENTE";
    return new Date(match.start_time).toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
    });
  }, [match?.start_time]);

  useEffect(() => {
    if (!isVisible) return;
    async function fetchLiveStatus() {
      try {
        const espnLeague = leagueCode.toLowerCase();
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/scoreboard`);
        const result = await res.json();
        const espnMatch = result.events?.find((e: any) => 
          e.name.toLowerCase().includes(homeTeam.toLowerCase()) || e.name.toLowerCase().includes(awayTeam.toLowerCase())
        );
        if (espnMatch) {
          const homeComp = espnMatch.competitions[0].competitors.find((c:any) => c.homeAway === "home");
          const awayComp = espnMatch.competitions[0].competitors.find((c:any) => c.homeAway === "away");
          setLiveInfo({
            status: espnMatch.status.type.detail,
            isLive: espnMatch.status.type.state === "in",
            homeScore: homeComp.score,
            awayScore: awayComp.score,
            homeLogo: homeComp.team.logo,
            awayLogo: awayComp.team.logo
          });
        }
      } catch (e) { console.warn("Live status no disponible"); }
    }
    fetchLiveStatus();
    const interval = setInterval(fetchLiveStatus, 60000);
    return () => clearInterval(interval);
  }, [leagueCode, homeTeam, awayTeam, isVisible]);

  useEffect(() => {
    if (!eventId || !homeTeam || !awayTeam || !isVisible) return
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(isPremium ? "/api/premium" : "/api/predictions/simple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sport: "soccer", league: leagueRaw, event_id: eventId, home_team: homeTeam, away_team: awayTeam
          }),
        })
        const result = await res.json()
        setData(result)
      } catch (err) { console.error(err) } finally { setLoading(false) }
    }
    loadData()
  }, [eventId, isPremium, isElite, leagueRaw, homeTeam, awayTeam, isVisible])

  useEffect(() => {
    if (!isPremium || !leagueCode || !isVisible) return;
    async function fetchESPN() {
      try {
        const leagueMap: any = { "ENG.1": "eng.1", "ESP.1": "esp.1", "GER.1": "ger.1", "ITA.1": "ita.1", "POR.1": "por.1", "MEX.1": "mex.1" };
        const espnLeague = leagueMap[leagueCode] || "eng.1";
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${espnLeague}/standings`);
        const result = await res.json();
        setEspnData(result.children?.[0]?.standings?.entries || []);
      } catch (e) { console.warn("ESPN Data no disponible"); }
    }
    fetchESPN();
  }, [isPremium, leagueCode, isVisible]);

  // --- LÓGICA DE PREDICCIÓN CORREGIDA (NO MÁS VACÍOS) ---
  const aiLogic = useMemo(() => {
    const fallback = { label: "ANALIZANDO", color: "text-slate-500", xg: "0.00", confidence: 55, risk: "ALTO", riskColor: "text-red-500", riskBg: "bg-red-500", dc: "1X/X2", pulseSpeed: "animate-pulse" }
    if (!data || !data.player_props) return fallback;

    const props = data.player_props
    const goals = props.find((p: any) => p.type === "total_goals")
    const btts = props.find((p: any) => p.type === "btts")
    const hML = props.find((p: any) => p.type === "moneyline_home")
    const aML = props.find((p: any) => p.type === "moneyline_away")
    const dML = props.find((p: any) => p.type === "moneyline_draw")

    const totalXG = goals?.projection_model?.total_xg ?? 0
    const probOver = goals?.model_prob_over ?? 0
    const probBTTS = btts?.model_prob_yes ?? 0
    const probHome = hML?.model_prob ?? 0
    const probAway = aML?.model_prob ?? 0
    const probDraw = dML?.model_prob ?? 0
    const confidence = goals?.confidence ?? data.confidence ?? 62

    const dc = probHome >= probAway ? "1X" : "X2";
    
    // AQUÍ ESTÁ EL CAMBIO: Siempre definimos un label base
    let label = "MENOS DE 3.5 GOLES"; 
    let color = "text-yellow-500";

    // Si confianza es baja, FORZAMOS la predicción mejorada con la Doble Oportunidad
    if (confidence < 60) {
      label = `${dc} & +1.5 GOLES`; 
      color = "text-cyan-400";
    } else {
      // Si confianza es alta, buscamos picks más específicos
      if (probHome >= 0.65 || probAway >= 0.65) {
        label = `${probHome >= 0.65 ? homeTeam.substring(0,8) : awayTeam.substring(0,8)} GANA`; 
        color = "text-emerald-400";
      } else if (probDraw >= 0.60) {
        label = "TENDENCIA EMPATE"; 
        color = "text-slate-400";
      } else if (probBTTS >= 0.62) {
        label = "AMBOS ANOTAN"; 
        color = "text-cyan-400";
      } else if (totalXG >= 2.5) {
        label = "MÁS DE 2.5 GOLES"; 
        color = "text-emerald-400";
      }
    }

    let risk = confidence > 90 ? "ÚNICA" : confidence > 75 ? "BAJO" : confidence >= 60 ? "MEDIO" : "ALTO";
    let rColor = confidence > 90 ? "text-fuchsia-400" : confidence > 75 ? "text-emerald-400" : confidence >= 60 ? "text-yellow-500" : "text-red-500";
    let rBg = confidence > 90 ? "bg-fuchsia-500" : confidence > 75 ? "bg-emerald-500" : confidence >= 60 ? "bg-yellow-500" : "bg-red-500";
    let pSpeed = risk === "ALTO" ? "animate-[pulse_0.8s_infinite]" : "animate-pulse";

    return { label, color, xg: totalXG.toFixed(2), confidence, risk, riskColor: rColor, riskBg: rBg, dc, pulseSpeed: pSpeed }
  }, [data, homeTeam, awayTeam])

  const teamStats = useMemo(() => {
    if (!espnData) return null;
    const home = espnData.find((e: any) => homeTeam.toLowerCase().includes(e.team.displayName.toLowerCase()) || e.team.displayName.toLowerCase().includes(homeTeam.toLowerCase()));
    const away = espnData.find((e: any) => awayTeam.toLowerCase().includes(e.team.displayName.toLowerCase()) || e.team.displayName.toLowerCase().includes(awayTeam.toLowerCase()));
    return { homeRank: home?.stats?.find((s: any) => s.name === "rank")?.value || "?", awayRank: away?.stats?.find((s: any) => s.name === "rank")?.value || "?" };
  }, [espnData, homeTeam, awayTeam]);

  return (
    <div ref={cardRef} className="bg-[#0f172a]/95 border border-slate-800 rounded-[2.5rem] overflow-hidden backdrop-blur-xl relative shadow-2xl transition-all hover:border-cyan-500/40">
      
      {liveInfo?.isLive && (
        <div className="absolute top-5 right-8 flex items-center gap-2 bg-red-600/20 px-3 py-1 rounded-full border border-red-500/50 animate-pulse z-40">
           <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
           <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Live {liveInfo.status}</span>
        </div>
      )}

      {loading && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-30 flex items-center justify-center"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>}

      <div className="px-8 pt-6 flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-4">
            <span className="text-slate-500">{leagueCode}</span>
            <span className={`flex items-center gap-1.5 ${aiLogic.riskColor} bg-black/20 px-2 py-1 rounded-full border border-white/5`}>
                <span className={`w-1.5 h-1.5 rounded-full ${aiLogic.riskBg} ${aiLogic.pulseSpeed} shadow-[0_0_8px_currentColor]`} />
                Riesgo {aiLogic.risk}
            </span>
        </div>
        {isElite && <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 tracking-tighter">Elite Verified</span>}
      </div>

      <div className="p-8 flex items-center justify-between gap-4">
        <TeamUnit name={homeTeam} logo={match.home_logo || liveInfo?.homeLogo} rank={teamStats?.homeRank} score={liveInfo?.homeScore} />
        <span className="text-2xl font-black text-slate-800 italic uppercase">{liveInfo?.isLive ? "-" : "VS"}</span>
        <TeamUnit name={awayTeam} logo={match.away_logo || liveInfo?.awayLogo} rank={teamStats?.awayRank} score={liveInfo?.awayScore} />
      </div>

      <div className="px-6 pb-4 space-y-4">
        <div className="grid grid-cols-3 bg-slate-900/50 rounded-2xl p-4 border border-slate-800/50 text-center divide-x divide-slate-800">
          <StatBox label="Predicción IA" value={aiLogic.label} color={aiLogic.color} />
          <StatBox label="Doble Op." value={aiLogic.dc} color="text-white" />
          <StatBox label="IA Conf" value={`${aiLogic.confidence}%`} color="text-cyan-400" />
        </div>

        {isPremium && (
          <div className="space-y-3">
            {teamStats && (
              <div className="flex justify-between items-center px-6 py-2 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-center">
                    <p className="text-[7px] text-slate-500 uppercase font-black">Pos. Local</p>
                    <p className="text-xs font-bold text-white">#{teamStats.homeRank}</p>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <p className="text-[9px] font-bold text-slate-500 italic uppercase">{liveInfo?.isLive ? "Live Momentum" : "Contexto de Liga"}</p>
                  <div className="h-6 w-px bg-slate-800" />
                  <div className="text-center">
                    <p className="text-[7px] text-slate-500 uppercase font-black">Pos. Visita</p>
                    <p className="text-xs font-bold text-white">#{teamStats.awayRank}</p>
                  </div>
              </div>
            )}
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 text-center">
               <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">IA Intelligence Feed</p>
               <p className="text-[10px] text-slate-400 italic leading-tight">
                  {aiLogic.confidence < 60 
                    ? `Confianza moderada. La mejor cobertura hoy es ${aiLogic.dc} con filtro de goles.` 
                    : `Basado en el xG proyectado de ${aiLogic.xg}, el mercado de ${aiLogic.label} tiene el mayor valor.`}
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TeamUnit({ name, logo, rank, score }: any) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="w-16 h-16 relative bg-white/5 rounded-2xl p-2 border border-white/10 shadow-xl group">
        {logo ? (
          <img src={logo} alt={name} className="w-full h-full object-contain p-1" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-700 font-black text-2xl uppercase">{name[0]}</div>
        )}
        {rank && rank !== "?" && <div className="absolute -top-2 -right-2 bg-cyan-500 text-black text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0f172a]">{rank}</div>}
        {score !== undefined && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-black text-[11px] font-black px-2 py-0.5 rounded-md shadow-xl ring-2 ring-[#0f172a]">{score}</div>}
      </div>
      <span className="font-black text-[10px] uppercase italic text-center line-clamp-1">{name}</span>
    </div>
  )
}

function StatBox({ label, value, color }: any) {
  return (
    <div className="px-1 flex flex-col justify-center min-h-[42px]">
      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 tracking-tighter">{label}</p>
      <p className={`text-[9px] md:text-[10px] font-black ${color} leading-none uppercase`}>{value}</p>
    </div>
  )
}