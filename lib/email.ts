import { Resend } from 'resend';
import { generateGoogleCalendarLink } from './calendar-utils';

export async function sendAppointmentConfirmation(
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
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: `Klinik Pergigian Setapak (Sri Rampai) <${process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev'}>`,
            to: [to],
            reply_to: process.env.RESEND_REPLY_TO || undefined,
            subject: 'Appointment Confirmation - Klinik Pergigian Setapak (Sri Rampai)',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .appointment-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7; }
                        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                        .label { font-weight: bold; color: #6b7280; }
                        .value { color: #111827; font-weight: 600; }
                        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
                        .button { display: inline-block; background: #0284c7; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 50px; margin-top: 20px; font-weight: bold; }
                        .secondary-button { display: inline-block; background: #f3f4f6; color: #374151 !important; padding: 12px 30px; text-decoration: none; border-radius: 50px; margin-top: 20px; font-weight: bold; margin-left: 10px; }
                        .cal-button { display: inline-block; background: #fff; color: #0284c7 !important; padding: 12px 30px; text-decoration: none; border-radius: 50px; margin-top: 10px; border: 2px solid #0284c7; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✓ Appointment Confirmed</h1>
                            <p>Your visit to Klinik Pergigian Setapak (Sri Rampai) is scheduled.</p>
                        </div>
                        <div class="content">
                            <p>Dear <strong>${patientName}</strong>,</p>
                            <p>Your dental appointment has been confirmed. Please find the details below:</p>
                            
                            <div class="appointment-card">
                                <div class="detail-row">
                                    <span class="label">Appointment ID:</span>
                                    <span class="value">${appointmentId}</span>
                                </div>
                                ${patientIC ? `
                                <div class="detail-row">
                                    <span class="label">Patient IC:</span>
                                    <span class="value">${patientIC}</span>
                                </div>
                                ` : ''}
                                <div class="detail-row">
                                    <span class="label">Doctor:</span>
                                    <span class="value">${doctorName}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Date:</span>
                                    <span class="value">${appointmentDate}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="label">Time:</span>
                                    <span class="value">${timeSlot}</span>
                                </div>
                            </div>

                            <p><strong>Next Steps:</strong></p>
                            <ul>
                                <li>Please arrive 10 minutes session for registration.</li>
                                <li>Add this to your calendar using the link below to get a reminder.</li>
                            </ul>

                            <div style="text-align: center; padding-top: 10px;">
                                <a href="${calendarLink}" class="button">Add to Google Calendar</a>
                                <a href="https://${process.env.VERCEL_URL || 'localhost:3000'}/appointments/${appointmentId}/manage" class="secondary-button">Manage Appointment</a>
                            </div>

                            <div class="footer">
                                <p><strong>Klinik Pergigian Setapak (Sri Rampai)</strong></p>
                                <p>16-2, Jalan 46/26, Taman Sri Rampai, 53300 Kuala Lumpur</p>
                                <p>Phone: +60 17-510 1003 | Email: Kpsetapaksr@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error('Email sending error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error };
    }
}

export async function sendAppointmentReminder(
    to: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    timeSlot: string
) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { data, error } = await resend.emails.send({
            from: `Klinik Pergigian Setapak (Sri Rampai) <${process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev'}>`,
            to: [to],
            reply_to: process.env.RESEND_REPLY_TO || undefined,
            subject: 'Appointment Reminder - Tomorrow',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .reminder-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>⏰ Appointment Reminder</h1>
                        </div>
                        <div class="content">
                            <p>Dear <strong>${patientName}</strong>,</p>
                            <p>This is a friendly reminder about your upcoming dental appointment:</p>
                            
                            <div class="reminder-card">
                                <p><strong>Doctor:</strong> ${doctorName}</p>
                                <p><strong>Date:</strong> ${appointmentDate}</p>
                                <p><strong>Time:</strong> ${timeSlot}</p>
                            </div>

                            <p>We look forward to seeing you!</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error('Reminder email error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Reminder error:', error);
        return { success: false, error };
    }
}

export async function sendAppointmentRescheduled(
    to: string,
    patientName: string,
    doctorName: string,
    newDate: string,
    newTime: string,
    appointmentId: string
) {
    try {
        const calendarLink = generateGoogleCalendarLink(
            `Dental Appointment with ${doctorName}`,
            `Rescheduled dental consultation at Klinik Pergigian Setapak (Sri Rampai). ID: ${appointmentId}`,
            "Klinik Pergigian Setapak (Sri Rampai)",
            newDate,
            newTime
        );
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: `Klinik Pergigian Setapak (Sri Rampai) <${process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev'}>`,
            to: [to],
            reply_to: process.env.RESEND_REPLY_TO || undefined,
            subject: 'Appointment Rescheduled - Klinik Pergigian Setapak (Sri Rampai)',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background: #0284c7; color: white; padding: 30px; text-align: center;">
                        <h2 style="margin: 0;">📅 Appointment Rescheduled</h2>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <p>Dear <strong>${patientName}</strong>,</p>
                        <p>Your appointment has been successfully moved to a new time slot.</p>
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0284c7;">
                            <p style="margin: 5px 0;"><strong>New Date:</strong> ${newDate}</p>
                            <p style="margin: 5px 0;"><strong>New Time:</strong> ${newTime}</p>
                            <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctorName}</p>
                        </div>
                        <p>We've updated our records and look forward to seeing you then.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${calendarLink}" style="display: inline-block; background: #0284c7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Update Calendar</a>
                        </div>
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (e) {
        console.error("Reschedule email error:", e);
        return { success: false, error: e };
    }
}

export async function sendAppointmentCancelled(
    to: string,
    patientName: string,
    appointmentId: string,
    date: string
) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: `Klinik Pergigian Setapak (Sri Rampai) <${process.env.RESEND_EMAIL_FROM || 'onboarding@resend.dev'}>`,
            to: [to],
            reply_to: process.env.RESEND_REPLY_TO || undefined,
            subject: 'Appointment Cancelled - Klinik Pergigian Setapak (Sri Rampai)',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
                    <div style="background: #ef4444; color: white; padding: 30px; text-align: center;">
                        <h2 style="margin: 0;">✕ Appointment Cancelled</h2>
                    </div>
                    <div style="padding: 30px; background: #fff;">
                        <p>Dear <strong>${patientName}</strong>,</p>
                        <p>Your appointment on <strong>${date}</strong> (ID: ${appointmentId}) has been successfully cancelled as per your request.</p>
                        <p>The time slot has been released. If this was a mistake or you'd like to book a new appointment, please visit our booking page.</p>
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://${process.env.VERCEL_URL || 'localhost:3000'}/booking" style="display: inline-block; background: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">Book New Appointment</a>
                        </div>
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (e) {
        console.error("Cancel email error:", e);
        return { success: false, error: e };
    }
}
