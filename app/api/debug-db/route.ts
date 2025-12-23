
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { PatientModel, ConsultationModel } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const pCount = await PatientModel.countDocuments();
        const cCount = await ConsultationModel.countDocuments();
        const uniqueICs = await ConsultationModel.distinct('patientIC');

        return NextResponse.json({
            patients: pCount,
            consultations: cCount,
            uniqueECsInConsultations: uniqueICs.length,
            confirmed: pCount === 0 && uniqueICs.length > 0
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
