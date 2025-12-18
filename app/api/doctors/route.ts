import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DoctorModel } from '@/lib/models';

export async function GET() {
    try {
        await dbConnect();
        const doctors = await DoctorModel.find({});
        return NextResponse.json(doctors);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Ensure ID is present
        if (!body.id) {
            body.id = Math.random().toString(36).substring(2, 11);
        }

        const doctor = await DoctorModel.create(body);
        return NextResponse.json(doctor, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 });
    }
}
