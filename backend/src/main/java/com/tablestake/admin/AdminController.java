package com.tablestake.admin;

import com.tablestake.admin.dto.RevenueBoardResponse;
import com.tablestake.admin.dto.RevenueRegisterRequest;
import com.tablestake.admin.dto.RevenueRegisterResponse;
import com.tablestake.admin.dto.StoreOverviewResponse;
import com.tablestake.settlement.SettlementService;
import com.tablestake.settlement.dto.SettlementBoardResponse;
import com.tablestake.settlement.dto.SettlementRequest;
import com.tablestake.settlement.dto.SettlementResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 운영 콘솔 API. 데모라 인증 없이 열어 두었다.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final RevenueAdminService revenueAdminService;
    private final SettlementService settlementService;

    public AdminController(RevenueAdminService revenueAdminService, SettlementService settlementService) {
        this.revenueAdminService = revenueAdminService;
        this.settlementService = settlementService;
    }

    @GetMapping("/stores")
    public List<StoreOverviewResponse> getStores() {
        return revenueAdminService.getStores();
    }

    @GetMapping("/stores/{storeId}/revenues")
    public RevenueBoardResponse getRevenueBoard(@PathVariable("storeId") Long storeId) {
        return revenueAdminService.getRevenueBoard(storeId);
    }

    @PostMapping("/stores/{storeId}/revenues")
    public ResponseEntity<RevenueRegisterResponse> registerRevenue(@PathVariable("storeId") Long storeId,
                                                                   @Valid @RequestBody RevenueRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(revenueAdminService.registerRevenue(storeId, request));
    }

    @GetMapping("/offerings/{offeringId}/settlements")
    public SettlementBoardResponse getSettlementBoard(@PathVariable("offeringId") Long offeringId) {
        return settlementService.getBoard(offeringId);
    }

    @PostMapping("/offerings/{offeringId}/settlements")
    public ResponseEntity<SettlementResponse> settle(@PathVariable("offeringId") Long offeringId,
                                                     @Valid @RequestBody SettlementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(settlementService.settle(offeringId, request));
    }

    @GetMapping("/settlements/{settlementId}")
    public SettlementResponse getSettlement(@PathVariable("settlementId") Long settlementId) {
        return settlementService.getSettlement(settlementId);
    }
}
