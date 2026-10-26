package com.tablestake.demo;

import com.tablestake.admin.RevenueAdminService;
import com.tablestake.admin.dto.RevenueBoardResponse;
import com.tablestake.admin.dto.RevenueRegisterRequest;
import com.tablestake.admin.dto.RevenueRegisterResponse;
import com.tablestake.admin.dto.StoreOverviewResponse;
import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;
import com.tablestake.investment.InvestmentService;
import com.tablestake.investment.dto.InvestmentResponse;
import com.tablestake.offering.OfferingService;
import com.tablestake.offering.OfferingStatus;
import com.tablestake.offering.dto.OfferingSummaryResponse;
import com.tablestake.settlement.SettlementService;
import com.tablestake.settlement.dto.SettlementBoardResponse;
import com.tablestake.settlement.dto.SettlementRequest;
import com.tablestake.settlement.dto.SettlementResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 발표 시나리오(투자 → 정산 → 이상 탐지 보류)를 그대로 따라가는 통합 테스트.
 * 각 테스트는 끝나면 롤백된다.
 */
@SpringBootTest
@Transactional
class DemoFlowIntegrationTest {

    @Autowired
    private OfferingService offeringService;

    @Autowired
    private InvestmentService investmentService;

    @Autowired
    private SettlementService settlementService;

    @Autowired
    private RevenueAdminService revenueAdminService;

    private OfferingSummaryResponse firstOffering(OfferingStatus status) {
        return offeringService.getOfferings(status).get(0);
    }

    @Test
    @DisplayName("모집 중인 상품에 투자하면 모집액이 늘고, 1인 한도나 남은 금액을 넘으면 거절된다")
    void invest() {
        OfferingSummaryResponse offering = firstOffering(OfferingStatus.RECRUITING);

        InvestmentResponse response = investmentService.invest(offering.id(), 100_000L);
        assertEquals(offering.raisedAmount() + 100_000L, response.raisedAmount());

        // 1인 한도(500만 원)를 넘으면 거절된다.
        BusinessException limit = assertThrows(BusinessException.class,
                () -> investmentService.invest(offering.id(), 4_950_000L));
        assertEquals(ErrorCode.INVESTOR_LIMIT_EXCEEDED, limit.getErrorCode());

        // 1인 한도 안이어도 남은 모집 금액보다 많으면 거절된다.
        long remaining = offering.targetAmount() - response.raisedAmount();
        BusinessException over = assertThrows(BusinessException.class,
                () -> investmentService.invest(offering.id(), remaining + 10_000L));
        assertEquals(ErrorCode.EXCEEDS_REMAINING_AMOUNT, over.getErrorCode());

        BusinessException unit = assertThrows(BusinessException.class,
                () -> investmentService.invest(offering.id(), 15_500L));
        assertEquals(ErrorCode.INVALID_INVESTMENT_AMOUNT, unit.getErrorCode());
    }

    @Test
    @DisplayName("다음 달을 정산하면 수수료를 뺀 투자자 몫이 남김없이 분배되고, 같은 달은 다시 정산할 수 없다")
    void settleNextMonth() {
        OfferingSummaryResponse offering = firstOffering(OfferingStatus.ACTIVE);
        SettlementBoardResponse board = settlementService.getBoard(offering.id());

        SettlementResponse settlement = settlementService.settle(offering.id(),
                new SettlementRequest(board.nextSettlementMonth(), false));
        // 가게가 낸 돈 = 정산 수수료 + 투자자 몫, 투자자에게 나눈 돈의 합 = 투자자 몫 (원 단위까지)
        assertEquals(settlement.paidAmount(), settlement.platformFee() + settlement.investorAmount());
        assertEquals(settlement.investorAmount(), settlement.payoutSum());
        assertTrue(settlement.paidAmount() > 0);
        assertFalse(settlement.anomalyOverridden());

        BusinessException duplicate = assertThrows(BusinessException.class,
                () -> settlementService.settle(offering.id(), new SettlementRequest(board.nextSettlementMonth(), false)));
        assertEquals(ErrorCode.ALREADY_SETTLED, duplicate.getErrorCode());
    }

