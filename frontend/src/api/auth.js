import client from './client'
export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  logout: () => client.post('/auth/logout'),
  refresh: () => client.post('/auth/refresh'),
  verifyEmail: (token) => client.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email) => client.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (data) => client.post('/auth/reset-password', data),
}
