import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AppointmentModel } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();

        // Since we don't have a separate PatientModel yet in models.ts (checked outline earlier)
        // We extract unique patients from AppointmentModel or check if PatientModel exists

        // Let's check models.ts first
        const appointments = await AppointmentModel.find({});

        const patientsMap = new Map();
        appointments.forEach(apt => {
            if (!patientsMap.has(apt.patientIC)) {
                patientsMap.set(apt.patientIC, {
                    id: apt.patientIC, // Use IC as ID for now or generate one
                    name: apt.patientName,
                    ic: apt.patientIC,
                    phone: apt.patientPhone,
                    email: apt.patientEmail,
                    type: apt.patientType || 'existing',
                    lastVisit: apt.appointmentDate
                });
            } else {
                // Update last visit if this one is newer
                const existing = patientsMap.get(apt.patientIC);
                if (new Date(apt.appointmentDate) > new Date(existing.lastVisit)) {
                    existing.lastVisit = apt.appointmentDate;
                }
            }
        });

        return NextResponse.json(Array.from(patientsMap.values()));
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
