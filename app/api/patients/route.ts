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

        const patients = await PatientModel.find({}).sort({ updatedAt: -1 });
        return NextResponse.json(patients);
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
