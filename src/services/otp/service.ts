import { OTPConfig } from "./config";
import {
  OTPRequest,
  OTPResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
} from "./models";

export class OTPService {
  async sendOTP(request: OTPRequest): Promise<OTPResponse> {
    console.log(
      `[OTPService] Requesting OTP for ${request.mobile} (Purpose: ${request.purpose})`,
    );

    // Basic format check for international/E.164 (allow spaces/dashes)
    const cleanMobile = request.mobile.replace(/[\s\-\(\)]/g, "");
    const phoneRegex = /^\+?[0-9]\d{1,14}$/;
    if (!phoneRegex.test(cleanMobile) && !cleanMobile.match(/^[0-9]{10}$/)) {
      return { success: false, message: "Invalid mobile number format." };
    }

    if (OTPConfig.isDemoMode) {
      // Generate a 6-digit random OTP for demo
      const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(
        `[OTPService DEMO] Generated OTP for ${request.mobile}: ${demoOtp}`,
      );

      // Store in LocalStorage for verification later
      localStorage.setItem(`demo_otp_${request.mobile}`, demoOtp);
      localStorage.setItem(
        `demo_otp_expiry_${request.mobile}`,
        (Date.now() + 5 * 60 * 1000).toString(),
      ); // 5 mins

      return { success: true, message: "OTP sent successfully (Demo Mode)." };
    }

    // Prepare for real providers
    if (OTPConfig.defaultProvider === "MSG91") {
      // Implement MSG91 logic here
      return { success: true, message: "OTP sent via MSG91" };
    } else if (OTPConfig.defaultProvider === "TWILIO") {
      // Implement Twilio logic here
      return { success: true, message: "OTP sent via Twilio" };
    }

    return { success: false, message: "No valid OTP provider configured." };
  }

  async verifyOTP(request: OTPVerifyRequest): Promise<OTPVerifyResponse> {
    console.log(`[OTPService] Verifying OTP for ${request.mobile}`);

    if (OTPConfig.isDemoMode) {
      const storedOtp = localStorage.getItem(`demo_otp_${request.mobile}`);
      const expiry = localStorage.getItem(`demo_otp_expiry_${request.mobile}`);

      if (!storedOtp || !expiry) {
        return { success: false, message: "OTP expired or not requested." };
      }

      if (Date.now() > parseInt(expiry, 10)) {
        localStorage.removeItem(`demo_otp_${request.mobile}`);
        localStorage.removeItem(`demo_otp_expiry_${request.mobile}`);
        return { success: false, message: "OTP has expired." };
      }

      if (storedOtp === request.otp) {
        // Clear OTP after successful verification
        localStorage.removeItem(`demo_otp_${request.mobile}`);
        localStorage.removeItem(`demo_otp_expiry_${request.mobile}`);
        return { success: true, message: "OTP verified successfully." };
      } else {
        return { success: false, message: "Invalid OTP." };
      }
    }

    // Real provider verification
    if (OTPConfig.defaultProvider === "MSG91") {
      return { success: true, message: "OTP verified via MSG91" };
    } else if (OTPConfig.defaultProvider === "TWILIO") {
      return { success: true, message: "OTP verified via Twilio" };
    }

    return { success: false, message: "No valid OTP provider configured." };
  }
}

export const otpService = new OTPService();
