package com.tablestake.store;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "store")
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MarketRegion region;

    /** 도시 (예: 포항, 서울, 도쿄) */
    @Column(nullable = false, length = 30)
    private String city;

    /** 도시 안의 동네 (예: 중앙상가, 시부야) */
    @Column(nullable = false, length = 50)
    private String area;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, length = 300)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BusinessType businessType;

    @Column(nullable = false)
    private LocalDate openedOn;

    /** 현지 매출 통화 (KRW, JPY ...). 매출과 지급은 원화로 환산해 기록한다. */
    @Column(nullable = false, length = 3)
    private String currency;

    /** 앱에 쓰는 대표 사진 이름. 프론트엔드 public/photos/{imageKey}.jpg */
    @Column(nullable = false, length = 40)
    private String imageKey;

    protected Store() {
    }

    public Store(String name, MarketRegion region, String city, String area, String category, String description,
                 BusinessType businessType, LocalDate openedOn, String currency, String imageKey) {
        this.name = name;
        this.region = region;
        this.city = city;
        this.area = area;
        this.category = category;
        this.description = description;
        this.businessType = businessType;
        this.openedOn = openedOn;
        this.currency = currency;
        this.imageKey = imageKey;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public MarketRegion getRegion() {
        return region;
    }

    public String getCity() {
        return city;
    }

    public String getArea() {
        return area;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public BusinessType getBusinessType() {
        return businessType;
    }

    public LocalDate getOpenedOn() {
        return openedOn;
    }

    public String getCurrency() {
        return currency;
    }

    public String getImageKey() {
        return imageKey;
    }
}