    @Test
    @DisplayName("카드 결제 비중이 급감한 달은 정산이 보류되고, 확인 후에만 진행된다")
    void holdSettlementOnAnomaly() {
        OfferingSummaryResponse offering = firstOffering(OfferingStatus.ACTIVE);
        StoreOverviewResponse store = revenueAdminService.getStores().stream()
                .filter(candidate -> candidate.id().equals(offering.storeId()))
                .findFirst()
                .orElseThrow();

        // 밀린 달을 먼저 정산한다.
        SettlementBoardResponse board = settlementService.getBoard(offering.id());
        settlementService.settle(offering.id(), new SettlementRequest(board.nextSettlementMonth(), false));

        // 현금 결제 유도: 신고 매출은 비슷한데 카드 매출만 크게 줄었다.
        RevenueBoardResponse revenueBoard = revenueAdminService.getRevenueBoard(store.id());
        long reported = revenueBoard.medianRevenue();
        long card = Math.round(reported * (revenueBoard.baselineCardRatioPercent() / 100.0 - 0.28));
        RevenueRegisterResponse registered = revenueAdminService.registerRevenue(store.id(),
                new RevenueRegisterRequest(revenueBoard.nextMonth(), reported, card));
        assertFalse(registered.alerts().isEmpty());

        BusinessException hold = assertThrows(BusinessException.class,
                () -> settlementService.settle(offering.id(), new SettlementRequest(revenueBoard.nextMonth(), false)));
        assertEquals(ErrorCode.SETTLEMENT_ON_HOLD, hold.getErrorCode());

        SettlementResponse confirmed = settlementService.settle(offering.id(),
                new SettlementRequest(revenueBoard.nextMonth(), true));
        assertTrue(confirmed.anomalyOverridden());
    }

    @Test
    @DisplayName("마감되지 않은 달이나 순서를 건너뛴 달의 매출은 등록할 수 없다")
    void revenueRegistrationRules() {
        StoreOverviewResponse store = revenueAdminService.getStores().get(0);
        RevenueBoardResponse board = revenueAdminService.getRevenueBoard(store.id());
        assertTrue(board.nextMonthRegistrable());

        YearMonth next = YearMonth.parse(board.nextMonth());
        BusinessException notClosed = assertThrows(BusinessException.class,
                () -> revenueAdminService.registerRevenue(store.id(),
                        new RevenueRegisterRequest(next.plusMonths(1).toString(), 1_000_000L, 900_000L)));
        assertEquals(ErrorCode.REVENUE_MONTH_NOT_CLOSED, notClosed.getErrorCode());

        YearMonth oldest = YearMonth.parse(board.rows().get(board.rows().size() - 1).month());
        BusinessException outOfOrder = assertThrows(BusinessException.class,
                () -> revenueAdminService.registerRevenue(store.id(),
                        new RevenueRegisterRequest(oldest.minusMonths(1).toString(), 1_000_000L, 900_000L)));
        assertEquals(ErrorCode.REVENUE_OUT_OF_ORDER, outOfOrder.getErrorCode());
    }

    @Test
    @DisplayName("지급 중 목록에는 세 지역 가게가 지급 현황과 함께 오고, 보류 표시는 실제 정산 보류와 일치한다")
    void activeListingsMatchSettlementRules() {
        List<OfferingSummaryResponse> active = offeringService.getOfferings(OfferingStatus.ACTIVE);
        assertTrue(active.size() >= 5);
        assertEquals(Set.of("POHANG", "DOMESTIC", "OVERSEAS"),
                active.stream().map(OfferingSummaryResponse::region).collect(Collectors.toSet()));
        assertTrue(active.stream().allMatch(offering -> offering.imageKey() != null && offering.totalPaid() > 0
                && offering.monthlyPayout() > 0 && offering.revenueTrend().size() == 12));

        // 보류 표시가 붙은 상품은 실제로 그 달 정산이 막힌다.
        List<OfferingSummaryResponse> held = active.stream().filter(offering -> offering.holdMonth() != null).toList();
        assertEquals(1, held.size());
        OfferingSummaryResponse onHold = held.get(0);
        BusinessException hold = assertThrows(BusinessException.class,
                () -> settlementService.settle(onHold.id(), new SettlementRequest(onHold.holdMonth(), false)));
        assertEquals(ErrorCode.SETTLEMENT_ON_HOLD, hold.getErrorCode());

        // 보류 표시가 없는 상품은 다음 달이 그대로 정산된다.
        OfferingSummaryResponse clean = active.stream().filter(offering -> offering.holdMonth() == null).findFirst().orElseThrow();
        SettlementBoardResponse board = settlementService.getBoard(clean.id());
        assertTrue(settlementService.settle(clean.id(), new SettlementRequest(board.nextSettlementMonth(), false)).paidAmount() > 0);
    }

    @Test
    @DisplayName("상품 상세에는 원 단위 정산 기록이 최신 달부터 공개된다")
    void detailShowsSettlementRecords() {
        OfferingSummaryResponse offering = firstOffering(OfferingStatus.ACTIVE);
        var detail = offeringService.getOffering(offering.id());
        assertFalse(detail.settlements().isEmpty());
        assertTrue(detail.settlements().stream()
                .allMatch(record -> record.paidAmount() == record.platformFee() + record.investorAmount()));
        assertTrue(detail.settlements().get(0).month().compareTo(detail.settlements().get(detail.settlements().size() - 1).month()) > 0);
    }

    @Test
    @DisplayName("심사 중인 상품은 투자자 목록에 보이지 않는다")
    void reviewOfferingHidden() {
        assertTrue(offeringService.getOfferings(OfferingStatus.REVIEW).isEmpty());
        assertTrue(offeringService.getOfferings(null).stream()
                .noneMatch(offering -> offering.status().equals(OfferingStatus.REVIEW.name())));
    }
}
