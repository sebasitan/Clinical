"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getDoctorsAsync, addAppointmentAsync, getSlotsAsync, seedDatabaseAsync } from "@/lib/storage"
import type { Doctor, TimeSlot, Slot } from "@/lib/types"
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

const TIME_SLOTS: TimeSlot[] = [
  "9:00 AM - 9:30 AM", "9:30 AM - 10:00 AM", "10:00 AM - 10:30 AM", "10:30 AM - 11:00 AM",
  "11:00 AM - 11:30 AM", "11:30 AM - 12:00 PM", "12:00 PM - 12:30 PM", "12:30 PM - 1:00 PM",
  "2:00 PM - 2:30 PM", "2:30 PM - 3:00 PM", "3:00 PM - 3:30 PM", "3:30 PM - 4:00 PM",
  "4:00 PM - 4:30 PM", "4:30 PM - 5:00 PM", "5:00 PM - 5:30 PM", "5:30 PM - 6:00 PM"
]

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [dailySlots, setDailySlots] = useState<Slot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form data
  const [patientType, setPatientType] = useState<"existing" | "new" | "">("")
  const [patientName, setPatientName] = useState("")
  const [patientIC, setPatientIC] = useState("")
  const [patientPhone, setPatientPhone] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [selectedDoctorId, setSelectedDoctorId] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | "">("")
  const [confirmationId, setConfirmationId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
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

  // Removed the unused `remarks` state and related logic from original

  const handleNext = (dateOverride?: any, timeOverride?: TimeSlot | "") => {
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

    // Step 5: Review and Confirmation
    if (step === 5) {
      // Logic handled within the step UI now
      return
    }

    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const [generatedOtp, setGeneratedOtp] = useState("")

  const initiateBooking = async () => {
    // Check local state availability
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

      // Show OTP input
      setShowOtpVerification(true)
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your mobile number via SMS.",
      })
    } catch (e: any) {
      console.error('OTP Send Error:', e)
      // Fallback for demo if Twilio is not configured properly
      setShowOtpVerification(true)
      setGeneratedOtp("123456") // Safety fallback
      toast({
        title: "Connection Issue",
        description: `${e.message}. Demo mode active: use code 123456.`,
        variant: "default",
      })
    }
  }

  const verifyAndBook = async () => {
    // Special case for demo fallback
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

    // Re-check slot just in case (Client side check)
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
      if (!slot) return; // Should be handled by check above
      const appointment = await addAppointmentAsync({
        patientName,
        patientIC: patientType === "existing" ? patientIC : "NEW_PATIENT",
        patientType: patientType as "existing" | "new",
        patientPhone,
        patientEmail,
        appointmentDate: selectedDate,
        timeSlot: selectedTimeSlot as TimeSlot,
        slotId: slot.id,
        doctorId: selectedDoctorId,
        status: "pending",
      })

      setConfirmationId(appointment.id)
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

  // Removed unused resetForm function

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId)

  const addToCalendar = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedDoctor) return;

    // Parse time slot: "9:00 AM - 9:30 AM"
    const [startPart] = selectedTimeSlot.split(" - ");

    // Create Date objects
    const startDateTime = new Date(`${selectedDate} ${startPart}`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000); // 30 mins later

    const fmt = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const title = encodeURIComponent(`Dental Appointment with ${selectedDoctor.name}`);
    const details = encodeURIComponent(`Dental examination and consultation with ${selectedDoctor.name} (${selectedDoctor.specialization}).\n\nPatient: ${patientName}`);
    const location = encodeURIComponent("Klinik Pergigian Setapak");
    const dates = `${fmt(startDateTime)}/${fmt(endDateTime)}`;

    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;

    window.open(googleUrl, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mb-12"
        >
          {/* Main Icon with pulse effect */}
          <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 relative z-10">
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Smile className="w-12 h-12" />
            </motion.div>
          </div>

          {/* Animated rings */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-blue-400 rounded-[2rem] -z-0"
          />
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [0.1, 0, 0.1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute inset-0 bg-blue-300 rounded-[2rem] -z-0"
          />
        </motion.div>

        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-4">
          Preparing Your <br />
          <span className="text-blue-600">Dental Portal</span>
        </h2>

        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-blue-600 rounded-full"
            />
          ))}
        </div>

        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] max-w-xs leading-relaxed">
          Retrieving schedules and specialists for your perfect smile...
        </p>

        {/* Subtle decorative items */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-8 opacity-10">
          <Stethoscope className="w-8 h-8 text-blue-900" />
          <Shield className="w-8 h-8 text-blue-900" />
          <Sparkles className="w-8 h-8 text-blue-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Sidebar - Desktop Only */}


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">

        {/* Desktop Header & Stepper */}
        <div className="hidden lg:block pt-10 pb-6 container mx-auto px-6 max-w-5xl">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-sans font-bold text-xl tracking-tight text-slate-900">Pergigian Setapak</span>
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

          {/* Mobile Header with Progress */}
          <div className="lg:hidden mb-10">
            <div className="flex items-center justify-between mb-2">
              <span className="font-sans font-bold text-lg text-slate-900">DentalCare+</span>
              <div className="text-sm font-medium text-slate-500">Step {step} of 5</div>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>


          {/* Step 1: Patient Type */}
          {/* Step 1: Patient Type */}
          {step === 1 && (
            <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
              {/* Left Panel - Welcome Hero */}
              <div className="bg-slate-900 text-white md:w-1/2 p-10 flex flex-col justify-between relative overflow-hidden">
                {/* Decorative background effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                  <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-blue-300 text-xs font-bold uppercase tracking-widest mb-6">Booking Portal</span>
                  <h1 className="font-bold text-4xl md:text-5xl leading-tight mb-4">
                    Let's Schedule <br /> <span className="text-blue-400">Your Visit</span>
                  </h1>
                  <p className="text-slate-400 text-lg max-w-sm">
                    We're excited to see you. Please tell us if you have visited us before so we can tailor your experience.
                  </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-6 mt-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-blue-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Fast Booking</p>
                      <p className="text-xs text-slate-400">Takes ~2 mins</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-rose-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Secure Data</p>
                      <p className="text-xs text-slate-400">Encrypted form</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Selection */}
              <div className="md:w-1/2 p-10 bg-white flex flex-col justify-center gap-6">
                <button
                  onClick={() => { setPatientType("new"); setStep(2); }}
                  className="group relative p-6 rounded-3xl border border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 text-left flex items-center gap-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-700">I'm a New Patient</h3>
                    <p className="text-slate-500 text-sm mt-1">First time visiting? Create a profile.</p>
                  </div>
                  <ArrowRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-blue-600 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>

                <button
                  onClick={() => { setPatientType("existing"); setStep(2); }}
                  className="group relative p-6 rounded-3xl border border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200 text-left flex items-center gap-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all duration-300 shadow-sm">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">Returning Patient</h3>
                    <p className="text-slate-500 text-sm mt-1">Look up your existing records.</p>
                  </div>
                  <ArrowRight className="ml-auto w-5 h-5 text-slate-300 group-hover:text-slate-800 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Doctor Selection */}
          {/* Step 2: Doctor Selection */}
          {step === 2 && (
            <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
              {/* Left Panel - Header */}
              <div className="bg-slate-900 text-white md:w-1/3 p-10 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                <div className="relative z-10 mb-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                    <Stethoscope className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4 leading-tight">Choose Specialist</h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Select a doctor for your visit. Our specialists are highly rated and experienced.
                  </p>
                </div>
              </div>

              {/* Right Panel - List */}
              <div className="md:w-2/3 p-8 bg-white overflow-y-auto max-h-[600px] scrollbar-hide">
                <div className="grid gap-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => { setSelectedDoctorId(doctor.id); setStep(3); }}
                      className={`group flex items-center gap-5 p-4 rounded-3xl border cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${selectedDoctorId === doctor.id ? "border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-200" : "border-slate-100 bg-white hover:border-blue-200"}`}
                    >
                      <Avatar className="w-16 h-16 rounded-2xl ring-2 ring-white shadow-sm">
                        <AvatarImage src={doctor.photo} className="object-cover" />
                        <AvatarFallback className="rounded-2xl bg-slate-100 text-slate-600 font-bold">{doctor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-700 truncate">{doctor.name}</h3>
                        <p className="text-blue-600 text-sm font-medium">{doctor.specialization}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-medium text-blue-600/70">Available Today</span>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedDoctorId === doctor.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-50 text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600"}`}>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="hidden lg:flex mt-10 justify-between items-center">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="rounded-full px-12 h-16 border-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="mr-3 w-6 h-6" /> Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedDoctorId}
                size="lg"
                className="rounded-full px-12 h-16 bg-slate-900 hover:bg-slate-800 text-xl font-bold shadow-2xl shadow-slate-300 transition-all hover:scale-105 active:scale-95"
              >
                Continue <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </div>
          )}


          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0">
              <div className="flex flex-col mb-8">
                <h1 className="font-sans font-bold text-3xl md:text-5xl text-slate-900 mb-2 tracking-tight leading-tight">When works for you?</h1>
                <p className="font-sans text-xl text-slate-500">Availability for {selectedDoctor?.name}.</p>
              </div>

              <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center max-w-7xl mx-auto lg:h-[700px]">
                {/* Date Selection - Calendar */}
                <div className="w-full lg:w-1/2 bg-white rounded-[3rem] shadow-2xl overflow-hidden isolate flex flex-col border border-slate-100">
                  {/* Header / Info Panel - Dark Premium Gradient */}
                  <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-10 flex flex-col justify-between text-white relative overflow-hidden h-[200px] shrink-0 rounded-t-[3rem]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <p className="text-blue-300 font-bold text-xs uppercase tracking-[0.3em] mb-4 opacity-80">Selected Date</p>
                      <div className="flex items-center gap-6">
                        <h3 className="font-bold text-8xl tracking-tighter leading-none text-white">
                          {selectedDate ? new Date(selectedDate).getDate() : '--'}
                        </h3>
                        <div className="flex flex-col items-start justify-center leading-tight">
                          <span className="font-bold text-3xl uppercase tracking-tight text-blue-400">{selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'short' }) : 'Month'}</span>
                          <span className="text-slate-400 font-bold text-xl">{selectedDate ? new Date(selectedDate).getFullYear() : 'Year'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10 flex justify-between items-center w-full">
                      <div className="flex items-center gap-2 bg-white/5 px-5 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <CalendarIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }) : 'Select a date'}</span>
                      </div>
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-slate-500">Step 3/5</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white flex-1 flex flex-col overflow-hidden rounded-b-[3rem]">
                    <CalendarDatePickerContent
                      id="booking-date-picker"
                      date={selectedDate ? new Date(selectedDate) : undefined}
                      onDateSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setSelectedDate(`${year}-${month}-${day}`);
                        } else {
                          setSelectedDate("");
                        }
                      }}
                      calendarProps={{
                        fromDate: new Date(),
                        disabled: (date: Date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today || date.getDay() === 0;
                        },
                        className: "p-0 border-0 shadow-none w-full max-w-full",
                        classNames: {
                          day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white shadow-lg shadow-blue-300 scale-110 font-bold rounded-xl",
                          day_today: "text-blue-600 font-bold bg-blue-50 rounded-xl",
                          day: "h-10 w-10 md:h-12 md:w-12 p-0 font-medium aria-selected:opacity-100 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all duration-300",
                          head_cell: "text-slate-400 rounded-md w-10 md:w-12 font-bold text-[0.8rem] uppercase tracking-wide py-3",
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Time Grid Selection */}
                <div
                  ref={timeSlotsRef}
                  className={cn(
                    "w-full lg:w-1/2 bg-white rounded-[3rem] shadow-2xl overflow-hidden isolate flex flex-col border border-slate-100 transition-all duration-500",
                    selectedDate ? "opacity-100" : "opacity-40"
                  )}
                >
                  {/* Header / Info Panel - Dark Premium Gradient */}
                  <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] p-10 flex flex-col justify-between text-white relative overflow-hidden h-[200px] shrink-0 rounded-t-[3rem]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <p className="text-blue-300 font-bold text-xs uppercase tracking-[0.3em] mb-4 opacity-80">Selected Sessions</p>
                      <h3 className="font-bold text-6xl md:text-7xl leading-tight text-white tracking-tighter">
                        {selectedTimeSlot ? selectedTimeSlot.split(' ')[0] : '--:--'} <span className="text-3xl text-blue-400 normal-case tracking-normal">{selectedTimeSlot ? selectedTimeSlot.split(' ')[1] : ''}</span>
                      </h3>
                    </div>

                    <div className="relative z-10 flex justify-between items-center w-full">
                      <div className="flex items-center gap-2 bg-white/5 px-5 py-2 rounded-full backdrop-blur-md border border-white/10">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">{selectedTimeSlot || 'Select a time slot'}</span>
                      </div>
                      {selectedTimeSlot && (
                        <div className="bg-blue-500 h-2 w-2 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                      )}
                    </div>
                  </div>

                  {/* Time Slots Area */}
                  <div className="p-8 bg-white flex-1 flex flex-col rounded-b-[3rem]">
                    {!selectedDate ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-10 border-2 border-dashed border-slate-50 rounded-3xl">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                          <CalendarIcon className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-widest opacity-40">Choose a date first</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {TIME_SLOTS.map(time => {
                          const slot = dailySlots.find(s => s.timeRange === time);
                          const available = slot && slot.status === 'available';
                          return (
                            <button
                              key={time}
                              disabled={!available}
                              onClick={() => {
                                if (available) {
                                  setSelectedTimeSlot(time);
                                  // Auto-advance to details step with the fresh value
                                  // Use a small delay for visual feedback before transition
                                  setTimeout(() => handleNext(selectedDate, time), 300);
                                }
                              }}
                              className={`py-3 px-2 rounded-full border-2 font-bold text-[0.7rem] md:text-xs transition-all duration-300 flex items-center justify-center text-center ${selectedTimeSlot === time
                                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02] ring-4 ring-blue-50"
                                : !available
                                  ? "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed"
                                  : "bg-white border-slate-100 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30"
                                }`}
                            >
                              <span>{time.split(' - ')[0]}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>



              {/* Bottom Action Footer for Step 3 */}
              <div className="hidden lg:flex mt-10 justify-between items-center container max-w-7xl mx-auto px-0">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  size="lg"
                  className="rounded-full px-12 h-16 border-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="mr-3 w-6 h-6" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTimeSlot}
                  size="lg"
                  className="rounded-full px-12 h-16 bg-slate-900 hover:bg-slate-800 text-xl font-bold shadow-2xl shadow-slate-300 transition-all hover:scale-105 active:scale-95"
                >
                  Continue <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0">
              <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">

                {/* Left Panel - Context & Info */}
                <div className="bg-slate-900 text-white md:w-1/3 p-10 flex flex-col relative overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-600/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                  <div className="relative z-10 mb-8">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10 shadow-lg shadow-black/20">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 leading-tight">Patient Information</h2>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      Please fill in your details accurately. We use this to retrieve your records and send appointment confirmations.
                    </p>
                  </div>

                  <div className="mt-auto relative z-10 space-y-5">
                    <div className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="mt-0.5"><Shield className="w-4 h-4 text-green-400" /></div>
                      <span className="leading-snug">Your data is encrypted & secure with 256-bit SSL.</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="mt-0.5"><Mail className="w-4 h-4 text-blue-400" /></div>
                      <span className="leading-snug">Confirmation will be sent via email & SMS.</span>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Form */}
                <div className="md:w-2/3 p-8 md:p-12 bg-white flex flex-col relative">
                  <div className="space-y-6">
                    {/* Name & IC Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="patientName" className="text-slate-900 font-bold ml-1 text-xs uppercase tracking-wider">Full Name</Label>
                        <div className="relative group">
                          <Input
                            id="patientName"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="John Doe"
                            className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                          />
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                        </div>
                      </div>

                      {patientType === "existing" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label htmlFor="patientIC" className="text-slate-900 font-bold ml-1 text-xs uppercase tracking-wider">NRIC / FIN</Label>
                          <div className="relative group">
                            <Input
                              id="patientIC"
                              value={patientIC}
                              onChange={(e) => setPatientIC(e.target.value)}
                              placeholder="S1234567A"
                              className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                            />
                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="patientPhone" className="text-slate-900 font-bold ml-1 text-xs uppercase tracking-wider">Phone Number</Label>
                      <div className="relative group">
                        <Input
                          id="patientPhone"
                          type="tel"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          placeholder="+65 9123 4567"
                          className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                        />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                      </div>
                    </div>

                    {/* Email - Conditional */}
                    {patientType === "new" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="patientEmail" className="text-slate-900 font-bold ml-1 text-xs uppercase tracking-wider">Email Address</Label>
                        <div className="relative group">
                          <Input
                            id="patientEmail"
                            type="email"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
                          />
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-10 flex justify-between items-center">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      size="lg"
                      className="rounded-full px-12 h-16 border-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="mr-3 w-6 h-6" /> Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="rounded-full px-12 h-16 bg-slate-900 hover:bg-slate-800 text-xl font-bold shadow-2xl shadow-slate-300 transition-all hover:scale-105 active:scale-95"
                    >
                      Review Details <ArrowRight className="ml-3 w-6 h-6" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & OTP */}
          {step === 5 && (
            <div className="w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px]">
              {/* Left Panel - Summary Header */}
              <div className="bg-slate-900 text-white md:w-1/3 p-10 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 mb-8">
                  <h2 className="text-3xl font-bold mb-2">Review Booking</h2>
                  <p className="text-slate-400 text-sm">Please verify your details before confirming.</p>
                </div>

                <div className="mt-auto relative z-10">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-6">
                    {/* Doctor info */}
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12 rounded-xl ring-2 ring-white/20 shrink-0">
                        <AvatarImage src={selectedDoctor?.photo} className="object-cover" />
                        <AvatarFallback className="text-slate-900 font-bold">{selectedDoctor?.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-lg leading-tight mb-1 truncate text-white">{selectedDoctor?.name}</p>
                        <p className="text-blue-400 text-sm font-medium truncate">{selectedDoctor?.specialization}</p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10 w-full" />

                    {/* Date & Time Grid */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg shrink-0 text-blue-300">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Date</p>
                          <p className="font-bold text-white text-sm">{selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Date not selected'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg shrink-0 text-blue-300">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Time</p>
                          <p className="font-bold text-white text-sm">{selectedTimeSlot || 'Time not selected'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - OTP & Confirmation */}
              <div className="md:w-2/3 p-10 bg-white flex flex-col items-center justify-center relative">
                {!showOtpVerification ? (
                  <div className="w-full max-w-sm space-y-8 animate-in fade-in">
                    {/* Patient Summary Card */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Patient Information</h4>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{patientName}</p>
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">{patientType === 'new' ? 'New' : 'Returning'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                            <Phone className="w-5 h-5" />
                          </div>
                          <p className="font-medium text-slate-600">{patientPhone}</p>
                        </div>
                        {patientEmail && (
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                              <Mail className="w-5 h-5" />
                            </div>
                            <p className="font-medium text-slate-600">{patientEmail}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center w-full gap-4">
                      <Button
                        onClick={handleBack}
                        variant="outline"
                        size="lg"
                        className="rounded-full px-12 h-16 border-slate-200 text-slate-600 font-bold text-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all hover:scale-105 active:scale-95 flex-1"
                      >
                        <ChevronLeft className="mr-3 w-6 h-6" /> Back
                      </Button>
                      <Button
                        onClick={initiateBooking}
                        size="lg"
                        className="rounded-full h-16 bg-blue-600 hover:bg-blue-700 text-xl font-bold shadow-2xl shadow-blue-300 transition-all hover:scale-[1.05] active:scale-95 flex-[1.5] flex items-center justify-center"
                      >
                        Confirm Booking <ArrowRight className="ml-3 w-6 h-6" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm text-center animate-in zoom-in-95 duration-300">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Verify it's you</h3>
                    <p className="text-slate-500 mb-8">Enter the code sent to <b>{patientPhone}</b></p>

                    <div className="flex justify-center mb-8">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-12 w-10 border-slate-200" />
                          <InputOTPSlot index={1} className="h-12 w-10 border-slate-200" />
                          <InputOTPSlot index={2} className="h-12 w-10 border-slate-200" />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} className="h-12 w-10 border-slate-200" />
                          <InputOTPSlot index={4} className="h-12 w-10 border-slate-200" />
                          <InputOTPSlot index={5} className="h-12 w-10 border-slate-200" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <Button
                      onClick={verifyAndBook}
                      disabled={otp.length !== 6 || isSubmitting}
                      className="w-full rounded-full h-14 bg-slate-900 hover:bg-slate-800 text-white text-lg shadow-xl disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      {isSubmitting ? "Verifying..." : "Verify & Book"}
                    </Button>
                    <p className="text-xs text-slate-400 mt-6">Did not receive code? <button className="text-blue-600 font-bold hover:underline">Resend</button></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col items-center justify-center text-center h-full animate-in zoom-in-95 duration-500 py-10">
              <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100">
                <Check className="w-10 h-10" strokeWidth={3} />
              </div>
              <h1 className="font-sans font-bold text-4xl text-slate-900 mb-4 tracking-tight">Appointment Confirmed!</h1>
              <p className="font-sans text-lg text-slate-500 max-w-lg mb-10 leading-relaxed px-4">
                Your appointment has been confirmed. A confirmation email and sms has been sent to you.
              </p>

              {/* Booking Summary Card */}
              <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-12 text-left">
                <div className="bg-slate-900 p-6 text-white">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 rounded-xl ring-2 ring-white/20">
                      <AvatarImage src={selectedDoctor?.photo} className="object-cover" />
                      <AvatarFallback className="text-slate-900 font-bold">{selectedDoctor?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg leading-tight">{selectedDoctor?.name}</p>
                      <p className="text-blue-400 text-xs font-medium">{selectedDoctor?.specialization}</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Date</p>
                      <p className="font-bold text-slate-900 text-sm">{selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Time Slot</p>
                      <p className="font-bold text-slate-900 text-sm">{selectedTimeSlot}</p>
                    </div>
                  </div>
                  <div className="h-px bg-slate-50 w-full my-2" />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patient</p>
                      <p className="font-bold text-slate-900 text-sm">{patientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <p className="font-medium text-slate-600 text-sm">{patientPhone}</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Appointment</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm px-4">
                <Button onClick={() => window.location.href = "/"} size="lg" className="h-14 rounded-full flex-1 bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200">
                  Back to Home
                </Button>
                <Button onClick={addToCalendar} variant="outline" size="lg" className="h-14 rounded-full flex-1 border-slate-200 hover:bg-slate-50 transition-all">
                  Add to Calendar
                </Button>
              </div>
            </div>
          )}

          {/* Mobile Sticky Bottom Action Bar */}
          {
            step < 6 && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50 safe-area-bottom">
                {step === 2 && (
                  <Button
                    onClick={handleNext}
                    disabled={!selectedDoctorId}
                    className="w-full h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold shadow-lg shadow-slate-200"
                  >
                    Continue
                  </Button>
                )}
                {/* Mobile Continue button removed for Step 3 */}

                {step === 4 && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1 h-14 rounded-full border-slate-200 text-slate-600 font-bold"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="flex-2 h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold shadow-lg shadow-slate-200"
                    >
                      Continue
                    </Button>
                  </div>
                )}
                {step === 5 && !showOtpVerification && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="flex-1 h-14 rounded-full border-slate-200 text-slate-600 font-bold"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={initiateBooking}
                      className="flex-2 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg shadow-blue-200"
                    >
                      Confirm
                    </Button>
                  </div>
                )}
                {/* Note: Step 1 (patient type) doesn't need this as the cards themselves are buttons */}
              </div>
            )
          }
        </div>
      </div>
    </div >
  )
}
