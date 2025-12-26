import type { Admin, Appointment, Doctor, Patient, Slot, SystemSettings, AuditLog, Receptionist, Facility, DoctorWeeklySchedule, DoctorLeave, DayOfWeek, ScheduleTimeRange, AvailabilityBlock, ConsultationRecord, DoctorDateSchedule, Announcement } from "./types"

const STORAGE_KEYS = {
    ADMINS: "dental_admins",
    CURRENT_ADMIN: "dental_current_admin",
    DOCTORS: "dental_doctors_v3",
    APPOINTMENTS: "dental_appointments_v3",
    PATIENTS: "dental_patients_v3",
    SCHEDULES: "dental_schedules_v3",
    LEAVES: "dental_leaves_v3",
    SLOTS: "dental_slots_v3",
    SETTINGS: "dental_settings_v3",
    AUDIT_LOGS: "dental_audit_v3",
    RECEPTIONISTS: "dental_receptionists_v3",
    FACILITIES: "dental_facilities_v3",
}

// Utility for unique IDs
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
    }
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

// --- API CLIENT (CLOUD MIGRATION) ---
const API_BASE = '/api';

export const seedDatabaseAsync = async () => {
    try {
        await fetch(`${API_BASE}/seed`);
    } catch (e) {
        console.error("Seeding failed", e);
    }
}

export const getDoctorsAsync = async (): Promise<Doctor[]> => {
    try {
        const res = await fetch(`${API_BASE}/doctors`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch doctors", e);
        return [];
    }
}

export const addDoctorAsync = async (doctor: Omit<Doctor, "id">) => {
    const res = await fetch(`${API_BASE}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctor)
    });
    if (!res.ok) throw new Error('Failed to create doctor');
    return await res.json();
}

export const updateDoctorAsync = async (id: string, updates: Partial<Doctor>) => {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update doctor');
    return await res.json();
}

export const deleteDoctorAsync = async (id: string) => {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete doctor');
    return await res.json();
}

export const addAppointmentAsync = async (appointment: any) => {
    const res = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointment)
    });
    if (!res.ok) throw new Error('Booking failed');
    return await res.json();
}

export const getSlotsAsync = async (doctorId?: string, date?: string): Promise<Slot[]> => {
    try {
        let url = `${API_BASE}/slots?`;
        if (doctorId) url += `doctorId=${doctorId}&`;
        if (date) url += `date=${date}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch slots", e);
        return [];
    }
}

export const getDoctorScheduleAsync = async (doctorId: string): Promise<DoctorWeeklySchedule | null> => {
    try {
        const res = await fetch(`${API_BASE}/doctors/${doctorId}/schedule`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch schedule", e);
        return null;
    }
}

export const saveDoctorScheduleAsync = async (schedule: DoctorWeeklySchedule) => {
    const res = await fetch(`${API_BASE}/doctors/${schedule.doctorId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
    });
    if (!res.ok) throw new Error('Failed to save schedule');

    // Also trigger cloud regeneration
    await regenerateDoctorSlotsAsync(schedule.doctorId);

    return await res.json();
}

// Date-specific schedule functions
export const getDoctorDateScheduleAsync = async (doctorId: string): Promise<DoctorDateSchedule | null> => {
    try {
        const res = await fetch(`${API_BASE}/doctors/${doctorId}/date-schedule`, { cache: 'no-store' });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch date schedule", e);
        return null;
    }
}

export const saveDoctorDateScheduleAsync = async (schedule: DoctorDateSchedule) => {
    const res = await fetch(`${API_BASE}/doctors/${schedule.doctorId}/date-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule)
    });
    if (!res.ok) throw new Error('Failed to save date schedule');

    // Also trigger cloud regeneration
    await regenerateDoctorSlotsAsync(schedule.doctorId);

    return await res.json();
}

export const regenerateDoctorSlotsAsync = async (doctorId: string) => {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/slots/regenerate`, {
        method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to regenerate slots');
    return await res.json();
}

export const getDoctorLeavesAsync = async (doctorId: string): Promise<DoctorLeave[]> => {
    try {
        const res = await fetch(`${API_BASE}/doctors/${doctorId}/leaves`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch leaves", e);
        return [];
    }
}

export const addDoctorLeaveAsync = async (leave: Omit<DoctorLeave, "id">) => {
    const res = await fetch(`${API_BASE}/doctors/${leave.doctorId}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leave)
    });
    if (!res.ok) throw new Error('Failed to record leave');
    return await res.json();
}

