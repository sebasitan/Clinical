import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { ConsultationModel } from '@/lib/models';

// GET: Fetch a single consultation record by ID
export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const params = await props.params;
        const record = await ConsultationModel.findOne({ id: params.id });

        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json(record);
    } catch (error: any) {
        console.error('Error fetching consultation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Update a consultation record
export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const params = await props.params;
        const body = await request.json();

        const record = await ConsultationModel.findOneAndUpdate(
            { id: params.id },
            { $set: body },
            { new: true }
        );

        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json(record);
    } catch (error: any) {
        console.error('Error updating consultation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a consultation record
export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        await connectToDatabase();
        const params = await props.params;

        const result = await ConsultationModel.findOneAndDelete({ id: params.id });

        if (!result) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting consultation:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
