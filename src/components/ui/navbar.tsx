"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/contexts/auth-context"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith("/dashboard")

  if (isDashboard) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-black hover:opacity-80 transition-opacity">
            Liable
          </Link>

          <div className="flex gap-4">
            {!user && (
              <>
                <Button asChild className="bg-black text-white hover:bg-black/90">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild className="bg-black text-white hover:bg-black/90">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 