import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReminderSettingsModel, ReminderLogModel, AppointmentModel, DoctorModel } from '@/lib/models';
import { sendWhatsAppReminder } from '@/lib/whatsapp';
import { sendAppointmentReminder } from '@/lib/email';
import { sendSMSReminder } from '@/lib/sms';

// POST - Run the automated reminder check
export async function POST() {
    try {
        await dbConnect();

        // 1. Load reminder settings
        const settings = await ReminderSettingsModel.findOne({});

        if (!settings || !settings.enabled) {
            return NextResponse.json({
                success: false,
                message: 'Reminder automation is disabled'
            }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const processedDates = [];
        let totalReminders = 0;
        const errors: string[] = [];

        // 2. For each "dayBefore" setting, find and process appointments
        for (const daysBefore of settings.daysBefore) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysBefore);
            const targetDateStr = targetDate.toISOString().split('T')[0];

            // Find all confirmed/pending appointments on the target date
            const appointments = await AppointmentModel.find({
                appointmentDate: targetDateStr,
                status: { $in: ['confirmed', 'pending'] }
            });

            let whatsappCount = 0;
            let emailCount = 0;
            let smsCount = 0;

            // 3. Send reminders for each appointment
            for (const appointment of appointments) {
                try {
                    // Get doctor details
                    const doctor = await DoctorModel.findOne({ id: appointment.doctorId });
                    const doctorName = doctor ? doctor.name : 'Doctor';

                    // Send via enabled channels
                    if (settings.channels.whatsapp && appointment.patientPhone) {
                        const result = await sendWhatsAppReminder(
                            appointment.patientPhone,
                            appointment.patientName,
                            doctorName,
                            appointment.appointmentDate,
                            appointment.timeSlot
                        );
                        if (result.success) whatsappCount++;
                    }

                    if (settings.channels.email && appointment.patientEmail) {
                        const result = await sendAppointmentReminder(
                            appointment.patientEmail,
                            appointment.patientName,
                            doctorName,
                            appointment.appointmentDate,
                            appointment.timeSlot
                        );
                        if (result.success) emailCount++;
                    }

                    if (settings.channels.sms && appointment.patientPhone) {
                        const result = await sendSMSReminder(
                            appointment.patientPhone,
                            appointment.patientName,
                            doctorName,
                            appointment.appointmentDate,
                            appointment.timeSlot
                        );
                        if (result.success) smsCount++;
                    }

                } catch (err: any) {
                    console.error(`Error sending reminder for appointment ${appointment.id}:`, err);
                    errors.push(`Failed to send reminder for ${appointment.patientName}: ${err.message}`);
                }
            }

            processedDates.push({
                date: targetDateStr,
                daysBefore,
                appointmentsFound: appointments.length,
                remindersSent: {
                    whatsapp: whatsappCount,
                    email: emailCount,
                    sms: smsCount
                }
            });

            totalReminders += whatsappCount + emailCount + smsCount;
        }

        // 4. Log the automation run
        const logId = `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        await ReminderLogModel.create({
            id: logId,
            timestamp: new Date(),
            processedDates,
            totalReminders,
            status: errors.length > 0 ? 'partial' : 'success',
            errors
        });

        return NextResponse.json({
            success: true,
            processedDates,
            totalReminders,
            timestamp: new Date().toISOString(),
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error('Error running reminder automation:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
