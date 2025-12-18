export type Doctor = {
    id: string
    name: string
    specialization: string
    photo?: string
    phone: string
    email: string
    isActive: boolean
    isAvailable: boolean // Quick toggle
    slotDuration: 15 | 20 | 30 // in minutes
}

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"

export type TimeSlot = string

export type ScheduleTimeRange = {
    start: string // HH:mm
    end: string   // HH:mm
}

export type DoctorWeeklySchedule = {
    doctorId: string
    days: {
        [key in DayOfWeek]?: ScheduleTimeRange[]
    }
}

export type LeaveType = "full" | "partial" | "emergency"

export type DoctorLeave = {
    id: string
    doctorId: string
    date: string // ISO date string
    type: LeaveType
    startTime?: string // for partial/emergency
    endTime?: string   // for partial/emergency
    reason?: string
}

export type Patient = {
    id: string
    name: string
    ic: string
    phone: string
    email?: string
    lastVisit?: string
    type: "new" | "existing"
}

export type SlotStatus = "available" | "booked" | "blocked" | "locked"
export type SlotType = "public" | "admin-only"

export type Slot = {
    id: string
    doctorId: string
    date: string
    timeRange: string // e.g. "9:00 AM to 9:30 AM"
    startTime: string // HH:mm for logic
    endTime: string   // HH:mm for logic
    status: SlotStatus
    type: SlotType
    appointmentId?: string
    blockReason?: string
}

export type Appointment = {
    id: string
    patientName: string
    patientIC: string
    patientType: "new" | "existing"
    patientPhone: string
    patientEmail?: string
    appointmentDate: string
    timeSlot: string
    slotId: string
    doctorId: string
    status: "pending" | "confirmed" | "completed" | "cancelled" | "no-show"
    createdAt: string
}

export type Admin = {
    id: string
    username: string
    password?: string
    role: "super-admin" | "admin"
    lastLogin?: string
}

export type SystemSettings = {
    clinicName: string
    address: string
    phone: string
    email: string
    defaultSlotDuration: number
    workingHours: {
        start: string
        end: string
    }
    notifications: {
        sms: boolean
        whatsapp: boolean
        emailReminders: boolean
    }
}

export type AuditLog = {
    id: string
    adminId: string
    adminUsername: string
    action: string
    details: string
    timestamp: string
}

export type AvailabilityBlock = {
    id: string
    doctorId: string
    date: string
    startTime: string
    endTime: string
}

export type Receptionist = {
    id: string
    name: string
    photo?: string
    phone: string
    email: string
    shift: "morning" | "afternoon" | "full-day"
    isActive: boolean
}

export type Facility = {
    id: string
    name: string
    description: string
    status: "operational" | "maintenance" | "closed"
}

