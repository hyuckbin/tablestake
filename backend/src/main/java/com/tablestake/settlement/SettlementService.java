package com.tablestake.settlement;

import com.tablestake.anomaly.RevenueAlert;
import com.tablestake.anomaly.Severity;
import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;
import com.tablestake.global.util.MonthParser;
import com.tablestake.global.util.Numbers;
import com.tablestake.investment.Investment;
import com.tablestake.investment.InvestmentRepository;
import com.tablestake.offering.FeePolicy;
import com.tablestake.offering.Offering;
import com.tablestake.offering.OfferingRepository;
import com.tablestake.offering.OfferingStatus;
import com.tablestake.settlement.dto.PayoutLineResponse;
import com.tablestake.settlement.dto.SettlementBoardResponse;
import com.tablestake.settlement.dto.SettlementRequest;
import com.tablestake.settlement.dto.SettlementResponse;
import com.tablestake.settlement.dto.SettlementSummaryResponse;
import com.tablestake.store.MonthlyRevenue;
import com.tablestake.store.MonthlyRevenueRepository;
import com.tablestake.store.Store;
import com.tablestake.store.StoreAnalysisService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 월 정산: 신고 매출 × 연동 비율을 상환 상한 안에서 지급하고, 투자 금액 비율대로 나눈다.
 */
@Service
@Transactional(readOnly = true)
public class SettlementService {

    private final OfferingRepository offeringRepository;
    private final MonthlyRevenueRepository revenueRepository;
    private final InvestmentRepository investmentRepository;
    private final SettlementRepository settlementRepository;
    private final PayoutRepository payoutRepository;
    private final StoreAnalysisService storeAnalysisService;
    private final Clock clock;

    public SettlementService(OfferingRepository offeringRepository, MonthlyRevenueRepository revenueRepository,
                             InvestmentRepository investmentRepository, SettlementRepository settlementRepository,
                             PayoutRepository payoutRepository, StoreAnalysisService storeAnalysisService,
                             Clock clock) {
        this.offeringRepository = offeringRepository;
        this.revenueRepository = revenueRepository;
        this.investmentRepository = investmentRepository;
        this.settlementRepository = settlementRepository;
        this.payoutRepository = payoutRepository;
        this.storeAnalysisService = storeAnalysisService;
        this.clock = clock;
    }

    @Transactional
    public SettlementResponse settle(Long offeringId, SettlementRequest request) {
        YearMonth month = MonthParser.parse(request.month());

        // 1. 상품 행을 잠가 같은 상품의 정산이 동시에 실행되지 않게 한다.
        Offering offering = offeringRepository.findByIdForUpdate(offeringId)
                .orElseThrow(() -> new BusinessException(ErrorCode.OFFERING_NOT_FOUND));
        offering.ensureActive();

        // 2. 중복 정산과 순서 건너뛰기를 막는다. (DB 유니크 제약이 마지막 방어선)
        LocalDate monthKey = month.atDay(1);
        if (settlementRepository.existsByOfferingIdAndSettlementMonth(offeringId, monthKey)) {
            throw new BusinessException(ErrorCode.ALREADY_SETTLED, month + " 정산 완료");
        }
        YearMonth expected = offering.nextSettlementMonth(lastSettledMonth(offeringId));
        if (!month.equals(expected)) {
            throw new BusinessException(ErrorCode.SETTLEMENT_OUT_OF_ORDER, "다음 정산 월: " + expected);
        }

        // 3. 그 달 매출이 있어야 하고, 이상 탐지 경고가 있으면 운영자 확인 전까지 보류한다.
        Store store = offering.getStore();
        MonthlyRevenue revenue = revenueRepository.findByStoreIdAndRevenueMonth(store.getId(), monthKey)
                .orElseThrow(() -> new BusinessException(ErrorCode.REVENUE_NOT_FOUND, month + " 매출 없음"));
        List<RevenueAlert> highAlerts = storeAnalysisService.analyze(store).alertsFor(month).stream()
                .filter(alert -> alert.severity() == Severity.HIGH)
                .toList();
        if (!highAlerts.isEmpty() && !request.anomalyConfirmed()) {
            throw new BusinessException(ErrorCode.SETTLEMENT_ON_HOLD, highAlerts.stream()
                    .map(alert -> alert.type().getTitle() + ": " + alert.message())
                    .toList());
        }

        // 4. 지급액 = 신고 매출 × 연동 비율. 상환 상한을 넘으면 남은 만큼만 준다.
        long grossAmount = offering.grossPayoutOf(revenue.getReportedRevenue());
        long remainingCapBefore = offering.remainingCap();
        long paidAmount = Math.min(grossAmount, remainingCapBefore);
        boolean capReached = grossAmount >= remainingCapBefore;
        offering.applyPayout(paidAmount, month);

        // 정산 수수료 2%는 투자자 몫에서 뗀다. 상환 상한은 가게가 낸 돈(paidAmount) 기준이다.
        long platformFee = FeePolicy.settlementFeeOf(paidAmount);
        long investorAmount = paidAmount - platformFee;

        Settlement settlement = settlementRepository.save(new Settlement(offering, month,
                revenue.getReportedRevenue(), grossAmount, paidAmount, platformFee, remainingCapBefore,
                offering.getTotalPaid(), capReached, !highAlerts.isEmpty(), LocalDateTime.now(clock)));

        // 5. 투자자 몫을 투자 금액 비율대로 원 단위까지 나눈다. 합계는 항상 투자자 몫과 같다.
        List<Investment> investments = investmentRepository.findAllWithInvestorByOfferingId(offeringId);
        Map<Long, Investment> investmentsById = new HashMap<>();
        List<PayoutDistributor.Share> shares = new ArrayList<>();
        for (Investment investment : investments) {
            investmentsById.put(investment.getId(), investment);
            shares.add(new PayoutDistributor.Share(investment.getId(), investment.getAmount()));
        }
        List<Payout> payouts = new ArrayList<>();
        for (PayoutDistributor.Allocation allocation : PayoutDistributor.distribute(investorAmount, shares)) {
            if (allocation.amount() == 0) {
                continue;
            }
            Investment investment = investmentsById.get(allocation.key());
            investment.receive(allocation.amount());
            payouts.add(new Payout(settlement, investment, allocation.amount()));
        }
        payoutRepository.saveAll(payouts);

        return toResponse(settlement, offering, payouts);
    }

