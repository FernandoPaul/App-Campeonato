import Link from "next/link"
import { Trophy } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function PublicFooter() {
  const categories = await prisma.category.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
  })

  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-zinc-600" />
          <span className="text-sm text-zinc-500">Campeonato © {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6 flex-wrap justify-center">
          {categories.map((cat) => (
            <Link
              key={`f-${cat.id}`}
              href={`/${cat.slug}`}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
