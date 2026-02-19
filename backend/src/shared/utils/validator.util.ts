export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isNonEmpty = (value: string | undefined | null): boolean => {
    return value !== undefined && value !== null && value.trim().length > 0;
};

export const isValidPassword = (password: string): boolean => {
    // Minimum 8 characters, at least one letter and one number
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};
