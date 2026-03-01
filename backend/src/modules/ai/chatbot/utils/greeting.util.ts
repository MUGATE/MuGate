export const getGreeting = (userName?: string): string => {
    // Lebanon Time (EET/EEST)
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Beirut',
        hour: 'numeric',
        hour12: false
    };

    // Format the current time to Lebanon time hour
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const hour = parseInt(formatter.format(new Date()), 10);

    let timeOfDay = "day";
    if (hour >= 5 && hour < 12) {
        timeOfDay = "morning";
    } else if (hour >= 12 && hour < 18) {
        timeOfDay = "afternoon";
    } else if (hour >= 18 || hour < 5) {
        timeOfDay = "evening";
    }

    const baseGreeting = `Good ${timeOfDay}`;

    if (userName) {
        return `${baseGreeting}, ${userName}! How can I assist you with your academic inquiries today?`;
    }

    return `${baseGreeting}! I am MuChat, your AI academic assistant. How can I help you?`;
};
