import React, { useState } from "react";
import { FileText, Download, Printer, Search, Filter, MessageCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Collection } from "../types";
import jsPDF from "jspdf";
import { calculateCollectionBreakdown } from "../utils/finance";
import { generateWhatsAppMessage, openWhatsApp } from "../utils/whatsapp";

export default function Receipts() {
  const { collections, settings, members } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const activeMemberIds = React.useMemo(() => new Set(members.map(m => m.id)), [members]);
  const validCollections = React.useMemo(() => collections.filter(c => activeMemberIds.has(c.memberId)), [collections, activeMemberIds]);

  const accessibleCollections = user?.role === "Member" 
    ? validCollections.filter(c => c.memberId === user.memberId)
    : validCollections;

  const filteredReceipts = accessibleCollections.filter((c) => {
    const matchesSearch =
      c.receiptNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.memberName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = dateFilter ? c.timestamp.startsWith(dateFilter) : true;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePDF = (receipt: Collection, action: "print" | "download") => {
    const doc = new jsPDF();
    
    // Custom Company Logo if available
    if (settings?.companyLogo) {
      try {
        doc.addImage(settings.companyLogo, "PNG", 20, 12, 20, 20);
      } catch (e) {
        // invalid image format ignored gracefully
      }
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102); // #003366
    doc.text(settings?.companyName || "SMART SAVE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings?.registrationNumber ? `Registration No: ${settings.registrationNumber}` : "Financial Systems", 105, 26, { align: "center" });
    doc.text(settings?.address || "123 Financial Hub, Business Park, Phase 1, City Center", 105, 32, { align: "center" });
    
    const contactLine = `${settings?.contactEmail || "support@smartsave.com"} | ${settings?.supportPhone || "+91 1800 123 4567"}${settings?.website ? ` | ${settings.website}` : ""}`;
    doc.text(contactLine, 105, 38, { align: "center" });
    
    if (settings?.gstNumber) {
      doc.text(`GSTIN: ${settings.gstNumber}`, 105, 44, { align: "center" });
    }
    
    // Divider
    doc.setDrawColor(200);
    doc.line(20, 47, 190, 47);

    // Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("PAYMENT RECEIPT", 105, 57, { align: "center" });

    // Receipt Details
    doc.setFontSize(11);
    doc.text(`Receipt No: ${receipt.receiptNo || receipt.id}`, 20, 72);
    doc.text(`Date: ${new Date(receipt.timestamp).toLocaleString()}`, 130, 72);
    
    doc.text(`Received From: ${receipt.memberName}`, 20, 87);
    doc.text(`Member ID: ${receipt.memberId}`, 130, 87);

    // Amount box
    doc.setFillColor(245, 247, 250);
    doc.rect(20, 102, 170, 55, "F");
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Payment Type:", 30, 114);
    doc.setTextColor(0);
    doc.text(receipt.type, 30, 122);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Total Amount:", 130, 114);
    doc.setFontSize(16);
    doc.setTextColor(0, 153, 51); // Greenish
    doc.text(`Rs ${parseInt(receipt.amount, 10).toLocaleString()}`, 130, 124);

    if (receipt.type === "Registration Fee") {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Registration Fee: Rs ${receipt.amount}`, 30, 137);
    } else {
      const breakdown = calculateCollectionBreakdown(parseInt(receipt.amount, 10), receipt.type);
      const savings = breakdown.savingsFund;
      const commission = breakdown.companyCommission;
      const bonus = breakdown.bonusFund;
      const profit = breakdown.companyProfit;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Savings Fund: Rs ${savings}`, 30, 137);
      doc.text(`Company Commission: Rs ${commission}`, 130, 137);
      doc.text(`Bonus Fund: Rs ${bonus}`, 30, 147);
      doc.text(`Company Profit: Rs ${profit}`, 130, 147);
    }

    // Footer Notes
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Notes: ${receipt.notes || "None"}`, 20, 175);
    
    // Draw Company Stamp if available
    if (settings?.companyStamp) {
      try {
        doc.addImage(settings.companyStamp, "PNG", 30, 185, 30, 30);
        doc.setFontSize(8);
        doc.text("Company Stamp", 35, 218);
      } catch (e) {
        // ignore invalid base64 image encoding
      }
    }

    // Draw Authorized Signature if available
    if (settings?.authorizedSignature) {
      try {
        doc.addImage(settings.authorizedSignature, "PNG", 140, 182, 35, 18);
      } catch (e) {
        // ignore invalid base64 image encoding
      }
    }
    
    doc.setFontSize(10);
    doc.setDrawColor(150);
    doc.line(130, 203, 180, 203);
    doc.text("Authorized Signature", 140, 209);

    // Receipt Custom Footer message
    if (settings?.receiptFooter) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(settings.receiptFooter, 105, 230, { align: "center" });
    }

    if (action === "download") {
      doc.save(`Receipt_${receipt.receiptNo || receipt.id}.pdf`);
    } else {
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Receipts</h1>
          <p className="text-slate-500 text-sm mt-1">
            View, print, and manage transaction receipts.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-200 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search receipts by ID, Member..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#003366]"
            />
            <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Receipt No.</th>
                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Member Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Type</th>
                <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReceipts.length > 0 ? (
                paginatedReceipts.map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-[#003366] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {receipt.receiptNo || receipt.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(receipt.timestamp).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                      {receipt.memberName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {receipt.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-800">
                      ₹{parseInt(receipt.amount, 10).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const member = members.find(m => m.id === receipt.memberId);
                            if (member && member.phone) {
                              const msg = generateWhatsAppMessage(receipt, settings);
                              openWhatsApp(member.phone, msg);
                            } else {
                              alert("Member phone number not found.");
                            }
                          }}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-transparent hover:border-emerald-200"
                          title="Send WhatsApp Receipt"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(receipt, "download")}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-200"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(receipt, "print")}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-slate-300"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    No receipts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {paginatedReceipts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-700">
              {Math.min(currentPage * itemsPerPage, filteredReceipts.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {filteredReceipts.length}
            </span>{" "}
            receipts
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-100 bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button className="px-3 py-1 border border-blue-600 bg-blue-50 rounded-md text-sm text-blue-700 font-medium">
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="px-3 py-1 border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-100 bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
