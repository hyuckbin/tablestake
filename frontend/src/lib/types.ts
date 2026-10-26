// 백엔드 DTO(record)와 1:1로 맞춘 타입. 필드명을 바꾸면 양쪽을 같이 바꿔야 한다.

export type OfferingStatus = 'REVIEW' | 'RECRUITING' | 'FUNDED' | 'ACTIVE' | 'COMPLETED';
export type VerificationStatus = 'NORMAL' | 'CAUTION' | 'WARNING';
export type Severity = 'HIGH' | 'MEDIUM';
export type RiskGrade = 'A' | 'B' | 'C';
export type Region = 'POHANG' | 'DOMESTIC' | 'OVERSEAS';

export interface Alert {
  month: string;
  type: string;
  title: string;
  severity: Severity;
  severityLabel: string;
  message: string;
  metric: string;
}

export interface Verification {
  status: VerificationStatus;
  statusLabel: string;
  alerts: Alert[];
}

export interface Risk {
  grade: RiskGrade;
  gradeLabel: string;
  reasons: string[];
}

export interface FundingLimit {
  averageRevenueAll: number;
  averageRevenueClean: number;
  excludedMonths: string[];
  limitAll: number;
  limitClean: number;
  basisMonths: number;
  sharePercent: number;
  termMonths: number;
  capMultiple: number;
  targetAmount: number;
  targetWithinLimit: boolean;
}

export interface RevenueRow {
  month: string;
  reportedRevenue: number;
  cardRevenue: number;
  cardRatioPercent: number;
  excludedFromLimit: boolean;
  alerts: Alert[];
}

export interface StoreInfo {
  id: number;
  name: string;
  region: Region;
  regionLabel: string;
  city: string;
  area: string;
  category: string;
  description: string;
  businessType: string;
  openedOn: string;
  operatingMonths: number;
  /** 현지 매출 통화 (KRW, JPY ...). 금액은 모두 원화로 환산해 내려온다. */
  currency: string;
  /** public/photos/{imageKey}.jpg */
  imageKey: string;
}

export interface OfferingSummary {
  id: number;
  storeId: number;
  storeName: string;
  region: Region;
  regionLabel: string;
  city: string;
  area: string;
  category: string;
  imageKey: string;
  title: string;
  status: OfferingStatus;
  statusLabel: string;
  targetAmount: number;
  raisedAmount: number;
  fundingRatePercent: number;
  investorCount: number;
  revenueSharePercent: number;
  capMultiple: number;
  /** 투자자가 받는 최대 배수 = 상환 배수 × (1 − 정산 수수료) */
  investorCapMultiple: number;
  maxTermMonths: number;
  expectedAnnualReturnPercent: number;
  riskGrade: RiskGrade;
  recruitEndsOn: string;
  repaymentProgressPercent: number;
  /** 가게가 지금까지 낸 돈 (수수료 떼기 전) */
  totalPaid: number;
  /** 최근 평균 매출 기준, 상품 전체가 매달 투자자에게 주는 돈 (수수료 뺀 금액) */
  monthlyPayout: number;
  payoutStartMonth: string | null;
  lastSettledMonth: string | null;
  verificationStatus: VerificationStatus;
  verificationStatusLabel: string;
  recentAlertCount: number;
  /** 이상 매출 경고로 정산이 보류된 달. 없으면 null */
  holdMonth: string | null;
  holdReason: string | null;
  averageMonthlyRevenue: number;
  /** 최근 3개월 매출의 1년 전 같은 기간 대비 증감(%) */
  revenueGrowthPercent: number;
  /** 최근 12개월 신고 매출 (오래된 달부터) */
  revenueTrend: number[];
  investorPerk: string | null;
}

export interface Projection {
  monthlyPayout: number;
  expectedMonths: number;
  expectedTotal: number;
  capAmount: number;
  annualReturnPercent: number;
  reachesCapWithinTerm: boolean;
  basisMonthlyRevenue: number;
}

export interface OfferingDetail {
  summary: OfferingSummary;
  purpose: string;
  store: StoreInfo;
  totalPaid: number;
  repaymentCap: number;
  remainingAmount: number;
  projection: Projection;
  fundingLimit: FundingLimit;
  risk: Risk;
  verification: Verification;
  revenues: RevenueRow[];
  myInvestedAmount: number;
  perInvestorLimit: number;
  /** 정산 수수료(%) — 가게가 낸 돈에서 떼고 나머지를 투자자에게 나눈다 */
  settlementFeePercent: number;
  /** 투자자가 받는 최대 배수 = 상환 배수 × (1 − 정산 수수료) */
  investorCapMultiple: number;
  investorPerk: string | null;
  /** 원 단위 정산 기록 (최신 달부터) */
  settlements: SettlementRecord[];
}

