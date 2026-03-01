import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b1220] text-white">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-10 py-6">
        <div className="flex items-center gap-3">
          <Image src="/SportIA-Logo.jpg" alt="Sportia" width={40} height={40} />
          <span className="text-xl font-semibold">Sportia</span>
        </div>

        <Link
          href="/login"
          className="bg-[#22d3ee] text-black px-5 py-2 rounded-lg font-medium hover:bg-[#06b6d4] transition"
        >
          Iniciar Sesión
        </Link>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center justify-center text-center px-6 mt-20">

        <Image
          src="/SportIA-Logo.jpg"
          alt="Sportia Logo"
          width={140}
          height={140}
          className="mb-8"
        />

        <h1 className="text-5xl font-bold max-w-3xl leading-tight">
          Encuentra el <span className="text-[#22d3ee]">Edge</span> con Inteligencia Artificial
        </h1>

        <p className="text-slate-400 mt-6 max-w-2xl">
          Plataforma avanzada de análisis deportivo impulsada por modelos de IA
          para detectar oportunidades con ventaja estadística real.
        </p>

        <div className="mt-10 flex gap-6">
          <Link
            href="/login"
            className="bg-[#22d3ee] text-black px-8 py-3 rounded-xl font-semibold hover:bg-[#06b6d4] transition"
          >
            Ver Información
          </Link>

          <a
            href="#features"
            className="border border-slate-600 px-8 py-3 rounded-xl hover:border-[#22d3ee] transition"
          >
            Conocer Más
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mt-32 px-10 pb-20">
        <div className="grid md:grid-cols-3 gap-10">

          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-semibold mb-4 text-[#22d3ee]">
              Modelos Predictivos
            </h3>
            <p className="text-slate-400">
              Análisis probabilístico avanzado basado en datos históricos,
              eficiencia ofensiva y tendencias recientes.
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-semibold mb-4 text-[#6366f1]">
              Detección de Edge
            </h3>
            <p className="text-slate-400">
              Identificamos discrepancias entre probabilidades reales
              y líneas de mercado.
            </p>
          </div>

          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
            <h3 className="text-xl font-semibold mb-4 text-[#10b981]">
              Análisis por Jugador
            </h3>
            <p className="text-slate-400">
              Props individuales con probabilidad modelada y
              evaluación automática de valor esperado.
            </p>
          </div>

        </div>
      </section>

    </main>
  )
}