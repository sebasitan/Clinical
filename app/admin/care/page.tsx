"use client"

import { useState, useEffect } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { Activity, Calendar, Clock, Edit3, Mail, MessageCircle, Send, UserCheck, UserSearch } from "lucide-react"
import { formatDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import type { Patient } from "@/lib/types"
import { RefreshCw } from "lucide-react"

export default function FollowUpsPage() {
    const { isLoading } = useAdminAuth()
    const [patients, setPatients] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [editingFollowUp, setEditingFollowUp] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDataLoading, setIsDataLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const res = await fetch('/api/patients')
            if (res.ok) {
                const data = await res.json()
                // Only show patients with active continued treatment
                setPatients(data.filter((p: Patient) => p.continuedTreatment?.active))
            }
        } catch (e) {
            console.error("Failed to load patients", e)
        } finally {
            setIsDataLoading(false)
        }
    }

    const handleUpdateFollowUp = async () => {
        if (!editingFollowUp) return
        setIsSaving(true)
        try {
            const res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingFollowUp)
            })
            if (res.ok) {
                await loadData()
                setEditingFollowUp(null)
            }
        } catch (e) {
            console.error("Failed to update follow-up", e)
        } finally {
            setIsSaving(false)
        }
    }

    const filteredPatients = patients.filter((p: Patient) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery)
    ).sort((a: Patient, b: Patient) => {
        const dateA = a.continuedTreatment?.nextFollowUpDate ? new Date(a.continuedTreatment.nextFollowUpDate).getTime() : Infinity
        const dateB = b.continuedTreatment?.nextFollowUpDate ? new Date(b.continuedTreatment.nextFollowUpDate).getTime() : Infinity
        return dateA - dateB
    })

    if (isLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Loading Treatment Plans..." />
            </div>
        )
    }

    return (
        <div className="flex-1 bg-slate-50/50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Clinical Follow-ups</h1>
                        </div>
                        <p className="text-slate-500">Managing patients with scheduled clinical follow-up visits.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={loadData}
                            variant="outline"
                            className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-white hover:border-blue-200 transition-all p-0"
                        >
                            <RefreshCw className="w-5 h-5 text-slate-400" />
                        </Button>
                        <div className="relative group max-w-sm w-full">
                            <UserSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                            <Input
                                placeholder="Find treatment patient..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                className="h-12 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm transition-all focus:ring-4 focus:ring-blue-100 font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: "Scheduled Follow-ups", value: patients.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                        {
                            label: "Due This Week", value: patients.filter((p: Patient) => {
                                const date = new Date(p.continuedTreatment?.nextFollowUpDate || "")
                                const now = new Date()
                                const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                                return date >= now && date <= week
                            }).length, icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50"
                        },
                        { label: "Overdue Care", value: patients.filter((p: Patient) => new Date(p.continuedTreatment?.nextFollowUpDate || "") < new Date()).length, icon: Clock, color: "text-rose-600", bg: "bg-rose-50" },
                        { label: "Automation Active", value: "Enabled", icon: Send, color: "text-amber-600", bg: "bg-amber-50" },
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-sm shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                            <CardContent className="p-8 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
                                </div>
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {filteredPatients.length === 0 ? (
                            <div className="py-24 text-center opacity-40">
                                <Activity className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <p className="text-xl font-bold text-slate-900">No Periodic Follow-ups</p>
                                <p className="text-sm">Patients with a 'Next Clinical Visit' date will appear here.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-50">
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Patient</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Treatment Status</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Diagnosis / Notes</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Next Follow-up</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Notifications</TableHead>
                                        <TableHead className="px-8 h-16 text-right text-[10px] font-black uppercase text-slate-400">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.map((patient: Patient) => (
                                        <TableRow key={patient.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                                            <TableCell className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{patient.name}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black">{patient.ic}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <div className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    patient.continuedTreatment?.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {patient.continuedTreatment?.status || 'In-Progress'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6 max-w-[200px]">
                                                <p className="text-[11px] text-slate-500 italic line-clamp-1">
                                                    {patient.continuedTreatment?.notes || 'No visit notes'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        new Date(patient.continuedTreatment?.nextFollowUpDate as string || 0) < new Date() ? "text-rose-600" : "text-slate-900"
                                                    )}>
                                                        {patient.continuedTreatment?.nextFollowUpDate ? formatDate(patient.continuedTreatment.nextFollowUpDate as string) : "TBD"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                        <Send className="w-3.5 h-3.5 text-blue-500" />
                                                        <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Sequenced</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-right">
                                                <Button
                                                    onClick={() => setEditingFollowUp(patient)}
                                                    variant="ghost"
                                                    className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!editingFollowUp} onOpenChange={(open: boolean) => !open && setEditingFollowUp(null)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-slate-900 p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold mb-2">Schedule Next Visit</DialogTitle>
                        </DialogHeader>
                        <p className="text-slate-400 text-sm">Update next clinical visit for {editingFollowUp?.name}</p>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Follow-up Date</label>
                            <Input
                                type="date"
                                value={editingFollowUp?.continuedTreatment?.nextFollowUpDate ? new Date(editingFollowUp.continuedTreatment.nextFollowUpDate).toISOString().split('T')[0] : ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingFollowUp((prev: Patient | null) => {
                                    if (!prev) return null;
                                    return {
                                        ...prev,
                                        continuedTreatment: { ...prev.continuedTreatment!, nextFollowUpDate: e.target.value }
                                    }
                                })}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <div>
                                <p className="text-xs font-bold text-slate-900">Follow-up Completed</p>
                                <p className="text-[10px] text-slate-500">Patient has completed this visit cycle</p>
                            </div>
                            <button
                                onClick={() => setEditingFollowUp((prev: any) => ({
                                    ...prev,
                                    continuedTreatment: {
                                        ...prev.continuedTreatment,
                                        status: prev.continuedTreatment?.status === 'completed' ? 'in-progress' : 'completed',
                                        active: prev.continuedTreatment?.status === 'completed' // if switching back to in-progress, reactivate
                                    }
                                }))}
                                className={cn(
                                    "w-12 h-6 rounded-full transition-all relative",
                                    editingFollowUp?.continuedTreatment?.status === 'completed' ? "bg-emerald-500" : "bg-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                    editingFollowUp?.continuedTreatment?.status === 'completed' ? "left-7" : "left-1"
                                )} />
                            </button>
                        </div>

                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                                    <Send className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-900">Automation Sequence</p>
                                    <p className="text-[10px] text-blue-700 mt-0.5">Reminders will be calculated and sent automatically 2 days and 1 day before the new date.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                onClick={() => setEditingFollowUp(null)}
                                variant="ghost"
                                className="flex-1 h-12 rounded-2xl font-bold text-slate-500"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateFollowUp}
                                disabled={isSaving}
                                className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200"
                            >
                                {isSaving ? "Updating..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
