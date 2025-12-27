import { budgetsms } from './budgetsms';
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
 * Generates a random 6-digit OTP
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sends a verification code (OTP) via SMS using BudgetSMS
 * @param to Phone number in E.164 format
 */
export async function sendSMSOTP(to: string) {
    try {
        await dbConnect();
        const formattedPhone = sanitizePhone(to);
        const code = generateOTP();

        console.log(`[BudgetSMS] Generating OTP ${code} for ${formattedPhone}`);

        // Save OTP to DB
        await OTPModel.findOneAndUpdate(
            { phone: formattedPhone },
            {
                code: code,
                reqid: null, // Clear any legacy Mocean reqid
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );

        // Send OTP via SMS
        const message = `Your verification code is: ${code}. Valid for 10 minutes.`;
        const success = await budgetsms.sendSMS(formattedPhone, message);

        if (success) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to send SMS via BudgetSMS' };
        }
    } catch (error: any) {
        console.error('BudgetSMS OTP Error:', error);
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

        // Verify local code
        if (record.code && record.code === code) {
            // Check expiry (10 mins)
            const now = new Date();
            const created = new Date(record.createdAt);
            const diff = (now.getTime() - created.getTime()) / 1000;

            if (diff > 600) {
                return { success: false, status: 'failed', error: 'Code expired' };
            }

            // Delete after successful verification
            await OTPModel.deleteOne({ _id: record._id });
            return { success: true, status: 'approved' };
        } else {
            return { success: false, status: 'failed', error: 'Invalid code' };
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

        const success = await budgetsms.sendSMS(formattedPhone, message);

        return { success: success, error: success ? undefined : 'Failed to send SMS' };
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

        const success = await budgetsms.sendSMS(formattedPhone, message);

        return { success: success, error: success ? undefined : 'Failed to send SMS' };
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

        const success = await budgetsms.sendSMS(formattedPhone, message);
        return { success: success, error: success ? undefined : 'Failed to send SMS' };
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

        const success = await budgetsms.sendSMS(formattedPhone, message);
        return { success: success, error: success ? undefined : 'Failed to send SMS' };
    } catch (error: any) {
        console.error('SMS Cancel Error:', error);
        return { success: false, error: error.message };
    }
}
