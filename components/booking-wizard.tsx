"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getDoctors, addAppointment, initializeDemoData, getSlots } from "@/lib/storage"
import type { Doctor, Slot } from "@/lib/types"
import { User, Clock, Check, Sparkles, Calendar as CalendarIcon, ChevronLeft, ArrowRight, Ban } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"

export function BookingWizard({ onClose }: { onClose?: () => void }) {
    const [step, setStep] = useState(1)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [patientType, setPatientType] = useState<"existing" | "new" | "">("")
    const [patientName, setPatientName] = useState("")
    const [patientIC, setPatientIC] = useState("")
    const [patientPhone, setPatientPhone] = useState("")
    const [patientEmail, setPatientEmail] = useState("")
    const [selectedDoctorId, setSelectedDoctorId] = useState("")
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedSlotId, setSelectedSlotId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showOtpVerification, setShowOtpVerification] = useState(false)
    const [otp, setOtp] = useState("")

    const { toast } = useToast()

    useEffect(() => {
        initializeDemoData()
        const loadedDoctors = getDoctors().filter(d => d.isActive)
        setDoctors(loadedDoctors)
        setIsLoading(false)
    }, [])

    const handleNext = () => {
        if (step === 1 && !patientType) return
        if (step === 2 && !selectedDoctorId) return
        if (step === 3 && (!selectedDate || !selectedSlotId)) return
        if (step === 4 && (!patientName || !patientIC || !patientPhone)) return
        setStep(step + 1)
    }

    const finalizeBooking = () => {
        setIsSubmitting(true)
        const currentSlots = getSlots()
        const slot = currentSlots.find(s => s.id === selectedSlotId)

        if (!slot || slot.status !== "available") {
            toast({ title: "Slot unavailable", variant: "destructive" })
            setIsSubmitting(false)
            return
        }

        try {
            addAppointment({
                patientName,
                patientIC,
                patientType: patientType as "existing" | "new",
                patientPhone,
                patientEmail: patientType === "new" ? patientEmail : undefined,
                appointmentDate: selectedDate,
                timeSlot: slot.timeRange,
                slotId: slot.id,
                doctorId: selectedDoctorId,
                status: "pending",
            })
            setStep(6)
        } catch (error) {
            toast({ title: "Error", variant: "destructive" })
            setIsSubmitting(false)
        }
    }

    const verifyAndBook = () => {
        if (otp === "123456") finalizeBooking()
        else toast({ title: "Invalid OTP", variant: "destructive" })
    }

    const availableSlots = getSlots().filter(s => s.doctorId === selectedDoctorId && s.date === selectedDate)
    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)

    if (isLoading) return <div className="p-8 text-center">Loading...</div>

    return (
        <div className="flex flex-col h-[600px] w-full max-w-5xl mx-auto bg-white md:flex-row overflow-hidden rounded-3xl shadow-2xl">
            {/* Nav */}
            <div className="hidden md:flex w-64 bg-slate-50 border-r border-slate-100 flex-col p-8">
                <div className="space-y-6">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`flex items-center gap-4 ${step === s ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step > s ? 'bg-emerald-500 border-emerald-500 text-white' : step === s ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                                {step > s ? <Check className="w-4 h-4" /> : s}
                            </div>
                            <span className="text-sm font-bold text-slate-900">Step {s}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto no-scrollbar">
                {step < 6 && step > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="mb-6 rounded-xl">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                )}

                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome</h2>
                            <p className="text-slate-500">How should we register your visit?</p>
                        </div>
                        <div className="grid gap-4">
                            <button onClick={() => { setPatientType('new'); setStep(2) }} className="p-8 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-blue-600 hover:bg-blue-50/50 transition-all text-left flex items-center gap-6 group">
                                <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200 group-hover:rotate-6 transition-transform">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900">I'm a New Patient</p>
                                    <p className="text-sm text-slate-500 font-medium">Create a new medical file</p>
                                </div>
                            </button>
                            <button onClick={() => { setPatientType('existing'); setStep(2) }} className="p-8 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-blue-600 hover:bg-blue-50/50 transition-all text-left flex items-center gap-6 group">
                                <div className="p-4 bg-slate-100 rounded-2xl text-slate-600 group-hover:rotate-6 transition-transform">
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-900">Returning Patient</p>
                                    <p className="text-sm text-slate-500 font-medium">Access existing clinical record</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold text-slate-900">Select Specialist</h2>
                        <div className="grid gap-4">
                            {doctors.map(d => (
                                <button key={d.id} onClick={() => { setSelectedDoctorId(d.id); setStep(3) }} className="p-5 rounded-2xl border-2 border-slate-50 bg-white hover:border-blue-600 transition-all flex items-center gap-4 text-left">
                                    <Avatar className="w-16 h-16 rounded-2xl border-4 border-slate-50 shadow-sm">
                                        <AvatarImage src={d.photo} className="object-cover" />
                                        <AvatarFallback>{d.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-bold text-slate-900">{d.name}</p>
                                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{d.specialization}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-200" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold text-slate-900">Availability</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="border border-slate-100 rounded-3xl p-4 bg-slate-50/50">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate ? new Date(selectedDate) : undefined}
                                    onSelect={d => d && setSelectedDate(d.toISOString().split('T')[0])}
                                    className="bg-transparent"
                                />
                            </div>
                            <div className="space-y-3">
                                {availableSlots.map(s => (
                                    <button key={s.id} onClick={() => { setSelectedSlotId(s.id); setStep(4) }} className="w-full p-4 rounded-xl border-2 border-white bg-white shadow-sm hover:border-blue-600 flex items-center justify-between group transition-all">
                                        <span className="text-xs font-bold text-slate-900">{s.timeRange}</span>
                                        <Clock className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                                    </button>
                                ))}
                                {availableSlots.length === 0 && selectedDate && (
                                    <div className="p-8 text-center text-slate-400">No session available</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold text-slate-900">Personal Details</h2>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</Label>
                                <Input value={patientName} onChange={e => setPatientName(e.target.value)} className="h-12 rounded-xl bg-slate-50" placeholder="John Doe" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">IC Number</Label>
                                <Input value={patientIC} onChange={e => setPatientIC(e.target.value)} className="h-12 rounded-xl bg-slate-50" placeholder="SXXXXXXXZ" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile Phone</Label>
                                <Input value={patientPhone} onChange={e => setPatientPhone(e.target.value)} className="h-12 rounded-xl bg-slate-50" placeholder="+65 9XXX XXXX" />
                            </div>
                        </div>
                        <Button onClick={handleNext} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold">Review Appointment</Button>
                    </div>
                )}

                {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold text-slate-900">Confirmation</h2>
                        {!showOtpVerification ? (
                            <div className="space-y-6">
                                <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 text-center">
                                    <p className="text-sm font-bold text-slate-900 mb-1">{patientName}</p>
                                    <p className="text-xs text-slate-500 mb-6">{selectedDate} at {getSlots().find(s => s.id === selectedSlotId)?.timeRange}</p>
                                    <div className="flex items-center justify-center gap-2 text-blue-600">
                                        <User className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">{selectedDoctor?.name}</span>
                                    </div>
                                </div>
                                <Button onClick={() => setShowOtpVerification(true)} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100">Confirm Booking</Button>
                            </div>
                        ) : (
                            <div className="text-center space-y-6">
                                <p className="text-sm text-slate-500">Security code sent to {patientPhone}</p>
                                <div className="flex justify-center">
                                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                                        <InputOTPGroup className="gap-2">
                                            {[0, 1, 2, 3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="w-12 h-14 rounded-xl border-2 text-lg font-bold" />)}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                                <Button onClick={verifyAndBook} disabled={otp.length < 6 || isSubmitting} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold">Verify & Book</Button>
                            </div>
                        )}
                    </div>
                )}

                {step === 6 && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-lg shadow-emerald-100">
                            <Check className="w-10 h-10" strokeWidth={3} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Confirmed!</h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-xs">{patientName}, your appointment is secured. We've sent details to your mobile.</p>
                        <Button onClick={() => window.location.reload()} className="h-14 px-10 bg-slate-900 text-white rounded-2xl font-bold">Done</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
