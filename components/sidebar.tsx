"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, Library, TrendingUp, Coins, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Create Coin", href: "/create", icon: PlusCircle },
  { name: "My Coins", href: "/my-coins", icon: Library },
  { name: "Trending", href: "/trending", icon: TrendingUp },
  { name: "Creators", href: "/creators", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar hidden md:block">
      <div className="flex h-full flex-col gap-6 p-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Coins className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">Creator Coin</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="rounded-lg bg-sidebar-accent p-4">
          <h3 className="mb-2 text-sm font-semibold text-sidebar-accent-foreground">Create Your First Coin</h3>
          <p className="mb-3 text-xs text-sidebar-accent-foreground/70">
            Tokenize your content and build your creator economy
          </p>
          <Link
            href="/create"
            className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </div>
    </aside>
  )
}
