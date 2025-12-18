import type { Admin, Appointment, Doctor, Patient, Slot, SystemSettings, AuditLog, AvailabilityBlock, Receptionist, Facility } from "./types"

const STORAGE_KEYS = {
    ADMINS: "dental_admins",
    CURRENT_ADMIN: "dental_current_admin",
    DOCTORS: "dental_doctors_v2",
    APPOINTMENTS: "dental_appointments_v2",
    PATIENTS: "dental_patients_v2",
    AVAILABILITY: "dental_availability_v2",
    SLOTS: "dental_slots_v2",
    SETTINGS: "dental_settings_v2",
    AUDIT_LOGS: "dental_audit_v2",
    RECEPTIONISTS: "dental_receptionists_v2",
    FACILITIES: "dental_facilities_v2",
}

// Helper to handle window/localStorage in Next.js
const getFromStorage = (key: string) => {
    if (typeof window === "undefined") return null
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
}

const saveToStorage = (key: string, data: any) => {
    if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(data))
    }
}

// Admins
export const getAdmins = (): Admin[] => getFromStorage(STORAGE_KEYS.ADMINS) || []
export const getCurrentAdmin = (): Admin | null => getFromStorage(STORAGE_KEYS.CURRENT_ADMIN)
export const setCurrentAdmin = (admin: Admin | null) => saveToStorage(STORAGE_KEYS.CURRENT_ADMIN, admin)

export const authenticateAdmin = (username: string, password?: string): Admin | null => {
    const admins = getAdmins()
    const found = admins.find((a) => a.username === username && a.password === password)
    if (found) {
        const updated = { ...found, lastLogin: new Date().toISOString() }
        addAuditLog(found.id, found.username, "Login", "Successful session start")
        return updated
    }
    return null
}

// Doctors
export const getDoctors = (): Doctor[] => getFromStorage(STORAGE_KEYS.DOCTORS) || []
export const addDoctor = (doctor: Omit<Doctor, "id">) => {
    const doctors = getDoctors()
    const newDoctor = { ...doctor, id: crypto.randomUUID() }
    doctors.push(newDoctor)
    saveToStorage(STORAGE_KEYS.DOCTORS, doctors)
    const admin = getCurrentAdmin()
    if (admin) addAuditLog(admin.id, admin.username, "Create Doctor", `Added ${doctor.name}`)
}

export const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    const doctors = getDoctors()
    const index = doctors.findIndex((d) => d.id === id)
    if (index !== -1) {
        doctors[index] = { ...doctors[index], ...updates }
        saveToStorage(STORAGE_KEYS.DOCTORS, doctors)
        const admin = getCurrentAdmin()
        if (admin) addAuditLog(admin.id, admin.username, "Update Doctor", `Modified ${doctors[index].name}`)
    }
}

export const deleteDoctor = (id: string) => {
    const doctors = getDoctors()
    const filtered = doctors.filter((d) => d.id !== id)
    saveToStorage(STORAGE_KEYS.DOCTORS, filtered)
    return true
}

