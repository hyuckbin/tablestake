package com.tablestake.offering;

import com.tablestake.anomaly.RevenueAlert;
import com.tablestake.anomaly.Severity;
import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;
import com.tablestake.global.util.Numbers;
import com.tablestake.investment.DemoInvestorProvider;
import com.tablestake.investment.InvestmentPolicy;
import com.tablestake.investment.InvestmentRepository;
import com.tablestake.offering.dto.OfferingDetailResponse;
import com.tablestake.offering.dto.OfferingSummaryResponse;
import com.tablestake.offering.dto.ProjectionResponse;
import com.tablestake.offering.dto.SettlementRecordResponse;
import com.tablestake.offering.dto.SimulationResponse;
import com.tablestake.settlement.SettlementRepository;
import com.tablestake.store.RevenuePoint;
import com.tablestake.store.Store;
import com.tablestake.store.StoreAnalysisService;
import com.tablestake.store.analysis.FundingLimit;
import com.tablestake.store.analysis.FundingLimitCalculator;
import com.tablestake.store.analysis.StoreAnalysis;
import com.tablestake.store.dto.StoreDtoMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.YearMonth;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * 투자자 화면에 쓰는 상품 조회와 모의 투자 시뮬레이션.
 */
@Service
@Transactional(readOnly = true)
public class OfferingService {

    /** 투자자에게 보여주는 상태. 심사 중인 상품은 숨긴다. */
    private static final List<OfferingStatus> PUBLIC_STATUSES = List.of(
            OfferingStatus.RECRUITING, OfferingStatus.FUNDED, OfferingStatus.ACTIVE, OfferingStatus.COMPLETED);
    private static final int PUBLIC_SETTLEMENT_LIMIT = 12;

    private final OfferingRepository offeringRepository;
    private final InvestmentRepository investmentRepository;
    private final SettlementRepository settlementRepository;
    private final StoreAnalysisService storeAnalysisService;
    private final DemoInvestorProvider demoInvestorProvider;
    private final Clock clock;
    private final FundingLimitCalculator fundingLimitCalculator = new FundingLimitCalculator();

    public OfferingService(OfferingRepository offeringRepository, InvestmentRepository investmentRepository,
                           SettlementRepository settlementRepository, StoreAnalysisService storeAnalysisService,
                           DemoInvestorProvider demoInvestorProvider, Clock clock) {
        this.offeringRepository = offeringRepository;
        this.investmentRepository = investmentRepository;
        this.settlementRepository = settlementRepository;
        this.storeAnalysisService = storeAnalysisService;
        this.demoInvestorProvider = demoInvestorProvider;
        this.clock = clock;
    }

    public List<OfferingSummaryResponse> getOfferings(OfferingStatus status) {
        if (status == OfferingStatus.REVIEW) {
            return List.of();
        }
        Collection<OfferingStatus> statuses = status == null ? PUBLIC_STATUSES : List.of(status);
        return offeringRepository.findAllWithStoreByStatusIn(statuses).stream()
                .map(offering -> {
                    StoreAnalysis analysis = storeAnalysisService.analyze(offering.getStore());
                    FundingLimit limit = limitOf(offering, analysis);
                    return toSummary(offering, analysis, limit, projectionOf(offering, limit));
                })
                .toList();
    }

    public OfferingDetailResponse getOffering(Long offeringId) {
        Offering offering = findPublicOffering(offeringId);
        StoreAnalysis analysis = storeAnalysisService.analyze(offering.getStore());
        FundingLimit limit = limitOf(offering, analysis);
        Projection projection = projectionOf(offering, limit);
        long myInvested = investmentRepository.sumAmount(offeringId, demoInvestorProvider.get().getId());
        List<SettlementRecordResponse> settlements = settlementRepository
                .findByOfferingIdOrderBySettlementMonthDesc(offeringId).stream()
                .limit(PUBLIC_SETTLEMENT_LIMIT)
                .map(settlement -> new SettlementRecordResponse(settlement.getYearMonth().toString(),
                        settlement.getBaseRevenue(), settlement.getPaidAmount(), settlement.getPlatformFee(),
                        settlement.getInvestorAmount(), settlement.isAnomalyOverridden()))
                .toList();

        return new OfferingDetailResponse(
                toSummary(offering, analysis, limit, projection),
                offering.getPurpose(),
                StoreDtoMapper.storeInfo(offering.getStore(), YearMonth.now(clock)),
                offering.getTotalPaid(),
                offering.repaymentCap(),
                offering.remainingAmount(),
                ProjectionResponse.of(projection, limit.averageRevenueClean()),
                StoreDtoMapper.fundingLimit(limit, offering.getRevenueShareRate(), offering.getMaxTermMonths(),
                        offering.getRepaymentCapMultiple(), offering.getTargetAmount()),
                StoreDtoMapper.risk(analysis.risk()),
                StoreDtoMapper.verification(analysis),
                StoreDtoMapper.revenueRows(analysis, 12, false),
                myInvested,
                InvestmentPolicy.PER_INVESTOR_LIMIT,
                FeePolicy.settlementFeePercent(),
                FeePolicy.investorCapMultiple(offering.getRepaymentCapMultiple()).doubleValue(),
                offering.getInvestorPerk(),
                settlements);
    }

