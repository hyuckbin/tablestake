package com.tablestake.investment;

import com.tablestake.global.error.BusinessException;
import com.tablestake.global.error.ErrorCode;
import org.springframework.stereotype.Component;

/**
 * 로그인 대신 데모 투자자를 돌려준다. 실제 서비스에서는 인증된 사용자로 바꾸면 된다.
 */
@Component
public class DemoInvestorProvider {

    private final InvestorRepository investorRepository;

    public DemoInvestorProvider(InvestorRepository investorRepository) {
        this.investorRepository = investorRepository;
    }

    public Investor get() {
        return investorRepository.findFirstByDemoUserTrue()
                .orElseThrow(() -> new BusinessException(ErrorCode.DEMO_INVESTOR_NOT_FOUND));
    }
}
