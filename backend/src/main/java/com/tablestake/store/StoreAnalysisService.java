package com.tablestake.store;

import com.tablestake.store.analysis.StoreAnalysis;
import com.tablestake.store.analysis.StoreAnalyzer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.YearMonth;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class StoreAnalysisService {

    private final MonthlyRevenueRepository revenueRepository;
    private final Clock clock;
    private final StoreAnalyzer analyzer = new StoreAnalyzer();

    public StoreAnalysisService(MonthlyRevenueRepository revenueRepository, Clock clock) {
        this.revenueRepository = revenueRepository;
        this.clock = clock;
    }

    public StoreAnalysis analyze(Store store) {
        List<RevenuePoint> history = revenueRepository.findByStoreIdOrderByRevenueMonthAsc(store.getId()).stream()
                .map(MonthlyRevenue::toPoint)
                .toList();
        return analyzer.analyze(history, store.getOpenedOn(), YearMonth.now(clock));
    }
}
