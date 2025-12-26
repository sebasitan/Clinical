// Simple Node.js script to test MoceanAPI configuration
// Run with: node test-mocean-config.js

const fs = require('fs');
const path = require('path');

// Read .env.local file
try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');

    envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
} catch (error) {
    console.error('⚠️  Warning: Could not read .env.local file');
}

console.log('='.repeat(60));
console.log('MoceanAPI Configuration Check');
console.log('='.repeat(60));

const apiKey = process.env.MOCEAN_API_KEY;
const apiSecret = process.env.MOCEAN_API_SECRET;
const senderId = process.env.MOCEAN_SENDER_ID;
const whatsappNumber = process.env.MOCEAN_WHATSAPP_NUMBER;

console.log('\n📋 Environment Variables:');
console.log('-'.repeat(60));

if (apiKey) {
    const isApiToken = apiKey.startsWith('apit-');
    console.log(`✅ MOCEAN_API_KEY: ${apiKey.substring(0, 15)}... (${isApiToken ? 'API Token' : 'API Key'})`);
} else {
    console.log('❌ MOCEAN_API_KEY: NOT SET');
}

if (apiSecret) {
    console.log(`✅ MOCEAN_API_SECRET: ${apiSecret.substring(0, 10)}...`);
} else {
    if (apiKey && apiKey.startsWith('apit-')) {
        console.log('ℹ️  MOCEAN_API_SECRET: Not required (using API Token)');
    } else {
        console.log('❌ MOCEAN_API_SECRET: NOT SET (required for API Key auth)');
    }
}

if (senderId) {
    console.log(`✅ MOCEAN_SENDER_ID: ${senderId}`);
} else {
    console.log('⚠️  MOCEAN_SENDER_ID: Not set (will use default "KPS Dental")');
}

if (whatsappNumber) {
    console.log(`✅ MOCEAN_WHATSAPP_NUMBER: ${whatsappNumber}`);
} else {
    console.log('⚠️  MOCEAN_WHATSAPP_NUMBER: Not set (will use default)');
}

console.log('\n' + '='.repeat(60));

// Check if configuration is valid
let isValid = true;
let issues = [];

if (!apiKey) {
    isValid = false;
    issues.push('MOCEAN_API_KEY is missing');
}

if (apiKey && !apiKey.startsWith('apit-') && !apiSecret) {
    isValid = false;
    issues.push('MOCEAN_API_SECRET is required when using API Key (not API Token)');
}

if (isValid) {
    console.log('\n✅ Configuration is valid! Ready to send messages.');
    console.log('\n🧪 To test, visit: http://localhost:3000/test-mocean.html');
} else {
    console.log('\n❌ Configuration issues found:');
    issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
    });
}

console.log('\n' + '='.repeat(60));
