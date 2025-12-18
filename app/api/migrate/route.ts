import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import { DoctorModel, AppointmentModel, SettingsModel, AdminModel, SlotModel } from '@/lib/models';

export async function POST() {
    try {
        console.log('Starting database migration...');
        console.log('Connecting to MongoDB...');
        await dbConnect();
        console.log('Connected successfully!');

        // Drop all existing collections
        console.log('Dropping existing collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();

        for (const collection of collections) {
            await mongoose.connection.db.dropCollection(collection.name);
            console.log(`Dropped collection: ${collection.name}`);
        }

        // Recreate collections with demo data

        // 1. Create Admin
        await AdminModel.create({
            id: "admin-1",
            username: "admin",
            password: "admin123", // Note: In production, hash this!
            role: "super-admin",
            lastLogin: new Date()
        });

        // 2. Create Settings
        await SettingsModel.create({
            clinicName: "Klinik Pergigian Setapak",
            address: "Jalan Genting Klang, Setapak, 53300 Kuala Lumpur",
            phone: "+60 3-4142 1234",
            email: "ops@klinikpergigiansetapak.com",
            defaultSlotDuration: 30,
            workingHours: {
                start: "09:00",
                end: "18:00"
            },
            notifications: {
                sms: true,
                whatsapp: true,
                emailReminders: true
            }
        });

        // 3. Create Doctors
        const doctors = [
            {
                id: "d1",
                name: "Dr. Sarah Johnson",
                specialization: "Orthodontist",
                phone: "91234567",
                email: "sarah@clinic.com",
                isActive: true,
                isAvailable: true,
                slotDuration: 30,
                photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200"
            },
            {
                id: "d2",
                name: "Dr. Michael Chen",
                specialization: "Periodontist",
                phone: "98765432",
                email: "michael@clinic.com",
                isActive: true,
                isAvailable: true,
                slotDuration: 30,
                photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200"
            },
            {
                id: "d3",
                name: "Dr. Emily Williams",
                specialization: "Pediatric Dentist",
                phone: "92345678",
                email: "emily@clinic.com",
                isActive: true,
                isAvailable: true,
                slotDuration: 20,
                photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200"
            },
            {
                id: "d4",
                name: "Dr. David Lim",
                specialization: "Endodontist",
                phone: "93456789",
                email: "david@clinic.com",
                isActive: true,
                isAvailable: true,
                slotDuration: 30,
                photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200"
            },
            {
                id: "d5",
                name: "Dr. Jessica Tan",
                specialization: "Prosthodontist",
                phone: "94567890",
                email: "jessica@clinic.com",
                isActive: true,
                isAvailable: true,
                slotDuration: 30,
                photo: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200&h=200"
            },
            {
                id: "d6",
                name: "Dr. Ahmad Rizwan",
                specialization: "Oral Surgeon",
                phone: "95678901",
                email: "ahmad@clinic.com",
                isActive: true,
                isAvailable: true,
                slotDuration: 30,
                photo: "https://images.unsplash.com/photo-1612531388330-8045a44a24ac?auto=format&fit=crop&q=80&w=200&h=200"
            },
            {
                id: "d7",
                name: "Dr. Lisa Chong",
                specialization: "General Dentist",
                phone: "96789012",
                email: "lisa@clinic.com",
                isActive: true,
                isAvailable: true,
                slotDuration: 15,
                photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200&h=200"
            }
        ];

        await DoctorModel.insertMany(doctors);

        // 4. Generate Slots for next 30 days
        const slots = [];
        const today = new Date();
        const timeSlots = [
            "9:00 AM - 9:30 AM", "9:30 AM - 10:00 AM", "10:00 AM - 10:30 AM", "10:30 AM - 11:00 AM",
            "11:00 AM - 11:30 AM", "11:30 AM - 12:00 PM", "12:00 PM - 12:30 PM", "12:30 PM - 1:00 PM",
            "2:00 PM - 2:30 PM", "2:30 PM - 3:00 PM", "3:00 PM - 3:30 PM", "3:30 PM - 4:00 PM",
            "4:00 PM - 4:30 PM", "4:30 PM - 5:00 PM", "5:00 PM - 5:30 PM", "5:30 PM - 6:00 PM"
        ];

        const timeMapping: { [key: string]: { start: string; end: string } } = {
            "9:00 AM - 9:30 AM": { start: "09:00", end: "09:30" },
            "9:30 AM - 10:00 AM": { start: "09:30", end: "10:00" },
            "10:00 AM - 10:30 AM": { start: "10:00", end: "10:30" },
            "10:30 AM - 11:00 AM": { start: "10:30", end: "11:00" },
            "11:00 AM - 11:30 AM": { start: "11:00", end: "11:30" },
            "11:30 AM - 12:00 PM": { start: "11:30", end: "12:00" },
            "12:00 PM - 12:30 PM": { start: "12:00", end: "12:30" },
            "12:30 PM - 1:00 PM": { start: "12:30", end: "13:00" },
            "2:00 PM - 2:30 PM": { start: "14:00", end: "14:30" },
            "2:30 PM - 3:00 PM": { start: "14:30", end: "15:00" },
            "3:00 PM - 3:30 PM": { start: "15:00", end: "15:30" },
            "3:30 PM - 4:00 PM": { start: "15:30", end: "16:00" },
            "4:00 PM - 4:30 PM": { start: "16:00", end: "16:30" },
            "4:30 PM - 5:00 PM": { start: "16:30", end: "17:00" },
            "5:00 PM - 5:30 PM": { start: "17:00", end: "17:30" },
            "5:30 PM - 6:00 PM": { start: "17:30", end: "18:00" }
        };

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            for (const doctor of doctors) {
                for (const timeSlot of timeSlots) {
                    const times = timeMapping[timeSlot];
                    slots.push({
                        id: `slot-${doctor.id}-${dateStr}-${times.start}`,
                        doctorId: doctor.id,
                        date: dateStr,
                        timeRange: timeSlot,
                        startTime: times.start,
                        endTime: times.end,
                        status: 'available',
                        type: 'public'
                    });
                }
            }
        }

        await SlotModel.insertMany(slots);

        return NextResponse.json({
            success: true,
            message: "Database reset complete! Created fresh collections with demo data.",
            stats: {
                doctors: doctors.length,
                slots: slots.length,
                admins: 1,
                settings: 1
            }
        });

    } catch (error: any) {
        console.error("Migration error:", error);
        console.error("Error stack:", error.stack);
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown error occurred',
            details: error.stack,
            hint: 'Check if MONGODB_URI is correct and MongoDB Atlas allows connections from your IP'
        }, { status: 500 });
    }
}
