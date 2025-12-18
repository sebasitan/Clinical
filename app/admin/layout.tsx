"use client"

import { usePathname } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/admin/login"

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
