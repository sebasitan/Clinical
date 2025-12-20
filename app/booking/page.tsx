"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getDoctorsAsync, addAppointmentAsync, getSlotsAsync, seedDatabaseAsync, getDoctorScheduleAsync } from "@/lib/storage"
import type { Doctor, TimeSlot, Slot, DoctorWeeklySchedule, DayOfWeek } from "@/lib/types"
import { CheckCircle2, User, Clock, Phone, Mail, Check, Sparkles, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Shield, ArrowRight, MapPin, Stethoscope, Smile } from "lucide-react"
import { CalendarDatePickerContent } from "@/components/ui/calendar-date-picker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

const API_BASE = "/api"

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [dailySlots, setDailySlots] = useState<Slot[]>([])
  const [doctorSchedule, setDoctorSchedule] = useState<DoctorWeeklySchedule | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Form data
  const [patientType, setPatientType] = useState<"existing" | "new" | "">("")
  const [patientName, setPatientName] = useState("")
  const [patientIC, setPatientIC] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | "">("")
  const [confirmationId, setConfirmationId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [otp, setOtp] = useState("")
  const timeSlotsRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  useEffect(() => {
    const init = async () => {
      console.log("[Cloud] Seeding/Connecting...")
      await seedDatabaseAsync()
      const loadedDoctors = await getDoctorsAsync()
      console.log("[Cloud] Loaded doctors:", loadedDoctors)
      setDoctors(loadedDoctors)
      generateAvailableDates()
      setIsLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    const fetchSlots = async () => {
      if (selectedDoctorId && selectedDate) {
        const slots = await getSlotsAsync(selectedDoctorId, selectedDate)
        setDailySlots(slots)

        // On mobile, scroll to time slots when date is selected
        if (window.innerWidth < 1024 && timeSlotsRef.current) {
          setTimeout(() => {
            timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    }
    fetchSlots()
  }, [selectedDoctorId, selectedDate])

  // Fetch doctor's weekly schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      if (selectedDoctorId) {
        const schedule = await getDoctorScheduleAsync(selectedDoctorId)
        setDoctorSchedule(schedule)
      } else {
        setDoctorSchedule(null)
      }
    }
    fetchSchedule()
  }, [selectedDoctorId])

  // Auto-fetch patient details for existing patients
  useEffect(() => {
    const fetchPatientDetails = async () => {
      if (patientType === "existing" && patientIC.length >= 5) {
        try {
          const res = await fetch(`${API_BASE}/patients?ic=${patientIC}`);
          if (res.ok) {
            const patient = await res.json();
            if (patient && patient.name) {
              setPatientName(patient.name);
              setPatientPhone(patient.phone);
              if (patient.email) setPatientEmail(patient.email);

              toast({
                title: "Profile Found",
                description: `Welcome back, ${patient.name}! We've filled in your details.`,
              });
            }
          }
        } catch (e) {
          console.error("Failed to fetch patient", e);
        }
      }
    };

    // Debounce the look-up
    const timer = setTimeout(() => {
      if (patientIC) fetchPatientDetails();
    }, 800);

    return () => clearTimeout(timer);
  }, [patientIC, patientType]);

  const generateAvailableDates = () => {
    const dates: string[] = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      // Skip Sundays (0)
      if (date.getDay() !== 0) {
        dates.push(date.toISOString().split("T")[0])
      }
    }

    setAvailableDates(dates)
  }

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const validatePhone = (phone: string) => {
    // Basic phone validation (starts with + or digits, at least 8 chars)
    return phone.length >= 8 && /^[0-9+ ]+$/.test(phone);
  };

  const handleNext = (dateOverride?: any, timeOverride?: string | "") => {
    // Check if first arg is an event (for direct button onClick={handleNext})
    const isEvent = dateOverride && typeof dateOverride === 'object' && 'preventDefault' in dateOverride;

    // Determine actual values to check (either state or overrides)
    const currentStep = step;
    const date = (dateOverride !== undefined && !isEvent) ? dateOverride as string : selectedDate;
    const time = (timeOverride !== undefined) ? timeOverride : selectedTimeSlot;

    // Step 1: Patient Type Selection
    if (currentStep === 1 && !patientType) {
      toast({
        title: "Selection required",
        description: "Please select patient type",
        variant: "destructive",
      })
      return
    }

    // Step 2: Doctor Selection
    if (currentStep === 2 && !selectedDoctorId) {
      toast({
        title: "Selection required",
        description: "Please select a doctor",
        variant: "destructive",
      })
      return
    }

    // Step 3: Date and Time Selection
    if (currentStep === 3 && (!date || !time)) {
      toast({
        title: "Selection required",
        description: "Please select both date and time slot",
        variant: "destructive",
      })
      return
    }

    // Step 4: Patient Information
    if (currentStep === 4) {
      if (!patientName || !patientPhone) {
        toast({
          title: "Information required",
          description: "Please fill in Name and Phone Number",
          variant: "destructive",
        })
        return
      }

      if (patientType === "existing" && !patientIC) {
        toast({
          title: "Identification required",
          description: "Patient ID (IC) is required for returning patients",
          variant: "destructive",
        })
        return
      }

      if (!validatePhone(patientPhone)) {
        toast({
          title: "Invalid Phone",
          description: "Please enter a valid phone number",
          variant: "destructive",
        })
        return
      }

      if (patientType === "new") {
        if (!patientEmail) {
          toast({
            title: "Email required",
            description: "Email is required for new patients",
            variant: "destructive",
          })
          return
        }
        if (!validateEmail(patientEmail)) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address",
            variant: "destructive",
          })
          return
        }
      }
    }

    if (step === 5) return;
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const initiateBooking = async () => {
    const slot = dailySlots.find(s => s.timeRange === selectedTimeSlot)
    if (!slot || slot.status !== 'available') {
      toast({
        title: "Slot unavailable",
        description: "This time slot is no longer available. Please select another.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log(`[Flow] Requesting SMS OTP for ${patientPhone} via Twilio Verify...`)
      const res = await fetch('/api/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: patientPhone })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP')
      }

      setShowOtpVerification(true)
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your mobile number via SMS.",
      })
    } catch (e: any) {
      console.error('OTP Send Error:', e)
      setShowOtpVerification(true)
      setGeneratedOtp("123456")
      toast({
        title: "Connection Issue",
        description: `${e.message}. Demo mode active: use code 123456.`,
        variant: "default",
      })
    }
  }

  const verifyAndBook = async () => {
    if (generatedOtp === "123456" && otp === "123456") {
      finalizeBooking()
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: patientPhone, code: otp })
      })

      if (res.ok) {
        finalizeBooking()
      } else {
        toast({
          title: "Invalid OTP",
          description: "The verification code is incorrect or expired.",
          variant: "destructive",
        })
        setIsSubmitting(false)
      }
    } catch (e) {
      toast({
        title: "Verification Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const finalizeBooking = async () => {
    setIsSubmitting(true)
    const slot = dailySlots.find(s => s.timeRange === selectedTimeSlot)
    if (!slot || slot.status !== 'available') {
      toast({
        title: "Slot unavailable",
        description: "This time slot is no longer available. Please select another.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      setShowOtpVerification(false)
      return
    }

    try {
      const appointment = await addAppointmentAsync({
        patientName,
        patientIC: patientType === "existing" ? patientIC : "NEW_PATIENT",
        patientType: patientType as "existing" | "new",
        patientPhone,
        patientEmail,
        appointmentDate: selectedDate,
        timeSlot: selectedTimeSlot as any,
        slotId: slot.id,
        doctorId: selectedDoctorId,
        status: "confirmed",
      })

      setConfirmationId(appointment.id)
      if (appointment.patientIC) setPatientIC(appointment.patientIC)
      setStep(6)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId)

  const addToCalendar = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedDoctor) return;
    const [startPart] = selectedTimeSlot.split(" - ");
    const startDateTime = new Date(`${selectedDate} ${startPart}`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);
    const fmt = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`Dental Appointment with ${selectedDoctor.name}`);
    const details = encodeURIComponent(`Dental examination and consultation with ${selectedDoctor.name} (${selectedDoctor.specialization}).\n\nPatient: ${patientName}`);
    const location = encodeURIComponent("Klinik Pergigian Setapak (Sri Rampai)");
    const dates = `${fmt(startDateTime)}/` + fmt(endDateTime);
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(googleUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-12">
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 relative z-10">
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>
              <Smile className="w-12 h-12" />
            </motion.div>
          </div>
          <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-blue-400 rounded-[2rem] -z-0" />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">
          Preparing Your <br />
          <span className="text-blue-600">Dental Portal</span>
        </h2>
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 bg-blue-600 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
        <div className="hidden lg:block pt-10 pb-6 container mx-auto px-6 max-w-5xl">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image src="/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="font-sans font-bold text-xl tracking-tight text-slate-900">Pergigian Setapak (Sri Rampai)</span>
            </div>
            <div className="flex items-center gap-8">
              {[
                { id: 1, label: "Patient" },
                { id: 2, label: "Doctor" },
                { id: 3, label: "Time" },
                { id: 4, label: "Details" },
                { id: 5, label: "Confirm" },
              ].map((s, i, arr) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 ${step === s.id ? "text-blue-600" : step > s.id ? "text-green-500" : "text-slate-300"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step === s.id ? "border-blue-600 bg-white" :
                      step > s.id ? "border-green-500 bg-green-50" :
                        "border-slate-200 bg-transparent"
                      }`}>
                      {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                    </div>
                    <span className="font-bold text-sm tracking-wide hidden xl:block">{s.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-[2px] w-12 rounded-full transition-colors ${step > s.id ? "bg-green-500" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 pb-20 md:px-12 max-w-4xl mx-auto w-full flex flex-col">
          {/* Mobile Header */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans font-bold text-lg text-slate-900">DentalCare+</span>
              <div className="text-sm font-medium text-slate-500">Step {step} of 5</div>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300 ease-out" style={{ width: `${(step / 5) * 100}%` }} />
            </div>
          </div>

          {step === 1 && (
            <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
              <div className="bg-slate-900 text-white md:w-1/2 p-10 flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-blue-300 text-xs font-bold uppercase tracking-widest mb-6">Booking Portal</span>
                  <h1 className="font-bold text-4xl md:text-5xl leading-tight mb-4">Let's Schedule <br /> <span className="text-blue-400">Your Visit</span></h1>
                  <p className="text-slate-400 text-lg max-w-sm">We're excited to see you. Please tell us if you have visited us before so we can tailor your experience.</p>
                </div>
              </div>
              <div className="md:w-1/2 p-10 bg-white flex flex-col justify-center gap-6">
                <button onClick={() => { setPatientType("new"); setStep(2); }} className="group p-6 rounded-3xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Sparkles className="w-7 h-7" /></div>
                  <div className="flex-1 text-slate-900 font-bold text-xl">I'm a New Patient</div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                </button>
                <button onClick={() => { setPatientType("existing"); setStep(2); }} className="group p-6 rounded-3xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all text-left flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all shadow-sm"><User className="w-7 h-7" /></div>
                  <div className="flex-1 text-slate-900 font-bold text-xl">Returning Patient</div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-800" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
              <div className="bg-slate-900 text-white md:w-1/3 p-10 flex flex-col relative overflow-hidden">
                <h2 className="text-3xl font-bold mb-4">Choose Specialist</h2>
                <p className="text-slate-400 text-sm">Select a doctor for your visit.</p>
              </div>
              <div className="md:w-2/3 p-8 bg-white overflow-y-auto max-h-[600px]">
                <div className="grid gap-4">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} onClick={() => { setSelectedDoctorId(doctor.id); setStep(3); }} className={`group flex items-center gap-5 p-4 rounded-3xl border cursor-pointer transition-all ${selectedDoctorId === doctor.id ? "border-blue-500 bg-blue-50" : "border-slate-100 hover:border-blue-200"}`}>
                      <Avatar className="w-16 h-16 rounded-2xl"><AvatarImage src={doctor.photo} className="object-cover" /><AvatarFallback>{doctor.name.charAt(0)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 truncate">{doctor.name}</h3>
                        <p className="text-blue-600 text-sm font-medium">{doctor.specialization}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center max-w-7xl mx-auto lg:h-[600px]">
                <div className="w-full lg:w-1/2 bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
                  <div className="bg-slate-900 p-8 text-white h-[180px] flex flex-col justify-center items-center">
                    <span className="text-blue-300 font-bold text-xs uppercase tracking-widest mb-2">Selected Date</span>
                    <h3 className="font-bold text-7xl">{selectedDate ? new Date(selectedDate).getDate() : '--'}</h3>
                    <span className="text-slate-400 font-bold">{selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}</span>
                  </div>
                  <div className="p-6 flex-1">
                    <CalendarDatePickerContent
                      id="booking-calendar"
                      date={selectedDate ? new Date(selectedDate) : undefined}
                      onDateSelect={(d) => d && setSelectedDate(d.toISOString().split('T')[0])}
                      calendarProps={{ fromDate: new Date() }}
                    />
                  </div>
                </div>

                <div className="w-full lg:w-1/2 bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100">
                  <div className="bg-slate-900 p-8 text-white h-[180px] flex flex-col justify-center items-center">
                    <span className="text-blue-300 font-bold text-xs uppercase tracking-widest mb-2">Available Slots</span>
                    <h3 className="font-bold text-4xl">{selectedTimeSlot ? selectedTimeSlot.split(' - ')[0] : '--:--'}</h3>
                  </div>
                  <div className="p-8 flex-1 overflow-y-auto">
                    {!selectedDate ? <p className="col-span-full text-center py-10 text-slate-400">Choose a date first</p> : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {dailySlots.length === 0 ? <p className="col-span-full text-center py-10">No slots today</p> : dailySlots.map(slot => (
                          <button key={slot.id} disabled={slot.status !== 'available'} onClick={() => { setSelectedTimeSlot(slot.timeRange); setTimeout(() => handleNext(selectedDate, slot.timeRange), 300); }} className={`py-3 px-2 rounded-xl border-2 font-bold text-xs transition-all ${selectedTimeSlot === slot.timeRange ? "bg-blue-600 border-blue-600 text-white" : slot.status !== 'available' ? "bg-slate-50 text-slate-300 cursor-not-allowed opacity-50" : "bg-white text-slate-600 hover:border-blue-400"}`}>
                            {slot.timeRange.split(' - ')[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
              <div className="bg-slate-900 text-white md:w-1/3 p-10 flex flex-col">
                <h2 className="text-3xl font-bold mb-4">Your Details</h2>
                <p className="text-slate-400 text-sm">Fill in your information accurately.</p>
              </div>
              <div className="md:w-2/3 p-8 space-y-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="John Doe" />
                </div>
                {patientType === 'existing' && (
                  <div className="space-y-2">
                    <Label>Patient ID (IC)</Label>
                    <Input value={patientIC} onChange={e => setPatientIC(e.target.value.toUpperCase())} placeholder="KPS-123456" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={patientPhone} onChange={e => setPatientPhone(e.target.value)} placeholder="+65 9123 4567" />
                </div>
                {patientType === 'new' && (
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={patientEmail} onChange={e => setPatientEmail(e.target.value)} placeholder="john@example.com" />
                  </div>
                )}
                <div className="pt-10 flex justify-between">
                  <Button onClick={handleBack} variant="outline">Back</Button>
                  <Button onClick={() => handleNext()}>Continue</Button>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
              <div className="bg-slate-900 text-white md:w-1/3 p-10">
                <h2 className="text-3xl font-bold mb-8">Review</h2>
                <div className="space-y-4 text-sm">
                  <p className="font-bold text-white">{selectedDoctor?.name}</p>
                  <p className="text-slate-400">{selectedDate} at {selectedTimeSlot}</p>
                </div>
              </div>
              <div className="md:w-2/3 p-10 flex flex-col items-center justify-center">
                {!showOtpVerification ? (
                  <div className="space-y-8 w-full max-w-sm text-center">
                    <div className="bg-slate-50 p-6 rounded-3xl text-left space-y-2">
                      <p className="font-bold">{patientName}</p>
                      <p className="text-slate-500">{patientPhone}</p>
                    </div>
                    <Button onClick={initiateBooking} className="w-full h-14 rounded-full bg-blue-600 text-lg">Confirm Booking</Button>
                  </div>
                ) : (
                  <div className="text-center w-full max-w-sm">
                    <h3 className="text-2xl font-bold mb-4">Verify Phone</h3>
                    <p className="mb-8">Enter code sent to {patientPhone}</p>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} className="mb-8">
                      <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /></InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
                    </InputOTP>
                    <Button onClick={verifyAndBook} disabled={otp.length !== 6 || isSubmitting} className="w-full h-14 rounded-full bg-slate-900">{isSubmitting ? "Verifying..." : "Verify & Book"}</Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl"><Check className="w-10 h-10" /></div>
              <h1 className="text-4xl font-bold mb-4">Confirmed!</h1>
              <p className="text-slate-500 mb-10">Your appointment with {selectedDoctor?.name} is set for {selectedDate} at {selectedTimeSlot}.</p>
              <div className="flex gap-4">
                <Button onClick={() => window.location.href = "/"} className="rounded-full px-10 h-14 bg-slate-900">Home</Button>
                <Button onClick={addToCalendar} variant="outline" className="rounded-full px-10 h-14">Add to Calendar</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
