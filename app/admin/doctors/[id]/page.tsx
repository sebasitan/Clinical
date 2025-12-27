"use client"

import { useState, useEffect, useMemo, memo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import {
    getDoctorsAsync,
    updateDoctorAsync,
    getDoctorScheduleAsync,
    saveDoctorScheduleAsync,
    getDoctorDateScheduleAsync,
    saveDoctorDateScheduleAsync,
    getDoctorLeavesAsync,
    addDoctorLeaveAsync,
    deleteDoctorLeaveAsync,
    getAppointmentsAsync,
    getSlotsAsync,
    regenerateDoctorSlotsAsync,
    updateAppointmentStatusAsync,
    updateSlotStatusAsync,
    getDoctorConsultationsAsync,
    addConsultationRecordAsync,
    bulkAddConsultationRecordsAsync,
    updateConsultationRecordAsync,
    deleteConsultationRecordAsync
} from "@/lib/storage"
import { cn, formatLocalDate } from "@/lib/utils"
import type { Doctor, DoctorWeeklySchedule, DoctorDateSchedule, DayOfWeek, ScheduleTimeRange, DoctorLeave, Appointment, Slot, ConsultationRecord } from "@/lib/types"
import {
    ArrowLeft,
    Calendar,
    Clock,
    Plus,
    Trash2,
    User,
    Activity,
    ShieldCheck,
    ShieldAlert,
    Save,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Briefcase,
    Stethoscope,
    Filter,
    ShieldX,
    Lock,
    Unlock,
    Ban,
    Search,
    ChevronLeft,
    ChevronRight,
    Edit,
    ArrowRight,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const SlotButton = memo(({ slot, onToggle }: { slot: Slot, onToggle: () => void }) => {
    const isAvailable = slot.status === "available"
    const isBooked = slot.status === "booked"
    const isBlocked = slot.status === "blocked"

    return (
        <button
            onClick={() => !isBooked && onToggle()}
            disabled={isBooked}
            className={cn(
                "p-3 rounded-2xl border-2 transition-all text-left relative overflow-hidden group h-full flex flex-col justify-between",
                isAvailable
                    ? "bg-white border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30"
                    : isBooked
                        ? "bg-blue-50 border-blue-100 cursor-not-allowed opacity-80"
                        : "bg-red-50/10 border-red-100 hover:border-red-200"
            )}
        >
            <div className="flex items-center justify-between mb-1.5 w-full">
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                    isAvailable ? "bg-emerald-100 text-emerald-700" : isBooked ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                )}>
                    {slot.status === "available" ? "Open" : slot.status === "booked" ? "Booked" : "Blocked"}
                </span>
                {!isBooked && (
                    <div className="text-slate-300 group-hover:text-slate-400 transition-colors">
                        {isAvailable ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    </div>
                )}
            </div>

            <div className="flex flex-col">
                <span className="text-[13px] font-black text-slate-900 leading-tight">
                    {slot.timeRange.split(' - ')[0]}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {slot.timeRange.split(' - ')[1]}
                </span>
            </div>

            {isBooked && (
                <div className="mt-2 pt-2 border-t border-blue-100/50">
                    <p className="text-[9px] font-bold text-blue-600 truncate uppercase">Appointment Reserved</p>
                </div>
            )}
        </button>
    )
})
SlotButton.displayName = "SlotButton"

export default function DoctorManagementPage() {
    const { id } = useParams()
    const router = useRouter()
    const { isLoading: authLoading } = useAdminAuth()
    const { toast } = useToast()

    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [schedule, setSchedule] = useState<DoctorWeeklySchedule | null>(null)
    const [dateSchedule, setDateSchedule] = useState<DoctorDateSchedule | null>(null)
    const [selectedScheduleDate, setSelectedScheduleDate] = useState<string | null>(null)
    const [leaves, setLeaves] = useState<DoctorLeave[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [slots, setSlots] = useState<Slot[]>([])
    const [activeTab, setActiveTab] = useState("calendar")
    const [selectedPatientIC, setSelectedPatientIC] = useState<string | null>(null)
    const [patientHistory, setPatientHistory] = useState<Appointment[]>([])
    const [isHistoryOpen, setIsHistoryOpen] = useState(false)
    const [viewDate, setViewDate] = useState(() => formatLocalDate(new Date()))
    const [isBlocking, setIsBlocking] = useState(false)
    const [slotSearch, setSlotSearch] = useState("")
    const [isCancelling, setIsCancelling] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
    const [cancelReason, setCancelReason] = useState("")
    const [patientSearch, setPatientSearch] = useState("")

    // Consultation Records (Patient Data) State
    const [consultations, setConsultations] = useState<ConsultationRecord[]>([])
    const [isAddRecordOpen, setIsAddRecordOpen] = useState(false)
    const [isCSVImportOpen, setIsCSVImportOpen] = useState(false)
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvPreview, setCsvPreview] = useState<Partial<ConsultationRecord>[]>([])
    const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(null)
    const [deletingRecord, setDeletingRecord] = useState<ConsultationRecord | null>(null)
    const [newRecord, setNewRecord] = useState<Partial<ConsultationRecord>>({
        patientName: "",
        patientIC: "",
        handphoneNo: "",
        cardNo: "",
        totalFee: 0,
        consultationFee: 0,
        consultationDate: formatLocalDate(new Date()),
        fixDate: "",
        remark: "",
        updates: ""
    })

    const [hasChanges, setHasChanges] = useState(false)
    const [isSavingAll, setIsSavingAll] = useState(false)
    const [pendingDeletions, setPendingDeletions] = useState<string[]>([])
    const [initialDocState, setInitialDocState] = useState<Doctor | null>(null)
    const [initialScheduleState, setInitialScheduleState] = useState<DoctorWeeklySchedule | null>(null)
    const [initialDateScheduleState, setInitialDateScheduleState] = useState<DoctorDateSchedule | null>(null)
    const [initialConsultations, setInitialConsultations] = useState<ConsultationRecord[]>([])

    const [calendarDate, setCalendarDate] = useState(new Date())
    const [selectedCalendarDay, setSelectedCalendarDay] = useState<any | null>(null)
    const [scheduleMonth, setScheduleMonth] = useState(new Date()) // For Schedule tab calendar

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const days = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday
        // Shift to Monday start (optional, but requested for business usually) - let's keep Sunday start for standard
        return { days, firstDay }
    }

    const calendarDays = useMemo(() => {
        const { days: daysInMonth } = getDaysInMonth(calendarDate)
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayApts = appointments.filter(a => a.appointmentDate === dateStr)
            const dayLeaves = leaves.filter(l => l.date === dateStr)
            return { day, dateStr, dayApts, dayLeaves }
        })
    }, [calendarDate, appointments, leaves])

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(calendarDate)
        if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1)
        else newDate.setMonth(newDate.getMonth() + 1)
        setCalendarDate(newDate)
    }

    const calculateOffset = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const navigateScheduleMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(scheduleMonth)
        if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1)
        else newDate.setMonth(newDate.getMonth() + 1)
        setScheduleMonth(newDate)
    }

    const scheduleMonthDays = useMemo(() => {
        const year = scheduleMonth.getFullYear()
        const month = scheduleMonth.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday
        const todayStr = formatLocalDate(new Date())

        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const hasSchedule = dateSchedule?.schedules[dateStr] && dateSchedule.schedules[dateStr].length > 0
            const isPast = dateStr < todayStr
            return { day, dateStr, hasSchedule, firstDay, isPast }
        })
    }, [scheduleMonth, dateSchedule])

    const patientRegistry = useMemo(() => Array.from(new Set(appointments.map(a => a.patientIC))), [appointments])
    const filteredPatients = useMemo(() => patientRegistry.filter(ic => {
        const apt = appointments.find(a => a.patientIC === ic)
        const nameMatch = apt?.patientName.toLowerCase().includes(patientSearch.toLowerCase())
        const icMatch = ic.toLowerCase().includes(patientSearch.toLowerCase())
        return nameMatch || icMatch
    }), [patientRegistry, appointments, patientSearch])

    // Form states
    const [newLeave, setNewLeave] = useState<{
        date: string,
        type: "full" | "partial",
        startTime: string,
        endTime: string,
        reason: string
    }>({
        date: "",
        type: "full",
        startTime: "09:00",
        endTime: "17:00",
        reason: ""
    })

    useEffect(() => {
        if (id) {
            loadDoctorData(id as string)
        }
    }, [id])

    const loadDoctorData = async (docId: string) => {
        const [docs, apts, drSlots, drSchedule, drDateSchedule, drLeaves, drConsultations] = await Promise.all([
            getDoctorsAsync(),
            getAppointmentsAsync(),
            getSlotsAsync(docId),
            getDoctorScheduleAsync(docId),
            getDoctorDateScheduleAsync(docId),
            getDoctorLeavesAsync(docId),
            getDoctorConsultationsAsync(docId)
        ])

        const doc = docs.find(d => d.id === docId)
        if (!doc) {
            router.push("/admin/doctors")
            return
        }
        setDoctor(doc)
        setInitialDocState(doc)
        setSchedule(drSchedule || { doctorId: docId, days: {} })
        setInitialScheduleState(drSchedule || { doctorId: docId, days: {} })
        setDateSchedule(drDateSchedule || { doctorId: docId, schedules: {} })
        setInitialDateScheduleState(drDateSchedule || { doctorId: docId, schedules: {} })
        setLeaves(drLeaves)
        setAppointments(apts.filter(a => a.doctorId === docId))
        setSlots(drSlots)
        setConsultations(drConsultations)
        setInitialConsultations(drConsultations)
    }

    const handleUpdateDoctor = async (updates: Partial<Doctor>) => {
        if (!doctor) return
        setDoctor({ ...doctor, ...updates })
        setHasChanges(true)
    }

    const handleSaveAllChanges = async () => {
        if (!doctor || !schedule || !dateSchedule) return
        setIsSavingAll(true)
        try {
            // 1. Save Doctor Profile if changed
            if (JSON.stringify(doctor) !== JSON.stringify(initialDocState)) {
                await updateDoctorAsync(doctor.id, doctor)
            }

            // 2. Save Weekly Schedule if changed (keeping for backward compatibility)
            if (JSON.stringify(schedule) !== JSON.stringify(initialScheduleState)) {
                await saveDoctorScheduleAsync(schedule)
            }

            // 3. Save Date Schedule if changed
            if (JSON.stringify(dateSchedule) !== JSON.stringify(initialDateScheduleState)) {
                await saveDoctorDateScheduleAsync(dateSchedule)
            }

            // 4. Process Consultation Records
            // Deletions
            for (const id of pendingDeletions) {
                await deleteConsultationRecordAsync(id)
            }

            // Additions & Updates
            for (const rec of consultations) {
                const initial = initialConsultations.find(ir => ir.id === rec.id)
                if (!initial) {
                    // It's a new record (ID starts with 'temp-' or just not in initial)
                    const { id: _, ...recordToSave } = rec
                    await addConsultationRecordAsync({ ...recordToSave, doctorId: doctor.id })
                } else if (JSON.stringify(rec) !== JSON.stringify(initial)) {
                    // It's an updated record
                    await updateConsultationRecordAsync(rec.id, rec)
                }
            }

            // 5. Regenerate Slots if high-impact changes made
            const impactFields: (keyof Doctor)[] = ["isAvailable", "isActive", "slotDuration"]
            const hasImpactChange = impactFields.some(f => doctor[f] !== initialDocState?.[f]) ||
                JSON.stringify(schedule) !== JSON.stringify(initialScheduleState) ||
                JSON.stringify(dateSchedule) !== JSON.stringify(initialDateScheduleState)

            if (hasImpactChange) {
                await regenerateDoctorSlotsAsync(doctor.id)
                const freshSlots = await getSlotsAsync(doctor.id)
                setSlots(freshSlots)
            }

            // 6. Refresh everything to be safe and reset states
            await loadDoctorData(doctor.id)
            setHasChanges(false)
            setPendingDeletions([])
            toast({ title: "All changes saved successfully" })
        } catch (error: any) {
            console.error("Save All error:", error)
            toast({ title: "Failed to save some changes", variant: "destructive" })
        } finally {
            setIsSavingAll(false)
        }
    }

    const addTimeRange = (day: DayOfWeek) => {
        if (!schedule) return
        const currentDays = { ...schedule.days }
        const currentDayRanges = currentDays[day] || []
        currentDays[day] = [...currentDayRanges, { start: "09:00", end: "13:00" }]
        setSchedule({ ...schedule, days: currentDays })
        setHasChanges(true)
    }

    const removeTimeRange = (day: DayOfWeek, index: number) => {
        if (!schedule) return
        const currentDays = { ...schedule.days }
        const currentDayRanges = [...(currentDays[day] || [])]
        currentDayRanges.splice(index, 1)
        currentDays[day] = currentDayRanges
        setSchedule({ ...schedule, days: currentDays })
        setHasChanges(true)
    }

    const updateTimeRange = (day: DayOfWeek, index: number, field: "start" | "end", value: string) => {
        if (!schedule || !doctor) return
        const currentDays = { ...schedule.days }
        const currentDayRanges = [...(currentDays[day] || [])]

        let updatedRange = { ...currentDayRanges[index], [field]: value }

        if (field === "start" && doctor.slotDuration) {
            const [h, m] = value.split(':').map(Number)
            const date = new Date()
            date.setHours(h, m + doctor.slotDuration)
            const endH = date.getHours().toString().padStart(2, '0')
            const endM = date.getMinutes().toString().padStart(2, '0')
            updatedRange.end = `${endH}:${endM}`
        }

        currentDayRanges[index] = updatedRange
        currentDays[day] = currentDayRanges
        setSchedule({ ...schedule, days: currentDays })
        setHasChanges(true)
    }

    // Date Schedule Functions
    const addDateTimeRange = (date: string) => {
        if (!dateSchedule) return
        const currentSchedules = { ...dateSchedule.schedules }
        const currentRanges = currentSchedules[date] || []
        currentSchedules[date] = [...currentRanges, { start: "09:00", end: "17:00" }]
        setDateSchedule({ ...dateSchedule, schedules: currentSchedules })
        setHasChanges(true)
    }

    const removeDateTimeRange = (date: string, index: number) => {
        if (!dateSchedule) return
        const currentSchedules = { ...dateSchedule.schedules }
        const currentRanges = [...(currentSchedules[date] || [])]
        currentRanges.splice(index, 1)
        if (currentRanges.length === 0) {
            delete currentSchedules[date]
        } else {
            currentSchedules[date] = currentRanges
        }
        setDateSchedule({ ...dateSchedule, schedules: currentSchedules })
        setHasChanges(true)
    }

    const updateDateTimeRange = (date: string, index: number, field: "start" | "end", value: string) => {
        if (!dateSchedule || !doctor) return
        const currentSchedules = { ...dateSchedule.schedules }
        const currentRanges = [...(currentSchedules[date] || [])]

        let updatedRange = { ...currentRanges[index], [field]: value }

        if (field === "start" && doctor.slotDuration) {
            const [h, m] = value.split(':').map(Number)
            const date = new Date()
            date.setHours(h, m + doctor.slotDuration)
            const endH = date.getHours().toString().padStart(2, '0')
            const endM = date.getMinutes().toString().padStart(2, '0')
            updatedRange.end = `${endH}:${endM}`
        }

        currentRanges[index] = updatedRange
        currentSchedules[date] = currentRanges
        setDateSchedule({ ...dateSchedule, schedules: currentSchedules })
        setHasChanges(true)
    }

    const handleToggleSlotStatus = async (slotId: string, currentStatus: Slot["status"]) => {
        const newStatus = currentStatus === "available" ? "blocked" : "available"
        try {
            await updateSlotStatusAsync(slotId, newStatus)
            // Refresh slots
            const freshSlots = await getSlotsAsync(id as string)
            setSlots(freshSlots)
            toast({ title: `Slot marked as ${newStatus}` })
        } catch (error) {
            toast({ title: "Failed to update slot", variant: "destructive" })
        }
    }

    const handleBulkSlotStatus = async (date: string, action: "block" | "unblock") => {
        const dateSlots = slots.filter(s => s.date === date && s.status !== "booked")
        if (dateSlots.length === 0) return

        const newStatus = action === "block" ? "blocked" : "available"
        try {
            await Promise.all(dateSlots.map(s => updateSlotStatusAsync(s.id, newStatus)))
            const freshSlots = await getSlotsAsync(id as string)
            setSlots(freshSlots)
            toast({ title: `All slots marked as ${newStatus}` })
        } catch (error) {
            toast({ title: "Bulk update failed", variant: "destructive" })
        }
    }

    const handleAddLeave = async () => {
        if (!doctor || !newLeave.date) return
        try {
            await addDoctorLeaveAsync({
                doctorId: doctor.id,
                date: newLeave.date,
                type: newLeave.type,
                startTime: newLeave.type === "partial" ? newLeave.startTime : undefined,
                endTime: newLeave.type === "partial" ? newLeave.endTime : undefined,
                reason: newLeave.reason
            })
            const [freshLeaves, freshSlots] = await Promise.all([
                getDoctorLeavesAsync(doctor.id),
                getSlotsAsync(doctor.id)
            ])
            setLeaves(freshLeaves)
            setSlots(freshSlots)
            setNewLeave({ date: "", type: "full", startTime: "09:00", endTime: "17:00", reason: "" })
            toast({ title: "Leave recorded" })
        } catch (e) {
            toast({ title: "Failed to add leave", variant: "destructive" })
        }
    }

    const handleDeleteLeave = async (leaveId: string) => {
        if (!doctor) return
        try {
            await deleteDoctorLeaveAsync(doctor.id, leaveId)
            const [freshLeaves, freshSlots] = await Promise.all([
                getDoctorLeavesAsync(doctor.id),
                getSlotsAsync(doctor.id)
            ])
            setLeaves(freshLeaves)
            setSlots(freshSlots)
            toast({ title: "Leave removed" })
        } catch (e) {
            toast({ title: "Failed to remove leave", variant: "destructive" })
        }
    }

    const handleBlockSlot = async (slot: Slot, reason: string) => {
        try {
            await updateSlotStatusAsync(slot.id, 'blocked', reason)
            toast({ title: "Slot Blocked" })
            loadDoctorData(doctor?.id!)
            setIsBlocking(false)
            setSelectedSlot(null)
            setCancelReason("")
        } catch (e) {
            toast({ title: "Failed to block", variant: "destructive" })
        }
    }

    const handleUnblockSlot = async (slotId: string) => {
        try {
            await updateSlotStatusAsync(slotId, 'available')
            toast({ title: "Slot Unblocked" })
            loadDoctorData(doctor?.id!)
        } catch (e) {
            toast({ title: "Failed to unblock", variant: "destructive" })
        }
    }

    const handleCancelAppointment = async (appointmentId: string, slotId: string, reason: string) => {
        try {
            await fetch(`/api/appointments/${appointmentId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            })
            toast({ title: "Appointment Cancelled" })
            loadDoctorData(doctor?.id!)
            setIsCancelling(false)
            setSelectedSlot(null)
            setCancelReason("")
        } catch (e) {
            toast({ title: "Failed to cancel", variant: "destructive" })
        }
    }

    const handleAddRecord = () => {
        if (!doctor) return
        const tempId = `temp-${Math.random().toString(36).substr(2, 9)}`
        setConsultations([...consultations, {
            ...newRecord,
            id: tempId,
            doctorId: doctor.id
        } as ConsultationRecord])
        setIsAddRecordOpen(false)
        setNewRecord({
            patientName: "", patientIC: "", handphoneNo: "", cardNo: "",
            totalFee: 0, consultationFee: 0,
            consultationDate: formatLocalDate(new Date()),
            fixDate: "", remark: "", updates: ""
        })
        setHasChanges(true)
        toast({ title: "Record added to pending changes" })
    }

    const handleUpdateRecord = () => {
        if (!doctor || !editingRecord) return
        setConsultations(consultations.map(r => r.id === editingRecord.id ? editingRecord : r))
        setEditingRecord(null)
        setHasChanges(true)
        toast({ title: "Record update staged" })
    }

    const handleDeleteRecord = () => {
        if (!doctor || !deletingRecord) return
        // If it's a real record (not temp), track it for deletion
        if (!deletingRecord.id.startsWith('temp-')) {
            setPendingDeletions([...pendingDeletions, deletingRecord.id])
        }
        setConsultations(consultations.filter(r => r.id !== deletingRecord.id))
        setDeletingRecord(null)
        setHasChanges(true)
        toast({ title: "Record deletion staged" })
    }

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            // Simple CSV Parser (assuming header row exists)
            // NAME, CARD NO, IC NO, HANDPHONE NO, TOTAL FEE, CONSULTION DATE, CONSULTATION FEE, FIX DATE, REMARK, UPDATES
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            const headers = lines[0].split(',').map(h => h.trim().toUpperCase());

            const parsedData: Partial<ConsultationRecord>[] = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                if (cols.length < 3) continue; // Skip invalid rows using simpler validation

                const row: any = {};
                // Mapping based on requested headers
                // Safe access with index
                row.patientName = cols[0] || "";
                row.cardNo = cols[1] || "";
                row.patientIC = cols[2] || "";
                row.handphoneNo = cols[3] || "";
                row.totalFee = parseFloat(cols[4] || "0");
                // Default to today if date is missing to pass Schema validation
                row.consultationDate = cols[5] || formatLocalDate(new Date());
                row.consultationFee = parseFloat(cols[6] || "0");
                row.fixDate = cols[7] || "";
                row.remark = cols[8] || "";
                row.updates = cols[9] || "";

                if (row.patientName && row.patientIC && doctor) {
                    parsedData.push({ ...row, doctorId: doctor.id });
                }
            }
            setCsvPreview(parsedData);
        };
        reader.readAsText(file);
    };

    const handleCSVImport = async () => {
        if (!doctor || csvPreview.length === 0) return

        // Validate duplicates within the CSV and against existing records
        const duplicates: string[] = [];
        const uniqueSet = new Set<string>();

        // Check against existing loaded consultations
        // Assumption: If 'Patient Data' acts as a Registry, IC/Phone/Card should be unique.
        // If it's a visit history, duplicates might be allowed, but user requested "should be unique".
        // We will enforce uniqueness per doctor for now as requested.

        const existingICs = new Set(consultations.map(c => c.patientIC));
        const existingPhones = new Set(consultations.map(c => c.handphoneNo));
        const existingCards = new Set(consultations.map(c => c.cardNo).filter(c => c)); // CardNo might be empty

        const validRecords: Partial<ConsultationRecord>[] = [];

        csvPreview.forEach(rec => {
            const rowId = `${rec.patientIC}|${rec.handphoneNo}`;
            let error = "";

            if (rec.patientIC && existingICs.has(rec.patientIC)) error = `Duplicate IC in system: ${rec.patientIC}`;
            else if (rec.handphoneNo && existingPhones.has(rec.handphoneNo)) error = `Duplicate Phone in system: ${rec.handphoneNo}`;
            else if (rec.cardNo && existingCards.has(rec.cardNo)) error = `Duplicate Card No in system: ${rec.cardNo}`;
            else if (uniqueSet.has(rowId)) error = `Duplicate entry in CSV file: ${rec.patientName}`;

            if (error) {
                duplicates.push(error);
            } else {
                if (rec.patientIC) uniqueSet.add(rowId);
                // Temporarily add to "existing" sets to check subsequent rows in same CSV
                if (rec.patientIC) existingICs.add(rec.patientIC);
                if (rec.handphoneNo) existingPhones.add(rec.handphoneNo);
                if (rec.cardNo) existingCards.add(rec.cardNo);
                validRecords.push(rec);
            }
        });

        if (duplicates.length > 0) {
            toast({
                title: "Validation Errors Found",
                description: `Found ${duplicates.length} duplicates. First error: ${duplicates[0]}. Importing valid records only.`,
                variant: 'destructive'
            });
            // Optional: You could choose to stop here. For now, we import the valid ones and warn.
            if (validRecords.length === 0) return;
        }

        try {
            const LOADING_TOAST = toast({ title: `Importing ${validRecords.length} records...`, description: "Please wait" })
            await bulkAddConsultationRecordsAsync(validRecords)

            const freshRecs = await getDoctorConsultationsAsync(doctor.id)
            setConsultations(freshRecs)
            setIsCSVImportOpen(false)
            setCsvFile(null)
            setCsvPreview([])
            toast({ title: `Successfully imported ${validRecords.length} records` })
        } catch (e) {
            toast({ title: "Import failed", variant: "destructive" })
        }
    }

    const handleViewHistory = (ic: string) => {
        const history = appointments.filter((a: Appointment) => a.patientIC === ic)
        setPatientHistory(history)
        setSelectedPatientIC(ic)
        setIsHistoryOpen(true)
    }

    if (authLoading || !doctor) return null

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/doctors")} className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 rounded-xl border-2 border-slate-100">
                                <AvatarImage src={doctor.photo} />
                                <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{doctor.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">{doctor.name}</h1>
                                <p className="text-xs text-slate-500 font-medium">{doctor.specialization}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Availability</p>
                            <Switch
                                checked={doctor.isAvailable}
                                onCheckedChange={(val) => handleUpdateDoctor({ isAvailable: val })}
                            />
                        </div>
                        <Button
                            onClick={handleSaveAllChanges}
                            disabled={!hasChanges || isSavingAll}
                            className={cn(
                                "rounded-xl gap-2 font-bold px-6 shadow-lg transition-all",
                                hasChanges
                                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"
                                    : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none"
                            )}
                        >
                            {isSavingAll ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSavingAll ? "Saving..." : "Save All Changes"}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Stats & Settings (Only visible on Overview tab) */}
                        {activeTab === 'calendar' && (
                            <div className="space-y-8">
                                {/* Status Card */}
                                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Status</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${doctor.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                    <ShieldCheck className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">Registry Status</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{doctor.isActive ? 'Active & Verified' : 'Currently Disabled'}</p>
                                                </div>
                                            </div>
                                            <Switch checked={doctor.isActive} onCheckedChange={(val) => handleUpdateDoctor({ isActive: val })} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Slots</p>
                                                <p className="text-2xl font-bold text-blue-900">{slots.length}</p>
                                            </div>
                                            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Bookings</p>
                                                <p className="text-2xl font-bold text-purple-900">{appointments.length}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slot Duration</Label>
                                            <Select
                                                value={doctor.slotDuration?.toString()}
                                                onValueChange={(val) => handleUpdateDoctor({ slotDuration: parseInt(val) as Doctor['slotDuration'] })}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10 Minutes</SelectItem>
                                                    <SelectItem value="15">15 Minutes</SelectItem>
                                                    <SelectItem value="20">20 Minutes</SelectItem>
                                                    <SelectItem value="30">30 Minutes</SelectItem>
                                                    <SelectItem value="45">45 Minutes</SelectItem>
                                                    <SelectItem value="60">60 Minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-[10px] text-slate-400 text-center italic">Changes will automatically regenerate upcoming slots.</p>
                                    </CardContent>
                                </Card>

                                {/* Contact Card */}
                                <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Contact Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                                                <p className="text-sm font-bold text-slate-900">{doctor.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                                <p className="text-sm font-bold text-slate-900">{doctor.email}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Right Column / Main Content */}
                        <div className={activeTab === 'calendar' ? "lg:col-span-2" : "lg:col-span-3"}>

                            <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-8 h-auto flex-wrap">
                                <TabsTrigger value="schedule" className="px-5 py-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold flex-1 max-w-[150px]">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Schedule
                                </TabsTrigger>
                                <TabsTrigger value="calendar" className="px-5 py-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold flex-1 max-w-[150px]">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="leaves" className="px-5 py-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold flex-1 max-w-[150px]">
                                    <ShieldAlert className="w-4 h-4 mr-2" />
                                    Leaves
                                </TabsTrigger>
                                <TabsTrigger value="booked" className="px-5 py-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold flex-1 max-w-[150px]">
                                    <Activity className="w-4 h-4 mr-2" />
                                    Daily Queue
                                </TabsTrigger>
                                <TabsTrigger value="patients" className="px-5 py-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold flex-1 max-w-[150px]">
                                    <User className="w-4 h-4 mr-2" />
                                    Registry
                                </TabsTrigger>
                                <TabsTrigger value="consultations" className="px-5 py-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold flex-1 max-w-[150px]">
                                    <Briefcase className="w-4 h-4 mr-2" />
                                    Patient
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="schedule" className="space-y-6 outline-none">
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Date-Specific Schedule</CardTitle>
                                                <CardDescription>Select a month, then click any date to set working hours</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigateScheduleMonth('prev')}
                                                    className="h-10 w-10 rounded-xl hover:bg-slate-100"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                </Button>
                                                <h3 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">
                                                    {scheduleMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                                </h3>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => navigateScheduleMonth('next')}
                                                    className="h-10 w-10 rounded-xl hover:bg-slate-100"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8">
                                        <div className={cn(
                                            "transition-all duration-500",
                                            selectedScheduleDate ? "grid grid-cols-1 xl:grid-cols-2 gap-10" : "max-w-4xl mx-auto"
                                        )}>
                                            {/* Monthly Calendar Grid */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Calendar Picker</h4>
                                                    {selectedScheduleDate && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSelectedScheduleDate(null)}
                                                            className="text-xs text-blue-600 font-bold hover:bg-blue-50 rounded-lg"
                                                        >
                                                            Clear Selection
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Day Headers */}
                                                <div className="grid grid-cols-7 gap-2">
                                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                                        <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-2">
                                                            {d}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Calendar Days */}
                                                <div className="grid grid-cols-7 gap-2">
                                                    {/* Empty cells for days before month starts */}
                                                    {scheduleMonthDays.length > 0 && Array.from({ length: scheduleMonthDays[0]?.firstDay || 0 }).map((_, i) => (
                                                        <div key={`empty-${i}`} className="aspect-square" />
                                                    ))}

                                                    {/* Actual days */}
                                                    {scheduleMonthDays.map((dayData) => {
                                                        const isSelected = selectedScheduleDate === dayData.dateStr
                                                        const isToday = dayData.dateStr === new Date().toISOString().split('T')[0]

                                                        return (
                                                            <button
                                                                key={dayData.dateStr}
                                                                disabled={dayData.isPast}
                                                                onClick={() => setSelectedScheduleDate(dayData.dateStr)}
                                                                className={cn(
                                                                    "aspect-square p-2 rounded-2xl border-2 transition-all relative group",
                                                                    dayData.isPast && "opacity-30 cursor-not-allowed filter grayscale-[0.8]",
                                                                    isSelected
                                                                        ? "bg-slate-900 border-slate-900 shadow-xl scale-105 z-10"
                                                                        : dayData.hasSchedule
                                                                            ? "bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:shadow-md"
                                                                            : isToday
                                                                                ? "bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-md"
                                                                                : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-md"
                                                                )}
                                                            >
                                                                <div className="flex flex-col items-center justify-center h-full">
                                                                    <span className={cn(
                                                                        "text-base font-black transition-colors",
                                                                        isSelected ? "text-white" : "text-slate-900",
                                                                        dayData.isPast && "text-slate-300"
                                                                    )}>
                                                                        {dayData.day}
                                                                    </span>
                                                                    {dayData.hasSchedule && !isSelected && (
                                                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                                                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                                                        </div>
                                                                    )}
                                                                    {isToday && !isSelected && (
                                                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                    )}
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Schedule Editor for Selected Date */}
                                            <div className="relative">
                                                {selectedScheduleDate ? (
                                                    <div className="space-y-6 p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500 min-h-full">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
                                                                    {new Date(selectedScheduleDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}
                                                                </p>
                                                                <h3 className="text-2xl font-bold text-slate-900">
                                                                    {new Date(selectedScheduleDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </h3>
                                                            </div>
                                                            <Button
                                                                onClick={() => addDateTimeRange(selectedScheduleDate)}
                                                                className="h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white gap-2 font-bold shadow-lg"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                Add Slot
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {dateSchedule?.schedules[selectedScheduleDate]?.map((range, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                                                    <div className="flex items-center gap-2 flex-1">
                                                                        <div className="relative flex-1">
                                                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                                            <Input
                                                                                type="time"
                                                                                value={range.start}
                                                                                onChange={(e) => updateDateTimeRange(selectedScheduleDate, idx, "start", e.target.value)}
                                                                                className="h-10 pl-9 rounded-xl bg-slate-50 border-none font-bold text-sm"
                                                                            />
                                                                        </div>
                                                                        <span className="text-slate-300 font-black">→</span>
                                                                        <div className="relative flex-1">
                                                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                                                            <Input
                                                                                type="time"
                                                                                value={range.end}
                                                                                onChange={(e) => updateDateTimeRange(selectedScheduleDate, idx, "end", e.target.value)}
                                                                                className="h-10 pl-9 rounded-xl bg-slate-50 border-none font-bold text-sm"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeDateTimeRange(selectedScheduleDate, idx)}
                                                                        className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            {(!dateSchedule?.schedules[selectedScheduleDate] || dateSchedule.schedules[selectedScheduleDate].length === 0) && (
                                                                <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                                                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                        <Clock className="w-6 h-6" />
                                                                    </div>
                                                                    <p className="text-sm font-bold text-slate-500">No slots defined</p>
                                                                    <button
                                                                        onClick={() => addDateTimeRange(selectedScheduleDate)}
                                                                        className="text-xs text-blue-600 font-bold mt-2 hover:underline"
                                                                    >
                                                                        Click here to add working hours
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Individual Slot Management */}
                                                        <div className="pt-8 border-t border-slate-200 mt-2">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                                                <div>
                                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Manual Slot Editor</h4>
                                                                    <p className="text-[10px] text-slate-500 font-medium">Click to toggle specific slots for emergencies</p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative flex-1 group sm:min-w-[200px]">
                                                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                                        <Input
                                                                            placeholder="Search time (e.g. 10:30)..."
                                                                            value={slotSearch}
                                                                            onChange={(e) => setSlotSearch(e.target.value)}
                                                                            className="h-8 pl-8 text-[10px] font-bold bg-slate-50 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-blue-100 transition-all"
                                                                        />
                                                                    </div>
                                                                    <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleBulkSlotStatus(selectedScheduleDate, "block")}
                                                                        className="h-8 px-3 text-[10px] font-bold text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200 rounded-lg flex gap-1.5 items-center bg-white shadow-sm"
                                                                    >
                                                                        <Lock className="w-3 h-3" />
                                                                        Block All
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleBulkSlotStatus(selectedScheduleDate, "unblock")}
                                                                        className="h-8 px-3 text-[10px] font-bold text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 rounded-lg flex gap-1.5 items-center bg-white shadow-sm"
                                                                    >
                                                                        <Unlock className="w-3 h-3" />
                                                                        Unblock All
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={async () => {
                                                                            const freshSlots = await getSlotsAsync(id as string)
                                                                            setSlots(freshSlots)
                                                                        }}
                                                                        className="h-8 w-8 text-slate-400 hover:text-blue-600 rounded-lg"
                                                                    >
                                                                        <RefreshCcw className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                                                {/* Morning Slots */}
                                                                {slots.filter(s => s.date === selectedScheduleDate && s.startTime.includes(slotSearch.trim()) && parseInt(s.startTime.split(':')[0]) < 13).length > 0 && (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 bg-blue-50 rounded-lg">
                                                                                <Clock className="w-3 h-3 text-blue-500" />
                                                                            </div>
                                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morning Session</h5>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                            {slots
                                                                                .filter(s => s.date === selectedScheduleDate && s.startTime.includes(slotSearch.trim()) && parseInt(s.startTime.split(':')[0]) < 13)
                                                                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                                                .map(slot => (
                                                                                    <SlotButton
                                                                                        key={slot.id}
                                                                                        slot={slot}
                                                                                        onToggle={() => handleToggleSlotStatus(slot.id, slot.status)}
                                                                                    />
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Afternoon/Evening Slots */}
                                                                {slots.filter(s => s.date === selectedScheduleDate && s.startTime.includes(slotSearch.trim()) && parseInt(s.startTime.split(':')[0]) >= 13).length > 0 && (
                                                                    <div className="space-y-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="p-1.5 bg-purple-50 rounded-lg">
                                                                                <Clock className="w-3 h-3 text-purple-500" />
                                                                            </div>
                                                                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Afternoon & Evening</h5>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                                            {slots
                                                                                .filter(s => s.date === selectedScheduleDate && s.startTime.includes(slotSearch.trim()) && parseInt(s.startTime.split(':')[0]) >= 13)
                                                                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                                                .map(slot => (
                                                                                    <SlotButton
                                                                                        key={slot.id}
                                                                                        slot={slot}
                                                                                        onToggle={() => handleToggleSlotStatus(slot.id, slot.status)}
                                                                                    />
                                                                                ))
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {slots.filter(s => s.date === selectedScheduleDate && s.startTime.includes(slotSearch.trim())).length === 0 && (
                                                                    <div className="py-12 text-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
                                                                        <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                            <Ban className="w-5 h-5" />
                                                                        </div>
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No slots found</p>
                                                                        <p className="text-[10px] text-slate-400 font-medium mt-1">Try a different search or check settings</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <p className="text-[10px] text-slate-400 italic text-center pt-4">Don't forget to click "Save All Changes" at the top.</p>
                                                    </div>
                                                ) : (
                                                    <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 opacity-60">
                                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                                            <Calendar className="w-8 h-8 text-slate-300" />
                                                        </div>
                                                        <h4 className="text-xl font-bold text-slate-900 mb-2">Select a Work Date</h4>
                                                        <p className="text-xs font-medium text-slate-500 max-w-[200px] mx-auto">Click any available date in the calendar to define specific hours</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="calendar" className="space-y-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl border border-white/20">
                                    <div className="grid lg:grid-cols-12 min-h-[700px]">
                                        {/* Calendar Grid Section */}
                                        <div className={cn(
                                            "lg:col-span-8 p-8 border-r border-slate-100 transition-all duration-500",
                                            selectedCalendarDay && "lg:col-span-12 xl:col-span-8"
                                        )}>
                                            <div className="flex items-center justify-between mb-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => navigateMonth('prev')}
                                                            className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                                                        >
                                                            <ChevronLeft className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => navigateMonth('next')}
                                                            className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                                            {calendarDate.toLocaleString('default', { month: 'long' })}
                                                            <span className="text-blue-600 ml-2 font-medium">{calendarDate.getFullYear()}</span>
                                                        </h2>
                                                    </div>
                                                </div>

                                            </div>

                                            <div className="grid grid-cols-7 mb-6">
                                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                                                    <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-4">
                                                        {d}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-7 gap-3">
                                                {/* Corrected logic for Monday start if needed, but let's stick to firstDay offset for now */}
                                                {Array.from({ length: calculateOffset(calendarDate) }).map((_, i) => (
                                                    <div key={`offset-${i}`} className="h-32 bg-slate-50/30 rounded-3xl border border-transparent" />
                                                ))}
                                                {calendarDays.map((dayData) => {
                                                    const isToday = dayData.dateStr === formatLocalDate(new Date());
                                                    const isSelected = selectedCalendarDay?.dateStr === dayData.dateStr;

                                                    return (
                                                        <div
                                                            key={dayData.dateStr}
                                                            className={cn(
                                                                "h-32 p-4 rounded-[2rem] border transition-all duration-300 relative group cursor-pointer",
                                                                isSelected
                                                                    ? "bg-slate-900 border-slate-900 shadow-2xl shadow-slate-200 -translate-y-1 scale-[1.02] z-10"
                                                                    : isToday
                                                                        ? "bg-blue-50 border-blue-100 hover:border-blue-200"
                                                                        : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-100 hover:-translate-y-0.5"
                                                            )}
                                                            onClick={() => setSelectedCalendarDay(dayData)}
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className={cn(
                                                                    "text-sm font-black transition-colors w-8 h-8 flex items-center justify-center rounded-xl",
                                                                    isSelected ? "text-white" : isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 group-hover:text-slate-900"
                                                                )}>
                                                                    {dayData.day}
                                                                </span>
                                                                {dayData.dayLeaves.length > 0 && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                                                )}
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                {dayData.dayApts.slice(0, 2).map(apt => (
                                                                    <div key={apt.id} className={cn(
                                                                        "h-1.5 rounded-full w-full opacity-60",
                                                                        isSelected ? "bg-white" : "bg-blue-600"
                                                                    )} />
                                                                ))}
                                                                {dayData.dayApts.length > 0 && (
                                                                    <p className={cn(
                                                                        "text-[10px] font-bold mt-2",
                                                                        isSelected ? "text-slate-400" : "text-slate-500"
                                                                    )}>
                                                                        {dayData.dayApts.length} Cases
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Day Detail Sidebar */}
                                        <div className={cn(
                                            "lg:col-span-4 bg-slate-50/50 flex flex-col transition-all duration-500 overflow-hidden",
                                            !selectedCalendarDay ? "lg:col-span-0 opacity-0 pointer-events-none" : "lg:col-span-4 opacity-100"
                                        )}>
                                            {selectedCalendarDay ? (
                                                <div className="h-full flex flex-col p-8 animate-in slide-in-from-right-4 duration-500">
                                                    <div className="flex items-center justify-between mb-10">
                                                        <div>
                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
                                                                {new Date(selectedCalendarDay.dateStr).toLocaleDateString('en-US', { weekday: 'long' })}
                                                            </p>
                                                            <h3 className="text-2xl font-bold text-slate-900">
                                                                {new Date(selectedCalendarDay.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                            </h3>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setSelectedCalendarDay(null)}
                                                            className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                                                        >
                                                            <Plus className="w-4 h-4 rotate-45" />
                                                        </Button>
                                                    </div>

                                                    <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                                                        {selectedCalendarDay.dayLeaves.length > 0 && (
                                                            <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 mb-6">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                                                                    <p className="text-xs font-black uppercase text-amber-700 tracking-wider">Leave Recorded</p>
                                                                </div>
                                                                {selectedCalendarDay.dayLeaves.map((l: any, i: number) => (
                                                                    <p key={i} className="text-sm font-bold text-amber-900">{l.reason || "Doctor unavailable"}</p>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Slot Status Summary */}
                                                        <div className="mb-8">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Slot Overview</p>
                                                            {(() => {
                                                                const daySlots = slots.filter(s => s.date === selectedCalendarDay.dateStr)
                                                                const availableSlots = daySlots.filter(s => s.status === 'available')
                                                                const bookedSlots = daySlots.filter(s => s.status === 'booked')
                                                                const completedSlots = selectedCalendarDay.dayApts.filter((a: any) => a.status === 'completed')
                                                                const blockedSlots = daySlots.filter(s => s.status === 'blocked')

                                                                return (
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        {/* Total Slots */}
                                                                        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <Clock className="w-4 h-4 text-slate-600" />
                                                                                <p className="text-[10px] font-black text-slate-500 uppercase">Total</p>
                                                                            </div>
                                                                            <p className="text-2xl font-black text-slate-900">{daySlots.length}</p>
                                                                        </div>

                                                                        {/* Available Slots */}
                                                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                                <p className="text-[10px] font-black text-emerald-600 uppercase">Available</p>
                                                                            </div>
                                                                            <p className="text-2xl font-black text-emerald-700">{availableSlots.length}</p>
                                                                        </div>

                                                                        {/* Booked Slots */}
                                                                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                                                <p className="text-[10px] font-black text-blue-600 uppercase">Booked</p>
                                                                            </div>
                                                                            <p className="text-2xl font-black text-blue-700">{bookedSlots.length}</p>
                                                                        </div>

                                                                        {/* Completed */}
                                                                        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <Activity className="w-4 h-4 text-purple-600" />
                                                                                <p className="text-[10px] font-black text-purple-600 uppercase">Completed</p>
                                                                            </div>
                                                                            <p className="text-2xl font-black text-purple-700">{completedSlots.length}</p>
                                                                        </div>

                                                                        {/* Blocked Slots */}
                                                                        {blockedSlots.length > 0 && (
                                                                            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 col-span-2">
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <Ban className="w-4 h-4 text-red-600" />
                                                                                    <p className="text-[10px] font-black text-red-600 uppercase">Blocked</p>
                                                                                </div>
                                                                                <p className="text-2xl font-black text-red-700">{blockedSlots.length}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>

                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Patient Timeline</p>
                                                            {selectedCalendarDay.dayApts.length === 0 ? (
                                                                <div className="py-20 text-center opacity-40">
                                                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                                                    <p className="text-xs font-bold text-slate-900">No appointments scheduled</p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {selectedCalendarDay.dayApts.sort((a: any, b: any) => a.timeSlot.localeCompare(b.timeSlot)).map((apt: any) => (
                                                                        <div key={apt.id} className="group relative pl-6">
                                                                            <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 group-hover:bg-blue-300 transition-colors" />
                                                                            <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 group-hover:scale-125 transition-all" />

                                                                            <div className="bg-white p-5 rounded-2xl border border-white shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border-slate-100">
                                                                                <div className="flex justify-between items-start mb-2">
                                                                                    <p className="text-xs font-black text-blue-600">{apt.timeSlot.split(' - ')[0]}</p>
                                                                                    <div className={cn(
                                                                                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                                                                        apt.status === 'confirmed' ? "bg-blue-50 text-blue-600" :
                                                                                            apt.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                                                                                    )}>
                                                                                        {apt.status}
                                                                                    </div>
                                                                                </div>
                                                                                <p className="font-bold text-slate-900 text-sm mb-1">{apt.patientName}</p>
                                                                                <p className="text-[10px] font-medium text-slate-400">IC: {apt.patientIC}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>


                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                                                    <Calendar className="w-20 h-20 mb-6 text-slate-300" />
                                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Select a Date</h4>
                                                    <p className="text-xs font-medium text-slate-500">Choose any day to view detailed clinical timelines</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="leaves" className="space-y-8 outline-none">
                                {/* Add Leave Form */}
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                                <ShieldAlert className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Record Absence or Emergency</CardTitle>
                                                <CardDescription>All affected slots will be instantly blocked for booking.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Date</Label>
                                                <Input
                                                    type="date"
                                                    value={newLeave.date}
                                                    onChange={e => setNewLeave({ ...newLeave, date: e.target.value })}
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Type</Label>
                                                <Select value={newLeave.type} onValueChange={v => setNewLeave({ ...newLeave, type: v as any })}>
                                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="full">Full Day Leave</SelectItem>
                                                        <SelectItem value="partial">Partial Time Block (e.g. Big Cases)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {newLeave.type === "partial" && (
                                            <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-600">Start Hour</Label>
                                                    <Input
                                                        type="time"
                                                        value={newLeave.startTime}
                                                        onChange={e => setNewLeave({ ...newLeave, startTime: e.target.value })}
                                                        className="h-10 rounded-xl bg-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-slate-600">End Hour</Label>
                                                    <Input
                                                        type="time"
                                                        value={newLeave.endTime}
                                                        onChange={e => setNewLeave({ ...newLeave, endTime: e.target.value })}
                                                        className="h-10 rounded-xl bg-white"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason (Optional)</Label>
                                            <Input
                                                placeholder="Emergency dental seminar / Personal leave"
                                                value={newLeave.reason}
                                                onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                                                className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                            />
                                        </div>

                                        <Button
                                            onClick={handleAddLeave}
                                            disabled={!newLeave.date}
                                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-slate-100 transition-all"
                                        >
                                            Confirm and Block Slots
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Leaves List */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-4">Active Leave Records</h3>
                                    {leaves.length === 0 ? (
                                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-100">
                                            <p className="text-slate-400 font-medium">No leave records found for this doctor.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {leaves.map(leave => (
                                                <div key={leave.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100">
                                                            {(() => {
                                                                const [y, m, d] = leave.date.split('-').map(Number);
                                                                const lDate = new Date(y, m - 1, d);
                                                                return (
                                                                    <>
                                                                        <p className="text-[10px] font-black uppercase text-slate-400">{lDate.toLocaleString('default', { month: 'short' })}</p>
                                                                        <p className="text-lg font-bold text-slate-900">{d}</p>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-bold text-slate-900">{leave.type === 'full' ? 'Full Day' : 'Partial Hours'}</p>
                                                                <Badge className={leave.type === 'full' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}>
                                                                    {leave.type}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                                                {leave.startTime ? `${leave.startTime} - ${leave.endTime}` : 'All Day'} • {leave.reason || 'No reason provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteLeave(leave.id)}
                                                        className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="booked" className="space-y-6 outline-none">
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                    <CardHeader className="flex flex-row items-center justify-between pb-8">
                                        <div>
                                            <CardTitle>Daily Presence & Bookings</CardTitle>
                                            <CardDescription>Review and manage availability and appointments for a specific day.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <Input
                                                    type="date"
                                                    value={viewDate}
                                                    onChange={e => setViewDate(e.target.value)}
                                                    className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-100 font-bold text-xs"
                                                />
                                            </div>
                                            {leaves.find(l => l.date === viewDate) ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteLeave(leaves.find(l => l.date === viewDate)!.id)}
                                                    className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border-none"
                                                >
                                                    <ShieldCheck className="w-3 h-3 mr-2" />
                                                    Remove Block
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setNewLeave({
                                                            ...newLeave,
                                                            date: viewDate,
                                                            type: 'full',
                                                            reason: 'Emergency Closure'
                                                        });
                                                        setActiveTab('leaves');
                                                    }}
                                                    className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border-none shadow-none"
                                                >
                                                    <ShieldAlert className="w-3 h-3 mr-2" />
                                                    Emergency Block
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-50">
                                            {slots.filter(s => s.date === viewDate).length === 0 ? (
                                                <div className="py-20 text-center opacity-40">
                                                    <Filter className="h-12 w-12 mx-auto mb-4" />
                                                    <p className="font-bold">No slots found for this date</p>
                                                    <p className="text-xs">Slots are generated based on the weekly schedule.</p>
                                                </div>
                                            ) : (
                                                [...slots]
                                                    .filter(s => s.date === viewDate)
                                                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                    .map(slot => {
                                                        const apt = appointments.find(a => a.id === slot.appointmentId && a.appointmentDate === viewDate);

                                                        return (
                                                            <div key={slot.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                                                <div className="flex items-center gap-6">
                                                                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 text-slate-900 shrink-0">
                                                                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Time</span>
                                                                        <span className="text-xs font-black">{slot.startTime}</span>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-3">
                                                                            <p className="font-bold text-slate-900">
                                                                                {apt ? apt.patientName : slot.status === 'blocked' ? slot.blockReason || 'Emergency Block' : 'Available for Booking'}
                                                                            </p>
                                                                            <Badge className={`
                                                                        text-[8px] font-black uppercase tracking-widest px-2
                                                                        ${slot.status === 'available' ? 'bg-emerald-50 text-emerald-600' : ''}
                                                                        ${slot.status === 'booked' ? 'bg-blue-50 text-blue-600' : ''}
                                                                        ${slot.status === 'blocked' ? 'bg-orange-50 text-orange-600' : ''}
                                                                    `}>
                                                                                {slot.status} {apt?.status === 'completed' ? '• COMPLETED' : ''}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                            {apt ? (
                                                                                <>
                                                                                    <span>{apt.patientIC}</span>
                                                                                    <span>•</span>
                                                                                    <span>{apt.patientPhone}</span>
                                                                                </>
                                                                            ) : (
                                                                                <span>{doctor?.slotDuration} Minutes Duration</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {slot.status === 'available' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => { setSelectedSlot(slot); setIsBlocking(true); }}
                                                                            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-orange-600 hover:bg-orange-50"
                                                                        >
                                                                            <Ban className="w-3 h-3 mr-2" />
                                                                            Block
                                                                        </Button>
                                                                    )}

                                                                    {slot.status === 'blocked' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleUnblockSlot(slot.id)}
                                                                            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50"
                                                                        >
                                                                            <Unlock className="w-3 h-3 mr-2" />
                                                                            Unblock
                                                                        </Button>
                                                                    )}

                                                                    {slot.status === 'booked' && apt && apt.status === 'confirmed' && (
                                                                        <>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        await updateAppointmentStatusAsync(apt.id, 'completed')
                                                                                        toast({ title: "Appointment Completed" })
                                                                                        loadDoctorData(doctor?.id!)
                                                                                    } catch (e) {
                                                                                        toast({ title: "Failed to update", variant: "destructive" })
                                                                                    }
                                                                                }}
                                                                                className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white"
                                                                            >
                                                                                <CheckCircle2 className="w-3 h-3 mr-2" />
                                                                                Complete
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => { setSelectedSlot(slot); setIsCancelling(true); }}
                                                                                className="h-9 w-9 rounded-xl text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Block Slot Dialog */}
                                <Dialog open={isBlocking} onOpenChange={setIsBlocking}>
                                    <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
                                        <div className="bg-orange-500 p-8 text-white">
                                            <Ban className="w-12 h-12 mb-4 opacity-50" />
                                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Block this Slot?</DialogTitle>
                                            <DialogDescription className="text-orange-100 font-medium">Blocking this slot will prevent patients from booking it on {viewDate} at {selectedSlot?.startTime}.</DialogDescription>
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason (Optional)</Label>
                                                <Input
                                                    placeholder="e.g. Personal Break, Equipment Maintenance"
                                                    value={cancelReason}
                                                    onChange={e => setCancelReason(e.target.value)}
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="ghost" onClick={() => setIsBlocking(false)} className="flex-1 h-12 rounded-xl font-bold">Discard</Button>
                                                <Button onClick={() => handleBlockSlot(selectedSlot!, cancelReason)} className="flex-2 h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold shadow-lg shadow-orange-100">Confirm Block</Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                {/* Cancel Appointment Dialog */}
                                <Dialog open={isCancelling} onOpenChange={setIsCancelling}>
                                    <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
                                        <div className="bg-rose-600 p-8 text-white">
                                            <Trash2 className="w-12 h-12 mb-4 opacity-50" />
                                            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Cancel Appointment?</DialogTitle>
                                            <DialogDescription className="text-rose-100 font-medium">This will notify the patient and free up the {selectedSlot?.startTime} slot for other bookings.</DialogDescription>
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cancellation Reason</Label>
                                                <Input
                                                    placeholder="e.g. Doctor Unavailable, Patient Requested"
                                                    value={cancelReason}
                                                    onChange={e => setCancelReason(e.target.value)}
                                                    className="h-12 rounded-xl bg-slate-50 border-slate-100"
                                                />
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="ghost" onClick={() => setIsCancelling(false)} className="flex-1 h-12 rounded-xl font-bold text-slate-500">Keep Booking</Button>
                                                <Button onClick={() => handleCancelAppointment(selectedSlot?.appointmentId!, selectedSlot?.id!, cancelReason)} className="flex-2 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold shadow-lg shadow-rose-100">Confirm Cancellation / Delete</Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </TabsContent>

                            <TabsContent value="patients" className="space-y-6 outline-none">
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>Assigned Patient Registry</CardTitle>
                                                <CardDescription>Patients who have clinical history with this provider.</CardDescription>
                                            </div>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                <Input
                                                    placeholder="Search patients..."
                                                    value={patientSearch}
                                                    onChange={(e) => setPatientSearch(e.target.value)}
                                                    className="pl-10 h-10 w-64 rounded-xl bg-slate-50 border-none"
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-slate-50">
                                            {filteredPatients.map(ic => {
                                                const apt = appointments.find(a => a.patientIC === ic)
                                                if (!apt) return null
                                                return (
                                                    <div key={ic} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                                                                {apt.patientName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{apt.patientName}</p>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{apt.patientIC} • {apt.patientPhone}</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewHistory(ic)}
                                                            className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50"
                                                        >
                                                            View History
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                            {appointments.length === 0 && (
                                                <div className="py-20 text-center text-slate-400 font-medium italic">No patients found in this registry.</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="consultations" className="space-y-6 outline-none">
                                <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Patient Consultation Records</h2>
                                            <p className="text-sm text-slate-500 font-medium">Doctor-specific patient data and records.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => setIsAddRecordOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                                                <Plus className="w-4 h-4 mr-2" /> Add Record
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50/50 text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-100">
                                                <tr>
                                                    <th className="px-6 py-4">Name</th>
                                                    <th className="px-6 py-4">Card No</th>
                                                    <th className="px-6 py-4">IC No</th>
                                                    <th className="px-6 py-4">Phone</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {consultations.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">No records found.</td>
                                                    </tr>
                                                ) : (
                                                    consultations.map((rec, index) => (
                                                        <tr key={rec.id} className={`hover:bg-slate-100/70 transition-colors border-b border-slate-50 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                            <td className="px-6 py-5 font-bold text-slate-900 text-base">{rec.patientName}</td>
                                                            <td className="px-6 py-5 font-medium text-slate-600">{rec.cardNo || '-'}</td>
                                                            <td className="px-6 py-5 font-medium text-slate-600">{rec.patientIC}</td>
                                                            <td className="px-6 py-5 text-slate-600">{rec.handphoneNo}</td>
                                                            <td className="px-6 py-5 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setEditingRecord(rec)}
                                                                        className="h-9 w-9 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600"
                                                                    >
                                                                        <Edit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setDeletingRecord(rec)}
                                                                        className="h-9 w-9 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </main>

            {/* Add Record Dialog */}
            <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl border-none">
                    <DialogHeader>
                        <DialogTitle>Add Patient Record</DialogTitle>
                        <DialogDescription>Manually enter details for a new consultation record.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Input placeholder="Patient Name" value={newRecord.patientName} onChange={e => setNewRecord({ ...newRecord, patientName: e.target.value })} />
                        <Input placeholder="Card No" value={newRecord.cardNo} onChange={e => setNewRecord({ ...newRecord, cardNo: e.target.value })} />
                        <Input placeholder="IC No (Required)" value={newRecord.patientIC} onChange={e => setNewRecord({ ...newRecord, patientIC: e.target.value })} />
                        <Input placeholder="Phone No" value={newRecord.handphoneNo} onChange={e => setNewRecord({ ...newRecord, handphoneNo: e.target.value })} />
                        <div className="space-y-1">
                            <Label>Total Fee (RM)</Label>
                            <Input type="number" value={newRecord.totalFee} onChange={e => setNewRecord({ ...newRecord, totalFee: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label>Consultation Fee (RM)</Label>
                            <Input type="number" value={newRecord.consultationFee} onChange={e => setNewRecord({ ...newRecord, consultationFee: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label>Consultation Date</Label>
                            <Input type="date" value={newRecord.consultationDate} onChange={e => setNewRecord({ ...newRecord, consultationDate: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <Label>Fix Date (Next Appt)</Label>
                            <Input type="date" value={newRecord.fixDate} onChange={e => setNewRecord({ ...newRecord, fixDate: e.target.value })} />
                        </div>
                        <Input className="col-span-2" placeholder="Remark" value={newRecord.remark} onChange={e => setNewRecord({ ...newRecord, remark: e.target.value })} />
                        <Input className="col-span-2" placeholder="Updates / History" value={newRecord.updates} onChange={e => setNewRecord({ ...newRecord, updates: e.target.value })} />
                    </div>
                    <Button onClick={() => {
                        // 1. Required Fields Check
                        if (!newRecord.patientName || !newRecord.patientIC || !newRecord.handphoneNo) {
                            toast({ title: "Missing Required Fields", description: "Name, IC, and Phone are required.", variant: "destructive" });
                            return;
                        }

                        // 2. Uniqueness Check
                        const duplicateIC = consultations.find(c => c.patientIC === newRecord.patientIC);
                        if (duplicateIC) {
                            toast({ title: "Duplicate Record", description: `Patient IC ${newRecord.patientIC} already exists.`, variant: "destructive" });
                            return;
                        }

                        const duplicatePhone = consultations.find(c => c.handphoneNo === newRecord.handphoneNo);
                        if (duplicatePhone) {
                            toast({ title: "Duplicate Record", description: `Phone Number ${newRecord.handphoneNo} is already registered.`, variant: "destructive" });
                            return;
                        }

                        if (newRecord.cardNo) {
                            const duplicateCard = consultations.find(c => c.cardNo === newRecord.cardNo);
                            if (duplicateCard) {
                                toast({ title: "Duplicate Record", description: `Card No ${newRecord.cardNo} already exists.`, variant: "destructive" });
                                return;
                            }
                        }

                        handleAddRecord();
                    }} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12">Save Record</Button>
                </DialogContent>
            </Dialog>

            {/* CSV Import Dialog */}
            <Dialog open={isCSVImportOpen} onOpenChange={setIsCSVImportOpen}>
                <DialogContent className="max-w-3xl bg-white rounded-3xl border-none">
                    <DialogHeader>
                        <DialogTitle>Import Records from CSV</DialogTitle>
                        <DialogDescription>
                            Upload a CSV file with headers: NAME, CARD NO, IC NO, HANDPHONE NO, TOTAL FEE, CONSULTION DATE, CONSULTATION FEE, FIX DATE, REMARK, UPDATES
                        </DialogDescription>
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const headers = "NAME,CARD NO,IC NO,HANDPHONE NO,TOTAL FEE,CONSULTION DATE,CONSULTATION FEE,FIX DATE,REMARK,UPDATES";
                                    const blob = new Blob([headers], { type: 'text/csv' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'consultation_template.csv';
                                    a.click();
                                }}
                                className="text-xs gap-2"
                            >
                                <Briefcase className="w-3 h-3" /> Download Template
                            </Button>
                        </div>
                    </DialogHeader>
                    {!csvFile ? (
                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                            <Input
                                type="file"
                                accept=".csv"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setCsvFile(e.target.files[0]);
                                        parseCSV(e.target.files[0]);
                                    }
                                }}
                                className="hidden"
                                id="csv-upload"
                            />
                            <Label htmlFor="csv-upload" className="cursor-pointer block">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Briefcase className="w-8 h-8" />
                                </div>
                                <p className="font-bold text-slate-900 text-lg">Click to Upload CSV</p>
                                <p className="text-slate-500 mt-2">or drag and drop file here</p>
                            </Label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                <p className="font-bold text-sm">{csvFile?.name}</p>
                                <Button variant="ghost" size="sm" onClick={() => { setCsvFile(null); setCsvPreview([]) }} className="text-red-500">Remove</Button>
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 font-bold text-slate-500">
                                        <tr>
                                            <th className="p-2">Name</th>
                                            <th className="p-2">IC</th>
                                            <th className="p-2">Total Fee</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {csvPreview.map((r, i) => (
                                            <tr key={i} className="border-t border-slate-50">
                                                <td className="p-2">{r.patientName}</td>
                                                <td className="p-2">{r.patientIC}</td>
                                                <td className="p-2">RM {r.totalFee}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-500 text-right">{csvPreview.length} valid records found.</p>
                            <Button onClick={handleCSVImport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12">
                                Confirm Import
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-slate-900 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <Activity className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">Clinical History</DialogTitle>
                                <DialogDescription className="text-slate-400 font-medium">Record of all past and upcoming encounters.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6">
                        {patientHistory.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 italic">No historical records found.</div>
                        ) : (
                            <div className="space-y-4">
                                {patientHistory.slice().reverse().map(apt => (
                                    <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{new Date(apt.appointmentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{apt.timeSlot}</p>
                                            </div>
                                        </div>
                                        <Badge className={`
                                            px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-none
                                            ${apt.status === 'confirmed' ? 'bg-blue-100 text-blue-600' : ''}
                                            ${apt.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : ''}
                                            ${apt.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : ''}
                                            ${apt.status === 'no-show' ? 'bg-slate-100 text-slate-400' : ''}
                                        `}>
                                            {apt.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Record Dialog */}
            <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border-none">
                    <DialogHeader>
                        <DialogTitle>Edit Patient Record</DialogTitle>
                        <DialogDescription>Update the details for this consultation record.</DialogDescription>
                    </DialogHeader>
                    {editingRecord && (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <Input
                                placeholder="Patient Name"
                                value={editingRecord.patientName}
                                onChange={e => editingRecord && setEditingRecord({ ...editingRecord, patientName: e.target.value })}
                            />
                            <Input
                                placeholder="Card No"
                                value={editingRecord.cardNo || ""}
                                onChange={e => editingRecord && setEditingRecord({ ...editingRecord, cardNo: e.target.value })}
                            />
                            <Input
                                placeholder="IC No (Required)"
                                value={editingRecord.patientIC}
                                onChange={e => editingRecord && setEditingRecord({ ...editingRecord, patientIC: e.target.value })}
                            />
                            <Input
                                placeholder="Phone No"
                                value={editingRecord.handphoneNo}
                                onChange={e => editingRecord && setEditingRecord({ ...editingRecord, handphoneNo: e.target.value })}
                            />
                            <div className="space-y-1">
                                <Label>Total Fee (RM)</Label>
                                <Input
                                    type="number"
                                    value={editingRecord.totalFee}
                                    onChange={e => editingRecord && setEditingRecord({ ...editingRecord, totalFee: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Consultation Fee (RM)</Label>
                                <Input
                                    type="number"
                                    value={editingRecord.consultationFee}
                                    onChange={e => editingRecord && setEditingRecord({ ...editingRecord, consultationFee: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Consultation Date</Label>
                                <Input
                                    type="date"
                                    value={editingRecord.consultationDate}
                                    onChange={e => editingRecord && setEditingRecord({ ...editingRecord, consultationDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Fix Date (Next Appt)</Label>
                                <Input
                                    type="date"
                                    value={editingRecord.fixDate || ""}
                                    onChange={e => editingRecord && setEditingRecord({ ...editingRecord, fixDate: e.target.value })}
                                />
                            </div>
                            <Input
                                className="col-span-2"
                                placeholder="Remark"
                                value={editingRecord.remark || ""}
                                onChange={e => editingRecord && setEditingRecord({ ...editingRecord, remark: e.target.value })}
                            />
                            <Input
                                className="col-span-2"
                                placeholder="Updates / History"
                                value={editingRecord.updates || ""}
                                onChange={e => {
                                    if (editingRecord) {
                                        setEditingRecord({ ...editingRecord, updates: e.target.value })
                                    }
                                }}
                            />
                        </div>
                    )}
                    <div className="flex gap-4 pt-2">
                        <Button variant="ghost" onClick={() => setEditingRecord(null)} className="flex-1 h-12 rounded-xl text-slate-500 font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateRecord} className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">
                            Save Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deletingRecord} onOpenChange={(open) => !open && setDeletingRecord(null)}>
                <DialogContent className="max-w-md bg-white rounded-3xl border-none">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Patient Record</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this record? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deletingRecord && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 my-4">
                            <p className="font-bold text-slate-900">{deletingRecord?.patientName}</p>
                            <p className="text-sm text-slate-500">IC: {deletingRecord?.patientIC}</p>
                            <p className="text-sm text-slate-500">Phone: {deletingRecord?.handphoneNo}</p>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <Button variant="ghost" onClick={() => setDeletingRecord(null)} className="flex-1 h-12 rounded-xl text-slate-500 font-bold">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteRecord} className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold">
                            Delete Record
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}
