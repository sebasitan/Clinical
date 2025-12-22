import mongoose, { Schema, model, models } from 'mongoose';

// --- Doctor Schema ---
const DoctorSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    photo: String,
    phone: String,
    email: String,
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    slotDuration: { type: Number, default: 30 },
}, { timestamps: true });

export const DoctorModel = models.Doctor || model('Doctor', DoctorSchema);

// --- Appointment Schema ---
const AppointmentSchema = new Schema({
    id: { type: String, required: true, unique: true },
    patientName: { type: String, required: true },
    patientIC: { type: String },
    patientType: { type: String, required: true }, // 'new' | 'existing'
    patientPhone: { type: String, required: true },
    patientEmail: String,
    appointmentDate: { type: String, required: true }, // ISO Date String YYYY-MM-DD
    timeSlot: { type: String, required: true },
    slotId: String,
    doctorId: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'arrived', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
}, { timestamps: true });

export const AppointmentModel = models.Appointment || model('Appointment', AppointmentSchema);

// --- Settings Schema ---
const SettingsSchema = new Schema({
    clinicName: { type: String, default: "Klinik Pergigian Setapak (Sri Rampai)" },
    address: { type: String, default: "16-2, Jalan 46/26, Taman Sri Rampai, 53300 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia" },
    phone: { type: String, default: "+60 17-510 1003" },
    email: { type: String, default: "hello@kpsrirampai.com" },
    defaultSlotDuration: { type: Number, default: 30 },
    workingHours: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "18:00" }
    },
    notifications: {
        sms: { type: Boolean, default: true },
        whatsapp: { type: Boolean, default: true },
        emailReminders: { type: Boolean, default: true }
    }
});

export const SettingsModel = models.Settings || model('Settings', SettingsSchema);

// --- Admin Schema ---
const AdminSchema = new Schema({
    id: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'admin' },
    lastLogin: Date
});

export const AdminModel = models.Admin || model('Admin', AdminSchema);

// --- Slot Schema (for managing availability) ---
const SlotSchema = new Schema({
    id: { type: String, required: true, unique: true },
    doctorId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    timeRange: { type: String, required: true },
    startTime: String,
    endTime: String,
    status: { type: String, default: 'available' }, // 'available', 'booked', 'blocked'
    type: { type: String, default: 'public' },
    appointmentId: String,
    blockReason: String
});

export const SlotModel = models.Slot || model('Slot', SlotSchema);

// --- Schedule Schema ---
const ScheduleSchema = new Schema({
    doctorId: { type: String, required: true },
    days: {
        Monday: [{ start: String, end: String }],
        Tuesday: [{ start: String, end: String }],
        Wednesday: [{ start: String, end: String }],
        Thursday: [{ start: String, end: String }],
        Friday: [{ start: String, end: String }],
        Saturday: [{ start: String, end: String }],
        Sunday: [{ start: String, end: String }]
    }
});

export const ScheduleModel = models.Schedule || model('Schedule', ScheduleSchema);

// --- Leave Schema ---
const LeaveSchema = new Schema({
    id: { type: String, required: true, unique: true },
    doctorId: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ['full', 'partial', 'emergency'], default: 'full' },
    startTime: String,
    endTime: String,
    reason: String
});

export const LeaveModel = models.Leave || model('Leave', LeaveSchema);

// --- Receptionist Schema ---
const ReceptionistSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    photo: String,
    phone: { type: String, required: true },
    email: { type: String, required: true },
    shift: {
        type: String,
        enum: ['morning', 'afternoon', 'full-day'],
        default: 'full-day'
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const ReceptionistModel = models.Receptionist || model('Receptionist', ReceptionistSchema);

// --- Patient Schema ---
const PatientSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    ic: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    email: String,
    type: { type: String, enum: ['new', 'existing'], default: 'new' },
    lastVisit: String,
    continuedTreatment: {
        active: { type: Boolean, default: false },
        nextFollowUpDate: Date,
        notes: String,
        status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
        reminderDaysBefore: { type: [Number], default: [2, 1] }, // default 2 and 1 day before
        preferredChannels: {
            sms: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: true },
            email: { type: Boolean, default: true }
        }
    }
}, { timestamps: true });

export const PatientModel = models.Patient || model('Patient', PatientSchema);

// --- Reminder Schedule Schema ---
const ReminderScheduleSchema = new Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['broadcast', 'behavioral', 'appointment'], default: 'broadcast' },
    targetGroup: {
        type: String,
        enum: ['all', 'inactive_3m', 'inactive_6m', 'specific_patient', 'scheduled_appointment'],
        default: 'all'
    },
    patientIC: String,
    // New sequence logic: [2, 1, 0] means 2 days before, 1 day before, and day of.
    sequence: { type: [Number], default: [1] },
    channels: {
        sms: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: true },
        email: { type: Boolean, default: true }
    },
    messageTemplate: String,
    scheduledAt: { type: Date }, // For broadcasts
    lastExecutedAt: Date,
    status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
    createdBy: String
}, { timestamps: true });

export const ReminderModel = models.Reminder || model('Reminder', ReminderScheduleSchema);

// --- Consultation Schema (Doctor-wise Patient Data) ---
const ConsultationSchema = new Schema({
    id: { type: String, required: true, unique: true },
    doctorId: { type: String, required: true },
    patientName: { type: String, required: true },
    patientIC: { type: String, required: true },
    handphoneNo: { type: String, required: true },
    cardNo: String,
    totalFee: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    consultationDate: { type: String, required: true }, // ISO Date YYYY-MM-DD
    fixDate: String, // ISO Date YYYY-MM-DD (Next Appointment)
    remark: String,
    updates: String // History/Notes
}, { timestamps: true });

export const ConsultationModel = models.Consultation || model('Consultation', ConsultationSchema);

// --- OTP Schema (Temporary) ---
const OTPSchema = new Schema({
    phone: { type: String, required: true },
    code: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 } // Expires in 10 minutes
});

export const OTPModel = models.OTP || model('OTP', OTPSchema);
