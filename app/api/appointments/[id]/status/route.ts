import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AppointmentModel, SlotModel } from '@/lib/models';

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const { status } = await request.json();

        // Find appointment first to get slotId
        const appointment = await AppointmentModel.findOne({ id: params.id });
        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Update status
        appointment.status = status;
        await appointment.save();

        // If cancelled or no-show, free up the slot
        if ((status === "cancelled" || status === "no-show") && appointment.slotId) {
            await SlotModel.findOneAndUpdate(
                { id: appointment.slotId },
                { status: 'available', appointmentId: null }
            );

            // Send Cancellation Notifications
            if (status === "cancelled") {
                try {
                    // Send Email
                    if (appointment.patientEmail) {
                        const { sendAppointmentCancelled } = await import('@/lib/email');
                        await sendAppointmentCancelled(
                            appointment.patientEmail,
                            appointment.patientName,
                            params.id,
                            appointment.appointmentDate
                        );
                    }

                    // Send WhatsApp
                    const { sendWhatsAppCancelled } = await import('@/lib/whatsapp');
                    await sendWhatsAppCancelled(
                        appointment.patientPhone,
                        appointment.patientName,
                        params.id,
                        appointment.appointmentDate
                    );

                    // Send SMS
                    const { sendSMSCancelled } = await import('@/lib/sms');
                    await sendSMSCancelled(
                        appointment.patientPhone,
                        params.id,
                        appointment.appointmentDate
                    );
                } catch (notifError) {
                    console.error('[Cancel Notif] Failed to send notifications:', notifError);
                }
            }
        }

        return NextResponse.json(appointment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
