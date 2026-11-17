import { API_ENDPOINTS } from '../config/api.config'
import { apiRequest, type ApiResponse } from '../lib/api.client'
import type { User } from '../data/types'

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
  reactivate?: boolean
}

/**
 * Registration data
 */
export interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
}

export interface CodeTiming {
  expires_in_seconds: number
  resend_after_seconds: number
}

export interface RegisterResponse extends CodeTiming {
  email: string
  verification_email_sent: boolean
}

export interface VerifyEmailResponse {
  email_verified: boolean
  welcome_email_sent: boolean
  user: User
  tokens: {
    access_token: string
    refresh_token: string
  }
}

export interface PasswordResetData {
  email: string
  code: string
  password: string
  password_confirmation: string
}

/**
 * Login response
 */
export interface LoginResponse {
  requires_2fa: boolean
  token?: string
  user?: User
}

/**
 * 2FA verification data
 */
export interface Verify2FAData {
  code: string
  email: string
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return apiRequest<LoginResponse>({
      method: 'POST',
      url: API_ENDPOINTS.LOGIN,
      data: credentials,
    })
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<ApiResponse<RegisterResponse>> {
    return apiRequest<RegisterResponse>({
      method: 'POST',
      url: API_ENDPOINTS.REGISTER,
      data,
    })
  },

  async resendEmailVerification(email: string): Promise<ApiResponse<{ requested: boolean } & CodeTiming>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.RESEND_EMAIL_VERIFICATION,
      data: { email },
    })
  },

  async verifyEmail(email: string, code: string): Promise<ApiResponse<VerifyEmailResponse>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.VERIFY_EMAIL,
      data: { email, code },
    })
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<{ requested: boolean } & CodeTiming>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.REQUEST_PASSWORD_RESET,
      data: { email },
    })
  },

  async verifyPasswordResetCode(email: string, code: string): Promise<ApiResponse<{ code_valid: boolean }>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.VERIFY_PASSWORD_RESET_CODE,
      data: { email, code },
    })
  },

  async resetPassword(data: PasswordResetData): Promise<ApiResponse<{ password_reset: boolean }>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.RESET_PASSWORD,
      data,
    })
  },

  async googleSignIn(idToken: string, intent: 'sign_in' | 'sign_up' | 'reactivate'): Promise<ApiResponse<{
    user: User
    tokens: { access_token: string; refresh_token: string }
  }>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.GOOGLE_SIGN_IN,
      data: { id_token: idToken, intent },
    })
  },

  /**
   * Verify 2FA code
   */
  async verify2FA(data: Verify2FAData): Promise<ApiResponse<{ token: string; user: User }>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.VERIFY_2FA,
      data,
    })
  },

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.LOGOUT,
      data: { refresh_token: localStorage.getItem('refresh_token') },
    })
  },

  /**
   * Get current user
   */
  async me(): Promise<ApiResponse<User>> {
    return apiRequest<User>({
      method: 'GET',
      url: API_ENDPOINTS.ME,
    })
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiRequest({
      method: 'POST',
      url: API_ENDPOINTS.REFRESH_TOKEN,
    })
  },

}
