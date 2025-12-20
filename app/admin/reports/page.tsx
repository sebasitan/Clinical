"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getAppointmentsAsync, getDoctorsAsync, getPatientsAsync } from "@/lib/storage"
import type { Appointment, Doctor, Patient } from "@/lib/types"
import {
    BarChart3,
    PieChart,
    Activity,
    CheckCircle2,
    XCircle,
    Users,
    Printer,
    FileSpreadsheet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"

export default function ReportsPage() {
    const { isLoading } = useAdminAuth()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)

    // Filters
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")
    const [patientType, setPatientType] = useState<string>("all")
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        const load = async () => {
            const [apts, docs, pts] = await Promise.all([
                getAppointmentsAsync(),
                getDoctorsAsync(),
                getPatientsAsync()
            ])
            setAppointments(apts)
            setDoctors(docs)
            setPatients(pts)
            setIsDataLoading(false)
        }
        load()
    }, [])

    // Data Processing
    const filteredAppointments = useMemo(() => {
        return appointments.filter(a => {
            const aptDate = new Date(a.appointmentDate)
            const startDate = dateRange.start ? new Date(dateRange.start) : null
            const endDate = dateRange.end ? new Date(dateRange.end) : null

            if (startDate && aptDate < startDate) return false
            if (endDate && aptDate > endDate) return false
            if (selectedDoctorId !== "all" && a.doctorId !== selectedDoctorId) return false
            if (selectedStatus !== "all" && a.status !== selectedStatus) return false
            if (patientType !== "all" && a.patientType !== patientType) return false

            return true
        })
    }, [appointments, dateRange, selectedDoctorId, selectedStatus, patientType])

    // Summary Stats
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0]
        const todayApts = appointments.filter(a => a.appointmentDate === today)
        const completed = filteredAppointments.filter(a => a.status === 'completed').length
        const total = filteredAppointments.length
        const recoveryRate = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
            total: total,
            today: todayApts.length,
            completed: completed,
            cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
            noShow: filteredAppointments.filter(a => a.status === 'no-show').length,
            newPatients: filteredAppointments.filter(a => a.patientType === 'new').length,
            recoveryRate
        }
    }, [filteredAppointments, appointments])

    // Doctor stats breakdown
    const doctorStatsBreakdown = useMemo(() => {
        return doctors.map(doc => {
            const docApts = filteredAppointments.filter(a => a.doctorId === doc.id)
            return {
                id: doc.id,
                name: doc.name,
                total: docApts.length,
                completed: docApts.filter(a => a.status === 'completed').length,
                cancelled: docApts.filter(a => a.status === 'cancelled').length,
                noShow: docApts.filter(a => a.status === 'no-show').length
            }
        }).sort((a, b) => b.total - a.total)
    }, [doctors, filteredAppointments])

    const handleExportPDF = async () => {
        setIsGenerating(true)
        try {
            const doc = new jsPDF()
            const today = format(new Date(), "dd MMM yyyy, HH:mm")

            // Header
            doc.setFillColor(15, 23, 42) // Slate 900
            doc.rect(0, 0, 210, 40, "F")

            doc.setTextColor(255, 255, 255)
            doc.setFontSize(22)
            doc.setFont("helvetica", "bold")
            doc.text("CLINIC REPORT", 105, 20, { align: "center" })

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`Generated: ${today}`, 105, 30, { align: "center" })

            // Summary Stats Section
            doc.setTextColor(15, 23, 42)
            doc.setFontSize(14)
            doc.setFont("helvetica", "bold")
            doc.text("Executive Summary", 14, 55)

            // Draw Summary Boxes
            const drawMetric = (x: number, label: string, value: string | number, color: [number, number, number]) => {
                doc.setDrawColor(226, 232, 240)
                doc.setFillColor(255, 255, 255)
                doc.roundedRect(x, 60, 40, 30, 3, 3, "FD")

                doc.setFontSize(8)
                doc.setTextColor(100, 116, 139)
                doc.text(label, x + 20, 70, { align: "center" })

                doc.setFontSize(14)
                doc.setTextColor(color[0], color[1], color[2])
                doc.setFont("helvetica", "bold")
                doc.text(String(value), x + 20, 80, { align: "center" })
            }

            drawMetric(14, "TOTAL APTS", stats.total, [15, 23, 42])
            drawMetric(60, "COMPLETED", stats.completed, [16, 185, 129]) // Emerald
            drawMetric(106, "NEW PATIENTS", stats.newPatients, [245, 158, 11]) // Amber
            drawMetric(152, "ATTRITION", stats.noShow + stats.cancelled, [244, 63, 94]) // Rose

            // Doctor Performance Table
            doc.setFontSize(14)
            doc.setTextColor(15, 23, 42)
            doc.text("Practitioner Breakdown", 14, 105)

            const tableBody = doctorStatsBreakdown.map(d => [
                d.name,
                d.total.toString(),
                d.completed.toString(),
                d.cancelled.toString(),
                `${d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0}%`
            ])

            autoTable(doc, {
                startY: 110,
                head: [['Doctor Name', 'Total', 'Completed', 'Cancelled', 'Efficiency']],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42] },
                alternateRowStyles: { fillColor: [248, 250, 252] }
            })

            // Footer
            const pageCount = doc.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150)
                doc.text(`Page ${i} of ${pageCount} - Confidential Report`, 105, 290, { align: "center" })
            }

            // Convert to Base64
            const pdfOutput = doc.output('datauristring')

            // Upload to Cloudinary
            const res = await fetch('/api/reports/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: pdfOutput,
                    fileName: `Report_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`
                })
            })

            const data = await res.json()

            if (data.success) {
                // Open PDF in new tab
                window.open(data.url, '_blank')
            } else {
                console.error("Cloudinary upload failed:", data.error)
                // Fallback to local download
                doc.save(`Report_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`)
                toast({
                    title: "Cloud sync failed",
                    description: "Your report was downloaded locally instead.",
                    variant: "destructive"
                })
            }

        } catch (error: any) {
            console.error(error)
            alert("Error generating PDF: " + error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleExportCSV = async () => {
        setIsGenerating(true)
        try {
            // 1. Prepare CSV Content
            let csvRows = []

            // Header Section
            csvRows.push(["CLINIC PERFORMANCE REPORT"])
            csvRows.push([`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}`])
            csvRows.push([])

            // Executive Summary
            csvRows.push(["EXECUTIVE SUMMARY"])
            csvRows.push(["Metric", "Value"])
            csvRows.push(["Total Appointments", stats.total])
            csvRows.push(["Completed Visits", stats.completed])
            csvRows.push(["New Patients", stats.newPatients])
            csvRows.push(["Attrition (No-Show + Cancelled)", stats.noShow + stats.cancelled])
            csvRows.push(["Recovery Rate", `${stats.recoveryRate}%`])
            csvRows.push([])

            // Practitioner Breakdown
            csvRows.push(["PRACTITIONER BREAKDOWN"])
            csvRows.push(["Doctor Name", "Total", "Completed", "Cancelled", "No-Show", "Efficiency"])
            doctorStatsBreakdown.forEach(d => {
                csvRows.push([
                    d.name,
                    d.total,
                    d.completed,
                    d.cancelled,
                    d.noShow,
                    `${d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0}%`
                ])
            })
            csvRows.push([])

            // Appointment Logs
            csvRows.push(["APPOINTMENT LOGS (Filtered)"])
            csvRows.push(["Date", "Time", "Doctor", "Patient", "Type", "Status"])
            filteredAppointments.forEach(a => {
                const docName = doctors.find(d => d.id === a.doctorId)?.name || "Unassigned"
                csvRows.push([
                    a.appointmentDate,
                    a.timeSlot,
                    docName,
                    a.patientName,
                    a.patientType,
                    a.status
                ])
            })

            // Convert to CSV string
            const csvString = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")

            // Convert to Base64 (Cloudinary expects this for data URIs)
            const base64CSV = `data:text/csv;base64,${Buffer.from(csvString).toString('base64')}`

            // Upload to Cloudinary
            const res = await fetch('/api/reports/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: base64CSV,
                    fileName: `Report_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`
                })
            })

            const data = await res.json()

            if (data.success) {
                // Open CSV in new tab (Cloudinary will serve it)
                window.open(data.url, '_blank')
            } else {
                console.error("CSV Cloud upload failed:", data.error)
                // Fallback to local download
                const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.setAttribute("href", url)
                link.setAttribute("download", `Report_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                toast({
                    title: "Cloud sync failed",
                    description: "Your CSV was downloaded locally instead.",
                    variant: "destructive"
                })
            }

        } catch (error: any) {
            console.error(error)
            alert("Error generating CSV: " + error.message)
        } finally {
            setIsGenerating(false)
        }
    }

    if (isLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Compiling Clinical Intelligence..." />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-8 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Reports & Intelligence
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinic Performance & Patient Flow Analysis</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={handleExportCSV}
                            disabled={isGenerating}
                            className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl gap-2 font-bold px-6"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Export CSV
                        </Button>
                        <Button
                            onClick={handleExportPDF}
                            disabled={isGenerating}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 font-bold px-6 shadow-lg shadow-slate-100"
                        >
                            {isGenerating ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Printer className="w-4 h-4" />
                                    Download Official Report
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-8 py-10">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <Card className="border-none shadow-sm rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-[10px]">+14%</Badge>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Appointments</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">{stats.today} expected today</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Recovery</p>
                                    <p className="text-xs font-bold text-slate-900">{stats.recoveryRate}%</p>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Visits</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.completed}</h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">Cases finalized successfully</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                    <Users className="w-5 h-5" />
                                </div>
                                <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[10px]">Registry</Badge>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Patients</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.newPatients}</h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">Unique first-time visits</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                                    <XCircle className="w-5 h-5" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Attrition</span>
                                    <span className="text-xs font-bold text-slate-900">{stats.noShow + stats.cancelled}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missed Opportunities</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.noShow} <span className="text-sm text-slate-400 font-medium">No-Shows</span></h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-2">{stats.cancelled} manual cancellations</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Section */}
                <Card className="border-none shadow-sm rounded-3xl bg-white mb-10 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 px-8 py-6 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Date Range</label>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                    <Input
                                        type="date"
                                        className="h-8 border-none bg-transparent shadow-none w-32 p-0 text-[11px] font-bold"
                                        value={dateRange.start}
                                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                    <span className="text-slate-300 font-black">-</span>
                                    <Input
                                        type="date"
                                        className="h-8 border-none bg-transparent shadow-none w-32 p-0 text-[11px] font-bold"
                                        value={dateRange.end}
                                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Practitioner</label>
                                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                                    <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 text-[11px] font-bold">
                                        <SelectValue placeholder="All Doctors" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Practitioners</SelectItem>
                                        {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Visit Status</label>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger className="w-40 h-10 rounded-xl border-slate-200 text-[11px] font-bold">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Global Status</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                        <SelectItem value="no-show">No-Show</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Patient Profile</label>
                                <Select value={patientType} onValueChange={setPatientType}>
                                    <SelectTrigger className="w-40 h-10 rounded-xl border-slate-200 text-[11px] font-bold">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Global Profiles</SelectItem>
                                        <SelectItem value="new">New Patients</SelectItem>
                                        <SelectItem value="existing">Existing Patients</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Main Tabs Section */}
                <Tabs defaultValue="doctor-report" className="space-y-8">
                    <TabsList className="bg-transparent h-12 p-0 gap-8 border-b border-slate-100 w-full justify-start rounded-none">
                        <TabsTrigger value="doctor-report" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 text-xs font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 h-12 transition-all">
                            Doctor performance
                        </TabsTrigger>
                        <TabsTrigger value="total-report" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 text-xs font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 h-12 transition-all">
                            Clinical breakdown
                        </TabsTrigger>
                        <TabsTrigger value="daily-report" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 text-xs font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 h-12 transition-all">
                            Daily arriving logs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="doctor-report" className="space-y-6">
                        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Provider</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Apts</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-emerald-600">Completed</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-rose-500">Cancelled</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest text-slate-600">No-Show</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Efficiency</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {doctorStatsBreakdown.map(doc => {
                                            const effValue = doc.total > 0 ? Math.round((doc.completed / doc.total) * 100) : 0
                                            return (
                                                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-black text-[10px] text-white italic">
                                                                {doc.name.charAt(0)}
                                                            </div>
                                                            <span className="font-bold text-slate-900">{doc.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-slate-900">{doc.total}</td>
                                                    <td className="px-8 py-6 font-bold text-emerald-600">{doc.completed}</td>
                                                    <td className="px-8 py-6 font-bold text-rose-500">{doc.cancelled}</td>
                                                    <td className="px-8 py-6 font-bold text-slate-400">{doc.noShow}</td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-3 text-xs font-black text-slate-900">
                                                            <span>{effValue}%</span>
                                                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-600" style={{ width: `${effValue}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="total-report" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
                            <CardTitle className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                Demand by Practitioner
                            </CardTitle>
                            <div className="space-y-6">
                                {doctorStatsBreakdown.slice(0, 5).map(doc => (
                                    <div key={doc.id}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-bold text-slate-700">{doc.name}</span>
                                            <span className="text-xs font-black text-slate-900">{doc.total} Reservations</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div className="h-full bg-slate-900" style={{ width: `${(doc.total / stats.total) * 100}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl bg-white p-8">
                            <CardTitle className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-amber-600" />
                                Growth Profile Analysis
                            </CardTitle>
                            <div className="flex flex-col items-center justify-center h-full space-y-8">
                                <div className="relative w-40 h-40">
                                    <svg className="w-40 h-40 transform -rotate-90">
                                        <circle
                                            cx="80" cy="80" r="70"
                                            stroke="currentColor" strokeWidth="20" fill="transparent"
                                            className="text-slate-100"
                                        />
                                        <circle
                                            cx="80" cy="80" r="70"
                                            stroke="currentColor" strokeWidth="20" fill="transparent"
                                            strokeDasharray={2 * Math.PI * 70}
                                            strokeDashoffset={2 * Math.PI * 70 * (1 - (stats.newPatients / (stats.total || 1)))}
                                            className="text-amber-500"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-slate-900">{Math.round((stats.newPatients / (stats.total || 1)) * 100)}%</span>
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">New Growth</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-10 w-full">
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Returning</p>
                                        <p className="text-2xl font-black text-slate-900">{stats.total - stats.newPatients}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">First-Time</p>
                                        <p className="text-2xl font-black text-slate-900">{stats.newPatients}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="daily-report">
                        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Time</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Doctor</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Patient</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Type</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredAppointments.slice(0, 20).map(apt => (
                                            <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6 text-sm font-bold text-slate-600">{apt.timeSlot}</td>
                                                <td className="px-8 py-6">
                                                    <span className="text-xs font-bold text-slate-900 italic">
                                                        {doctors.find(d => d.id === apt.doctorId)?.name || "Unassigned"}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-black text-slate-900">{apt.patientName}</td>
                                                <td className="px-8 py-6">
                                                    <Badge className={cn(
                                                        "text-[8px] font-black uppercase px-2 shadow-none border-none",
                                                        apt.patientType === 'new' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                                                    )}>
                                                        {apt.patientType} Profile
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <Badge className={cn(
                                                        "text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-none border-none",
                                                        apt.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                                                            apt.status === 'confirmed' ? "bg-blue-100 text-blue-700" :
                                                                "bg-rose-100 text-rose-700"
                                                    )}>
                                                        {apt.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    )
}
