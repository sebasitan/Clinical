import { generateGoogleCalendarLink } from './calendar-utils';

export async function sendWhatsAppConfirmation(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string,
    appointmentId: string,
    patientIC?: string
) {
    console.warn('[WhatsApp] Service disabled (MoceanAPI removed). Message to:', to);
    // Return success to prevent breaking booking flow, but indicate no message sent
    return { success: true, messageId: 'DISABLED', error: 'WhatsApp service disabled' };
}

export async function sendWhatsAppReminder(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string
) {
    console.warn('[WhatsApp] Service disabled (MoceanAPI removed). Message to:', to);
    return { success: true, messageId: 'DISABLED', error: 'WhatsApp service disabled' };
}

export async function sendWhatsAppOTP(to: string, otp: string) {
    console.warn('[WhatsApp] Service disabled (MoceanAPI removed). Message to:', to);
    return { success: true, messageId: 'DISABLED', error: 'WhatsApp service disabled' };
}

export async function sendWhatsAppRescheduled(
    to: string,
    patientName: string,
    doctorName: string,
    newDate: string,
    newTime: string,
    appointmentId: string
) {
    console.warn('[WhatsApp] Service disabled (MoceanAPI removed). Message to:', to);
    return { success: true, error: 'WhatsApp service disabled' };
}

export async function sendWhatsAppCancelled(
    to: string,
    patientName: string,
    appointmentId: string,
    date: string
) {
    console.warn('[WhatsApp] Service disabled (MoceanAPI removed). Message to:', to);
    return { success: true, error: 'WhatsApp service disabled' };
}
