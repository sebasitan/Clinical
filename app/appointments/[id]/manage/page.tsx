"use client"

import { useState, useEffect, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Calendar,
    Clock,
    User,
    XCircle,
    RefreshCcw,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    Phone,
    MapPin,
    ShieldCheck,
    ArrowRight,
    Smile
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { LoadingScreen } from "@/components/ui/loading-screen"
import type { Appointment, Doctor, Slot, TimeSlot, DoctorWeeklySchedule, DayOfWeek } from "@/lib/types"
import { getDoctorsAsync, getSlotsAsync, getDoctorScheduleAsync } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { CalendarDatePickerContent } from "@/components/ui/calendar-date-picker"

export default function ManageAppointmentPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise)
    const [appointment, setAppointment] = useState<Appointment | null>(null)
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isVerified, setIsVerified] = useState(false)
    const [verificationInput, setVerificationInput] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)

    // Reschedule states
    const [isRescheduling, setIsRescheduling] = useState(false)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [selectedDate, setSelectedDate] = useState("")
    const [doctorSchedule, setDoctorSchedule] = useState<DoctorWeeklySchedule | null>(null)
    const [dailySlots, setDailySlots] = useState<Slot[]>([])
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { toast } = useToast()

    useEffect(() => {
        loadAppointment()
    }, [params.id])

    const loadAppointment = async () => {
        try {
            const res = await fetch(`/api/appointments/${params.id}`)
            if (!res.ok) throw new Error("Appointment not found")
            const data = await res.json()
            setAppointment(data)

            // Load doctor info
            const docs = await getDoctorsAsync()
            const doc = docs.find(d => d.id === data.doctorId)
            if (doc) setDoctor(doc)
            setDoctors(docs)
        } catch (e) {
            console.error(e)
            toast({ title: "Error", description: "Could not load appointment details.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = () => {
        if (!appointment) return
        setIsVerifying(true)

        // Simple verification: IC or last 4 digits of phone
        const input = verificationInput.trim()
        if (input === appointment.patientIC || input === appointment.patientPhone || appointment.patientPhone.endsWith(input)) {
            setTimeout(() => {
                setIsVerified(true)
                setIsVerifying(false)
            }, 800)
        } else {
            toast({ title: "Verification Failed", description: "The information provided does not match our records.", variant: "destructive" })
            setIsVerifying(false)
        }
    }

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this appointment? This action cannot be undone.")) return

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/appointments/${params.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' })
            })

            if (res.ok) {
                toast({ title: "Appointment Cancelled", description: "Your appointment has been successfully cancelled and the time slot is now available." })
                loadAppointment()
            } else {
                throw new Error("Cancellation failed")
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to cancel appointment. Please contact the clinic.", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Fetch doctor schedule and slots when rescheduling
    useEffect(() => {
        if (isRescheduling && appointment?.doctorId) {
            getDoctorScheduleAsync(appointment.doctorId).then(setDoctorSchedule)
        }
    }, [isRescheduling, appointment?.doctorId])

    useEffect(() => {
        if (isRescheduling && appointment?.doctorId && selectedDate) {
            getSlotsAsync(appointment.doctorId, selectedDate).then(setDailySlots)
        }
    }, [isRescheduling, appointment?.doctorId, selectedDate])

    const handleReschedule = async () => {
        if (!selectedTimeSlot || !selectedDate) return

        const slot = dailySlots.find(s => s.timeRange === selectedTimeSlot)
        if (!slot) return

        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/appointments/${params.id}/reschedule`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newSlotId: slot.id,
                    newDate: selectedDate,
                    newTimeSlot: selectedTimeSlot
                })
            })

            if (res.ok) {
                toast({ title: "Appointment Rescheduled", description: "Your appointment has been moved to the new time slot." })
                setIsRescheduling(false)
                setSelectedDate("")
                setSelectedTimeSlot("")
                loadAppointment()
            } else {
                const data = await res.json()
                throw new Error(data.error || "Rescheduling failed")
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <div className="min-h-screen bg-slate-50"><LoadingScreen message="Accessing Appointment Gateway..." /></div>

    if (!appointment) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Appointment Not Found</h1>
                <p className="text-slate-500 mt-2">The link might be expired or the appointment ID is invalid.</p>
                <Button variant="ghost" className="mt-8 font-bold" onClick={() => window.location.href = '/'}>Go to Homepage</Button>
            </div>
        )
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-200">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Identity Verification</h1>
                        <p className="text-slate-500 mt-2">For your security, please verify your identity to manage this appointment.</p>
                    </div>

                    <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm IC or Phone Number</label>
                                <Input
                                    placeholder="Enter your IC or Phone..."
                                    value={verificationInput}
                                    onChange={(e) => setVerificationInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:ring-4 focus:ring-blue-100 transition-all text-center text-lg font-bold"
                                />
                            </div>
                            <Button
                                onClick={handleVerify}
                                disabled={!verificationInput || isVerifying}
                                className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200"
                            >
                                {isVerifying ? "Verifying Access..." : "Secure Access"}
                            </Button>
                            <p className="text-[10px] text-center text-slate-400 font-medium">Verified using the information provided during booking.</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <Smile className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-900">KPS Pergigian</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'}>Home</Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 max-w-4xl">
                <AnimatePresence mode="wait">
                    {!isRescheduling ? (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <div className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-4",
                                        appointment.status === 'pending' ? "bg-amber-100 text-amber-700" :
                                            appointment.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                                                "bg-slate-100 text-slate-600"
                                    )}>
                                        <div className={cn("w-1.5 h-1.5 rounded-full",
                                            appointment.status === 'pending' ? "bg-amber-500 animate-pulse" :
                                                appointment.status === 'confirmed' ? "bg-emerald-500" :
                                                    "bg-slate-400"
                                        )} />
                                        {appointment.status} Appointment
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Manage Visit</h1>
                                    <p className="text-slate-500 text-lg mt-2">Review your details or make changes if needed.</p>
                                </div>
                            </div>

                            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[3rem] overflow-hidden bg-white">
                                <CardContent className="p-0">
                                    <div className="grid md:grid-cols-2">
                                        <div className="p-10 border-b md:border-b-0 md:border-r border-slate-50">
                                            <div className="space-y-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center relative shadow-inner">
                                                        {doctor?.photo ? (
                                                            <img src={doctor.photo} className="w-full h-full object-cover rounded-3xl" />
                                                        ) : (
                                                            <User className="w-8 h-8 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Doctor</p>
                                                        <h3 className="text-xl font-bold text-slate-900">{doctor?.name || 'Assigned Specialist'}</h3>
                                                        <p className="text-sm font-medium text-blue-600">{doctor?.specialization}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-4 text-slate-700">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                            <Calendar className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                                            <p className="font-bold text-lg">{new Date(appointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-slate-700">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                            <Clock className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Slot</p>
                                                            <p className="font-bold text-lg">{appointment.timeSlot}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-10 bg-slate-50/30 flex flex-col justify-between gap-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinic Contact</p>
                                                        <p className="font-bold">+60 17-510 1003</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                                        <p className="font-bold">Taman Sri Rampai, KL</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {appointment.status !== 'cancelled' ? (
                                                <div className="grid grid-cols-1 gap-4">
                                                    <Button
                                                        onClick={() => setIsRescheduling(true)}
                                                        className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-3 shadow-xl shadow-slate-200"
                                                    >
                                                        <RefreshCcw className="w-4 h-4" />
                                                        Reschedule Appointment
                                                    </Button>
                                                    <Button
                                                        onClick={handleCancel}
                                                        variant="outline"
                                                        className="h-14 rounded-2xl border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 font-bold gap-3"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Cancel Appointment
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-center">
                                                    <p className="text-rose-700 font-bold">This appointment is cancelled</p>
                                                    <p className="text-rose-600/70 text-xs mt-1">If you need a new one, please book again.</p>
                                                    <Button variant="link" className="text-rose-700 font-black uppercase text-[10px] mt-2 underline" onClick={() => window.location.href = '/booking'}>Book New Session</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="reschedule"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <Button
                                    onClick={() => setIsRescheduling(false)}
                                    variant="ghost"
                                    className="rounded-xl gap-2 text-slate-500 font-bold hover:bg-white"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Overview
                                </Button>
                            </div>

                            <div className="flex flex-col mb-8">
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Choose New Time</h1>
                                <p className="text-slate-500 text-lg mt-2">Select an alternative slot for your treatment.</p>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-8 items-start">
                                {/* Date Selection */}
                                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white border border-slate-100">
                                    <CardContent className="p-6">
                                        <CalendarDatePickerContent
                                            date={selectedDate ? new Date(selectedDate) : undefined}
                                            onDateSelect={(date) => {
                                                if (date) {
                                                    const year = date.getFullYear();
                                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                                    const day = String(date.getDate()).padStart(2, '0');
                                                    setSelectedDate(`${year}-${month}-${day}`);
                                                }
                                            }}
                                            calendarProps={{
                                                fromDate: new Date(),
                                                disabled: (date: Date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    if (date < today) return true;

                                                    if (doctorSchedule) {
                                                        const dayNames: DayOfWeek[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                                                        const dayName = dayNames[date.getDay()];
                                                        const daySchedule = doctorSchedule.days[dayName];
                                                        return !daySchedule || daySchedule.length === 0;
                                                    }
                                                    return date.getDay() === 0;
                                                }
                                            }}
                                        />
                                    </CardContent>
                                </Card>

                                {/* Time Selection */}
                                <div className="space-y-6">
                                    {!selectedDate ? (
                                        <div className="h-[400px] border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10 bg-slate-50/50">
                                            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                                            <p className="text-slate-400 font-bold">Please select a date first</p>
                                        </div>
                                    ) : (
                                        <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                                            <CardContent className="p-8">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Clock className="w-5 h-5 text-blue-600" />
                                                    <h3 className="font-bold text-slate-900">Available Slots</h3>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {dailySlots.length === 0 ? (
                                                        <p className="col-span-2 text-center py-10 text-slate-400 italic">No slots available for this day.</p>
                                                    ) : (
                                                        dailySlots.map((slot) => (
                                                            <button
                                                                key={slot.id}
                                                                disabled={slot.status !== 'available'}
                                                                onClick={() => setSelectedTimeSlot(slot.timeRange)}
                                                                className={cn(
                                                                    "h-14 rounded-2xl flex items-center justify-center text-sm font-bold transition-all border",
                                                                    slot.status !== 'available' ? "bg-slate-50 text-slate-300 border-none cursor-not-allowed opacity-50" :
                                                                        selectedTimeSlot === slot.timeRange ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200 scale-105" :
                                                                            "bg-white border-slate-100 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                                                                )}
                                                            >
                                                                {slot.timeRange.split(' - ')[0]}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>

                                                <Button
                                                    onClick={handleReschedule}
                                                    disabled={!selectedTimeSlot || isSubmitting}
                                                    className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold mt-8 text-lg shadow-xl shadow-blue-100 gap-3"
                                                >
                                                    {isSubmitting ? "Updating Appointment..." : "Confirm New Time"}
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}
