import { mocean } from './mocean';
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
    try {
        const calendarLink = generateGoogleCalendarLink(
            `Dental Appointment with ${doctorName}`,
            `Dental consultation at Klinik Pergigian Setapak (Sri Rampai). ID: ${appointmentId}`,
            "Klinik Pergigian Setapak (Sri Rampai)",
            appointmentDate,
            timeSlot
        );

        const message = `✅ *Appointment Confirmed*

Dear ${patientName},

Your dental appointment has been successfully scheduled at *Klinik Pergigian Setapak (Sri Rampai)*.

📋 *Appointment Details:*
• ID: ${appointmentId}
• Patient IC: ${patientIC || 'N/A'}
• Doctor: ${doctorName}
• Date: ${appointmentDate}
• Time: ${timeSlot}

📍 *Location:*
16-2, Jalan 46/26, Taman Sri Rampai,
53300 Kuala Lumpur

🗓️ *Add to Calendar:*
${calendarLink}

✍️ *Manage/Reschedule:*
https://${process.env.VERCEL_URL || 'localhost:3000'}/appointments/${appointmentId}/manage

⚠️ *Important Reminders:*
• Arrive 10 minutes early
• Bring your IC
• Contact us 24h in advance to reschedule

📞 Contact: +60 3-4142 1234

Thank you for choosing us! 🦷`;

        const result = await mocean.sendWhatsApp(to, message);
        return { success: result.success, messageId: result.msgid, error: result.error };
    } catch (error: any) {
        console.error('WhatsApp error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppReminder(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string
) {
    try {
        const message = `⏰ *Appointment Reminder*

Dear ${patientName},

This is a friendly reminder about your upcoming dental appointment:

👨‍⚕️ Doctor: ${doctorName}
📅 Date: ${appointmentDate}
🕐 Time: ${timeSlot}

See you soon! 🦷

- Klinik Pergigian Setapak (Sri Rampai)`;

        const result = await mocean.sendWhatsApp(to, message);
        return { success: result.success, messageId: result.msgid, error: result.error };
    } catch (error: any) {
        console.error('WhatsApp reminder error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppOTP(to: string, otp: string) {
    try {
        const message = `🔐 *Verification Code*

Your OTP for appointment booking:

*${otp}*

This code will expire in 10 minutes.
Do not share this code with anyone.

- Klinik Pergigian Setapak (Sri Rampai)`;

        const result = await mocean.sendWhatsApp(to, message);
        return { success: result.success, messageId: result.msgid, error: result.error };
    } catch (error: any) {
        console.error('WhatsApp OTP error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppRescheduled(
    to: string,
    patientName: string,
    doctorName: string,
    newDate: string,
    newTime: string,
    appointmentId: string
) {
    try {
        const message = `📅 *Appointment Rescheduled*

Dear ${patientName},

Your appointment has been successfully *rescheduled*.

📋 *Revised Details:*
• ID: ${appointmentId}
• Doctor: ${doctorName}
• *New Date:* ${newDate}
• *New Time:* ${newTime}

📍 *Location:*
Klinik Pergigian Setapak (Sri Rampai)

We look forward to seeing you at your new time! 🦷`;

        const result = await mocean.sendWhatsApp(to, message);
        return { success: result.success, error: result.error };
    } catch (error: any) {
        console.error('WhatsApp reschedule error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendWhatsAppCancelled(
    to: string,
    patientName: string,
    appointmentId: string,
    date: string
) {
    try {
        const message = `✕ *Appointment Cancelled*

Dear ${patientName},

This is to confirm that your appointment on *${date}* (ID: ${appointmentId}) has been *cancelled* as per your request.

If this was a mistake, or you'd like to book a new slot, please visit:
https://${process.env.VERCEL_URL || 'localhost:3000'}/booking

- Klinik Pergigian Setapak (Sri Rampai)`;

        const result = await mocean.sendWhatsApp(to, message);
        return { success: result.success, error: result.error };
    } catch (error: any) {
        console.error('WhatsApp cancel error:', error);
        return { success: false, error: error.message };
    }
}