// Appointments
export const getAppointments = (): Appointment[] => getFromStorage(STORAGE_KEYS.APPOINTMENTS) || []
export const addAppointment = (appointment: Omit<Appointment, "id" | "createdAt">) => {
    const appointments = getAppointments()

    // Auto-resolve slotId if missing
    let finalSlotId = appointment.slotId
    if (!finalSlotId && appointment.appointmentDate && appointment.timeSlot && appointment.doctorId) {
        const slots = getSlots()
        const foundSlot = slots.find(s =>
            s.date === appointment.appointmentDate &&
            s.timeRange === appointment.timeSlot &&
            s.doctorId === appointment.doctorId
        )
        if (foundSlot) {
            finalSlotId = foundSlot.id
        }
    }

    const newAppointment = {
        ...appointment,
        slotId: finalSlotId,
        id: `APT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
    }
    appointments.push(newAppointment)
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments)

    // Update Slot Status
    if (finalSlotId) {
        updateSlotStatus(finalSlotId, "booked", newAppointment.id)
    }

    // Handle Patient Record
    findOrCreatePatient(appointment.patientName, appointment.patientIC, appointment.patientPhone, appointment.patientEmail)

    return newAppointment
}

export const updateAppointmentStatus = (id: string, status: Appointment["status"]) => {
    const appointments = getAppointments()
    const index = appointments.findIndex((a) => a.id === id)
    if (index !== -1) {
        const apt = appointments[index]
        apt.status = status
        saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments)

        // If cancelled, free up the slot
        if (status === "cancelled" && apt.slotId) {
            updateSlotStatus(apt.slotId, "available")
        }
    }
}

// Patients
export const getPatients = (): Patient[] => getFromStorage(STORAGE_KEYS.PATIENTS) || []
const findOrCreatePatient = (name: string, ic: string, phone: string, email?: string) => {
    const patients = getPatients()
    const existing = patients.find(p => p.ic === ic)
    if (existing) {
        existing.lastVisit = new Date().toISOString()
        saveToStorage(STORAGE_KEYS.PATIENTS, patients)
    } else {
        const newPatient: Patient = {
            id: crypto.randomUUID(),
            name, ic, phone, email,
            type: "new",
            lastVisit: new Date().toISOString()
        }
        patients.push(newPatient)
        saveToStorage(STORAGE_KEYS.PATIENTS, patients)
    }
}

// Receptionists
export const getReceptionists = (): Receptionist[] => getFromStorage(STORAGE_KEYS.RECEPTIONISTS) || []
export const addReceptionist = (receptionist: Omit<Receptionist, "id">) => {
    const receptionists = getReceptionists()
    const newRec = { ...receptionist, id: crypto.randomUUID() }
    receptionists.push(newRec)
    saveToStorage(STORAGE_KEYS.RECEPTIONISTS, receptionists)
}
export const updateReceptionist = (id: string, updates: Partial<Receptionist>) => {
    const receptionists = getReceptionists()
    const index = receptionists.findIndex(r => r.id === id)
    if (index !== -1) {
        receptionists[index] = { ...receptionists[index], ...updates }
        saveToStorage(STORAGE_KEYS.RECEPTIONISTS, receptionists)
    }
}
export const deleteReceptionist = (id: string) => {
    const receptionists = getReceptionists()
    const filtered = receptionists.filter(r => r.id !== id)
    saveToStorage(STORAGE_KEYS.RECEPTIONISTS, filtered)
}

// Facilities
export const getFacilities = (): Facility[] => getFromStorage(STORAGE_KEYS.FACILITIES) || []
export const addFacility = (facility: Omit<Facility, "id">) => {
    const facilities = getFacilities()
    const newFacility = { ...facility, id: crypto.randomUUID() }
    facilities.push(newFacility)
    saveToStorage(STORAGE_KEYS.FACILITIES, facilities)
}
export const updateFacility = (id: string, updates: Partial<Facility>) => {
    const facilities = getFacilities()
    const index = facilities.findIndex(f => f.id === id)
    if (index !== -1) {
        facilities[index] = { ...facilities[index], ...updates }
        saveToStorage(STORAGE_KEYS.FACILITIES, facilities)
    }
}
export const deleteFacility = (id: string) => {
    const facilities = getFacilities()
    const filtered = facilities.filter(f => f.id !== id)
    saveToStorage(STORAGE_KEYS.FACILITIES, filtered)
}

// Availability & Slots
export const getAvailabilityBlocks = (): AvailabilityBlock[] => getFromStorage(STORAGE_KEYS.AVAILABILITY) || []
export const addAvailabilityBlock = (block: Omit<AvailabilityBlock, "id">) => {
    const blocks = getAvailabilityBlocks()
    const newBlock = { ...block, id: crypto.randomUUID() }
    blocks.push(newBlock)
    saveToStorage(STORAGE_KEYS.AVAILABILITY, blocks)
    generateSlotsForBlock(newBlock)
}

export const deleteAvailabilityBlock = (id: string) => {
    const blocks = getAvailabilityBlocks()
    const filtered = blocks.filter(b => b.id !== id)
    saveToStorage(STORAGE_KEYS.AVAILABILITY, filtered)
    // In a real app, we'd delete associated available slots too
}

export const getSlots = (): Slot[] => getFromStorage(STORAGE_KEYS.SLOTS) || []
export const updateSlotStatus = (id: string, status: Slot["status"], appointmentId?: string) => {
    const slots = getSlots()
    const index = slots.findIndex(s => s.id === id)
    if (index !== -1) {
        slots[index].status = status
        slots[index].appointmentId = appointmentId
        saveToStorage(STORAGE_KEYS.SLOTS, slots)
    }
}

export const isSlotAvailable = (date: string, timeSlot: string, doctorId: string): boolean => {
    const slots = getSlots()
    const slot = slots.find(s =>
        s.date === date &&
        s.timeRange === timeSlot &&
        s.doctorId === doctorId
    )
    return slot ? slot.status === "available" : false
}

const generateSlotsForBlock = (block: AvailabilityBlock) => {
    const slots = getSlots()
    const startHour = parseInt(block.startTime.split(':')[0])
    const endHour = parseInt(block.endTime.split(':')[0])

    for (let h = startHour; h < endHour; h++) {
        // Simple 30 min slots
        const time1 = `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'} to ${h % 12 || 12}:30 ${h >= 12 ? 'PM' : 'AM'}`
        const time2 = `${h % 12 || 12}:30 ${h >= 12 ? 'PM' : 'AM'} to ${(h + 1) % 12 || 12}:00 ${h + 1 >= 12 ? 'PM' : 'AM'}`

        // Only add if doesn't exist
        if (!slots.some(s => s.doctorId === block.doctorId && s.date === block.date && s.timeRange === time1)) {
            slots.push({
                id: crypto.randomUUID(),
                doctorId: block.doctorId,
                date: block.date,
                timeRange: time1,
                status: "available"
            })
        }
        if (!slots.some(s => s.doctorId === block.doctorId && s.date === block.date && s.timeRange === time2)) {
            slots.push({
                id: crypto.randomUUID(),
                doctorId: block.doctorId,
                date: block.date,
                timeRange: time2,
                status: "available"
            })
        }
    }
    saveToStorage(STORAGE_KEYS.SLOTS, slots)
}

