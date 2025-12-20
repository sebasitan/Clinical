import { NextResponse } from 'next/server';
import { sendSMSOTP } from '@/lib/sms';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
        }

        console.log(`[OTP API] Sending SMS OTP to ${phone} via Mocean...`);

        const result = await sendSMSOTP(phone);

        if (result.success) {
            console.log(`[OTP API] OTP sent successfully to ${phone}. SID: ${result.sid}`);
            return NextResponse.json({ success: true, verifyBackend: true });
        } else {
            console.error(`[OTP API] Failed to send SMS OTP to ${phone}:`, result.error);
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[OTP API] Critical error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
