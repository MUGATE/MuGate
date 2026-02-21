/**
 * Credit hour utility functions for schedule optimization.
 */

export const calculateTotalCredits = (creditHours: number[]): number => {
    return creditHours.reduce((sum, credits) => sum + credits, 0);
};

export const isWithinCreditRange = (total: number, min: number, max: number): boolean => {
    return total >= min && total <= max;
};
