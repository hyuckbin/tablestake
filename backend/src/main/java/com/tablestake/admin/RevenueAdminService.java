package com.tablestake.admin;

import com.tablestake.admin.dto.OfferingBriefResponse;
import com.tablestake.admin.dto.RevenueBoardResponse;
import com.tablestake.admin.dto.RevenueRegisterRequest;
import com.tablestake.admin.dto.RevenueRegisterResponse;
import com.tablestake.admin.dto.StoreOverviewResponse;
import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;
import com.tablestake.global.util.MonthParser;
import com.tablestake.global.util.Numbers;
import com.tablestake.global.util.Stats;
import com.tablestake.offering.Offering;
import com.tablestake.offering.OfferingRepository;
import com.tablestake.offering.OfferingStatus;
import com.tablestake.settlement.Settlement;
import com.tablestake.settlement.SettlementRepository;
import com.tablestake.store.MonthlyRevenue;
import com.tablestake.store.MonthlyRevenueRepository;
import com.tablestake.store.RevenuePoint;
import com.tablestake.store.Store;
import com.tablestake.store.StoreAnalysisService;
import com.tablestake.store.StoreRepository;
import com.tablestake.store.analysis.FundingLimit;
import com.tablestake.store.analysis.FundingLimitCalculator;
import com.tablestake.store.analysis.StoreAnalysis;
import com.tablestake.store.dto.AlertResponse;
import com.tablestake.store.dto.FundingLimitResponse;
import com.tablestake.store.dto.StoreDtoMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

/**
 * 운영 콘솔: 가게별 매출 입력과 이상 탐지 결과 조회.
 */
@Service
@Transactional(readOnly = true)
public class RevenueAdminService {

    private final StoreRepository storeRepository;
    private final MonthlyRevenueRepository revenueRepository;
    private final OfferingRepository offeringRepository;
    private final SettlementRepository settlementRepository;
    private final StoreAnalysisService storeAnalysisService;
    private final Clock clock;
    private final FundingLimitCalculator fundingLimitCalculator = new FundingLimitCalculator();

    public RevenueAdminService(StoreRepository storeRepository, MonthlyRevenueRepository revenueRepository,
                               OfferingRepository offeringRepository, SettlementRepository settlementRepository,
                               StoreAnalysisService storeAnalysisService, Clock clock) {
        this.storeRepository = storeRepository;
        this.revenueRepository = revenueRepository;
        this.offeringRepository = offeringRepository;
        this.settlementRepository = settlementRepository;
        this.storeAnalysisService = storeAnalysisService;
        this.clock = clock;
    }

    public List<StoreOverviewResponse> getStores() {
        return storeRepository.findAllByOrderByIdAsc().stream()
                .map(store -> {
                    StoreAnalysis analysis = storeAnalysisService.analyze(store);
                    RevenuePoint latest = analysis.latest().orElse(null);
                    return new StoreOverviewResponse(
                            store.getId(),
                            store.getName(),
                            store.getArea(),
                            store.getCategory(),
                            latest == null ? null : latest.month().toString(),
                            latest == null ? 0L : latest.reportedRevenue(),
                            analysis.verificationStatus().name(),
                            analysis.verificationStatus().getLabel(),
                            analysis.recentAlerts().size(),
                            analysis.risk().grade(),
                            offeringBriefs(store.getId()));
                })
                .toList();
    }

