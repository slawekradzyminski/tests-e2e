
export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  token: string | null;
  refreshToken: string | null;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  mfaRequired: boolean;
  challengeToken: string | null;
  challengeExpiresAt: string | null;
}

export interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface UserRegisterDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
