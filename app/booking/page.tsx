"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getDoctorsAsync, addAppointmentAsync, getSlotsAsync, seedDatabaseAsync } from "@/lib/storage"
import type { Doctor, TimeSlot, Slot } from "@/lib/types"
import { CheckCircle2, User, Clock, Phone, Mail, Check, Sparkles, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Shield, ArrowRight, MapPin, Stethoscope } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"

const TIME_SLOTS: TimeSlot[] = [
  "9:00 AM to 9:30 AM",
  "10:00 AM to 10:30 AM",
  "11:00 AM to 11:30 AM",
  "2:00 PM to 2:30 PM",
  "3:00 PM to 3:30 PM",
  "4:00 PM to 4:30 PM",
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

      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split("T")[0])
      }
    }

    setAvailableDates(dates)
  }

  // Removed the unused `remarks` state and related logic from original

  const handleNext = () => {
    // Step 1: Patient Type Selection
    if (step === 1 && !patientType) {
      toast({
        title: "Selection required",
        description: "Please select patient type",
        variant: "destructive",
      })
      return
    }

    // Step 2: Doctor Selection
    if (step === 2 && !selectedDoctorId) {
      toast({
        title: "Selection required",
        description: "Please select a doctor",
        variant: "destructive",
      })
      return
    }

    // Step 3: Date and Time Selection
    if (step === 3 && (!selectedDate || !selectedTimeSlot)) {
      toast({
        title: "Selection required",
        description: "Please select both date and time slot",
        variant: "destructive",
      })
      return
    }

    // Step 4: Patient Information
    if (step === 4) {
      if (!patientName || !patientIC || !patientPhone) {
        toast({
          title: "Information required",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      if (patientType === "new" && !patientEmail) {
        toast({
          title: "Email required",
          description: "Email is required for new patients",
          variant: "destructive",
        })
        return
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

  const initiateBooking = () => {
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

    // Show OTP input
    setShowOtpVerification(true)
    toast({
      title: "OTP Sent",
      description: "An OTP has been sent to your mobile number. (Use 123456)",
    })
  }

  const verifyAndBook = () => {
    if (otp !== "123456") {
      toast({
        title: "Invalid OTP",
        description: "The OTP you entered is incorrect. Please try again.",
        variant: "destructive",
      })
      return
    }
    finalizeBooking()
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
        patientIC,
        patientType: patientType as "existing" | "new",
        patientPhone,
        patientEmail: patientType === "new" ? patientEmail : undefined,
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

    // Parse time slot: "9:00 AM to 9:30 AM"
    const [startPart] = selectedTimeSlot.split(" to ");

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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading booking form...</p>
          </CardContent>
        </Card>
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

          {/* Back Button */}
          {step > 1 && step < 6 && (
            <button onClick={handleBack} className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 w-fit">
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
          )}

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

          {/* Mobile Sticky Footer for Step 2 moved to shared footer logic below */}
          <div className="hidden lg:flex mt-10 justify-end">
            <Button
              onClick={handleNext}
              disabled={!selectedDoctorId}
              size="lg"
              className="rounded-full px-10 h-14 bg-slate-900 hover:bg-slate-800 text-lg shadow-xl shadow-slate-200"
            >
              Continue <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>


          {/* Step 3: Date & Time */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 lg:pb-0">
              <h1 className="font-sans font-bold text-3xl md:text-5xl text-slate-900 mb-4 tracking-tight">When works for you?</h1>
              <p className="font-sans text-xl text-slate-500 mb-12">Availability for {selectedDoctor?.name}.</p>

              <div className="space-y-10">
                {/* Date Strip */}
                {/* Date Selection - Calendar */}
                {/* Date Selection - Calendar */}
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-md bg-white rounded-[2rem] border-0 shadow-2xl overflow-hidden flex flex-col md:flex-row">
                    {/* Header / Info Panel */}
                    <div className="bg-blue-600 p-8 flex flex-col justify-between text-white md:w-2/5 min-h-[200px] md:min-h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                      <div className="relative z-10">
                        <p className="text-blue-100 font-medium text-lg mb-1">{selectedDate ? new Date(selectedDate).getFullYear() : '2024'}</p>
                        <h3 className="font-bold text-4xl md:text-5xl leading-tight">
                          {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' }) : 'Pick'} <br />
                          <span className="opacity-90">{selectedDate ? new Date(selectedDate).getDate() : 'Date'}</span>
                        </h3>
                      </div>
                      <div className="relative z-10 mt-auto pt-6">
                        <p className="text-blue-200 font-medium uppercase tracking-widest text-xs">Selected</p>
                        <p className="font-bold text-xl">{selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'long' }) : 'Month'}</p>
                      </div>
                    </div>

                    {/* Calendar Body */}
                    <div className="p-6 md:p-8 bg-white md:w-3/5 flex justify-center items-center">
                      <Calendar
                        mode="single"
                        fromDate={new Date()}
                        selected={selectedDate ? new Date(selectedDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                            setSelectedDate(offsetDate.toISOString().split("T")[0]);
                          } else {
                            setSelectedDate("");
                          }
                        }}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today || date.getDay() === 0 || date.getDay() === 6;
                        }}
                        className="p-0 w-full"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4 w-full",
                          caption: "flex justify-center pt-1 relative items-center mb-4",
                          caption_label: "text-lg font-bold text-slate-900",
                          nav: "flex items-center absolute top-1/2 -translate-y-1/2 -inset-x-2 md:-inset-x-4 justify-between pointer-events-none z-10",
                          button_previous: "pointer-events-auto h-10 w-10 bg-white shadow-xl border border-slate-100 rounded-full p-0 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all opacity-100 hover:scale-110 active:scale-95",
                          button_next: "pointer-events-auto h-10 w-10 bg-white shadow-xl border border-slate-100 rounded-full p-0 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all opacity-100 hover:scale-110 active:scale-95",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex justify-between mb-2",
                          head_cell: "text-slate-400 rounded-md w-10 font-bold text-[0.8rem] uppercase tracking-wide",
                          row: "flex w-full mt-2 justify-between",
                          cell: "h-10 w-10 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-slate-100/50 [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-10 w-10 p-0 font-medium aria-selected:opacity-100 hover:bg-slate-50 hover:text-blue-600 rounded-full transition-all duration-300",
                          day_range_end: "day-range-end",
                          day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white shadow-lg shadow-blue-300 scale-110",
                          day_today: "text-blue-600 font-bold bg-blue-50",
                          day_outside: "text-slate-300 opacity-50 aria-selected:bg-slate-100/50 aria-selected:text-slate-500 aria-selected:opacity-30 hidden",
                          day_disabled: "text-slate-200 opacity-30",
                          day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Time Grid */}
                {/* Time Grid */}
                <div className={`transition-all duration-500 ${selectedDate ? "opacity-100 translate-y-0" : "opacity-30 translate-y-4"}`}>
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-md bg-white rounded-[2rem] border-0 shadow-2xl overflow-hidden flex flex-col md:flex-row">
                      {/* Header / Info Panel */}
                      <div className="bg-slate-900 p-8 flex flex-col justify-between text-white md:w-2/5 min-h-[150px] md:min-h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                          <Label className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-1 block">Available Time</Label>
                          <h3 className="font-bold text-3xl md:text-4xl leading-tight text-blue-400">
                            {selectedTimeSlot ? selectedTimeSlot.split(' ')[0] : '--:--'} <span className="text-lg text-slate-500">{selectedTimeSlot ? selectedTimeSlot.split(' ')[1] : ''}</span>
                          </h3>
                        </div>

                        <div className="relative z-10 mt-auto pt-4">
                          <div className="flex items-center gap-2 text-slate-300 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{selectedTimeSlot || 'Select Time'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Time Slots Body */}
                      <div className="p-6 md:p-8 bg-white md:w-3/5">
                        <div className="grid grid-cols-1 gap-3">
                          {TIME_SLOTS.map(time => {
                            const slot = dailySlots.find(s => s.timeRange === time);
                            const available = slot && slot.status === 'available';
                            return (
                              <button
                                key={time}
                                disabled={!available}
                                onClick={() => available && setSelectedTimeSlot(time)}
                                className={`py-3 px-4 rounded-xl border font-bold text-sm transition-all duration-200 flex items-center justify-between group ${selectedTimeSlot === time
                                  ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.02]"
                                  : !available
                                    ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed decoration-slice"
                                    : "bg-white border-slate-100 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-md"
                                  }`}
                              >
                                <span>{time}</span>
                                {selectedTimeSlot === time && <Check className="w-4 h-4 text-blue-400" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <div className="hidden lg:flex mt-12 justify-end">
                <Button
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTimeSlot}
                  size="lg"
                  className="rounded-full px-10 h-14 bg-slate-900 hover:bg-slate-800 text-lg shadow-xl shadow-slate-200"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
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

                      <div className="space-y-2">
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

                  <div className="mt-auto pt-10 flex justify-end">
                    <Button
                      onClick={handleNext}
                      size="lg"
                      className="rounded-full px-10 h-14 bg-slate-900 hover:bg-slate-800 text-lg shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                    >
                      Review Details <ArrowRight className="ml-2 w-5 h-5" />
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

                    <Button
                      onClick={initiateBooking}
                      size="lg"
                      className="w-full rounded-full h-14 bg-blue-600 hover:bg-blue-700 text-lg shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center"
                    >
                      Confirm Appointment
                    </Button>
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
                {step === 3 && (
                  <Button
                    onClick={handleNext}
                    disabled={!selectedDate || !selectedTimeSlot}
                    className="w-full h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold shadow-lg shadow-slate-200"
                  >
                    Continue
                  </Button>
                )}
                {step === 4 && (
                  <Button
                    onClick={handleNext}
                    className="w-full h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-lg font-bold shadow-lg shadow-slate-200"
                  >
                    Review Details
                  </Button>
                )}
                {step === 5 && !showOtpVerification && (
                  <Button
                    onClick={initiateBooking}
                    className="w-full h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg shadow-blue-200"
                  >
                    Confirm Booking
                  </Button>
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
