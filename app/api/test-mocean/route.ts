import { NextResponse } from 'next/server';
import { mocean } from '@/lib/mocean';

export async function POST(request: Request) {
    try {
        const { type, phone, message } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            );
        }

        if (!type || !['sms', 'whatsapp'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Type must be "sms" or "whatsapp"' },
                { status: 400 }
            );
        }

        const testMessage = message || `Test message from Klinik Pergigian Setapak - ${new Date().toLocaleString()}`;

        let result;
        if (type === 'sms') {
            console.log('[Test] Sending SMS to:', phone);
            result = await mocean.sendSMS(phone, testMessage);
        } else {
            console.log('[Test] Sending WhatsApp to:', phone);
            result = await mocean.sendWhatsApp(phone, testMessage);
        }

        console.log('[Test] Result:', result);

        return NextResponse.json({
            success: result.success,
            type,
            phone,
            message: testMessage,
            result
        });

    } catch (error: any) {
        console.error('[Test Mocean] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'MoceanAPI Test Endpoint',
        usage: 'POST with { "type": "sms" or "whatsapp", "phone": "60123456789", "message": "optional custom message" }'
    });
}
