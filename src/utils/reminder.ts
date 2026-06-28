import { Member, Collection } from "../types";

export interface MemberDueInfo {
  member: Member;
  totalActivePlans: number;
  totalDailyAmount: number;
  paidToday: boolean;
  paidYesterday: boolean;
  todayPaidAmount: number;
  yesterdayPaidAmount: number;
  dueDays: number;
  dueAmount: number;
  status: "Paid" | "Due Today" | "1 Day Due" | "2 Days Due" | "7+ Days Due" | string;
  lastPaymentDate: string;
  consecutiveUnpaidDays: number;
  fineAmount: number;
}

export function getMemberDueInfo(member: Member, collections: Collection[], todayDateStr?: string): MemberDueInfo {
  const todayStr = todayDateStr || new Date().toISOString().split("T")[0];
  
  // Calculate yesterday's date string
  const todayDateObj = new Date(todayStr);
  const yesterdayDateObj = new Date(todayDateObj);
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayStr = yesterdayDateObj.toISOString().split("T")[0];

  const plans = member.plans || [
    {
      id: `${member.id}-PLAN-1`,
      dailyAmount: parseInt(member.dailyAmount || "127", 10),
      status: member.status === "Active" ? "Active" : "Closed",
      startDate: member.joinDate
    }
  ];
  const activePlans = plans.filter(p => p.status === "Active");
  const totalActivePlans = activePlans.length;
  const totalDailyAmount = activePlans.reduce((sum, p) => sum + p.dailyAmount, 0) || parseInt(member.dailyAmount || "127", 10);

  // Collections of type Daily Deposit
  const memberDailyCols = collections.filter(c => c.memberId === member.id && c.type === "Daily Deposit");

  // Today's collections
  const todayCols = memberDailyCols.filter(c => c.timestamp.startsWith(todayStr));
  const todayPaidAmount = todayCols.reduce((sum, c) => sum + parseInt(c.amount || "0", 10), 0);
  const paidToday = todayPaidAmount >= totalDailyAmount && totalDailyAmount > 0;

  // Yesterday's collections
  const yesterdayCols = memberDailyCols.filter(c => c.timestamp.startsWith(yesterdayStr));
  const yesterdayPaidAmount = yesterdayCols.reduce((sum, c) => sum + parseInt(c.amount || "0", 10), 0);
  const paidYesterday = yesterdayPaidAmount >= totalDailyAmount && totalDailyAmount > 0;

  // Calculate days since join date
  const joinDate = new Date(member.joinDate);
  const today = new Date(todayStr);
  
  // Strip times for precise day difference calculation
  const d1 = new Date(joinDate.getFullYear(), joinDate.getMonth(), joinDate.getDate());
  const d2 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Expected pay days is inclusive of the joinDate
  const daysSinceJoin = Math.max(0, diffDays + 1);

  const expectedAmount = daysSinceJoin * totalDailyAmount;
  const totalPaidAmount = memberDailyCols.reduce((sum, c) => sum + parseInt(c.amount || "0", 10), 0);

  // Calculate consecutive unpaid days
  let consecutiveUnpaidDays = 0;
  if (memberDailyCols.length > 0) {
    const sorted = [...memberDailyCols].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastPaymentDateObj = new Date(sorted[0].timestamp);
    const lastPaymentMidnight = new Date(lastPaymentDateObj.getFullYear(), lastPaymentDateObj.getMonth(), lastPaymentDateObj.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTimeUnpaid = todayMidnight.getTime() - lastPaymentMidnight.getTime();
    consecutiveUnpaidDays = Math.max(0, Math.floor(diffTimeUnpaid / (1000 * 60 * 60 * 24)));
  } else {
    // Never paid daily deposit, count from joinDate
    const joinDateObj = new Date(member.joinDate);
    const joinMidnight = new Date(joinDateObj.getFullYear(), joinDateObj.getMonth(), joinDateObj.getDate());
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTimeUnpaid = todayMidnight.getTime() - joinMidnight.getTime();
    consecutiveUnpaidDays = Math.max(0, Math.floor(diffTimeUnpaid / (1000 * 60 * 60 * 24)));
  }

  // If unpaid for 30 consecutive days, apply one-time fine of ₹300
  const fineAmount = consecutiveUnpaidDays >= 30 ? 300 : 0;
  const baseDueAmount = Math.max(0, expectedAmount - totalPaidAmount);
  const dueAmount = baseDueAmount + fineAmount;
  const dueDays = Math.ceil(baseDueAmount / (totalDailyAmount || 127));

  // Determine specific status label based on business rules
  let status = "Paid";
  if (dueDays > 0 || fineAmount > 0) {
    if (consecutiveUnpaidDays >= 30) {
      status = "30+ Days Unpaid (Fined ₹300)";
    } else if (!paidToday && dueDays === 1) {
      status = "Due Today";
    } else if (dueDays === 1) {
      status = "1 Day Due";
    } else if (dueDays === 2) {
      status = "2 Days Due";
    } else if (dueDays >= 7) {
      status = "7+ Days Due";
    } else {
      status = `${dueDays} Days Due`;
    }
  }

  // Last payment date
  let lastPaymentDate = "N/A";
  if (memberDailyCols.length > 0) {
    const sorted = [...memberDailyCols].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    lastPaymentDate = new Date(sorted[0].timestamp).toLocaleDateString();
  }

  return {
    member,
    totalActivePlans,
    totalDailyAmount,
    paidToday,
    paidYesterday,
    todayPaidAmount,
    yesterdayPaidAmount,
    dueDays,
    dueAmount,
    status,
    lastPaymentDate,
    consecutiveUnpaidDays,
    fineAmount
  };
}
