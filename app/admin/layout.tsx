"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"
import { initializeDemoData } from "@/lib/storage"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/admin/login" || pathname === "/admin/login/"

    useEffect(() => {
        initializeDemoData()
    }, [])

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <AdminNav />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    )
}
