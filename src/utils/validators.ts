export const validateUsername = (username: string): boolean => {
    if (!username || username.trim().length === 0) return false;
    if (username.length < 2 || username.length > 50) return false;
    // Allow letters, numbers, spaces, underscores, hyphens, and Thai characters
    const usernameRegex = /^[\w\s\-\u0E00-\u0E7F]+$/;
    return usernameRegex.test(username);
};

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
    return password.length >= 8;
};

export const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};