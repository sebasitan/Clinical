import { mocean } from './mocean';
import { generateGoogleCalendarLink } from './calendar-utils';
import { OTPModel } from './models';
import dbConnect from './db';
import { formatMalaysianPhone } from '@/lib/utils'; // Import the centralized formatter

/**
 * Sanitizes phone number to format acceptable by general logic
 */
function sanitizePhone(phone: string): string {
    return formatMalaysianPhone(phone);
}

/**
 * Sends a verification code (OTP) via SMS using Mocean
 * @param to Phone number in E.164 format
 */
/**
 * Sends a verification code (OTP) via SMS using Mocean Verify API
 * @param to Phone number in E.164 format
 */
export async function sendSMSOTP(to: string) {
    try {
        await dbConnect();
        const formattedPhone = sanitizePhone(to);

        console.log(`[Mocean] Requesting Verify OTP for ${formattedPhone}`);

        // Use Mocean Verify API
        const result = await mocean.requestVerify(formattedPhone);

        if (result.success && result.reqid) {
            // Store reqid in DB (we don't need the code itself as Mocean handles it)
            await OTPModel.findOneAndUpdate(
                { phone: formattedPhone },
                { reqid: result.reqid, code: null, createdAt: new Date() },
                { upsert: true, new: true }
            );
            return { success: true, reqid: result.reqid };
        } else {
            return { success: false, error: result.error || 'Failed to request verification' };
        }
    } catch (error: any) {
        console.error('Mocean Verify API Error:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Verifies the code entered by the user
 * @param to Phone number
 * @param code The digit code to verify
 */
export async function verifySMSOTP(to: string, code: string) {
    try {
        await dbConnect();
        const formattedPhone = sanitizePhone(to);

        // Find the active verification request
        const record = await OTPModel.findOne({ phone: formattedPhone });

        if (!record) {
            return { success: false, error: 'No verification request found' };
        }

        // Check if we have a reqid (Mocean Verify) or legacy code
        if (record.reqid) {
            const result = await mocean.checkVerify(record.reqid, code);

            if (result.success) {
                // Delete after successful verification
                await OTPModel.deleteOne({ _id: record._id });
                return { success: true, status: 'approved' };
            } else {
                return { success: false, status: 'failed', error: result.error || 'Invalid code' };
            }
        } else if (record.code) {
            // Fallback to legacy local verification
            if (record.code === code) {
                await OTPModel.deleteOne({ _id: record._id });
                return { success: true, status: 'approved' };
            } else {
                return { success: false, status: 'failed', error: 'Invalid or expired code' };
            }
        } else {
            return { success: false, error: 'Invalid verification state' };
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
