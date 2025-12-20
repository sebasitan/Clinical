"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getAuditLogs } from "@/lib/storage"
import type { AuditLog } from "@/lib/types"
import {
    Activity,
    Search,
    Filter,
    User,
    Calendar,
    Clock,
    ShieldCheck,
    ShieldAlert,
    Trash2,
    RefreshCcw,
    UserCog,
    Stethoscope
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function AuditLogsPage() {
    const { isLoading } = useAdminAuth()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [search, setSearch] = useState("")
    const [isDataLoading, setIsDataLoading] = useState(true)

    useEffect(() => {
        setLogs(getAuditLogs())
        // Visual delay for premium feel
        const t = setTimeout(() => setIsDataLoading(false), 600)
        return () => clearTimeout(t)
    }, [])

    if (isLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Verifying Audit Trails..." />
            </div>
        )
    }

    const filteredLogs = logs.filter(log =>
        log.adminUsername.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.details.toLowerCase().includes(search.toLowerCase())
    ).reverse()

    const getActionIcon = (action: string) => {
        if (action.includes("Add")) return <ShieldCheck className="w-4 h-4 text-emerald-500" />
        if (action.includes("Delete")) return <Trash2 className="w-4 h-4 text-rose-500" />
        if (action.includes("Update")) return <RefreshCcw className="w-4 h-4 text-blue-500" />
        if (action.includes("Login")) return <User className="w-4 h-4 text-slate-500" />
        return <Activity className="w-4 h-4 text-slate-500" />
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-8 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Security Audit
                            <span className="text-slate-200 font-light">/</span>
                            <span className="text-slate-400 font-medium text-lg">Activity Logs</span>
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-8 py-10 space-y-8">
                {/* Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search actions, admins or details..."
                            className="h-12 pl-12 rounded-2xl bg-slate-50 border-none font-medium focus:ring-blue-100"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-12 rounded-2xl border-slate-200 gap-2 font-bold px-6">
                            <Filter className="w-4 h-4" />
                            Filters
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setLogs(getAuditLogs())}
                            className="h-12 w-12 rounded-2xl border border-slate-100 text-slate-400 hover:text-slate-900"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Logs Table */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <CardContent className="p-0">
                        {filteredLogs.length === 0 ? (
                            <div className="py-32 text-center">
                                <ShieldAlert className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No activity records found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {filteredLogs.map((log) => (
                                    <div key={log.id} className="p-8 flex flex-col md:flex-row md:items-center gap-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-4 min-w-[200px]">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="bg-slate-50 border-none text-[10px] font-black uppercase text-slate-500 px-1.5 py-0">
                                                        {log.adminUsername}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                                {log.details}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-500/60 uppercase tracking-widest">
                                                <Clock className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
