import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { DoctorModel, SettingsModel, AdminModel, SlotModel } from '@/lib/models';

export async function GET() {
    await dbConnect();

    // 1. Seed Doctors if empty
    const doctorsCount = await DoctorModel.countDocuments();
    if (doctorsCount === 0) {
        const demoDoctors = [
            { id: "d1", name: "Dr. Sarah Johnson", specialization: "Orthodontist", phone: "91234567", email: "sarah@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d2", name: "Dr. Michael Chen", specialization: "Periodontist", phone: "98765432", email: "michael@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d3", name: "Dr. Emily Williams", specialization: "Pediatric Dentist", phone: "92345678", email: "emily@clinic.com", isActive: true, isAvailable: true, slotDuration: 20, photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d4", name: "Dr. David Lim", specialization: "Endodontist", phone: "93456789", email: "david@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d5", name: "Dr. Jessica Tan", specialization: "Prosthodontist", phone: "94567890", email: "jessica@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d6", name: "Dr. Ahmad Rizwan", specialization: "Oral Surgeon", phone: "95678901", email: "ahmad@clinic.com", isActive: true, isAvailable: true, slotDuration: 30, photo: "https://images.unsplash.com/photo-1612531388330-8045a44a24ac?auto=format&fit=crop&q=80&w=200&h=200" },
            { id: "d7", name: "Dr. Lisa Chong", specialization: "General Dentist", phone: "96789012", email: "lisa@clinic.com", isActive: true, isAvailable: true, slotDuration: 15, photo: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200&h=200" }
        ];
        await DoctorModel.insertMany(demoDoctors);
    }

    // 2. Seed Settings
    const settingsCount = await SettingsModel.countDocuments();
    if (settingsCount === 0) {
        await SettingsModel.create({
            clinicName: "Klinik Pergigian Setapak",
            address: "Setapak, Kuala Lumpur",
            workingHours: { start: "09:00", end: "18:00" }
        });
    }

    // 3. Seed Admin
    const adminCount = await AdminModel.countDocuments();
    if (adminCount === 0) {
        await AdminModel.create({
            id: "admin-1",
            username: "admin",
            password: "admin123", // Note: In production, hash this!
            role: "super-admin"
        });
    }

    // 4. Generate Slots for next 30 days (Basic Logic)
    // Detailed slot generation logic usually resides in a dedicated service
    // For now, we'll skip complex slot gen for the seed route

    return NextResponse.json({ message: "Database seeded successfully" });
}
