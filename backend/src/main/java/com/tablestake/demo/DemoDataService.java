package com.tablestake.demo;

import com.tablestake.demo.SeedRevenueGenerator.Profile;
import com.tablestake.investment.Investment;
import com.tablestake.investment.InvestmentRepository;
import com.tablestake.investment.Investor;
import com.tablestake.investment.InvestorRepository;
import com.tablestake.offering.Offering;
import com.tablestake.offering.OfferingRepository;
import com.tablestake.offering.OfferingStatus;
import com.tablestake.settlement.PayoutRepository;
import com.tablestake.settlement.SettlementRepository;
import com.tablestake.settlement.SettlementService;
import com.tablestake.settlement.dto.SettlementRequest;
import com.tablestake.store.BusinessType;
import com.tablestake.store.MarketRegion;
import com.tablestake.store.MonthlyRevenue;
import com.tablestake.store.MonthlyRevenueRepository;
import com.tablestake.store.RevenuePoint;
import com.tablestake.store.Store;
import com.tablestake.store.StoreRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * 발표용 데모 데이터. 모든 날짜는 실행 시점 기준이라 언제 켜도 같은 흐름으로 시연할 수 있다.
 * 가게 이름과 숫자는 모두 가상이다. 포항(실증) → 국내 → 해외 순서의 확장 그림을 보여 주려고 세 지역 가게를 섞었다.
 */
