"use client"

import Link from "next/link"
import { Button } from "./button"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-xl font-bold text-black hover:text-gray-700 transition-colors"
        >
          Liable
        </Link>
        
        <div className="flex gap-4">
          <Button variant="ghost" asChild className="text-black">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="text-black">
            <Link href="/signup">Sign up</Link>
          </Button>
         
        </div>
      </div>
    </nav>
  )
} 