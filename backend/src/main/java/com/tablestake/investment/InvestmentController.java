package com.tablestake.investment;

import com.tablestake.investment.dto.InvestmentRequest;
import com.tablestake.investment.dto.InvestmentResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/offerings/{offeringId}/investments")
public class InvestmentController {

    private final InvestmentService investmentService;

    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    @PostMapping
    public ResponseEntity<InvestmentResponse> invest(@PathVariable("offeringId") Long offeringId,
                                                     @Valid @RequestBody InvestmentRequest request) {
        InvestmentResponse response = investmentService.invest(offeringId, request.amount());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