// Settings
export const getSettings = (): SystemSettings => getFromStorage(STORAGE_KEYS.SETTINGS) || {
    clinicName: "Klinik Pergigian Setapak",
    address: "Setapak, Kuala Lumpur",
    phone: "+60 3-XXXX XXXX",
    email: "ops@klinikpergigiansetapak.com",
    defaultSlotDuration: 30,
    workingHours: { start: "09:00", end: "18:00" },
    notifications: { sms: true, whatsapp: true, emailReminders: true }
}
export const updateSettings = (settings: SystemSettings) => saveToStorage(STORAGE_KEYS.SETTINGS, settings)

// Audit
export const getAuditLogs = (): AuditLog[] => getFromStorage(STORAGE_KEYS.AUDIT_LOGS) || []
export const addAuditLog = (adminId: string, adminUsername: string, action: string, details: string) => {
    const logs = getAuditLogs()
    const newLog: AuditLog = {
        id: crypto.randomUUID(),
        adminId,
        adminUsername,
        action,
        details,
        timestamp: new Date().toISOString(),
    }
    logs.unshift(newLog)
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100))
}

// Init Demo Data
export const initializeDemoData = () => {
    if (typeof window === "undefined") return

    if (getAdmins().length === 0) {
        saveToStorage(STORAGE_KEYS.ADMINS, [{
            id: "admin-1",
            username: "admin",
            password: "admin123",
            role: "super-admin",
            createdAt: new Date().toISOString()
        }])
    }

    if (getDoctors().length < 7) {
        // Clear existing to avoid duplicates when upgrading demo data
        saveToStorage(STORAGE_KEYS.DOCTORS, [])
        saveToStorage(STORAGE_KEYS.AVAILABILITY, [])
        saveToStorage(STORAGE_KEYS.SLOTS, [])

        const demoDoctors = [
            { id: "d1", name: "Dr. Sarah Johnson", specialization: "Orthodontist", phone: "91234567", email: "sarah@clinic.com", isActive: true, photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d2", name: "Dr. Michael Chen", specialization: "Periodontist", phone: "98765432", email: "michael@clinic.com", isActive: true, photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d3", name: "Dr. Emily Williams", specialization: "Pediatric Dentist", phone: "92345678", email: "emily@clinic.com", isActive: true, photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d4", name: "Dr. David Miller", specialization: "Endodontist", phone: "93456789", email: "david@clinic.com", isActive: true, photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d5", name: "Dr. Sophia Garcia", specialization: "Oral Surgeon", phone: "94567890", email: "sophia@clinic.com", isActive: true, photo: "https://images.unsplash.com/photo-1590611380053-9da508bc117e?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d6", name: "Dr. James Wilson", specialization: "Prosthodontist", phone: "95678901", email: "james@clinic.com", isActive: true, photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d7", name: "Dr. Olivia Taylor", specialization: "General Dentist", phone: "96789012", email: "olivia@clinic.com", isActive: true, photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200" }
        ]
        saveToStorage(STORAGE_KEYS.DOCTORS, demoDoctors)

        // Auto-generate some slots for next 7 days
        const today = new Date()
        for (let i = 0; i < 7; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)
            const dateStr = date.toISOString().split('T')[0]

            // Skip weekends for demo generation to look realistic
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                demoDoctors.forEach(d => {
                    addAvailabilityBlock({ doctorId: d.id, date: dateStr, startTime: "09:00", endTime: "17:00" })
                })
            }
        }
    }

    if (getPatients().length === 0) {
        saveToStorage(STORAGE_KEYS.PATIENTS, [
            { id: "p1", name: "John Smith", ic: "S1234567A", phone: "90001111", type: "existing", lastVisit: new Date().toISOString() }
        ])
    }

    if (getReceptionists().length < 5) {
        const demoRecs: Receptionist[] = [
            { id: "r1", name: "Alice Wong", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200", phone: "91112222", email: "alice@clinic.com", shift: "morning", isActive: true },
            { id: "r2", name: "Bob Tan", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200", phone: "92223333", email: "bob@clinic.com", shift: "afternoon", isActive: true },
            { id: "r3", name: "Catherine Lim", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200&h=200", phone: "93334444", email: "catherine@clinic.com", shift: "full-day", isActive: true },
            { id: "r4", name: "Daniel Seow", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200", phone: "94445555", email: "daniel@clinic.com", shift: "morning", isActive: true },
            { id: "r5", name: "Elena Rodriguez", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200", phone: "95556666", email: "elena@clinic.com", shift: "afternoon", isActive: true }
        ]
        saveToStorage(STORAGE_KEYS.RECEPTIONISTS, demoRecs)
    }

    if (getFacilities().length === 0) {
        const demoFacilities = [
            { id: "f1", name: "Treatment Room 1", description: "Standard dental treatment suite", status: "operational" },
            { id: "f2", name: "X-Ray Lab", description: "Digital radiography facility", status: "operational" },
            { id: "f3", name: "Sterilization Area", description: "Central sterile services department", status: "operational" }
        ]
        saveToStorage(STORAGE_KEYS.FACILITIES, demoFacilities)
    }
}
