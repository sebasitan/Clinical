export function generateGoogleCalendarLink(
    title: string,
    description: string,
    location: string,
    startDateStr: string,
    timeSlotStr: string
): string {
    // Parse date and time
    // Expected format: startDateStr: "YYYY-MM-DD", timeSlotStr: "9:00 AM - 9:30 AM"
    try {
        const [startTimePart] = timeSlotStr.split(' - ');

        // Convert "9:00 AM" to 24h format for Date object
        const [time, modifier] = startTimePart.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        const start = new Date(`${startDateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
        const end = new Date(start.getTime() + 30 * 60000); // 30 mins duration

        const fmt = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const dates = `${fmt(start)}/${fmt(end)}`;

        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            details: description,
            location: location,
            dates: dates
        });

        return `https://www.google.com/calendar/render?${params.toString()}`;
    } catch (e) {
        console.error("Link generation failed", e);
        return "https://calendar.google.com";
    }
}
