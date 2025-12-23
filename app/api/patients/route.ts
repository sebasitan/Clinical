import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PatientModel } from '@/lib/models';

export async function GET(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const ic = searchParams.get('ic');

        if (ic) {
            const patient = await PatientModel.findOne({ ic });
            return NextResponse.json(patient);
        }

        // --- NEW: Sync Logic ---
        try {
            const { ConsultationModel } = await import('@/lib/models');
            // Get all unique ICs from both collections
            const uniqueConsultationICs = await ConsultationModel.distinct('patientIC');
            const existingPatientICs = await PatientModel.distinct('ic');

            // Filter out nulls/falsy values from consultation ICs
            const validConsultationICs = uniqueConsultationICs.filter(Boolean);

            const missingICs = validConsultationICs.filter((ic: string) => !existingPatientICs.includes(ic));

            if (missingICs.length > 0) {
                console.log(`[Sync] Found ${missingICs.length} missing patients in Registry. Syncing...`);
                for (const mic of missingICs) {
                    try {
                        // Find any consultation record to get basic info
                        const latestConsultation = await ConsultationModel.findOne({ patientIC: mic }).sort({ consultationDate: -1, createdAt: -1 });
                        if (latestConsultation && latestConsultation.patientName) {
                            await PatientModel.create({
                                id: `PAT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
                                name: latestConsultation.patientName,
                                ic: mic,
                                phone: latestConsultation.handphoneNo || "N/A",
                                type: 'existing',
                                lastVisit: latestConsultation.consultationDate
                            });
                            console.log(`[Sync] Created patient profile for IC: ${mic}`);
                        }
                    } catch (loopErr) {
                        console.error(`[Sync] Failed to sync IC ${mic}:`, loopErr);
                    }
                }
            }
        } catch (syncErr) {
            console.error("[Sync] Critical error in patient synchronization:", syncErr);
        }
        // --- END Sync Logic ---

        const patients = await PatientModel.find({}).sort({ updatedAt: -1 });
        const res = NextResponse.json(patients);
        res.headers.set('x-patient-count', patients.length.toString());
        return res;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const data = await req.json();
        const { ic } = data;

        if (!ic) return NextResponse.json({ error: "IC is required" }, { status: 400 });

        let patient = await PatientModel.findOne({ ic });
        if (patient) {
            // Strip internal fields and update the document
            const { _id, id: _pid, __v, createdAt, updatedAt, ic: _ic, ...updateData } = data;
            Object.assign(patient, updateData);
            await patient.save();
        } else {
            patient = await PatientModel.create({
                ...data,
                id: data.id || `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
            });
        }
        return NextResponse.json(patient);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(req: Request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const ic = searchParams.get('ic');

        if (!ic) return NextResponse.json({ error: "IC is required" }, { status: 400 });

        const result = await PatientModel.findOneAndDelete({ ic });
        if (!result) {
            return NextResponse.json({ error: "Patient not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Patient deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
