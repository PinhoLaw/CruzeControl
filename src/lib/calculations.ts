import { NewUsed } from "@/types/enums";
import type { DealRow } from "@/types/database";

/** fi_total = reserve + warranty + aft1 + gap */
export function calcFiTotal(
  reserve: number,
  warranty: number,
  aft1: number,
  gap: number
): number {
  return reserve + warranty + aft1 + gap;
}

/** total_gross = front_gross + fi_total */
export function calcTotalGross(frontGross: number, fiTotal: number): number {
  return frontGross + fiTotal;
}

/**
 * Returns the appropriate pack amount.
 * If packCompany > 0, it overrides both packNew/packUsed as a uniform pack.
 * Otherwise falls back to per-type packs.
 */
export function calcPack(
  newUsed: NewUsed | string | null,
  packNew: number,
  packUsed: number,
  packCompany: number = 0
): number {
  if (packCompany > 0) return packCompany;
  return newUsed === NewUsed.New || newUsed === "New" ? packNew : packUsed;
}

/**
 * Per-rep commission.
 * Solo deal: 25% of (front_gross - pack), floored at 0.
 * Split deal: 12.5% each.
 */
export function calcCommission(
  frontGross: number,
  pack: number,
  isSplit: boolean
): number {
  const commPct = isSplit ? 0.125 : 0.25;
  return Math.max(frontGross - pack, 0) * commPct;
}

/** JDE commission = total_gross × (jdePct / 100) */
export function calcJdeCommission(
  totalGross: number,
  jdePct: number
): number {
  return totalGross * (jdePct / 100);
}

/** Sum of pack per deal (pack_company if set, else pack_new/pack_used per type) */
export function calcNonCommGross(
  deals: Pick<DealRow, "new_used">[],
  packNew: number,
  packUsed: number,
  packCompany: number = 0
): number {
  return deals.reduce((sum, deal) => {
    return sum + calcPack(deal.new_used, packNew, packUsed, packCompany);
  }, 0);
}

/** variable_net = totalGross - jdeComm - mktCost + nonCommGross */
export function calcVariableNet(
  totalGross: number,
  jdeComm: number,
  mktCost: number,
  nonCommGross: number
): number {
  return totalGross - jdeComm - mktCost + nonCommGross;
}

/** total_net = variableNet - repsCommissions - miscExpenses */
export function calcTotalNet(
  variableNet: number,
  repsCommissions: number,
  miscExpenses: number
): number {
  return variableNet - repsCommissions - miscExpenses;
}

/** Per-vehicle revenue. Returns 0 if no deals. */
export function calcPVR(gross: number, totalDeals: number): number {
  if (totalDeals === 0) return 0;
  return gross / totalDeals;
}
