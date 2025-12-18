"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getAuditLogs } from "@/lib/storage"
import { formatDate } from "@/lib/date-utils"
import type { AuditLog } from "@/lib/types"
import { Search, Shield, Clock, User } from "lucide-react"

export default function AuditLogsPage() {
    const { isLoading } = useAdminAuth()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setLogs(getAuditLogs())
    }

    const filteredLogs = logs.filter(log =>
        log.adminUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getActionColor = (action: string) => {
        if (action.includes("Login")) return "text-blue-600 bg-blue-50"
        if (action.includes("Delete")) return "text-rose-600 bg-rose-50"
        if (action.includes("Create") || action.includes("Add")) return "text-emerald-600 bg-emerald-50"
        return "text-slate-600 bg-slate-100"
    }

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Security Audit</h1>
                        <p className="text-slate-500 mt-1">Immutable record of administrative actions and system events.</p>
                    </div>
                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                        <Input
                            placeholder="Filter logs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm font-medium"
                        />
                    </div>
                </div>

                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {filteredLogs.length === 0 ? (
                            <div className="py-24 text-center opacity-40">
                                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                                <p className="text-xl font-bold text-slate-900">No activity logged.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-50">
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Timestamp</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Administrator</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Action</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Event Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map(log => (
                                        <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <TableCell className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-900">{log.adminUsername}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-5">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-8 py-5 text-sm text-slate-600 font-medium">
                                                {log.details}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