export const deleteDoctorLeaveAsync = async (doctorId: string, leaveId: string) => {
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/leaves/${leaveId}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete leave');
    return await res.json();
}
export const getAnnouncementsAsync = async (isAdmin: boolean = false): Promise<Announcement[]> => {
    try {
        const res = await fetch(`${API_BASE}/announcements${isAdmin ? '?admin=true' : ''}`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch announcements", e);
        return [];
    }
}

export const addAnnouncementAsync = async (announcement: Omit<Announcement, "id">) => {
    const res = await fetch(`${API_BASE}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement)
    });
    if (!res.ok) throw new Error('Failed to create announcement');
    return await res.json();
}

export const updateAnnouncementAsync = async (id: string, updates: Partial<Announcement>) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update announcement');
    return await res.json();
}

export const deleteAnnouncementAsync = async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete announcement');
    return await res.json();
}

// --- END API CLIENT ---

// Helper to handle window/localStorage in Next.js
const getFromStorage = (key: string) => {
    if (typeof window === "undefined") return null
    try {
        const data = localStorage.getItem(key)
        return data ? JSON.parse(data) : null
    } catch (e) {
        console.error(`Error parsing storage key ${key}:`, e)
        return null
    }
}

const saveToStorage = (key: string, data: any) => {
    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(key, JSON.stringify(data))
        } catch (e) {
            console.error(`Error saving to storage key ${key}:`, e)
        }
    }
}

// Admins
export const getAdmins = (): Admin[] => {
    const data = getFromStorage(STORAGE_KEYS.ADMINS)
    return Array.isArray(data) ? data : []
}

export const getCurrentAdmin = (): Admin | null => getFromStorage(STORAGE_KEYS.CURRENT_ADMIN)
export const setCurrentAdmin = (admin: Admin | null) => saveToStorage(STORAGE_KEYS.CURRENT_ADMIN, admin)

export const authenticateAdmin = (username: string, password?: string): Admin | null => {
    const admins = getAdmins()
    const found = admins.find((a) => a.username === username && (a.password === password || !a.password))
    if (found) {
        // Explicitly block doctors from logging in
        if (found.role === 'doctor') {
            return null
        }

        const updated = { ...found, lastLogin: new Date().toISOString() }
        setCurrentAdmin(updated)
        addAuditLog(found.id, found.username, "Login", "Successful session start")
        return updated
    }

    // Check Receptionists
    const receptionists = getReceptionists()
    const foundRec = receptionists.find(r => r.username === username && (r.password === password || (!r.password && !password)))

    if (foundRec && foundRec.isActive) {
        const recAsAdmin: Admin = {
            id: foundRec.id,
            username: foundRec.username,
            role: "receptionist",
            lastLogin: new Date().toISOString()
        }
        setCurrentAdmin(recAsAdmin)
        addAuditLog(foundRec.id, foundRec.username, "Login", "Receptionist session start")
        return recAsAdmin
    }

    return null
}

// Doctors
export const getDoctors = (): Doctor[] => getFromStorage(STORAGE_KEYS.DOCTORS) || []
export const addDoctor = (doctor: Omit<Doctor, "id">) => {
    const doctors = getDoctors()
    const newDoctor = { ...doctor, id: generateId() }
    doctors.push(newDoctor)
    saveToStorage(STORAGE_KEYS.DOCTORS, doctors)

    // Initialize an empty schedule for the new doctor
    saveDoctorSchedule({ doctorId: newDoctor.id, days: {} })

    const admin = getCurrentAdmin()
    if (admin) addAuditLog(admin.id, admin.username, "Create Doctor", `Added ${doctor.name}`)
    return newDoctor
}

export const updateDoctor = (id: string, updates: Partial<Doctor>) => {
    const doctors = getDoctors()
    const index = doctors.findIndex((d) => d.id === id)
    if (index !== -1) {
        doctors[index] = { ...doctors[index], ...updates }
        saveToStorage(STORAGE_KEYS.DOCTORS, doctors)

        // If slot duration or availability changes, we might want to regenerate slots
        // But for now, we'll let the user trigger regeneration or do it on next generation cycle
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

// Weekly Schedules
export const getDoctorSchedules = (): DoctorWeeklySchedule[] => getFromStorage(STORAGE_KEYS.SCHEDULES) || []
export const getDoctorSchedule = (doctorId: string): DoctorWeeklySchedule | undefined =>
    getDoctorSchedules().find(s => s.doctorId === doctorId)

export const saveDoctorSchedule = (schedule: DoctorWeeklySchedule) => {
    const schedules = getDoctorSchedules()
    const index = schedules.findIndex(s => s.doctorId === schedule.doctorId)
    if (index !== -1) {
        schedules[index] = schedule
    } else {
        schedules.push(schedule)
    }
    saveToStorage(STORAGE_KEYS.SCHEDULES, schedules)

    // Trigger slot regeneration for this doctor for next 30 days
    regenerateDoctorSlots(schedule.doctorId)
}

// Leaves
export const getDoctorLeaves = (doctorId?: string): DoctorLeave[] => {
    const leaves = getFromStorage(STORAGE_KEYS.LEAVES) || []
    if (doctorId) return leaves.filter((l: DoctorLeave) => l.doctorId === doctorId)
    return leaves
}

export const addDoctorLeave = (leave: Omit<DoctorLeave, "id">) => {
    const leaves = getDoctorLeaves()
    const newLeave = { ...leave, id: generateId() }
    leaves.push(newLeave)
    saveToStorage(STORAGE_KEYS.LEAVES, leaves)

    // Disable slots affected by this leave
    applyLeaveToSlots(newLeave)

    const admin = getCurrentAdmin()
    if (admin) addAuditLog(admin.id, admin.username, "Add Leave", `Added leave for doctor ${leave.doctorId} on ${leave.date}`)
}

export const deleteDoctorLeave = (id: string) => {
    const leaves = getDoctorLeaves()
    const leaveToDelete = leaves.find(l => l.id === id)
    if (!leaveToDelete) return

    const filtered = leaves.filter(l => l.id !== id)
    saveToStorage(STORAGE_KEYS.LEAVES, filtered)

    // Re-enable slots that were blocked by this leave (if they are still in schedule)
    regenerateDoctorSlots(leaveToDelete.doctorId)
}

// Availability Blocks (Duty Hub)
export const getAvailabilityBlocks = (): AvailabilityBlock[] => getFromStorage(STORAGE_KEYS.SLOTS + "_blocks") || []
export const addAvailabilityBlock = (block: Omit<AvailabilityBlock, "id">) => {
    const blocks = getAvailabilityBlocks()
    const newBlock = { ...block, id: generateId() }
    blocks.push(newBlock)
    saveToStorage(STORAGE_KEYS.SLOTS + "_blocks", blocks)

    // Trigger slot generation for this doctor and date
    regenerateDoctorSlots(block.doctorId)

    const admin = getCurrentAdmin()
    if (admin) addAuditLog(admin.id, admin.username, "Add Duty Block", `Added duty for ${block.doctorId} on ${block.date}`)
}
export const deleteAvailabilityBlock = (id: string) => {
    const blocks = getAvailabilityBlocks()
    const blockToDelete = blocks.find(b => b.id === id)
    if (!blockToDelete) return

    const filtered = blocks.filter(b => b.id !== id)
    saveToStorage(STORAGE_KEYS.SLOTS + "_blocks", filtered)

    // Re-trigger slot generation
    regenerateDoctorSlots(blockToDelete.doctorId)
}

// Slots Engine
export const getSlots = (doctorId?: string, date?: string): Slot[] => {
    const slots = getFromStorage(STORAGE_KEYS.SLOTS) || []
    let filtered = slots
    if (doctorId) filtered = filtered.filter((s: Slot) => s.doctorId === doctorId)
    if (date) filtered = filtered.filter((s: Slot) => s.date === date)
    return filtered
}

export const isSlotAvailable = (date: string, timeSlot: string, doctorId: string): boolean => {
    const slots = getSlots(doctorId, date)
    const slot = slots.find(s => s.timeRange === timeSlot)
    return slot ? slot.status === "available" : false
}

export const updateSlotStatus = (id: string, status: Slot["status"], appointmentId?: string, blockReason?: string) => {
    const slots = getSlots()
    const index = slots.findIndex(s => s.id === id)
    if (index !== -1) {
        slots[index].status = status
        slots[index].appointmentId = appointmentId
        slots[index].blockReason = blockReason
        saveToStorage(STORAGE_KEYS.SLOTS, slots)
    }
}

export const blockSlot = (id: string, reason: string) => {
    updateSlotStatus(id, "blocked", undefined, reason)
}

export const updateSlotStatusAsync = async (id: string, status: Slot["status"], blockReason?: string) => {
    const res = await fetch(`${API_BASE}/slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, blockReason })
    });
    if (!res.ok) throw new Error('Failed to update slot status');
    return await res.json();
}

