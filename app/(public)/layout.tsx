import { ReactNode } from "react"
import PublicNavbar from "@/components/public/PublicNavbar"
import PublicFooter from "@/components/public/PublicFooter"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <PublicNavbar />
      <div className="flex-1">
        {children}
      </div>
      <PublicFooter />
    </div>
  )
}
