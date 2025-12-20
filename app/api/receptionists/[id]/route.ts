import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { ReceptionistModel } from '@/lib/models';

export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const body = await request.json();

        console.log(`[PATCH Receptionist] Updating ID: ${params.id}`, body);

        const receptionist = await ReceptionistModel.findOneAndUpdate(
            { id: params.id },
            { $set: body },
            { new: true }
        );

        if (!receptionist) {
            console.error(`[PATCH Receptionist] Not found: ${params.id}`);
            return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 });
        }

        return NextResponse.json(receptionist);
    } catch (error: any) {
        console.error('[PATCH Receptionist] Error:', error);
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
        const result = await ReceptionistModel.findOneAndDelete({ id: params.id });

        if (!result) {
            return NextResponse.json({ error: 'Receptionist not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