export const unblockSlot = (id: string) => {
    updateSlotStatus(id, "available")
}


// Regenerate slots for a specific doctor for the next 60 days
export const regenerateDoctorSlots = (doctorId: string) => {
    const doctor = getDoctors().find(d => d.id === doctorId)
    const schedule = getDoctorSchedule(doctorId)
    const adhocBlocks = getAvailabilityBlocks().filter(b => b.doctorId === doctorId)
    if (!doctor) return

    const existingSlots = getSlots()
    // Keep only slots that are booked, or for other doctors
    const slotsToKeep = existingSlots.filter(s => s.doctorId !== doctorId || s.status === "booked")

    const newSlots: Slot[] = []
    const today = new Date()

    for (let i = 0; i < 60; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek

        // 1. Get ranges from weekly schedule
        const daySchedule = schedule?.days[dayName] || []

        // 2. Get ranges from ad-hoc availability blocks for this specific date
        const dayAdhoc = adhocBlocks.filter(b => b.date === dateStr).map(b => ({
            start: b.startTime,
            end: b.endTime
        }))

        // Combine all ranges
        const allRanges = [...daySchedule, ...dayAdhoc]

        if (allRanges.length > 0 && doctor.isActive && doctor.isAvailable) {
            allRanges.forEach(range => {
                const startTimeParts = range.start.split(':').map(Number)
                const endTimeParts = range.end.split(':').map(Number)

                let current = startTimeParts[0] * 60 + startTimeParts[1]
                const end = endTimeParts[0] * 60 + endTimeParts[1]

                while (current + doctor.slotDuration <= end) {
                    const sH = Math.floor(current / 60)
                    const sM = current % 60
                    const eH = Math.floor((current + doctor.slotDuration) / 60)
                    const eM = (current + doctor.slotDuration) % 60

                    const startTimeStr = `${sH.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')}`
                    const endTimeStr = `${eH.toString().padStart(2, '0')}:${eM.toString().padStart(2, '0')}`

                    const timeRange = `${formatTime(startTimeStr)} - ${formatTime(endTimeStr)}`

                    // Check if a booked slot already exists for this time
                    const alreadyBooked = existingSlots.find(s =>
                        s.doctorId === doctorId &&
                        s.date === dateStr &&
                        s.startTime === startTimeStr &&
                        s.status === "booked"
                    )

                    if (!alreadyBooked) {
                        // Avoid duplicates if ad-hoc overlaps with schedule
                        const isDuplicate = newSlots.some(s =>
                            s.doctorId === doctorId &&
                            s.date === dateStr &&
                            s.startTime === startTimeStr
                        )

                        if (!isDuplicate) {
                            newSlots.push({
                                id: generateId(),
                                doctorId,
                                date: dateStr,
                                timeRange,
                                startTime: startTimeStr,
                                endTime: endTimeStr,
                                status: "available",
                                type: "public"
                            })
                        }
                    } else {
                        // Keep the booked slot (avoid duplicates)
                        if (!newSlots.some(s => s.id === alreadyBooked.id)) {
                            newSlots.push(alreadyBooked)
                        }
                    }

                    current += doctor.slotDuration
                }
            })
        }
    }

    const updatedSlots = [...slotsToKeep.filter(s => s.doctorId !== doctorId), ...newSlots]
    saveToStorage(STORAGE_KEYS.SLOTS, updatedSlots)

    // Re-apply leaves
    const leaves = getDoctorLeaves(doctorId)
    leaves.forEach(applyLeaveToSlots)
}

