// Returns true if the username is non-empty, between 2–50 characters, and contains only letters, numbers, spaces, underscores, hyphens, or Thai characters.
export const validateUsername = (username: string): boolean => {
    if (!username || username.trim().length === 0) return false;
    if (username.length < 2 || username.length > 50) return false;
    const usernameRegex = /^[\w\s\-\u0E00-\u0E7F]+$/;
    return usernameRegex.test(username);
};

// Returns true if the string matches a basic email format.
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Returns true if the password is at least 8 characters and contains uppercase, lowercase, digit, and special character.
export const validatePassword = (password: string): boolean => {
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[^A-Za-z0-9]/.test(password)) return false;
    return true;
};

// Returns true if the phone number consists of exactly 10 digits.
export const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};
