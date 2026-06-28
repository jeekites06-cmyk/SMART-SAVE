import { jsPDF } from "jspdf";
import { Collection, CompanySettings } from "../types";
import { calculateCollectionBreakdown } from "./finance";

export function generateWhatsAppMessage(
  collection: Collection,
  settings: CompanySettings
): string {
  const isRegistration = collection.type === "Registration Fee";
  const breakdown = isRegistration
    ? { savingsFund: 0, companyCommission: 0 }
    : calculateCollectionBreakdown(parseInt(collection.amount || "0", 10), collection.type);

  const amountVal = parseInt(collection.amount || "0", 10);
  const savingsVal = breakdown ? breakdown.savingsFund : 0;
  const companyVal = breakdown ? breakdown.companyCommission : 0;

  // Auto-generate Receipt No and Transaction ID
  const rawReceiptNo = collection.receiptNo || "";
  const receiptNo = rawReceiptNo ? rawReceiptNo : `RCPT${String(collection.id || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padStart(6, "0")}`;
  const transactionId = `TXN${String(collection.id || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padStart(6, "0")}`;

  const timestamp = collection.timestamp ? new Date(collection.timestamp) : new Date();
  
  // Format Date & Time
  const paymentDate = timestamp.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const paymentTime = timestamp.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const supportPhone = settings.supportPhone || "+91 1800 123 4567";
  const contactEmail = settings.contactEmail || "support@smartsave.com";
  const website = settings.website || "www.smartsave.com";

  let msg = `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `✨ 🏦 *SMART SAVE* 🏦 ✨\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  msg += `🎉 *PAYMENT SUCCESSFUL* 🎉\n\n`;
  
  msg += `📄 *RECEIPT DETAILS*\n`;
  msg += `🔹 *Receipt No:* ${receiptNo}\n`;
  msg += `🔹 *Transaction ID:* ${transactionId}\n`;
  msg += `🔹 *Date:* ${paymentDate}\n`;
  msg += `🔹 *Time:* ${paymentTime}\n\n`;
  
  msg += `👤 *MEMBER DETAILS*\n`;
  msg += `🔸 *Member ID:* ${collection.memberId}\n`;
  msg += `🔸 *Member Name:* ${collection.memberName}\n\n`;
  
  msg += `💰 *PAYMENT BREAKDOWN*\n`;
  msg += `💳 *Payment Type:* ${collection.type}\n`;
  msg += `💵 *Amount Paid:* ₹${amountVal.toLocaleString("en-IN")}\n`;
  msg += `🛡️ *Savings Amount:* ₹${savingsVal.toLocaleString("en-IN")}\n`;
  msg += `🏢 *Company Collection:* ₹${companyVal.toLocaleString("en-IN")}\n\n`;
  
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💖 *Thank you for choosing SMART SAVE!*\n\n`;
  
  msg += `📞 *Contact:* ${supportPhone}\n`;
  msg += `📧 *Email:* ${contactEmail}\n`;
  msg += `🌐 *Website:* ${website}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━`;
  
  return msg;
}

export function downloadReceiptPDF(
  collection: Collection,
  settings: CompanySettings,
  action: "download" | "print" = "download"
) {
  const doc = new jsPDF();
  
  const isRegistration = collection.type === "Registration Fee";
  const breakdown = isRegistration
    ? { savingsFund: 0, companyCommission: 0 }
    : calculateCollectionBreakdown(parseInt(collection.amount || "0", 10), collection.type);

  const amountVal = parseInt(collection.amount || "0", 10);
  const savingsVal = breakdown ? breakdown.savingsFund : 0;
  const companyVal = breakdown ? breakdown.companyCommission : 0;

  // Auto-generate Receipt No and Transaction ID
  const rawReceiptNo = collection.receiptNo || "";
  const receiptNo = rawReceiptNo ? rawReceiptNo : `RCPT${String(collection.id || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padStart(6, "0")}`;
  const transactionId = `TXN${String(collection.id || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padStart(6, "0")}`;

  const timestamp = collection.timestamp ? new Date(collection.timestamp) : new Date();
  
  // Format Date & Time
  const paymentDate = timestamp.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const paymentTime = timestamp.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const supportPhone = settings.supportPhone || "+91 1800 123 4567";
  const contactEmail = settings.contactEmail || "support@smartsave.com";
  const website = settings.website || "www.smartsave.com";

  // DRAW VISUAL LOGO
  // 1. A nice brand icon: dark blue badge
  doc.setFillColor(0, 51, 102);
  doc.roundedRect(14, 15, 12, 12, 2, 2, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SS", 20, 23, { align: "center" });

  // 2. Company Name: SMART SAVE
  doc.setTextColor(0, 51, 102);
  doc.setFontSize(16);
  doc.setFont("Helvetica", "bold");
  doc.text("SMART SAVE", 30, 24);

  // 3. Payment Successful Heading
  doc.setFillColor(230, 242, 230); // light green
  doc.roundedRect(138, 15, 58, 12, 2, 2, "F");
  doc.setTextColor(0, 102, 51); // success green
  doc.setFontSize(9.5);
  doc.setFont("Helvetica", "bold");
  doc.text("PAYMENT SUCCESSFUL", 167, 22.5, { align: "center" });

  // Divider
  doc.setDrawColor(220, 225, 230);
  doc.line(14, 32, 196, 32);

  // SECTION: RECEIPT DETAILS
  doc.setFontSize(8.5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(110, 120, 130);
  doc.text("RECEIPT NUMBER", 14, 40);
  doc.text("TRANSACTION ID", 70, 40);
  doc.text("PAYMENT DATE", 130, 40);
  doc.text("PAYMENT TIME", 170, 40);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 50);
  doc.text(receiptNo, 14, 46);
  doc.text(transactionId, 70, 46);
  doc.text(paymentDate, 130, 46);
  doc.text(paymentTime, 170, 46);

  // Divider
  doc.setDrawColor(220, 225, 230);
  doc.line(14, 52, 196, 52);

  // SECTION: MEMBER DETAILS
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text("MEMBER DETAILS", 14, 60);

  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(110, 120, 130);
  doc.text("Member ID:", 14, 68);
  doc.text("Member Name:", 14, 75);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(30, 40, 50);
  doc.text(collection.memberId, 45, 68);
  doc.text(collection.memberName, 45, 75);

  // Divider
  doc.setDrawColor(220, 225, 230);
  doc.line(14, 82, 196, 82);

  // SECTION: PAYMENT BREAKDOWN
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 51, 102);
  doc.text("PAYMENT BREAKDOWN", 14, 90);

  // Table headers background
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 95, 182, 8, "F");

  doc.setFontSize(9);
  doc.setTextColor(110, 120, 130);
  doc.setFont("Helvetica", "bold");
  doc.text("ITEM / DESCRIPTION", 18, 100);
  doc.text("AMOUNT (INR)", 190, 100, { align: "right" });

  // Rows
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 40, 50);
  
  // Row 1: Payment Type
  doc.text(collection.type, 18, 110);
  doc.text(`Rs ${amountVal.toLocaleString("en-IN")}`, 190, 110, { align: "right" });

  // Row 2: Savings Amount
  doc.text("Savings Amount", 18, 118);
  doc.text(`Rs ${savingsVal.toLocaleString("en-IN")}`, 190, 118, { align: "right" });

  // Row 3: Company Collection
  doc.text("Company Collection", 18, 126);
  doc.text(`Rs ${companyVal.toLocaleString("en-IN")}`, 190, 126, { align: "right" });

  // Divider line before total
  doc.setDrawColor(230, 235, 240);
  doc.line(14, 130, 196, 130);

  // Highlight Box for Total Amount Paid
  doc.setFillColor(240, 244, 250);
  doc.rect(14, 133, 182, 10, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(0, 51, 102);
  doc.text("TOTAL AMOUNT PAID", 18, 139);
  
  doc.setFontSize(11);
  doc.setTextColor(0, 102, 51); // green
  doc.text(`Rs ${amountVal.toLocaleString("en-IN")}`, 190, 139, { align: "right" });

  // Divider
  doc.setDrawColor(220, 225, 230);
  doc.line(14, 149, 196, 149);

  // Thank You Message
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0, 51, 102);
  doc.text("Thank you for choosing SMART SAVE!", 105, 156, { align: "center" });

  // CONTACT DETAILS
  doc.setFillColor(250, 251, 252);
  doc.roundedRect(14, 162, 182, 22, 2, 2, "F");

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 120, 130);
  doc.text("For any support or queries, please reach out to our team:", 20, 168);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(30, 40, 50);
  doc.text(`Phone: ${supportPhone}`, 20, 178);
  doc.text(`Email: ${contactEmail}`, 85, 178);
  doc.text(`Website: ${website}`, 150, 178);

  let finalY = 190;
   
  // Stamp & Signature lines (preserve custom business upload logic)
  if (settings?.companyStamp || settings?.authorizedSignature) {
    if (settings?.companyStamp) {
      try {
        doc.addImage(settings.companyStamp, "PNG", 30, finalY, 25, 25);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text("Company Seal", 42, finalY + 28, { align: "center" });
      } catch (e) {
        // ignore
      }
    }
    if (settings?.authorizedSignature) {
      try {
        doc.addImage(settings.authorizedSignature, "PNG", 140, finalY, 30, 15);
      } catch (e) {
        // ignore
      }
    }
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100);
    doc.setDrawColor(200);
    doc.line(135, finalY + 18, 185, finalY + 18);
    doc.text("Authorized Signature", 160, finalY + 22, { align: "center" });
    
    finalY += 35;
  } else {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100);
    doc.setDrawColor(200);
    doc.line(135, finalY + 18, 185, finalY + 18);
    doc.text("Authorized Signature", 160, finalY + 22, { align: "center" });
    
    finalY += 28;
  }

  // Receipt custom footer
  if (settings?.receiptFooter) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(settings.receiptFooter, 105, finalY, { align: "center" });
  }

  if (action === "download") {
    doc.save(`Receipt_${receiptNo}.pdf`);
  } else {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  }
}

export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