const applyLeaveToSlots = (leave: DoctorLeave) => {
    const slots = getSlots()
    let changed = false
    slots.forEach(s => {
        if (s.doctorId === leave.doctorId && s.date === leave.date && s.status !== "booked") {
            if (leave.type === "full") {
                s.status = "blocked"
                s.blockReason = leave.reason || "Doctor on leave"
                changed = true
            } else {
                // Partial leave - check if slot overlaps with leave hours
                if (leave.startTime && leave.endTime) {
                    if (isOverlapping(s.startTime, s.endTime, leave.startTime, leave.endTime)) {
                        s.status = "blocked"
                        s.blockReason = leave.reason || "Doctor unavailable"
                        changed = true
                    }
                }
            }
        }
    })
    if (changed) saveToStorage(STORAGE_KEYS.SLOTS, slots)
}

const isOverlapping = (s1: string, e1: string, s2: string, e2: string) => {
    return s1 < e2 && s2 < e1
}

const formatTime = (time24: string) => {
    const [h, m] = time24.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`
}

// Appointments
export const getAppointmentsAsync = async (date?: string): Promise<Appointment[]> => {
    try {
        let url = `${API_BASE}/appointments`;
        if (date) url += `?date=${date}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch appointments", e);
        return [];
    }
}

export const getPatientAppointmentsAsync = async (patientIC: string): Promise<Appointment[]> => {
    try {
        const res = await fetch(`${API_BASE}/appointments?patientIC=${patientIC}`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch patient appointments", e);
        return [];
    }
}

export const getPatientAppointmentsByPhoneAsync = async (patientPhone: string): Promise<Appointment[]> => {
    try {
        const res = await fetch(`${API_BASE}/appointments?patientPhone=${encodeURIComponent(patientPhone)}`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch patient appointments by phone", e);
        return [];
    }
}

// --- Consultation Records (Patient Data) ---
export const getDoctorConsultationsAsync = async (doctorId: string): Promise<ConsultationRecord[]> => {
    try {
        const res = await fetch(`${API_BASE}/consultations?doctorId=${doctorId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch consultation records");
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

export const getAllConsultationsAsync = async (): Promise<ConsultationRecord[]> => {
    try {
        const res = await fetch(`${API_BASE}/consultations`, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to fetch all consultation records");
        return await res.json();
    } catch (e) {
        console.error(e);
        return [];
    }
}

export const addConsultationRecordAsync = async (data: Partial<ConsultationRecord>): Promise<ConsultationRecord> => {
    const res = await fetch(`${API_BASE}/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to add record");
    return await res.json();
}

export const bulkAddConsultationRecordsAsync = async (data: Partial<ConsultationRecord>[]): Promise<any> => {
    const res = await fetch(`${API_BASE}/consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to bulk upload");
    }
    return await res.json();
}

export const updateConsultationRecordAsync = async (id: string, data: Partial<ConsultationRecord>): Promise<ConsultationRecord> => {
    const res = await fetch(`${API_BASE}/consultations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Failed to update record");
    return await res.json();
}

export const deleteConsultationRecordAsync = async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/consultations/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete record");
}

export const updateAppointmentStatusAsync = async (id: string, status: Appointment["status"], managedBy?: { id: string, name: string, role: string }) => {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, managedBy })
    });
    if (!res.ok) throw new Error('Failed to update appointment status');
    return await res.json();
}

