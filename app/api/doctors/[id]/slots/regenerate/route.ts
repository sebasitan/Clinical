import { NextResponse } from 'next/server';
import { regenerateDoctorSlotsCloud } from '@/lib/slots-engine';

export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const result = await regenerateDoctorSlotsCloud(params.id);
        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