    public SettlementBoardResponse getBoard(Long offeringId) {
        Offering offering = offeringRepository.findWithStoreById(offeringId)
                .orElseThrow(() -> new BusinessException(ErrorCode.OFFERING_NOT_FOUND));
        List<SettlementSummaryResponse> settlements = settlementRepository
                .findByOfferingIdOrderBySettlementMonthDesc(offeringId).stream()
                .map(settlement -> new SettlementSummaryResponse(settlement.getId(),
                        settlement.getYearMonth().toString(), settlement.getBaseRevenue(),
                        settlement.getGrossAmount(), settlement.getPaidAmount(), settlement.getPlatformFee(),
                        settlement.isCapReached(), settlement.isAnomalyOverridden()))
                .toList();
        String next = offering.getStatus() == OfferingStatus.ACTIVE
                ? offering.nextSettlementMonth(lastSettledMonth(offeringId)).toString()
                : null;
        YearMonth start = offering.getPayoutStartYearMonth();
        return new SettlementBoardResponse(offering.getId(), offering.getTitle(), offering.getStore().getName(),
                offering.getStatus().name(), offering.getStatus().getLabel(),
                Numbers.percent(offering.getRevenueShareRate().doubleValue()),
                offering.getRepaymentCapMultiple().doubleValue(), offering.getRaisedAmount(),
                offering.repaymentCap(), offering.getTotalPaid(), Numbers.percent(offering.repaymentProgress()),
                start == null ? null : start.toString(), next,
                offering.getRaisedAmount() - FeePolicy.recruitFeeOf(offering.getRaisedAmount()),
                FeePolicy.recruitFeePercent(), FeePolicy.settlementFeePercent(), settlements);
    }

    public SettlementResponse getSettlement(Long settlementId) {
        Settlement settlement = settlementRepository.findWithOfferingById(settlementId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SETTLEMENT_NOT_FOUND));
        List<Payout> payouts = payoutRepository.findAllWithInvestorBySettlementId(settlementId);
        return toResponse(settlement, settlement.getOffering(), payouts);
    }

    private YearMonth lastSettledMonth(Long offeringId) {
        return settlementRepository.findFirstByOfferingIdOrderBySettlementMonthDesc(offeringId)
                .map(Settlement::getYearMonth)
                .orElse(null);
    }

    private SettlementResponse toResponse(Settlement settlement, Offering offering, List<Payout> payouts) {
        List<PayoutLineResponse> lines = payouts.stream()
                .sorted(Comparator.comparingLong(Payout::getAmount).reversed())
                .map(payout -> new PayoutLineResponse(
                        payout.getInvestment().getInvestor().getNickname(),
                        payout.getInvestment().getInvestor().isDemoUser(),
                        payout.getInvestment().getAmount(),
                        payout.getAmount()))
                .toList();
        long payoutSum = payouts.stream().mapToLong(Payout::getAmount).sum();
        return new SettlementResponse(
                settlement.getId(),
                offering.getId(),
                offering.getStore().getName(),
                offering.getTitle(),
                settlement.getYearMonth().toString(),
                settlement.getBaseRevenue(),
                Numbers.percent(offering.getRevenueShareRate().doubleValue()),
                settlement.getGrossAmount(),
                settlement.getRemainingCapBefore(),
                settlement.getPaidAmount(),
                settlement.getPlatformFee(),
                settlement.getInvestorAmount(),
                settlement.isCapReached(),
                settlement.getTotalPaidAfter(),
                offering.repaymentCap(),
                offering.getStatus().name(),
                offering.getStatus().getLabel(),
                settlement.isAnomalyOverridden(),
                lines.size(),
                payoutSum,
                lines);
    }
}
