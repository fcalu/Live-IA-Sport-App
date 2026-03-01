"use client"

import { signIn } from "next-auth/react"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f172a] to-[#020617] flex items-center justify-center">
      
      <div className="w-full max-w-md bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/SportIA-Logo.jpg"
            alt="SportIA"
            width={70}
            height={70}
            className="rounded-xl mb-3"
          />
          <h1 className="text-2xl font-bold text-white">SportIA</h1>
          <p className="text-slate-400 text-sm">
            Plataforma de análisis deportivo con IA
          </p>
        </div>

        {/* Botón Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 text-white py-3 rounded-xl font-medium shadow-lg"
        >
          Iniciar sesión con Google
        </button>

        <p className="text-xs text-slate-500 text-center mt-6">
          Al iniciar sesión aceptas nuestros términos y condiciones.
        </p>

      </div>
    </div>
  )
}