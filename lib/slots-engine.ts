import dbConnect from './db';
import { SlotModel, DoctorModel, ScheduleModel, LeaveModel, DoctorDateSchedule } from './models';
import type { DayOfWeek } from './types';

const formatTime = (time24: string) => {
    const [h, m] = time24.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
};

const isOverlapping = (s1: string, e1: string, s2: string, e2: string) => {
    return s1 < e2 && s2 < e1;
};

export async function regenerateDoctorSlotsCloud(doctorId: string) {
    await dbConnect();

    // 1. Get Doctor info
    const doctor = await DoctorModel.findOne({ id: doctorId });
    if (!doctor) throw new Error('Doctor not found');

    // 2. Get Weekly Schedule
    const schedule = await ScheduleModel.findOne({ doctorId });

    // 3. Get Leaves
    const leaves = await LeaveModel.find({ doctorId });

    // 4. Get Date-Specific Overrides
    const dateSchedule = await DoctorDateSchedule.findOne({ doctorId });

    // 5. Determine Date Range (Next 60 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 6. Delete only available slots for this doctor
    await SlotModel.deleteMany({
        doctorId,
        status: 'available'
    });

    // 7. Fetch all remaining slots (booked/blocked) to avoid overlaps
    const existingSlots = await SlotModel.find({ doctorId });

    const newSlots = [];

    for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }) as DayOfWeek;

        // Use date-specific override if it exists, otherwise use weekly schedule
        const schedules = dateSchedule?.schedules;
        const dateOverride = (schedules instanceof Map) ? schedules.get(dateStr) : (schedules ? (schedules as any)[dateStr] : undefined);
        const baseRanges = dateOverride || schedule?.days?.[dayName] || [];
        const dayRanges = [...baseRanges].sort((a, b) => a.start.localeCompare(b.start));

        if (dayRanges.length > 0 && doctor.isActive && doctor.isAvailable) {
            // Check if on leave
            const dayLeave = leaves.find(l => l.date === dateStr);

            for (const range of dayRanges) {
                const startTimeParts = range.start.split(':').map(Number);
                const endTimeParts = range.end.split(':').map(Number);

                let current = startTimeParts[0] * 60 + startTimeParts[1];
                const end = endTimeParts[0] * 60 + endTimeParts[1];

                while (current + doctor.slotDuration <= end) {
                    const sH = Math.floor(current / 60);
                    const sM = current % 60;
                    const eH = Math.floor((current + doctor.slotDuration) / 60);
                    const eM = (current + doctor.slotDuration) % 60;

                    const startTimeStr = `${sH.toString().padStart(2, '0')}:${sM.toString().padStart(2, '0')}`;
                    const endTimeStr = `${eH.toString().padStart(2, '0')}:${eM.toString().padStart(2, '0')}`;
                    const timeRange = `${formatTime(startTimeStr)} - ${formatTime(endTimeStr)}`;

                    // Check if this time slot overlaps with ANY existing slot (booked/blocked)
                    const hasConflict = existingSlots.some(s =>
                        s.date === dateStr && isOverlapping(startTimeStr, endTimeStr, s.startTime, s.endTime)
                    );

                    // Check if this time slot is already being added in this run (duplicate prevention)
                    const isQueued = newSlots.some(s => s.date === dateStr && s.startTime === startTimeStr);

                    if (!hasConflict && !isQueued) {
                        let status = 'available';
                        let blockReason = '';

                        if (dayLeave) {
                            if (dayLeave.type === 'full') {
                                status = 'blocked';
                                blockReason = dayLeave.reason || 'Doctor on leave';
                            } else if (dayLeave.startTime && dayLeave.endTime) {
                                if (isOverlapping(startTimeStr, endTimeStr, dayLeave.startTime, dayLeave.endTime)) {
                                    status = 'blocked';
                                    blockReason = dayLeave.reason || 'Doctor unavailable';
                                }
                            }
                        }

                        newSlots.push({
                            id: `SLOT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                            doctorId,
                            date: dateStr,
                            timeRange,
                            startTime: startTimeStr,
                            endTime: endTimeStr,
                            status,
                            type: 'public',
                            blockReason
                        });
                    }

                    current += doctor.slotDuration;
                }
            }
        }
    }

    if (newSlots.length > 0) {
        await SlotModel.insertMany(newSlots);
    }

    return { count: newSlots.length };
}
