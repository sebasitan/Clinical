import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AppointmentModel } from '@/lib/models';

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const appointment = await AppointmentModel.findOne({ id: params.id });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        return NextResponse.json(appointment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
