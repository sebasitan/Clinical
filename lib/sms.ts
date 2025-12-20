import { mocean } from './mocean';
import { generateGoogleCalendarLink } from './calendar-utils';
import { OTPModel } from './models';
import dbConnect from './db';

/**
 * Sanitizes phone number to format acceptable by general logic
 */
function sanitizePhone(phone: string): string {
    // Basic sanitization, ensure numbers only but keep + if international
    // Mocean handles formats fairly well, but we should clear spaces
    return phone.replace(/\s+/g, '');
}

/**
 * Sends a verification code (OTP) via SMS using Mocean
 * @param to Phone number in E.164 format
 */
export async function sendSMSOTP(to: string) {
    try {
        await dbConnect();
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const formattedPhone = sanitizePhone(to);

        console.log(`[Mocean] Generating OTP ${code} for ${formattedPhone}`);

        // Store OTP in DB
        await OTPModel.findOneAndUpdate(
            { phone: formattedPhone },
            { code: code, createdAt: new Date() },
            { upsert: true, new: true }
        );

        // Send via Mocean
        const result = await mocean.sendSMS(formattedPhone, `Your KPS Dental verification code is: ${code}`);

        if (result.success) {
            return { success: true, sid: result.msgid };
        } else {
            return { success: false, error: result.error };
        }
    } catch (error: any) {
        console.error('Mocean SMS OTP Error:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Verifies the code entered by the user
 * @param to Phone number
 * @param code The 6-digit code to verify
 */
export async function verifySMSOTP(to: string, code: string) {
    try {
        await dbConnect();
        const formattedPhone = sanitizePhone(to);

        const record = await OTPModel.findOne({ phone: formattedPhone });

        if (record && record.code === code) {
            // Delete after successful verification (optional, or let TTL handle it)
            await OTPModel.deleteOne({ _id: record._id });
            return { success: true, status: 'approved' };
        } else {
            return { success: false, status: 'failed', error: 'Invalid or expired code' };
        }
    } catch (error: any) {
        console.error('Verify OTP Error:', error);
        return { success: false, error: error.message || 'Verification failed' };
    }
}

/**
 * Sends a confirmation SMS after booking
 */
export async function sendSMSConfirmation(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string,
    appointmentId: string
) {
    try {
        const manageLink = `https://${process.env.VERCEL_URL || 'localhost:3000'}/appointments/${appointmentId}/manage`;
        const formattedPhone = sanitizePhone(to);
        const message = `✅ Confirmed: Dental appt with ${doctorName} on ${appointmentDate} @ ${timeSlot}. ID: ${appointmentId}. Manage: ${manageLink}`;

        const result = await mocean.sendSMS(formattedPhone, message);

        return { success: result.success, sid: result.msgid, error: result.error };
    } catch (error: any) {
        console.error('SMS Confirmation Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sends a generic appointment reminder via SMS
 */
export async function sendSMSReminder(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string
) {
    try {
        const formattedPhone = sanitizePhone(to);
        const message = `⏰ Reminder: You have a dental appointment with ${doctorName} on ${appointmentDate} at ${timeSlot}. - Klinik Pergigian Setapak (Sri Rampai)`;

        const result = await mocean.sendSMS(formattedPhone, message);

        return { success: result.success, sid: result.msgid, error: result.error };
    } catch (error: any) {
        console.error('SMS Reminder Error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendSMSRescheduled(
    to: string,
    doctorName: string,
    newDate: string,
    newTime: string,
    appointmentId: string
) {
    try {
        const formattedPhone = sanitizePhone(to);
        const message = `📅 Rescheduled: Your appt (ID: ${appointmentId}) with ${doctorName} is moved to ${newDate} @ ${newTime}. See you then!`;

        const result = await mocean.sendSMS(formattedPhone, message);
        return { success: result.success, error: result.error };
    } catch (error: any) {
        console.error('SMS Reschedule Error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendSMSCancelled(
    to: string,
    appointmentId: string,
    date: string
) {
    try {
        const formattedPhone = sanitizePhone(to);
        const message = `✕ Cancelled: Your dental appt on ${date} (ID: ${appointmentId}) has been cancelled. - Klinik Pergigian Setapak`;

        const result = await mocean.sendSMS(formattedPhone, message);
        return { success: result.success, error: result.error };
    } catch (error: any) {
        console.error('SMS Cancel Error:', error);
        return { success: false, error: error.message };
    }
}
