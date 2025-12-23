import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AppointmentModel, SlotModel, DoctorModel } from '@/lib/models';
import { sendAppointmentConfirmation } from '@/lib/email';
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';
import { sendSMSConfirmation } from '@/lib/sms';

// GET all appointments (with optional filters)
export async function GET(request: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const date = searchParams.get('date');
        const patientIC = searchParams.get('patientIC');
        const patientPhone = searchParams.get('patientPhone');

        const query: any = {};
        if (doctorId) query.doctorId = doctorId;
        if (date) query.appointmentDate = date;
        if (patientIC) query.patientIC = patientIC;
        if (patientPhone) query.patientPhone = patientPhone;

        const appointments = await AppointmentModel.find(query).sort({ createdAt: -1 });
        return NextResponse.json(appointments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}

// POST new appointment
export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // 1. Verify Slot Availability (Concurrency Check)
        if (body.slotId) {
            const slot = await SlotModel.findOne({ id: body.slotId });
            if (slot && slot.status !== 'available') {
                return NextResponse.json({ error: 'Slot no longer available' }, { status: 409 });
            }
        }

        /* Commented out during setup/testing phase
        // 1.5 Monthly Booking Limit Check (One per patient per month)
        const patientIdentifier = body.patientIC || body.patientPhone;
        if (patientIdentifier && patientIdentifier !== 'NEW_PATIENT') {
            const appointmentMonth = body.appointmentDate.substring(0, 7); // "YYYY-MM"
            const existingInMonth = await AppointmentModel.findOne({
                $or: [
                    { patientIC: patientIdentifier },
                    { patientPhone: body.patientPhone }
                ],
                appointmentDate: { $regex: `^${appointmentMonth}` },
                status: { $ne: 'cancelled' }
            });

            if (existingInMonth) {
                return NextResponse.json({
                    error: `Policy Limit: Only one booking allowed per month. You already have an appointment on ${existingInMonth.appointmentDate}.`
                }, { status: 429 });
            }
        }
        */

        // 2. Handle Patient Record (Enforce Existing Only)
        const { PatientModel } = await import('@/lib/models');
        const patientIC = body.patientIC;

        if (!patientIC) {
            return NextResponse.json({ error: 'Patient IC is required' }, { status: 400 });
        }

        let patient = await PatientModel.findOne({ ic: patientIC });

        if (!patient) {
            return NextResponse.json({
                error: 'Registration Required: We could not find a patient record with this IC. Please contact Klinik Pergigian Setapak at +60 17-510 1003 to register before booking online.'
            }, { status: 404 });
        }

        // Update existing patient record with latest contact info from booking form
        patient.name = body.patientName;
        patient.phone = body.patientPhone;
        if (body.patientEmail) patient.email = body.patientEmail;
        patient.lastVisit = body.appointmentDate;
        await patient.save();

        // 3. Create Appointment
        const appointmentId = `APT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const newAppointment = await AppointmentModel.create({
            ...body,
            status: body.status || 'confirmed', // Auto-approve by default
            patientIC: patientIC, // Ensure generated IC is saved
            id: appointmentId
        });

        // 3. Update Slot Status to Booked
        if (body.slotId) {
            await SlotModel.findOneAndUpdate(
                { id: body.slotId },
                { status: 'booked', appointmentId: appointmentId }
            );
        }

        // 4. Send Notifications (Non-blocking)
        try {
            const doctor = await DoctorModel.findOne({ id: body.doctorId });
            const doctorName = doctor ? doctor.name : 'Doctor';

            console.log(`[API] Processing notifications for appointment ${appointmentId}`);

            // Send Email
            if (body.patientEmail) {
                console.log(`[Email] Attempting to send to: ${body.patientEmail}`);
                const emailResult = await sendAppointmentConfirmation(
                    body.patientEmail,
                    body.patientName,
                    doctorName,
                    body.appointmentDate,
                    body.timeSlot,
                    appointmentId,
                    patientIC
                );
                if (emailResult.success) {
                    console.log(`[Email] Successfully sent to ${body.patientEmail}. ID: ${emailResult.data?.id}`);
                } else {
                    console.error(`[Email] Failed to send to ${body.patientEmail}:`, emailResult.error);
                }
            }


            // Send WhatsApp
            if (body.patientPhone) {
                console.log(`[WhatsApp] Attempting to send to: ${body.patientPhone}`);
                const waResult = await sendWhatsAppConfirmation(
                    body.patientPhone,
                    body.patientName,
                    doctorName,
                    body.appointmentDate,
                    body.timeSlot,
                    appointmentId,
                    patientIC
                );
                if (waResult.success) {
                    console.log(`[WhatsApp] Successfully sent to ${body.patientPhone}. ID: ${waResult.messageId}`);
                } else {
                    console.error(`[WhatsApp] Failed to send to ${body.patientPhone}:`, waResult.error);
                }

                // Send SMS Confirmation
                console.log(`[SMS] Attempting confirmation for ${body.patientPhone}`);
                const smsResult = await sendSMSConfirmation(
                    body.patientPhone,
                    body.patientName,
                    doctorName,
                    body.appointmentDate,
                    body.timeSlot,
                    appointmentId
                );
                if (smsResult.success) {
                    console.log(`[SMS] Successfully sent. SID: ${smsResult.sid}`);
                }
            }
        } catch (notifErr) {
            console.error('[API] Critical notification logic error:', notifErr);
        }

        return NextResponse.json(newAppointment, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
    }
}
