"use client"

import { useState, useEffect, useRef } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getSlotsAsync, getDoctorsAsync, updateSlotStatus, getAppointmentsAsync, updateAppointmentStatusAsync, addAppointment } from "@/lib/storage"
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
    ClipboardCheck,
    LayoutDashboard,
    ClipboardList
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function SchedulePage() {
    const router = useRouter()
    const { isLoading } = useAdminAuth()
    const { toast } = useToast()
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [slots, setSlots] = useState<Slot[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [filter, setFilter] = useState<"all" | "booked" | "available">("all")
    const [currentTime, setCurrentTime] = useState(new Date())
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [isDataLoading, setIsDataLoading] = useState(true)

    const [viewMode, setViewMode] = useState<"board" | "list">("board")

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        loadData()
    }, [selectedDate])

    const loadData = async () => {
        const [allSlots, docs, apts] = await Promise.all([
            getSlotsAsync(undefined, selectedDate),
            getDoctorsAsync(),
            getAppointmentsAsync()
        ])
        setSlots(allSlots)
        setDoctors(docs.filter(d => d.isActive))
        setAppointments(apts)
        setIsDataLoading(false)
    }

    const resetToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0])
    }

    const handleToggleBlock = (slot: Slot) => {
        if (slot.status === "available") {
            const reason = window.prompt("Reason for blocking this slot?", "Lunch / Break / Emergency")
            if (reason !== null) {
                updateSlotStatus(slot.id, "blocked", undefined, reason)
                toast({ title: "Slot Blocked", description: reason })
            }
        } else if (slot.status === "blocked") {
            updateSlotStatus(slot.id, "available")
            toast({ title: "Slot Unblocked" })
        }
        loadData()
    }

    const handleAppointmentAction = async (appointmentId: string, status: Appointment['status']) => {
        try {
            await updateAppointmentStatusAsync(appointmentId, status)
            toast({ title: `Case marked as ${status}` })
            loadData()
        } catch (e) {
            toast({ title: "Failed to update", variant: "destructive" })
        }
    }

    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
    const [bookingSlot, setBookingSlot] = useState<Slot | null>(null)
    const [manualBookingData, setManualBookingData] = useState({
        name: "",
        ic: "",
        phone: "",
        email: "",
        type: "existing" as "new" | "existing"
    })

    const handleManualBooking = (e: React.FormEvent) => {
        e.preventDefault()
        if (!bookingSlot) return

        const newApt: Omit<Appointment, "id" | "createdAt"> = {
            patientName: manualBookingData.name,
            patientIC: manualBookingData.ic,
            patientPhone: manualBookingData.phone,
            patientEmail: manualBookingData.email,
            patientType: manualBookingData.type,
            appointmentDate: bookingSlot.date,
            timeSlot: bookingSlot.timeRange,
            slotId: bookingSlot.id,
            doctorId: bookingSlot.doctorId,
            status: "confirmed"
        }

        addAppointment(newApt)
        toast({ title: "Manual Booking Confirmed" })
        setIsBookingDialogOpen(false)
        setManualBookingData({ name: "", ic: "", phone: "", email: "", type: "existing" })
        loadData()
    }

    const getStatusStyle = (slot: Slot) => {
        if (slot.status === "booked") return "bg-white border-blue-200 ring-2 ring-blue-50 shadow-blue-100"
        if (slot.status === "blocked") return "bg-slate-50 border-slate-200 opacity-75"
        return "bg-white border-slate-100 ring-1 ring-slate-50 hover:border-blue-300 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
    }

    if (isLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Accessing Provider Directory..." />
            </div>
        )
    }

    const totalSlots = slots.length
    const bookedCount = slots.filter(s => s.status === 'booked').length
    const availableCount = slots.filter(s => s.status === 'available').length
    const occupancy = totalSlots > 0 ? Math.round((bookedCount / totalSlots) * 100) : 0
    const isToday = selectedDate === new Date().toISOString().split('T')[0]

    const todaysAppointments = appointments.filter(a => a.appointmentDate === selectedDate)

    return (
        <div className="flex-1 bg-slate-50/50 flex flex-col h-screen overflow-hidden text-slate-900">
            <header className="bg-white border-b border-slate-100 px-8 py-6 shrink-0 z-10">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            {isToday && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
                                    <Clock className="w-3 h-3" />
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            Provider Directory
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                    </div>
                </div>
            </header>

            {viewMode === 'board' ? (
                <main className="flex-1 overflow-y-auto p-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-12">
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight italic">Provider Selection</h2>
                                <p className="text-slate-500 font-medium">Select a doctor to manage their specific schedule and bookings.</p>
                            </div>
                            <Badge variant="outline" className="px-5 py-2 rounded-2xl border-slate-200 text-slate-600 font-bold bg-white text-xs">
                                {doctors.length} Active Practitioners
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {doctors.map(doctor => (
                                <div
                                    key={doctor.id}
                                    onClick={() => router.push(`/admin/doctors/${doctor.id}`)}
                                    className="group relative cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-blue-600 rounded-[2.5rem] translate-y-2 translate-x-1 opacity-0 group-hover:opacity-10 transition-all duration-300" />
                                    <Card className={cn(
                                        "relative border shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500",
                                        doctor.isAvailable ? "border-emerald-500/50" : "border-transparent"
                                    )}>
                                        <div className="h-32 bg-slate-900 relative">
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent)]" />
                                            {doctor.isAvailable ? (
                                                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                                                </div>
                                            ) : (
                                                <div className="absolute top-4 right-4 px-3 py-1 bg-slate-500/10 backdrop-blur-md border border-slate-500/20 rounded-full flex items-center gap-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inactive</span>
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-8 pt-0 -mt-12 text-center">
                                            <Avatar className="w-24 h-24 rounded-[2rem] border-4 border-white shadow-xl mx-auto transition-transform duration-500 group-hover:scale-110">
                                                <AvatarImage src={doctor.photo} className="object-cover" />
                                                <AvatarFallback className="bg-slate-100 text-slate-400 font-black text-xl">{doctor.name.charAt(0)}</AvatarFallback>
                                            </Avatar>

                                            <div className="mt-6 space-y-1">
                                                <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{doctor.name}</h3>
                                                <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{doctor.specialization}</p>
                                            </div>

                                            <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                                                <div className="text-left">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                                    <p className="text-[10px] font-bold text-slate-600">{doctor.isActive ? 'Registered' : 'On Leave'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Access</p>
                                                    <p className="text-[10px] font-bold text-blue-600 flex items-center justify-end gap-1">
                                                        Manage <ArrowUpRight className="w-3 h-3" />
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            ) : (
                <main className="flex-1 overflow-y-auto p-12">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Main Triage Queue</h2>
                                <p className="text-sm text-slate-500 font-medium">Detailed list of all patient appointments for {selectedDate}</p>
                            </div>
                            <Badge variant="outline" className="px-4 py-1.5 rounded-full border-slate-200 text-slate-600 font-bold bg-white">
                                {todaysAppointments.length} Active Appointments
                            </Badge>
                        </div>

                        {todaysAppointments.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <ClipboardCheck className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">Queue is empty</h3>
                                <p className="text-slate-500 mt-2 max-w-xs mx-auto">There are no confirmed appointments scheduled for this date.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Details</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time Slot</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Provider</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {todaysAppointments.map(apt => {
                                            const doc = doctors.find(d => d.id === apt.doctorId)
                                            return (
                                                <tr key={apt.id} className="hover:bg-slate-50/40 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                                                                {apt.patientName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{apt.patientName}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{apt.patientIC}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                            <span className="text-sm font-bold text-slate-700">{apt.timeSlot}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="w-6 h-6 rounded-lg">
                                                                <AvatarImage src={doc?.photo} />
                                                                <AvatarFallback>{doc?.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-xs font-bold text-slate-600">{doc?.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <Badge className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                                                            apt.status === 'confirmed' ? "bg-blue-100 text-blue-600" :
                                                                apt.status === 'completed' ? "bg-emerald-100 text-emerald-600" :
                                                                    "bg-rose-100 text-rose-600"
                                                        )}>
                                                            {apt.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {apt.status === 'confirmed' ? (
                                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleAppointmentAction(apt.id, 'completed')}
                                                                    className="h-8 rounded-lg text-[9px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white"
                                                                >
                                                                    Complete
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleAppointmentAction(apt.id, 'no-show')}
                                                                    className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50"
                                                                >
                                                                    <UserMinus className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-300 italic">No actions</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            )}

            {/* Manual Booking Dialog */}
            {isBookingDialogOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
                    <Card className="w-full max-w-lg border-none rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Walk-in Booking</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Manual Entry System</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-blue-400">{bookingSlot?.timeRange}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{bookingSlot?.date}</p>
                            </div>
                        </div>
                        <form onSubmit={handleManualBooking} className="p-8 space-y-6 bg-white">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patient Name</Label>
                                    <Input
                                        required
                                        value={manualBookingData.name}
                                        onChange={e => setManualBookingData({ ...manualBookingData, name: e.target.value })}
                                        className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">MyKad / IC</Label>
                                        <Input
                                            required
                                            value={manualBookingData.ic}
                                            onChange={e => setManualBookingData({ ...manualBookingData, ic: e.target.value })}
                                            className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                            placeholder="XXXXXX-XX-XXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone</Label>
                                        <Input
                                            required
                                            value={manualBookingData.phone}
                                            onChange={e => setManualBookingData({ ...manualBookingData, phone: e.target.value })}
                                            className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                            placeholder="+60123456789"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patient Type</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            type="button"
                                            variant={manualBookingData.type === 'existing' ? 'default' : 'outline'}
                                            onClick={() => setManualBookingData({ ...manualBookingData, type: 'existing' })}
                                            className="rounded-xl h-10 font-bold text-xs"
                                        >Existing</Button>
                                        <Button
                                            type="button"
                                            variant={manualBookingData.type === 'new' ? 'default' : 'outline'}
                                            onClick={() => setManualBookingData({ ...manualBookingData, type: 'new' })}
                                            className="rounded-xl h-10 font-bold text-xs"
                                        >New Patient</Button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsBookingDialogOpen(false)}
                                    className="flex-1 h-12 rounded-2xl font-black text-slate-400"
                                >Cancel</Button>
                                <Button
                                    type="submit"
                                    className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black shadow-xl shadow-blue-100"
                                >Confirm Booking</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    )
}

