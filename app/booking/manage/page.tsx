"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import {
    getPatientAppointmentsByPhoneAsync,
    updateAppointmentStatusAsync,
    getDoctorsAsync,
    getSlotsAsync,
    rescheduleAppointmentAsync
} from "@/lib/storage"
import {
    Calendar,
    Clock,
    User,
    Phone,
    Shield,
    Trash2,
    RefreshCcw,
    ChevronLeft,
    AlertCircle,
    CheckCircle2,
    CalendarDays,
    ArrowRight,
    MapPin,
    Stethoscope,
    Users
} from "lucide-react"
import type { Appointment, Doctor, Slot } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp"
import { CalendarDatePickerContent } from "@/components/ui/calendar-date-picker"

export default function ManageBookingPage() {
    const router = useRouter()
    const { toast } = useToast()

    // Auth & OTP State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [phone, setPhone] = useState("")
    const [otp, setOtp] = useState("")
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)

    // Data State
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [isNoBookingDialogOpen, setIsNoBookingDialogOpen] = useState(false)

    // Reschedule State
    const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [selectedDate, setSelectedDate] = useState("")
    const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
    const [isRescheduling, setIsRescheduling] = useState(false)

    useEffect(() => {
        if (reschedulingApt) {
            loadDoctors()
        }
    }, [reschedulingApt])

    useEffect(() => {
        if (reschedulingApt && selectedDate) {
            loadSlots()
        }
    }, [reschedulingApt, selectedDate])

    const loadDoctors = async () => {
        const docs = await getDoctorsAsync()
        setDoctors(docs)
    }

    const loadSlots = async () => {
        if (!reschedulingApt) return
        const slots = await getSlotsAsync(reschedulingApt.doctorId, selectedDate)
        setAvailableSlots(slots)
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone) return
        setIsLoading(true)
        try {
            // 1. First check if any appointments exist for this phone
            const apts = await getPatientAppointmentsByPhoneAsync(phone)

            if (apts.length === 0) {
                setIsNoBookingDialogOpen(true)
                setIsLoading(false)
                return
            }

            // 2. If appointments exist, send OTP
            const res = await fetch('/api/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            })
            if (res.ok) {
                setShowOtpInput(true)
                toast({ title: "OTP Sent", description: "Verification code sent to your mobile." })
            } else {
                const data = await res.json()
                throw new Error(data.error || "Failed to send OTP")
            }
        } catch (error: any) {
            // Demo mode fallback if API fails but we found records
            setShowOtpInput(true)
            toast({ title: "OTP Sent (Demo)", description: "Use code 123456 to continue." })
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        setIsVerifying(true)
        try {
            // Demo short-circuit
            if (otp === "123456") {
                await fetchAppointments()
                return
            }

            const res = await fetch('/api/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: otp })
            })

            if (res.ok) {
                await fetchAppointments()
            } else {
                toast({ title: "Invalid code", variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Verification failed", variant: "destructive" })
        } finally {
            setIsVerifying(false)
        }
    }

    const fetchAppointments = async () => {
        const apts = await getPatientAppointmentsByPhoneAsync(phone)
        setAppointments(apts)
        setIsAuthenticated(true)
        toast({ title: "Verified", description: "Access granted to your bookings." })
    }

    const handleCancel = async () => {
        if (!cancellingId) return
        setIsLoading(true)
        try {
            await updateAppointmentStatusAsync(cancellingId, 'cancelled')
            setAppointments(prev => prev.map(a =>
                a.id === cancellingId ? { ...a, status: 'cancelled' } : a
            ))
            toast({ title: "Appointment Cancelled" })
            setIsCancelDialogOpen(false)
            setCancellingId(null)
        } catch (error) {
            toast({ title: "Cancellation failed", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleReschedule = async () => {
        if (!reschedulingApt || !selectedSlot) return
        setIsRescheduling(true)
        try {
            await rescheduleAppointmentAsync(
                reschedulingApt.id,
                selectedSlot.id,
                selectedDate,
                selectedSlot.timeRange
            )

            // Refresh
            const apts = await getPatientAppointmentsByPhoneAsync(phone)
            setAppointments(apts)

            toast({ title: "Rescheduled successfully" })
            setReschedulingApt(null)
            setSelectedSlot(null)
            setSelectedDate("")
        } catch (error: any) {
            toast({ title: "Reschedule failed", description: error.message, variant: "destructive" })
        } finally {
            setIsRescheduling(false)
        }
    }

    const sortedAppointments = [...appointments].sort((a, b) =>
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    )

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto mb-8 text-center">
                <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Bookings</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage your upcoming dental visits</p>
            </div>

            <div className="max-w-3xl mx-auto">
                {!isAuthenticated ? (
                    <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                        <CardHeader className="bg-slate-900 text-white p-8">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Patient Portal</CardTitle>
                            <CardDescription className="text-slate-400 font-medium">
                                Secure access to your medical bookings via mobile verification.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            {!showOtpInput ? (
                                <form onSubmit={handleSendOtp} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Mobile Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                                            <Input
                                                required
                                                type="tel"
                                                placeholder="Example: +60123456789"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold text-slate-900 focus:bg-white transition-all underline-none"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isLoading || !phone}
                                        className="w-full h-12 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {isLoading ? "Messaging..." : (
                                            <>
                                                Send Verification Code
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <div className="space-y-8 py-2">
                                    <div className="text-center space-y-2">
                                        <p className="text-sm font-bold text-slate-900">Enter 6-digit code</p>
                                        <p className="text-xs text-slate-500">Sent to <span className="text-slate-900 font-bold">{phone}</span></p>
                                    </div>

                                    <div className="flex justify-center">
                                        <InputOTP
                                            maxLength={6}
                                            value={otp}
                                            onChange={(val) => setOtp(val)}
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} className="w-10 h-12 text-lg font-bold rounded-l-xl" />
                                                <InputOTPSlot index={1} className="w-10 h-12 text-lg font-bold" />
                                                <InputOTPSlot index={2} className="w-10 h-12 text-lg font-bold rounded-r-xl" />
                                            </InputOTPGroup>
                                            <InputOTPSeparator />
                                            <InputOTPGroup>
                                                <InputOTPSlot index={3} className="w-10 h-12 text-lg font-bold rounded-l-xl" />
                                                <InputOTPSlot index={4} className="w-10 h-12 text-lg font-bold" />
                                                <InputOTPSlot index={5} className="w-10 h-12 text-lg font-bold rounded-r-xl" />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleVerifyOtp}
                                            disabled={isVerifying || otp.length < 6}
                                            className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl"
                                        >
                                            {isVerifying ? "Verifying..." : "Access Bookings"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setShowOtpInput(false); setOtp(""); }}
                                            className="w-full text-xs font-bold text-slate-400 hover:text-slate-600"
                                        >
                                            Change Number
                                        </Button>
                                    </div>

                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-[10px] text-amber-700 font-bold flex gap-3 leading-tight">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>DEMO MODE: If you don't receive an SMS, use code 123456 to bypass verification.</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {sortedAppointments.length === 0 ? (
                            <Card className="border-none shadow-sm p-12 text-center rounded-[2.5rem]">
                                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No Appointments Found</h3>
                                <p className="text-slate-500 mt-2 mb-8 max-w-xs mx-auto">We couldn't find any bookings associated with your details.</p>
                                <Button onClick={() => router.push("/booking")} className="h-12 px-8 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100">
                                    Book New Appointment
                                </Button>
                            </Card>
                        ) : (
                            <>
                                <div className="flex justify-between items-center px-2">
                                    <p className="text-slate-500 font-bold text-sm">Found {sortedAppointments.length} Record(s)</p>
                                    <Button size="sm" variant="outline" onClick={() => { setIsAuthenticated(false); setPhone(""); setOtp(""); setShowOtpInput(false); }} className="rounded-xl h-9 text-xs font-bold font-black uppercase tracking-widest border-slate-200">
                                        Log Out
                                    </Button>
                                </div>

                                {sortedAppointments.map(apt => (
                                    <Card key={apt.id} className="border-none shadow-sm hover:shadow-xl transition-all rounded-[2rem] overflow-hidden bg-white border border-slate-100 group">
                                        <div className="p-8">
                                            <div className="flex flex-col md:flex-row gap-8">
                                                {/* Date Sidebar */}
                                                <div className="flex flex-row md:flex-col items-center justify-center p-4 rounded-3xl bg-slate-50 border border-slate-100 md:w-24 shrink-0 gap-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                                        {new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' })}
                                                    </span>
                                                    <span className="text-3xl font-black text-slate-900">
                                                        {new Date(apt.appointmentDate).getDate()}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase text-blue-600">
                                                        {new Date(apt.appointmentDate).getFullYear()}
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className={`
                                                            text-[9px] font-black uppercase tracking-widest border-none px-3 py-1 rounded-full
                                                            ${apt.status === 'confirmed' ? 'bg-blue-600 text-white' :
                                                                apt.status === 'completed' ? 'bg-emerald-600 text-white' :
                                                                    apt.status === 'arrived' ? 'bg-purple-600 text-white' :
                                                                        'bg-slate-200 text-slate-600'}
                                                        `}>
                                                            {apt.status}
                                                        </Badge>
                                                        <span className="text-xs font-bold text-slate-400">Ref: {apt.id.slice(-8)}</span>
                                                    </div>

                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Name</p>
                                                            <p className="text-sm font-bold text-slate-900 uppercase">{apt.patientName}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IC / Passport</p>
                                                            <p className="text-sm font-bold text-slate-900">{apt.patientIC}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                                            <p className="text-sm font-bold text-slate-900">{apt.patientPhone}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Time</p>
                                                            <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                                                                <Clock className="w-4 h-4" />
                                                                {apt.timeSlot}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-0 md:pl-8">
                                                    {apt.status === 'confirmed' && (
                                                        <>
                                                            {/* Reschedule Dialog */}
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        disabled={isRescheduling}
                                                                        onClick={() => setReschedulingApt(apt)}
                                                                        className="h-11 px-6 rounded-2xl border-slate-200 text-slate-900 font-bold hover:bg-slate-50 flex-1 md:flex-none"
                                                                    >
                                                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                                                        Reschedule
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-2xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                                                                    <div className="p-8 bg-slate-900 text-white">
                                                                        <h3 className="text-2xl font-bold">Reschedule Appointment</h3>
                                                                        <p className="text-slate-400 text-sm mt-1">Select a new date and time for your session.</p>
                                                                    </div>
                                                                    <div className="p-8 space-y-8">
                                                                        <div className="grid md:grid-cols-2 gap-8">
                                                                            <div className="space-y-3">
                                                                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Select New Date</Label>
                                                                                <CalendarDatePickerContent
                                                                                    id="reschedule-date"
                                                                                    date={selectedDate ? new Date(selectedDate) : undefined}
                                                                                    onDateSelect={(d: Date | undefined) => d && setSelectedDate(d.toISOString().split('T')[0])}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-3">
                                                                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Select New Slot</Label>
                                                                                {!selectedDate ? (
                                                                                    <div className="h-[200px] rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-center p-6">
                                                                                        <CalendarDays className="w-8 h-8 text-slate-200 mb-2" />
                                                                                        <p className="text-xs text-slate-400 font-medium">Please pick a date first</p>
                                                                                    </div>
                                                                                ) : availableSlots.length === 0 ? (
                                                                                    <div className="h-[200px] rounded-3xl bg-rose-50 flex flex-col items-center justify-center text-center p-6 border border-rose-100">
                                                                                        <AlertCircle className="w-8 h-8 text-rose-300 mb-2" />
                                                                                        <p className="text-xs text-rose-600 font-bold">No slots available</p>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto px-1 py-1">
                                                                                        {availableSlots.filter(s => s.status === 'available').map(slot => (
                                                                                            <button
                                                                                                key={slot.id}
                                                                                                onClick={() => setSelectedSlot(slot)}
                                                                                                className={`p-3 rounded-xl text-xs font-bold transition-all border ${selectedSlot?.id === slot.id
                                                                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                                                                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-400'
                                                                                                    }`}
                                                                                            >
                                                                                                {slot.timeRange.split(' ')[0]} {slot.timeRange.split(' ')[1]}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        <div className="pt-4 flex gap-3">
                                                                            <Button
                                                                                disabled={!selectedSlot || isRescheduling}
                                                                                onClick={handleReschedule}
                                                                                className="flex-1 h-14 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-xl shadow-blue-100"
                                                                            >
                                                                                {isRescheduling ? "Updating..." : "Confirm New Slot"}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>

                                                            {/* Delete/Cancel Dialog */}
                                                            <Dialog open={isCancelDialogOpen && cancellingId === apt.id} onOpenChange={(open) => { setIsCancelDialogOpen(open); if (!open) setCancellingId(null); }}>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        onClick={() => { setCancellingId(apt.id); setIsCancelDialogOpen(true); }}
                                                                        className="h-11 px-6 rounded-2xl text-rose-600 font-bold hover:bg-rose-50 flex-1 md:flex-none"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Cancel
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-sm">
                                                                    <div className="bg-rose-50 p-8 flex flex-col items-center text-center">
                                                                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                                                                            <AlertCircle className="w-8 h-8" />
                                                                        </div>
                                                                        <DialogTitle className="text-xl font-black text-rose-900">Cancel Visit?</DialogTitle>
                                                                        <DialogDescription className="text-rose-600/80 font-medium mt-2 leading-relaxed">
                                                                            This will permanently release your slot for <span className="font-bold text-rose-900">{apt.appointmentDate}</span>. This action cannot be undone.
                                                                        </DialogDescription>
                                                                    </div>
                                                                    <div className="p-6 bg-white">
                                                                        <Button
                                                                            className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-100"
                                                                            onClick={handleCancel}
                                                                            disabled={isLoading}
                                                                        >
                                                                            {isLoading ? "Cancelling..." : "Yes, Cancel My Visit"}
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            className="w-full mt-2 font-bold text-slate-400"
                                                                            onClick={() => setIsCancelDialogOpen(false)}
                                                                        >
                                                                            No, Keep It
                                                                        </Button>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </>
                                                    )}

                                                    {apt.status === 'cancelled' && (
                                                        <Button
                                                            onClick={() => router.push("/booking")}
                                                            className="h-11 px-6 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 flex-1 md:flex-none"
                                                        >
                                                            <RefreshCcw className="w-4 h-4 mr-2" />
                                                            Book Again
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* No Bookings Found Dialog */}
                <Dialog open={isNoBookingDialogOpen} onOpenChange={setIsNoBookingDialogOpen}>
                    <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-sm">
                        <div className="bg-rose-50 p-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm">
                                <AlertCircle className="w-10 h-10" />
                            </div>
                            <DialogTitle className="text-2xl font-black text-rose-950 uppercase tracking-tight">No Bookings Found</DialogTitle>
                            <DialogDescription className="text-rose-700/80 font-bold mt-3 leading-relaxed">
                                We couldn't find any appointments linked to <span className="text-rose-900 underline underline-offset-4 decoration-2">{phone}</span>.
                            </DialogDescription>
                        </div>
                        <div className="p-8 bg-white space-y-3">
                            <Button
                                className="w-full h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-xl shadow-rose-100 tracking-widest uppercase text-xs"
                                onClick={() => setIsNoBookingDialogOpen(false)}
                            >
                                Try Another Number
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full h-12 rounded-xl text-slate-400 font-bold hover:text-slate-600"
                                onClick={() => router.push("/booking")}
                            >
                                Book New Appointment
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
