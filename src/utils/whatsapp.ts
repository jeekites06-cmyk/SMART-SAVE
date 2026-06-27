import { Collection, CompanySettings } from "../types";
import { calculateCollectionBreakdown } from "./finance";

export function generateWhatsAppMessage(
  collection: Collection,
  settings: CompanySettings
): string {
  const isRegistration = collection.type === "Registration Fee";
  const breakdown = isRegistration
    ? null
    : calculateCollectionBreakdown(parseInt(collection.amount || "0", 10), collection.type);

  const dateStr = new Date(collection.timestamp).toLocaleString();

  let message = `*${settings.companyName || "SMART SAVE FINANCIAL SYSTEMS"}*\n`;
  message += `--------------------------------\n`;
  message += `*PAYMENT RECEIPT*\n`;
  message += `Receipt No: ${collection.receiptNo || collection.id}\n`;
  message += `Date: ${dateStr}\n\n`;
  
  message += `*Member Details*\n`;
  message += `Name: ${collection.memberName}\n`;
  message += `ID: ${collection.memberId}\n\n`;

  message += `*Payment Details*\n`;
  message += `Payment Type: ${collection.type}\n`;
  message += `*Total Amount: ₹${parseInt(collection.amount || "0", 10).toLocaleString()}*\n\n`;

  if (isRegistration) {
    message += `Registration Fee: ₹${parseInt(collection.amount || "0", 10).toLocaleString()}\n\n`;
  } else if (breakdown) {
    message += `*Breakdown*\n`;
    message += `Daily Deposit: ₹${parseInt(collection.amount || "0", 10).toLocaleString()}\n`;
    message += `Member Savings: ₹${breakdown.savingsFund}\n`;
    message += `Company Collection: ₹${breakdown.companyCommission}\n`;
    message += `Bonus Fund: ₹${breakdown.bonusFund}\n`;
    message += `Company Profit: ₹${breakdown.companyProfit}\n\n`;
  }

  message += `Thank you for your payment!\n`;
  message += `For queries, contact: ${settings.supportPhone || "+91 1800 123 4567"}\n`;

  return message;
}

export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
