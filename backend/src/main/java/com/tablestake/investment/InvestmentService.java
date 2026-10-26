package com.tablestake.investment;

import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;
import com.tablestake.investment.dto.InvestmentResponse;
import com.tablestake.offering.Offering;
import com.tablestake.offering.OfferingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class InvestmentService {

    private final OfferingRepository offeringRepository;
    private final InvestmentRepository investmentRepository;
    private final DemoInvestorProvider demoInvestorProvider;
    private final Clock clock;

    public InvestmentService(OfferingRepository offeringRepository, InvestmentRepository investmentRepository,
                             DemoInvestorProvider demoInvestorProvider, Clock clock) {
        this.offeringRepository = offeringRepository;
        this.investmentRepository = investmentRepository;
        this.demoInvestorProvider = demoInvestorProvider;
        this.clock = clock;
    }

    /**
     * 모의 투자. 상품 행을 잠근 상태에서 남은 모집액과 1인 한도를 확인하므로
     * 여러 명이 동시에 투자해도 모집 목표를 넘지 않는다.
     */
    @Transactional
    public InvestmentResponse invest(Long offeringId, long amount) {
        InvestmentPolicy.validateAmount(amount);
        Investor investor = demoInvestorProvider.get();
        Offering offering = offeringRepository.findByIdForUpdate(offeringId)
                .orElseThrow(() -> new BusinessException(ErrorCode.OFFERING_NOT_FOUND));
        offering.ensureRecruiting();

        long alreadyInvested = investmentRepository.sumAmount(offeringId, investor.getId());
        if (alreadyInvested + amount > InvestmentPolicy.PER_INVESTOR_LIMIT) {
            throw new BusinessException(ErrorCode.INVESTOR_LIMIT_EXCEEDED,
                    String.format("이미 투자한 금액: %,d원", alreadyInvested));
        }

        offering.acceptInvestment(amount);
        Investment investment = investmentRepository.save(
                new Investment(offering, investor, amount, LocalDateTime.now(clock)));

        return new InvestmentResponse(
                investment.getId(),
                offering.getId(),
                offering.getStore().getName(),
                amount,
                alreadyInvested + amount,
                offering.getRaisedAmount(),
                offering.getTargetAmount(),
                offering.getStatus().name(),
                offering.getStatus().getLabel());
    }
}
