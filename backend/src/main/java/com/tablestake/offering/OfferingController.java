package com.tablestake.offering;

import com.tablestake.offering.dto.OfferingDetailResponse;
import com.tablestake.offering.dto.OfferingSummaryResponse;
import com.tablestake.offering.dto.SimulationResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/offerings")
public class OfferingController {

    private final OfferingService offeringService;

    public OfferingController(OfferingService offeringService) {
        this.offeringService = offeringService;
    }

    @GetMapping
    public List<OfferingSummaryResponse> getOfferings(
            @RequestParam(name = "status", required = false) OfferingStatus status) {
        return offeringService.getOfferings(status);
    }

    @GetMapping("/{offeringId}")
    public OfferingDetailResponse getOffering(@PathVariable("offeringId") Long offeringId) {
        return offeringService.getOffering(offeringId);
    }

    @GetMapping("/{offeringId}/simulation")
    public SimulationResponse simulate(@PathVariable("offeringId") Long offeringId,
                                       @RequestParam(name = "amount") long amount) {
        return offeringService.simulate(offeringId, amount);
    }
}
