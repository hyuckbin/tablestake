package com.tablestake.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final DemoDataService demoDataService;

    public DemoController(DemoDataService demoDataService) {
        this.demoDataService = demoDataService;
    }

    /** 발표 리허설 후 처음 상태로 되돌린다. */
    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> reset() {
        demoDataService.reset();
        return ResponseEntity.ok(Map.of("message", "데모 데이터를 초기화했습니다."));
    }
}
