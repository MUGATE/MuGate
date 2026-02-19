export const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
};

export const isExpired = (date: Date): boolean => {
    return new Date() > date;
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};
