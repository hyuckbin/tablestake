package com.tablestake.investment;

import com.tablestake.global.util.Numbers;
import com.tablestake.investment.dto.HoldingResponse;
import com.tablestake.investment.dto.PayoutHistoryResponse;
import com.tablestake.investment.dto.PortfolioResponse;
import com.tablestake.offering.FeePolicy;
import com.tablestake.offering.Offering;
import com.tablestake.settlement.Payout;
import com.tablestake.settlement.PayoutRepository;
import com.tablestake.settlement.Settlement;
import com.tablestake.store.Store;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class PortfolioService {

    private static final int RECENT_PAYOUT_LIMIT = 36;

    private final InvestmentRepository investmentRepository;
    private final PayoutRepository payoutRepository;
    private final DemoInvestorProvider demoInvestorProvider;

    public PortfolioService(InvestmentRepository investmentRepository, PayoutRepository payoutRepository,
                            DemoInvestorProvider demoInvestorProvider) {
        this.investmentRepository = investmentRepository;
        this.payoutRepository = payoutRepository;
        this.demoInvestorProvider = demoInvestorProvider;
    }

    public PortfolioResponse getPortfolio() {
        Investor investor = demoInvestorProvider.get();

        Map<Long, List<Investment>> byOffering = new LinkedHashMap<>();
        for (Investment investment : investmentRepository.findAllWithOfferingByInvestorId(investor.getId())) {
            byOffering.computeIfAbsent(investment.getOffering().getId(), key -> new ArrayList<>()).add(investment);
        }

        List<HoldingResponse> holdings = new ArrayList<>();
        long totalInvested = 0L;
        long totalReceived = 0L;
        for (List<Investment> group : byOffering.values()) {
            Offering offering = group.get(0).getOffering();
            long invested = group.stream().mapToLong(Investment::getAmount).sum();
            long received = group.stream().mapToLong(Investment::getReceivedAmount).sum();
            // 투자자가 받을 수 있는 최대 금액 = 투자금 × 1.3 × (1 − 정산 수수료 2%)
            long capAmount = BigDecimal.valueOf(invested)
                    .multiply(FeePolicy.investorCapMultiple(offering.getRepaymentCapMultiple()))
                    .setScale(0, RoundingMode.DOWN).longValue();
            double progress = capAmount == 0 ? 0.0 : (double) received / capAmount;
            Store store = offering.getStore();
            holdings.add(new HoldingResponse(offering.getId(), store.getName(), offering.getTitle(),
                    offering.getStatus().name(), offering.getStatus().getLabel(), store.getRegion().name(),
                    store.getCity(), store.getCategory(), store.getImageKey(), invested, received, capAmount,
                    Numbers.percent(progress), offering.getInvestorPerk()));
            totalInvested += invested;
            totalReceived += received;
        }

        // 같은 달 같은 상품에 투자가 여러 건이면 지급 내역을 한 줄로 합친다.
        Map<Long, PayoutHistoryResponse> bySettlement = new LinkedHashMap<>();
        for (Payout payout : payoutRepository.findAllWithSettlementByInvestorId(investor.getId())) {
            Settlement settlement = payout.getSettlement();
            Offering offering = settlement.getOffering();
            bySettlement.merge(settlement.getId(),
                    new PayoutHistoryResponse(settlement.getId(), offering.getId(),
                            settlement.getYearMonth().toString(), offering.getStore().getName(),
                            offering.getStore().getImageKey(), payout.getAmount()),
                    (left, right) -> left.plus(right.amount()));
        }
        List<PayoutHistoryResponse> recentPayouts = bySettlement.values().stream()
                .limit(RECENT_PAYOUT_LIMIT)
                .toList();

        return new PortfolioResponse(
                investor.getNickname(),
                totalInvested,
                totalReceived,
                Math.max(0L, totalInvested - totalReceived),
                Math.max(0L, totalReceived - totalInvested),
                holdings,
                recentPayouts);
    }
}