export const rescheduleAppointmentAsync = async (id: string, newSlotId: string, newDate: string, newTimeSlot: string) => {
    const res = await fetch(`${API_BASE}/appointments/${id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSlotId, newDate, newTimeSlot })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reschedule appointment');
    }
    return await res.json();
}

export const getAppointments = (): Appointment[] => getFromStorage(STORAGE_KEYS.APPOINTMENTS) || []
export const addAppointment = (appointment: Omit<Appointment, "id" | "createdAt">) => {
    const appointments = getAppointments()
    const newAppointment = {
        ...appointment,
        id: `APT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        createdAt: new Date().toISOString(),
    }
    appointments.push(newAppointment)
    saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments)

    // Update Slot Status
    updateSlotStatus(appointment.slotId, "booked", newAppointment.id)

    // Handle Patient Record
    findOrCreatePatient(appointment.patientName, appointment.patientIC, appointment.patientPhone, appointment.patientEmail)

    return newAppointment
}

export const updateAppointmentStatus = (id: string, status: Appointment["status"]) => {
    const appointments = getAppointments()
    const index = appointments.findIndex((a) => a.id === id)
    if (index !== -1) {
        const apt = appointments[index]
        const oldStatus = apt.status
        apt.status = status
        saveToStorage(STORAGE_KEYS.APPOINTMENTS, appointments)

        // If cancelled or no-show, free up the slot
        if ((status === "cancelled" || status === "no-show") && apt.slotId) {
            updateSlotStatus(apt.slotId, "available")
        }
    }
}

