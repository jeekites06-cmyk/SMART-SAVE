export interface OTPRequest {
  mobile: string;
  purpose: "LOGIN" | "FORGOT_PASSWORD" | "TRANSACTION";
}

export interface OTPResponse {
  success: boolean;
  message: string;
  referenceId?: string; // e.g., to verify later
}

export interface OTPVerifyRequest {
  mobile: string;
  otp: string;
  referenceId?: string;
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
}
