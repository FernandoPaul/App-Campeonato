import { ReactNode } from "react"
import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { Trophy, Users, Calendar, LayoutDashboard, LogOut, UserRound } from "lucide-react"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Trophy className="w-6 h-6 text-blue-500 mr-2" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
          <Link
            href="/admin/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 mr-3 text-zinc-400" />
            Dashboard
          </Link>
          <Link
            href="/admin/categorias"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Trophy className="w-5 h-5 mr-3 text-zinc-400" />
            Categorías
          </Link>
          <Link
            href="/admin/equipos"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Users className="w-5 h-5 mr-3 text-zinc-400" />
            Equipos
          </Link>
          <Link
            href="/admin/jugadores"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <UserRound className="w-5 h-5 mr-3 text-zinc-400" />
            Jugadores
          </Link>
          <Link
            href="/admin/partidos"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Calendar className="w-5 h-5 mr-3 text-zinc-400" />
            Partidos
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              {session?.user?.name?.[0] || "A"}
            </div>
            <div className="ml-3 truncate text-sm">
              <p className="font-medium text-white">{session?.user?.name}</p>
              <p className="text-zinc-500 text-xs">{session?.user?.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut()
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:bg-red-950/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
          <h1 className="font-semibold text-lg">App Campeonato</h1>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  )
}