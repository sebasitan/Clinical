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
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
}, { timestamps: true });

export const AppointmentModel = models.Appointment || model('Appointment', AppointmentSchema);

// --- Settings Schema ---
const SettingsSchema = new Schema({
    clinicName: { type: String, default: "Klinik Pergigian Setapak" },
    address: { type: String, default: "Setapak, Kuala Lumpur" },
    phone: { type: String, default: "+60 3-XXXX XXXX" },
    email: { type: String, default: "ops@klinikpergigiansetapak.com" },
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
