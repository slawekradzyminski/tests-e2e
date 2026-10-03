
export interface UserEditDto {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface ForgotPasswordRequestDto {
  identifier: string;
}

export interface ForgotPasswordResponseDto {
  message: string;
  token: string | null;
}

export interface ResetPasswordRequestDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EmailEventDto {
  type: string;
  status: string;
  recipientMasked: string;
  createdAt: string;
  updatedAt: string;
  failureReason: string | null;
}
