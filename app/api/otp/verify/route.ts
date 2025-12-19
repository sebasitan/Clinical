import { NextResponse } from 'next/server';
import { verifySMSOTP } from '@/lib/sms';

export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ error: 'Phone and Code are required' }, { status: 400 });
        }

        console.log(`[OTP Verify] Verifying code for ${phone}...`);

        const result = await verifySMSOTP(phone, code);

        if (result.success) {
            console.log(`[OTP Verify] Success for ${phone}`);
            return NextResponse.json({ success: true });
        } else {
            console.error(`[OTP Verify] Failed for ${phone}:`, result.status || 'Invalid code');
            return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[OTP Verify] Critical error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
