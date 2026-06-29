import { CompanySettings, Collection, Member } from "../types";

export function getFinancialConstants() {
  return {
    dailyDeposit: 127,
    memberSavings: 102,
    companyCollection: 25,
    bonusFund: 0,
    companyProfit: 0,
  };
}

export function calculateCollectionBreakdown(amount: number, type: string) {
  const constants = getFinancialConstants();

  if (type === "Registration Fee") {
    const companyShare = constants.companyCollection; // 25
    const actualAmount = amount || 2500;
    return {
      savingsFund: actualAmount - companyShare,
      companyCommission: companyShare,
      bonusFund: 0,
      companyProfit: companyShare,
    };
  }

  // Exact formula specified by user to prevent any duplicate logic
  const units = amount / constants.dailyDeposit;

  const savings = units * constants.memberSavings;
  const companyCollection = units * constants.companyCollection;
  const bonus = savings * 0.6;
  const companyProfit = companyCollection;

  return {
    savingsFund: savings,
    companyCommission: companyCollection,
    bonusFund: bonus,
    companyProfit: companyProfit,
  };
}

export function calculateFinancialSummary(
  collections: Collection[],
  members: Member[] = [],
  settings?: CompanySettings,
) {
  let totalSavings = 0;
  let totalBonus = 0;
  let totalCompanyProfit = 0;
  let totalCompanyCommission = 0;
  let todayCollection = 0;
  let companyDailyProfit = 0;
  let todayTransactionsCount = 0;

  const today = new Date().toISOString().split("T")[0];

  // ONLY keep collections of existing members
  const activeMemberIds = new Set(members.map((m) => m.id));
  const validCollections =
    members.length > 0
      ? collections.filter((c) => activeMemberIds.has(c.memberId))
      : collections;

  validCollections.forEach((c) => {
    const amount = parseInt(c.amount || "0", 10);

    const breakdown = calculateCollectionBreakdown(amount, c.type);
    const savings = breakdown.savingsFund;
    const commission = breakdown.companyCommission;
    const bonus = breakdown.bonusFund;
    const profit = breakdown.companyProfit;

    if (c.type !== "Registration Fee") {
      totalSavings += savings;
      totalBonus += bonus;
      totalCompanyProfit += profit;
      totalCompanyCommission += commission;
    }

    if (c.timestamp.startsWith(today)) {
      if (c.type !== "Registration Fee") {
        todayCollection += amount;
        companyDailyProfit += profit;
      }
      todayTransactionsCount++;
    }
  });

  const regFee = parseInt(settings?.registrationFee || "2500", 10);
  const companyRegShare = getFinancialConstants().companyCollection;
  const memberRegSavings = regFee - companyRegShare;

  let registrationRevenue = 0;
  let todayRegistrationsCount = 0;
  let todayRegistrationRevenue = 0;

  if (members && members.length > 0) {
    // Total Registration Revenue = Total Members × Registration Fee
    registrationRevenue = members.length * regFee;

    // Today's Registrations must equal the number of members actually registered today.
    todayRegistrationsCount = members.filter(
      (m) => m.joinDate === today,
    ).length;
    // Today's Registration Revenue = Today's New Registrations × Registration Fee
    todayRegistrationRevenue = todayRegistrationsCount * regFee;

    totalCompanyCommission += members.length * companyRegShare;
    totalCompanyProfit += members.length * companyRegShare;
    totalSavings += members.length * memberRegSavings;
    companyDailyProfit += todayRegistrationsCount * companyRegShare;
  } else {
    // Fallback if members array is not passed (or empty)
    const regFeeCols = validCollections.filter(
      (c) => c.type === "Registration Fee",
    );
    registrationRevenue = regFeeCols.length * regFee;

    const todayRegFeeCols = regFeeCols.filter((c) =>
      c.timestamp.startsWith(today),
    );
    todayRegistrationsCount = todayRegFeeCols.length;
    todayRegistrationRevenue = todayRegistrationsCount * regFee;

    totalCompanyCommission += regFeeCols.length * companyRegShare;
    totalCompanyProfit += regFeeCols.length * companyRegShare;
    totalSavings += regFeeCols.length * memberRegSavings;
    companyDailyProfit += todayRegistrationsCount * companyRegShare;
  }

  return {
    totalSavings,
    totalBonus,
    totalCompanyProfit,
    totalCompanyCommission,
    registrationRevenue,
    todayRegistrationRevenue,
    todayRegistrationsCount,
    todayCollection,
    todayTransactionsCount,
    companyDailyProfit,
    totalCompanyRevenue: totalCompanyCommission,
  };
}