// Patients
export const getPatientsAsync = async (): Promise<Patient[]> => {
    try {
        const res = await fetch(`${API_BASE}/patients?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch patients", e);
        return [];
    }
}

export const getPatientStatsAsync = async (): Promise<{ new: number, existing: number, total: number }> => {
    try {
        const res = await fetch(`${API_BASE}/patients?mode=stats`, { cache: 'no-store' });
        if (!res.ok) return { new: 0, existing: 0, total: 0 };
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch patient stats", e);
        return { new: 0, existing: 0, total: 0 };
    }
}

export const getPatients = (): Patient[] => getFromStorage(STORAGE_KEYS.PATIENTS) || []
const findOrCreatePatient = (name: string, ic: string, phone: string, email?: string) => {
    const patients = getPatients()
    const existing = patients.find(p => p.ic === ic)
    if (existing) {
        existing.lastVisit = new Date().toISOString()
        saveToStorage(STORAGE_KEYS.PATIENTS, patients)
    } else {
        const newPatient: Patient = {
            id: generateId(),
            name, ic, phone, email,
            type: "new",
            lastVisit: new Date().toISOString()
        }
        patients.push(newPatient)
        saveToStorage(STORAGE_KEYS.PATIENTS, patients)
    }
}

// Receptionists
export const getReceptionistsAsync = async (): Promise<Receptionist[]> => {
    try {
        const res = await fetch(`${API_BASE}/receptionists`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch receptionists", e);
        return [];
    }
}

export const addReceptionistAsync = async (receptionist: Omit<Receptionist, "id">) => {
    const res = await fetch(`${API_BASE}/receptionists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receptionist)
    });
    if (!res.ok) throw new Error('Failed to add receptionist');
    return await res.json();
}

export const updateReceptionistAsync = async (id: string, updates: Partial<Receptionist>) => {
    const res = await fetch(`${API_BASE}/receptionists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update receptionist');
    return await res.json();
}

export const resetReceptionistPasswordAsync = async (id: string) => {
    const res = await fetch(`${API_BASE}/receptionists/${id}/reset-password`, {
        method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to reset password');
    return await res.json();
}

export const deleteReceptionistAsync = async (id: string) => {
    const res = await fetch(`${API_BASE}/receptionists/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete receptionist');
    return await res.json();
}

export const getReceptionists = (): Receptionist[] => getFromStorage(STORAGE_KEYS.RECEPTIONISTS) || []
export const addReceptionist = (receptionist: Omit<Receptionist, "id">) => {
    const receptionists = getReceptionists()
    const newRec = { ...receptionist, id: generateId() }
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
    const newFacility = { ...facility, id: generateId() }
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

// Settings
export const getSettings = (): SystemSettings => getFromStorage(STORAGE_KEYS.SETTINGS) || {
    clinicName: "Klinik Pergigian Setapak (Sri Rampai)",
    address: "16-2, Jalan 46/26, Taman Sri Rampai, 53300 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia",
    phone: "+60 17-510 1003",
    email: "Kpsetapaksr@gmail.com",
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
        id: generateId(),
        adminId,
        adminUsername,
        action,
        details,
        timestamp: new Date().toISOString(),
    }
    logs.unshift(newLog)
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100))
}

