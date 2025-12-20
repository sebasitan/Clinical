"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import {
    getDoctorsAsync,
    updateDoctorAsync,
    getDoctorScheduleAsync,
    saveDoctorScheduleAsync,
    getDoctorLeavesAsync,
    addDoctorLeaveAsync,
    deleteDoctorLeaveAsync,
    getAppointmentsAsync,
    getSlotsAsync,
    regenerateDoctorSlotsAsync,
    updateAppointmentStatusAsync,
    updateSlotStatusAsync
} from "@/lib/storage"
import type { Doctor, DoctorWeeklySchedule, DayOfWeek, ScheduleTimeRange, DoctorLeave, Appointment, Slot } from "@/lib/types"
import {
    ArrowLeft,
    Calendar,
    Clock,
    Plus,
    Trash2,
    User,
    Activity,
    ShieldCheck,
    ShieldAlert,
    Save,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Briefcase,
    Stethoscope,
    Filter,
    ShieldX,
    Lock,
    Unlock,
    Ban
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function DoctorManagementPage() {
    const { id } = useParams()
    const router = useRouter()
    const { isLoading: authLoading } = useAdminAuth()
    const { toast } = useToast()

    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [schedule, setSchedule] = useState<DoctorWeeklySchedule | null>(null)
    const [leaves, setLeaves] = useState<DoctorLeave[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [slots, setSlots] = useState<Slot[]>([])
    const [activeTab, setActiveTab] = useState("booked")
    const [selectedPatientIC, setSelectedPatientIC] = useState<string | null>(null)
    const [patientHistory, setPatientHistory] = useState<Appointment[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0])
    const [isBlocking, setIsBlocking] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
    const [cancelReason, setCancelReason] = useState("")

    // Form states
    const [newLeave, setNewLeave] = useState<{
        date: string,
        type: "full" | "partial",
        startTime: string,
        endTime: string,
        reason: string
    }>({
        date: "",
        type: "full",
        startTime: "09:00",
        endTime: "17:00",
        reason: ""
    })

    useEffect(() => {
        if (id) {
            loadDoctorData(id as string)
        }
    }, [id])

    const loadDoctorData = async (docId: string) => {
        const [docs, apts, drSlots, drSchedule, drLeaves] = await Promise.all([
            getDoctorsAsync(),
            getAppointmentsAsync(),
            getSlotsAsync(docId),
            getDoctorScheduleAsync(docId),
            getDoctorLeavesAsync(docId)
        ])

        const doc = docs.find(d => d.id === docId)
        if (!doc) {
            router.push("/admin/doctors")
            return
        }
        setDoctor(doc)
        setSchedule(drSchedule || { doctorId: docId, days: {} })
        setLeaves(drLeaves)
        setAppointments(apts.filter(a => a.doctorId === docId))
        setSlots(drSlots)
    }

    const handleUpdateDoctor = async (updates: Partial<Doctor>) => {
        if (!doctor) return
        try {
            await updateDoctorAsync(doctor.id, updates)
            setDoctor({ ...doctor, ...updates })
            toast({ title: "Doctor updated successfully" })
            // If availability or slot duration changed, regenerate slots
            if ("isAvailable" in updates || "isActive" in updates || "slotDuration" in updates) {
                await regenerateDoctorSlotsAsync(doctor.id)
                const freshSlots = await getSlotsAsync(doctor.id)
                setSlots(freshSlots)
            }
        } catch (error: any) {
            toast({ title: "Update failed", variant: "destructive" })
        }
    }

    const handleSaveSchedule = async () => {
        if (!schedule || !doctor) return
        try {
            await saveDoctorScheduleAsync(schedule)
            await regenerateDoctorSlotsAsync(doctor.id)
            toast({ title: "Weekly schedule saved" })
            const freshSlots = await getSlotsAsync(doctor.id)
            setSlots(freshSlots)
        } catch (error: any) {
            toast({ title: "Failed to save schedule", variant: "destructive" })
        }
    }

    const addTimeRange = (day: DayOfWeek) => {
        if (!schedule) return
        const currentDays = { ...schedule.days }
        const currentDayRanges = currentDays[day] || []
        currentDays[day] = [...currentDayRanges, { start: "09:00", end: "13:00" }]
        setSchedule({ ...schedule, days: currentDays })
    }

    const removeTimeRange = (day: DayOfWeek, index: number) => {
        if (!schedule) return
        const currentDays = { ...schedule.days }
        const currentDayRanges = [...(currentDays[day] || [])]
        currentDayRanges.splice(index, 1)
        currentDays[day] = currentDayRanges
        setSchedule({ ...schedule, days: currentDays })
    }

    const updateTimeRange = (day: DayOfWeek, index: number, field: "start" | "end", value: string) => {
        if (!schedule || !doctor) return
        const currentDays = { ...schedule.days }
        const currentDayRanges = [...(currentDays[day] || [])]

        let updatedRange = { ...currentDayRanges[index], [field]: value }

        // If start time is updated, auto-fill end time based on doctor.slotDuration
        if (field === "start" && doctor.slotDuration) {
            const [h, m] = value.split(':').map(Number)
            const date = new Date()
            date.setHours(h, m + doctor.slotDuration)
            const endH = date.getHours().toString().padStart(2, '0')
            const endM = date.getMinutes().toString().padStart(2, '0')
            updatedRange.end = `${endH}:${endM}`
        }

        currentDayRanges[index] = updatedRange
        currentDays[day] = currentDayRanges
        setSchedule({ ...schedule, days: currentDays })
    }

    const handleAddLeave = async () => {
        if (!doctor || !newLeave.date) return
        try {
            await addDoctorLeaveAsync({
                doctorId: doctor.id,
                date: newLeave.date,
                type: newLeave.type,
                startTime: newLeave.type === "partial" ? newLeave.startTime : undefined,
                endTime: newLeave.type === "partial" ? newLeave.endTime : undefined,
                reason: newLeave.reason
            })
            const [freshLeaves, freshSlots] = await Promise.all([
                getDoctorLeavesAsync(doctor.id),
                getSlotsAsync(doctor.id)
            ])
            setLeaves(freshLeaves)
            setSlots(freshSlots)
            setNewLeave({ date: "", type: "full", startTime: "09:00", endTime: "17:00", reason: "" })
            toast({ title: "Leave recorded" })
        } catch (e) {
            toast({ title: "Failed to add leave", variant: "destructive" })
        }
    }

    const handleDeleteLeave = async (leaveId: string) => {
        if (!doctor) return
        try {
            await deleteDoctorLeaveAsync(doctor.id, leaveId)
            const [freshLeaves, freshSlots] = await Promise.all([
                getDoctorLeavesAsync(doctor.id),
                getSlotsAsync(doctor.id)
            ])
            setLeaves(freshLeaves)
            setSlots(freshSlots)
            toast({ title: "Leave removed" })
        } catch (e) {
            toast({ title: "Failed to remove leave", variant: "destructive" })
        }
    }

    const handleBlockSlot = async (slot: Slot, reason: string) => {
        try {
            await updateSlotStatusAsync(slot.id, 'blocked', reason)
            toast({ title: "Slot Blocked" })
            loadDoctorData(doctor?.id!)
            setIsBlocking(false)
            setSelectedSlot(null)
            setCancelReason("")
        } catch (e) {
            toast({ title: "Failed to block", variant: "destructive" })
        }
    }

    const handleUnblockSlot = async (slotId: string) => {
        try {
            await updateSlotStatusAsync(slotId, 'available')
            toast({ title: "Slot Unblocked" })
            loadDoctorData(doctor?.id!)
        } catch (e) {
            toast({ title: "Failed to unblock", variant: "destructive" })
        }
    }

    const handleCancelAppointment = async (appointmentId: string, slotId: string, reason: string) => {
        try {
            await fetch(`/api/appointments/${appointmentId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            })
            toast({ title: "Appointment Cancelled" })
            loadDoctorData(doctor?.id!)
            setIsCancelling(false)
            setSelectedSlot(null)
            setCancelReason("")
        } catch (e) {
            toast({ title: "Failed to cancel", variant: "destructive" })
        }
    }

    const handleViewHistory = (ic: string) => {
        const history = appointments.filter((a: Appointment) => a.patientIC === ic)
        setPatientHistory(history)
        setSelectedPatientIC(ic)
        setIsHistoryOpen(true)
    }

    const [patientSearch, setPatientSearch] = useState("")

    // ... handleViewHistory ...

    const filteredPatients = Array.from(new Set(appointments.map(a => a.patientIC)))
        .filter(ic => {
            const apt = appointments.find(a => a.patientIC === ic)
            if (!apt) return false
            return apt.patientName.toLowerCase().includes(patientSearch.toLowerCase()) ||
                apt.patientIC.toLowerCase().includes(patientSearch.toLowerCase())
        })
    if (authLoading || !doctor) return null

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/doctors")} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 rounded-xl border-2 border-slate-100">
                                <AvatarImage src={doctor.photo} />
                                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{doctor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">{doctor.name}</h1>
                                <p className="text-xs text-slate-500 font-medium">{doctor.specialization}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Availability</p>
                            <Switch
                                checked={doctor.isAvailable}
                                onCheckedChange={(val) => handleUpdateDoctor({ isAvailable: val })}
                            />
                        </div>
                        <Button
                            onClick={handleSaveSchedule}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-bold px-6 shadow-lg shadow-blue-100"
                        >
                            <Save className="w-4 h-4" />
                            Save All Changes
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Stats & Settings */}
                <div className="space-y-8">
                    {/* Status Card */}
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${doctor.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">Registry Status</p>
                                        <p className="text-[10px] text-slate-500 font-medium">{doctor.isActive ? 'Active & Verified' : 'Currently Disabled'}</p>
                                    </div>
                                </div>
                                <Switch checked={doctor.isActive} onCheckedChange={(val) => handleUpdateDoctor({ isActive: val })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Slots</p>
                                    <p className="text-2xl font-bold text-blue-900">{slots.length}</p>
                                </div>
                                <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Bookings</p>
                                    <p className="text-2xl font-bold text-purple-900">{appointments.length}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slot Duration</Label>
                                <Select
                                    value={doctor.slotDuration.toString()}
                                    onValueChange={(val) => handleUpdateDoctor({ slotDuration: parseInt(val) as 10 | 15 | 20 | 30 })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:ring-blue-100">
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 Minutes</SelectItem>
                                        <SelectItem value="15">15 Minutes</SelectItem>
                                        <SelectItem value="20">20 Minutes</SelectItem>
                                        <SelectItem value="30">30 Minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-slate-400 text-center italic">Changes will automatically regenerate upcoming slots.</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Card */}
                    <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                                    <p className="text-sm font-bold text-slate-900">{doctor.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                    <p className="text-sm font-bold text-slate-900">{doctor.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Tabs */}
                <div className="lg:col-span-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-8 h-14 overflow-x-auto scrollbar-hide">
                            <TabsTrigger value="schedule" className="px-6 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold h-full">
                                <Clock className="w-4 h-4 mr-2" />
                                Weekly Schedule
                            </TabsTrigger>
                            <TabsTrigger value="leaves" className="px-6 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold h-full">
                                <Calendar className="w-4 h-4 mr-2" />
                                Leaves & Blocks
                            </TabsTrigger>
                            <TabsTrigger value="booked" className="px-6 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold h-full">
                                <Activity className="w-4 h-4 mr-2" />
                                Manage & Bookings
                            </TabsTrigger>
                            <TabsTrigger value="patients" className="px-6 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold h-full">
                                <User className="w-4 h-4 mr-2" />
                                Patient Registry
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="schedule" className="space-y-6 outline-none">
                            <div className="grid gap-6">
                                {DAYS.map(day => (
                                    <Card key={day} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
                                            <div className="min-w-[120px]">
                                                <h3 className="text-lg font-bold text-slate-900">{day}</h3>
                                                <Badge variant="outline" className={`mt-1 border-none px-0 ${schedule?.days[day]?.length ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                    {schedule?.days[day]?.length ? 'Working Day' : 'Weekend / Off'}
                                                </Badge>
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                {schedule?.days[day]?.map((range, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 group/range">
                                                        <Input
                                                            type="time"
                                                            value={range.start}
                                                            onChange={(e) => updateTimeRange(day, idx, "start", e.target.value)}
                                                            className="h-10 rounded-xl bg-white border-slate-200"
                                                        />
                                                        <span className="text-slate-400 font-bold">to</span>
                                                        <Input
                                                            type="time"
                                                            value={range.end}
                                                            onChange={(e) => updateTimeRange(day, idx, "end", e.target.value)}
                                                            className="h-10 rounded-xl bg-white border-slate-200"
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeTimeRange(day, idx)}
                                                            className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {(!schedule?.days[day] || schedule.days[day]!.length === 0) && (
                                                    <p className="text-xs text-slate-400 italic">No working hours defined for this day.</p>
                                                )}
                                            </div>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addTimeRange(day)}
                                                className="h-10 rounded-xl border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 gap-2"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Add Hours
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="leaves" className="space-y-8 outline-none">
                            {/* Add Leave Form */}
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Record Absence or Emergency</CardTitle>
                                            <CardDescription>All affected slots will be instantly blocked for booking.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Date</Label>
                                            <Input
                                                type="date"
                                                value={newLeave.date}
                                                onChange={e => setNewLeave({ ...newLeave, date: e.target.value })}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type</Label>
                                            <Select value={newLeave.type} onValueChange={v => setNewLeave({ ...newLeave, type: v as any })}>
                                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="full">Full Day Leave</SelectItem>
                                                    <SelectItem value="partial">Partial / Emergency Blocks</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {newLeave.type === "partial" && (
                                        <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-600">Start Hour</Label>
                                                <Input
                                                    type="time"
                                                    value={newLeave.startTime}
                                                    onChange={e => setNewLeave({ ...newLeave, startTime: e.target.value })}
                                                    className="h-10 rounded-xl bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-slate-600">End Hour</Label>
                                                <Input
                                                    type="time"
                                                    value={newLeave.endTime}
                                                    onChange={e => setNewLeave({ ...newLeave, endTime: e.target.value })}
                                                    className="h-10 rounded-xl bg-white"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason (Optional)</Label>
                                        <Input
                                            placeholder="Emergency dental seminar / Personal leave"
                                            value={newLeave.reason}
                                            onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                        />
                                    </div>

                                    <Button
                                        onClick={handleAddLeave}
                                        disabled={!newLeave.date}
                                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-100 transition-all"
                                    >
                                        Confirm and Block Slots
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Leaves List */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-4">Active Leave Records</h3>
                                {leaves.length === 0 ? (
                                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-100">
                                        <p className="text-slate-400 font-medium">No leave records found for this doctor.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {leaves.map(leave => (
                                            <div key={leave.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <p className="text-[10px] font-black uppercase text-slate-400">{new Date(leave.date).toLocaleString('default', { month: 'short' })}</p>
                                                        <p className="text-lg font-bold text-slate-900">{new Date(leave.date).getDate()}</p>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-slate-900">{leave.type === 'full' ? 'Full Day' : 'Partial Hours'}</p>
                                                            <Badge className={leave.type === 'full' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}>
                                                                {leave.type}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                            {leave.startTime ? `${leave.startTime} - ${leave.endTime}` : 'All Day'} • {leave.reason || 'No reason provided'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteLeave(leave.id)}
                                                    className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="booked" className="space-y-6 outline-none">
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="flex flex-row items-center justify-between pb-8">
                                    <div>
                                        <CardTitle>Daily Presence & Bookings</CardTitle>
                                        <CardDescription>Review and manage availability and appointments for a specific day.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            <Input
                                                type="date"
                                                value={viewDate}
                                                onChange={e => setViewDate(e.target.value)}
                                                className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs"
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-50">
                                        {slots.filter(s => s.date === viewDate).length === 0 ? (
                                            <div className="py-20 text-center opacity-40">
                                                <Filter className="h-12 w-12 mx-auto mb-4" />
                                                <p className="font-bold">No slots found for this date</p>
                                                <p className="text-xs">Slots are generated based on the weekly schedule.</p>
                                            </div>
                                        ) : (
                                            [...slots]
                                                .filter(s => s.date === viewDate)
                                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                .map(slot => {
                                                    const apt = appointments.find(a => a.id === slot.appointmentId && a.appointmentDate === viewDate);

                                                    return (
                                                        <div key={slot.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                                            <div className="flex items-center gap-6">
                                                                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-900 shrink-0">
                                                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Time</span>
                                                                    <span className="text-xs font-black">{slot.startTime}</span>
                                                                </div>

                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <p className="font-bold text-slate-900">
                                                                            {apt ? apt.patientName : slot.status === 'blocked' ? slot.blockReason || 'Emergency Block' : 'Available for Booking'}
                                                                        </p>
                                                                        <Badge className={`
                                                                        text-[8px] font-black uppercase tracking-widest px-2
                                                                        ${slot.status === 'available' ? 'bg-emerald-50 text-emerald-600' : ''}
                                                                        ${slot.status === 'booked' ? 'bg-blue-50 text-blue-600' : ''}
                                                                        ${slot.status === 'blocked' ? 'bg-orange-50 text-orange-600' : ''}
                                                                    `}>
                                                                            {slot.status} {apt?.status === 'completed' ? '• COMPLETED' : ''}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                        {apt ? (
                                                                            <>
                                                                                <span>{apt.patientIC}</span>
                                                                                <span>•</span>
                                                                                <span>{apt.patientPhone}</span>
                                                                            </>
                                                                        ) : (
                                                                            <span>{doctor?.slotDuration} Minutes Duration</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                {slot.status === 'available' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => { setSelectedSlot(slot); setIsBlocking(true); }}
                                                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                                                                    >
                                                                        <Ban className="w-3 h-3 mr-2" />
                                                                        Block
                                                                    </Button>
                                                                )}

                                                                {slot.status === 'blocked' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleUnblockSlot(slot.id)}
                                                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50"
                                                                    >
                                                                        <Unlock className="w-3 h-3 mr-2" />
                                                                        Unblock
                                                                    </Button>
                                                                )}

                                                                {slot.status === 'booked' && apt && apt.status === 'confirmed' && (
                                                                    <>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={async () => {
                                                                                try {
                                                                                    await updateAppointmentStatusAsync(apt.id, 'completed')
                                                                                    toast({ title: "Appointment Completed" })
                                                                                    loadDoctorData(doctor?.id!)
                                                                                } catch (e) {
                                                                                    toast({ title: "Failed to update", variant: "destructive" })
                                                                                }
                                                                            }}
                                                                            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                                                        >
                                                                            <CheckCircle2 className="w-3 h-3 mr-2" />
                                                                            Complete
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => { setSelectedSlot(slot); setIsCancelling(true); }}
                                                                            className="h-9 w-9 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Block Slot Dialog */}
                            <Dialog open={isBlocking} onOpenChange={setIsBlocking}>
                                <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
                                    <div className="bg-orange-500 p-8 text-white">
                                        <Ban className="w-12 h-12 mb-4 opacity-50" />
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Block this Slot?</DialogTitle>
                                        <DialogDescription className="text-orange-100 font-medium">Blocking this slot will prevent patients from booking it on {viewDate} at {selectedSlot?.startTime}.</DialogDescription>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason (Optional)</Label>
                                            <Input
                                                placeholder="e.g. Personal Break, Equipment Maintenance"
                                                value={cancelReason}
                                                onChange={e => setCancelReason(e.target.value)}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="ghost" onClick={() => setIsBlocking(false)} className="flex-1 h-12 rounded-xl font-bold">Discard</Button>
                                            <Button onClick={() => handleBlockSlot(selectedSlot!, cancelReason)} className="flex-2 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold shadow-lg shadow-orange-100">Confirm Block</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            {/* Cancel Appointment Dialog */}
                            <Dialog open={isCancelling} onOpenChange={setIsCancelling}>
                                <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
                                    <div className="bg-rose-600 p-8 text-white">
                                        <Trash2 className="w-12 h-12 mb-4 opacity-50" />
                                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Cancel Appointment?</DialogTitle>
                                        <DialogDescription className="text-rose-100 font-medium">This will notify the patient and free up the {selectedSlot?.startTime} slot for other bookings.</DialogDescription>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cancellation Reason</Label>
                                            <Input
                                                placeholder="e.g. Doctor Unavailable, Patient Requested"
                                                value={cancelReason}
                                                onChange={e => setCancelReason(e.target.value)}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="ghost" onClick={() => setIsCancelling(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-500">Keep Booking</Button>
                                            <Button onClick={() => handleCancelAppointment(selectedSlot?.appointmentId!, selectedSlot?.id!, cancelReason)} className="flex-2 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100">Cancel Booking</Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </TabsContent>

                        <TabsContent value="patients" className="space-y-6 outline-none">
                            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Assigned Patient Registry</CardTitle>
                                            <CardDescription>Patients who have clinical history with this provider.</CardDescription>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <Input
                                                placeholder="Search patients..."
                                                value={patientSearch}
                                                onChange={(e) => setPatientSearch(e.target.value)}
                                                className="pl-10 h-10 w-64 rounded-xl bg-slate-50 border-none"
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-50">
                                        {filteredPatients.map(ic => {
                                            const apt = appointments.find(a => a.patientIC === ic)
                                            if (!apt) return null
                                            return (
                                                <div key={ic} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                                            {apt.patientName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{apt.patientName}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{apt.patientIC} • {apt.patientPhone}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewHistory(ic)}
                                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                                                    >
                                                        View History
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                        {appointments.length === 0 && (
                                            <div className="py-20 text-center text-slate-400 font-medium italic">No patients found in this registry.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-slate-900 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Activity className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Clinical History</DialogTitle>
                                <DialogDescription className="text-slate-400 font-medium">Record of all past and upcoming encounters.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
                        {patientHistory.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 italic">No historical records found.</div>
                        ) : (
                            <div className="space-y-4">
                                {patientHistory.slice().reverse().map(apt => (
                                    <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{apt.timeSlot}</p>
                                            </div>
                                        </div>
                                        <Badge className={`
                                            px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none
                                            ${apt.status === 'confirmed' ? 'bg-blue-100 text-blue-600' : ''}
                                            ${apt.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : ''}
                                            ${apt.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : ''}
                                            ${apt.status === 'no-show' ? 'bg-slate-100 text-slate-400' : ''}
                                        `}>
                                            {apt.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
