import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { LeaveModel } from '@/lib/models';
import { regenerateDoctorSlotsCloud } from '@/lib/slots-engine';

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string, leaveId: string }> }
) {
    try {
        await dbConnect();
        const params = await props.params;
        const leave = await LeaveModel.findOneAndDelete({ id: params.leaveId });

        if (!leave) {
            return NextResponse.json({ error: 'Leave not found' }, { status: 404 });
        }

        // Regenerate slots to remove leave block
        await regenerateDoctorSlotsCloud(params.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
