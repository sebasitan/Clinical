import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json(
                { success: false, error: 'Phone number is required' },
                { status: 400 }
            );
        }

        const MOCEAN_BASE_URL = 'https://rest.moceanapi.com/rest/2';
        const apiKey = process.env.MOCEAN_API_KEY;
        const whatsappNumber = process.env.MOCEAN_WHATSAPP_NUMBER;

        console.log('[WhatsApp Debug] Configuration:');
        console.log('- API Key:', apiKey?.substring(0, 15) + '...');
        console.log('- WhatsApp Number:', whatsappNumber);
        console.log('- Target Phone:', phone);

        // Test 1: Check if credentials are configured
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'MOCEAN_API_KEY not configured',
                test: 'credentials'
            });
        }

        if (!whatsappNumber) {
            return NextResponse.json({
                success: false,
                error: 'MOCEAN_WHATSAPP_NUMBER not configured',
                test: 'credentials'
            });
        }

        // Test 2: Try to send WhatsApp message with detailed logging
        const isApiToken = apiKey.startsWith('apit-');

        const payload = {
            'mocean-to': phone,
            'mocean-from': whatsappNumber,
            'mocean-content': {
                type: 'text',
                text: 'Test message from Klinik Pergigian Setapak - Testing WhatsApp configuration'
            }
        };

        // Add API key to body if not using token auth
        if (!isApiToken) {
            payload['mocean-api-key'] = apiKey;
            payload['mocean-api-secret'] = process.env.MOCEAN_API_SECRET;
        }

        console.log('[WhatsApp Debug] Payload:', JSON.stringify(payload, null, 2));

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (isApiToken) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        console.log('[WhatsApp Debug] Headers:', headers);

        const res = await fetch(`${MOCEAN_BASE_URL}/send-message/whatsapp`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const responseText = await res.text();
        console.log('[WhatsApp Debug] Raw Response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return NextResponse.json({
                success: false,
                error: 'Invalid JSON response from MoceanAPI',
                rawResponse: responseText,
                statusCode: res.status
            });
        }

        console.log('[WhatsApp Debug] Parsed Response:', JSON.stringify(data, null, 2));

        // Return detailed response
        return NextResponse.json({
            success: !!(data && data.messages && data.messages[0]?.status === 0),
            moceanResponse: data,
            configuration: {
                apiKeyType: isApiToken ? 'API Token' : 'API Key',
                whatsappNumber: whatsappNumber,
                endpoint: `${MOCEAN_BASE_URL}/send-message/whatsapp`
            },
            interpretation: interpretResponse(data)
        });

    } catch (error: any) {
        console.error('[WhatsApp Debug] Error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}

function interpretResponse(data: any): string {
    if (!data) {
        return 'No response from MoceanAPI';
    }

    if (data.err_msg) {
        if (data.err_msg.includes('Invalid bot') || data.err_msg.includes('not active')) {
            return '🔴 WhatsApp bot is not activated in your MoceanAPI account. Please contact MoceanAPI support to activate WhatsApp Business API.';
        }
        if (data.err_msg.includes('Invalid credentials')) {
            return '🔴 API credentials are invalid. Check your MOCEAN_API_KEY.';
        }
        if (data.err_msg.includes('mocean-from')) {
            return '🔴 WhatsApp sender number (MOCEAN_WHATSAPP_NUMBER) is invalid or not registered.';
        }
        return `🔴 Error: ${data.err_msg}`;
    }

    if (data.messages && data.messages[0]) {
        const status = data.messages[0].status;
        if (status === 0) {
            return '✅ SUCCESS! WhatsApp message sent successfully.';
        } else {
            return `🔴 Message failed with status ${status}. Check MoceanAPI documentation for status codes.`;
        }
    }

    return '⚠️ Unexpected response format from MoceanAPI.';
}

export async function GET() {
    return NextResponse.json({
        message: 'WhatsApp Debug Endpoint',
        usage: 'POST with { "phone": "60123456789" }',
        purpose: 'Detailed debugging of WhatsApp configuration and MoceanAPI responses'
    });
}
