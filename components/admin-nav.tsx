"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
    LayoutDashboard,
    ClipboardList,
    Clock,
    Users,
    UserSearch,
    FilePieChart,
    ActivitySquare,
    Settings,
    LogOut,
    Shield,
    Menu,
    X,
    UserCog,
    ChevronLeft,
    ChevronRight,
    Stethoscope,
    MapPin,
    Megaphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getDoctorsAsync } from "@/lib/storage"
import type { Doctor } from "@/lib/types"

export function AdminNav() {
    const pathname = usePathname()
    const { logout, admin } = useAdminAuth()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [doctors, setDoctors] = useState<Doctor[]>([])

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileOpen(false)
    }, [pathname])

    useEffect(() => {
        const load = async () => {
            const docs = await getDoctorsAsync()
            setDoctors(docs.filter(d => d.isActive))
        }
        load()
    }, [])

    const navItems = [
        { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
        {
            href: "/admin/schedule",
            label: "Schedule",
            icon: ClipboardList,
            subItems: doctors.map(d => ({
                href: `/admin/doctors/${d.id}`,
                label: d.name.split(' ').slice(0, 2).join(' '),
                icon: Stethoscope
            }))
        },
        { href: "/admin/arrivals", label: "Patient Arrivals", icon: MapPin },
        { href: "/admin/doctors", label: "Doctors", icon: Users },
        { href: "/admin/receptionists", label: "Receptionists", icon: UserCog },
        { href: "/admin/patients", label: "Patient Registry", icon: UserSearch },
        { href: "/admin/care", label: "Clinical Follow-ups", icon: ActivitySquare },
        { href: "/admin/reminders", label: "Reminders", icon: Clock },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
        { href: "/admin/reports", label: "Reports", icon: FilePieChart },
        { href: "/admin/audit", label: "Audit Logs", icon: ActivitySquare },
        { href: "/admin/settings", label: "Settings", icon: Settings },
    ]

    return (
        <>
            {/* Mobile Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-[60]">
                <Button
                    variant="outline"
                    size="icon"
                    className="bg-white rounded-xl shadow-md border-slate-100"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                    {isMobileOpen ? <X /> : <Menu />}
                </Button>
            </div>

            {/* Backdrop for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[50] lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-[55] bg-white border-r border-slate-100 transition-all duration-300 lg:sticky lg:inset-auto",
                isCollapsed ? "w-24" : "w-72",
                isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="h-full flex flex-col p-6">
                    {/* Header/Logo */}

                    <div className={cn("flex items-center gap-3 mb-10 transition-all duration-300", isCollapsed && "justify-center px-0")}>
                        <div className="w-12 h-12 relative shrink-0">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in duration-500">
                                <span className="font-sans font-black text-sm tracking-tighter text-slate-900 uppercase italic leading-none">Klinik Pergigian</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mt-1 leading-none">Setapak (Sri Rampai) Admin</span>
                            </div>
                        )}
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 space-y-1 overflow-y-auto pr-2 -mr-2 scrollbar-hide">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || (item.subItems?.some(s => pathname === s.href))
                            return (
                                <div key={item.href} className="space-y-1">
                                    <Link href={item.href}>
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full h-12 rounded-2xl relative group transition-all duration-200",
                                                isCollapsed ? "px-0 justify-center" : "px-4 justify-start gap-4",
                                                isActive
                                                    ? "bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            )}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            <Icon className={cn(
                                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                                isActive ? "text-blue-400" : "text-slate-400"
                                            )} />
                                            {!isCollapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}

                                            {isActive && !isCollapsed && (
                                                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            )}
                                        </Button>
                                    </Link>

                                    {/* Render Sub-items for Schedule if not collapsed */}
                                    {!isCollapsed && item.subItems && isActive && (
                                        <div className="pl-12 space-y-1 animate-in slide-in-from-top-2 duration-300">
                                            {item.subItems.map((sub) => {
                                                const SubIcon = sub.icon
                                                const isSubActive = pathname === sub.href
                                                return (
                                                    <Link key={sub.href} href={sub.href}>
                                                        <Button
                                                            variant="ghost"
                                                            className={cn(
                                                                "w-full h-10 rounded-xl px-3 justify-start gap-3 transition-all", // Increased height to h-10
                                                                isSubActive
                                                                    ? "bg-blue-100 text-blue-800 font-bold shadow-sm" // Darker text, stronger background
                                                                    : "text-slate-500 font-medium hover:bg-blue-50 hover:text-blue-600" // Darker base text, blue hover
                                                            )}
                                                        >
                                                            <SubIcon className={cn("w-4 h-4", isSubActive ? "text-blue-700" : "text-slate-400 group-hover:text-blue-500")} />
                                                            <span className="text-xs truncate">{sub.label}</span> {/* Increased from text-[11px] to text-xs (12px) */}
                                                        </Button>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </nav>

                    {/* Spacer */}
                    <div className="h-px bg-slate-100 my-6" />

                    {/* Footer / User Profile */}
                    <div className="space-y-4">
                        {admin && !isCollapsed && (
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Avatar className="w-10 h-10 rounded-xl shadow-sm border-2 border-white">
                                    <AvatarFallback className="bg-white text-slate-900 font-bold text-xs">
                                        {admin.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-slate-900 truncate">{admin.username}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{admin.role}</span>
                                </div>
                            </div>
                        )}

                        <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col" : "justify-between")}>
                            <Button
                                variant="ghost"
                                onClick={logout}
                                className={cn(
                                    "h-12 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all group",
                                    isCollapsed ? "w-12 px-0 justify-center" : "w-full justify-start gap-4 px-4"
                                )}
                                title={isCollapsed ? "Log Out" : undefined}
                            >
                                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                {!isCollapsed && <span className="font-bold text-sm tracking-tight text-rose-600">Log Out</span>}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="hidden lg:flex h-12 w-12 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                            >
                                {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
