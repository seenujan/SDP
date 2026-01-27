export const validatePassword = (password: string): void => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        throw new Error(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        throw new Error('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        throw new Error('Password must contain at least one special character');
    }
};
