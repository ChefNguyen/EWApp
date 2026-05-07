package com.ewa.modules.utility;

import com.ewa.modules.utility.dto.TopupRequest;
import com.ewa.modules.utility.dto.TopupResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/topup")
@RequiredArgsConstructor
public class TopupController {

    private final UtilityPaymentService utilityPaymentService;

    /**
     * POST /api/topup
     * Top up a mobile phone number using employee's available wage limit.
     */
    @PostMapping
    public ResponseEntity<TopupResponse> topupPhone(@Valid @RequestBody TopupRequest request) {
        TopupResponse response = utilityPaymentService.topupPhone(request);
        return ResponseEntity.ok(response);
    }
}
