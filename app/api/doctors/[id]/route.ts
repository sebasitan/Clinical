import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DoctorModel } from '@/lib/models';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const doctor = await DoctorModel.findOne({ id: params.id });
        if (!doctor) {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }
        return NextResponse.json(doctor);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const body = await request.json();
        const doctor = await DoctorModel.findOneAndUpdate(
            { id: params.id },
            { $set: body },
            { new: true }
        );
        if (!doctor) {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }
        return NextResponse.json(doctor);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const doctor = await DoctorModel.findOneAndDelete({ id: params.id });
        if (!doctor) {
            return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
