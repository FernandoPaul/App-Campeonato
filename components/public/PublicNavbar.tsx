import Link from "next/link"
import { Trophy } from "lucide-react"

export default function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Campeonato</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            Competiciones
          </Link>
          <Link
            href="/partidos"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            Partidos
          </Link>
          <Link
            href="/equipos"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block"
          >
            Equipos
          </Link>
          <Link
            href="/admin"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 rounded-lg px-3 py-1.5"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}