export interface SettlementRecord {
  month: string;
  baseRevenue: number;
  paidAmount: number;
  platformFee: number;
  investorAmount: number;
  anomalyOverridden: boolean;
}

export interface Simulation {
  amount: number;
  projection: Projection;
  remainingAmount: number;
  myInvestedAmount: number;
  perInvestorLimit: number;
  maxInvestableAmount: number;
}

export interface InvestmentResult {
  investmentId: number;
  offeringId: number;
  storeName: string;
  amount: number;
  myTotalInOffering: number;
  raisedAmount: number;
  targetAmount: number;
  offeringStatus: OfferingStatus;
  offeringStatusLabel: string;
}

export interface Holding {
  offeringId: number;
  storeName: string;
  title: string;
  status: OfferingStatus;
  statusLabel: string;
  region: Region;
  city: string;
  category: string;
  imageKey: string;
  invested: number;
  received: number;
  capAmount: number;
  repaymentProgressPercent: number;
  investorPerk: string | null;
}

export interface PayoutHistory {
  settlementId: number;
  offeringId: number;
  month: string;
  storeName: string;
  imageKey: string;
  amount: number;
}

export interface Portfolio {
  nickname: string;
  totalInvested: number;
  totalReceived: number;
  outstandingPrincipal: number;
  realizedProfit: number;
  holdings: Holding[];
  recentPayouts: PayoutHistory[];
}

export interface OfferingBrief {
  id: number;
  title: string;
  status: OfferingStatus;
  statusLabel: string;
  targetAmount: number;
  raisedAmount: number;
  nextSettlementMonth: string | null;
}

export interface StoreOverview {
  id: number;
  name: string;
  area: string;
  category: string;
  latestMonth: string | null;
  latestReportedRevenue: number;
  verificationStatus: VerificationStatus;
  verificationStatusLabel: string;
  recentAlertCount: number;
  riskGrade: RiskGrade;
  offerings: OfferingBrief[];
}

export interface RevenueBoard {
  store: StoreInfo;
  risk: Risk;
  verification: Verification;
  storeAlerts: Alert[];
  fundingLimit: FundingLimit | null;
  rows: RevenueRow[];
  nextMonth: string;
  nextMonthRegistrable: boolean;
  lastClosedMonth: string;
  medianRevenue: number;
  baselineCardRatioPercent: number;
  offerings: OfferingBrief[];
}

export interface RevenueRegisterResult {
  month: string;
  reportedRevenue: number;
  cardRevenue: number;
  cardRatioPercent: number;
  alerts: Alert[];
  verification: Verification;
}

export interface SettlementSummary {
  id: number;
  month: string;
  baseRevenue: number;
  grossAmount: number;
  paidAmount: number;
  platformFee: number;
  capReached: boolean;
  anomalyOverridden: boolean;
}

export interface SettlementBoard {
  offeringId: number;
  title: string;
  storeName: string;
  status: OfferingStatus;
  statusLabel: string;
  sharePercent: number;
  capMultiple: number;
  raisedAmount: number;
  repaymentCap: number;
  totalPaid: number;
  repaymentProgressPercent: number;
  payoutStartMonth: string | null;
  nextSettlementMonth: string | null;
  /** 모은 돈에서 모집 수수료를 뺀, 가게가 받은 돈 */
  storeReceivedAmount: number;
  recruitFeePercent: number;
  settlementFeePercent: number;
  settlements: SettlementSummary[];
}

export interface PayoutLine {
  investorNickname: string;
  demoUser: boolean;
  investmentAmount: number;
  amount: number;
}

export interface Settlement {
  id: number;
  offeringId: number;
  storeName: string;
  offeringTitle: string;
  month: string;
  baseRevenue: number;
  sharePercent: number;
  grossAmount: number;
  remainingCapBefore: number;
  /** 가게가 낸 돈 (상환 상한은 이 금액으로 센다) */
  paidAmount: number;
  /** 정산 수수료 */
  platformFee: number;
  /** 투자자에게 나눈 돈 = paidAmount − platformFee */
  investorAmount: number;
  capReached: boolean;
  totalPaidAfter: number;
  repaymentCap: number;
  offeringStatus: OfferingStatus;
  offeringStatusLabel: string;
  anomalyOverridden: boolean;
  payoutCount: number;
  payoutSum: number;
  payouts: PayoutLine[];
}

export interface ErrorBody {
  code: string;
  message: string;
  details: string[];
}
