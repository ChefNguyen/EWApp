package com.ewa.modules.utility;

import com.ewa.modules.utility.dto.BillPayRequest;
import com.ewa.modules.utility.dto.BillPayResponse;
import com.ewa.modules.utility.dto.BillQueryRequest;
import com.ewa.modules.utility.dto.BillQueryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillPaymentController {

    private final UtilityPaymentService utilityPaymentService;

    /**
     * POST /api/bills/query
     * Looks up a utility bill by service type and customer ID.
     */
    @PostMapping("/query")
    public ResponseEntity<BillQueryResponse> queryBill(@Valid @RequestBody BillQueryRequest request) {
        BillQueryResponse response = utilityPaymentService.queryBill(request);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/bills/pay
     * Pays a utility bill identified by the billKey from a prior query.
     * Idempotent – duplicate payment returns failure.
     */
    @PostMapping("/pay")
    public ResponseEntity<BillPayResponse> payBill(@Valid @RequestBody BillPayRequest request) {
        BillPayResponse response = utilityPaymentService.payBill(request);
        return ResponseEntity.ok(response);
    }
}
