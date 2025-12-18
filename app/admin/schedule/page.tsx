"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getSlots, getDoctors, updateSlotStatus, getAppointments, updateAppointmentStatus } from "@/lib/storage"
import type { Slot, Doctor, Appointment } from "@/lib/types"
import {
    Clock,
    User,
    CheckCircle2,
    Ban,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    Stethoscope,
    Users,
    Activity,
    Calendar,
    Filter,
    ArrowUpRight,
    MoreHorizontal,
    RefreshCcw,
    MapPin,
    UserMinus,
    ClipboardCheck
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function SchedulePage() {
    const { isLoading } = useAdminAuth()
    const { toast } = useToast()
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [slots, setSlots] = useState<Slot[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [filter, setFilter] = useState<"all" | "booked" | "available">("all")
    const [currentTime, setCurrentTime] = useState(new Date())
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        loadData()
    }, [selectedDate])

    const loadData = () => {
        setSlots(getSlots().filter(s => s.date === selectedDate))
        setDoctors(getDoctors().filter(d => d.isActive))
        setAppointments(getAppointments())
    }

    const resetToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0])
    }

    const handleToggleBlock = (slot: Slot) => {
        const newStatus = slot.status === "available" ? "blocked" : "available"
        updateSlotStatus(slot.id, newStatus)
        toast({ title: `Slot ${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'}`, variant: "default" })
        loadData()
    }

    const handleAppointmentAction = (appointmentId: string, status: Appointment['status']) => {
        updateAppointmentStatus(appointmentId, status)
        toast({ title: `Case marked as ${status}` })
        loadData()
    }

    const getStatusStyle = (slot: Slot) => {
        if (slot.status === "booked") return "bg-blue-600/5 border-blue-100 text-blue-700 ring-1 ring-blue-100/50"
        if (slot.status === "blocked") return "bg-slate-100 border-slate-200 text-slate-400 opacity-60"
        if (slot.status === "locked") return "bg-amber-50 border-amber-100 text-amber-600"
        return "bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:shadow-md transition-all duration-300"
    }

    if (isLoading) return null

    // Stats
    const totalSlots = slots.length
    const bookedCount = slots.filter(s => s.status === 'booked').length
    const availableCount = slots.filter(s => s.status === 'available').length
    const occupancy = totalSlots > 0 ? Math.round((bookedCount / totalSlots) * 100) : 0

    const isToday = selectedDate === new Date().toISOString().split('T')[0]

    return (
        <div className="flex-1 bg-slate-50/50 flex flex-col h-screen overflow-hidden">
            {/* Context Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-6 shrink-0 z-10">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-full">
                                <Activity className="w-3 h-3" />
                                Live Operations Center
                            </span>
                            {isToday && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            Clinical Flow Board
                            <span className="text-slate-200 font-light">/</span>
                            <span className="text-slate-400 font-medium">{selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Summary Metrics */}
                        <div className="hidden md:flex items-center gap-8 mr-6 border-r border-slate-100 pr-8">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Occupancy</span>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black text-slate-900 leading-none">{occupancy}%</span>
                                    <span className="text-[10px] font-bold text-emerald-500 mb-0.5 whitespace-nowrap">Optimal Flow</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Booked</span>
                                <span className="text-2xl font-black text-slate-900 leading-none">{bookedCount}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 bg-white text-slate-600 shadow-sm border border-slate-100 rounded-xl hover:bg-slate-50"
                                onClick={() => {
                                    const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0])
                                }}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                onClick={resetToToday}
                                className={cn(
                                    "px-4 h-9 rounded-xl font-bold text-xs transition-all",
                                    isToday ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-100 shadow-sm"
                                )}
                            >
                                Today
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 bg-white text-slate-600 shadow-sm border border-slate-100 rounded-xl hover:bg-slate-50"
                                onClick={() => {
                                    const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0])
                                }}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <Button variant="outline" size="icon" onClick={loadData} className="h-12 w-12 rounded-2xl border-slate-100 hover:bg-slate-50 text-slate-400">
                            <RefreshCcw className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Board Controls */}
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-3 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 shadow-sm">
                    {(["all", "booked", "available"] as const).map((f) => (
                        <Button
                            key={f}
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilter(f)}
                            className={cn(
                                "h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === f ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {f}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 mr-4">
                        {doctors.slice(0, 4).map(d => (
                            <Avatar key={d.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100">
                                <AvatarImage src={d.photo} className="object-cover" />
                                <AvatarFallback className="text-[8px] bg-slate-900 text-white font-black">{d.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ))}
                        {doctors.length > 4 && (
                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-slate-400 ring-1 ring-slate-100">
                                +{doctors.length - 4}
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-400 font-bold hover:text-slate-900">
                        <Filter className="w-3.5 h-3.5" />
                        Sort Columns
                    </Button>
                </div>
            </div>

            {/* Main Clinical Board */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden p-8" ref={scrollContainerRef}>
                <div className="flex gap-6 h-full min-w-max pb-4">
                    {doctors.map(doctor => {
                        const doctorSlots = slots.filter(s => s.doctorId === doctor.id)
                        const filteredSlots = filter === 'all' ? doctorSlots : doctorSlots.filter(s => s.status === filter)

                        return (
                            <div key={doctor.id} className="w-80 flex flex-col bg-slate-100/30 rounded-[2.5rem] border border-slate-200/50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Column Header */}
                                <div className="p-6 bg-white border-b border-slate-100 relative">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                                    <div className="flex items-center gap-4 mb-4">
                                        <Avatar className="w-12 h-12 rounded-2xl shadow-sm ring-1 ring-slate-100">
                                            <AvatarImage src={doctor.photo} className="object-cover" />
                                            <AvatarFallback className="bg-slate-900 text-white font-black">{doctor.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-black text-slate-900 truncate leading-tight">{doctor.name}</h3>
                                            <p className="text-[10px] font-black uppercase text-blue-600/70 tracking-widest mt-0.5">{doctor.specialization}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> {doctorSlots.length} Slots
                                        </span>
                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                                            On duty
                                        </span>
                                    </div>
                                </div>

                                {/* Column Content - Independent Scroll */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                                    {filteredSlots.length === 0 ? (
                                        <div className="py-24 text-center px-6">
                                            <div className="w-16 h-16 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                                <Stethoscope className="w-6 h-6 text-slate-200" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">No operations<br />scheduled</p>
                                        </div>
                                    ) : (
                                        filteredSlots.map(slot => {
                                            const apt = appointments.find(a => a.id === slot.appointmentId)
                                            const aptStatus = apt?.status

                                            return (
                                                <Card key={slot.id} className={cn(
                                                    "border-none shadow-sm rounded-2xl overflow-hidden transition-all duration-300 group/card",
                                                    getStatusStyle(slot)
                                                )}>
                                                    <CardContent className="p-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-xl bg-white/80 flex items-center justify-center border border-slate-100 shadow-sm">
                                                                    <Clock className="w-3.5 h-3.5 text-slate-900" />
                                                                </div>
                                                                <span className="text-xs font-black text-slate-900 tracking-tighter">{slot.timeRange.replace(':00', '').replace(':30', '')}</span>
                                                            </div>
                                                            {slot.status === 'booked' && (
                                                                <div className={cn(
                                                                    "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                                                    aptStatus === 'completed' ? "bg-emerald-100 text-emerald-600" :
                                                                        aptStatus === 'no-show' ? "bg-rose-100 text-rose-600" :
                                                                            "bg-blue-600 text-white animate-pulse"
                                                                )}>
                                                                    {aptStatus || 'Booked'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {slot.status === 'booked' && apt ? (
                                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                                <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm group-hover/card:shadow-md transition-shadow">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Users className="w-3 h-3 text-blue-500" />
                                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Case Profile</span>
                                                                    </div>
                                                                    <p className="text-xs font-black text-slate-900 truncate mb-1">{apt.patientName}</p>
                                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                                                                        <Activity className="w-2.5 h-2.5" />
                                                                        {apt.patientPhone}
                                                                    </div>
                                                                </div>

                                                                {aptStatus === 'pending' && (
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            onClick={() => handleAppointmentAction(apt.id, 'completed')}
                                                                            className="flex-1 h-10 bg-slate-900 border-none hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                                                        >
                                                                            Check-Out
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => handleAppointmentAction(apt.id, 'no-show')}
                                                                            variant="outline"
                                                                            className="w-10 h-10 border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-xl p-0 transition-all flex items-center justify-center shrink-0"
                                                                            title="Mark No-Show"
                                                                        >
                                                                            <UserMinus className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                                {aptStatus === 'completed' && (
                                                                    <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest justify-center py-2 bg-emerald-50 rounded-xl">
                                                                        <ClipboardCheck className="w-3.5 h-3.5" /> Session Closed
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="pt-2 flex items-center justify-between border-t border-slate-50 mt-1">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                                    {slot.status === 'available' ? 'Open Window' : 'System Blocked'}
                                                                </span>
                                                                <Button
                                                                    variant="ghost"
                                                                    onClick={() => handleToggleBlock(slot)}
                                                                    className="h-8 w-8 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-lg p-0 transition-colors"
                                                                >
                                                                    {slot.status === 'blocked' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            )
                                        })
                                    )}
                                </div>
                                {/* Column Footer / Spacer */}
                                <div className="h-4 bg-gradient-to-t from-slate-100/50 to-transparent pointer-events-none sticky bottom-0 shrink-0" />
                            </div>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}

function UserCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
        </svg>
    )
}