    /**
     * 투자 금액을 넣으면 예상 월 수령액과 연 환산 수익률을 계산한다. (정산 수수료를 뺀 금액 기준)
     * 내 몫 = 상품 전체 월 투자자 몫 × (내 투자 금액 ÷ 모집 목표액).
     */
    public SimulationResponse simulate(Long offeringId, long amount) {
        InvestmentPolicy.validateAmount(amount);
        Offering offering = findPublicOffering(offeringId);
        StoreAnalysis analysis = storeAnalysisService.analyze(offering.getStore());
        FundingLimit limit = limitOf(offering, analysis);

        long offeringMonthly = FeePolicy.investorShareOf(offering.grossPayoutOf(limit.averageRevenueClean()));
        long myMonthly = Math.multiplyExact(offeringMonthly, amount) / offering.getTargetAmount();
        Projection projection = ReturnCalculator.project(amount, myMonthly,
                FeePolicy.investorCapMultiple(offering.getRepaymentCapMultiple()), offering.getMaxTermMonths());

        long myInvested = investmentRepository.sumAmount(offeringId, demoInvestorProvider.get().getId());
        long maxInvestable = Math.max(0L,
                Math.min(offering.remainingAmount(), InvestmentPolicy.PER_INVESTOR_LIMIT - myInvested));
        return new SimulationResponse(amount, ProjectionResponse.of(projection, limit.averageRevenueClean()),
                offering.remainingAmount(), myInvested, InvestmentPolicy.PER_INVESTOR_LIMIT, maxInvestable);
    }

    private FundingLimit limitOf(Offering offering, StoreAnalysis analysis) {
        return fundingLimitCalculator.calculate(analysis.last12(), analysis.excludedMonths(),
                offering.getRevenueShareRate(), offering.getMaxTermMonths(), offering.getRepaymentCapMultiple());
    }

    /**
     * 투자자 입장의 예상 수익. 가게는 매출의 5%를 내고, 정산 수수료 2%를 뺀 금액이 투자자에게 간다.
     * 상한도 같은 비율로 줄어 투자자는 최대 1.3 × 0.98 = 1.274배를 받는다. (기간은 그대로)
     */
    private Projection projectionOf(Offering offering, FundingLimit limit) {
        long monthly = FeePolicy.investorShareOf(offering.grossPayoutOf(limit.averageRevenueClean()));
        return ReturnCalculator.project(offering.getTargetAmount(), monthly,
                FeePolicy.investorCapMultiple(offering.getRepaymentCapMultiple()), offering.getMaxTermMonths());
    }

    /**
     * 지급 중인 상품의 다음 정산 달에 높은 단계 경고가 있으면, 운영자가 확인하기 전까지 그 달 정산은 보류된다.
     * (SettlementService 가 같은 규칙으로 정산을 막는다)
     */
    private Optional<RevenueAlert> holdAlertOf(Offering offering, StoreAnalysis analysis) {
        if (offering.getStatus() != OfferingStatus.ACTIVE) {
            return Optional.empty();
        }
        YearMonth next = offering.nextSettlementMonth(offering.getLastSettledYearMonth());
        return analysis.alertsFor(next).stream()
                .filter(alert -> alert.severity() == Severity.HIGH)
                .findFirst();
    }

    private OfferingSummaryResponse toSummary(Offering offering, StoreAnalysis analysis, FundingLimit limit,
                                              Projection projection) {
        Store store = offering.getStore();
        Optional<RevenueAlert> hold = holdAlertOf(offering, analysis);
        YearMonth payoutStart = offering.getPayoutStartYearMonth();
        YearMonth lastSettled = offering.getLastSettledYearMonth();
        return new OfferingSummaryResponse(
                offering.getId(),
                store.getId(),
                store.getName(),
                store.getRegion().name(),
                store.getRegion().getLabel(),
                store.getCity(),
                store.getArea(),
                store.getCategory(),
                store.getImageKey(),
                offering.getTitle(),
                offering.getStatus().name(),
                offering.getStatus().getLabel(),
                offering.getTargetAmount(),
                offering.getRaisedAmount(),
                Numbers.percent(offering.fundingRate()),
                investmentRepository.countInvestors(offering.getId()),
                Numbers.percent(offering.getRevenueShareRate().doubleValue()),
                offering.getRepaymentCapMultiple().doubleValue(),
                FeePolicy.investorCapMultiple(offering.getRepaymentCapMultiple()).doubleValue(),
                offering.getMaxTermMonths(),
                projection.annualReturnPercent(),
                analysis.risk().grade(),
                offering.getRecruitEndsOn().toString(),
                Numbers.percent(offering.repaymentProgress()),
                offering.getTotalPaid(),
                projection.monthlyPayout(),
                payoutStart == null ? null : payoutStart.toString(),
                lastSettled == null ? null : lastSettled.toString(),
                analysis.verificationStatus().name(),
                analysis.verificationStatus().getLabel(),
                analysis.recentAlerts().size(),
                hold.map(alert -> alert.month().toString()).orElse(null),
                hold.map(alert -> alert.type().getTitle() + " · " + alert.metric()).orElse(null),
                limit.averageRevenueClean(),
                Numbers.percent(analysis.yearOverYearGrowth()),
                analysis.last12().stream().map(RevenuePoint::reportedRevenue).toList(),
                offering.getInvestorPerk());
    }

    private Offering findPublicOffering(Long offeringId) {
        Offering offering = offeringRepository.findWithStoreById(offeringId)
                .orElseThrow(() -> new BusinessException(ErrorCode.OFFERING_NOT_FOUND));
        if (offering.getStatus() == OfferingStatus.REVIEW) {
            throw new BusinessException(ErrorCode.OFFERING_NOT_FOUND);
        }
        return offering;
    }
}