// Initialize Demo Data
export const initializeDemoData = (force: boolean = false) => {
    if (typeof window === "undefined") return

    if (getAdmins().length === 0) {
        saveToStorage(STORAGE_KEYS.ADMINS, [{
            id: "admin-1",
            username: "admin",
            password: "admin123",
            role: "super-admin"
        }])
    }

    const existingDoctors = getDoctors()
    if (existingDoctors.length < 7 || force) {
        const demoDoctors: Doctor[] = [
            { id: "d1", name: "Dr. Netheananthene", specialization: "Dental practitioner", phone: "91234567", email: "nethe@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474669/dental-clinic/homepage/Dr.Netheananthene.png" },
            { id: "d2", name: "Dr. Durshayine", specialization: "Dental practitioner", phone: "98765432", email: "kanag@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474647/dental-clinic/homepage/Dr_Kanagarathinam.png" },
            { id: "d3", name: "Dr. Kanagarathinam", specialization: "Dental practitioner", phone: "92345678", email: "dursh@clinic.com", isActive: true, isAvailable: true, slotDuration: 20, photo: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474662/dental-clinic/homepage/Dr.Durshayine.png" },

            { id: "d4", name: "Dr. Sharviind Raj", specialization: "Dental practitioner", phone: "93456789", email: "sharv@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474655/dental-clinic/homepage/Dr_Sharviind_Raj.png" },
            { id: "d5", name: "Dr. Nicholas Gabriel", specialization: "Dental practitioner", phone: "94567890", email: "nich@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474658/dental-clinic/homepage/Dr._Nicholas_Gabriel.png" },
            { id: "d6", name: "Dr. Navin Nair", specialization: "Dental practitioner", phone: "95678901", email: "navin@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://res.cloudinary.com/dhgwe2rz3/image/upload/v1766474651/dental-clinic/homepage/Dr_Navin_Nair.png" }
        ]
        saveToStorage(STORAGE_KEYS.DOCTORS, demoDoctors)

        demoDoctors.forEach(d => {
            const schedule: DoctorWeeklySchedule = {
                doctorId: d.id,
                days: {
                    Monday: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }],
                    Tuesday: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }],
                    Wednesday: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }],
                    Thursday: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }],
                    Friday: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }],
                }
            }
            saveDoctorSchedule(schedule)
        })
    }

    if (getAppointments().length === 0 || force) {
        // Find some available slots for today
        const todayStr = new Date().toISOString().split('T')[0]
        const allSlots = getSlots()
        const todaySlots = allSlots.filter(s => s.date === todayStr && s.status === 'available')

        const demoPatients = [
            { name: "John Smith", ic: "S1234567A", phone: "90001111" },
            { name: "Siti Aminah", ic: "850101-14-1234", phone: "012-3456789" },
            { name: "Chong Wei", ic: "900505-10-5678", phone: "011-22334455" },
            { name: "Muthu Arumugam", ic: "781212-08-9012", phone: "017-8899001" },
            { name: "Sarah Tan", ic: "950606-14-4321", phone: "019-1122334" }
        ]

        demoPatients.forEach((p, idx) => {
            if (todaySlots[idx]) {
                addAppointment({
                    patientName: p.name,
                    patientIC: p.ic,
                    patientPhone: p.phone,
                    patientType: "existing",
                    appointmentDate: todayStr,
                    timeSlot: todaySlots[idx].timeRange,
                    slotId: todaySlots[idx].id,
                    doctorId: todaySlots[idx].doctorId,
                    status: "confirmed"
                })
            }
        })
    }

    if (getReceptionists().length === 0 || force) {
        const demoRecs: Receptionist[] = [
            { id: "r1", name: "Alice Wong", username: "alice", password: "123", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200", phone: "91112222", email: "alice@clinic.com", shift: "morning", isActive: true },
            { id: "r2", name: "Bob Tan", username: "bob", password: "123", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200", phone: "92223333", email: "bob@clinic.com", shift: "afternoon", isActive: true }
        ]
        saveToStorage(STORAGE_KEYS.RECEPTIONISTS, demoRecs)
    }
}

