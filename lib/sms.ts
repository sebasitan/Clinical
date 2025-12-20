import twilio from 'twilio';
import { generateGoogleCalendarLink } from './calendar-utils';

/**
 * Sanitizes phone number to E.164 format
 */
function sanitizePhone(phone: string): string {
    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    return cleaned;
}

function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) {
        throw new Error('Twilio Credentials Missing (TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)');
    }
    return twilio(accountSid, authToken);
}

/**
 * Sends a verification code (OTP) via SMS using Twilio Verify
 * @param to Phone number in E.164 format
 */
export async function sendSMSOTP(to: string) {
    try {
        const client = getTwilioClient();
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA549c93a543dddbd19698d9133ab327a5';
        const formattedPhone = sanitizePhone(to);

        console.log(`[Twilio] Sending OTP to ${formattedPhone} using service ${serviceSid}`);

        const verification = await client.verify.v2.services(serviceSid)
            .verifications
            .create({ to: formattedPhone, channel: 'sms' });

        return { success: true, sid: verification.sid };
    } catch (error: any) {
        console.error('Twilio Verify Send Error:', error);
        return { success: false, error: error.message || 'Unknown Twilio error' };
    }
}

/**
 * Verifies the code entered by the user
 * @param to Phone number in E.164 format
 * @param code The 6-digit code to verify
 */
export async function verifySMSOTP(to: string, code: string) {
    try {
        const client = getTwilioClient();
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA549c93a543dddbd19698d9133ab327a5';
        const formattedPhone = sanitizePhone(to);

        const verificationCheck = await client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({ to: formattedPhone, code });

        return {
            success: verificationCheck.status === 'approved',
            status: verificationCheck.status
        };
    } catch (error: any) {
        console.error('Twilio Verify Check Error:', error);
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
        const calendarLink = generateGoogleCalendarLink(
            `Dental Appointment`,
            `Visit to Klinik Pergigian Setapak (Sri Rampai). ID: ${appointmentId}`,
            "KPS (Sri Rampai)",
            appointmentDate,
            timeSlot
        );
        const client = getTwilioClient();
        const from = process.env.TWILIO_PHONE_NUMBER;
        const formattedPhone = sanitizePhone(to);

        const message = await client.messages.create({
            body: `✅ Confirmed: Dental appt with ${doctorName} on ${appointmentDate} @ ${timeSlot}. ID: ${appointmentId}. Add to cal: ${calendarLink}`,
            from: from,
            to: formattedPhone
        });

        return { success: true, sid: message.sid };
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
        const client = getTwilioClient();
        const from = process.env.TWILIO_PHONE_NUMBER;
        const formattedPhone = sanitizePhone(to);

        const message = await client.messages.create({
            body: `⏰ Reminder: You have a dental appointment with ${doctorName} on ${appointmentDate} at ${timeSlot}. - Klinik Pergigian Setapak (Sri Rampai)`,
            from: from,
            to: formattedPhone
        });

        return { success: true, sid: message.sid };
    } catch (error: any) {
        console.error('SMS Reminder Error:', error);
        return { success: false, error: error.message };
    }
}
