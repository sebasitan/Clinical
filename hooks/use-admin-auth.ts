"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentAdmin, setCurrentAdmin } from "@/lib/storage"
import type { Admin } from "@/lib/types"

export function useAdminAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const currentAdmin = getCurrentAdmin()
    setAdmin(currentAdmin)
    setIsLoading(false)

    if (!currentAdmin) {
      router.push("/admin/login")
    }
  }, [router])

  const logout = () => {
    setCurrentAdmin(null)
    setAdmin(null)
    router.push("/admin/login")
  }

  return { admin, isLoading, logout }
}
