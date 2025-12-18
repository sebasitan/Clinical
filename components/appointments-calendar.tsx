"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import type { Appointment, Doctor } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AppointmentsCalendarProps {
  appointments: Appointment[]
  doctors: Doctor[]
  onDateSelect?: (date: string) => void
}

export function AppointmentsCalendar({ appointments, doctors, onDateSelect }: AppointmentsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const getAppointmentsForDate = (dateCode: string) => {
    return appointments.filter((apt) => apt.appointmentDate === dateCode)
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthYear = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const days = []
  // Add empty cells for days before the month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 h-32 md:h-40 bg-slate-50/30 rounded-2xl" />)
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateISO = date.toISOString().split("T")[0]
    const dateAppointments = getAppointmentsForDate(dateISO)
    const isToday = date.toDateString() === new Date().toDateString()
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))

    days.push(
      <div
        key={day}
        onClick={() => onDateSelect?.(dateISO)}
        className={cn(
          "p-3 h-32 md:h-40 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 group relative bg-white/50 backdrop-blur-sm",
          isToday && "bg-blue-50/50 border-blue-200 ring-2 ring-blue-500 ring-offset-2",
          isPast && "opacity-60 grayscale-[0.5]",
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
            isToday ? "bg-blue-600 text-white" : "text-slate-900 group-hover:text-blue-600"
          )}>{day}</span>
          {dateAppointments.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{dateAppointments.length} Appt</span>
            </div>
          )}
        </div>
        <div className="space-y-1.5 overflow-hidden">
          {dateAppointments.slice(0, 2).map((apt) => {
            const doctor = doctors.find((d) => d.id === apt.doctorId)
            const statusColor =
              apt.status === "confirmed"
                ? "bg-blue-500"
                : apt.status === "completed"
                  ? "bg-emerald-500"
                  : apt.status === "pending"
                    ? "bg-amber-500"
                    : apt.status === "cancelled"
                      ? "bg-rose-500"
                      : "bg-slate-400"
            return (
              <div
                key={apt.id}
                className="text-[10px] p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm truncate group/item hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-1 h-3 rounded-full shrink-0", statusColor)} />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{apt.patientName}</div>
                    <div className="text-slate-400 truncate flex items-center gap-1 font-medium">
                      <Clock className="w-2.5 h-2.5" />
                      {apt.timeSlot.split(' ')[0]} {apt.timeSlot.split(' ')[1]}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {dateAppointments.length > 2 && (
            <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest pl-2 mt-1">
              + {dateAppointments.length - 2} more sessions
            </div>
          )}
        </div>
      </div>,
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold text-slate-900 leading-tight">{monthYear}</h2>
            <p className="text-xs text-slate-500 font-medium">Monthly appointment distribution overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          <Button variant="ghost" size="icon" onClick={previousMonth} className="h-10 w-10 rounded-xl hover:bg-slate-50 group">
            <ChevronLeft className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </Button>
          <div className="h-4 w-px bg-slate-100 mx-1" />
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-10 w-10 rounded-xl hover:bg-slate-50 group">
            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-3">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-3">{days}</div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mt-10 p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] justify-center">
        {[
          { label: "Confirmed", color: "bg-blue-500" },
          { label: "Pending", color: "bg-amber-500" },
          { label: "Completed", color: "bg-emerald-500" },
          { label: "Cancelled", color: "bg-rose-500" }
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            <div className={cn("h-2 w-2 rounded-full", item.color)} />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
