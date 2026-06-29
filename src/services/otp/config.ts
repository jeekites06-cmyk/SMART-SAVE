const env = (import.meta as any).env || {};

export const OTPConfig = {
  isDemoMode: env.VITE_OTP_DEMO_MODE !== "false", // Default to true
  defaultProvider: env.VITE_OTP_PROVIDER || "DEMO", // 'MSG91', 'TWILIO', 'DEMO'
  msg91: {
    authKey: env.VITE_MSG91_AUTH_KEY || "",
    senderId: env.VITE_MSG91_SENDER_ID || "",
    templateId: env.VITE_MSG91_TEMPLATE_ID || "",
  },
  twilio: {
    accountSid: env.VITE_TWILIO_ACCOUNT_SID || "",
    authToken: env.VITE_TWILIO_AUTH_TOKEN || "",
    serviceSid: env.VITE_TWILIO_SERVICE_SID || "",
  },
};
