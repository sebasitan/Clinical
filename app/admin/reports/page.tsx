"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getAppointments, getDoctors, getSlots } from "@/lib/storage"
import { formatDate } from "@/lib/date-utils"
import type { Appointment, Doctor, Slot } from "@/lib/types"
import {
    Download,
    Users,
    TrendingUp,
    FileText,
    UserCheck,
    PieChart,
    ArrowDownToLine,
    Activity
} from "lucide-react"

export default function ReportsPage() {
    const { isLoading } = useAdminAuth()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [slots, setSlots] = useState<Slot[]>([])

    const [dateRange, setDateRange] = useState("all")
    const [selectedDoctorId, setSelectedDoctorId] = useState("all")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setAppointments(getAppointments())
        setDoctors(getDoctors())
        setSlots(getSlots())
    }

    const filteredAppointments = appointments.filter(apt => {
        const matchesDoctor = selectedDoctorId === "all" || apt.doctorId === selectedDoctorId
        if (dateRange === "today") {
            const today = new Date().toISOString().split('T')[0]
            return matchesDoctor && apt.appointmentDate === today
        }
        return matchesDoctor
    })

    // Calculation logic
    const totalApps = filteredAppointments.length
    const completed = filteredAppointments.filter(a => a.status === 'completed').length
    const cancelled = filteredAppointments.filter(a => a.status === 'cancelled').length
    const newPatients = filteredAppointments.filter(a => a.patientType === 'new').length

    const utilizationRate = totalApps > 0 ? (completed / totalApps) * 100 : 0

    const exportCSV = () => {
        const headers = ["ID", "Patient", "IC", "Type", "Doctor", "Date", "Time", "Status"]
        const rows = filteredAppointments.map(a => [
            a.id,
            a.patientName,
            a.patientIC,
            a.patientType,
            doctors.find(d => d.id === a.doctorId)?.name || 'N/A',
            a.appointmentDate,
            a.timeSlot,
            a.status
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `DentalClinic_Report_${new Date().toISOString().split('T')[0]}.csv`)
        link.click()
    }

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Clinical Analytics</h1>
                        <p className="text-slate-500 mt-1">Data-driven performance insights for clinic directors.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
                            <Button
                                variant={dateRange === 'today' ? 'default' : 'ghost'}
                                onClick={() => setDateRange('today')}
                                className={`h-10 px-4 rounded-xl font-bold ${dateRange === 'today' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                            >
                                Today
                            </Button>
                            <Button
                                variant={dateRange === 'all' ? 'default' : 'ghost'}
                                onClick={() => setDateRange('all')}
                                className={`h-10 px-4 rounded-xl font-bold ${dateRange === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                            >
                                All Time
                            </Button>
                        </div>

                        <Button onClick={exportCSV} className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-100 gap-2">
                            <ArrowDownToLine className="w-5 h-5" />
                            Export CSV
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: "Total Visits", value: totalApps, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Completion Ratio", value: `${Math.round(utilizationRate)}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "New Acquisition", value: newPatients, icon: UserCheck, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Status Breakdown", value: `${completed}/${totalApps}`, icon: PieChart, color: "text-indigo-600", bg: "bg-indigo-50" }
                    ].map((stat, i) => (
                        <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                                </div>
                                <h3 className="text-4xl font-black text-slate-900">{stat.value}</h3>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-bold font-sans">Specialists Performance</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow>
                                            <TableHead className="px-8 h-12 text-[10px] font-black uppercase text-slate-400">Practitioner</TableHead>
                                            <TableHead className="px-8 h-12 text-[10px] font-black uppercase text-slate-400">Visits</TableHead>
                                            <TableHead className="px-8 h-12 text-[10px] font-black uppercase text-slate-400">Success Rate</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {doctors.map(doctor => {
                                            const drApps = appointments.filter(a => a.doctorId === doctor.id)
                                            const drCompleted = drApps.filter(a => a.status === 'completed').length
                                            const drRate = drApps.length > 0 ? (drCompleted / drApps.length) * 100 : 0
                                            return (
                                                <TableRow key={doctor.id} className="border-slate-50">
                                                    <TableCell className="px-8 py-4">
                                                        <span className="font-bold text-slate-900">{doctor.name}</span>
                                                    </TableCell>
                                                    <TableCell className="px-8 py-4 font-black text-slate-400">{drApps.length}</TableCell>
                                                    <TableCell className="px-8 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${drRate}%` }} />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-900">{Math.round(drRate)}%</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-10">
                        <div className="p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm text-center">
                            <FileText className="w-12 h-12 text-blue-600 mb-4 bg-blue-50 p-3 rounded-2xl mx-auto" />
                            <h4 className="text-lg font-bold text-slate-900 mb-2">Print-Friendly Report</h4>
                            <p className="text-xs text-slate-500 mb-8 font-medium">Generate a physical copy of current metrics.</p>
                            <Button onClick={() => window.print()} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold gap-2">
                                Print Overview
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
