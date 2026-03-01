import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Image from "next/image"
import { signOut } from "next-auth/react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-10 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">

        <h1 className="text-xl font-bold text-emerald-400">
          SportIA
        </h1>

        <div className="flex items-center gap-4">

          <span className="text-sm text-slate-300">
            {session.user?.name}
          </span>

          {session.user?.image && (
            <Image
              src={session.user.image}
              alt="User"
              width={35}
              height={35}
              className="rounded-full"
            />
          )}

        </div>
      </nav>

      {/* CONTENIDO */}
      <main className="p-10">
        {children}
      </main>

    </div>
  )
}