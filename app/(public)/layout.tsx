import { ReactNode } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Trophy } from "lucide-react"

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const categories = await prisma.category.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-blue-400 transition-colors">
              Sports<span className="text-blue-500">Hub</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="px-4 py-2 rounded-full text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all"
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            <Link href="/admin/login" className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} SportsHub. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
