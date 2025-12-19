"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import {
    getAppointmentsAsync,
    getDoctorsAsync,
    getPatientsAsync,
    getSlotsAsync,
} from "@/lib/storage"
import { formatDate } from "@/lib/date-utils"
import type { Appointment, Doctor, Patient, Slot } from "@/lib/types"
import {
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    Users,
    TrendingUp,
    AlertCircle,
    Plus,
    ArrowUpRight,
    ArrowRight,
    ClipboardList,
    Shield
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export default function AdminDashboardPage() {
    const { isLoading, admin } = useAdminAuth()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [patients, setPatients] = useState<Patient[]>([])
    const [slots, setSlots] = useState<Slot[]>([])

    const todayStr = new Date().toISOString().split('T')[0]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [apts, docs, pts, slts] = await Promise.all([
            getAppointmentsAsync(),
            getDoctorsAsync(),
            getPatientsAsync(),
            getSlotsAsync(undefined, todayStr)
        ])
        setAppointments(apts)
        setDoctors(docs)
        setPatients(pts)
        setSlots(slts)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold">Initializing Admin Session...</p>
                </div>
            </div>
        )
    }

    // Stats calculation
    const todayApps = appointments.filter(a => a.appointmentDate === todayStr)
    const upcomingToday = todayApps.filter(a => a.status === 'confirmed' || a.status === 'pending')
    const completedToday = todayApps.filter(a => a.status === 'completed')
    const cancelledToday = todayApps.filter(a => a.status === 'cancelled')

    const newPatientsCount = patients.filter(p => p.type === 'new').length
    const existingPatientsCount = patients.filter(p => p.type === 'existing').length

    const stats = [
        { label: "Today's Load", value: todayApps.length, icon: Calendar, color: "text-slate-900", bg: "bg-slate-50" },
        { label: "Pending Visit", value: upcomingToday.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Clinical Success", value: completedToday.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Cancellations", value: cancelledToday.length, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
    ]

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">

                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em] bg-blue-50 px-3 py-1 rounded-full">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Clinical Overview</h1>
                        <p className="text-slate-500 mt-1">Operational summary for <span className="text-slate-900 font-bold">Klinik Pergigian Setapak</span>.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/admin/schedule">
                            <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200 gap-2 group">
                                Live Operations
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Dynamic Highlight Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.label} className="border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-md transition-shadow">
                                <CardContent className="p-8">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                            <h3 className={`text-4xl font-bold ${stat.color}`}>{stat.value}</h3>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${stat.color.replace('text-', 'bg-')} bg-opacity-20`} style={{ width: '60%' }} />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">ACTIVE</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Timeline Widget */}
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-bold font-sans">Today's Timeline</CardTitle>
                                        <CardDescription>Chronological log of upcoming sessions.</CardDescription>
                                    </div>
                                    <Link href="/admin/schedule">
                                        <Button variant="ghost" size="sm" className="font-bold text-blue-600 gap-1 rounded-xl">
                                            Full Grid <ArrowUpRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                {upcomingToday.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-medium">No sessions remaining for the day.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {upcomingToday.slice(0, 5).map((apt) => (
                                            <div key={apt.id} className="flex items-center gap-6 group">
                                                <div className="w-20 text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
                                                    {apt.timeSlot.split(' ')[0]} {apt.timeSlot.split(' ')[1]}
                                                </div>
                                                <div className="h-px bg-slate-100 flex-1" />
                                                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-transparent group-hover:border-blue-100 group-hover:bg-white group-hover:shadow-md transition-all flex-1">
                                                    <Avatar className="w-10 h-10 rounded-xl shadow-sm">
                                                        <AvatarFallback className="font-bold bg-white text-slate-900">{apt.patientName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{apt.patientName}</p>
                                                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-tighter">
                                                            {doctors.find(d => d.id === apt.doctorId)?.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Doctor Availability Snapshot */}
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                            <CardHeader className="p-8 pb-0">
                                <CardTitle className="text-2xl font-bold font-sans">Doctors Snapshot</CardTitle>
                                <CardDescription>Workload and availability status.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {doctors.map(doctor => {
                                        const doctorApps = todayApps.filter(a => a.doctorId === doctor.id)
                                        const doctorSlots = slots.filter(s => s.doctorId === doctor.id && s.date === todayStr)
                                        return (
                                            <div key={doctor.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <Avatar className="w-14 h-14 rounded-2xl shadow-md border-4 border-white">
                                                        <AvatarImage src={doctor.photo} className="object-cover" />
                                                        <AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{doctor.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{doctor.specialization}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white p-3 rounded-2xl border border-slate-50">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Booked</p>
                                                        <p className="text-xl font-bold text-blue-600">{doctorApps.length}</p>
                                                    </div>
                                                    <div className="bg-white p-3 rounded-2xl border border-slate-50">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Available</p>
                                                        <p className="text-xl font-bold text-emerald-600">{doctorSlots.filter(s => s.status === 'available').length}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column Alerts & Stats */}
                    <div className="space-y-10">
                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <CardContent className="p-8">
                                <TrendingUp className="w-10 h-10 text-blue-400 mb-6" />
                                <h4 className="text-2xl font-bold mb-6">Patient Distribution</h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                            <span className="text-slate-400">New Patients</span>
                                            <span>{newPatientsCount}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(newPatientsCount / Math.max(1, newPatientsCount + existingPatientsCount)) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                                            <span className="text-slate-400">Existing Records</span>
                                            <span>{existingPatientsCount}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(existingPatientsCount / Math.max(1, newPatientsCount + existingPatientsCount)) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-xl font-bold font-sans flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    Clinical Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-4">
                                {todayApps.length > 15 && (
                                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-rose-700 font-bold leading-relaxed">High volume day detected. Additional staff might be needed.</p>
                                    </div>
                                )}

                                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 font-bold leading-relaxed">System security audit completed. All protocols active.</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 font-bold leading-relaxed">Morning slots for doctors are almost fully booked.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Action Registry</p>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/admin/schedule">
                                    <Button variant="outline" className="w-full h-12 rounded-xl flex flex-col items-center justify-center p-0 gap-1 hover:border-blue-100 hover:bg-blue-50 transition-all group">
                                        <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                        <span className="text-[10px] font-bold">New Slot</span>
                                    </Button>
                                </Link>
                                <Link href="/admin/availability">
                                    <Button variant="outline" className="w-full h-12 rounded-xl flex flex-col items-center justify-center p-0 gap-1 hover:border-amber-100 hover:bg-amber-50 transition-all group">
                                        <Clock className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                                        <span className="text-[10px] font-bold">Duty Cycle</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
