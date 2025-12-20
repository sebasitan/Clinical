import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { LeaveModel } from '@/lib/models';
import { regenerateDoctorSlotsCloud } from '@/lib/slots-engine';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const leaves = await LeaveModel.find({ doctorId: params.id });
        return NextResponse.json(leaves);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await dbConnect();
        const body = await request.json();

        const newLeave = await LeaveModel.create({
            ...body,
            id: `LV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            doctorId: params.id
        });

        // Regenerate slots to apply leave
        await regenerateDoctorSlotsCloud(params.id);

        return NextResponse.json(newLeave, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
