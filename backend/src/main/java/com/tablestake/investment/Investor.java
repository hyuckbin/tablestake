package com.tablestake.investment;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * 투자자. 데모에서는 로그인 대신 demoUser가 true인 투자자를 '나'로 쓴다.
 */
@Entity
@Table(name = "investor")
public class Investor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String nickname;

    @Column(nullable = false)
    private boolean demoUser;

    protected Investor() {
    }

    public Investor(String nickname, boolean demoUser) {
        this.nickname = nickname;
        this.demoUser = demoUser;
    }

    public Long getId() {
        return id;
    }

    public String getNickname() {
        return nickname;
    }

    public boolean isDemoUser() {
        return demoUser;
    }
}
