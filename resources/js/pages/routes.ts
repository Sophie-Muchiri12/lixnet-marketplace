// File: resources/js/routes.ts
// DO NOT create a routes/ folder - this single file should be in resources/js/

// Authentication routes
export const login = '/login';
export const register = '/register';
export const logout = '/logout';

// Password reset routes
export const password = {
    request: '/forgot-password',
    email: '/forgot-password',
    codeVerify: '/password-reset/verify-code',
    codeVerifyStore: '/password-reset/verify-code',
    resetForm: '/password-reset/new-password',
    update: '/password-reset/new-password',
};

// Email verification routes
export const verification = {
    notice: '/verify-email',
    verify: '/verify-email',
    resend: '/verify-email/resend',
};

// Dashboard routes
export const dashboard = '/dashboard';

// Marketplace routes
export const marketplace = '/';

// User routes
export const account = '/account';
export const profile = '/profile';
export const orders = '/orders';

// Agent routes
export const agentDashboard = '/agent/dashboard';