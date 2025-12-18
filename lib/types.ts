export type Doctor = {
    id: string
    name: string
    specialization: string
    photo?: string
    phone: string
    email: string
    isActive: boolean
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

export type TimeSlot =
    | "9:00 AM to 9:30 AM"
    | "10:00 AM to 10:30 AM"
    | "11:00 AM to 11:30 AM"
    | "2:00 PM to 2:30 PM"
    | "3:00 PM to 3:30 PM"
    | "4:00 PM to 4:30 PM"

export type SlotStatus = "available" | "booked" | "blocked" | "locked"

export type Slot = {
    id: string
    doctorId: string
    date: string
    timeRange: string
    status: SlotStatus
    appointmentId?: string
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