    public RevenueBoardResponse getRevenueBoard(Long storeId) {
        Store store = findStore(storeId);
        StoreAnalysis analysis = storeAnalysisService.analyze(store);
        List<Offering> offerings = offeringRepository.findByStoreIdOrderByIdAsc(storeId);

        FundingLimitResponse fundingLimit = null;
        if (!offerings.isEmpty()) {
            Offering latestOffering = offerings.get(offerings.size() - 1);
            FundingLimit limit = fundingLimitCalculator.calculate(analysis.last12(), analysis.excludedMonths(),
                    latestOffering.getRevenueShareRate(), latestOffering.getMaxTermMonths(),
                    latestOffering.getRepaymentCapMultiple());
            fundingLimit = StoreDtoMapper.fundingLimit(limit, latestOffering.getRevenueShareRate(),
                    latestOffering.getMaxTermMonths(), latestOffering.getRepaymentCapMultiple(),
                    latestOffering.getTargetAmount());
        }

        List<Double> recentRevenues = analysis.last12().stream()
                .map(point -> (double) point.reportedRevenue())
                .toList();
        double baselineRatio = analysis.last12().stream().mapToDouble(RevenuePoint::cardRatio).average().orElse(0.0);
        YearMonth lastClosedMonth = lastClosedMonth();
        YearMonth nextMonth = analysis.latest()
                .map(point -> point.month().plusMonths(1))
                .orElse(lastClosedMonth);
        List<AlertResponse> storeAlerts = analysis.recentSurge().map(AlertResponse::from).stream().toList();

        return new RevenueBoardResponse(
                StoreDtoMapper.storeInfo(store, YearMonth.now(clock)),
                StoreDtoMapper.risk(analysis.risk()),
                StoreDtoMapper.verification(analysis),
                storeAlerts,
                fundingLimit,
                StoreDtoMapper.revenueRows(analysis, analysis.history().size(), true),
                nextMonth.toString(),
                !nextMonth.isAfter(lastClosedMonth),
                lastClosedMonth.toString(),
                Math.round(Stats.median(recentRevenues)),
                Numbers.percent(baselineRatio),
                offeringBriefs(storeId));
    }

    /**
     * 새 달 매출을 등록하고 바로 이상 탐지를 돌린다.
     */
    @Transactional
    public RevenueRegisterResponse registerRevenue(Long storeId, RevenueRegisterRequest request) {
        Store store = findStore(storeId);
        YearMonth month = MonthParser.parse(request.month());
        if (revenueRepository.existsByStoreIdAndRevenueMonth(storeId, month.atDay(1))) {
            throw new BusinessException(ErrorCode.REVENUE_ALREADY_EXISTS, month.toString());
        }
        // 월 매출은 마감(말일)이 지나야 확정된다. 이번 달·미래 달은 받지 않는다.
        YearMonth lastClosedMonth = lastClosedMonth();
        if (month.isAfter(lastClosedMonth)) {
            throw new BusinessException(ErrorCode.REVENUE_MONTH_NOT_CLOSED,
                    "등록할 수 있는 마지막 달: " + lastClosedMonth);
        }
        // 중간에 빈 달이 생기면 이상 탐지 기준(최근 12개월)이 틀어지므로 순서대로만 받는다.
        Optional<YearMonth> latest = revenueRepository.findFirstByStoreIdOrderByRevenueMonthDesc(storeId)
                .map(revenue -> YearMonth.from(revenue.getRevenueMonth()));
        if (latest.isPresent() && !month.equals(latest.get().plusMonths(1))) {
            throw new BusinessException(ErrorCode.REVENUE_OUT_OF_ORDER,
                    "다음에 등록할 달: " + latest.get().plusMonths(1));
        }
        MonthlyRevenue saved = revenueRepository.save(
                new MonthlyRevenue(store, month, request.reportedRevenue(), request.cardRevenue()));

        StoreAnalysis analysis = storeAnalysisService.analyze(store);
        return new RevenueRegisterResponse(
                month.toString(),
                saved.getReportedRevenue(),
                saved.getCardRevenue(),
                Numbers.percent(saved.toPoint().cardRatio()),
                StoreDtoMapper.alerts(analysis.alertsFor(month)),
                StoreDtoMapper.verification(analysis));
    }

    private List<OfferingBriefResponse> offeringBriefs(Long storeId) {
        return offeringRepository.findByStoreIdOrderByIdAsc(storeId).stream()
                .map(offering -> new OfferingBriefResponse(
                        offering.getId(),
                        offering.getTitle(),
                        offering.getStatus().name(),
                        offering.getStatus().getLabel(),
                        offering.getTargetAmount(),
                        offering.getRaisedAmount(),
                        nextSettlementMonth(offering)))
                .toList();
    }

    private String nextSettlementMonth(Offering offering) {
        if (offering.getStatus() != OfferingStatus.ACTIVE) {
            return null;
        }
        YearMonth last = settlementRepository.findFirstByOfferingIdOrderBySettlementMonthDesc(offering.getId())
                .map(Settlement::getYearMonth)
                .orElse(null);
        return offering.nextSettlementMonth(last).toString();
    }

    /** 매출이 확정된 마지막 달(지난달). */
    private YearMonth lastClosedMonth() {
        return YearMonth.now(clock).minusMonths(1);
    }

    private Store findStore(Long storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.STORE_NOT_FOUND));
    }
}
