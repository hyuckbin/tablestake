package com.tablestake.demo;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 서버가 뜨면 데모 데이터를 만든다(H2 메모리 DB라 재시작하면 초기 상태로 돌아간다).
 */
@Component
public class DemoDataInitializer implements ApplicationRunner {

    private final DemoDataService demoDataService;

    public DemoDataInitializer(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    @Override
    public void run(ApplicationArguments args) {
        demoDataService.reset();
    }
}