@Service
public class DemoDataService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataService.class);
    private static final BigDecimal SHARE_RATE = new BigDecimal("0.0500");
    private static final BigDecimal CAP_MULTIPLE = new BigDecimal("1.30");
    private static final int TERM_MONTHS = 60;
    private static final int HISTORY_MONTHS = 24;
    private static final int CROWD_SIZE = 320;

    private final StoreRepository storeRepository;
    private final MonthlyRevenueRepository revenueRepository;
    private final OfferingRepository offeringRepository;
    private final InvestorRepository investorRepository;
    private final InvestmentRepository investmentRepository;
    private final SettlementRepository settlementRepository;
    private final PayoutRepository payoutRepository;
    private final SettlementService settlementService;
    private final Clock clock;
    private final SeedRevenueGenerator revenueGenerator = new SeedRevenueGenerator();

    public DemoDataService(StoreRepository storeRepository, MonthlyRevenueRepository revenueRepository,
                           OfferingRepository offeringRepository, InvestorRepository investorRepository,
                           InvestmentRepository investmentRepository, SettlementRepository settlementRepository,
                           PayoutRepository payoutRepository, SettlementService settlementService, Clock clock) {
        this.storeRepository = storeRepository;
        this.revenueRepository = revenueRepository;
        this.offeringRepository = offeringRepository;
        this.investorRepository = investorRepository;
        this.investmentRepository = investmentRepository;
        this.settlementRepository = settlementRepository;
        this.payoutRepository = payoutRepository;
        this.settlementService = settlementService;
        this.clock = clock;
    }

    @Transactional
    public void reset() {
        // 외래 키 순서대로 지운다.
        payoutRepository.deleteAllInBatch();
        settlementRepository.deleteAllInBatch();
        investmentRepository.deleteAllInBatch();
        offeringRepository.deleteAllInBatch();
        revenueRepository.deleteAllInBatch();
        investorRepository.deleteAllInBatch();
        storeRepository.deleteAllInBatch();
        new Seeder().run();
        log.info("데모 데이터를 새로 만들었습니다.");
    }

    /** 시드 한 번에 필요한 기준 날짜와 투자자들을 묶어 둔다. */
    private final class Seeder {

        /** 시드 매출은 두 달 전까지만 넣는다. 마감된 마지막 달(지난달) 매출은 발표 때 운영 콘솔에서 직접 입력한다. */
        private final YearMonth lastSeedMonth = YearMonth.now(clock).minusMonths(2);
        private final LocalDate today = LocalDate.now(clock);
        private final Random random = new Random(2026L);
        private final Investor me;
        private final List<Investor> crowd;

        private Seeder() {
            me = investorRepository.save(new Investor("데모 투자자", true));
            List<Investor> people = new ArrayList<>();
            for (int i = 1; i <= CROWD_SIZE; i++) {
                people.add(new Investor(String.format("투자자 %03d", i), false));
            }
            crowd = investorRepository.saveAll(people);
        }

        void run() {
            // 시연 시나리오와 통합 테스트가 기대하는 순서: 첫 모집 중 상품 = 국밥, 첫 지급 중 상품 = 수제버거, 첫 가게 = 국밥.

            // 1. 모집 중(80%): 구도심 국밥집 설비 교체
            Store gukbap = store("육거리 돼지국밥", MarketRegion.POHANG, "포항", "중앙동 육거리", "국밥",
                    "10년째 육거리 골목에서 새벽부터 문을 여는 돼지국밥집입니다.",
                    LocalDate.of(2016, 3, 1), "KRW", "gukbap", Profile.GUKBAP);
            recruiting(gukbap, "주방 설비 교체", "15년 된 육수 솥과 냉장 설비를 바꿔 하루 판매량을 늘립니다.",
                    20_000_000L, 16_000_000L, 9, "투자자 인증하면 국밥 곱빼기 무료", 0, 46);

            // 2. 지급 중: 중앙상가 수제버거. 데모 투자자가 50만 원 투자해 매달 받고 있다.
            //    시드 마지막 달은 정산하지 않고 남겨 둔다. 발표 때 운영 콘솔에서 직접 정산한다.
            Store burger = store("중앙상가 수제버거", MarketRegion.POHANG, "포항", "중앙상가", "수제버거",
                    "중앙상가 골목에서 5년째 운영 중인 수제버거 가게입니다.",
                    LocalDate.of(2021, 6, 1), "KRW", "burger", Profile.BURGER);
            active(burger, "매장 리모델링과 키오스크 도입", "좌석을 늘리고 주문 키오스크를 들여 점심 회전율을 높입니다.",
                    32_000_000L, 8, "투자자 인증하면 감자튀김 무료, 정산일엔 음료 1+1", 500_000L, 46, 60);

            // 3. 모집 중(30%): 외국인 사장님의 쌀국수집 2호점
            Store pho = store("양덕 쌀국수", MarketRegion.POHANG, "포항", "양덕동", "베트남 쌀국수",
                    "베트남 출신 사장님이 직접 육수를 내는 쌀국수집입니다. 2호점을 준비하고 있습니다.",
                    LocalDate.of(2024, 3, 1), "KRW", "pho", Profile.PHO);
            recruiting(pho, "2호점 주방 공사", "양덕 2호점 주방 공사와 육수 설비 마련에 씁니다.",
                    18_000_000L, 5_400_000L, 20, "투자자 인증하면 짜조(튀김 만두) 2개 서비스", 106, 15);

            // 4. 심사 중: 최근 3개월 매출이 갑자기 늘어 모집 심사가 보류된 분식집
            Store bunsik = storeRepository.save(new Store("한동대 앞 분식", MarketRegion.POHANG, "포항", "흥해읍 한동대 앞",
                    "분식", "학생 손님이 많은 분식집입니다. 배달 주방 확장을 위해 모집을 신청했습니다.",
                    BusinessType.SOLE_PROPRIETOR, LocalDate.of(2023, 3, 1), "KRW", "bunsik"));
            saveRevenues(bunsik, revenueGenerator.inflateRecent(
                    revenueGenerator.generate(Profile.BUNSIK, lastSeedMonth, HISTORY_MONTHS), 3, 1.45));
            offeringRepository.save(new Offering(bunsik, "배달 전용 주방 확장",
                    "배달 주문을 따로 받는 주방을 만들어 저녁 매출을 늘립니다.",
                    15_000_000L, SHARE_RATE, CAP_MULTIPLE, TERM_MONTHS, today.plusDays(30), OfferingStatus.REVIEW,
                    "투자자 인증하면 튀김 3개 추가"));

            // 5~7. 포항 지급 중 가게
            Store mulhoe = store("죽도시장 물회", MarketRegion.POHANG, "포항", "죽도시장", "물회",
                    "죽도시장 어판장 옆에서 17년째 물회를 말아 온 집입니다. 여름 성수기 줄이 가장 긴 가게입니다.",
                    LocalDate.of(2009, 5, 1), "KRW", "mulhoe", Profile.MULHOE);
            active(mulhoe, "활어 냉장 설비와 2층 좌석", "여름 대기 손님을 받을 2층 좌석과 활어 냉장 설비를 마련합니다.",
                    25_000_000L, 14, "투자자 인증하면 물회 곱빼기 무료", 200_000L, 121, 70);

            Store brunch = store("영일대 브런치 카페", MarketRegion.POHANG, "포항", "영일대 해수욕장", "브런치 카페",
                    "영일대 바다가 보이는 2층 브런치 카페입니다. 주말 오전 손님이 많습니다.",
                    LocalDate.of(2023, 4, 1), "KRW", "brunch", Profile.BRUNCH);
            active(brunch, "오븐 교체와 바다 쪽 테라스", "베이킹 오븐을 바꾸고 바다 쪽 테라스를 엽니다.",
                    18_000_000L, 5, "투자자 인증하면 아메리카노 1잔 무료", 0L, 191, 45);

            // 8. 국내 확장: 서울
            Store bagel = store("성수 베이글", MarketRegion.DOMESTIC, "서울", "성수동", "베이글",
                    "성수동 골목에서 매일 새벽 베이글을 굽는 가게입니다. 문 열기 전부터 줄이 생깁니다.",
                    LocalDate.of(2022, 9, 1), "KRW", "bagel", Profile.BAGEL);
            active(bagel, "2호점 오븐과 반죽 설비", "성수 2호점에 들어갈 데크 오븐과 반죽기를 삽니다.",
                    30_000_000L, 11, "투자자 인증하면 크림치즈 추가 무료", 100_000L, 236, 80);

            // 9~11. 해외 확장 예시 (매출과 지급은 원화로 환산해 기록)
            Store sushi = store("스시 카이", MarketRegion.OVERSEAS, "도쿄", "시부야", "스시 오마카세",
                    "도쿄 시부야의 10석 카운터 스시집입니다. 한국인 손님 비중이 30%까지 늘었습니다.",
                    LocalDate.of(2019, 11, 1), "JPY", "sushi", Profile.SUSHI);
            active(sushi, "카운터 6석 증설", "예약 대기를 줄이려 카운터 6석과 숙성고를 늘립니다.",
                    50_000_000L, 6, "투자자 인증하면 디저트 한 접시 서비스 (도쿄 방문 시)", 300_000L, 316, 140);

            // 팟타이: 마지막 달 카드 결제 비중이 갑자기 떨어져 다음 정산이 보류된 상태로 시작한다.
            Store padthai = storeRepository.save(new Store("팟타이 사왓디", MarketRegion.OVERSEAS, "방콕", "실롬",
                    "태국 팟타이", "방콕 실롬 야시장에서 시작한 팟타이 가게입니다. 현금으로 내는 손님이 많습니다.",
                    BusinessType.CORPORATION, LocalDate.of(2021, 1, 1), "THB", "padthai"));
            saveRevenues(padthai, revenueGenerator.lowerLastCardRatio(
                    revenueGenerator.generate(Profile.PADTHAI, lastSeedMonth, HISTORY_MONTHS), 0.41));
            active(padthai, "야시장 푸드트럭 2대", "야시장 푸드트럭 2대를 더 들여 판매 거점을 늘립니다.",
                    15_000_000L, 9, "투자자 인증하면 타이 아이스티 무료", 0L, 136, 50);

            Store bistro = store("비스트로 르방", MarketRegion.OVERSEAS, "파리", "마레", "프렌치 비스트로",
                    "파리 마레 지구의 프렌치 비스트로입니다. 저녁 코스 예약이 꾸준합니다.",
                    LocalDate.of(2020, 2, 1), "EUR", "bistro", Profile.BISTRO);
            active(bistro, "와인 셀러와 주방 리뉴얼", "와인 셀러를 들이고 주방 동선을 바꿔 저녁 회전을 늘립니다.",
                    40_000_000L, 2, "투자자 인증하면 하우스 와인 1잔", 0L, 186, 110);

            // 12. 모집 중(55%): 경주 한옥 찻집 (포항 옆 국내 확장)
            Store hanok = store("황리단길 한옥 찻집", MarketRegion.DOMESTIC, "경주", "황리단길", "전통 찻집",
                    "경주 황리단길 한옥을 고친 찻집입니다. 두 번째 한옥을 고쳐 2호점을 엽니다.",
                    LocalDate.of(2024, 5, 1), "KRW", "hanok", Profile.HANOK_TEA);
            recruiting(hanok, "2호점 한옥 수리", "황리단길 두 번째 한옥을 고쳐 찻집 2호점을 엽니다.",
                    15_000_000L, 8_200_000L, 14, "투자자 인증하면 다과 세트 무료", 296, 30);
        }

        private Store store(String name, MarketRegion region, String city, String area, String category,
                            String description, LocalDate openedOn, String currency, String imageKey,
                            Profile profile) {
            Store store = storeRepository.save(new Store(name, region, city, area, category, description,
                    BusinessType.CORPORATION, openedOn, currency, imageKey));
            saveRevenues(store, revenueGenerator.generate(profile, lastSeedMonth, HISTORY_MONTHS));
            return store;
        }

        private void recruiting(Store store, String title, String purpose, long target, long raised, int daysLeft,
                                String perk, int crowdFrom, int crowdCount) {
            Offering offering = offeringRepository.save(new Offering(store, title, purpose, target, SHARE_RATE,
                    CAP_MULTIPLE, TERM_MONTHS, today.plusDays(daysLeft), OfferingStatus.RECRUITING, perk));
            investCrowd(offering, pick(crowdFrom, crowdCount), raised, LocalDateTime.now(clock).minusDays(20));
        }

        /**
         * 모집을 끝내고 monthsPaying 개월 전부터 지급 중인 상품을 만든다. 시드 마지막 달 직전까지 정산해 둔다.
         * (시드 매출은 정상 범위로 검증된 값이라 확인 플래그를 켠다. 시작할 때 보류로 실패하지 않게 하기 위함)
         */
        private void active(Store store, String title, String purpose, long target, int monthsPaying, String perk,
                            long myAmount, int crowdFrom, int crowdCount) {
            YearMonth payoutStart = lastSeedMonth.minusMonths(monthsPaying);
            YearMonth recruitMonth = payoutStart.minusMonths(1);
            Offering offering = offeringRepository.save(new Offering(store, title, purpose, target, SHARE_RATE,
                    CAP_MULTIPLE, TERM_MONTHS, recruitMonth.atEndOfMonth(), OfferingStatus.RECRUITING, perk));
            if (myAmount > 0) {
                invest(offering, me, myAmount, recruitMonth.atDay(12).atTime(20, 15));
            }
            investCrowd(offering, pick(crowdFrom, crowdCount), target - myAmount, recruitMonth.atDay(1).atTime(9, 0));
            offering.startPayout(payoutStart);
            for (YearMonth month = payoutStart; month.isBefore(lastSeedMonth); month = month.plusMonths(1)) {
                settlementService.settle(offering.getId(), new SettlementRequest(month.toString(), true));
            }
        }

        /** 투자자 풀에서 from 번째부터 count 명을 고른다. 끝에 닿으면 처음으로 돌아간다. */
        private List<Investor> pick(int from, int count) {
            List<Investor> picked = new ArrayList<>(count);
            for (int i = 0; i < count; i++) {
                picked.add(crowd.get((from + i) % crowd.size()));
            }
            return picked;
        }

        private void investCrowd(Offering offering, List<Investor> investors, long total, LocalDateTime base) {
            List<Long> amounts = splitAmount(total, investors.size(), random);
            for (int i = 0; i < investors.size(); i++) {
                invest(offering, investors.get(i), amounts.get(i), base.plusHours(i * 3L));
            }
        }
    }

    private void saveRevenues(Store store, List<RevenuePoint> points) {
        revenueRepository.saveAll(points.stream()
                .map(point -> new MonthlyRevenue(store, point.month(), point.reportedRevenue(), point.cardRevenue()))
                .toList());
    }

    private void invest(Offering offering, Investor investor, long amount, LocalDateTime investedAt) {
        offering.acceptInvestment(amount);
        investmentRepository.save(new Investment(offering, investor, amount, investedAt));
    }

    /** 총액을 1만 원 단위로 나눈다. 1인 최소 10만 원, 최대 500만 원. */
    static List<Long> splitAmount(long total, int count, Random random) {
        long units = total / 10_000L;
        long[] parts = new long[count];
        long remaining = units - 10L * count;
        if (remaining < 0) {
            throw new IllegalArgumentException("총액이 인원 × 10만 원보다 작습니다.");
        }
        for (int i = 0; i < count; i++) {
            parts[i] = 10L;
        }
        while (remaining > 0) {
            int index = random.nextInt(count);
            long add = Math.min(remaining, 1 + random.nextInt(12));
            if (parts[index] + add <= 500L) {
                parts[index] += add;
                remaining -= add;
            }
        }
        List<Long> amounts = new ArrayList<>(count);
        for (long part : parts) {
            amounts.add(part * 10_000L);
        }
        return amounts;
    }
}
