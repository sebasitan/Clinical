export type Doctor = {
    id: string
    name: string
    specialization: string
    photo?: string
    phone: string
    email: string
    isActive: boolean
    isAvailable: boolean // Quick toggle
    slotDuration: 10 | 15 | 20 | 30 // in minutes
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

// Date-specific schedule - allows different hours for each specific date
export type DoctorDateSchedule = {
    doctorId: string
    schedules: {
        [date: string]: ScheduleTimeRange[] // "2025-12-28": [{start: "10:00", end: "18:00"}]
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
    medicalAlerts?: string
    type: "new" | "existing"
    createdBy?: {
        id: string
        name: string
        role: string
    }
    createdAt?: string
    lastUpdatedBy?: {
        id: string
        name: string
        role: string
    }
    lastUpdatedAt?: string
    continuedTreatment?: {
        active: boolean
        nextFollowUpDate?: string | Date
        notes?: string
        status?: 'in-progress' | 'completed'
        reminderDaysBefore?: number[]
        preferredChannels?: {
            sms: boolean
            whatsapp: boolean
            email: boolean
        }
        lastUpdatedBy?: {
            id: string
            name: string
            role: string
        }
        lastUpdatedAt?: string
    }
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
    status: "pending" | "confirmed" | "arrived" | "completed" | "cancelled" | "no-show"
    createdAt: string
    managedBy?: {
        id: string
        name: string
        role: string
    }
    managedAt?: string
}

export type Admin = {
    id: string
    username: string
    password?: string
    role: "super-admin" | "admin" | "receptionist" | "doctor"
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
    username: string
    password?: string
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

export type ConsultationRecord = {
    id: string
    doctorId: string
    patientName: string
    patientIC: string
    handphoneNo: string
    cardNo?: string
    totalFee: number
    consultationFee: number
    consultationDate: string
    fixDate?: string
    remark?: string
    updates?: string
    createdAt?: string
}

